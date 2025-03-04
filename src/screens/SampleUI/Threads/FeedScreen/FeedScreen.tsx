

import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { ThreadCTAButton, ThreadPost, ThreadUser } from '../../../../components/thread/thread.types';
import { useAppDispatch, useAppSelector } from '../../../../hooks/useReduxHooks';
import { Thread } from '../../../../components/thread';
import COLORS from '../../../../assets/colors';
import { fetchAllPosts } from '../../../../state/thread/reducer';
import { fetchProfilePic } from '../../../../state/auth/reducer';


export default function FeedScreen() {
  const dispatch = useAppDispatch();


  const allPosts = useAppSelector((state) => state.thread.allPosts);


  const userWallet = useAppSelector((state) => state.auth.address);


  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);

  const [rootPosts, setRootPosts] = useState<ThreadPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);


  const currentUser: ThreadUser = {
    id: userWallet || 'anonymous-user',   
    username: 'Alice',                  
    handle: '@aliceSmith',             
    verified: true,

    avatar: storedProfilePic
      ? { uri: storedProfilePic }
      : require('../../../../assets/images/User.png'),
  };

  // On mount, fetch all posts from the server
  useEffect(() => {
    dispatch(fetchAllPosts());
  }, [dispatch]);

  // Once we have userWallet, fetch the DB profile pic so Redux can store it
  useEffect(() => {
    if (userWallet) {
      dispatch(fetchProfilePic(userWallet)).catch(err => {
        console.error('Failed to fetch profile picture:', err);
      });
    }
  }, [userWallet, dispatch]);

  // Each time allPosts changes, filter out root posts and sort them
  useEffect(() => {
    const roots = allPosts.filter((p) => !p.parentId);
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

  // Example CTA buttons if you want to pass them to the <Thread>
  const ctaButtons: ThreadCTAButton[] = [
    {
      label: 'Mint NFT',
      onPress: (post) => console.log('Mint NFT pressed for post:', post.id),
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
      onPress: (post) => console.log('Trade pressed for post:', post.id),
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

  return (
    <SafeAreaView style={styles.container}>
      <Thread
        rootPosts={rootPosts}
        currentUser={currentUser}
        ctaButtons={ctaButtons}
        refreshing={refreshing}
        onRefresh={onRefresh}
        themeOverrides={{ '--thread-bg-primary': '#F0F0F0' }}
        styleOverrides={{
          container: { padding: 10 },
          button: { borderRadius: 8 },
          buttonLabel: { fontWeight: 'bold' },
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
});
