import React, { useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { ThreadComposer } from './ThreadComposer';
import { createThreadStyles, getMergedTheme } from './thread.styles';
import Icons from '../../../assets/svgs';
import { ThreadProps } from '../types';
import { ThreadItem } from './ThreadItem';

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
  refreshing: externalRefreshing,
  onRefresh: externalOnRefresh,
  onPressUser,
  disableReplies = false,
}) => {
  // Local fallback for refreshing if not provided
  const [localRefreshing, setLocalRefreshing] = useState(false);

  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(
    mergedTheme,
    styleOverrides,
    userStyleSheet,
  );

  // Local onRefresh if external prop is not provided
  const localOnRefresh = () => {
    setLocalRefreshing(true);
    setTimeout(() => {
      setLocalRefreshing(false);
    }, 800);
  };

  const finalRefreshing =
    externalRefreshing !== undefined ? externalRefreshing : localRefreshing;
  const finalOnRefresh =
    externalOnRefresh !== undefined ? externalOnRefresh : localOnRefresh;

  const renderItem = ({ item }: { item: any }) => (
    <ThreadItem
      post={item}
      currentUser={currentUser}
      rootPosts={rootPosts}
      themeOverrides={themeOverrides}
      styleOverrides={styleOverrides}
      userStyleSheet={userStyleSheet}
      onPressPost={onPressPost}
      ctaButtons={ctaButtons}
      onPressUser={onPressUser}
      disableReplies={disableReplies}
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

// Also export as default for backward compatibility
export default Thread;
