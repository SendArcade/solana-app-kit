import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, TouchableOpacity, View, StyleSheet, Animated, Dimensions, Image, Text, findNodeHandle, UIManager } from 'react-native';
import HomeScreen from '../screens/SampleUI/Threads/HomeScreen';
import { useNavigation, ParamListBase } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import Icons from '../assets/svgs';

import AnimatedTabIcon from './AnimatedTabIcon';
import FeedScreen from '../screens/SampleUI/Threads/FeedScreen/FeedScreen';
import NotificationsScreen from '../screens/SampleUI/Threads/NotificationsScreen';
import ProfileScreen from '../screens/SampleUI/Threads/ProfileScreen/ProfileScreen';
import ModuleScreen from '../screens/Common/ModulesScreen/Modules';
import ChatScreen from '../screens/SampleUI/Chat/ChatScreen/ChatScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// Calculate tab positions based on 4-tab layout - adjusted for accuracy
const TAB_WIDTH = width / 4;
const FEED_TAB_CENTER = TAB_WIDTH * 1.5; // Second tab center (0-based index)

// Adjust tooltip position based on screen size for better accuracy
let TOOLTIP_OFFSET = -75; // Default offset to center 150px tooltip
if (width < 375) {
  TOOLTIP_OFFSET = -70; // Smaller screens need less offset
} else if (width > 428) {
  TOOLTIP_OFFSET = -80; // Larger screens need more offset
}

const TOOLTIP_POSITION = FEED_TAB_CENTER + TOOLTIP_OFFSET;

const iconStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
};

// Platform icons matching PlatformSelectionScreen
const platformIcons = {
  threads: 'https://img.icons8.com/color/96/000000/twitter--v1.png',
  insta: 'https://img.icons8.com/color/96/000000/instagram-new.png',
  chats: 'https://img.icons8.com/color/96/000000/chat--v1.png',
};

