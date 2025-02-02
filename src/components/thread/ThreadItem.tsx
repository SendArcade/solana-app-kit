// src/components/thread/ThreadItem.tsx

import React, {useState} from 'react';
import {View, Alert, TouchableOpacity} from 'react-native';
import ThreadAncestors from './ThreadAncestors';
import PostHeader from './PostHeader';
import PostBody from './PostBody';
import PostFooter from './PostFooter';
import ThreadComposer from './ThreadComposer';
import {createThreadStyles, getMergedTheme} from './thread.styles';
import {useAppDispatch} from '../../hooks/useReduxHooks';
import {deletePost} from '../../state/thread/reducer';
import {ThreadPost, ThreadUser} from './thread.types';

interface ThreadItemProps {
  post: ThreadPost;
  currentUser: ThreadUser;
  rootPosts: ThreadPost[];
  depth?: number;
  onPressPost?: (post: ThreadPost) => void;

  themeOverrides?: Partial<Record<string, any>>;
  styleOverrides?: {[key: string]: object};
  userStyleSheet?: {[key: string]: object};
}

export default function ThreadItem({
  post,
  currentUser,
  rootPosts,
  depth = 0,
  onPressPost,
  themeOverrides,
  styleOverrides,
  userStyleSheet,
}: ThreadItemProps) {
  const [showReplyComposer, setShowReplyComposer] = useState(false);
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

  const containerStyle = [
    styles.threadItemContainer,
    depth > 0 && styles.threadItemReplyLine,
  ];

  // If the user is not the owner, block deletion
  const handleDeletePost = (p: ThreadPost) => {
    if (p.user.id !== currentUser.id) {
      Alert.alert('Cannot Delete', 'You are not the owner of this post.');
      return;
    }
    dispatch(deletePost({postId: p.id}));
  };

  // If developer provided an onPress, we'll wrap the entire post
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
        style={{flex: 1}}>
        <PostHeader
          post={post}
          onPressMenu={() => {}}
          onDeletePost={handleDeletePost}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
        />

        <PostBody
          post={post}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
        />

        <PostFooter
          post={post}
          onPressComment={handleToggleReplyComposer}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
        />
      </Wrapper>

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

      {post.replies.map(reply => (
        <ThreadItem
          key={reply.id}
          post={reply}
          currentUser={currentUser}
          rootPosts={rootPosts}
          depth={depth + 1}
          onPressPost={onPressPost}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
          userStyleSheet={userStyleSheet}
        />
      ))}
    </View>
  );
}
