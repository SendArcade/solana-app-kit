// FILE: src/screens/SampleUI/Threads/Chat/ChatScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useAppDispatch, useAppSelector } from '../../../../hooks/useReduxHooks';
import { fetchAllPosts } from '../../../../state/thread/reducer';
import { createRetweetAsync } from '../../../../state/thread/reducer';
import { RootState } from '../../../../state/store';
import { ThreadPost, ThreadUser } from '../../../../components/thread/thread.types';
import { PostBody, ThreadComposer } from '../../../../components/thread';
import PostCTA from '../../../../components/thread/post/PostCTA';
import RetweetPreview from '../../../../components/thread/retweet/RetweetPreview';
import RetweetModal from '../../../../components/thread/retweet/RetweetModal';
import { styles, androidStyles, chatBodyOverrides } from './ChatScreen.styles';
import { DEFAULT_IMAGES } from '../../../../config/constants';

export default function ChatScreen() {
  const dispatch = useAppDispatch();

  // Redux selectors for posts and auth info
  const allPosts = useSelector((state: RootState) => state.thread.allPosts);
  const storedProfilePic = useSelector((state: RootState) => state.auth.profilePicUrl);
  const userWallet = useSelector((state: RootState) => state.auth.address);
  const userName = useAppSelector(state => state.auth.username);

  // Build the current user object
  const currentUser: ThreadUser = {
    id: userWallet || 'anonymous-user',
    username: userName || 'Anonymous',
    handle: userWallet
      ? '@' + userWallet.slice(0, 6) + '...' + userWallet.slice(-4)
      : '@anonymous',
    verified: true,
    avatar: storedProfilePic ? { uri: storedProfilePic } : DEFAULT_IMAGES.user,
  };

  // Local state for sorted posts and modal for quote reply
  const [sortedPosts, setSortedPosts] = useState<ThreadPost[]>([]);
  const flatListRef = useRef<FlatList<any>>(null);
  const [quoteReplyModalVisible, setQuoteReplyModalVisible] = useState(false);
  const [quoteReplyPostId, setQuoteReplyPostId] = useState<string | null>(null);

  // Fetch posts on mount
  useEffect(() => {
    dispatch(fetchAllPosts());
  }, [dispatch]);

  // Sort root posts (messages) in ascending order by creation time
  useEffect(() => {
    const roots = allPosts.filter(p => !p.parentId);
    roots.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    setSortedPosts(roots);
  }, [allPosts]);

  const scrollToEnd = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [sortedPosts.length, scrollToEnd]);

  /**
   * Open the quote reply modal for a given message (post)
   */
  const openQuoteReplyModal = (postId: string) => {
    setQuoteReplyPostId(postId);
    setQuoteReplyModalVisible(true);
  };

  /**
   * Render each chat message bubble
   */
  const renderItem = ({ item }: { item: ThreadPost }) => {
    const isSentByCurrentUser =
      userWallet &&
      item.user.id.toLowerCase() === userWallet.toLowerCase();

    const avatarSource =
      isSentByCurrentUser && storedProfilePic
        ? { uri: storedProfilePic }
        : item.user.avatar
        ? typeof item.user.avatar === 'string'
          ? { uri: item.user.avatar }
          : item.user.avatar
        : DEFAULT_IMAGES.user;

    return (
      <View
        style={[
          styles.messageWrapper,
          isSentByCurrentUser ? styles.sentWrapper : styles.receivedWrapper,
        ]}>
        <View style={styles.headerRow}>
          <Image source={avatarSource} style={styles.avatar} />
          <View style={styles.usernameContainer}>
            <Text style={styles.senderLabel}>{item.user.username}</Text>
          </View>
        </View>

        <View
          style={[
            styles.bubbleContainer,
            isSentByCurrentUser ? styles.sentBubble : styles.receivedBubble,
          ]}>
          <PostBody
            post={item}
            themeOverrides={{}}
            styleOverrides={chatBodyOverrides}
          />

          {/* If this message is a quote reply, show the quoted post below */}
          {item.retweetOf && (
            <View style={{ marginTop: 8 }}>
              <RetweetPreview
                retweetOf={item.retweetOf}
                themeOverrides={{}}
                styleOverrides={{}}
              />
            </View>
          )}

          <PostCTA post={item} />

          {/* Quote Reply button (only for messages not sent by the current user) */}
          {!isSentByCurrentUser && (
            <TouchableOpacity
              onPress={() => openQuoteReplyModal(item.id)}
              style={styles.quoteReplyButton}>
              <Text style={styles.quoteReplyText}>Reply</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.timeStampText}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        {flex: 1, backgroundColor: '#FFFFFF'},
        Platform.OS === 'android' && androidStyles.safeArea,
      ]}>
      <KeyboardAvoidingView
        style={styles.chatScreenContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={flatListRef}
          data={sortedPosts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.composerContainer}>
          <ThreadComposer
            currentUser={currentUser}
            onPostCreated={scrollToEnd}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Quote Reply Modal */}
      {quoteReplyModalVisible && quoteReplyPostId && (
        <RetweetModal
          visible={quoteReplyModalVisible}
          onClose={() => {
            setQuoteReplyModalVisible(false);
            setQuoteReplyPostId(null);
            scrollToEnd();
          }}
          retweetOf={quoteReplyPostId}
          currentUser={currentUser}
          headerText="Reply"
          placeholderText="Add a reply to this message"
          buttonText="Reply"
        />
      )}
    </SafeAreaView>
  );
}
