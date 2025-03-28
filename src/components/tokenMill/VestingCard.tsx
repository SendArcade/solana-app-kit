// File: src/screens/TokenMillScreen/components/VestingCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { Connection } from '@solana/web3.js';
import {
  createVesting,
  releaseVesting,
} from '../../services/tokenMill/tokenMillService';
import { StandardWallet } from '../../hooks/useAuth';

interface Props {
  marketAddress: string;
  baseTokenMint: string;
  vestingPlanAddress: string;
  setVestingPlanAddress: (addr: string) => void;
  connection: Connection;
  publicKey: string;
  solanaWallet: StandardWallet | any;
  setLoading: (val: boolean) => void;
}

export default function VestingCard({
  marketAddress,
  baseTokenMint,
  vestingPlanAddress,
  setVestingPlanAddress,
  connection,
  publicKey,
  solanaWallet,
  setLoading,
}: Props) {
  const [vestingAmount, setVestingAmount] = useState('10000');
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [releaseStatus, setReleaseStatus] = useState<string | null>(null);

  const onPressCreateVesting = async () => {
    if (!marketAddress) {
      Alert.alert('No market', 'Please enter or create a market first!');
      return;
    }
    if (!baseTokenMint) {
      Alert.alert('No token', 'Please enter or create a token first!');
      return;
    }
    try {
      setLoading(true);
      setCreateStatus('Preparing vesting transaction...');

      const { txSignature, ephemeralVestingPubkey } = await createVesting({
        marketAddress,
        baseTokenMint,
        vestingAmount: parseInt(vestingAmount, 10),
        userPublicKey: publicKey,
        connection,
        solanaWallet,
        onStatusUpdate: (newStatus) => {
          console.log('Create vesting status:', newStatus);
          setCreateStatus(newStatus);
        }
      });

      setCreateStatus('Vesting plan created successfully!');
      setVestingPlanAddress(ephemeralVestingPubkey);
      Alert.alert(
        'Vesting Plan Created',
        `Vesting Plan: ${ephemeralVestingPubkey}\nTx: ${txSignature}`,
      );
    } catch (err: any) {
      console.error('Create vesting error:', err);
      // Don't show raw error in UI
      setCreateStatus('Transaction failed');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setCreateStatus(null);
      }, 2000);
    }
  };

  const onPressReleaseVesting = async () => {
    if (!marketAddress) {
      Alert.alert('No market', 'Please enter or create a market first!');
      return;
    }
    if (!baseTokenMint) {
      Alert.alert('No token', 'Please enter or create a token first!');
      return;
    }
    if (!vestingPlanAddress) {
      Alert.alert('No vesting plan', 'Please create a vesting plan first!');
      return;
    }
    try {
      setLoading(true);
      setReleaseStatus('Preparing release transaction...');

      const txSig = await releaseVesting({
        marketAddress,
        vestingPlanAddress,
        baseTokenMint,
        userPublicKey: publicKey,
        connection,
        solanaWallet,
        onStatusUpdate: (newStatus) => {
          console.log('Release vesting status:', newStatus);
          setReleaseStatus(newStatus);
        }
      });

      setReleaseStatus('Vesting released successfully!');
      Alert.alert('Vesting Released', `Tx: ${txSig}`);
    } catch (err: any) {
      console.error('Release vesting error:', err);
      // Don't show raw error in UI
      setReleaseStatus('Transaction failed');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setReleaseStatus(null);
      }, 2000);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Vesting</Text>
      <TextInput
        style={styles.input}
        placeholder="Vesting Amount"
        value={vestingAmount}
        onChangeText={setVestingAmount}
        editable={!createStatus && !releaseStatus}
      />

      {createStatus && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{createStatus}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, createStatus ? { opacity: 0.7 } : {}]}
        onPress={onPressCreateVesting}
        disabled={!!createStatus || !!releaseStatus}>
        <Text style={styles.buttonText}>Create Vesting Plan</Text>
      </TouchableOpacity>

      {vestingPlanAddress ? (
        <View style={styles.vestingDetails}>
          <Text style={styles.vestingDetailsText}>
            Vesting Plan: {vestingPlanAddress.slice(0, 12)}...
          </Text>

          {releaseStatus && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>{releaseStatus}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.releaseButton, releaseStatus ? { opacity: 0.7 } : {}]}
            onPress={onPressReleaseVesting}
            disabled={!!createStatus || !!releaseStatus}>
            <Text style={styles.buttonText}>Release Vesting</Text>
          </TouchableOpacity>
        </View>
      ) : null}
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
  input: {
    backgroundColor: '#fafafa',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 12,
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
  vestingDetails: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  vestingDetailsText: {
    marginBottom: 12,
    fontSize: 14,
    color: '#555',
  },
  releaseButton: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
});
