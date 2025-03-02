import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/SampleUI/Threads/HomeScreen';
import SearchScreen from '../screens/Common/SearchScreen/SearchScreen';

import Icons from '../assets/svgs';

import AnimatedTabIcon from './AnimatedTabIcon';
import FeedScreen from '../screens/SampleUI/Threads/FeedScreen/FeedScreen';
import NotificationsScreen from '../screens/SampleUI/Threads/NotificationsScreen';
import ProfileScreen from '../screens/SampleUI/Threads/ProfileScreen/ProfileScreen';

const Tab = createBottomTabNavigator();

const iconStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Feed"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: 'black',
        tabBarStyle: {
          paddingTop: 10,
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
        },
      }}>
      <Tab.Screen
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
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
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
        component={FeedScreen}
        options={{
          tabBarIcon: ({ focused, size }) => (
            <AnimatedTabIcon
              focused={focused}
              size={size * 1.4}
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
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ focused, size }) => (
            <AnimatedTabIcon
              focused={focused}
              size={size * 1}
              icon={
                Icons.NotifBell as React.ComponentType<{
                  width: number;
                  height: number;
                }>
              }
              iconSelected={
                Icons.NotifBellSelected as React.ComponentType<{
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
  );
}