export default function MainTabs() {
  const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>();
  const [expandedMenu, setExpandedMenu] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState<'threads' | 'insta' | 'chats'>('threads');
  const [showTooltip, setShowTooltip] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Add a refresh key to force re-render
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const tooltipAnimation = useRef(new Animated.Value(0)).current;

  // Show tooltip on initial render and hide after a few seconds
  useEffect(() => {
    // Animate tooltip in
    Animated.timing(tooltipAnimation, {
      toValue: 1,
      duration: 500,
      delay: 1000, // Wait a second before showing
      useNativeDriver: true,
    }).start();

    // Hide tooltip after 4 seconds
    const timer = setTimeout(() => {
      Animated.timing(tooltipAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setShowTooltip(false));
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Function to toggle platform selection menu
  const togglePlatformMenu = () => {
    // Only toggle menu visibility, don't touch anything related to rendering
    setExpandedMenu(!expandedMenu);

    // Hide tooltip if it's still visible when user activates the menu
    if (showTooltip) {
      setShowTooltip(false);
      Animated.timing(tooltipAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    Animated.spring(menuAnimation, {
      toValue: expandedMenu ? 0 : 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Function to select a platform and close menu with smoother animation
  const selectPlatform = (platform: 'threads' | 'insta' | 'chats') => {
    // Only update if platform changed
    if (platform !== currentPlatform) {
      setCurrentPlatform(platform);
      // Force a refresh by incrementing the key
      setRefreshKey(prevKey => prevKey + 1);
    }

    // Close the menu
    setExpandedMenu(false);
    Animated.spring(menuAnimation, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Create a stable component that doesn't rerender on menu toggle
  const StableFeedComponent = React.useMemo(() => {
    // This component is created once and captured in useMemo
    // It will only update when platformSwitchKey changes
    const Component = () => {
      switch (currentPlatform) {
        case 'threads':
          return <FeedScreen key={`threads-${refreshKey}`} />;
        case 'insta':
          return <FeedScreen key={`insta-${refreshKey}`} />;
        case 'chats':
          return <ChatScreen key={`chats-${refreshKey}`} />;
        default:
          return <FeedScreen key={`threads-${refreshKey}`} />;
      }
    };

    return Component;
  }, [currentPlatform, refreshKey]);

  // Calculate transformations for the menu with smoother curves
  const menuTranslateY = menuAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [50, 10, 0], // More nuanced movement
  });

  const menuScale = menuAnimation.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.92, 0.98, 1], // Smoother scaling
  });

  const menuOpacity = menuAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1], // Faster fade in
  });

  // Add a function to handle regular taps on the Feed button
  // const handleFeedPress = () => {
  //   // Use jumpTo instead of navigate for tab navigation
  //   navigation.navigate('Feed');
  // };

  return (
    <>
      {/* Platform Selection Menu - appears above tab bar */}
      <Animated.View
        style={[
          platformStyles.menuContainer,
          {
            transform: [
              { translateY: menuTranslateY },
              { scale: menuScale }
            ],
            opacity: menuOpacity,
          }
        ]}
        pointerEvents={expandedMenu ? 'auto' : 'none'}
      >
        <View style={platformStyles.menuContent}>
          {/* Twitter/Threads Option */}
          <TouchableOpacity
            style={[
              platformStyles.platformButton,
              currentPlatform === 'threads' && platformStyles.activePlatform
            ]}
            onPress={() => selectPlatform('threads')}
          >
            <Image
              source={{ uri: platformIcons.threads }}
              style={platformStyles.platformIcon}
            />
          </TouchableOpacity>

          {/* Instagram Option */}
          <TouchableOpacity
            style={[
              platformStyles.platformButton,
              currentPlatform === 'insta' && platformStyles.activePlatform
            ]}
            onPress={() => selectPlatform('insta')}
          >
            <Image
              source={{ uri: platformIcons.insta }}
              style={platformStyles.platformIcon}
            />
          </TouchableOpacity>

          {/* Chat Option */}
          <TouchableOpacity
            style={[
              platformStyles.platformButton,
              currentPlatform === 'chats' && platformStyles.activePlatform
            ]}
            onPress={() => selectPlatform('chats')}
          >
            <Image
              source={{ uri: platformIcons.chats }}
              style={platformStyles.platformIcon}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Tooltip for Feed button */}
      {showTooltip && (
        <Animated.View
          style={[
            platformStyles.tooltip,
            {
              opacity: tooltipAnimation,
              transform: [{
                translateY: tooltipAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                })
              }]
            }
          ]}
        >
          <View style={platformStyles.tooltipArrow} />
          <Text style={platformStyles.tooltipText}>
            Long press to change platform
          </Text>
        </Animated.View>
      )}

      <Tab.Navigator
        initialRouteName="Feed"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: 'black',
          tabBarStyle: {
            paddingTop: Platform.OS === 'android' ? 5 : 10,
            backgroundColor: '#ffffff',
            borderTopWidth: 0,
          },
        }}>
        {/* <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused, size }) => (
              <AnimatedTabIcon
                focused={focused}
                size={size * 1.4}
                icon={
                  Icons.HomeIcon as React.ComponentType<{
                    width: number;
                    height: number;
                  }>
                }
                iconSelected={
                  Icons.HomeIconSelected as React.ComponentType<{
                    width: number;
                    height: number;
                  }>
                }
                style={iconStyle}
              />
            ),
          }}
        /> */}
        <Tab.Screen
          name="Modules"
          component={ModuleScreen}
          options={{
            tabBarIcon: ({ focused, size }) => (
              <AnimatedTabIcon
                focused={focused}
                size={size * 1.4}
                icon={
                  Icons.ExploreIcon as React.ComponentType<{
                    width: number;
                    height: number;
                  }>
                }
                iconSelected={
                  Icons.ExploreIconSelected as React.ComponentType<{
                    width: number;
                    height: number;
                  }>
                }
                style={iconStyle}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Feed"
          component={StableFeedComponent}
          listeners={{
            tabLongPress: () => {
              togglePlatformMenu();
              return true;
            },
            tabPress: (e) => {
              if (expandedMenu) {
                e.preventDefault();
                setExpandedMenu(false);
                Animated.spring(menuAnimation, {
                  toValue: 0,
                  friction: 8,
                  tension: 40,
                  useNativeDriver: true,
                }).start();
              }
            }
          }}
          options={{
            tabBarIcon: ({ focused, size }) => (
              <AnimatedTabIcon
                focused={focused}
                size={size * 1.15}
                icon={
                  Icons.FeedIcon as React.ComponentType<{
                    width: number;
                    height: number;
                  }>
                }
                iconSelected={
                  Icons.FeedIconSelected as React.ComponentType<{
                    width: number;
                    height: number;
                  }>
                }
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 15 },
                  shadowOpacity: 0.6,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Search"
          component={NotificationsScreen}
          options={{
            tabBarIcon: ({ focused, size }) => (
              <AnimatedTabIcon
                focused={focused}
                size={size * 1}
                icon={
                  Icons.MagnifyingGlass as React.ComponentType<{
                    width: number;
                    height: number;
                  }>
                }
                iconSelected={
                  Icons.MagnifyingGlassSelected as React.ComponentType<{
                    width: number;
                    height: number;
                  }>
                }
                style={iconStyle}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ focused, size }) => (
              <AnimatedTabIcon
                focused={focused}
                size={size * 1.8}
                icon={
                  Icons.ProfileIcon as React.ComponentType<{
                    width: number;
                    height: number;
                  }>
                }
                iconSelected={
                  Icons.ProfileIconSelected as React.ComponentType<{
                    width: number;
                    height: number;
                  }>
                }
                style={iconStyle}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </>
  );
}

const platformStyles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    bottom: 90, // Position just above the tab bar
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
  },
  menuContent: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    width: width * 0.58, // Smaller width
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 7,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  platformButton: {
    width: 50, // Smaller buttons
    height: 50, // Smaller buttons
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    marginHorizontal: 4, // Less space between buttons
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  platformIcon: {
    width: 28, // Smaller icons
    height: 28, // Smaller icons
  },
  activePlatform: {
    backgroundColor: 'rgba(0, 153, 255, 0.08)',
    borderColor: 'rgba(0, 153, 255, 0.6)',
    transform: [{ scale: 1.06 }], // Slightly less scaling for subtlety
    shadowColor: '#0099ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  tooltip: {
    position: 'absolute',
    bottom: 75,
    left: TOOLTIP_POSITION,
    width: 150,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 8,
    padding: 8,
    zIndex: 1000,
    alignItems: 'center',
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -8,
    left: 75,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0,0,0,0.75)',
  },
});
