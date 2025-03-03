import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  searchInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
  },
  tokenItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEE',
  },
  tokenSymbol: {
    fontWeight: '600',
    fontSize: 14,
  },
  tokenName: {
    fontSize: 12,
    color: '#777',
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#1d9bf0',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
