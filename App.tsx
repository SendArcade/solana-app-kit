// App.tsx
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import process from 'process';
global.process = process;

import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/hooks/useAppNavigation';
import { store } from './src/state/store';
import './src/utils/polyfills';

import { PrivyProvider, PrivyElements } from '@privy-io/expo';
import { TurnkeyProvider } from '@turnkey/sdk-react-native';

// Dynamic client initialization
import { CustomizationProvider } from './src/CustomizationProvider';
import { DefaultCustomizationConfig } from './src/config';
import { 
  getDynamicClient, 
  initDynamicClient,
  initTurnkeyClient 
} from './src/modules/embeddedWalletProviders';
import TransactionNotification from './src/core/sharedUI/Common/TransactionNotification';

export default function App() {
  const config = DefaultCustomizationConfig;
  const [dynamicInitialized, setDynamicInitialized] = useState(false);
  const [turnkeyInitialized, setTurnkeyInitialized] = useState(false);

  // Initialize wallet providers based on configuration
  useEffect(() => {
    // Initialize Dynamic if selected
    if (config.auth.provider === 'dynamic') {
      try {
        initDynamicClient(
          config.auth.dynamic.environmentId,
          config.auth.dynamic.appName,
          config.auth.dynamic.appLogoUrl
        );
        setDynamicInitialized(true);
      } catch (error) {
        console.error("Failed to initialize Dynamic client:", error);
      }
    }
    
    // Initialize Turnkey if selected
    if (config.auth.provider === 'turnkey') {
      try {
        console.log('Initializing Turnkey client with config:', 
          JSON.stringify({
            baseUrl: config.auth.turnkey.baseUrl,
            rpId: config.auth.turnkey.rpId,
            rpName: config.auth.turnkey.rpName,
            organizationId: config.auth.turnkey.organizationId,
          })
        );
        initTurnkeyClient();
        console.log('Successfully initialized Turnkey client');
        setTurnkeyInitialized(true);
      } catch (error) {
        console.error("Failed to initialize Turnkey client:", error);
      }
    }
  }, [config.auth.provider]);

  // Get Dynamic client after initialization is complete
  const getDynamicWebView = () => {
    if (!dynamicInitialized) return null;

    try {
      const client = getDynamicClient();
      return client?.reactNative?.WebView ? <client.reactNative.WebView /> : null;
    } catch (error) {
      console.error("Error getting Dynamic WebView:", error);
      return null;
    }
  };

  // Component to render notification and any other global UI elements
  const GlobalUIElements = () => (
    <>
      <TransactionNotification />
    </>
  );

  // Render with appropriate providers based on the selected auth provider
  if (config.auth.provider === 'privy') {
    return (
      <CustomizationProvider config={config}>
        <SafeAreaProvider>
          <ReduxProvider store={store}>
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
              {getDynamicWebView()}
              <GlobalUIElements />
              <PrivyElements />
            </PrivyProvider>
          </ReduxProvider>
        </SafeAreaProvider>
      </CustomizationProvider>
    );
  } else if (config.auth.provider === 'turnkey') {
    return (
      <CustomizationProvider config={config}>
        <SafeAreaProvider>
          <ReduxProvider store={store}>
            <TurnkeyProvider config={{
              apiBaseUrl: config.auth.turnkey.baseUrl,
              organizationId: config.auth.turnkey.organizationId,
              onSessionSelected: () => {
                navigationRef.current?.navigate('MainTabs');
              },
              onSessionCleared: () => {
                // Handle logout if needed
              }
            }}>
              <NavigationContainer ref={navigationRef}>
                <RootNavigator />
              </NavigationContainer>
              <GlobalUIElements />
            </TurnkeyProvider>
          </ReduxProvider>
        </SafeAreaProvider>
      </CustomizationProvider>
    );
  } else {
    // Dynamic or other providers
    return (
      <CustomizationProvider config={config}>
        <SafeAreaProvider>
          <ReduxProvider store={store}>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
            </NavigationContainer>
            {getDynamicWebView()}
            <GlobalUIElements />
          </ReduxProvider>
        </SafeAreaProvider>
      </CustomizationProvider>
    );
  }
}
