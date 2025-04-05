import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { DEFAULT_SOLANA_ACCOUNTS, Turnkey } from '@turnkey/sdk-server';

// Load environment variables
dotenv.config();

// Set up Turnkey configuration from environment variables
let apiBaseUrl = process.env.TURNKEY_API_URL || '';

// Make sure the API URL is a complete URL
if (apiBaseUrl && !apiBaseUrl.startsWith('http')) {
  apiBaseUrl = 'https://' + apiBaseUrl;
}

const turnkeyConfig = {
  apiBaseUrl,
  defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID || '',
  apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY || '',
  apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY || '',
};

console.log('Initializing Turnkey with config:', {
  apiBaseUrl: turnkeyConfig.apiBaseUrl,
  defaultOrganizationId: turnkeyConfig.defaultOrganizationId,
  hasApiPublicKey: !!turnkeyConfig.apiPublicKey,
  hasApiPrivateKey: !!turnkeyConfig.apiPrivateKey
});

// Initialize Turnkey client
const turnkey = new Turnkey(turnkeyConfig).apiClient();

const router = express.Router();

/**
 * Get sub-organization ID based on filter criteria
 */
router.post('/getSubOrgId', async (req: any, res: any) => {
  try {
    const { filterType, filterValue } = req.body;
    console.log(`Getting sub-org ID with filterType: ${filterType}, filterValue: ${filterValue}`);
    
    const { organizationIds } = await turnkey.getSubOrgIds({
      filterType,
      filterValue,
    });

    return res.json({
      success: true,
      organizationId: organizationIds[0] || turnkeyConfig.defaultOrganizationId,
    });
  } catch (err: any) {
    console.error('Error getting sub-org ID:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Initialize OTP authentication
 */
router.post('/initOtpAuth', async (req: any, res: any) => {
  try {
    const {otpType, contact} = req.body;
    let organizationId = turnkeyConfig.defaultOrganizationId;
    console.log(`Initializing OTP auth with otpType: ${otpType}, contact: ${contact}`);
    console.log("Organization ID:", organizationId);
    
    try {
      // Check if user already exists
      console.log("Checking if user exists with filter:", {
        filterType: otpType === 'OTP_TYPE_EMAIL' ? 'EMAIL' : 'PHONE_NUMBER',
        filterValue: contact,
      });
      
      const {organizationIds} = await turnkey.getSubOrgIds({
        filterType: otpType === 'OTP_TYPE_EMAIL' ? 'EMAIL' : 'PHONE_NUMBER',
        filterValue: contact,
      });
      console.log("Found organization IDs:", organizationIds);
      
      if (organizationIds.length > 0) {
        organizationId = organizationIds[0];
      } else {
        // Create a new sub-organization if user doesn't exist
        console.log("User doesn't exist, creating sub-organization");
        const createSubOrgParams =
          otpType === 'OTP_TYPE_EMAIL' ? {email: contact} : {phone: contact};

        const subOrgResponse = await createSubOrg(createSubOrgParams);
        organizationId = subOrgResponse.subOrganizationId;
        console.log("Created sub-organization with ID:", organizationId);
      }
    } catch (error) {
      console.error("Error checking/creating user:", error);
      // Continue with default organization ID if we can't check or create user
      console.log("Using default organization ID:", organizationId);
    }

    // Initialize OTP authentication
    console.log("Initializing OTP with organization ID:", organizationId);
    const result = await turnkey.initOtpAuth({
      organizationId,
      otpType,
      contact,
    });

    console.log("OTP initialized successfully, otpId:", result.otpId);
    return res.json({
      success: true,
      otpId: result.otpId,
      organizationId,
    });
  } catch (err: any) {
    console.error('Error initializing OTP auth:', err);
    return res.status(500).json({success: false, error: err.message});
  }
});

/**
 * Verify OTP code and create session
 */
router.post('/otpAuth', async (req: any, res: any) => {
  try {
    const {
      otpId,
      otpCode,
      organizationId,
      targetPublicKey,
      expirationSeconds = '86400', // Default to 24 hours
      invalidateExisting = false,
    } = req.body;

    // Perform OTP authentication
    const result = await turnkey.otpAuth({
      otpId,
      otpCode,
      organizationId,
      targetPublicKey,
      expirationSeconds,
      invalidateExisting,
    });

    return res.json({
      success: true,
      credentialBundle: result.credentialBundle,
    });
  } catch (err: any) {
    console.error('Error completing OTP auth:', err);
    return res.status(500).json({success: false, error: err.message});
  }
});

/**
 * Authenticate with OAuth token
 */
router.post('/oAuthLogin', async (req: any, res: any) => {
  try {
    const {
      oidcToken,
      providerName,
      targetPublicKey,
      expirationSeconds = '86400',
    } = req.body;
    let organizationId = turnkeyConfig.defaultOrganizationId;

    // Check if user already exists
    const {organizationIds} = await turnkey.getSubOrgIds({
      filterType: 'OIDC_TOKEN',
      filterValue: oidcToken,
    });

    if (organizationIds.length > 0) {
      organizationId = organizationIds[0];
    } else {
      // Create a new sub-organization if user doesn't exist
      const subOrgResponse = await createSubOrg({
        oauth: {oidcToken, providerName},
      });
      organizationId = subOrgResponse.subOrganizationId;
    }

    // Create OAuth session
    const oauthResponse = await turnkey.oauth({
      organizationId,
      oidcToken,
      targetPublicKey,
      expirationSeconds,
    });

    return res.json({
      success: true,
      credentialBundle: oauthResponse.credentialBundle,
    });
  } catch (err: any) {
    console.error('Error during OAuth login:', err);
    return res.status(500).json({success: false, error: err.message});
  }
});

/**
 * Create a new sub-organization
 */
router.post('/createSubOrg', async (req: any, res: any) => {
  try {
    const result = await createSubOrg(req.body);
    return res.json({
      success: true,
      subOrganizationId: result.subOrganizationId,
    });
  } catch (err: any) {
    console.error('Error creating sub-organization:', err);
    return res.status(500).json({success: false, error: err.message});
  }
});

/**
 * Helper function to create a sub-organization
 */
async function createSubOrg(params: any) {
  const { email, phone, passkey, oauth } = params;

  const authenticators = passkey
    ? [
        {
          authenticatorName: 'Passkey',
          challenge: passkey.challenge,
          attestation: passkey.attestation,
        },
      ]
    : [];

  const oauthProviders = oauth
    ? [
        {
          providerName: oauth.providerName,
          oidcToken: oauth.oidcToken,
        },
      ]
    : [];

  let userEmail = email;

  if (oauth) {
    // Try to extract email from OIDC token
    const decoded = decodeJwt(oauth.oidcToken);
    if (decoded?.email) {
      userEmail = decoded.email;
    }
  }

  const userPhoneNumber = phone;
  const subOrganizationName = `Sub Org - ${email || phone || 'User'}`;
  const userName = userEmail ? userEmail.split('@')[0] || userEmail : 'user';

  // Create the sub-organization with Solana wallet
  const result = await turnkey.createSubOrganization({
    organizationId: turnkeyConfig.defaultOrganizationId,
    subOrganizationName,
    rootUsers: [
      {
        userName,
        userEmail,
        userPhoneNumber,
        oauthProviders,
        authenticators,
        apiKeys: [],
      },
    ],
    rootQuorumThreshold: 1,
    wallet: {
      walletName: 'Solana Wallet',
      accounts: DEFAULT_SOLANA_ACCOUNTS,
    },
  });

  return { subOrganizationId: result.subOrganizationId };
}

/**
 * Helper function to decode JWT token
 */
function decodeJwt(token: string) {
  try {
    // Simple parsing of JWT without verification
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export { router as turnkeyAuthRouter }; 