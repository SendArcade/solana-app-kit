// App.tsx
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import process from 'process';
global.process = process;

import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import {navigationRef} from './src/hooks/useAppNavigation';
import {store} from './src/state/store';
import './src/utils/polyfills';

import { PrivyProvider, PrivyElements } from '@privy-io/expo';

// Dynamic client initialization
import { initDynamicClient, getDynamicClient } from './src/services/walletProviders/dynamic';
import { CustomizationProvider } from './src/CustomizationProvider';
import { DefaultCustomizationConfig } from './src/config';

export default function App() {
  const config = DefaultCustomizationConfig;

  useEffect(() => {
    if (config.auth.provider === 'dynamic') {
      initDynamicClient(
        config.auth.dynamic.environmentId,
        config.auth.dynamic.appName,
        config.auth.dynamic.appLogoUrl
      );
    }
  }, [config.auth.provider]);

  let dynamicClient: any;
  try {
    dynamicClient = getDynamicClient();
  } catch {
    dynamicClient = null;
  }

  return (
    <CustomizationProvider config={config}>
      <SafeAreaProvider>
        <ReduxProvider store={store}>
          {config.auth.provider === 'privy' ? (
            <PrivyProvider
              appId={config.auth.privy.appId}
              clientId={config.auth.privy.clientId}
              config={{
                embedded: {
                  solana: {
                    createOnLogin: 'users-without-wallets',
                  },
                },
              }}
            >
              <NavigationContainer ref={navigationRef}>
                <RootNavigator />
              </NavigationContainer>
              {dynamicClient?.reactNative && <dynamicClient.reactNative.WebView />}
              <PrivyElements />
            </PrivyProvider>
          ) : (
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
              {dynamicClient?.reactNative && <dynamicClient.reactNative.WebView />}
            </NavigationContainer>
          )}
        </ReduxProvider>
      </SafeAreaProvider>
    </CustomizationProvider>
  );
}
