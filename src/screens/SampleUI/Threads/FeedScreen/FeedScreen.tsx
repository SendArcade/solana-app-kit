// File: src/screens/SampleUI/Threads/FeedScreen/FeedScreen.tsx
import React, {useCallback, useEffect, useState} from 'react';
import {SafeAreaView, StyleSheet, Platform} from 'react-native';
import {NavigationProp, useNavigation} from '@react-navigation/native';

import {Thread} from '../../../../components/thread/Thread';
import {
  ThreadUser,
  ThreadPost,
  ThreadCTAButton,
} from '../../../../components/thread/thread.types';
import {useAppDispatch, useAppSelector} from '../../../../hooks/useReduxHooks';
import {fetchAllPosts} from '../../../../state/thread/reducer';
import {fetchUserProfile} from '../../../../state/auth/reducer';
import COLORS from '../../../../assets/colors';
import {RootStackParamList} from '../../../../navigation/RootNavigator';
import {DEFAULT_IMAGES} from '../../../../config/constants';

export default function FeedScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const allPosts = useAppSelector(state => state.thread.allPosts);
  const userWallet = useAppSelector(state => state.auth.address);
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
  const userName = useAppSelector(state => state.auth.username);

  const [feedPosts, setFeedPosts] = useState<ThreadPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Build current user object from Redux data
  const currentUser: ThreadUser = {
    id: userWallet || 'anonymous-user',
    username: userName || 'Anonymous',
    handle: userWallet
      ? '@' + userWallet.slice(0, 6) + '...' + userWallet.slice(-4)
      : '@anonymous',
    verified: true,
    avatar: storedProfilePic ? {uri: storedProfilePic} : DEFAULT_IMAGES.user,
  };

  // On mount, fetch all posts
  useEffect(() => {
    dispatch(fetchAllPosts());
  }, [dispatch]);

  // Once we have userWallet, fetch DB profile info (username, profile pic)
  useEffect(() => {
    if (userWallet) {
      dispatch(fetchUserProfile(userWallet)).catch(err => {
        console.error('Failed to fetch user profile:', err);
      });
    }
  }, [userWallet, dispatch]);

  // We now include both root posts AND replies in the feed
  useEffect(() => {
    const sortedAll = [...allPosts];
    // Sort descending by createdAt
    sortedAll.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    setFeedPosts(sortedAll);
  }, [allPosts]);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchAllPosts());
    setRefreshing(false);
  }, [dispatch]);

  // Example CTA buttons (completely optional)
  const ctaButtons: ThreadCTAButton[] = [
    {
      label: 'Mint NFT',
      onPress: post => console.log('Mint NFT pressed for post:', post.id),
      buttonStyle: {
        backgroundColor: '#2A2A2A',
        width: 130,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
      },
      buttonLabelStyle: {color: '#FFFFFF'},
    },
    {
      label: 'Trade',
      onPress: post => console.log('Trade pressed for post:', post.id),
      buttonStyle: {
        backgroundColor: '#2A2A2A',
        width: 140,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
      },
      buttonLabelStyle: {color: '#FFFFFF'},
    },
  ];

  return (
    <SafeAreaView
      style={[
        styles.container,
        Platform.OS === 'android' && styles.androidContainer,
      ]}>
      <Thread
        rootPosts={feedPosts} // Passing all posts (including replies)
        currentUser={currentUser}
        ctaButtons={ctaButtons}
        // Set disableReplies to false so that replies render with their parent snippet.
        disableReplies={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        // onPressPost navigates to the PostThreadScreen with the post’s ID.
        onPressPost={post => {
          navigation.navigate('PostThread', {postId: post.id});
        }}
        themeOverrides={{'--thread-bg-primary': '#F0F0F0'}}
        styleOverrides={{
          container: {padding: 6},
          button: {borderRadius: 8},
          buttonLabel: {fontWeight: 'bold'},
        }}
        onPressUser={user => {
          // Check if the tapped user is the current (logged-in) user
          if (user.id === currentUser.id) {
            navigation.navigate('ProfileScreen' as never); // Show own profile
          } else {
            navigation.navigate('OtherProfile', {userId: user.id}); // Show other profile
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  androidContainer: {
    paddingTop: 30,
  },
});
