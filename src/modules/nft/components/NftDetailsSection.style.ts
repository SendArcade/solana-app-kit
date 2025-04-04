import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f3f5',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f3f5',
  },
  placeholderText: {
    color: '#a0a0a0',
    fontSize: 12,
  },
  infoSection: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  nftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  collectionName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00C851',
    marginBottom: 4,
  },
  lastSale: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  rarityInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  collectionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
}); 