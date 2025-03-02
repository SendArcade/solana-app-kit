import {useState, useCallback, useEffect} from 'react';
import {getDynamicClient} from '../services/walletProviders/dynamic';
import {useCustomization} from '../CustomizationProvider';

export function useDynamicWalletLogic() {
  const [user, setUser] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  // We can optionally read config if we need it for logging or additional customization
  const {
    auth: {dynamic: dynamicConfig},
  } = useCustomization();

  // Poll for changes to the authenticated user from the dynamic client
  useEffect(() => {
    const interval = setInterval(() => {
      let client: any;
      try {
        client = getDynamicClient();
      } catch {
        // Not initialized yet or not using dynamic
        return;
      }
      const authUser = client.auth?.authenticatedUser;
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
      let client: any;
      try {
        client = getDynamicClient();
      } catch (e) {
        setStatusMessage?.('Dynamic client not initialized');
        return;
      }

      try {
        const wallets = client.wallets.userWallets;
        if (wallets && wallets.length > 0) {
          const addr = wallets[0].address;
          setStatusMessage?.(`Connected to existing wallet: ${addr}`);
          setWalletAddress(addr);
          onWalletConnected?.({provider: 'dynamic', address: addr});
        } else {
          // Create the embedded wallet if none exists.
          await client.wallets.embedded.createWallet();
          const newWallets = client.wallets.userWallets;
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

  // Handles the dynamic login flow by showing the Dynamic auth modal
  const handleDynamicLogin = useCallback(
    async ({
      loginMethod = 'email',
      setStatusMessage,
    }: {
      loginMethod?: 'email' | 'sms' | 'google';
      setStatusMessage?: (msg: string) => void;
    }) => {
      let client: any;
      try {
        client = getDynamicClient();
      } catch (e) {
        setStatusMessage?.('Dynamic client not initialized');
        return;
      }

      try {
        setStatusMessage?.(`Connecting with Dynamic via ${loginMethod}...`);
        // Show the authentication modal.
        client.ui.auth.show();
        // Poll until the user is authenticated (or time out).
        const maxWait = 15000;
        const pollInterval = 1000;
        let waited = 0;
        while (waited < maxWait) {
          const authUser = client.auth?.authenticatedUser;
          if (authUser) {
            setStatusMessage?.(`Connected user: ${authUser.userId}`);
            setUser(authUser);
            // Optionally, automatically trigger wallet monitoring
            await monitorDynamicWallet({setStatusMessage});
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

  // Handles logout for the dynamic provider
  const handleDynamicLogout = useCallback(
    async (setStatusMessage?: (msg: string) => void) => {
      let client: any;
      try {
        client = getDynamicClient();
      } catch (e) {
        setStatusMessage?.('Dynamic client not initialized');
        return;
      }

      try {
        if (client.auth.logout) {
          await client.auth.logout();
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
  };
}
