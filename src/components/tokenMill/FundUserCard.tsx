// File: src/screens/TokenMillScreen/components/FundUserCard.tsx
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {Connection} from '@solana/web3.js';
import { fundUserWithWSOL } from '../../services/tokenMill/tokenMillService';
import { StandardWallet } from '../../hooks/useAuth';

interface Props {
  connection: Connection;
  publicKey: string;
  solanaWallet: StandardWallet | any;  // Can be StandardWallet or legacy wallet
  setLoading: (val: boolean) => void;
}

export default function FundUserCard({
  connection,
  publicKey,
  solanaWallet,
  setLoading,
}: Props) {
  const onPressFund = async () => {
    try {
      setLoading(true);
      
      // Call the service with the full wallet object
      const txSig = await fundUserWithWSOL({
        solAmount: 0.5,
        connection,
        signerPublicKey: publicKey,
        solanaWallet, // Pass the full wallet object
      });
      Alert.alert('User funded wSOL', `Deposited ~0.5 SOL.\nTx: ${txSig}`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Fund User wSOL</Text>
      <TouchableOpacity style={styles.button} onPress={onPressFund}>
        <Text style={styles.buttonText}>Fund User with 0.5 SOL - wSOL</Text>
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
