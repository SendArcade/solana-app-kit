// File: src/screens/TokenMillScreen/components/ExistingAddressesCard.tsx
import React from 'react';
import {View, Text, TextInput} from 'react-native';
import { ExistingAddressesCardProps } from '../types';
import { ExistingAddressCardStyles as styles } from './styles/ExistingAddressCard.style';

export default function ExistingAddressesCard({
  marketAddress,
  setMarketAddress,
  baseTokenMint,
  setBaseTokenMint,
  vestingPlanAddress,
  setVestingPlanAddress,
}: ExistingAddressesCardProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Existing Addresses (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Market Address"
        value={marketAddress}
        onChangeText={setMarketAddress}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Base Token Mint"
        value={baseTokenMint}
        onChangeText={setBaseTokenMint}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Vesting Plan Address"
        value={vestingPlanAddress}
        onChangeText={setVestingPlanAddress}
      />
    </View>
  );
}
