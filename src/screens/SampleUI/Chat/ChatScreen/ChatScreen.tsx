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

// For demo purposes we use a mock current user.
// In your app, you'll get the current user details from auth state.


export default function ChatScreen() {
  const dispatch = useAppDispatch();
  const allPosts = useSelector((state: RootState) => state.thread.allPosts);
  const storedProfilePic = useSelector((state: RootState) => state.auth.profilePicUrl);
  const userWallet = useSelector((state: RootState) => state.auth.address);
  const [sortedPosts, setSortedPosts] = useState<ThreadPost[]>([]);
  const flatListRef = useRef<FlatList<any>>(null);
  const currentUser: ThreadUser = {
    id: userWallet || 'anonymous-user',   
    username: 'Alice',                  
    handle: '@aliceSmith',             
    verified: true,

    avatar: storedProfilePic
      ? { uri: storedProfilePic }
      : require('../../../../assets/images/User.png'),
  };

  // Fetch all posts on mount
  useEffect(() => {
    dispatch(fetchAllPosts());
  }, [dispatch]);

  // Filter out root posts and sort them (oldest first)
  useEffect(() => {
    const roots = allPosts.filter((p) => !p.parentId);
    roots.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    setSortedPosts(roots);
  }, [allPosts]);

  const scrollToEnd = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Scroll to end when new posts are added
  useEffect(() => {
    scrollToEnd();
  }, [sortedPosts.length, scrollToEnd]);

  // console.log(sortedPosts, "sortedPosts");

  // Render each chat message
  const renderItem = ({ item }: { item: ThreadPost }) => {
    console.log(item, "item");
    // If the post is from the current user, override its avatar with the latest profile picture from Redux.
    const avatarSource =
      userWallet &&
      item.user.id.toLowerCase() === userWallet.toLowerCase() &&
      storedProfilePic
        ? { uri: storedProfilePic }
        : item.user.avatar
        ? // Check if avatar is a string (URL) or already an image asset
          typeof item.user.avatar === 'string'
            ? { uri: item.user.avatar }
            : item.user.avatar
        : require('../../../../assets/images/User.png');

    return (
      <>
        <View style={styles.messageContainer}>
          <View style={styles.headerRow}>
            <Image source={avatarSource} style={styles.avatar} />
            <View style={styles.usernameContainer}>
              <Text style={styles.senderLabel}>{item.user.username}</Text>
            </View>
          </View>
          <View style={styles.bodyContainer}>
            <PostBody
              post={item}
              themeOverrides={{}}
              styleOverrides={chatBodyOverrides}
            />
            <PostCTA post={item} />
          </View>
        </View>
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
