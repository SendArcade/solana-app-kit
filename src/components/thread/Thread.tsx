import React, {useState} from 'react';
import {View, Text, FlatList} from 'react-native';
import {ThreadItem} from './ThreadItem';
import ThreadComposer from './ThreadComposer';
import {createThreadStyles, getMergedTheme} from './thread.styles';
import Icons from '../../assets/svgs';
import {ThreadPost, ThreadUser, ThreadCTAButton} from './thread.types';

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
  /** Style overrides for specific components */
  styleOverrides?: {[key: string]: object};
  /** User-provided stylesheet overrides */
  userStyleSheet?: {[key: string]: object};
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
export const Thread: React.FC<ThreadProps> = ({
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
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(
    mergedTheme,
    styleOverrides,
    userStyleSheet,
  );

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh or re-fetch
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  const renderItem = ({item}: {item: ThreadPost}) => (
    <ThreadItem
      post={item}
      currentUser={currentUser}
      rootPosts={rootPosts}
      themeOverrides={themeOverrides}
      styleOverrides={styleOverrides}
      userStyleSheet={userStyleSheet}
      onPressPost={onPressPost}
      ctaButtons={ctaButtons} // Pass CTA buttons to ThreadItem
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
        keyExtractor={post => post.id}
        renderItem={renderItem}
        contentContainerStyle={styles.threadListContainer}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={{alignItems: 'center', marginTop: 24}}>
            <Text style={{color: '#666'}}>No posts yet.</Text>
          </View>
        }
      />
    </View>
  );
};
