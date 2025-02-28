import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useAuth} from '../hooks/useAuth';
import {useNavigation} from '@react-navigation/native';

export default function SearchScreen() {
  const {logout} = useAuth(); // no parameter needed now
  const navigation = useNavigation();

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>Search Screen</Text>
      <TouchableOpacity
        onPress={logout}
        style={{
          marginTop: 20,
          padding: 10,
          backgroundColor: '#ccc',
          borderRadius: 5,
        }}>
        <Text>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Blink' as never)}
        style={{
          marginTop: 20,
          padding: 10,
          backgroundColor: '#007bff',
          borderRadius: 5,
        }}>
        <Text style={{color: '#fff'}}>Go to Blink Screen</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Pumpfun' as never)}
        style={{
          marginTop: 20,
          padding: 10,
          backgroundColor: '#007bff',
          borderRadius: 5,
        }}>
        <Text style={{color: '#fff'}}>Go to Pump fun Screen</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('TokenMill' as never)}
        style={{
          marginTop: 20,
          padding: 10,
          backgroundColor: '#FF7700',
          borderRadius: 5,
        }}
      >
        <Text style={{ color: '#fff' }}>Go to Token Mill</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.nftButton}
        onPress={() => navigation.navigate('NftScreen' as never)} 
      >
        <Text style={styles.nftButtonText}>Go to NFT Screen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: 'white', 
    padding: 16,
  },
  title: {
    fontSize: 20, 
    fontWeight: 'bold',
  },
  nftButton: {
    marginTop: 20,
    backgroundColor: '#32D4DE',
    padding: 12,
    borderRadius: 8,
  },
  nftButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});