import React from 'react';
import {View, Image, Text, FlatList} from 'react-native';
import {styles} from './collectibles.style';

/**
 * Represents a single NFT item
 */
export interface NftItem {
  mint: string;
  name: string;
  image: string;
  collection?: string;
}

/**
 * Props for the Collectibles component
 */
interface CollectiblesProps {
  /**
   * The list of NFTs to display
   */
  nfts: NftItem[];
  /**
   * An optional error message to display if there's a problem
   */
  error?: string | null;
  /**
   * Whether the list is loading
   */
  loading?: boolean;
}

/**
 * Renders a grid of NFT collectibles. If empty, shows fallback text.
 * For a large number of NFTs, you can convert to a FlatList with numColumns.
 */
const Collectibles: React.FC<CollectiblesProps> = ({nfts, error, loading}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading NFTs...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  if (nfts.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No Collectibles to show.</Text>
      </View>
    );
  }

  // If you prefer a grid approach with FlatList:
  return (
    <FlatList
      data={nfts}
      numColumns={2}
      keyExtractor={item => item.mint}
      columnWrapperStyle={{justifyContent: 'space-between'}}
      contentContainerStyle={{padding: 12}}
      renderItem={({item}) => {
        return (
          <View style={styles.nftItem}>
            <Image
              source={{uri: item.image}}
              style={styles.image}
              resizeMode="cover"
            />
            <Text style={styles.nftName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        );
      }}
    />
  );
};

export default Collectibles;
