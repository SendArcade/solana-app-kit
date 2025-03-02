// File: src/screens/TokenMillScreen/components/StakingCard.tsx
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {Connection} from '@solana/web3.js';
import { stakeTokens } from '../../services/tokenMill/tokenMillService';

interface Props {
  marketAddress: string;
  connection: Connection;
  publicKey: string;
  solanaWallet: any;
  setLoading: (val: boolean) => void;
}

export default function StakingCard({
  marketAddress,
  connection,
  publicKey,
  solanaWallet,
  setLoading,
}: Props) {
  const onPressStake = async () => {
    if (!marketAddress) {
      Alert.alert('Error', 'You must enter or create a market before staking.');
      return;
    }
    try {
      setLoading(true);
      const provider = await solanaWallet.getProvider();
      const txSig = await stakeTokens({
        marketAddress,
        amount: 50000,
        userPublicKey: publicKey,
        connection,
        provider,
      });
      Alert.alert('Staked Successfully', `Tx: ${txSig}`);
    } catch (err: any) {
      Alert.alert('Stake Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Stake</Text>
      <TouchableOpacity style={styles.button} onPress={onPressStake}>
        <Text style={styles.buttonText}>Stake 50,000 tokens</Text>
      </TouchableOpacity>
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
    marginBottom: 12,
    color: '#2a2a2a',
  },
  button: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
