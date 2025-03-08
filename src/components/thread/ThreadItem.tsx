// FILE: src/components/thread/ThreadItem.tsx

import React, {useState} from 'react';
import {View, Alert, TouchableOpacity} from 'react-native';
import ThreadAncestors from './ThreadAncestors';
import PostHeader from './PostHeader';
import PostBody from './PostBody';
import PostFooter from './PostFooter';
import PostCTA from './PostCTA';
import RetweetPreview from './RetweetPreview';
import {createThreadStyles, getMergedTheme} from './thread.styles';
import {ThreadCTAButton, ThreadPost, ThreadUser} from './thread.types';
import {useAppDispatch} from '../../hooks/useReduxHooks';
import {deletePostAsync} from '../../state/thread/reducer';
import ThreadEditModal from './ThreadEditModal';
import ThreadComposer from './ThreadComposer'; // Ensure ThreadComposer is imported

interface ThreadItemProps {
  post: ThreadPost;
  currentUser: ThreadUser;
  rootPosts: ThreadPost[];
  depth?: number;
  onPressPost?: (post: ThreadPost) => void;
  ctaButtons?: ThreadCTAButton[];
  themeOverrides?: Partial<Record<string, any>>;
  /** Style overrides for specific components */
  styleOverrides?: {[key: string]: object};
  /** User-provided stylesheet overrides */
  userStyleSheet?: {[key: string]: object};

  /**
   * NEW: Callback if user taps avatar/username
   */
  onPressUser?: (user: ThreadUser) => void;
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
}) => {
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const dispatch = useAppDispatch();

  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(
    mergedTheme,
    styleOverrides,
    userStyleSheet,
  );

  const handleToggleReplyComposer = () => {
    setShowReplyComposer(!showReplyComposer);
  };

  /** Called when the user chooses Delete from the post menu. */
  const handleDeletePost = (p: ThreadPost) => {
    if (p.user.id !== currentUser.id) {
      Alert.alert('Cannot Delete', 'You are not the owner of this post.');
      return;
    }
    // Dispatch delete
    dispatch(deletePostAsync(p.id));
  };

  /** Called when user chooses Edit from the post menu. */
  const handleEditPost = (p: ThreadPost) => {
    if (p.user.id !== currentUser.id) {
      Alert.alert('Cannot Edit', 'You are not the owner of this post.');
      return;
    }
    setShowEditModal(true);
  };

  const containerStyle = [
    styles.threadItemContainer,
    depth > 0 && styles.threadItemReplyLine,
  ];

  return (
    <View style={containerStyle}>
      <ThreadAncestors
        post={post}
        rootPosts={rootPosts}
        themeOverrides={themeOverrides}
        styleOverrides={styleOverrides}
        userStyleSheet={userStyleSheet}
      />

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
          // Pass the new user press callback
          onPressUser={onPressUser}
        />

        <PostBody
          post={post}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
        />

        {post.retweetOf && (
          <View style={{marginBottom: 6}}>
            <RetweetPreview retweetOf={post.retweetOf} onPress={onPressPost} />
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
          onPressComment={() => setShowReplyComposer(!showReplyComposer)}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
        />
      </TouchableOpacity>

      {/* Render the reply composer when showReplyComposer is true */}
      {showReplyComposer && (
        <View style={{marginTop: 8}}>
          <ThreadComposer
            currentUser={currentUser}
            parentId={post.id}
            onPostCreated={() => setShowReplyComposer(false)}
            themeOverrides={themeOverrides}
            styleOverrides={styleOverrides}
          />
        </View>
      )}

      {/* EDIT MODAL for text sections */}
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
          onPressUser={onPressUser} // pass down
        />
      ))}
    </View>
  );
};
