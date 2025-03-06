import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Alert} from 'react-native';
import {Connection} from '@solana/web3.js';
import BN from 'bn.js';
import {setBondingCurve} from '../../services/tokenMill/tokenMillService';
import {BondingCurveCardStyles as defaultStyles} from './BondingCurveCard.style';
import BondingCurveConfigurator from './BondingCurveConfigurator';

/**
 * Props for the BondingCurveCard component
 * @interface BondingCurveCardProps
 */
interface BondingCurveCardProps {
  /** The address of the market to set the bonding curve for */
  marketAddress: string;
  /** The Solana connection instance */
  connection: Connection;
  /** The public key of the user setting the curve */
  publicKey: string;
  /** The Solana wallet instance for signing transactions */
  solanaWallet: any;
  /** Callback function to set loading state */
  setLoading: (val: boolean) => void;
  /** Optional style overrides for the component */
  styleOverrides?: Partial<typeof defaultStyles>;
}

/**
 * A component for configuring and setting bonding curves for token markets
 * 
 * @component
 * @description
 * BondingCurveCard provides an interface for configuring and setting bonding curves
 * for token markets. It combines a configurator component for setting ask and bid
 * prices with functionality to commit these settings to the blockchain.
 * 
 * Features:
 * - Bonding curve configuration
 * - Ask and bid price management
 * - On-chain curve setting
 * - Loading state handling
 * - Error handling
 * - Customizable styling
 * 
 * @example
 * ```tsx
 * <BondingCurveCard
 *   marketAddress="market_address_here"
 *   connection={solanaConnection}
 *   publicKey={userPublicKey}
 *   solanaWallet={wallet}
 *   setLoading={setIsLoading}
 * />
 * ```
 */
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

  /**
   * Handles the process of setting the bonding curve on-chain
   * @returns {Promise<void>}
   */
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
