import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

import { RootStackParamList } from '../../../../navigation/RootNavigator';
import PostHeader from '../../../../components/thread/post/PostHeader';
import PostBody from '../../../../components/thread/post/PostBody';
import PostFooter from '../../../../components/thread/post/PostFooter';
import PostCTA from '../../../../components/thread/post/PostCTA';
import ThreadComposer from '../../../../components/thread/ThreadComposer';
import { useAppSelector, useAppDispatch } from '../../../../hooks/useReduxHooks';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';

import {
  ThreadPost,
  ThreadUser,
} from '../../../../components/thread/thread.types';
import { DEFAULT_IMAGES } from '../../../../config/constants';
import { flattenPosts } from '../../../../components/thread/thread.utils';
import { deletePostAsync } from '../../../../state/thread/reducer';
import ThreadEditModal from '../../../../components/thread/ThreadEditModal';
import RetweetPreview from '../../../../components/thread/retweet/RetweetPreview';
import Icons from '../../../../assets/svgs';

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
  const { postId } = route.params;

  // Add ref for the comment input
  const commentInputRef = useRef<{ focus: () => void }>(null);
  // Add ref for the ScrollView
  const scrollViewRef = useRef<ScrollView>(null);
  const [isCommentHighlighted, setIsCommentHighlighted] = useState(false);
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const composerTranslateY = useRef(new Animated.Value(0)).current;

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
    avatar: profilePicUrl && profilePicUrl.length > 0
      ? { uri: profilePicUrl }
      : DEFAULT_IMAGES.user,
    verified: true,
  };

  // Function to focus the comment input and highlight it
  const focusCommentInput = () => {
    if (commentInputRef.current) {
      // Set the highlighted state
      setIsCommentHighlighted(true);
      
      // Scroll to the bottom first
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
      
      // Animate the background dimming effect
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start();
      
      // Animate a subtle lift effect on the composer
      Animated.timing(composerTranslateY, {
        toValue: -3,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start();
      
      // Focus the input with a slight delay
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 250);
      
      // Reset the highlight after a delay
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(backgroundOpacity, {
            toValue: 0,
            duration: 200,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true
          }),
          Animated.timing(composerTranslateY, {
            toValue: 0,
            duration: 200,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true
          })
        ]).start(() => {
          setIsCommentHighlighted(false);
        });
      }, 300);
    }
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
      { text: 'Cancel', style: 'cancel' },
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
    const isRetweet = !!post.retweetOf;
    const isQuoteRetweet = isRetweet && post.sections && post.sections.length > 0;

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
          {/* If it's a retweet, show the retweet indicator */}
          {isRetweet && (
            <View style={twitterRowStyles.retweetIndicator}>
              <Icons.RetweetIdle width={12} height={12} color="#657786" />
              <Text style={twitterRowStyles.retweetText}>
                {post.user.username} Retweeted
              </Text>
            </View>
          )}

          {isRetweet ? (
            <View>
              {/* For quote retweets, show the quote text first */}
              {isQuoteRetweet && (
                <View style={twitterRowStyles.quoteContent}>
                  {post.sections.map(section => (
                    <Text key={section.id} style={twitterRowStyles.quoteText}>
                      {section.text}
                    </Text>
                  ))}
                </View>
              )}
            
              {/* Display original post content for retweets */}
              {post.retweetOf && (
                <TouchableOpacity 
                  style={twitterRowStyles.originalPostContainer}
                  activeOpacity={0.8}
                  onPress={() => navigation.push('PostThread', { postId: post.retweetOf!.id })}
                >
                  <PostHeader
                    post={post.retweetOf}
                    onDeletePost={() => handleDeletePost(post.retweetOf!)}
                    onEditPost={() => handleEditPost(post.retweetOf!)}
                    onPressUser={user =>
                      navigation.navigate('OtherProfile', { userId: user.id })
                    }
                  />
                  <PostBody post={post.retweetOf} />
                  <PostCTA
                    post={post.retweetOf}
                    themeOverrides={{}}
                    styleOverrides={{}}
                  />
                  <PostFooter 
                    post={post.retweetOf}
                    onPressComment={focusCommentInput} 
                  />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // Regular post display
            <>
              <PostHeader
                post={post}
                onDeletePost={() => handleDeletePost(post)}
                onEditPost={() => handleEditPost(post)}
                onPressUser={user =>
                  navigation.navigate('OtherProfile', { userId: user.id })
                }
              />
              <PostBody post={post} />
              <PostCTA
                post={post}
                themeOverrides={{}}
                styleOverrides={{}}
              />
              <PostFooter 
                post={post} 
                onPressComment={focusCommentInput}
              />
            </>
          )}
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
    const isRetweet = !!post.retweetOf;
    const isQuoteRetweet = isRetweet && post.sections && post.sections.length > 0;

    return (
      <TouchableOpacity
        key={post.id}
        style={twitterRowStyles.rowContainer}
        activeOpacity={0.8}
        onPress={() => {
          navigation.push('PostThread', { postId: post.id });
        }}>
        <View style={twitterRowStyles.leftCol}>
          {showTopLine && <View style={twitterRowStyles.verticalLineTop} />}
          <View style={twitterRowStyles.dot} />
          {showBottomLine && (
            <View style={twitterRowStyles.verticalLineBottom} />
          )}
        </View>
        <View style={twitterRowStyles.postContent}>
          {/* If it's a retweet, show the retweet indicator */}
          {isRetweet && (
            <View style={twitterRowStyles.retweetIndicator}>
              <Icons.RetweetIdle width={12} height={12} color="#657786" />
              <Text style={twitterRowStyles.retweetText}>
                {post.user.username} Retweeted
              </Text>
            </View>
          )}

          {isRetweet ? (
            <View>
              {/* For quote retweets, show the quote text first */}
              {isQuoteRetweet && (
                <View style={twitterRowStyles.quoteContent}>
                  {post.sections.map(section => (
                    <Text key={section.id} style={twitterRowStyles.quoteText}>
                      {section.text}
                    </Text>
                  ))}
                </View>
              )}
              
              {/* Display original post content for retweets */}
              {post.retweetOf && (
                <TouchableOpacity 
                  style={twitterRowStyles.originalPostContainer}
                  activeOpacity={0.8}
                  onPress={() => navigation.push('PostThread', { postId: post.retweetOf!.id })}
                >
                  <PostHeader
                    post={post.retweetOf}
                    onDeletePost={() => handleDeletePost(post.retweetOf!)}
                    onEditPost={() => handleEditPost(post.retweetOf!)}
                    onPressUser={user =>
                      navigation.navigate('OtherProfile', { userId: user.id })
                    }
                  />
                  <PostBody post={post.retweetOf} />
                  <PostCTA
                    post={post.retweetOf}
                    themeOverrides={{}}
                    styleOverrides={{}}
                  />
                  <PostFooter 
                    post={post.retweetOf}
                    onPressComment={focusCommentInput} 
                  />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // Regular post display
            <>
              <PostHeader
                post={post}
                onDeletePost={() => handleDeletePost(post)}
                onEditPost={() => handleEditPost(post)}
                onPressUser={user =>
                  navigation.navigate('OtherProfile', { userId: user.id })
                }
              />
              <PostBody post={post} />
              <PostCTA
                post={post}
                themeOverrides={{}}
                styleOverrides={{}}
              />
              <PostFooter 
                post={post} 
                onPressComment={focusCommentInput}
              />
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, Platform.OS === 'android' && { paddingTop: 30 }]}>
      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thread</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}>
        {currentPost ? (
          <>
            {ancestorChain.map(p => renderNonClickablePost(p))}
            {directChildren.length > 0 && (
              <>
                <Text style={styles.repliesLabel}>Replies</Text>
                {directChildren.map(child => (
                  <View key={child.id} style={{ marginLeft: 10 }}>
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
        <>
          {/* Semi-transparent overlay for dimming effect */}
          {isCommentHighlighted && (
            <Animated.View 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.3)',
                opacity: backgroundOpacity,
                zIndex: 1
              }}
            />
          )}
          
          <Animated.View 
            style={[
              styles.composerContainer,
              {
                transform: [{ translateY: composerTranslateY }],
                zIndex: 2,
                // Subtle elevation when focused
                ...(isCommentHighlighted ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 5,
                  elevation: 5,
                } : {})
              }
            ]}>
            <ThreadComposer
              ref={commentInputRef}
              currentUser={localUser}
              parentId={currentPost.id}
              onPostCreated={() => {
                console.log('Reply created successfully');
              }}
            />
          </Animated.View>
        </>
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

/** Styles for the post "twitter style" layout. */
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
  retweetIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  retweetText: {
    fontSize: 12,
    color: '#657786',
    marginLeft: 4,
    fontWeight: '500' as const,
  },
  retweetContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  originalPostContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  quoteContent: {
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 12,
    color: '#657786',
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
