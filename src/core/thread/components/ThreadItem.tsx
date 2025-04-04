import React, { useState } from 'react';
import { View, Alert, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ThreadAncestors } from './ThreadAncestors';
import PostHeader from './post/PostHeader';
import PostBody from './post/PostBody';
import PostFooter from './post/PostFooter';
import PostCTA from './post/PostCTA';
import { createThreadStyles, getMergedTheme } from './thread.styles';
import { ThreadItemProps, ThreadPost } from '../types';
import { useAppDispatch } from '../../../hooks/useReduxHooks';
import { deletePostAsync } from '../../../state/thread/reducer';
import { EditPostModal } from './EditPostModal';
import Icons from '../../../assets/svgs';

// Styles for retweets within ThreadItem
const threadStyles = StyleSheet.create({
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
  quoteContent: {
    marginBottom: 4,
  },
  quoteText: {
    fontSize: 13,
    color: '#657786',
  },
});

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

  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(
    mergedTheme,
    styleOverrides,
    userStyleSheet,
  );

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
        <View style={threadStyles.retweetHeader}>
          <Icons.RetweetIdle width={12} height={12} color="#657786" />
          <Text style={threadStyles.retweetHeaderText}>
            {post.user.username} Retweeted
          </Text>
        </View>
      )}

      {isRetweet ? (
        /* If it's a retweet, handle it differently depending on whether it has content */
        <View style={threadStyles.retweetedContent}>
          {/* For quote retweets, show the quote text first */}
          {isQuoteRetweet && (
            <View style={threadStyles.quoteContent}>
              {post.sections.map(section => (
                <Text key={section.id} style={threadStyles.quoteText}>
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
              style={threadStyles.originalPostContainer}
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
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </View>
  );
};

// Also export as default for backward compatibility
export default ThreadItem;
