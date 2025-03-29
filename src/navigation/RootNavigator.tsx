import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import MainTabs from './MainTabs';
import ChatScreen from '../screens/SampleUI/Chat/ChatScreen/ChatScreen';
import CoinDetailPage from '../screens/SampleUI/Threads/CoinDetailPage/CoinDetailPage';
import BlinkScreen from '../screens/Common/BlinkScreen';
import NftScreen from '../screens/Common/NftScreen/NftScreen';
import IntroScreen from '../screens/Common/IntroScreen/IntroScreen';
import LoginScreen from '../screens/Common/LoginScreen/LoginScreen';

// NEW IMPORT
import OtherProfileScreen from '../screens/SampleUI/Threads/OtherProfileScreen/OtherProfileScreen';
import PostThreadScreen from '../screens/SampleUI/Threads/PostThreadScreen/PostthreadScreen';
import FollowersFollowingListScreen from '../components/thread/FollowersFollowingListScreen/FollowersFollowingListScreen';
import ProfileScreen from '../screens/SampleUI/Threads/ProfileScreen/ProfileScreen';
import { TokenMillScreen } from '../modules/tokenMill';
import { PumpfunScreen } from '../modules/pumpFun';

export type RootStackParamList = {
  LoginOptions: undefined;
  MainTabs: undefined;
  CoinDetailPage: undefined;
  Blink: undefined;
  IntroScreen: undefined;
  Pumpfun: undefined;
  TokenMill: undefined;
  NftScreen: undefined;
  ChatScreen: undefined;
  // NEW ROUTE
  OtherProfile: { userId: string };
  PostThread: { postId: string };
  FollowersFollowingList : undefined;
  ProfileScreen: undefined;
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

          {/* NEW SCREEN for viewing other user's profile */}
          <Stack.Screen name="OtherProfile" component={OtherProfileScreen} />
          <Stack.Screen name="PostThread" component={PostThreadScreen} />
          <Stack.Screen
            name="FollowersFollowingList"
            component={FollowersFollowingListScreen}
            options={{ title: '' }} // or "Followers / Following"
          />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
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
