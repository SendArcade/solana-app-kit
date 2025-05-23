import { StyleSheet } from 'react-native';
import COLORS from '@/assets/colors';
import TYPOGRAPHY from '@/assets/typography';

// Function to create base styles for ChatComposer
export function getChatComposerBaseStyles() {
  return StyleSheet.create({
    composerContainer: {
      flexDirection: 'row',
      padding: 8,
      paddingBottom: 0,
      backgroundColor: COLORS.background,
      borderTopColor: COLORS.borderDarkColor,
      borderTopWidth: 1,
      alignItems: 'center',
      marginBottom: 0,
    },
    inputContainer: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: COLORS.darkerBackground,
      borderRadius: 24,
      paddingHorizontal: 12,
      paddingVertical: 6,
      minHeight: 40,
      alignItems: 'center',
    },
    composerInput: {
      flex: 1,
      fontSize: TYPOGRAPHY.size.md,
      fontWeight: TYPOGRAPHY.fontWeightToString(TYPOGRAPHY.regular),
      color: COLORS.white,
      padding: 0,
      margin: 0,
      textAlignVertical: 'center',
      fontFamily: TYPOGRAPHY.fontFamily,
      maxHeight: 100,
    },
    iconsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
    },
    iconButton: {
      padding: 6,
      marginLeft: 4,
    },
    sendButton: {
      width: 40, 
      height: 40,
      borderRadius: 20,
      backgroundColor: COLORS.brandBlue,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    disabledSendButton: {
      backgroundColor: COLORS.greyDark,
    },
    imagePreviewContainer: {
      position: 'relative',
      marginTop: 8,
      marginBottom: 4,
      width: 120,
      height: 120,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: COLORS.background,
    },
    imagePreview: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    removeImageButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeImageButtonText: {
      color: COLORS.white,
      fontSize: TYPOGRAPHY.size.sm,
    },
    composerTradePreview: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 4,
      padding: 8,
      borderRadius: 8,
      backgroundColor: COLORS.background,
      borderWidth: 1,
      borderColor: COLORS.borderDarkColor,
    },
    composerTradeImage: {
      width: 40,
      height: 40,
      borderRadius: 6,
      backgroundColor: COLORS.darkerBackground,
    },
    composerTradeName: {
      fontSize: TYPOGRAPHY.size.sm,
      fontWeight: TYPOGRAPHY.fontWeightToString(TYPOGRAPHY.semiBold),
      color: COLORS.white,
      fontFamily: TYPOGRAPHY.fontFamily,
    },
    composerTradePrice: {
      fontSize: 12,
      color: COLORS.greyMid,
    },
    composerTradeRemove: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: COLORS.darkerBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Modal styles for NFT listing
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '85%',
      maxHeight: '80%',
      backgroundColor: COLORS.background,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: TYPOGRAPHY.size.lg,
      fontWeight: TYPOGRAPHY.fontWeightToString(TYPOGRAPHY.semiBold),
      marginBottom: 12,
      color: COLORS.white,
      fontFamily: TYPOGRAPHY.fontFamily,
    },
    listingCard: {
      flexDirection: 'row',
      padding: 10,
      borderWidth: 1,
      borderColor: COLORS.borderDarkColor,
      borderRadius: 12,
      marginBottom: 8,
      alignItems: 'center',
      backgroundColor: COLORS.darkerBackground,
    },
    listingImage: {
      width: 50,
      height: 50,
      borderRadius: 8,
      backgroundColor: COLORS.background,
    },
    listingTextContainer: {
      flex: 1,
      marginLeft: 12,
    },
    listingName: {
      fontWeight: TYPOGRAPHY.fontWeightToString(TYPOGRAPHY.semiBold),
      fontSize: TYPOGRAPHY.size.md,
      color: COLORS.white,
      fontFamily: TYPOGRAPHY.fontFamily,
    },
    listingPrice: {
      marginTop: 2,
      fontSize: TYPOGRAPHY.size.sm,
      color: COLORS.greyLight,
      fontFamily: TYPOGRAPHY.fontFamily,
    },
    closeButton: {
      marginTop: 16,
      backgroundColor: COLORS.brandBlue,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 24,
    },
    closeButtonText: {
      color: COLORS.white,
      fontWeight: TYPOGRAPHY.fontWeightToString(TYPOGRAPHY.semiBold),
      fontFamily: TYPOGRAPHY.fontFamily,
    },
    attachmentPreviewsContainer: {
      width: '100%',
      marginBottom: 2,
    },
  });
} 