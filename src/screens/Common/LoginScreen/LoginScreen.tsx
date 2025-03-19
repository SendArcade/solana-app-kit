// File: src/screens/LoginScreen/LoginScreen.tsx
import React, {useEffect, useRef} from 'react';
import {View, Animated, Text, Dimensions, Alert} from 'react-native';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';
import Icons from '../../../assets/svgs/index';
import styles from './LoginScreen.styles';
import {useDispatch} from 'react-redux';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import COLORS from '../../../assets/colors';
import EmbeddedWalletAuth from '../../../components/wallet/EmbeddedWallet';
import { loginSuccess } from '../../../state/auth/reducer';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

export default function LoginScreen() {
  const navigation = useAppNavigation();
  const dispatch = useDispatch();

  const solanaDotOpacity = useRef(new Animated.Value(0)).current;
  const splashTextOpacity = useRef(new Animated.Value(0)).current;
  const smileScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(solanaDotOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(splashTextOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(smileScale, {
        toValue: 0.8,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start();
  }, [solanaDotOpacity, splashTextOpacity, smileScale]);

  const handleWalletConnected = (info: {provider: string; address: string}) => {
    console.log('Wallet connected:', info);
    try {
      dispatch(
        loginSuccess({
          provider: info.provider as 'privy' | 'dynamic' | 'turnkey' | 'mwa',
          address: info.address,
        }),
      );
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error handling wallet connection:', error);
      Alert.alert(
        'Connection Error',
        'Successfully connected to wallet but encountered an error proceeding to the app.',
      );
    }
  };

  return (
    <View style={styles.container}>
      <Svg
        height={SCREEN_HEIGHT / 3}
        width={SCREEN_WIDTH}
        style={styles.gradient}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={COLORS.greyDark} stopOpacity="1" />
            <Stop offset="1" stopColor="white" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="" width="100%" height="100%" fill="url(#grad)" />
      </Svg>

      <View style={styles.svgContainer}>
        <Animated.View style={{opacity: solanaDotOpacity}}>
          <Icons.SolanaDot />
        </Animated.View>
        <Animated.View
          style={[styles.splashTextContainer, {opacity: splashTextOpacity}]}>
          <Icons.SplashText />
        </Animated.View>
        <Animated.View
          style={[
            styles.smileFaceContainer,
            {transform: [{scale: smileScale}]},
          ]}>
          <Icons.SmileFace />
        </Animated.View>
      </View>

      <EmbeddedWalletAuth onWalletConnected={handleWalletConnected} />

      <Text style={styles.agreementText}>
        by continuing, you agree to t&amp;c and privacy policy
      </Text>
    </View>
  );
}
