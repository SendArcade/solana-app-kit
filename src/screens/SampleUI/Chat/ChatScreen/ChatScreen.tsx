import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useAppDispatch} from '../../../../hooks/useReduxHooks';
import {fetchAllPosts} from '../../../../state/thread/reducer';
import {RootState} from '../../../../state/store';
import {
  ThreadPost,
  ThreadUser,
} from '../../../../components/thread/thread.types';
import {PostBody, ThreadComposer} from '../../../../components/thread';
import PostCTA from '../../../../components/thread/PostCTA';
import {styles, androidStyles, chatBodyOverrides} from './ChatScreen.styles';

export default function ChatScreen() {
  const dispatch = useAppDispatch();
  const allPosts = useSelector((state: RootState) => state.thread.allPosts);
  const storedProfilePic = useSelector(
    (state: RootState) => state.auth.profilePicUrl,
  );
  const userWallet = useSelector((state: RootState) => state.auth.address);
  const [sortedPosts, setSortedPosts] = useState<ThreadPost[]>([]);
  const flatListRef = useRef<FlatList<any>>(null);

  const currentUser: ThreadUser = {
    id: userWallet || 'anonymous-user',
    username: 'Alice',
    handle: '@aliceSmith',
    verified: true,
    avatar: storedProfilePic
      ? {uri: storedProfilePic}
      : require('../../../../assets/images/User.png'),
  };

  // Fetch all posts on mount
  useEffect(() => {
    dispatch(fetchAllPosts());
  }, [dispatch]);

  useEffect(() => {
    const roots = allPosts.filter(p => !p.parentId);
    roots.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    setSortedPosts(roots);
  }, [allPosts]);

  const scrollToEnd = useCallback(() => {
    flatListRef.current?.scrollToEnd({animated: true});
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [sortedPosts.length, scrollToEnd]);

  const renderItem = ({item}: {item: ThreadPost}) => {
    const isSentByCurrentUser =
      userWallet && item.user.id.toLowerCase() === userWallet.toLowerCase();

    const avatarSource =
      isSentByCurrentUser && storedProfilePic
        ? {uri: storedProfilePic}
        : item.user.avatar
        ? typeof item.user.avatar === 'string'
          ? {uri: item.user.avatar}
          : item.user.avatar
        : require('../../../../assets/images/User.png');

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
          <PostCTA post={item} />

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
    </SafeAreaView>
  );
}
