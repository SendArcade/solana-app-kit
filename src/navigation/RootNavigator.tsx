import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useSelector} from 'react-redux';
import {RootState} from '../state/store';
import LoginScreen from '../screens/LoginScreen/LoginScreen';
import MainTabs from './MainTabs';
import CoinDetailPage from '../screens/CoinDetailPage/CoinDetailPage';
import BlinkScreen from '../screens/BlinkScreen';
import EmbeddedWalletScreen from '../screens/EmbeddedWalletScreen';
import IntroScreen from '../screens/IntroScreen/IntroScreen';

export type RootStackParamList = {
  LoginOptions: undefined;
  MainTabs: undefined;
  CoinDetailPage: undefined;
  Blink: undefined;
  EmbeddedWallet: undefined;
  IntroScreen: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {isLoggedIn ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="CoinDetailPage" component={CoinDetailPage} />
          <Stack.Screen name="Blink" component={BlinkScreen} />
          <Stack.Screen
            name="EmbeddedWallet"
            component={EmbeddedWalletScreen}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="IntroScreen" component={IntroScreen} />
          <Stack.Screen name="LoginOptions" component={LoginScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
