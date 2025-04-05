import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { PublicKey } from '@solana/web3.js';
import { useCustomization } from '../../../CustomizationProvider';
import { 
  getTurnkeyClient, 
  getTurnkeyStamper, 
  initTurnkeyClient, 
  createTurnkeyPasskey, 
  isTurnkeySupported 
} from '../services/walletProviders/turnkey';
import { LoginMethod, WalletMonitorParams } from '../types';
import { SERVER_URL } from '@env';

const SERVER_BASE_URL = SERVER_URL;

export function useTurnkeyWalletLogic() {
  const [user, setUser] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentialBundle, setCredentialBundle] = useState<string | null>(null);

  // Get Turnkey config from customization provider
  const {
    auth: { turnkey: turnkeyConfig },
  } = useCustomization();

  // Assert the type with required properties
  const config = turnkeyConfig as {
    baseUrl: string;
    organizationId: string;
    rpId: string;
    rpName: string;
  };

  // Initialize client on first render
  useEffect(() => {
    try {
      initTurnkeyClient();
    } catch (e) {
      console.error('Failed to initialize Turnkey client:', e);
    }
  }, []);

  // Function to create or monitor an existing Turnkey wallet
  const monitorTurnkeyWallet = useCallback(
    async ({
      setStatusMessage,
      onWalletConnected,
    }: WalletMonitorParams) => {
      try {
        if (!credentialBundle) {
          setStatusMessage?.('No active Turnkey session');
          return;
        }

        // If we have a wallet address already, return it
        if (walletAddress) {
          setStatusMessage?.(`Connected to wallet: ${walletAddress}`);
          onWalletConnected?.({
            provider: 'turnkey' as const,
            address: walletAddress,
          });
          return;
        }

        // Otherwise, try to get wallet info from Turnkey
        setStatusMessage?.('Getting wallet from Turnkey...');
        const client = getTurnkeyClient();

        try {
          // Query for wallet accounts
          const result = await client.getWallets({
            organizationId: config.organizationId,
            type: 'ACTIVITY_TYPE_GET_WALLETS',
            timestampMs: Date.now().toString(),
          } as any);

          // Check if there are any wallets
          const wallets = (result as any).activity.result.getWalletsResult?.wallets || [];
          
          if (wallets.length > 0) {
            // Find a Solana wallet if available
            const solanaWallet = wallets.find((wallet: any) => 
              wallet.accounts.some((account: any) => account.chainType === 'CHAIN_TYPE_SOLANA')
            );

            if (solanaWallet) {
              const account = solanaWallet.accounts.find((acc: any) => acc.chainType === 'CHAIN_TYPE_SOLANA');
              if (account && account.address) {
                setWalletAddress(account.address);
                setStatusMessage?.(`Connected to wallet: ${account.address}`);
                onWalletConnected?.({
                  provider: 'turnkey' as const,
                  address: account.address,
                });
                return;
              }
            }
          }

          // If no wallets or no Solana account found, create one
          setStatusMessage?.('No wallet found, creating new wallet...');
          
          // Code to create a new wallet would go here
          // This would involve calling the Turnkey API to create a new wallet
          
          // For now, just log an error
          setStatusMessage?.('Wallet creation not implemented yet');
          
        } catch (error) {
          console.error('Error getting wallets from Turnkey:', error);
          setStatusMessage?.(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Turnkey wallet monitoring error:', error);
        setStatusMessage?.(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    [walletAddress, credentialBundle, config.organizationId]
  );

  // Function to handle OTP login
  const handleTurnkeyOtpLogin = useCallback(
    async ({
      loginMethod = 'email',
      contact,
      setStatusMessage,
      onSuccess,
    }: {
      loginMethod: 'email' | 'sms';
      contact: string;
      setStatusMessage?: (msg: string) => void;
      onSuccess?: (info: { provider: 'turnkey'; address: string }) => void;
    }) => {
      try {
        
        // ORIGINAL CODE COMMENTED OUT UNTIL BACKEND IS READY
        // Send OTP initiation request to backend
        const otpType = loginMethod === 'email' ? 'OTP_TYPE_EMAIL' : 'OTP_TYPE_SMS';
        
        const initResponse = await fetch(`${SERVER_BASE_URL}/api/auth/initOtpAuth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otpType, contact }),
        });
        
        if (!initResponse.ok) {
          throw new Error(`Failed to initiate OTP: ${initResponse.statusText}`);
        }
        
        const initData = await initResponse.json();
        
        if (!initData.otpId || !initData.organizationId) {
          throw new Error('Invalid OTP initialization response');
        }
        
        setStatusMessage?.(`OTP sent via ${loginMethod}. Please check your ${loginMethod} and enter the code.`);
        
        // At this point, we would typically show an OTP entry UI
        // We can create a modal or navigate to an OTP entry screen
        
        Alert.alert(
          'OTP Verification',
          `Please check your ${loginMethod} for a verification code and enter it below:`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Submit',
              onPress: async (otpCode) => {
                if (!otpCode) {
                  setStatusMessage?.('OTP code is required');
                  return;
                }
                
                try {
                  // Create a new public key for the target
                  const client = getTurnkeyClient();
                  const stamper = getTurnkeyStamper();
                  
                  // This is just placeholder code - in a real implementation, we'd need to create
                  // an embedded key or generate a keypair for Turnkey to use
                  const keyPair = PublicKey.unique();
                  const targetPublicKey = keyPair.toBase58();
                  
                  // Complete the OTP authentication process
                  const completeResponse = await fetch(`${SERVER_BASE_URL}/api/auth/otpAuth`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      otpId: initData.otpId,
                      otpCode,
                      organizationId: initData.organizationId,
                      targetPublicKey,
                      expirationSeconds: '86400', // 24 hours
                    }),
                  });
                  
                  if (!completeResponse.ok) {
                    throw new Error(`Failed to verify OTP: ${completeResponse.statusText}`);
                  }
                  
                  const completeData = await completeResponse.json();
                  
                  if (!completeData.credentialBundle) {
                    throw new Error('Invalid OTP verification response');
                  }
                  
                  // Store the credential bundle
                  setCredentialBundle(completeData.credentialBundle);
                  setIsAuthenticated(true);
                  
                  // After successful auth, monitor wallet to get address
                  await monitorTurnkeyWallet({
                    setStatusMessage,
                    onWalletConnected: onSuccess as any,
                  });
                } catch (verifyError) {
                  console.error('OTP verification error:', verifyError);
                  setStatusMessage?.(`OTP verification failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`);
                }
              },
            },
          ],
          { cancelable: false } as any
        );
      } catch (error) {
        console.error('Turnkey OTP login error:', error);
        setStatusMessage?.(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
    [monitorTurnkeyWallet]
  );

  // Function to handle passkey login/signup
  const handleTurnkeyPasskeyLogin = useCallback(
    async ({
      isSignUp = false,
      setStatusMessage,
      onSuccess,
    }: {
      isSignUp?: boolean;
      setStatusMessage?: (msg: string) => void;
      onSuccess?: (info: { provider: 'turnkey'; address: string }) => void;
    }) => {
      try {
        if (!isTurnkeySupported()) {
          setStatusMessage?.('Passkey authentication is not supported on this device');
          return;
        }
        
        setStatusMessage?.(`Initializing passkey ${isSignUp ? 'registration' : 'authentication'}...`);
        
        if (isSignUp) {
          // Create a new passkey
          const passkeyParams = await createTurnkeyPasskey();
          
          // Register passkey with backend
          const response = await fetch(`${SERVER_BASE_URL}/api/auth/createSubOrg`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              passkey: {
                challenge: passkeyParams.challenge,
                attestation: passkeyParams.attestation,
              },
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to register passkey: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (!data.subOrganizationId) {
            throw new Error('Invalid passkey registration response');
          }
          
          setStatusMessage?.('Passkey registered successfully. Initiating session...');
        }
        
        // Authenticate with passkey
        const client = getTurnkeyClient();
        const stamper = getTurnkeyStamper();
        
        // Generate a public key for the target
        const keyPair = PublicKey.unique();
        const targetPublicKey = keyPair.toBase58();
        
        // Create a session
        const sessionResponse = await client.createReadWriteSession({
          type: 'ACTIVITY_TYPE_CREATE_READ_WRITE_SESSION_V2',
          timestampMs: Date.now().toString(),
          organizationId: config.organizationId,
          parameters: {
            targetPublicKey,
          },
        } as any);
        
        const bundle = sessionResponse.activity.result.createReadWriteSessionResultV2?.credentialBundle;
        
        if (!bundle) {
          throw new Error('Failed to create session');
        }
        
        setCredentialBundle(bundle);
        setIsAuthenticated(true);
        setStatusMessage?.('Passkey authentication successful');
        
        // After successful auth, monitor wallet to get address
        await monitorTurnkeyWallet({
          setStatusMessage,
          onWalletConnected: onSuccess as any,
        });
      } catch (error) {
        console.error('Turnkey passkey login error:', error);
        setStatusMessage?.(`Passkey authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    [monitorTurnkeyWallet, config.organizationId]
  );

  // Function to handle OAuth login
  const handleTurnkeyOAuthLogin = useCallback(
    async ({
      oidcToken,
      providerName,
      setStatusMessage,
      onSuccess,
    }: {
      oidcToken: string;
      providerName: string;
      setStatusMessage?: (msg: string) => void;
      onSuccess?: (info: { provider: 'turnkey'; address: string }) => void;
    }) => {
      try {
        setStatusMessage?.(`Authenticating with ${providerName}...`);
        
        // Generate a public key for the target
        const keyPair = PublicKey.unique();
        const targetPublicKey = keyPair.toBase58();
        
        // Send OAuth login request to backend
        const response = await fetch(`${SERVER_BASE_URL}/api/auth/oAuthLogin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oidcToken,
            providerName,
            targetPublicKey,
            expirationSeconds: '86400', // 24 hours
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to authenticate with ${providerName}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.credentialBundle) {
          throw new Error(`Invalid ${providerName} authentication response`);
        }
        
        setCredentialBundle(data.credentialBundle);
        setIsAuthenticated(true);
        setStatusMessage?.(`${providerName} authentication successful`);
        
        // After successful auth, monitor wallet to get address
        await monitorTurnkeyWallet({
          setStatusMessage,
          onWalletConnected: onSuccess as any,
        });
      } catch (error) {
        console.error('Turnkey OAuth login error:', error);
        setStatusMessage?.(`OAuth authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    [monitorTurnkeyWallet]
  );

  // Function to handle logout
  const handleTurnkeyLogout = useCallback(
    async (setStatusMessage?: (msg: string) => void) => {
      try {
        setStatusMessage?.('Logging out...');
        
        // Clear local state
        setUser(null);
        setWalletAddress(null);
        setIsAuthenticated(false);
        setCredentialBundle(null);
        
        setStatusMessage?.('Logged out successfully');
      } catch (error) {
        console.error('Turnkey logout error:', error);
        setStatusMessage?.(error instanceof Error ? error.message : 'Logout failed');
      }
    },
    []
  );

  return {
    user,
    walletAddress,
    isAuthenticated,
    handleTurnkeyOtpLogin,
    handleTurnkeyPasskeyLogin,
    handleTurnkeyOAuthLogin,
    handleTurnkeyLogout,
    monitorTurnkeyWallet,
  };
} 