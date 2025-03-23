import React from 'react';
import {View, Text, StyleSheet, SafeAreaView, TouchableOpacity} from 'react-native';
// import Tweet from '../../../components/tweet/tweet';
// import UserListing from '../../../components/userListing/userListing';
import SuggestionsCard from '../../../components/CoinDetails/suggestionsCard/suggestionsCard';
import { tweetsData } from '../../../mocks/tweets';
import {RootStackParamList} from '../../../navigation/RootNavigator';
import {StackNavigationProp} from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Home Screen</Text>
      {/* <SuggestionsCard/> */}
      {/* <UserListing/> */}
      {/* <Tweet/> */}
      <TouchableOpacity onPress={() => navigation.navigate('CoinDetailPage')}>
        <Text>Go To Coin Details</Text>
      </TouchableOpacity>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff'},
  text: {fontSize: 20},
});
