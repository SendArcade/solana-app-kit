// File: src/screens/Common/FeedScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { ThreadCTAButton, ThreadPost, ThreadUser } from '../../../../components/thread/thread.types';
import { useAppDispatch, useAppSelector } from '../../../../hooks/useReduxHooks';
import { Thread } from '../../../../components/thread';
import COLORS from '../../../../assets/colors';
import { fetchAllPosts } from '../../../../state/thread/reducer';
import { allposts as fallbackPosts } from '../../../../mocks/posts';

/** Example: Current user is "Alice" */
const currentUser: ThreadUser = {
  id: 'user-1',
  username: 'Alice',
  handle: '@aliceSmith',
  avatar: require('../../../../assets/images/User.png'),
  verified: true,
};

export default function FeedScreen() {
  const dispatch = useAppDispatch();
  const allPosts = useAppSelector((state) => state.thread.allPosts);
  const [rootPosts, setRootPosts] = useState<ThreadPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Example CTA buttons
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

  // Fetch posts on mount
  useEffect(() => {
    dispatch(fetchAllPosts());
  }, [dispatch]);

  // Filter out root posts (posts without a parent) and sort descending by createdAt.
  // If no posts are returned from the DB, fall back to the local mock posts.
  useEffect(() => {
    let postsToUse: ThreadPost[] = [];
    if (allPosts.length === 0) {
      postsToUse = fallbackPosts.filter((p) => !p.parentId);
    } else {
      postsToUse = allPosts.filter((p) => !p.parentId);
    }
    postsToUse.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    setRootPosts(postsToUse);
  }, [allPosts]);

  // Pull-to-refresh callback
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchAllPosts());
    setRefreshing(false);
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.container}>
      <Thread
        rootPosts={rootPosts}
        currentUser={currentUser}
        ctaButtons={ctaButtons}
        refreshing={refreshing}   // Passed to Thread for refresh control
        onRefresh={onRefresh}      // Callback to re-fetch posts on pull-to-refresh
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
