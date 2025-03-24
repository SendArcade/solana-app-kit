import {StyleSheet, Platform, Dimensions} from 'react-native';

const {width, height} = Dimensions.get('window');

export default StyleSheet.create({
  /** Main Modal / Container styles */
  flexFill: {
    flex: 1,
  },
  darkOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  centeredWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentContainer: {
    backgroundColor: 'white',
    width: '92%',
    maxWidth: 420,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    maxHeight: Platform.OS === 'ios' ? height * 0.85 : height * 0.8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  /** Header styles */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerClose: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  headerCloseText: {
    fontSize: 18,
    color: '#4B5563',
    lineHeight: 18,
  },

  /** Tab row styles */
  tabRow: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    fontWeight: '600',
    color: '#3871DD',
  },

  /** Tab content wrapper */
  fullWidthScroll: {
    width: '100%',
    paddingBottom: 16,
  },
  tabContentContainer: {
    paddingVertical: 8,
  },

  /** Token row and selectors */
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  tokenColumn: {
    flex: 1,
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  arrowText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3871DD',
  },
  tokenSelector: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  tokenSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  tokenIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  chevronDown: {
    width: 16,
    height: 16,
    opacity: 0.5,
  },
  tokenSelectorInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /** Text inputs and labels */
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFF',
  },

  /** Buttons & loaders */
  swapButton: {
    backgroundColor: '#3871DD',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#3871DD',
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  swapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  activityLoader: {
    marginVertical: 20,
  },

  /** Result & error messages */
  resultText: {
    color: '#10B981',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },

  /**
   * Confirmation ("Share your trade?") Modal Styles
   */
  sharePromptBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  sharePromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharePromptBox: {
    backgroundColor: 'white',
    width: '85%',
    borderRadius: 16,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  sharePromptTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#111827',
  },
  sharePromptDescription: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  sharePromptButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sharePromptBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  sharePromptBtnCancel: {
    backgroundColor: '#F3F4F6',
  },
  sharePromptBtnConfirm: {
    backgroundColor: '#3871DD',
    ...Platform.select({
      ios: {
        shadowColor: '#3871DD',
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sharePromptBtnText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
  },
  sharePromptConfirmText: {
    color: '#FFF',
  },

  // Past swaps tab
  pastSwapsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    width: '100%',
    height: Platform.OS === 'ios' ? height * 0.45 : height * 0.4,
    maxHeight: 450,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pastSwapsContent: {
    flex: 1,
    paddingBottom: 8,
  },
  swapsListContainer: {
    flex: 1,
  },
  pastSwapsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pastSwapsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  refreshingOverlay: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletNotConnected: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    margin: 10,
  },
  walletNotConnectedText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 12,
  },
  connectWalletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#3871DD',
    textAlign: 'center',
  },
  swapItemContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptySwapsList: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptySwapsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3871DD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptySwapsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySwapsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  swapsList: {
    paddingBottom: 16,
  },
  
  // Input amount section
  amountInputContainer: {
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 8,
  },
  maxButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  maxButtonText: {
    color: '#3871DD',
    fontWeight: '600',
    fontSize: 14,
  },
  amountUsdValue: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  
  // Transaction history tab
  txHistoryHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  txSignatureInputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  pasteButtonText: {
    color: '#3871DD',
    fontWeight: '600',
    marginLeft: 4,
  },
  txDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
});
