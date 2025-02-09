import {useState, useCallback, useEffect} from 'react';
import {createClient} from '@dynamic-labs/client';
import {ReactNativeExtension} from '@dynamic-labs/react-native-extension';
import {SolanaExtension} from '@dynamic-labs/solana-extension';
import { DYNAMIC_ENVIRONMENT_ID } from '@env';

// Read the environment variable (with a fallback for development)
const environmentId =DYNAMIC_ENVIRONMENT_ID || 'YOUR_DYNAMIC_ENVIRONMENT_ID';
const appLogoUrl = '';
const appName = 'Dynamic Demo';

// Create and extend the dynamic client with both the React Native and Solana extensions.
export const dynamicClient = createClient({
  environmentId,
  appLogoUrl,
  appName,
})
  .extend(ReactNativeExtension())
  .extend(SolanaExtension());

export function useDynamicWalletLogic() {
  const [user, setUser] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  // Poll for changes to the authenticated user.
  useEffect(() => {
    const interval = setInterval(() => {
      const authUser = dynamicClient.auth?.authenticatedUser;
      if (authUser && (!user || user.id !== authUser.userId)) {
        setUser(authUser);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Monitors (or creates) the embedded wallet.
  const monitorDynamicWallet = useCallback(
    async ({
      setStatusMessage,
      onWalletConnected,
    }: {
      setStatusMessage?: (msg: string) => void;
      onWalletConnected?: (info: {
        provider: 'dynamic';
        address: string;
      }) => void;
    }) => {
      try {
        // dynamicClient.wallets.userWallets is the array of wallets
        console.log('/////////////////wallets', dynamicClient.wallets.userWallets);
        const wallets = dynamicClient.wallets.userWallets;
        if (wallets && wallets.length > 0) {
          const addr = wallets[0].address;
          setStatusMessage?.(`Connected to existing wallet: ${addr}`);
          setWalletAddress(addr);
          onWalletConnected?.({provider: 'dynamic', address: addr});
        } else {
          // Create the embedded wallet if none exists.
          await dynamicClient.wallets.embedded.createWallet();
          const newWallets = dynamicClient.wallets.userWallets;
          if (newWallets && newWallets.length > 0) {
            const addr = newWallets[0].address;
            setStatusMessage?.(`Created wallet: ${addr}`);
            setWalletAddress(addr);
            onWalletConnected?.({provider: 'dynamic', address: addr});
          }
        }
      } catch (error: any) {
        setStatusMessage?.(`Wallet error: ${error.message}`);
      }
    },
    [],
  );

  // Handles the dynamic login flow by showing the Dynamic auth modal.
  const handleDynamicLogin = useCallback(
    async ({
      loginMethod = 'email',
      setStatusMessage,
    }: {
      loginMethod?: 'email' | 'sms' | 'google';
      setStatusMessage?: (msg: string) => void;
    }) => {
      try {
        setStatusMessage?.(`Connecting with Dynamic via ${loginMethod}...`);
        // Show the authentication modal.
        dynamicClient.ui.auth.show();
        // Poll until the user is authenticated (or time out).
        const maxWait = 15000;
        const pollInterval = 1000;
        let waited = 0;
        while (waited < maxWait) {
          if (dynamicClient.auth?.authenticatedUser) {
            setStatusMessage?.(
              `Connected user: ${dynamicClient.auth.authenticatedUser.userId}`,
            );
            setUser(dynamicClient.auth.authenticatedUser);
            // Optionally, automatically trigger wallet monitoring.
            await monitorDynamicWallet({
              setStatusMessage,
              onWalletConnected: () => {},
            });
            return;
          }
          await new Promise(res => setTimeout(res, pollInterval));
          waited += pollInterval;
        }
        setStatusMessage?.(`Dynamic login timed out.`);
      } catch (error: any) {
        setStatusMessage?.(`Connection failed: ${error.message}`);
        throw error;
      }
    },
    [monitorDynamicWallet],
  );

  // Handles logout for the dynamic provider.
  const handleDynamicLogout = useCallback(
    async (setStatusMessage?: (msg: string) => void) => {
      try {
        if (dynamicClient.auth.logout) {
          await dynamicClient.auth.logout();
        }
        setUser(null);
        setWalletAddress(null);
        setStatusMessage?.('Logged out successfully');
      } catch (error: any) {
        setStatusMessage?.(error.message || 'Logout failed');
      }
    },
    [],
  );

  return {
    user,
    walletAddress,
    handleDynamicLogin,
    handleDynamicLogout,
    monitorDynamicWallet,
    dynamicClient, // exposing the client in case it’s needed
  };
}
