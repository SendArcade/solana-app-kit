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
      const {txSignature, ephemeralVestingPubkey} = await createVesting({
        marketAddress,
        baseTokenMint,
        vestingAmount: parseInt(vestingAmount, 10),
        userPublicKey: publicKey,
        connection,
        solanaWallet,
      });
      setVestingPlanAddress(ephemeralVestingPubkey);
      Alert.alert(
        'Vesting Plan Created',
        `Vesting Plan: ${ephemeralVestingPubkey}\nTx: ${txSignature}`,
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
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
      const txSig = await releaseVesting({
        marketAddress,
        vestingPlanAddress,
        baseTokenMint,
        userPublicKey: publicKey,
        connection,
        solanaWallet,
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
        <Text style={styles.buttonText}>Create Vesting Plan</Text>
      </TouchableOpacity>

      {vestingPlanAddress ? (
        <View style={styles.vestingDetails}>
          <Text style={styles.vestingDetailsText}>
            Vesting Plan: {vestingPlanAddress.slice(0, 12)}...
          </Text>
          <TouchableOpacity
            style={styles.releaseButton}
            onPress={onPressReleaseVesting}>
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
