import React, {useState, useRef, useEffect} from 'react';
import {
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  TouchableWithoutFeedback
} from 'react-native';
import Icons from '../../assets/svgs';
import {createThreadStyles, getMergedTheme} from './thread.styles';
import {ThreadPost} from './thread.types';
import {useAppDispatch} from '../../hooks/useReduxHooks';
import {addReactionAsync} from '../../state/thread/reducer';

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
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  // Animation value for the reaction bubble
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const dispatch = useAppDispatch();

  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(mergedTheme, styleOverrides);

  // Close the reaction bubble
  const closeReactionBubble = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowReactions(false);
    });
  };

  // Handle clicks outside the reaction bubble
  useEffect(() => {
    if (!showReactions) return;
    
    // Add event listener for any touches outside the bubble
    const handleOutsideClick = () => {
      closeReactionBubble();
    };
    
    return () => {
      // Cleanup
    };
  }, [showReactions]);

  const toggleBookmark = () => {
    setIsBookmarked(prev => !prev);
  };

  // Triggered when user selects an emoji
  const handleSelectReaction = (emoji: string) => {
    // Animate out
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowReactions(false);
      dispatch(addReactionAsync({ postId: post.id, reactionEmoji: emoji }));
    });
  };

  // Show the reaction bubble
  const handleShowReactions = () => {
    setShowReactions(true);
    // Animate in
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Render existing reactions
  const renderExistingReactions = () => {
    if (!post.reactions || Object.keys(post.reactions).length === 0) {
      return null;
    }
    
    return (
      <View style={reactionStyles.existingReactionsContainer}>
        {Object.entries(post.reactions).map(([emoji, count]) => (
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
      {/* Overlay to detect outside clicks */}
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
            <Text style={styles.iconText}>{post.quoteCount || 0}</Text>
          </TouchableOpacity>

          {/* Retweet */}
          <View style={styles.itemLeftIcons}>
            <Icons.RetweetIdle width={20} height={20} />
            <Text style={styles.iconText}>{post.retweetCount || 0}</Text>
          </View>

          {/* Reaction icon */}
          <View style={styles.itemLeftIcons}>
            <TouchableOpacity
              onPress={handleShowReactions}>
              <Icons.ReactionIdle width={20} height={20} />
            </TouchableOpacity>
            <Text style={styles.iconText}>
              {post.reactionCount || 0}
            </Text>
            
            {/* Smaller, light grey WhatsApp-style reaction bubble */}
            {showReactions && (
              <Animated.View 
                style={[
                  reactionStyles.bubbleContainer,
                  {
                    transform: [{ scale: scaleAnim }],
                    opacity: scaleAnim
                  }
                ]}>
                <View style={reactionStyles.emojiRow}>
                  {['👍','🚀','❤️','😂',].map((emoji) => (
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
          <Icons.GridIcon width={20} height={20} />
          <TouchableOpacity onPress={toggleBookmark}>
            {isBookmarked ? (
              <Icons.BookmarkActive width={20} height={20} />
            ) : (
              <Icons.BookmarkIdle width={20} height={20} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const reactionStyles = StyleSheet.create({
  // Overlay for detecting clicks outside the bubble
  clickOutsideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
  },
  // Smaller, light grey WhatsApp-style bubble for reactions
  bubbleContainer: {
    position: 'absolute',
    bottom: 25, // Position above the icons
    left: -40, // Center over the reaction icon
    backgroundColor: '#f0f0f0', // Light grey background
    borderRadius: 20,
    padding: 6, // Smaller padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 100,
    maxWidth: 160, // Limit the width
  },
  bubbleArrow: {
    position: 'absolute',
    bottom: -6, // Smaller arrow
    left: '30%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6, // Smaller arrow
    borderRightWidth: 6, // Smaller arrow
    borderTopWidth: 6, // Smaller arrow
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#f0f0f0', // Match the bubble color
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emojiButton: {
    paddingHorizontal: 6, // Smaller padding
    paddingVertical: 4, // Smaller padding
  },
  emojiText: {
    fontSize: 18, // Smaller emoji
  },
  // Existing reactions display
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
