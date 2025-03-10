import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  searchInput: {
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
  tokenItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tokenItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEE',
  },
  tokenTextContainer: {
    marginLeft: 12,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tokenName: {
    fontSize: 14,
    color: '#777',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
