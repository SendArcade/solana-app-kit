// File: src/screens/TokenMillScreen/components/VestingCard.tsx
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import {Connection} from '@solana/web3.js';
import { createVesting, releaseVesting } from '../../services/tokenMill/tokenMillService';


interface Props {
  marketAddress: string;
  baseTokenMint: string;
  vestingPlanAddress: string;
  setVestingPlanAddress: (addr: string) => void;
  connection: Connection;
  publicKey: string;
  solanaWallet: any;
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
  const [vestingAmount, setVestingAmount] = useState('200000');

  const onPressCreateVesting = async () => {
    if (!marketAddress || !baseTokenMint) {
      Alert.alert(
        'Error',
        'Enter or create a market and base token mint first.',
      );
      return;
    }
    try {
      setLoading(true);
      const provider = await solanaWallet.getProvider();
      const {txSignature, ephemeralVestingPubkey} = await createVesting({
        marketAddress,
        baseTokenMint,
        vestingAmount: parseInt(vestingAmount, 10),
        userPublicKey: publicKey,
        connection,
        provider,
      });
      setVestingPlanAddress(ephemeralVestingPubkey);
      Alert.alert(
        'Vesting Created',
        `Plan: ${ephemeralVestingPubkey}\nTx: ${txSignature}`,
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onPressReleaseVesting = async () => {
    if (!marketAddress || !baseTokenMint || !vestingPlanAddress) {
      Alert.alert(
        'Error',
        'Need market address, baseTokenMint, and vesting plan address.',
      );
      return;
    }
    try {
      setLoading(true);
      const provider = await solanaWallet.getProvider();
      const txSig = await releaseVesting({
        marketAddress,
        vestingPlanAddress,
        baseTokenMint,
        userPublicKey: publicKey,
        connection,
        provider,
      });
      Alert.alert('Vesting Released', `Tx: ${txSig}`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
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
      />
      <TouchableOpacity style={styles.button} onPress={onPressCreateVesting}>
        <Text style={styles.buttonText}>Create Vesting</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onPressReleaseVesting}>
        <Text style={styles.buttonText}>Release Vesting</Text>
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
  input: {
    backgroundColor: '#fafafa',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
