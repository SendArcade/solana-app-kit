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
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

import PostHeader from '@/core/thread/components/post/PostHeader';
import PostBody from '@/core/thread/components/post/PostBody';
import PostFooter from '@/core/thread/components/post/PostFooter';
import PostCTA from '@/core/thread/components/post/PostCTA';
import ThreadComposer from '@/core/thread/components/thread-composer/ThreadComposer';
import { AppHeader } from '@/core/shared-ui';

import {
  ThreadPost,
  ThreadUser,
} from '@/core/thread/components/thread.types';
import { DEFAULT_IMAGES } from '@/shared/config/constants';
import { flattenPosts } from '@/core/thread/components/thread.utils';
import ThreadEditModal from '@/core/thread/components/ThreadEditModal';
import Icons from '@/assets/svgs';
import { RootStackParamList } from '@/shared/navigation/RootNavigator';
import { useAppNavigation } from '@/shared/hooks/useAppNavigation';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/useReduxHooks';
import { deletePostAsync } from '@/shared/state/thread/reducer';
import styles from './PostThreadScreen.style';
import COLORS from '@/assets/colors';

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

  const allPosts = useAppSelector((state) => state.thread.allPosts);
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

  // Add state to track keyboard status
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Add keyboard listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

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
      <View style={styles.rowContainer} key={post.id}>
        <View style={styles.leftCol}>
          {showTopLine && <View style={styles.verticalLineTop} />}
          <View style={styles.dot} />
          {showBottomLine && <View style={styles.verticalLineBottom} />}
        </View>
        <View style={styles.postContent}>
          {/* If it's a retweet, show the retweet indicator */}
          {isRetweet && (
            <View style={styles.retweetIndicator}>
              <Icons.RetweetIdle width={12} height={12} color={COLORS.greyMid} />
              <Text style={styles.retweetText}>
                {post.user.username} Reposted
              </Text>
            </View>
          )}

          {isRetweet ? (
            <View>
              {/* For quote retweets, show the quote text first */}
              {isQuoteRetweet && (
                <View style={styles.quoteContent}>
                  {post.sections.map(section => (
                    <Text key={section.id} style={styles.quoteText}>
                      {section.text}
                    </Text>
                  ))}
                </View>
              )}

              {/* Display original post content for retweets */}
              {post.retweetOf && (
                <TouchableOpacity
                  style={styles.originalPostContainer}
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
        style={styles.rowContainer}
        activeOpacity={0.8}
        onPress={() => {
          navigation.push('PostThread', { postId: post.id });
        }}>
        <View style={styles.leftCol}>
          {showTopLine && <View style={styles.verticalLineTop} />}
          <View style={styles.dot} />
          {showBottomLine && <View style={styles.verticalLineBottom} />}
        </View>
        <View style={styles.postContent}>
          {/* If it's a retweet, show the retweet indicator */}
          {isRetweet && (
            <View style={styles.retweetIndicator}>
              <Icons.RetweetIdle width={12} height={12} color={COLORS.greyMid} />
              <Text style={styles.retweetText}>
                {post.user.username} Reposted
              </Text>
            </View>
          )}

          {isRetweet ? (
            <View>
              {/* For quote retweets, show the quote text first */}
              {isQuoteRetweet && (
                <View style={styles.quoteContent}>
                  {post.sections.map(section => (
                    <Text key={section.id} style={styles.quoteText}>
                      {section.text}
                    </Text>
                  ))}
                </View>
              )}

              {/* Display original post content for retweets */}
              {post.retweetOf && (
                <TouchableOpacity
                  style={styles.originalPostContainer}
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <SafeAreaView
        style={[styles.container, Platform.OS === 'android' && { paddingTop: 30 }]}>
        {/* Screen Header */}
        <AppHeader
          title="Thread"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          style={Platform.OS === 'android' ? { paddingTop: 30 } : undefined}
        />

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            // Add padding only on iOS since KeyboardAvoidingView works differently there
            Platform.OS === 'ios' && keyboardVisible && { paddingBottom: keyboardHeight }
          ]}
          keyboardShouldPersistTaps="handled">
          {currentPost ? (
            <>
              {ancestorChain.map(p => renderNonClickablePost(p))}
              {directChildren.length > 0 && (
                <>
                  <Text style={styles.repliesLabel}>Replies</Text>
                  {directChildren.map(child => (
                    <View key={child.id} style={styles.childPostContainer}>
                      {renderClickableChildPost(child)}
                    </View>
                  ))}
                </>
              )}
            </>
          ) : (
            <View style={styles.notFoundContainer}>
              <Text style={styles.notFoundText}>
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
                style={[
                  styles.dimOverlay,
                  { opacity: backgroundOpacity }
                ]}
              />
            )}

            {/* On Android, manually position the composer over the keyboard */}
            <Animated.View
              style={[
                styles.composerContainer,
                {
                  transform: [{ translateY: composerTranslateY }],
                  zIndex: 2,
                },
                isCommentHighlighted && styles.composerElevated,
                // On Android, manually position the composer above the keyboard
                Platform.OS === 'android' && keyboardVisible && {
                  position: 'absolute',
                  bottom: keyboardHeight,
                  left: 0,
                  right: 0
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
    </KeyboardAvoidingView>
  );
}
