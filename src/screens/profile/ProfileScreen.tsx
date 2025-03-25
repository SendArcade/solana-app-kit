import React, {useState, useEffect, useCallback} from 'react';
import {View, useWindowDimensions} from 'react-native';
import Profile from '../../components/Profile/profile';
import {useAppSelector, useAppDispatch} from '../../hooks/useReduxHooks';
import {fetchAllPosts} from '../../state/thread/reducer';
import {fetchUserProfile} from '../../state/auth/reducer';
import {useNavigation} from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const {width} = useWindowDimensions();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  const user = useAppSelector(state => ({
    address: state.auth.address || '',
    profilePicUrl: state.auth.profilePicUrl || '',
    username: state.auth.username || '',
    attachmentData: state.auth.attachmentData,
  }));

  // Fetch posts when profile first loads
  useEffect(() => {
    dispatch(fetchAllPosts());
    if (user.address) {
      dispatch(fetchUserProfile(user.address));
    }
  }, [dispatch, user.address]);

  // Enable navigation to profile screen by setting header text and dynamic title
  useEffect(() => {
    navigation.setOptions({
      title: user.username || 'Profile',
    });
  }, [navigation, user.username]);

  if (!user.address) {
    return <View />;
  }

  return (
    <SafeAreaView edges={['right', 'left', 'bottom']} style={{flex: 1}}>
      <Profile
        isOwnProfile={true}
        user={user}
        containerStyle={{width, flex: 1}}
      />
    </SafeAreaView>
  );
} 