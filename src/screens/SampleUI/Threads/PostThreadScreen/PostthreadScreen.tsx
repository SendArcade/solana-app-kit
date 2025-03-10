import React, {useMemo, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';

import {RootStackParamList} from '../../../../navigation/RootNavigator';
import PostHeader from '../../../../components/thread/post/PostHeader';
import PostBody from '../../../../components/thread/post/PostBody';
import PostFooter from '../../../../components/thread/post/PostFooter';
import ThreadComposer from '../../../../components/thread/ThreadComposer';
import {useAppSelector, useAppDispatch} from '../../../../hooks/useReduxHooks';
import {useAppNavigation} from '../../../../hooks/useAppNavigation';

import {
  ThreadPost,
  ThreadUser,
} from '../../../../components/thread/thread.types';
import {DEFAULT_IMAGES} from '../../../../config/constants';
import {flattenPosts} from '../../../../components/thread/thread.utils';
import {deletePostAsync} from '../../../../state/thread/reducer';
import ThreadEditModal from '../../../../components/thread/ThreadEditModal';

/**
 * Finds a post in the array by ID.
 */
function findPostById(posts: ThreadPost[], id: string): ThreadPost | undefined {
  return posts.find(p => p.id === id);
}

/**
 * Gathers ancestors from the current post up to the root, returning them
 * in order from root -> ... -> current.
 */
function gatherAncestorChain(
  start: ThreadPost,
  allPosts: ThreadPost[],
): ThreadPost[] {
  const chain: ThreadPost[] = [];
  let current = start;
  while (true) {
    chain.push(current);
    if (!current.parentId) {
      // Reached root
      break;
    }
    const parent = findPostById(allPosts, current.parentId);
    if (!parent) break;
    current = parent;
  }
  chain.reverse();
  return chain;
}

/**
 * Returns the direct children (one-level replies) for a given post.
 */
function getDirectChildren(posts: ThreadPost[], postId: string): ThreadPost[] {
  return posts.filter(p => p.parentId === postId);
}

/**
 * Checks if a post is root (no parent).
 */
function isRootPost(post: ThreadPost): boolean {
  return !post.parentId;
}

export default function PostThreadScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'PostThread'>>();
  const navigation = useAppNavigation();
  const dispatch = useAppDispatch();
  const {postId} = route.params;

  const allPosts = useAppSelector(state => state.thread.allPosts);
  const flatPosts = useMemo(() => flattenPosts(allPosts), [allPosts]);

  // Local state for editing
  const [postToEdit, setPostToEdit] = useState<ThreadPost | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const currentPost = findPostById(flatPosts, postId);

  // Build local user object
  const userWallet = useAppSelector(state => state.auth.address);
  const userName = useAppSelector(state => state.auth.username);
  const profilePicUrl = useAppSelector(state => state.auth.profilePicUrl);

  const localUser: ThreadUser = {
    id: userWallet || 'anonymous',
    username: userName || 'Anonymous',
    handle: userWallet
      ? '@' + userWallet.slice(0, 6) + '...' + userWallet.slice(-4)
      : '@anonymous',
    avatar: profilePicUrl ? {uri: profilePicUrl} : {uri: DEFAULT_IMAGES.user},
    verified: true,
  };

  // Gather ancestors and direct children only if currentPost exists
  const ancestorChain = currentPost
    ? gatherAncestorChain(currentPost, flatPosts)
    : [];
  const directChildren = currentPost
    ? getDirectChildren(flatPosts, currentPost.id)
    : [];

  /**
   * Confirm user is the owner, then delete the post.
   */
  const handleDeletePost = (post: ThreadPost) => {
    if (post.user.id !== localUser.id) {
      Alert.alert('Cannot Delete', 'You are not the owner of this post.');
      return;
    }
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          dispatch(deletePostAsync(post.id));
        },
      },
    ]);
  };

  /**
   * Confirm user is the owner, then open the edit modal.
   */
  const handleEditPost = (post: ThreadPost) => {
    if (post.user.id !== localUser.id) {
      Alert.alert('Cannot Edit', 'You are not the owner of this post.');
      return;
    }
    setPostToEdit(post);
    setEditModalVisible(true);
  };

  /**
   * Renders a single post in "Twitter style" WITHOUT click support.
   * (Used for posts in the ancestor chain.)
   */
  function renderNonClickablePost(post: ThreadPost) {
    const showTopLine = !isRootPost(post);
    const childCount = getDirectChildren(flatPosts, post.id).length;
    const showBottomLine = childCount > 0;

    return (
      <View style={twitterRowStyles.rowContainer} key={post.id}>
        <View style={twitterRowStyles.leftCol}>
          {showTopLine && <View style={twitterRowStyles.verticalLineTop} />}
          <View style={twitterRowStyles.dot} />
          {showBottomLine && (
            <View style={twitterRowStyles.verticalLineBottom} />
          )}
        </View>
        <View style={twitterRowStyles.postContent}>
          <PostHeader
            post={post}
            onDeletePost={() => handleDeletePost(post)}
            onEditPost={() => handleEditPost(post)}
            onPressUser={user =>
              navigation.navigate('OtherProfile', {userId: user.id})
            }
          />
          <PostBody post={post} />
          <PostFooter post={post} />
        </View>
      </View>
    );
  }

  /**
   * Renders a single post in "Twitter style" WITH click support.
   * (Used for direct child posts.)
   */
  function renderClickableChildPost(post: ThreadPost) {
    const showTopLine = !isRootPost(post);
    const childCount = getDirectChildren(flatPosts, post.id).length;
    const showBottomLine = childCount > 0;

    return (
      <TouchableOpacity
        key={post.id}
        style={twitterRowStyles.rowContainer}
        activeOpacity={0.8}
        onPress={() => {
          navigation.push('PostThread', {postId: post.id});
        }}>
        <View style={twitterRowStyles.leftCol}>
          {showTopLine && <View style={twitterRowStyles.verticalLineTop} />}
          <View style={twitterRowStyles.dot} />
          {showBottomLine && (
            <View style={twitterRowStyles.verticalLineBottom} />
          )}
        </View>
        <View style={twitterRowStyles.postContent}>
          <PostHeader
            post={post}
            onDeletePost={() => handleDeletePost(post)}
            onEditPost={() => handleEditPost(post)}
            onPressUser={user =>
              navigation.navigate('OtherProfile', {userId: user.id})
            }
          />
          <PostBody post={post} />
          <PostFooter post={post} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, Platform.OS === 'android' && {paddingTop: 30}]}>
      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thread</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {currentPost ? (
          <>
            {ancestorChain.map(p => renderNonClickablePost(p))}
            {directChildren.length > 0 && (
              <>
                <Text style={styles.repliesLabel}>Replies</Text>
                {directChildren.map(child => (
                  <View key={child.id} style={{marginLeft: 10}}>
                    {renderClickableChildPost(child)}
                  </View>
                ))}
              </>
            )}
          </>
        ) : (
          <View style={stylesNotFound.notFoundContainer}>
            <Text style={stylesNotFound.notFoundText}>
              Oops! Post not found.
            </Text>
          </View>
        )}
      </ScrollView>

      {currentPost && (
        <View style={styles.composerContainer}>
          <ThreadComposer
            currentUser={localUser}
            parentId={currentPost.id}
            onPostCreated={() => {
              console.log('Reply created successfully');
            }}
          />
        </View>
      )}

      {postToEdit && (
        <ThreadEditModal
          post={postToEdit}
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          currentUser={localUser}
        />
      )}
    </SafeAreaView>
  );
}

/** Styles for the post “twitter style” layout. */
const twitterRowStyles = {
  rowContainer: {
    flexDirection: 'row' as const,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  leftCol: {
    width: 40,
    alignItems: 'center' as const,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1d9bf0',
  },
  verticalLineTop: {
    width: 2,
    height: 16,
    backgroundColor: '#AAB8C2',
    marginBottom: 2,
  },
  verticalLineBottom: {
    width: 2,
    flex: 1,
    backgroundColor: '#AAB8C2',
    marginTop: 2,
  },
  postContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
};

const stylesNotFound = {
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6ECF0',
    backgroundColor: '#fff',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  backButtonText: {
    fontSize: 18,
    color: '#1d9bf0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#333',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  notFoundText: {
    fontSize: 16,
    color: '#888',
  },
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6ECF0',
    backgroundColor: '#fff',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  backButtonText: {
    fontSize: 18,
    color: '#1d9bf0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#333',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  repliesLabel: {
    marginLeft: 16,
    marginVertical: 6,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#555',
  },
  composerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E6ECF0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
};
