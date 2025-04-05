import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import MainTabs from './MainTabs';
import ChatScreen from '../screens/SampleUI/Chat/ChatScreen/ChatScreen';
import CoinDetailPage from '../screens/SampleUI/Threads/CoinDetailPage/CoinDetailPage';
import BlinkScreen from '../screens/Common/BlinkScreen';
import NftScreen from '../modules/nft/screens/NftScreen';
import IntroScreen from '../screens/Common/IntroScreen/IntroScreen';
import LoginScreen from '../screens/Common/LoginScreen/LoginScreen';

// NEW IMPORT
import OtherProfileScreen from '../screens/SampleUI/Threads/OtherProfileScreen/OtherProfileScreen';
import PostThreadScreen from '../screens/SampleUI/Threads/PostThreadScreen/PostthreadScreen';
import FollowersFollowingListScreen from '../core/thread/components/FollowersFollowingListScreen/FollowersFollowingListScreen';
import ProfileScreen from '../screens/SampleUI/Threads/ProfileScreen/ProfileScreen';
import { TokenMillScreen } from '../modules/tokenMill';
import { PumpfunScreen } from '../modules/pumpFun';
import PumpSwapScreen from '../modules/pumpSwap/screens/PumpSwapScreen';
import { TurnkeyOtpAuth } from '../modules/embeddedWalletProviders/components/turnkey';

export type RootStackParamList = {
  LoginOptions: undefined;
  Login: undefined;
  MainTabs: undefined;
  SettingsScreen: undefined;
  SwapScreen: undefined;
  ProfileScreen: { userId?: string } | undefined;
  TurnkeyOtpAuth: {
    email: string;
    otpId: string;
    organizationId: string;
    onSuccess: (info: { provider: 'turnkey'; address: string }) => void;
  };
  CoinDetailPage: undefined;
  Blink: undefined;
  IntroScreen: undefined;
  Pumpfun: undefined;
  TokenMill: undefined;
  NftScreen: undefined;
  ChatScreen: undefined;
  PumpSwap: undefined;
  // NEW ROUTE
  OtherProfile: { userId: string };
  PostThread: { postId: string };
  FollowersFollowingList: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="CoinDetailPage" component={CoinDetailPage} />
          <Stack.Screen name="Blink" component={BlinkScreen} />
          <Stack.Screen name="Pumpfun" component={PumpfunScreen} />
          <Stack.Screen name="TokenMill" component={TokenMillScreen} />
          <Stack.Screen name="NftScreen" component={NftScreen} />
          <Stack.Screen name="ChatScreen" component={ChatScreen} />
          <Stack.Screen name="PumpSwap" component={PumpSwapScreen} />

          {/* NEW SCREEN for viewing other user's profile */}
          <Stack.Screen name="OtherProfile" component={OtherProfileScreen} />
          <Stack.Screen name="PostThread" component={PostThreadScreen} />
          <Stack.Screen
            name="FollowersFollowingList"
            component={FollowersFollowingListScreen}
            options={{ title: '' }} // or "Followers / Following"
          />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
          <Stack.Screen
            name="TurnkeyOtpAuth"
            component={TurnkeyOtpAuth as React.ComponentType<any>}
            options={{ headerShown: false }}
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
