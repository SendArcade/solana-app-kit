// File: src/screens/TokenMillScreen/components/StakingCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Connection } from '@solana/web3.js';
import { stakeTokens } from '../../services/tokenMill/tokenMillService';
import { StandardWallet } from '../../hooks/useAuth';

interface Props {
  marketAddress: string;
  connection: Connection;
  publicKey: string;
  solanaWallet: StandardWallet | any;
  setLoading: (val: boolean) => void;
}

export default function StakingCard({
  marketAddress,
  connection,
  publicKey,
  solanaWallet,
  setLoading,
}: Props) {
  const [status, setStatus] = useState<string | null>(null);

  const onPressStake = async () => {
    if (!marketAddress) {
      Alert.alert('No market', 'Please enter or create a market first!');
      return;
    }
    try {
      setLoading(true);
      setStatus('Preparing staking transaction...');

      const txSig = await stakeTokens({
        marketAddress,
        amount: 100,
        userPublicKey: publicKey,
        connection,
        solanaWallet,
        onStatusUpdate: (newStatus) => {
          console.log('Staking status:', newStatus);
          setStatus(newStatus);
        }
      });

      setStatus('Tokens staked successfully!');
      Alert.alert('Staking Complete', `Tx: ${txSig}`);
    } catch (err: any) {
      console.error('Staking error:', err);
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
      <Text style={styles.sectionTitle}>Staking</Text>
      {status && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.button, status ? { opacity: 0.7 } : {}]}
        onPress={onPressStake}
        disabled={!!status}>
        <Text style={styles.buttonText}>Stake 100 Tokens</Text>
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
