import React, { useState } from 'react';
import { View, Alert, TouchableOpacity } from 'react-native';
import ThreadAncestors from './ThreadAncestors';
import PostHeader from './PostHeader';
import PostBody from './PostBody';
import PostFooter from './PostFooter';
import PostCTA from './PostCTA';
import ThreadComposer from './ThreadComposer';
import { createThreadStyles, getMergedTheme } from './thread.styles';
import { ThreadCTAButton, ThreadPost, ThreadUser } from './thread.types';
import RetweetPreview from './RetweetPreview';

/**
 * Props for the ThreadItem component
 * @interface ThreadItemProps
 */
interface ThreadItemProps {
  /** The post data to display */
  post: ThreadPost;
  /** Current user information */
  currentUser: ThreadUser;
  /** Array of root-level posts in the thread */
  rootPosts: ThreadPost[];
  /** Nesting depth of the current post */
  depth?: number;
  /** Callback fired when a post is pressed */
  onPressPost?: (post: ThreadPost) => void;
  /** Array of call-to-action buttons to display */
  ctaButtons?: ThreadCTAButton[];
  /** Theme overrides for customizing appearance */
  themeOverrides?: Partial<Record<string, any>>;
  /** Style overrides for specific components */
  styleOverrides?: { [key: string]: object };
  /** User-provided stylesheet overrides */
  userStyleSheet?: { [key: string]: object };
}

/**
 * A component that renders an individual post within a thread
 * 
 * @component
 * @description
 * ThreadItem displays a single post with its replies in a threaded discussion.
 * It handles post interactions like replying, deleting, and showing nested responses.
 * The component supports customizable styling and themes.
 * 
 * Features:
 * - Displays post content with author information
 * - Shows nested replies
 * - Handles post deletion
 * - Supports reply composition
 * - Customizable appearance through themes
 * 
 * @example
 * ```tsx
 * <ThreadItem
 *   post={postData}
 *   currentUser={user}
 *   rootPosts={allPosts}
 *   depth={0}
 *   onPressPost={handlePostPress}
 * />
 * ```
 */
export const ThreadItem: React.FC<ThreadItemProps> = ({
  post,
  currentUser,
  rootPosts,
  depth = 0,
  onPressPost,
  ctaButtons,
  themeOverrides,
  styleOverrides,
  userStyleSheet,
}) => {
  const [showReplyComposer, setShowReplyComposer] = useState(false);

  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(
    mergedTheme,
    styleOverrides,
    userStyleSheet,
  );

  const handleToggleReplyComposer = () => {
    setShowReplyComposer(!showReplyComposer);
  };

  const containerStyle = [
    styles.threadItemContainer,
    depth > 0 && styles.threadItemReplyLine,
  ];

  const handleDeletePost = (p: ThreadPost) => {
    if (p.user.id !== currentUser.id) {
      Alert.alert('Cannot Delete', 'You are not the owner of this post.');
      return;
    }
    // If you have a delete post logic, call it here
  };

  const Wrapper = onPressPost ? TouchableOpacity : View;

  return (
    <View style={containerStyle}>
      <ThreadAncestors
        post={post}
        rootPosts={rootPosts}
        themeOverrides={themeOverrides}
        styleOverrides={styleOverrides}
        userStyleSheet={userStyleSheet}
      />

      <Wrapper
        activeOpacity={0.8}
        onPress={() => onPressPost && onPressPost(post)}
        style={{ flex: 1 }}
      >
        {/* If it's a retweet, display "Retweeted Post" inline (plus the user’s optional quote) */}
        {post.retweetOf && (
          <View style={{ marginBottom: 6 }}>
            <RetweetPreview
              retweetOf={post.retweetOf}
              onPress={onPressPost}
            />
          </View>
        )}

        <PostHeader
          post={post}
          onPressMenu={() => { }}
          onDeletePost={handleDeletePost}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
        />

        <PostBody
          post={post}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
        />

        <PostCTA
          post={post}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
          userStyleSheet={userStyleSheet}
        />

        <PostFooter
          post={post}
          onPressComment={handleToggleReplyComposer}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
        />
      </Wrapper>

      {showReplyComposer && (
        <View style={{ marginTop: 8 }}>
          <ThreadComposer
            currentUser={currentUser}
            parentId={post.id}
            onPostCreated={() => setShowReplyComposer(false)}
            themeOverrides={themeOverrides}
            styleOverrides={styleOverrides}
          />
        </View>
      )}

      {post.replies.map(reply => (
        <ThreadItem
          key={reply.id}
          post={reply}
          currentUser={currentUser}
          rootPosts={rootPosts}
          depth={depth + 1}
          onPressPost={onPressPost}
          ctaButtons={ctaButtons}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
          userStyleSheet={userStyleSheet}
        />
      ))}
    </View>
  );
}
