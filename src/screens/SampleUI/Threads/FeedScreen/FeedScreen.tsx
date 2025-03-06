import React, {useEffect, useState, useCallback} from 'react';
import {SafeAreaView, StyleSheet, Platform} from 'react-native';
import {
  ThreadCTAButton,
  ThreadPost,
  ThreadUser,
} from '../../../../components/thread/thread.types';
import {useAppDispatch, useAppSelector} from '../../../../hooks/useReduxHooks';
import {Thread} from '../../../../components/thread';
import COLORS from '../../../../assets/colors';
import {fetchAllPosts} from '../../../../state/thread/reducer';
import {fetchUserProfile} from '../../../../state/auth/reducer'; // <--- renamed
import { DEFAULT_IMAGES } from '../../../../config/constants';

export default function FeedScreen() {
  const dispatch = useAppDispatch();

  const allPosts = useAppSelector(state => state.thread.allPosts);
  const userWallet = useAppSelector(state => state.auth.address);
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
  const userName = useAppSelector(state => state.auth.username);  // <-- store user name from state

  const [rootPosts, setRootPosts] = useState<ThreadPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Build the current user object from Redux data
  const currentUser: ThreadUser = {
    id: userWallet || 'anonymous-user',
    username: userName || 'Anonymous',             // <-- use the stored username
    handle: userWallet
      ? '@' + userWallet.slice(0, 6) + '...' + userWallet.slice(-4)
      : '@anonymous',
    verified: true,
    avatar: storedProfilePic ? {uri: storedProfilePic} : DEFAULT_IMAGES.user,
  };

  // On mount, fetch all posts from the server
  useEffect(() => {
    dispatch(fetchAllPosts());
  }, [dispatch]);

  // Once we have userWallet, fetch the DB profile pic + user name
  useEffect(() => {
    if (userWallet) {
      dispatch(fetchUserProfile(userWallet)).catch(err => {
        console.error('Failed to fetch user profile:', err);
      });
    }
  }, [userWallet, dispatch]);

  // Filter out root posts (no parentId)
  useEffect(() => {
    const roots = allPosts.filter(p => !p.parentId);
    // Sort descending by createdAt
    roots.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    setRootPosts(roots);
  }, [allPosts]);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchAllPosts());
    setRefreshing(false);
  }, [dispatch]);

  // Example CTA buttons (optional)
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
        rootPosts={rootPosts}
        currentUser={currentUser}
        ctaButtons={ctaButtons}
        refreshing={refreshing}
        onRefresh={onRefresh}
        themeOverrides={{'--thread-bg-primary': '#F0F0F0'}}
        styleOverrides={{
          container: {padding: 10},
          button: {borderRadius: 8},
          buttonLabel: {fontWeight: 'bold'},
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
