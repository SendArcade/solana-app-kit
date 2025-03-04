import React from 'react';
import {View, Text, StyleSheet, SafeAreaView, Platform} from 'react-native';
import OtherProfile from '../../../components/otherProfile/otherProfile';
import SwipeTabs from '../../../components/slider/slider';

export default function NotificationsScreen() {
  return (
    <View
      style={[
        styles.container,
        Platform.OS === 'android' && styles.androidContainer,
      ]}>
      <OtherProfile />

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
