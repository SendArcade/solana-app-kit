import {StyleSheet, Platform} from 'react-native';

export default StyleSheet.create({
  /** Main Modal / Container styles */
  flexFill: {
    flex: 1,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  centeredWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentContainer: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },

  /** Header styles */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E1E1E',
    letterSpacing: -0.5,
  },
  headerClose: {
    padding: 6,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    height: 28,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    lineHeight: 18,
  },

  /** Tab row styles */
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  tabButtonTextActive: {
    color: '#1D1D1F',
  },

  /** Token row and selectors */
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#F9F9FB',
    borderRadius: 20,
    padding: 16,
  },
  tokenColumn: {
    alignItems: 'flex-start',
    flex: 1,
  },
  tokenSelector: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    minWidth: 100,
    justifyContent: 'center',
  },
  tokenSelectorText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    width: 40,
    height: 40,
    backgroundColor: '#FFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  arrowText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3B82F6',
  },

  /** Text inputs and labels */
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  textInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    color: '#1D1D1F',
    marginBottom: 20,
    backgroundColor: '#FFF',
  },

  /** Buttons & loaders */
  swapButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    marginBottom: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  swapButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  activityLoader: {
    marginTop: 16,
    marginBottom: 10,
  },

  /** Tab content wrapper */
  fullWidthScroll: {
    width: '100%',
  },
  tabContentContainer: {
    width: '100%',
  },

  /** Result & error messages */
  resultText: {
    marginTop: 20,
    fontSize: 15,
    color: '#10B981',
    textAlign: 'center',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 20,
    fontSize: 15,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '600',
  },

  /**
   * Confirmation ("Share your trade?") Modal Styles
   */
  sharePromptBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sharePromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sharePromptBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  sharePromptTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#1D1D1F',
    letterSpacing: -0.5,
  },
  sharePromptDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  sharePromptButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sharePromptBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  sharePromptBtnCancel: {
    backgroundColor: '#F1F1F3',
  },
  sharePromptBtnConfirm: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  sharePromptBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
});
