// File: src/screens/SampleUI/Threads/FeedScreen/FeedScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Platform, ActivityIndicator, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import { Thread } from '../../../../components/thread/Thread';
import {
  ThreadUser,
  ThreadPost,
  ThreadCTAButton,
} from '../../../../components/thread/thread.types';
import { useAppDispatch, useAppSelector } from '../../../../hooks/useReduxHooks';
import { fetchAllPosts } from '../../../../state/thread/reducer';
import { fetchUserProfile } from '../../../../state/auth/reducer';
import COLORS from '../../../../assets/colors';
import { RootStackParamList } from '../../../../navigation/RootNavigator';
import { DEFAULT_IMAGES } from '../../../../config/constants';

export default function FeedScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const allPosts = useAppSelector(state => state.thread.allPosts);
  const userWallet = useAppSelector(state => state.auth.address);
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
  const userName = useAppSelector(state => state.auth.username);
  const isLoggedIn = useAppSelector(state => state.auth.isLoggedIn);

  const [feedPosts, setFeedPosts] = useState<ThreadPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  // Add loading state for user profile
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileStable, setProfileStable] = useState(false);

  // Build current user object from Redux data
  const currentUser: ThreadUser = {
    id: userWallet || 'anonymous-user',
    username: userName || 'Anonymous',
    handle: userWallet
      ? '@' + userWallet.slice(0, 6) + '...' + userWallet.slice(-4)
      : '@anonymous',
    verified: true,
    avatar: storedProfilePic ? { uri: storedProfilePic } : DEFAULT_IMAGES.user,
  };

  // On mount, fetch all posts
  useEffect(() => {
    dispatch(fetchAllPosts());
  }, [dispatch]);

  // Once we have userWallet, fetch DB profile info (username, profile pic)
  // Only fetch when properly authenticated with isLoggedIn true
  useEffect(() => {
    const loadProfile = async () => {
      if (userWallet && isLoggedIn) {
        try {
          setIsProfileLoading(true);
          await dispatch(fetchUserProfile(userWallet)).unwrap();
          // Set a small delay to ensure no flickering when profile data arrives
          setTimeout(() => {
            setProfileStable(true);
            setIsProfileLoading(false);
          }, 500);
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
          setIsProfileLoading(false);
          setProfileStable(true); // Consider profile stable even on error to show UI
        }
      } else if (!isLoggedIn) {
        // Reset profile stable if not logged in
        setProfileStable(false);
      }
    };

    loadProfile();
  }, [userWallet, isLoggedIn, dispatch]);

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
      buttonLabelStyle: { color: '#FFFFFF' },
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
      buttonLabelStyle: { color: '#FFFFFF' },
    },
  ];

  // Show loading indicator until profile is stable
  if (!profileStable) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.brandPrimary} />
      </SafeAreaView>
    );
  }

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
        // onPressPost navigates to the PostThreadScreen with the post's ID.
        onPressPost={post => {
          // For retweets and quotes, handle navigation correctly:
          if (post.retweetOf) {
            // If this is a retweet with no content (direct retweet), navigate to the original
            if (post.sections.length === 0) {
              navigation.navigate('PostThread', { postId: post.retweetOf.id });
            } else {
              // If it's a quote retweet, navigate to the quote itself
              navigation.navigate('PostThread', { postId: post.id });
            }
          } else {
            // Regular post
            navigation.navigate('PostThread', { postId: post.id });
          }
        }}
        themeOverrides={{ 
          '--thread-bg-primary': '#F0F0F0',
          '--retweet-border-color': '#E1E8ED',
          '--retweet-bg-color': '#F8F8F8',
          '--retweet-text-color': '#657786'
        }}
        styleOverrides={{
          container: { padding: 6 },
          button: { borderRadius: 8 },
          buttonLabel: { fontWeight: 'bold' },
          retweetHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 6,
            paddingLeft: 6,
            paddingTop: 4,
          },
          retweetHeaderText: {
            fontSize: 13,
            color: '#657786',
            marginLeft: 6,
            fontWeight: '500',
          },
          retweetedContent: {
            marginTop: 4,
            width: '100%',
          },
          originalPostContainer: {
            width: '100%',
            borderRadius: 12,
            backgroundColor: '#F8F8F8',
            padding: 10,
            borderWidth: 1,
            borderColor: '#E1E8ED',
          },
        }}
        onPressUser={user => {
          // Check if the tapped user is the current (logged-in) user
          if (user.id === currentUser.id) {
            navigation.navigate('ProfileScreen' as never); // Show own profile
          } else {
            navigation.navigate('OtherProfile', { userId: user.id }); // Show other profile
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
