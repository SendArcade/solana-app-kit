// File: src/components/Profile/ProfileInfo/profileInfoTokenModal.style.ts
import {StyleSheet} from 'react-native';

export const tokenModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
    alignSelf: 'center',
    width: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#aaa',
    borderRadius: 6,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    color: '#c00',
    textAlign: 'center',
  },
  listContainer: {
    marginTop: 6,
  },
  tokenItem: {
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    padding: 10,
    marginVertical: 6,
  },
  tokenItemImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#ddd',
  },
  tokenInfo: {
    flex: 1,
    marginLeft: 8,
  },
  tokenName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    color: '#333',
  },
  tokenMint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  tokenBalance: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
  },
});
