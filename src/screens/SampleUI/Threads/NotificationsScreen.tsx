import React from 'react';
import {View, Text, StyleSheet, SafeAreaView, Platform} from 'react-native';
import SwipeTabs from '../../../components/Profile/slider/slider';
import Profile from '../../../components/Profile/profile';

export default function NotificationsScreen() {
  return (
    <View
      style={[
        styles.container,
        Platform.OS === 'android' && styles.androidContainer,
      ]}>

      {/* <SwipeTabs/> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  androidContainer: {
    paddingTop: 30,
  },
  text: {fontSize: 20},
});
