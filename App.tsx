// File: /Users/bhuwantyagi/Desktop/sendAi/solana-social-starter/App.tsx

import 'react-native-gesture-handler';
import React from 'react';
import {Provider as ReduxProvider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import {navigationRef} from './src/hooks/useAppNavigation';
import {store} from './src/state/store';
import {PRIVY_APP_ID, PRIVY_CLIENT_ID} from '@env';
import {PrivyElements, PrivyProvider} from '@privy-io/expo';

import {dynamicClient} from './src/services/walletProviders/dynamic';

export default function App() {
  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <PrivyProvider
          appId={PRIVY_APP_ID}
          clientId={PRIVY_CLIENT_ID}
          config={{
            embedded: {
              solana: {
                createOnLogin: 'users-without-wallets',
              },
            },
          }}>
          <NavigationContainer ref={navigationRef}>
            <RootNavigator />
          </NavigationContainer>
          <dynamicClient.reactNative.WebView />
          <PrivyElements />
        </PrivyProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}
