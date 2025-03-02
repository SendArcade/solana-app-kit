// File: src/screens/TokenMillScreen/components/FundMarketCard.tsx
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {Connection} from '@solana/web3.js';
import { fundMarket } from '../../services/tokenMill/tokenMillService';

interface Props {
  marketAddress: string;
  connection: Connection;
  publicKey: string;
  solanaWallet: any;
  setLoading: (val: boolean) => void;
}

export default function FundMarketCard({
  marketAddress,
  connection,
  publicKey,
  solanaWallet,
  setLoading,
}: Props) {
  const onPressFundMarket = async () => {
    try {
      setLoading(true);
      const provider = await solanaWallet.getProvider();
      const txSig = await fundMarket({
        marketAddress,
        userPublicKey: publicKey,
        connection,
        provider,
      });
      Alert.alert('Market Funded', `wSOL deposited.\nTx: ${txSig}`);
    } catch (err: any) {
      Alert.alert('Error funding market', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Fund Market Quote Token Account (wSOL)
      </Text>
      <TouchableOpacity style={styles.button} onPress={onPressFundMarket}>
        <Text style={styles.buttonText}>Fund Market (0.1 SOL)</Text>
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
