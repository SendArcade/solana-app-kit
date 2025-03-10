import React, {useMemo} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import {useRoute, RouteProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../../../../navigation/RootNavigator';

import {useAppSelector} from '../../../../hooks/useReduxHooks';
import {
  ThreadPost,
  ThreadUser,
} from '../../../../components/thread/thread.types';
import {
  findPostById,
  gatherAncestorChain,
  gatherDescendants,
} from '../../../../components/thread/thread.utils';
import PostHeader from '../../../../components/thread/post/PostHeader';
import PostBody from '../../../../components/thread/post/PostBody';
import PostFooter from '../../../../components/thread/post/PostFooter';
import ThreadComposer from '../../../../components/thread/ThreadComposer';
import COLORS from '../../../../assets/colors';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';

/**
 * For a root post click:
 *  - Display the root post and all its replies.
 *
 * For a non-root (reply) click:
 *  - Display the entire conversation context:
 *    Root post → parent reply(ies) → clicked reply → replies to the clicked reply.
 *  - Include a composer at the bottom.
 */

type PostThreadScreenRouteProp = RouteProp<RootStackParamList, 'PostThread'>;

export default function PostThreadScreen() {
  const route = useRoute<PostThreadScreenRouteProp>();
  const navigation = useAppNavigation();
  const {postId} = route.params;

  // Get posts from Redux
  const allPosts = useAppSelector(state => state.thread.allPosts);
  const currentPost = findPostById(allPosts, postId);

  if (!currentPost) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFoundText}>Oops! Post not found.</Text>
      </SafeAreaView>
    );
  }

  // Determine if current post is root
  const isRoot = !currentPost.parentId;

  // Gather the chain from root to current (if not root)
  const ancestorChain = useMemo(() => {
    if (isRoot) return [currentPost];
    const chain = gatherAncestorChain(currentPost.id, allPosts);
    chain.reverse(); // order from root to current
    return chain;
  }, [isRoot, currentPost, allPosts]);

  // Gather all replies for the current post
  const directReplies = useMemo(() => {
    const allDesc = gatherDescendants(currentPost.id, allPosts);
    allDesc.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    return allDesc;
  }, [currentPost, allPosts]);

  // Function to navigate back
  function handleGoBack() {
    navigation.goBack();
  }

  // When a user taps on a user's avatar/username, navigate to OtherProfile
  function handlePressUser(user: ThreadUser) {
    navigation.navigate('OtherProfile', {userId: user.id});
  }

  // Render a post (header, body, footer)
  function renderPostItem(post: ThreadPost) {
    return (
      <View key={post.id} style={styles.postContainer}>
        <PostHeader
          post={post}
          onDeletePost={() => {}}
          onEditPost={() => {}}
          onPressUser={handlePressUser}
        />
        <PostBody post={post} />
        <PostFooter
          post={post}
          onPressComment={() => {
            // Navigate to the thread of this post
            navigation.navigate('PostThread', {postId: post.id});
          }}
        />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        Platform.OS === 'android' && styles.androidSafeArea,
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thread</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* If root, display the post and all its replies */}
        {isRoot
          ? renderPostItem(currentPost)
          : // For a reply, display the entire chain (root → ... → clicked reply)
            ancestorChain.map(p => renderPostItem(p))}

        {/* Display replies to the clicked post */}
        <View style={{marginTop: 16}}>
          {directReplies.map(r => renderPostItem(r))}
        </View>
      </ScrollView>

      {/* Composer at bottom */}
      <View style={styles.composerContainer}>
        <ThreadComposer
          currentUser={{
            id: '', // Replace with the actual user ID from your Redux store
            username: '',
            handle: '',
            avatar: {},
          }}
          parentId={currentPost.id}
          onPostCreated={() => {
            // Optionally trigger a refetch
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  androidSafeArea: {
    paddingTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#1d9bf0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  postContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  composerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FFF',
  },
  notFoundText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});
