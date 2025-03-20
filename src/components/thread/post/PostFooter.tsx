// FILE: src/components/thread/post/PostFooter.tsx

import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import Icons from '../../../assets/svgs';
import {createThreadStyles, getMergedTheme} from '../thread.styles';
import {ThreadPost, ThreadUser} from '../thread.types';
import {useAppDispatch, useAppSelector} from '../../../hooks/useReduxHooks';
import {addReactionAsync} from '../../../state/thread/reducer';
import RetweetModal from '../retweet/RetweetModal';
import { DEFAULT_IMAGES } from '../../../config/constants';

interface PostFooterProps {
  post: ThreadPost;
  onPressComment?: (post: ThreadPost) => void;
  themeOverrides?: Partial<Record<string, any>>;
  styleOverrides?: {[key: string]: object};
}

export default function PostFooter({
  post,
  onPressComment,
  themeOverrides,
  styleOverrides,
}: PostFooterProps) {
  // Local states for bookmark, reactions, and retweet modal.
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [showRetweetModal, setShowRetweetModal] = useState(false);

  // Grab user info from Redux
  const address = useAppSelector(state => state.auth.address);
  const username = useAppSelector(state => state.auth.username);
  const profilePicUrl = useAppSelector(state => state.auth.profilePicUrl);

  // Build a proper ThreadUser object for retweet
  const retweeterUser: ThreadUser = {
    id: address || 'anonymous-wallet',
    username: username || 'Anonymous',
    handle: address
      ? '@' + address.slice(0, 6) + '...' + address.slice(-4)
      : '@unknown',
    verified: false,
    avatar: profilePicUrl
      ? {uri: profilePicUrl}
      : DEFAULT_IMAGES.user,
  };

  const dispatch = useAppDispatch();

  // Instead of relying solely on the passed prop, subscribe to the updated post from Redux.
  const updatedPost =
    useAppSelector(state =>
      state.thread.allPosts.find(p => p.id === post.id),
    ) || post;

  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(mergedTheme, styleOverrides);

  const closeReactionBubble = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowReactions(false);
    });
  };

  useEffect(() => {
    if (!showReactions) return;
    // Additional outside-click logic can go here if needed
    return () => {};
  }, [showReactions]);

  const toggleBookmark = () => {
    setIsBookmarked(prev => !prev);
  };

  const handleSelectReaction = (emoji: string) => {
    if (post.id.startsWith('local-')) {
      Alert.alert(
        'Action not allowed',
        'You cannot add reactions to unsaved posts.',
      );
      return;
    }
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowReactions(false);
      dispatch(addReactionAsync({postId: post.id, reactionEmoji: emoji}));
    });
  };

  const handleShowReactions = () => {
    setShowReactions(true);
    // Animate in
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleOpenRetweetModal = () => {
    setShowRetweetModal(true);
  };

  // Render existing reactions
  const renderExistingReactions = () => {
    if (
      !updatedPost.reactions ||
      Object.keys(updatedPost.reactions).length === 0
    ) {
      return null;
    }
    return (
      <View style={reactionStyles.existingReactionsContainer}>
        {Object.entries(updatedPost.reactions).map(([emoji, count]) => (
          <View key={emoji} style={reactionStyles.reactionBadge}>
            <Text style={reactionStyles.reactionEmoji}>{emoji}</Text>
            <Text style={reactionStyles.reactionCount}>{count}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.footerContainer}>
      {/* Overlay to detect outside clicks on the reaction bubble */}
      {showReactions && (
        <TouchableWithoutFeedback onPress={closeReactionBubble}>
          <View style={reactionStyles.clickOutsideOverlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Display existing reactions */}
      {renderExistingReactions()}

      <View style={styles.itemIconsRow}>
        <View style={{flexDirection: 'row', gap: 16}}>
          {/* Comment icon */}
          <TouchableOpacity
            style={styles.itemLeftIcons}
            onPress={() => onPressComment && onPressComment(post)}>
            <Icons.CommentIdle width={20} height={20} />
            <Text style={styles.iconText}>{updatedPost.quoteCount || 0}</Text>
          </TouchableOpacity>

          {/* Retweet */}
          <View style={styles.itemLeftIcons}>
            <TouchableOpacity onPress={handleOpenRetweetModal}>
              <Icons.RetweetIdle width={20} height={20} />
            </TouchableOpacity>
            <Text style={styles.iconText}>{updatedPost.retweetCount || 0}</Text>
          </View>

          {/* Reaction icon */}
          <View style={styles.itemLeftIcons}>
            <TouchableOpacity onPress={handleShowReactions}>
              <Icons.ReactionIdle width={20} height={20} />
            </TouchableOpacity>
            <Text style={styles.iconText}>
              {updatedPost.reactionCount || 0}
            </Text>

            {/* Reaction bubble */}
            {showReactions && (
              <Animated.View
                style={[
                  reactionStyles.bubbleContainer,
                  {
                    transform: [{scale: scaleAnim}],
                    opacity: scaleAnim,
                  },
                ]}>
                <View style={reactionStyles.emojiRow}>
                  {['👍', '🚀', '❤️', '😂'].map(emoji => (
                    <TouchableOpacity
                      key={emoji}
                      style={reactionStyles.emojiButton}
                      onPress={() => handleSelectReaction(emoji)}>
                      <Text style={reactionStyles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={reactionStyles.bubbleArrow} />
              </Animated.View>
            )}
          </View>
        </View>

        {/* Right side icons */}
        <View style={styles.itemRightIcons}>
          {/* <Icons.GridIcon width={20} height={20} /> */}
          <TouchableOpacity onPress={toggleBookmark}>
            {isBookmarked ? (
              <Icons.BookmarkActive width={20} height={20} />
            ) : (
              <Icons.BookmarkIdle width={20} height={20} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Retweet Modal */}
      <RetweetModal
        visible={showRetweetModal}
        onClose={() => setShowRetweetModal(false)}
        retweetOf={post.id}
        currentUser={retweeterUser}
        headerText="Retweet"
        placeholderText="Add a comment (optional)"
        buttonText="Retweet"
        buttonTextWithContent="Quote Retweet"
      />
    </View>
  );
}

const reactionStyles = StyleSheet.create({
  clickOutsideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
  },
  bubbleContainer: {
    position: 'absolute',
    bottom: 25,
    left: -40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 100,
    maxWidth: 160,
  },
  bubbleArrow: {
    position: 'absolute',
    bottom: -6,
    left: '30%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#f0f0f0',
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emojiButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  emojiText: {
    fontSize: 18,
  },
  existingReactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
    justifyContent: 'flex-start',
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginLeft: 0,
    marginBottom: 4,
  },
  reactionEmoji: {
    fontSize: 13,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
