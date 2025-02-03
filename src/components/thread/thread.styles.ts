import {DimensionValue, StyleSheet} from 'react-native';
import {THREAD_DEFAULT_THEME} from './thread.theme';

export function getMergedTheme(
  userTheme?: Partial<typeof THREAD_DEFAULT_THEME>,
) {
  return {
    ...THREAD_DEFAULT_THEME,
    ...(userTheme || {}),
  };
}

/**
 * Complete set of thread-related styles, merged from:
 *   1) the default theme
 *   2) optional user-provided theme
 *   3) the base styles below
 *   4) optional userStyleSheet
 *   5) optional override styles
 */
export function createThreadStyles(
  theme: ReturnType<typeof getMergedTheme>,
  overrideStyles?: {[key: string]: object},
  userStyleSheet?: {[key: string]: object},
): {[key: string]: any} {
  const baseStyles: {[key: string]: any} = StyleSheet.create({
    threadRootContainer: {
      backgroundColor: 'white',
      flex: 1,
    },

    header: {
      width: '100%',
      backgroundColor: 'white',
      alignItems: 'center',
    },

    divider: {
      height: 1,
      backgroundColor: theme['--thread-border-color'],
      marginVertical: 4,
      width: '90%',
      alignSelf: 'center',
    },

    /* Composer */
    composerContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor: 'white',
    },
    composerAvatarContainer: {
      position: 'relative',
      width: theme['--thread-avatar-size'],
      height: theme['--thread-avatar-size'],
      marginRight: 8,
      backgroundColor: 'white',
    },
    composerAvatar: {
      width: '100%',
      height: '100%',
      borderRadius: theme['--thread-avatar-size'] / 2,
    },
    plusIconContainer: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      borderRadius: 25,
    },
    composerMiddle: {
      backgroundColor: 'white',
      flex: 1,
    },
    composerUsername: {
      fontWeight: '600',
      fontSize: theme['--thread-font-size'],
      marginBottom: 4,
      color: theme['--thread-text-primary'],
    },
    composerInput: {
      borderWidth: 0,
      borderRadius: 8,
      height: 40,
      paddingHorizontal: 2,
      marginBottom: 4,
      fontSize: theme['--thread-font-size'],
      color: theme['--thread-text-primary'],
    },
    iconsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    leftIcons: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
    },

    /* Thread List Container */
    threadListContainer: {
      paddingBottom: 20,
    },

    /* Single Post Item */
    threadItemContainer: {
      flex: 1,
      paddingHorizontal: theme['--thread-post-padding-horizontal'],
      paddingVertical: theme['--thread-post-padding-vertical'],
      borderBottomWidth: 1,
      borderBottomColor: theme['--thread-post-border-color'],
    },

    // a visual thread line for replies
    threadItemReplyLine: {
      borderLeftWidth: 1,
      borderLeftColor: theme['--thread-reply-line-color'],
      marginLeft: 12,
      paddingLeft: 12,
    },

    threadItemAvatar: {
      width: theme['--thread-avatar-size'],
      height: theme['--thread-avatar-size'],
      borderRadius: theme['--thread-avatar-size'] / 2,
      marginRight: 8,
    },

    replyingContainer: {
      backgroundColor: theme['--thread-replying-bg'],
      padding: theme['--thread-replying-padding'],
      marginVertical: theme['--thread-replying-margin-vertical'],
      borderRadius: theme['--thread-replying-border-radius'],
    },
    replyingText: {
      fontSize: 13,
      color: '#666',
    },
    replyingHandle: {
      color: theme['--thread-link-color'],
      fontWeight: '600',
    },

    /* Post header (username, handle) */
    threadItemHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    threadItemHeaderLeft: {
      flexDirection: 'row',
      flex: 1,
      alignItems: 'center',
    },
    threadItemUsername: {
      fontWeight: '600',
      fontSize: theme['--thread-font-size'],
      color: theme['--thread-text-primary'],
    },
    threadItemHandleTime: {
      fontSize: 12,
      color: '#999',
    },
    verifiedIcon: {
      marginLeft: 4,
    },

    /* Body / content area */
    extraContentContainer: {
      marginVertical: theme['--thread-section-spacing'],
      width: '100%',
      alignItems: 'flex-end',
    },
    threadItemText: {
      fontSize: theme['--thread-font-size'],
      color: theme['--thread-text-primary'],
      marginBottom: 6,
    },
    threadItemImage: {
      width: '70%',
      height: 120,
      borderRadius: 8,
      resizeMode: 'cover',
      marginTop: 4,
    },
    videoPlaceholder: {
      padding: 10,
      backgroundColor: '#EEE',
      borderRadius: 8,
      marginTop: 4,
    },
    videoPlaceholderText: {
      color: '#666',
      textAlign: 'center',
    },

    /* Poll styles */
    pollContainer: {
      backgroundColor: theme['--thread-poll-bg'],
      borderRadius: 8,
      padding: 8,
      marginTop: 4,
    },
    pollQuestion: {
      fontSize: theme['--thread-font-size'],
      fontWeight: '600',
      marginBottom: 6,
      color: theme['--thread-text-primary'],
    },
    pollOption: {
      backgroundColor: theme['--thread-poll-option-bg'],
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 4,
      marginBottom: 4,
    },
    pollOptionText: {
      fontSize: theme['--thread-font-size'],
      color: theme['--thread-text-primary'],
    },

    /* Footer (icon row + reply button) */
    footerContainer: {
      marginTop: 6,
      width: '100%',

      alignItems: 'flex-end',
    },
    itemIconsRow: {
      width: '84%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      gap: 16,
    },
    itemLeftIcons: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
    },
    itemRightIcons: {
      flexDirection: 'row',
      gap: 16,
      alignItems: 'center',
    },
    iconText: {
      fontSize: 12,
      color: theme['--thread-text-secondary'],
      marginLeft: -2,
    },

    /* ======================
       CTA (PostCTA)
       ====================== */
    threadPostCTAContainer: {
      width: theme['--thread-cta-container-width'] as DimensionValue, // Explicitly cast to DimensionValue
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
      alignSelf: 'flex-end',
    },
    threadPostCTAButton: {
      backgroundColor: '#2A2A2A',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    threadPostCTAButtonLabel: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    /* ======================
       TradeCard
       ====================== */
    tradeCardContainer: {
      width: '100%',
      gap: 10,
      padding: 12,
      marginBottom: 8,
      flex: 1,
    },
    tradeCardCombinedSides: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: theme['--thread-bg-secondary'],
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    tradeCardLeftSide: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tradeCardTokenImage: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 8,
    },
    tradeCardNamePriceContainer: {
      flexDirection: 'column',
    },
    tradeCardTokenName: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 2,
      color: theme['--thread-text-primary'],
    },
    tradeCardTokenPrice: {
      fontSize: 14,
      color: '#999999',
      fontWeight: '500',
    },
    tradeCardRightSide: {
      alignItems: 'flex-end',
    },
    tradeCardSolPrice: {
      color: '#32DE6B',
      fontSize: 14,
      fontWeight: '600',
    },
    tradeCardUsdPrice: {
      fontSize: 13,
      color: '#777',
    },
    tradeCardSwapIcon: {
      backgroundColor: theme['--thread-bg-secondary'],
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      left: '50%',
      top: '50%',
      borderWidth: 8,
      borderColor: '#FFFFFF',
      zIndex: 10,
      transform: [{translateX: -15}, {translateY: -15}],
    },
  });

  // 1. Merge userStyleSheet if provided
  if (userStyleSheet) {
    Object.keys(userStyleSheet).forEach(key => {
      if (baseStyles[key]) {
        baseStyles[key] = StyleSheet.flatten([
          baseStyles[key],
          userStyleSheet[key],
        ]);
      }
    });
  }

  // 2. Merge explicit overrideStyles last
  if (overrideStyles) {
    Object.keys(overrideStyles).forEach(key => {
      if (baseStyles[key]) {
        baseStyles[key] = StyleSheet.flatten([
          baseStyles[key],
          overrideStyles[key],
        ]);
      }
    });
  }

  return baseStyles;
}
