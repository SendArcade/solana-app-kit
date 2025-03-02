import React from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';
import OtherProfile from '../../../components/otherProfile/otherProfile';
import SwipeTabs from '../../../components/slider/slider';


export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <OtherProfile/>
     
      {/* <SwipeTabs/> */}
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  text: {fontSize: 20},
});
