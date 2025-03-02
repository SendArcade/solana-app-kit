// File: src/screens/Common/ChatScreen.tsx
import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../../hooks/useReduxHooks';
import { fetchAllPosts } from '../../../../state/thread/reducer';
import { RootState } from '../../../../state/store';
import { ThreadPost, ThreadUser } from '../../../../components/thread/thread.types';
import { PostBody, ThreadComposer } from '../../../../components/thread';
import PostCTA from '../../../../components/thread/PostCTA';

/**
 * ChatScreen:
 * A simplified "chat-style" view reusing your existing thread logic,
 * but with the sender's name vertically centered next to the avatar.
 */
export default function ChatScreen() {
  // Get posts from Redux store and dispatch function
  const allPosts = useSelector((state: RootState) => state.thread.allPosts);
  const dispatch = useAppDispatch();

  // Replace with your real user from auth if desired:
  const currentUser = useMockCurrentUser();

  // Sort messages by creation time ascending (oldest first)
  const sortedPosts = [...allPosts].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Reference for FlatList to auto-scroll
  const flatListRef = useRef<FlatList<any>>(null);

  // Auto-scroll when sortedPosts length changes
  useEffect(() => {
    scrollToEnd();
  }, [sortedPosts.length]);

  const scrollToEnd = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Fetch posts from backend on mount
  useEffect(() => {
    dispatch(fetchAllPosts());
  }, [dispatch]);

  const renderItem = ({ item }: { item: ThreadPost }) => {
    return (
      <>
        <View style={styles.messageContainer}>
          {/* Header row: avatar and username */}
          <View style={styles.headerRow}>
            <Image
              source={
                item.user.avatar
                  ? item.user.avatar
                  : require("../../../../assets/images/User.png")
              }
              style={styles.avatar}
            />
            <View style={styles.usernameContainer}>
              <Text style={styles.senderLabel}>{item.user.username}</Text>
            </View>
          </View>
          {/* Message body row */}
          <View style={styles.bodyContainer}>
            <PostBody
              post={item}
              themeOverrides={{}}
              styleOverrides={chatBodyOverrides}
            />
            <PostCTA post={item} />
          </View>
        </View>
        {/* Divider between messages */}
        <View style={styles.messageDivider} />
      </>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <KeyboardAvoidingView
        style={styles.chatScreenContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={sortedPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
        {/* Composer pinned at bottom */}
        <View style={styles.composerContainer}>
          <ThreadComposer
            currentUser={currentUser}
            onPostCreated={scrollToEnd}
            styleOverrides={{
              composerContainer: {
                backgroundColor: '#FAFAFA',
                paddingVertical: 8,
              },
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Temporary hook to provide a mock current user.
 * Replace with your real user from auth if needed.
 */
function useMockCurrentUser(): ThreadUser {
  return {
    id: 'mockUser1',
    username: 'Me',
    handle: '@me',
    avatar: require('../../../../assets/images/User.png'),
    verified: true,
  };
}

/**
 * Overrides for PostBody to tighten vertical spacing.
 */
const chatBodyOverrides = StyleSheet.create({
  extraContentContainer: {
    marginVertical: 2,
  },
  threadItemText: {
    fontSize: 14,
    color: '#232324',
  },
});

const styles = StyleSheet.create({
  chatScreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    paddingVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center', // Ensure vertical centering
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  usernameContainer: {
    height: 36,
    justifyContent: 'center',
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#232324',
  },
  bodyContainer: {
    marginTop: 2,
    marginLeft: 8,
    marginRight : 6, // Indent to align with text (avatar width + marginRight)
  },
  messageDivider: {
    height: 1,
    backgroundColor: '#EDEFF3',
    marginTop: 6,
  },
  composerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});
