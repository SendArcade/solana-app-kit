import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function SearchScreen() {
  // Use the same auth provider (e.g. "privy") as in the login flow
  const {logout} = useAuth('privy');

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
    </View>
  );
}
