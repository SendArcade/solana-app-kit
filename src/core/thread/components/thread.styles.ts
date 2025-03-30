// FILE: src/components/thread/thread.styles.ts
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
    /* Post Header (username, handle) */
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

    /* Body/content area */
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

    /* CTA (PostCTA) */
    threadPostCTAContainer: {
      width: theme['--thread-cta-container-width'] as DimensionValue,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
      alignSelf: 'flex-end',
      justifyContent: 'flex-end',
    },
    threadPostCTAButton: {
      backgroundColor: '#1A1A1A',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      width: '100%',
      alignItems: 'center',
    },
    threadPostCTAButtonLabel: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },

    /* Additional styles for the trade modal */
    tradeModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    tradeModalContainer: {
      width: '80%',
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 20,
      alignItems: 'center',
    },
    tradeModalTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
    },
    tradeModeSelectorRow: {
      flexDirection: 'row',
      marginTop: 8,
    },
    tradeModeButton: {
      flex: 1,
      marginHorizontal: 2,
      padding: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    tradeConfirmButton: {
      backgroundColor: '#1d9bf0',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },

    /* NFT Listing styles */
    nftListingContainer: {
      marginTop: 8,
      padding: 8,
      backgroundColor: '#F9F9F9',
      borderRadius: 8,
    },
    nftListingCard: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#EEE',
      overflow: 'hidden',
      alignItems: 'center',
      padding: 8,
    },
    nftListingImageContainer: {
      width: 150,
      height: 150,
      backgroundColor: '#f0f0f0',
    },
    nftListingImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    nftListingPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    nftListingPlaceholderText: {
      color: '#999',
    },
    nftListingInfo: {
      marginTop: 8,
      alignItems: 'center',
    },
    nftListingName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
    },
    nftListingPrice: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
    },

    /* Composer trade preview */
    composerTradePreview: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      backgroundColor: '#F9F9F9',
      borderRadius: 8,
      marginVertical: 8,
    },
    composerTradeImage: {
      width: 50,
      height: 50,
      borderRadius: 4,
      backgroundColor: '#ddd',
    },
    composerTradeName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
    },
    composerTradePrice: {
      fontSize: 12,
      color: '#666',
    },
    composerTradeRemove: {
      backgroundColor: '#ff3b30',
      padding: 4,
      borderRadius: 4,
    },
    
    /* Migrated from ThreadComposer.tsx modalStyles */
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '85%',
      maxHeight: '80%',
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 16,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
    },
    listingCard: {
      flexDirection: 'row',
      padding: 8,
      borderWidth: 1,
      borderColor: '#eee',
      borderRadius: 8,
      marginBottom: 8,
      alignItems: 'center',
    },
    listingImage: {
      width: 40,
      height: 40,
      borderRadius: 4,
      backgroundColor: '#f0f0f0',
    },
    listingName: {
      fontWeight: '600',
      fontSize: 14,
      color: '#333',
    },
    listingPrice: {
      marginTop: 2,
      fontSize: 12,
      color: '#999',
    },
    closeButton: {
      marginTop: 12,
      backgroundColor: '#1d9bf0',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
    },
    closeButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    
    /* Migrated from PostCTA.tsx uiStyles */
    progressOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressContainer: {
      padding: 24,
      backgroundColor: '#333',
      borderRadius: 12,
      width: '80%',
      alignItems: 'center',
    },
    progressText: {
      marginTop: 10,
      color: '#fff',
      fontSize: 14,
      textAlign: 'center',
    },
    confirmOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    confirmContainer: {
      padding: 24,
      backgroundColor: '#333',
      borderRadius: 12,
      width: '80%',
      alignItems: 'center',
    },
    confirmText: {
      marginBottom: 20,
      color: '#fff',
      fontSize: 16,
      textAlign: 'center',
    },
    confirmButton: {
      backgroundColor: '#1d9bf0',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    confirmButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 15,
    },

    // Image preview in composer
    imagePreviewContainer: {
      marginTop: 12,
      marginBottom: 8,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: '#eaeaea',
    },
    imagePreview: {
      width: 160,
      height: 160,
      borderRadius: 12,
    },
    removeImageButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeImageButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
    },
  });

  // Merge userStyleSheet if provided
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

  // Merge explicit overrideStyles last
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
