import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useAppNavigation} from '../hooks/useAppNavigation';
import COLORS from '../assets/colors';

const {width} = Dimensions.get('window');
const platforms = [
  {
    id: 'threads',
    name: 'Twitter Threads',
    icon: 'https://img.icons8.com/color/96/000000/twitter--v1.png',
    description:
      'Share crypto insights and Web3 discussions through engaging threads',
  },
  {
    id: 'insta',
    name: 'Instagram',
    icon: 'https://img.icons8.com/color/96/000000/instagram-new.png',
    description: 'Showcase your NFTs and share Web3 visual content',
  },
  {
    id: 'chats',
    name: 'Chats',
    icon: 'https://img.icons8.com/color/96/000000/chat--v1.png',
    description:
      'Direct messaging with crypto enthusiasts and Web3 communities',
  },
];

export default function PlatformSelectionScreen() {
  const navigation = useAppNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  interface Platform {
    id: string;
    name: string;
    icon: string;
    description: string;
  }

  const platforms: Platform[] = [
    {
      id: 'threads',
      name: 'Twitter Threads',
      icon: 'https://img.icons8.com/color/96/000000/twitter--v1.png',
      description:
        'Share crypto insights and Web3 discussions through engaging threads',
    },
    {
      id: 'insta',
      name: 'Instagram',
      icon: 'https://img.icons8.com/color/96/000000/instagram-new.png',
      description: 'Showcase your NFTs and share Web3 visual content',
    },
    {
      id: 'chats',
      name: 'Chats',
      icon: 'https://img.icons8.com/color/96/000000/chat--v1.png',
      description:
        'Direct messaging with crypto enthusiasts and Web3 communities',
    },
  ];

  const slideAnim = useRef(platforms.map(() => new Animated.Value(100))).current;
  const scaleAnim = useRef(platforms.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    platforms.forEach((_, index) => {
      Animated.timing(slideAnim[index], {
        toValue: 0,
        duration: 500,
        delay: 300 + index * 100,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handlePlatformSelection = (platformId: string): void => {
    navigation.navigate('MainTabs', {screen: 'Feed'});
  };

  const handlePressIn = (index: number): void => {
    Animated.spring(scaleAnim[index], {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = (index: number): void => {
    Animated.spring(scaleAnim[index], {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  return (
    <LinearGradient
      colors={['#808080', '#f0f0f0']}
      style={styles.gradientBackground}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Animated.Text style={[styles.welcomeText, {opacity: fadeAnim}]}>
            Choose Your Platform
          </Animated.Text>
          <Animated.Text style={[styles.subText, {opacity: fadeAnim}]}>
            Select how you want to connect
          </Animated.Text>
        </View>

        <View style={styles.platformContainer}>
          {platforms.map((platform, index) => (
            <Animated.View
              key={platform.id}
              style={[
                styles.platformCardContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    {translateY: slideAnim[index]},
                    {scale: scaleAnim[index]},
                  ],
                },
              ]}>
              <TouchableOpacity
                style={styles.platformCard}
                onPress={() => handlePlatformSelection(platform.id)}
                activeOpacity={0.9}
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}>
                <View style={styles.platformContent}>
                  <Image
                    source={{uri: platform.icon}}
                    style={styles.platformIcon}
                    defaultSource={{
                      uri: 'https://img.icons8.com/ios-filled/50/cccccc/image.png',
                    }}
                  />
                  <View style={styles.platformTextContainer}>
                    <Text style={styles.platformName}>{platform.name}</Text>
                    <Text style={styles.platformDescription}>
                      {platform.description}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subText: {
    fontSize: 18,
    color: '#fff',
  },
  platformContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  platformCardContainer: {
    marginBottom: 20,
    borderRadius: 20,
    // Enhanced shadow for iOS
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    // Enhanced elevation for Android
    elevation: 8,
  },
  platformCard: {
    borderRadius: 20,
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  platformContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  platformTextContainer: {
    flex: 1,
  },
  platformName: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  platformDescription: {
    fontSize: 16,
    color: COLORS.greyDark,
    opacity: 0.85,
  },
});
