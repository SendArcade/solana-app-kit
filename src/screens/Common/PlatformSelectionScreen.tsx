import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import COLORS from '../../assets/colors';

const { width } = Dimensions.get('window');

export default function PlatformSelectionScreen() {
  const navigation = useAppNavigation();

  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const slideAnim = useRef(platforms.map(() => new Animated.Value(50))).current;
  const scaleAnim = useRef(platforms.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    // Fade in the entire screen header
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Slide each platform card up with a staggered effect
    platforms.forEach((_, index) => {
      Animated.timing(slideAnim[index], {
        toValue: 0,
        duration: 450,
        delay: 300 + index * 100,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handlePlatformSelection = (platformId: string): void => {
    if (platformId === 'chats') {
      navigation.navigate('ChatScreen' as never);
    } else {
      navigation.navigate('MainTabs');
    }
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
      // A bolder, more modern gradient background
      colors={['#2C5364', '#203A43', '#0F2027']}
      style={styles.gradientBackground}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View
          style={[
            styles.header,
            Platform.OS === 'android' && styles.androidHeader,
          ]}>
          <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
            Choose Your Platform
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
            Select how you want to connect
          </Animated.Text>
        </View>

        {/* Platforms List */}
        <View style={styles.platformContainer}>
          {platforms.map((platform, index) => (
            <Animated.View
              key={platform.id}
              style={[
                styles.platformCardWrapper,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim[index] },
                    { scale: scaleAnim[index] },
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
                    source={{ uri: platform.icon }}
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

  /* Header */
  header: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  androidHeader: {
    paddingTop: 70, // Additional padding for Android devices
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
  },

  /* Platform Cards */
  platformContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  platformCardWrapper: {
    marginBottom: 20,
    borderRadius: 16,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    // Elevation for Android
    elevation: 8,
  },
  platformCard: {
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 20,
  },
  platformContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  platformTextContainer: {
    flex: 1,
  },
  platformName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.black || '#333',
    marginBottom: 4,
  },
  platformDescription: {
    fontSize: 14,
    color: COLORS.greyDark || '#666',
    lineHeight: 20,
  },
});
