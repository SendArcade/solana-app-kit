import React, {useState, useEffect, useCallback} from 'react';
import {View, useWindowDimensions} from 'react-native';
import Profile from '../../components/Profile/profile';
import {useAppSelector, useAppDispatch} from '../../hooks/useReduxHooks';
import {fetchAllPosts} from '../../state/thread/reducer';
import {useRoute, useNavigation} from '@react-navigation/native';
import {fetchUserProfile} from '../../state/auth/reducer';
import {fetchFollowers, fetchFollowing, checkIfUserFollowsMe} from '../../services/profileService';

export default function OtherProfileScreen() {
  const {width} = useWindowDimensions();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const walletAddress = route.params?.userWallet || '';
  const profilePic = route.params?.profilePic || '';
  const name = route.params?.username || '';

  const [profile, setProfile] = useState({
    address: walletAddress,
    profilePicUrl: profilePic,
    username: name,
    attachmentData: {},
  });

  // Fetch user profile on mount
  useEffect(() => {
    if (walletAddress) {
      dispatch(fetchUserProfile(walletAddress))
        .unwrap()
        .then(data => {
          setProfile({
            address: walletAddress,
            profilePicUrl: data.profilePicUrl || profilePic,
            username: data.username || name,
            attachmentData: data.attachmentData || {},
          });
        })
        .catch(err => {
          console.error('Failed to fetch user profile:', err);
        });
    }
  }, [walletAddress, dispatch, profilePic, name]);

  // Fetch posts when profile first loads
  useEffect(() => {
    dispatch(fetchAllPosts());
  }, [dispatch]);

  // Set navigation title
  useEffect(() => {
    navigation.setOptions({
      title: profile.username || 'Profile',
    });
  }, [navigation, profile.username]);

  if (!walletAddress) {
    return <View />;
  }

  return (
    <View style={{flex: 1}}>
      <Profile
        isOwnProfile={false}
        user={profile}
        containerStyle={{width, flex: 1}}
      />
    </View>
  );
} 