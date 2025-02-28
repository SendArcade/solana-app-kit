import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import LoginScreen from '../screens/LoginScreen/LoginScreen';
import MainTabs from './MainTabs';
import CoinDetailPage from '../screens/CoinDetailPage/CoinDetailPage';
import BlinkScreen from '../screens/BlinkScreen';
import IntroScreen from '../screens/IntroScreen/IntroScreen';
import PumpfunScreen from '../screens/pumpfunScreen/pumpfunScreen';
import TokenMillScreen from '../screens/TokenMillScreen/TokenMillScreen';
import NftScreen from '../screens/NftScreen/NftScreen';
import PlatformSelectionScreen from '../screens/PlatformSelectionScreen';

export type RootStackParamList = {
  LoginOptions: undefined;
  MainTabs: undefined;
  CoinDetailPage: undefined;
  Blink: undefined;
  IntroScreen: undefined;
  Pumpfun: undefined;
  TokenMill: undefined;
  NftScreen: undefined;
  PlatformSelection: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {isLoggedIn ? (
        <>
          <Stack.Screen
            name="PlatformSelection"
            component={PlatformSelectionScreen}
          />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="CoinDetailPage" component={CoinDetailPage} />
          <Stack.Screen name="Blink" component={BlinkScreen} />
          <Stack.Screen name="Pumpfun" component={PumpfunScreen} />
          <Stack.Screen name="TokenMill" component={TokenMillScreen} />
          <Stack.Screen name="NftScreen" component={NftScreen} />
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
