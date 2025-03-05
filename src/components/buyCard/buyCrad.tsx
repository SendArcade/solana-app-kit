import React, { useState, useRef } from 'react';
import { Image, Text, TouchableOpacity, View, Animated } from 'react-native';
import { styles } from './buyCard.style';
import Icons from '../../assets/svgs/index';
import { DEFAULT_IMAGES } from '../../config/constants';

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
