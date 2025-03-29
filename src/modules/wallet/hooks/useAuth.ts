import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../../hooks/useReduxHooks';
import { useCustomization } from '../../../CustomizationProvider';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { 
  useLogin, 
  usePrivy, 
  useEmbeddedSolanaWallet, 
  useRecoverEmbeddedWallet,
  useLoginWithOAuth
} from '@privy-io/expo';
import { walletProviders } from '../providers';
import { loginSuccess, logoutSuccess } from '../state/authReducer';
import { WalletAdapter, WalletProviderType, LoginMethod } from '../types';

/**
 * Unified hook for authentication and wallet management
 */
export function useAuth() {
  const { auth: authConfig } = useCustomization();
  const selectedProvider = authConfig.provider as WalletProviderType;
  const dispatch = useDispatch();
  const navigation = useAppNavigation();
  const authState = useAppSelector(state => state.auth);

  // Privy hooks (conditional use)
  const privyHooks = {
    login: useLogin().login,
    user: usePrivy().user,
    isReady: usePrivy().isReady,
    logout: usePrivy().logout,
    solanaWallet: useEmbeddedSolanaWallet(),
    recover: useRecoverEmbeddedWallet().recover,
    oauthLogin: useLoginWithOAuth().login
  };

  // Initialize privy provider
  if (selectedProvider === 'privy') {
    const privyProvider = walletProviders.getProvider('privy');
    if (privyProvider && !privyProvider.wallet) {
      (privyProvider as any).initialize({
        login: privyHooks.login,
        logout: privyHooks.logout,
        solanaWallet: privyHooks.solanaWallet,
        oauthLogin: privyHooks.oauthLogin,
        recover: privyHooks.recover,
        user: privyHooks.user,
        isReady: privyHooks.isReady
      });
    }
  }

  // Make sure MWA provider is available on Android
  if (selectedProvider === 'mwa') {
    const mwaProvider = walletProviders.getProvider('mwa');
    if (mwaProvider && !(mwaProvider as any).isAvailable()) {
      console.warn('MWA provider is not available on this platform');
    }
  }

  // Backward compatibility: return solanaWallet for compatibility with old code
  const solanaWallet = privyHooks.solanaWallet || null;

  /**
   * Universal login method that works with any provider
   */
  const login = useCallback(async (
    loginMethod: LoginMethod, 
    setStatusMessage?: (msg: string) => void,
    onSuccess?: (info: { provider: WalletProviderType; address: string }) => void
  ) => {
    const provider = walletProviders.getProvider(selectedProvider);
    if (!provider) {
      throw new Error(`Provider ${selectedProvider} not found`);
    }

    try {
      // Call provider-specific login
      await provider.login({
        loginMethod,
        setStatusMessage,
        onSuccess: (result) => {
          // First update Redux state
          dispatch(loginSuccess({
            provider: result.provider,
            address: result.address,
            profilePicUrl: result.userInfo?.profilePicUrl,
            username: result.userInfo?.username,
            description: result.userInfo?.description
          }));

          // Then call onSuccess callback if provided
          if (onSuccess) {
            onSuccess(result);
          } else {
            // Navigate to MainTabs by default if no callback provided
            navigation.navigate('MainTabs');
          }
        },
        navigation
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [selectedProvider, dispatch, navigation]);

  /**
   * Login with Google
   */
  const loginWithGoogle = useCallback(async () => {
    return login('google', () => {}, (info) => {
      dispatch(loginSuccess({
        provider: info.provider,
        address: info.address
      }));
      navigation.navigate('MainTabs');
    });
  }, [login, dispatch, navigation]);

  /**
   * Login with Apple
   */
  const loginWithApple = useCallback(async () => {
    return login('apple', () => {}, (info) => {
      dispatch(loginSuccess({
        provider: info.provider,
        address: info.address
      }));
      navigation.navigate('MainTabs');
    });
  }, [login, dispatch, navigation]);

  /**
   * Login with Email
   */
  const loginWithEmail = useCallback(async () => {
    return login('email', () => {}, (info) => {
      dispatch(loginSuccess({
        provider: info.provider,
        address: info.address
      }));
      navigation.navigate('MainTabs');
    });
  }, [login, dispatch, navigation]);

  /**
   * Login with SMS
   */
  const loginWithSMS = useCallback(async () => {
    return login('sms', () => {}, (info) => {
      dispatch(loginSuccess({
        provider: info.provider,
        address: info.address
      }));
      navigation.navigate('MainTabs');
    });
  }, [login, dispatch, navigation]);

  /**
   * Connect with Mobile Wallet Adapter
   */
  const loginWithMWA = useCallback(async () => {
    const mwaProvider = walletProviders.getProvider('mwa');
    if (!mwaProvider) {
      throw new Error('MWA provider not found');
    }

    try {
      // Call MWA login
      await mwaProvider.login({
        loginMethod: 'wallet',
        setStatusMessage: () => {},
        onSuccess: (result) => {
          // First update Redux state
          dispatch(loginSuccess({
            provider: 'mwa',
            address: result.address
          }));

          // Navigate to MainTabs
          navigation.navigate('MainTabs');
        },
        navigation
      });
    } catch (error) {
      console.error('MWA login error:', error);
      throw error;
    }
  }, [dispatch, navigation]);

  /**
   * Universal logout method that works with any provider
   */
  const logout = useCallback(async () => {
    // Get current provider from auth state
    const currentProvider = authState.provider;
    if (!currentProvider) {
      dispatch(logoutSuccess());
      return;
    }

    const provider = walletProviders.getProvider(currentProvider);
    if (provider) {
      try {
        await provider.logout(() => {});
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    // Always dispatch logout success regardless of provider
    dispatch(logoutSuccess());
  }, [authState.provider, dispatch]);

  // Current status
  const status = authState.isLoggedIn ? 'authenticated' : '';

  // Get the wallet adapter if available
  let wallet: WalletAdapter | null = null;
  const currentProvider = walletProviders.getProvider(authState.provider as WalletProviderType);
  if (currentProvider) {
    wallet = currentProvider.wallet;
  }

  return {
    status,
    loginWithGoogle,
    loginWithApple,
    loginWithEmail,
    loginWithSMS,
    loginWithMWA,
    logout,
    user: authState.isLoggedIn ? { id: authState.address } : null,
    solanaWallet,  // For backward compatibility
    wallet,        // New standardized wallet
  };
}

export default useAuth; 