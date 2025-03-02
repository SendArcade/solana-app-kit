// File: src/screens/TokenMillScreen/components/ExistingAddressesCard.tsx
import React from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';

interface Props {
  marketAddress: string;
  setMarketAddress: (addr: string) => void;
  baseTokenMint: string;
  setBaseTokenMint: (mint: string) => void;
  vestingPlanAddress: string;
  setVestingPlanAddress: (addr: string) => void;
}

export default function ExistingAddressesCard({
  marketAddress,
  setMarketAddress,
  baseTokenMint,
  setBaseTokenMint,
  vestingPlanAddress,
  setVestingPlanAddress,
}: Props) {
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

const styles = StyleSheet.create({
  section: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#2a2a2a',
  },
  input: {
    backgroundColor: '#fafafa',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 12,
  },
});
