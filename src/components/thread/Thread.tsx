// File: src/components/thread/Thread.tsx
import React, { useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import ThreadComposer from './ThreadComposer';
import { createThreadStyles, getMergedTheme } from './thread.styles';
import Icons from '../../assets/svgs';
import { ThreadPost, ThreadUser, ThreadCTAButton } from './thread.types';
import ThreadItem from './ThreadItem';

/**
 * Props for the Thread component
 * @interface ThreadProps
 */
interface ThreadProps {
  /** Array of root-level posts to display in the thread */
  rootPosts: ThreadPost[];
  /** Current user information */
  currentUser: ThreadUser;
  /** Whether to show the thread header */
  showHeader?: boolean;
  /** Callback fired when a new post is created */
  onPostCreated?: () => void;
  /** Whether to hide the post composer */
  hideComposer?: boolean;
  /** Callback fired when a post is pressed */
  onPressPost?: (post: ThreadPost) => void;
  /** Array of call-to-action buttons to display */
  ctaButtons?: ThreadCTAButton[];
  /** Theme overrides for customizing appearance */
  themeOverrides?: Partial<Record<string, any>>;
  styleOverrides?: { [key: string]: object };
  userStyleSheet?: { [key: string]: object };
  refreshing?: boolean;
  onRefresh?: () => void;
}

/**
 * Thread component that displays a list of posts with nested replies
 * 
 * @component
 * @description
 * The Thread component is a core component that renders a list of posts in a threaded
 * discussion format. It supports nested replies, post composition, and customizable
 * styling through themes and style overrides.
 * 
 * @example
 * ```tsx
 * <Thread
 *   rootPosts={posts}
 *   currentUser={user}
 *   showHeader={true}
 *   onPostCreated={() => refetchPosts()}
 *   onPressPost={(post) => handlePostPress(post)}
 * />
 * ```
 */
export default function Thread({
  rootPosts,
  currentUser,
  showHeader = true,
  onPostCreated,
  hideComposer = false,
  onPressPost,
  ctaButtons,
  themeOverrides,
  styleOverrides,
  userStyleSheet,
  refreshing: externalRefreshing,
  onRefresh: externalOnRefresh,
}: ThreadProps) {
  // Local fallback for refreshing if not provided via props
  const [localRefreshing, setLocalRefreshing] = useState(false);

  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(mergedTheme, styleOverrides, userStyleSheet);

  // Local onRefresh if external prop is not provided
  const localOnRefresh = () => {
    setLocalRefreshing(true);
    // Simulate a refresh delay; in production, your parent component will re-fetch
    setTimeout(() => {
      setLocalRefreshing(false);
    }, 800);
  };

  const finalRefreshing = externalRefreshing !== undefined ? externalRefreshing : localRefreshing;
  const finalOnRefresh = externalOnRefresh !== undefined ? externalOnRefresh : localOnRefresh;

  const renderItem = ({ item }: { item: ThreadPost }) => (
    <ThreadItem
      post={item}
      currentUser={currentUser}
      rootPosts={rootPosts}
      themeOverrides={themeOverrides}
      styleOverrides={styleOverrides}
      userStyleSheet={userStyleSheet}
      onPressPost={onPressPost}
      ctaButtons={ctaButtons}
    />
  );

  return (
    <View style={styles.threadRootContainer}>
      {showHeader && (
        <View style={styles.header}>
          <Icons.SplashText width={120} height={120} />
        </View>
      )}

      {!hideComposer && (
        <ThreadComposer
          currentUser={currentUser}
          onPostCreated={onPostCreated}
          themeOverrides={themeOverrides}
          styleOverrides={styleOverrides}
        />
      )}

      <View style={styles.divider} />

      <FlatList
        data={rootPosts}
        keyExtractor={(post) => post.id}
        renderItem={renderItem}
        contentContainerStyle={styles.threadListContainer}
        refreshing={finalRefreshing}
        onRefresh={finalOnRefresh}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{ color: '#666' }}>No posts yet.</Text>
          </View>
        }
      />
    </View>
  );
};
