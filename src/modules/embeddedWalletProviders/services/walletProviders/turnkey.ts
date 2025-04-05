import {
  createPasskey,
  PasskeyStamper,
  isSupported,
} from '@turnkey/react-native-passkey-stamper';
import {TurnkeyClient} from '@turnkey/http';
import {TURNKEY_BASE_URL, TURNKEY_RP_ID, TURNKEY_RP_NAME, TURNKEY_ORGANIZATION_ID} from '@env';

let turnkeyClient: TurnkeyClient | null = null;
let stamper: PasskeyStamper | null = null;

/**
 * Initialize the Turnkey client.
 * Should be called before using any Turnkey functionality.
 */
export function initTurnkeyClient() {
  if (turnkeyClient) return turnkeyClient;
  
  try {
    // Create a PasskeyStamper for authentication
    stamper = new PasskeyStamper({
      rpId: TURNKEY_RP_ID,
    });
    
    // Initialize the Turnkey client
    turnkeyClient = new TurnkeyClient(
      { baseUrl: TURNKEY_BASE_URL },
      stamper
    );
    
    console.log('Turnkey client initialized successfully');
    return turnkeyClient;
  } catch (error) {
    console.error('Failed to initialize Turnkey client:', error);
    throw error;
  }
}

/**
 * Get the previously initialized Turnkey client.
 * If the client was never initialized, this throws an error.
 */
export function getTurnkeyClient() {
  if (!turnkeyClient) {
    throw new Error('Turnkey client not initialized. Call initTurnkeyClient first.');
  }
  return turnkeyClient;
}

/**
 * Get the Turnkey stamper for authentication.
 */
export function getTurnkeyStamper() {
  if (!stamper) {
    throw new Error('Turnkey stamper not initialized. Call initTurnkeyClient first.');
  }
  return stamper;
}

/**
 * Check if Turnkey passkey authentication is supported on this device.
 */
export function isTurnkeySupported(): boolean {
  return isSupported();
}

/**
 * Create a new passkey for authentication.
 * @param username Optional username to associate with the passkey
 */
export async function createTurnkeyPasskey(username: string = 'Anonymous User') {
  if (!isSupported()) {
    throw new Error('Passkeys are not supported on this device');
  }
  
  try {
    const authenticatorParams = await createPasskey({
      authenticatorName: "Solana App Kit Passkey",
      rp: {
        id: TURNKEY_RP_ID,
        name: TURNKEY_RP_NAME,
      },
      user: {
        id: String(Date.now()),
        name: username,
        displayName: username,
      },
    });
    
    return authenticatorParams;
  } catch (error) {
    console.error('Failed to create passkey:', error);
    throw error;
  }
}

/**
 * Utility function to check if a wallet is a Turnkey wallet
 */
export function isTurnkeyWallet(wallet: any): boolean {
  if (!wallet) return false;
  
  return wallet.provider === 'turnkey';
}

export async function handleTurnkeyConnect(
  onWalletConnected?: (info: {provider: 'turnkey'; address: string}) => void,
  setStatusMessage?: (msg: string) => void,
) {
  setStatusMessage?.('Connecting with Turnkey...');
  try {
    const authenticatorParams = await createPasskey({
      authenticatorName: 'End-User Passkey',
      rp: {
        id: TURNKEY_RP_ID,
        name: TURNKEY_RP_NAME,
      },
      user: {
        id: String(Date.now()), // Unique user ID for demo
        name: 'Demo User',
        displayName: 'Demo User',
      },
    });
    console.log('Turnkey authenticator parameters:', authenticatorParams);

    const stamper = new PasskeyStamper({
      rpId: TURNKEY_RP_ID,
    });
    const turnkeyClient = new TurnkeyClient(
      {baseUrl: TURNKEY_BASE_URL},
      stamper,
    );

    setStatusMessage?.('Turnkey login flow initiated successfully.');

    onWalletConnected?.({
      provider: 'turnkey',
      address: String(Date.now()),
    });
  } catch (error: any) {
    console.error('Turnkey login error:', error);
    setStatusMessage?.(`Turnkey login failed: ${error.message}`);
    throw error;
  }
}
