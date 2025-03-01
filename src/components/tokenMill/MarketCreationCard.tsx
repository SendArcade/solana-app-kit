// File: src/screens/TokenMillScreen/components/MarketCreationCard.tsx
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {Connection} from '@solana/web3.js';
import { createMarket } from '../../services/tokenMill/tokenMillService';

interface Props {
  connection: Connection;
  publicKey: string;
  solanaWallet: any;
  setLoading: (val: boolean) => void;
  onMarketCreated: (marketAddr: string, baseMint: string) => void;
}

export default function MarketCreationCard({
  connection,
  publicKey,
  solanaWallet,
  setLoading,
  onMarketCreated,
}: Props) {
  const [tokenName, setTokenName] = useState('MyToken');
  const [tokenSymbol, setTokenSymbol] = useState('MTK');
  const [metadataUri, setMetadataUri] = useState('https://arweave.net/abc123');
  const [totalSupply, setTotalSupply] = useState('1000000');
  const [creatorFee, setCreatorFee] = useState('3300');
  const [stakingFee, setStakingFee] = useState('6200');

  const onPressCreateMarket = async () => {
    try {
      setLoading(true);
      const provider = await solanaWallet.getProvider();
      const {txSignature, marketAddress, baseTokenMint} = await createMarket({
        tokenName,
        tokenSymbol,
        metadataUri,
        totalSupply: parseInt(totalSupply, 10),
        creatorFee: parseInt(creatorFee, 10),
        stakingFee: parseInt(stakingFee, 10),
        userPublicKey: publicKey,
        connection,
        provider,
      });
      Alert.alert(
        'Market Created',
        `Market: ${marketAddress}\nTx: ${txSignature}`,
      );
      onMarketCreated(marketAddress, baseTokenMint);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
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
      />
      <TextInput
        style={styles.input}
        placeholder="Token Symbol"
        value={tokenSymbol}
        onChangeText={setTokenSymbol}
      />
      <TextInput
        style={styles.input}
        placeholder="Metadata URI"
        value={metadataUri}
        onChangeText={setMetadataUri}
      />
      <TextInput
        style={styles.input}
        placeholder="Total Supply"
        value={totalSupply}
        onChangeText={setTotalSupply}
      />
      <TextInput
        style={styles.input}
        placeholder="Creator Fee BPS"
        value={creatorFee}
        onChangeText={setCreatorFee}
      />
      <TextInput
        style={styles.input}
        placeholder="Staking Fee BPS"
        value={stakingFee}
        onChangeText={setStakingFee}
      />

      <TouchableOpacity style={styles.button} onPress={onPressCreateMarket}>
        <Text style={styles.buttonText}>Create Market</Text>
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
