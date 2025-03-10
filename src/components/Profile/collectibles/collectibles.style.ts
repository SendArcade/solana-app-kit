import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 6,
  },
  nftItem: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 14,
  },
  image: {
    width: '100%',
    height: '85%',
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  nftName: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  errorText: {
    fontSize: 14,
    color: '#c00',
    textAlign: 'center',
    marginTop: 40,
  },
});
