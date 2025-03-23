import React, {useEffect, useRef} from 'react';
import {View, TouchableOpacity, Animated, Easing} from 'react-native';
import Icons from '../../../assets/svgs/index';
import styles from './IntroScreen.styles';
import {useAppNavigation} from '../../../hooks/useAppNavigation';
import {getDynamicClient} from '../../../services/walletProviders/dynamic';

export default function IntroScreen() {
  const navigation = useAppNavigation();

  const solanaDotOpacity = useRef(new Animated.Value(0)).current;
  const splashTextOpacity = useRef(new Animated.Value(0)).current;
  const smileScale = useRef(new Animated.Value(0.5)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Check if user is already authenticated
    try {
      const client = getDynamicClient();
      const authUser = client?.auth?.authenticatedUser;
      
      if (authUser) {
        console.log('User already authenticated, skipping login screen');
        navigation.navigate('PlatformSelection' as never);
      }
    } catch (e) {
      console.log('Dynamic client not initialized yet:', e);
    }
  }, [navigation]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(solanaDotOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(splashTextOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(smileScale, {
        toValue: 0.8,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start();
  }, [solanaDotOpacity, splashTextOpacity, smileScale]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => {
      pulse.stop();
    };
  }, [buttonScale]);

  return (
    <View style={styles.container}>
      <View style={styles.svgContainer}>
        <Animated.View style={{opacity: solanaDotOpacity}}>
          <Icons.SolanaDot />
        </Animated.View>

        <Animated.View
          style={[
            styles.splashTextContainer,
            {
              opacity: splashTextOpacity,
            },
          ]}>
          <Icons.SplashText />
        </Animated.View>

        <Animated.View
          style={[
            styles.smileFaceContainer,
            {
              transform: [{scale: smileScale}],
            },
          ]}>
          <Icons.SmileFace />
        </Animated.View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.bottomRectContainer}
        onPress={() => {
          navigation.navigate('LoginOptions');
        }}>
        <Animated.View style={{transform: [{scale: buttonScale}]}}>
          <Icons.GettingStartedButton />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}
