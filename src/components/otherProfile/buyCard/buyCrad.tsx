import React, { useState, useRef } from 'react';
import { Image, Text, TouchableOpacity, View, Animated } from 'react-native';
import { styles } from './buyCard.style';
import Icons from '../../../assets/svgs/index';
import { DEFAULT_IMAGES } from '../../../config/constants';

/**
 * A card component for purchasing creator coins
 * 
 * @component
 * @description
 * BuyCard is a component that displays information about a creator's coin
 * and provides purchase functionality. Features include:
 * - Creator profile image display
 * - Coin name and description
 * - Buy button for direct purchase
 * - Animated expandable arrow for additional information
 * 
 * The component includes smooth animations for the arrow rotation and
 * maintains its own state for the expanded/collapsed view.
 * 
 * @example
 * ```tsx
 * <BuyCard />
 * ```
 * 
 * Note: Currently uses hardcoded values for the Yash coin.
 * Future iterations could accept props for:
 * - Creator information
 * - Coin details
 * - Buy action callback
 */
const BuyCard = () => {
  const [isArrowRotated, setIsArrowRotated] = useState(false);
  const rotationAnim = useRef(new Animated.Value(0)).current;

  const handleArrowPress = () => {
    setIsArrowRotated(!isArrowRotated);

    // Animate rotation
    Animated.timing(rotationAnim, {
      toValue: isArrowRotated ? 0 : 1, 
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const rotateInterpolate = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'], 
  });

  return (
    <View style={styles.container}>
      {/* Buy card content */}
      <View style={styles.contentContainer}>
        {/* Image container */}
        <View style={styles.imgContainer}>
          <Image
            source={DEFAULT_IMAGES.user5}
            style={styles.img}
            resizeMode="cover"
          />
        </View>
        <View>
          <Text style={{ fontWeight: '500', fontSize: 14 }}>Buy $YASH</Text>
          <Text style={{ fontWeight: '400', fontSize: 12, color: '#B7B7B7' }}>
            Sanctum Creator Coin
          </Text>
        </View>
      </View>

      {/* Buy button and arrow */}
      <View style={styles.buyButtonContainer}>
        <TouchableOpacity style={styles.buyButton}>
          <Text style={styles.buyButtonText}>Buy</Text>
        </TouchableOpacity>

        {/* Arrow Button */}
        <TouchableOpacity onPress={handleArrowPress}>
          <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
            <Icons.Arrow />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BuyCard;
