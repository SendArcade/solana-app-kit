import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import MainTabs from './MainTabs';
import TokenMillScreen from '../screens/Common/TokenMillScreen/TokenMillScreen';
import ChatScreen from '../screens/SampleUI/Chat/ChatScreen/ChatScreen';
import PlatformSelectionScreen from '../screens/Common/PlatformSelectionScreen';
import CoinDetailPage from '../screens/SampleUI/Threads/CoinDetailPage/CoinDetailPage';
import BlinkScreen from '../screens/Common/BlinkScreen';
import PumpfunScreen from '../screens/Common/pumpfunScreen/pumpfunScreen';
import NftScreen from '../screens/Common/NftScreen/NftScreen';
import IntroScreen from '../screens/Common/IntroScreen/IntroScreen';
import LoginScreen from '../screens/Common/LoginScreen/LoginScreen';

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
  ChatScreen: undefined;
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
          <Stack.Screen name="ChatScreen" component={ChatScreen} />
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
