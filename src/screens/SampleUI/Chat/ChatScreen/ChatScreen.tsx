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
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useAppDispatch, useAppSelector } from '../../../../hooks/useReduxHooks';
import { fetchAllPosts } from '../../../../state/thread/reducer';
import { RootState } from '../../../../state/store';
import { ThreadPost, ThreadUser } from '../../../../core/thread/components/thread.types';

import PostCTA from '../../../../core/thread/components/post/PostCTA';
import RetweetPreview from '../../../../core/thread/components/retweet/RetweetPreview';
import RetweetModal from '../../../../core/thread/components/retweet/RetweetModal';
import { styles, androidStyles, chatBodyOverrides } from './ChatScreen.styles';
import { DEFAULT_IMAGES } from '../../../../config/constants';
import PostBody from '../../../../core/thread/components/post/PostBody';
import ThreadComposer from '../../../../core/thread/components/ThreadComposer';

// Get screen width for responsive sizing
const screenWidth = Dimensions.get('window').width;

// Helper function to check if post has a trade section
const hasTradeSection = (post: ThreadPost): boolean => {
  return post.sections.some(section => section.type === 'TEXT_TRADE');
};

// Helper function to check if post has an NFT listing section
const hasNftSection = (post: ThreadPost): boolean => {
  return post.sections.some(section => section.type === 'NFT_LISTING');
};

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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [listContentHeight, setListContentHeight] = useState(0);
  const [listLayoutHeight, setListLayoutHeight] = useState(0);

  // Track the currently visible messages for grouping messages by user
  const [visibleMessages, setVisibleMessages] = useState<{ [key: string]: boolean }>({});

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
    // Reset initial load flag when posts change
    setIsInitialLoad(true);
  }, [allPosts]);

  const scrollToEnd = useCallback(() => {
    if (sortedPosts.length > 0 && flatListRef.current) {
      // Only scroll if content height exceeds the layout height
      if (listContentHeight > listLayoutHeight) {
        flatListRef.current.scrollToEnd({ animated: false });
      }
    }
  }, [sortedPosts.length, listContentHeight, listLayoutHeight]);

  useEffect(() => {
    // Only scroll to end on initial render or when a new message is added
    if (isInitialLoad && sortedPosts.length > 0) {
      // Add a small delay to ensure the FlatList has fully rendered
      const timer = setTimeout(() => {
        scrollToEnd();
        setIsInitialLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sortedPosts.length, scrollToEnd, isInitialLoad]);

  /**
   * Open the quote reply modal for a given message (post)
   */
  const openQuoteReplyModal = (postId: string) => {
    setQuoteReplyPostId(postId);
    setQuoteReplyModalVisible(true);
  };

  /**
   * Check if this message is part of a series of messages from the same user
   */
  const isPartOfGroup = (index: number, post: ThreadPost): boolean => {
    if (index === 0) return false;

    const prevPost = sortedPosts[index - 1];
    // Messages are grouped if from the same user and within 5 minutes
    return (
      prevPost.user.id === post.user.id &&
      Math.abs(
        new Date(post.createdAt).getTime() -
        new Date(prevPost.createdAt).getTime()
      ) < 5 * 60 * 1000 // 5 minutes
    );
  };

  /**
   * Render each chat message bubble
   */
  const renderItem = ({ item, index }: { item: ThreadPost; index: number }) => {
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

    // Show the header row with avatar/name only for received messages or first message in a group
    const shouldShowHeader = !isSentByCurrentUser && !isPartOfGroup(index, item);

    // Add minor vertical spacing adjustment for grouped messages
    const isGroupedMessage = isPartOfGroup(index, item);

    // Check if this message contains a trade card or NFT
    const containsTradeCard = hasTradeSection(item);
    const containsNft = hasNftSection(item);

    // Adjust bubble width for messages with charts
    const specialContentBubbleStyle = containsTradeCard
      ? { maxWidth: Math.min(screenWidth * 0.85, 320) }
      : {};

    return (
      <View
        style={[
          styles.messageWrapper,
          isSentByCurrentUser ? styles.sentWrapper : styles.receivedWrapper,
          isGroupedMessage && { marginTop: 2 },
          (containsTradeCard || containsNft) && { maxWidth: '95%' }
        ]}>
        {shouldShowHeader && (
          <View style={styles.headerRow}>
            <Image source={avatarSource} style={styles.avatar} />
            <View style={styles.usernameContainer}>
              <Text style={styles.senderLabel}>{item.user.username}</Text>
            </View>
          </View>
        )}

        <View
          style={[
            styles.bubbleContainer,
            isSentByCurrentUser ? styles.sentBubble : styles.receivedBubble,
            specialContentBubbleStyle
          ]}>
          {/* Regular text content */}
          <PostBody
            post={item}
            themeOverrides={{}}
            styleOverrides={chatBodyOverrides}
          />

          {/* If this message is a quote reply, show the quoted post below */}
          {item.retweetOf && (
            <View style={styles.quotedContentContainer}>
              <RetweetPreview
                retweetOf={item.retweetOf}
                themeOverrides={{}}
                styleOverrides={{
                  threadItemText: { fontSize: 13 },
                  container: { padding: 0 }
                }}
              />
            </View>
          )}

          {/* Wrap trade cards in a container with proper styling */}
          {containsTradeCard && (
            <View style={styles.chartContainer}>
              <PostCTA
                post={item}
                styleOverrides={{
                  container: chatBodyOverrides.threadPostCTAContainer,
                  button: { padding: 8, height: 32 },
                  buttonLabel: { fontSize: 12 }
                }}
                {...{
                  showGraphForOutputToken: true,
                  userAvatar: avatarSource
                }}
              />
            </View>
          )}

          {/* Regular CTA buttons for non-trade posts */}
          {!containsTradeCard && containsNft && (
            <PostCTA
              post={item}
              styleOverrides={{
                container: chatBodyOverrides.threadPostCTAContainer,
                button: styles.tradeButton,
                buttonLabel: styles.tradeButtonText
              }}
            />
          )}

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

  const handleContentSizeChange = (width: number, height: number) => {
    setListContentHeight(height);

    // Scroll to end on first content size change for initial positioning
    if (isInitialLoad && height > 0) {
      scrollToEnd();
    }
  };

  const handleLayout = (event: any) => {
    setListLayoutHeight(event.nativeEvent.layout.height);

    // On initial layout, we'll prepare for scrolling
    if (isInitialLoad) {
      scrollToEnd();
    }
  };

  const handlePostCreated = () => {
    setIsInitialLoad(true); // Force scroll to bottom when new message created
    // Small delay to ensure the new post has been added to the list
    setTimeout(scrollToEnd, 200);
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: '#FFFFFF' },
        Platform.OS === 'android' && androidStyles.safeArea,
      ]}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.chatScreenContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <FlatList
          ref={flatListRef}
          data={sortedPosts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={handleContentSizeChange}
          onLayout={handleLayout}
          initialNumToRender={20}
          maxToRenderPerBatch={15}
          windowSize={15}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          removeClippedSubviews={false}
        />

        <View style={styles.composerContainer}>
          <ThreadComposer
            currentUser={currentUser}
            onPostCreated={handlePostCreated}
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
            setIsInitialLoad(true); // Force scroll to bottom when reply is added
          }}
          retweetOf={quoteReplyPostId}
          currentUser={currentUser}
          headerText="Reply"
          placeholderText="Add a reply to this message"
          buttonText="Send Reply"
        />
      )}
    </SafeAreaView>
  );
}
