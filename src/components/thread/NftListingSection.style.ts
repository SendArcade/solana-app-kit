// FILE: src/components/thread/NftListingSection.style.ts

import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  container: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  card: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
    overflow: 'hidden',
    alignItems: 'center',
    padding: 8,
  },
  imageContainer: {
    width: 200,
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
  },
  infoSection: {
    marginTop: 12,
    alignItems: 'center',
    width: '90%',
  },
  nftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  collectionName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  lastSale: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  rarityInfo: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
