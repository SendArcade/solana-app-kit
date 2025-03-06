import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Alert} from 'react-native';
import {Connection} from '@solana/web3.js';
import BN from 'bn.js';
import {setBondingCurve} from '../../services/tokenMill/tokenMillService';
import {BondingCurveCardStyles as defaultStyles} from './BondingCurveCard.style';
import BondingCurveConfigurator from './BondingCurveConfigurator';

interface BondingCurveCardProps {
  marketAddress: string;
  connection: Connection;
  publicKey: string;
  solanaWallet: any;
  setLoading: (val: boolean) => void;
  styleOverrides?: Partial<typeof defaultStyles>;
}

export default function BondingCurveCard({
  marketAddress,
  connection,
  publicKey,
  solanaWallet,
  setLoading,
  styleOverrides = {},
}: BondingCurveCardProps) {
  // Local states for BN arrays from configurator
  const [askPrices, setAskPrices] = useState<BN[]>([]);
  const [bidPrices, setBidPrices] = useState<BN[]>([]);

  // Merge style overrides
  const styles = {...defaultStyles, ...styleOverrides};

  const onPressSetCurve = async () => {
    if (!marketAddress) {
      Alert.alert('No market', 'Please enter or create a market first!');
      return;
    }
    try {
      setLoading(true);
      const provider = await solanaWallet.getProvider();

      // Convert BN => number before passing
      const askNumbers = askPrices.map(p => p.toNumber());
      const bidNumbers = bidPrices.map(p => p.toNumber());

      const txSig = await setBondingCurve({
        marketAddress,
        askPrices: askNumbers,
        bidPrices: bidNumbers,
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
