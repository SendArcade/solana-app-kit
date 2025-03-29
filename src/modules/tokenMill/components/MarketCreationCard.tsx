// File: src/screens/TokenMillScreen/components/MarketCreationCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MarketCreationCardProps } from '../types';
import { createMarket } from '../services/tokenMillService';
import { MarketCreationCardStyles as styles } from './styles/MarketCreationCard.style';

export default function MarketCreationCard({
  connection,
  publicKey,
  solanaWallet,
  setLoading,
  onMarketCreated,
}: MarketCreationCardProps) {
  const [tokenName, setTokenName] = useState('MyToken');
  const [tokenSymbol, setTokenSymbol] = useState('MTK');
  const [metadataUri, setMetadataUri] = useState('https://arweave.net/abc123');
  const [totalSupply, setTotalSupply] = useState('1000000');
  const [creatorFee, setCreatorFee] = useState('3300');
  const [stakingFee, setStakingFee] = useState('6200');
  const [status, setStatus] = useState<string | null>(null);

  const onPressCreateMarket = async () => {
    try {
      setLoading(true);
      setStatus('Preparing market creation...');

      const { txSignature, marketAddress, baseTokenMint } = await createMarket({
        tokenName,
        tokenSymbol,
        metadataUri,
        totalSupply: parseInt(totalSupply, 10),
        creatorFee: parseInt(creatorFee, 10),
        stakingFee: parseInt(stakingFee, 10),
        userPublicKey: publicKey,
        connection,
        solanaWallet,
        onStatusUpdate: (newStatus) => {
          console.log('Create market status:', newStatus);
          setStatus(newStatus);
        }
      });

      setStatus('Market created successfully!');
      Alert.alert(
        'Market Created',
        `Market: ${marketAddress}\nTx: ${txSignature}`,
      );
      onMarketCreated(marketAddress, baseTokenMint);
    } catch (err: any) {
      console.error('Create market error:', err);
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
      <Text style={styles.sectionTitle}>Create Market (Token)</Text>
      <TextInput
        style={styles.input}
        placeholder="Token Name"
        value={tokenName}
        onChangeText={setTokenName}
        editable={!status}
      />
      <TextInput
        style={styles.input}
        placeholder="Token Symbol"
        value={tokenSymbol}
        onChangeText={setTokenSymbol}
        editable={!status}
      />
      <TextInput
        style={styles.input}
        placeholder="Metadata URI"
        value={metadataUri}
        onChangeText={setMetadataUri}
        editable={!status}
      />
      <TextInput
        style={styles.input}
        placeholder="Total Supply"
        value={totalSupply}
        onChangeText={setTotalSupply}
        editable={!status}
      />
      <TextInput
        style={styles.input}
        placeholder="Creator Fee BPS"
        value={creatorFee}
        onChangeText={setCreatorFee}
        editable={!status}
      />
      <TextInput
        style={styles.input}
        placeholder="Staking Fee BPS"
        value={stakingFee}
        onChangeText={setStakingFee}
        editable={!status}
      />

      {status && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, status ? { opacity: 0.7 } : {}]}
        onPress={onPressCreateMarket}
        disabled={!!status}>
        <Text style={styles.buttonText}>Create Market</Text>
      </TouchableOpacity>
    </View>
  );
}
