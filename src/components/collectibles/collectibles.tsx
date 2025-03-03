import React from 'react';
import { Image, View } from 'react-native';
import { styles } from './collectibles.style';

/**
 * A component that displays a grid of NFT collectibles
 * 
 * @component
 * @description
 * Collectibles is a component that showcases NFT collectibles in a grid layout.
 * The component features:
 * - Grid display of collectible images
 * - Responsive layout
 * - Consistent image sizing and spacing
 * 
 * Currently displays a fixed set of collectible images from the assets directory.
 * The layout is optimized for visual presentation of NFT artwork.
 * 
 * @example
 * ```tsx
 * <Collectibles />
 * ```
 * 
 * Note: Future iterations could include:
 * - Dynamic loading of collectibles
 * - Grid customization options
 * - Interactive features for each collectible
 * - Loading states and error handling
 */
const Collectibles = () => {
  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/Collectibles.png')} style={styles.image} />
      <Image source={require('../../assets/images/Collectibles2.png')} style={styles.image} />
      <Image source={require('../../assets/images/Collectibles1.png')} style={styles.image} />
      <Image source={require('../../assets/images/Collectibles3.png')} style={styles.image} />
    </View>
  );
};

export default Collectibles;
