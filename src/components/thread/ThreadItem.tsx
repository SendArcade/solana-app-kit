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

interface ThreadItemProps {
  /** The post to display. */
  post: ThreadPost;
  /** The current logged-in user. */
  currentUser: ThreadUser;
  /** An array of root-level posts; used to gather ancestor info. */
  rootPosts: ThreadPost[];
  /** Depth in the reply hierarchy (for optional styling). */
  depth?: number;
  /** Invoked if a post is pressed, e.g. to navigate to PostThreadScreen. */
  onPressPost?: (post: ThreadPost) => void;
  /** Array of custom CTA buttons to render below the post body. */
  ctaButtons?: ThreadCTAButton[];
  /** Theming overrides. */
  themeOverrides?: Partial<Record<string, any>>;
  /** Style overrides for specific keys in the default style. */
  styleOverrides?: {[key: string]: object};
  /** A user-provided stylesheet that merges with internal styles. */
  userStyleSheet?: {[key: string]: object};
  /**
   * Invoked if the user’s avatar/username is pressed (e.g., to open a profile).
   */
  onPressUser?: (user: ThreadUser) => void;
  /**
   * (Currently unused) If true, replies inside this post are hidden.
   * We no longer expand local replies on comment-click but keep the prop for potential usage.
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

      {/* Entire post is tappable => navigate to full PostThreadScreen */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPressPost?.(post)}
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

        {/* If it's a retweet, show the retweet preview inside this post. */}
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
          /**
           * Previously, we toggled local replies here.
           * Now we simply open the same “onPressPost” navigation:
           */
          onPressComment={() => onPressPost?.(post)}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
        />
      </TouchableOpacity>

      {/* “Edit Post” Modal */}
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

export default ThreadItem;
