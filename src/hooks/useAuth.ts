// File: /src/hooks/useAuth.ts
import {useCallback, useState} from 'react';
import {useDispatch} from 'react-redux';
import {loginSuccess, logoutSuccess} from '../state/auth/reducer';
import {usePrivyWalletLogic} from '../services/walletProviders/privy';
import {useDynamicWalletLogic} from '../services/walletProviders/dynamic';

export type AuthProvider = 'privy' | 'dynamic' | 'turnkey';

export function useAuth(selectedProvider: AuthProvider = 'privy') {
  const dispatch = useDispatch();
  const [status, setStatus] = useState<string>('');

  if (selectedProvider === 'privy') {
    // Use the existing Privy hook
    const {handlePrivyLogin, handlePrivyLogout, user} = usePrivyWalletLogic();

    const loginWithGoogle = useCallback(async () => {
      await handlePrivyLogin({
        loginMethod: 'google',
        setStatusMessage: setStatus,
      });
      if (user && user.id) {
        dispatch(loginSuccess({provider: 'privy', address: user.id}));
      }
    }, [handlePrivyLogin, dispatch, user]);

    const loginWithApple = useCallback(async () => {
      await handlePrivyLogin({
        loginMethod: 'apple',
        setStatusMessage: setStatus,
      });
      if (user && user.id) {
        dispatch(loginSuccess({provider: 'privy', address: user.id}));
      }
    }, [handlePrivyLogin, dispatch, user]);

    const loginWithEmail = useCallback(async () => {
      await handlePrivyLogin({
        loginMethod: 'email',
        setStatusMessage: setStatus,
      });
      if (user && user.id) {
        dispatch(loginSuccess({provider: 'privy', address: user.id}));
      }
    }, [handlePrivyLogin, dispatch, user]);

    const logout = useCallback(async () => {
      await handlePrivyLogout(setStatus);
      dispatch(logoutSuccess());
    }, [handlePrivyLogout, dispatch]);

    return {
      status,
      loginWithGoogle,
      loginWithApple,
      loginWithEmail,
      logout,
      user,
    };
  } else if (selectedProvider === 'dynamic') {
    // Use the new Dynamic hook
    const {
      handleDynamicLogin,
      handleDynamicLogout,
      walletAddress,
      user,
      monitorDynamicWallet,
    } = useDynamicWalletLogic();
    console.log('walletAddress', walletAddress);
    const loginWithEmail = useCallback(async () => {
      await handleDynamicLogin({
        loginMethod: 'email',
        setStatusMessage: setStatus,
      });
      // Wait for the wallet to be created/monitored.
      if (walletAddress) {
        dispatch(loginSuccess({provider: 'dynamic', address: walletAddress}));
      }
    }, [handleDynamicLogin, dispatch, walletAddress]);

    const loginWithSMS = useCallback(async () => {
      await handleDynamicLogin({
        loginMethod: 'sms',
        setStatusMessage: setStatus,
      });
      if (walletAddress) {
        dispatch(loginSuccess({provider: 'dynamic', address: walletAddress}));
      }
    }, [handleDynamicLogin, dispatch, walletAddress]);

    const loginWithGoogle = useCallback(async () => {
      await handleDynamicLogin({
        loginMethod: 'google',
        setStatusMessage: setStatus,
      });
      if (walletAddress) {
        dispatch(loginSuccess({provider: 'dynamic', address: walletAddress}));
      }
    }, [handleDynamicLogin, dispatch, walletAddress]);

    const logout = useCallback(async () => {
      await handleDynamicLogout(setStatus);
      dispatch(logoutSuccess());
    }, [handleDynamicLogout, dispatch]);

    return {
      status,
      loginWithEmail,
      loginWithSMS,
      loginWithGoogle,
      logout,
      user: walletAddress ? {id: walletAddress} : user,
    };
  } else if (selectedProvider === 'turnkey') {
    // Turnkey logic (if implemented) would go here.
    const logout = useCallback(async () => {
      // Placeholder implementation for turnkey logout.
      dispatch(logoutSuccess());
    }, [dispatch]);

    return {
      status,
      loginWithEmail: async () => {
        /* Turnkey login not implemented in this example */
      },
      logout,
      user: null,
    };
  }

  // Fallback
  return {status, logout: async () => {}};
}
