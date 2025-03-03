// File: src/screens/Common/ChatScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

function useMockCurrentUser(): ThreadUser {
  return {
    id: 'mockUser1',
    username: 'Me',
    handle: '@me',
    avatar: require('../../../../assets/images/User.png'),
    verified: true,
  };
}

export default function ChatScreen() {
  const dispatch = useAppDispatch();
  const allPosts = useSelector((state: RootState) => state.thread.allPosts);
  const [sortedPosts, setSortedPosts] = useState<ThreadPost[]>([]);
  const flatListRef = useRef<FlatList<any>>(null);
  const currentUser = useMockCurrentUser();

  useEffect(() => {
    dispatch(fetchAllPosts());
  }, [dispatch]);

  useEffect(() => {
    // Always filter for root posts.
    const roots = allPosts.filter((p) => !p.parentId);
    // Sort ascending (oldest first)
    roots.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    setSortedPosts(roots);
  }, [allPosts]);

  const scrollToEnd = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [sortedPosts.length, scrollToEnd]);

  const renderItem = ({ item }: { item: ThreadPost }) => (
    <>
      <View style={styles.messageContainer}>
        <View style={styles.headerRow}>
          <Image
            source={item.user.avatar || require("../../../../assets/images/User.png")}
            style={styles.avatar}
          />
          <View style={styles.usernameContainer}>
            <Text style={styles.senderLabel}>{item.user.username}</Text>
          </View>
        </View>
        <View style={styles.bodyContainer}>
          <PostBody post={item} themeOverrides={{}} styleOverrides={chatBodyOverrides} />
          <PostCTA post={item} />
        </View>
      </View>
      <View style={styles.messageDivider} />
    </>
  );

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
        <View style={styles.composerContainer}>
          <ThreadComposer
            currentUser={currentUser}
            onPostCreated={scrollToEnd}
            styleOverrides={{ composerContainer: { backgroundColor: '#FAFAFA', paddingVertical: 8 } }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const chatBodyOverrides = StyleSheet.create({
  extraContentContainer: { marginVertical: 2 },
  threadItemText: { fontSize: 14, color: '#232324' },
});

const styles = StyleSheet.create({
  chatScreenContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  listContent: { paddingTop: 8, paddingHorizontal: 16, paddingBottom: 8 },
  messageContainer: { paddingVertical: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
  usernameContainer: { height: 36, justifyContent: 'center' },
  senderLabel: { fontSize: 12, fontWeight: '600', color: '#232324' },
  bodyContainer: { marginTop: 2, marginLeft: 8, marginRight: 6 },
  messageDivider: { height: 1, backgroundColor: '#EDEFF3', marginTop: 6 },
  composerContainer: { borderTopWidth: 1, borderTopColor: '#E0E0E0' },
});
