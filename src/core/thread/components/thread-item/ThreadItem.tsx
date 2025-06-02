import React, { useState } from 'react';
import { View, Alert, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ThreadAncestors } from '../thread-ancestors/ThreadAncestors';
import PostHeader from '../post/PostHeader';
import PostBody from '../post/PostBody';
import PostFooter from '../post/PostFooter';
import PostCTA from '../post/PostCTA';
import { getThreadItemBaseStyles, retweetStyles } from './ThreadItem.styles'; // Import new base styles function
import { mergeStyles } from '../../utils'; // Import the new utility function
import { ThreadItemProps, ThreadPost } from '../../types';
import { useAppDispatch } from '@/shared/hooks/useReduxHooks';
import { deletePostAsync } from '@/shared/state/thread/reducer';
import EditPostModal from '../EditPostModal';
import Icons from '../../../../assets/svgs';
import COLORS from '@/assets/colors';

// Styles previously defined inline in ThreadItem.tsx moved to ThreadItem.styles.ts

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
  onPressUser,
  disableReplies,
}) => {
  const dispatch = useAppDispatch();
  const [showEditModal, setShowEditModal] = useState(false);

  // 1. Get the base styles for this component (no theme needed)
  const baseComponentStyles = getThreadItemBaseStyles();

  // 2. Use the utility function to merge base styles, overrides, and user sheet
  const styles = mergeStyles(baseComponentStyles, styleOverrides, userStyleSheet);

  const containerStyle = [
    styles.threadItemContainer,
    depth > 0 && styles.threadItemReplyLine,
  ];

  const handleDeletePost = (p: ThreadPost) => {
    if (p.user.id !== currentUser.id) {
      Alert.alert('Cannot Delete', 'You are not the owner of this post.');
      return;
    }
    dispatch(deletePostAsync(p.id));
  };

  const handleEditPost = (p: ThreadPost) => {
    if (p.user.id !== currentUser.id) {
      Alert.alert('Cannot Edit', 'You are not the owner of this post.');
      return;
    }
    setShowEditModal(true);
  };

  // Check if this is a retweet
  const isRetweet = !!post.retweetOf;

  // Check if this is a quote retweet (has content)
  const isQuoteRetweet = isRetweet && post.sections && post.sections.length > 0;

  // Handle clicks differently for retweets vs regular posts
  const handlePostPress = () => {
    if (!onPressPost) return;

    // If this is a retweet, navigate to the enclosing retweet post
    onPressPost(post);
  };

  // Handle click on the original post inside a retweet
  const handleOriginalPostPress = () => {
    if (!onPressPost || !post.retweetOf) return;

    // Navigate to the original post that was retweeted
    onPressPost(post.retweetOf);
  };

  return (
    <View style={containerStyle}>
      {/* Ancestor info if this post is a reply. (No inline children are shown here.) */}
      <ThreadAncestors
        post={post}
        rootPosts={rootPosts}
        themeOverrides={themeOverrides}
        styleOverrides={styleOverrides}
        userStyleSheet={userStyleSheet}
      />

      {/* Twitter style retweet indicator */}
      {isRetweet && (
        <View style={retweetStyles.retweetHeader}>
          <Icons.RetweetIdle width={12} height={12} color="#657786" />
          <Text style={retweetStyles.retweetHeaderText}>
            {post.user.username} Reposted
          </Text>
        </View>
      )}

      {isRetweet ? (
        /* If it's a retweet, handle it differently depending on whether it has content */
        <View style={retweetStyles.retweetedContent}>
          {/* For quote retweets, show the quote text first */}
          {isQuoteRetweet && (
            <View style={retweetStyles.quoteContent}>
              {post.sections.map(section => (
                <Text key={section.id} style={retweetStyles.quoteText}>
                  {section.text}
                </Text>
              ))}
            </View>
          )}

          {/* Show the original retweeted content */}
          {post.retweetOf && (
            /* Wrap the original post in a TouchableOpacity to navigate to it */
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOriginalPostPress}
              style={retweetStyles.originalPostContainer}
            >
              <PostHeader
                post={post.retweetOf}
                onDeletePost={handleDeletePost}
                onEditPost={handleEditPost}
                onPressUser={onPressUser}
              />
              <PostBody
                post={post.retweetOf}
                themeOverrides={themeOverrides}
                styleOverrides={styleOverrides}
                isRetweet={true}
              />
              <PostCTA
                post={post.retweetOf}
                themeOverrides={themeOverrides}
                styleOverrides={styleOverrides}
                userStyleSheet={userStyleSheet}
              />
              <PostFooter
                post={post.retweetOf}
                onPressComment={handleOriginalPostPress}
                themeOverrides={themeOverrides}
                styleOverrides={styleOverrides}
              />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* Normal post without retweet */
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePostPress}
          style={{ flex: 1 }}
        >
          <PostHeader
            post={post}
            onDeletePost={handleDeletePost}
            onEditPost={handleEditPost}
            onPressUser={user => {
              // Add error handling for user press navigation
              try {
                if (onPressUser && user && user.id) {
                  onPressUser(user);
                }
              } catch (err) {
                console.error('Error navigating to user profile:', err);
                Alert.alert('Navigation Error', 'Could not open user profile');
              }
            }}
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
            onPressComment={handlePostPress}
            themeOverrides={themeOverrides}
            styleOverrides={styleOverrides}
          />
        </TouchableOpacity>
      )}

      {/* Edit modal (hidden by default) */}
      {showEditModal && (
        <EditPostModal
          post={post}
          isVisible={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </View>
  );
};

// Also export as default for backward compatibility
export default ThreadItem;
