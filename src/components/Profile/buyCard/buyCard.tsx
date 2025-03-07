import React, {useState, useRef} from 'react';
import {Image, Text, TouchableOpacity, View, Animated} from 'react-native';
import {styles} from './buyCard.style';
import Icons from '../../../assets/svgs/index';
import {DEFAULT_IMAGES} from '../../../config/constants';

/**
 * Define props for the BuyCard
 */
export interface BuyCardProps {
  /** The name of the token to buy (e.g. "$YASH") */
  tokenName?: string;
  /** A short description (e.g. "Sanctum Creator Coin") */
  description?: string;
  /** The token’s main image URL or a local require(...) */
  tokenImage?: any;
  /** Callback when user presses “Buy” */
  onBuyPress?: () => void;

  /** Optionally override container style */
  containerStyle?: object;
}

/**
 * A card component for purchasing creator coins
 */
const BuyCard: React.FC<BuyCardProps> = ({
  tokenName = '$YASH',
  description = 'Sanctum Creator Coin',
  tokenImage = DEFAULT_IMAGES.user5,
  onBuyPress,
  containerStyle,
}) => {
  const [isArrowRotated, setIsArrowRotated] = useState(false);
  const rotationAnim = useRef(new Animated.Value(0)).current;

  const handleArrowPress = () => {
    setIsArrowRotated(!isArrowRotated);
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
    <View style={[styles.container, containerStyle]}>
      {/* Buy card content */}
      <View style={styles.contentContainer}>
        {/* Image container */}
        <View style={styles.imgContainer}>
          <Image source={tokenImage} style={styles.img} resizeMode="cover" />
        </View>
        <View>
          <Text
            style={{
              fontWeight: '500',
              fontSize: 14,
            }}>{`Buy ${tokenName}`}</Text>
          <Text style={{fontWeight: '400', fontSize: 12, color: '#B7B7B7'}}>
            {description}
          </Text>
        </View>
      </View>

      {/* Buy button and arrow */}
      <View style={styles.buyButtonContainer}>
        <TouchableOpacity style={styles.buyButton} onPress={onBuyPress}>
          <Text style={styles.buyButtonText}>Buy</Text>
        </TouchableOpacity>

        {/* Arrow Button */}
        <TouchableOpacity onPress={handleArrowPress}>
          <Animated.View style={{transform: [{rotate: rotateInterpolate}]}}>
            <Icons.Arrow />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BuyCard;
