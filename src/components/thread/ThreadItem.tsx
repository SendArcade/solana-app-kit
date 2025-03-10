// FILE: src/components/thread/ThreadItem.tsx

import React, {useState} from 'react';
import {View, Alert, TouchableOpacity} from 'react-native';
import ThreadAncestors from './ThreadAncestors';
import PostHeader from './post/PostHeader';
import PostBody from './post/PostBody';
import PostFooter from './post/PostFooter';
import PostCTA from './post/PostCTA';
import RetweetPreview from './retweet/RetweetPreview';
import {createThreadStyles, getMergedTheme} from './thread.styles';
import {ThreadCTAButton, ThreadPost, ThreadUser} from './thread.types';
import {useAppDispatch} from '../../hooks/useReduxHooks';
import {deletePostAsync} from '../../state/thread/reducer';
import ThreadEditModal from './ThreadEditModal';
import ThreadComposer from './ThreadComposer';

interface ThreadItemProps {
  post: ThreadPost;
  currentUser: ThreadUser;
  rootPosts: ThreadPost[];
  depth?: number;
  onPressPost?: (post: ThreadPost) => void;
  ctaButtons?: ThreadCTAButton[];
  themeOverrides?: Partial<Record<string, any>>;
  styleOverrides?: {[key: string]: object};
  userStyleSheet?: {[key: string]: object};
  onPressUser?: (user: ThreadUser) => void;

  /**
   * NEW: If true, do not show sub-replies or the local composer in this item.
   */
  disableReplies?: boolean;
}

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
  const [showReplies, setShowReplies] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const dispatch = useAppDispatch();

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

  return (
    <View style={containerStyle}>
      {/* If not root, show ancestors (unless disableReplies) */}
      {!disableReplies && (
        <ThreadAncestors
          post={post}
          rootPosts={rootPosts}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
          userStyleSheet={userStyleSheet}
        />
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPressPost && onPressPost(post)}
        style={{flex: 1}}>
        <PostHeader
          post={post}
          onDeletePost={handleDeletePost}
          onEditPost={handleEditPost}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
          onPressUser={onPressUser}
        />

        <PostBody
          post={post}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
        />

        {post.retweetOf && (
          <View style={{marginBottom: 6}}>
            <RetweetPreview
              retweetOf={post.retweetOf}
              onPress={onPressPost}
              themeOverrides={themeOverrides}
              styleOverrides={styleOverrides}
            />
          </View>
        )}

        <PostCTA
          post={post}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
          userStyleSheet={userStyleSheet}
        />

        <PostFooter
          post={post}
          onPressComment={() => {
            if (!disableReplies) {
              setShowReplies(!showReplies);
            }
          }}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
        />
      </TouchableOpacity>

      {/* If !disableReplies => user can expand replies + composer */}
      {!disableReplies && showReplies && (
        <View style={{marginTop: 8}}>
          <ThreadComposer
            currentUser={currentUser}
            parentId={post.id}
            onPostCreated={() => {
              /* optional callback if needed */
            }}
            themeOverrides={themeOverrides}
            styleOverrides={styleOverrides}
          />

          {/* Render the existing replies */}
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
              onPressUser={onPressUser}
            />
          ))}
        </View>
      )}

      {showEditModal && (
        <ThreadEditModal
          post={post}
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentUser={currentUser}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
        />
      )}
    </View>
  );
};
