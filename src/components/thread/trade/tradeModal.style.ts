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
    borderRadius: 12,
    padding: 16,
  },

  /** Header styles */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  headerClose: {
    padding: 4,
  },
  headerCloseText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#999',
  },

  /** Tab row styles */
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: '#F2F2F2',
    marginHorizontal: 5,
  },
  tabButtonActive: {
    backgroundColor: '#4A90E2',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tabButtonTextActive: {
    color: '#FFF',
  },

  /** Token row and selectors */
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  tokenColumn: {
    alignItems: 'center',
    flex: 1,
  },
  tokenSelector: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA',
  },
  tokenSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A90E2',
  },

  /** Text inputs and labels */
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  textInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
  },

  /** Buttons & loaders */
  swapButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    marginBottom: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  swapButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  activityLoader: {
    marginTop: 16,
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
    fontSize: 16,
    color: 'green',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
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
    borderRadius: 16,
    padding: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sharePromptTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  sharePromptDescription: {
    fontSize: 15,
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  sharePromptButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sharePromptBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  sharePromptBtnCancel: {
    backgroundColor: '#bbb',
  },
  sharePromptBtnConfirm: {
    backgroundColor: '#1d9bf0',
  },
  sharePromptBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
