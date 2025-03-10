import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {useAuth} from '../../../hooks/useAuth';
import {useNavigation} from '@react-navigation/native';
import {styles} from './Modules.styles';

const sections = [
  {
    key: 'pumpfun',
    title: 'Pump Fun Screen',
    description:
      'Manage tokens, view balances, and execute buy/sell/swap actions seamlessly.',
    backgroundColor: '#C8E6C9', // light green
    navigateTo: 'Pumpfun',
  },
  {
    key: 'tokenmill',
    title: 'Token Mill',
    description:
      'Create and manage token markets, stake tokens, and design bonding curves.',
    backgroundColor: '#FFE0B2', // light orange
    navigateTo: 'TokenMill',
  },
  {
    key: 'nft',
    title: 'NFT Screen',
    description:
      'Browse, buy, and sell NFTs with integrated wallet support and listing functionality.',
    backgroundColor: '#E1BEE7', // light purple
    navigateTo: 'NftScreen',
  },
];

// Define additional Android-specific styles
const androidStyles = StyleSheet.create({
  safeArea: {
    paddingTop: 30,
  },
});

export default function ModuleScreen() {
  const {logout} = useAuth();
  const navigation = useNavigation();

  const handlePress = (section: any) => {
    if (section.navigateTo) {
      navigation.navigate(section.navigateTo as never);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        Platform.OS === 'android' && androidStyles.safeArea,
      ]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {sections.map(section => (
          <View
            key={section.key}
            style={[styles.card, {backgroundColor: section.backgroundColor}]}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardDescription}>{section.description}</Text>
            <TouchableOpacity
              style={styles.cardButton}
              onPress={() => handlePress(section)}>
              <Text
                style={styles.cardButtonText}>{`Go to ${section.title}`}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
