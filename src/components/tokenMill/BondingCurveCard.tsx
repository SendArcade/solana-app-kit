/**************************************
 * File: BondingCurveCard.tsx
 *
 * Updated to use the improved
 * BondingCurveConfigurator without scroll,
 * includes an additional slider for number
 * of points, and a more intuitive layout.
 **************************************/

import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {Connection} from '@solana/web3.js';
// ^ Update this path if needed
import BondingCurveConfigurator from './BondingCurveConfigurator';
import { setBondingCurve } from '../../services/tokenMill/tokenMillService';

interface Props {
  marketAddress: string;
  connection: Connection;
  publicKey: string;
  solanaWallet: any;
  setLoading: (val: boolean) => void;
}

export default function BondingCurveCard({
  marketAddress,
  connection,
  publicKey,
  solanaWallet,
  setLoading,
}: Props) {
  const [askPrices, setAskPrices] = useState<number[]>([]);
  const [bidPrices, setBidPrices] = useState<number[]>([]);

  const onPressSetCurve = async () => {
    if (!marketAddress) {
      Alert.alert('No market', 'Please enter or create a market first!');
      return;
    }
    try {
      setLoading(true);
      const provider = await solanaWallet.getProvider();
      const txSig = await setBondingCurve({
        marketAddress,
        askPrices,
        bidPrices,
        userPublicKey: publicKey,
        connection,
        provider,
      });
      Alert.alert('Curve Set', `Tx: ${txSig}`);
    } catch (err: any) {
      Alert.alert('Error setting curve', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Bonding Curve</Text>

      {/* The improved Configurator */}
      <BondingCurveConfigurator
        onCurveChange={(newAsk, newBid) => {
          setAskPrices(newAsk);
          setBidPrices(newBid);
        }}
      />

      <TouchableOpacity style={styles.button} onPress={onPressSetCurve}>
        <Text style={styles.buttonText}>Set Curve On-Chain</Text>
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
    // We assume parent container is scrollable or has enough space
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#2a2a2a',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
