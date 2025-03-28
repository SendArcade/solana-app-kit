// File: src/screens/TokenMillScreen/components/FundUserCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Connection } from '@solana/web3.js';
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
  const [status, setStatus] = useState<string | null>(null);

  const onPressFund = async () => {
    try {
      setLoading(true);
      setStatus('Preparing transaction...');

      // Call the service with the full wallet object
      const txSig = await fundUserWithWSOL({
        solAmount: 0.5,
        connection,
        signerPublicKey: publicKey,
        solanaWallet, // Pass the full wallet object
        onStatusUpdate: (newStatus) => {
          console.log('Fund user status:', newStatus);
          setStatus(newStatus);
        }
      });

      setStatus('Transaction successful!');
      Alert.alert('User funded wSOL', `Deposited ~0.5 SOL.\nTx: ${txSig}`);
    } catch (err: any) {
      console.error('Fund user error:', err);
      // Don't show raw error in UI
      setStatus('Transaction failed');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setStatus(null);
      }, 2000);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Fund User wSOL</Text>
      {status && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.button, status ? { opacity: 0.7 } : {}]}
        onPress={onPressFund}
        disabled={!!status}>
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
  statusContainer: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  statusText: {
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
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
