// FILE: src/components/pumpfun/PumpportalLaunchButton.tsx

import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {useAuth} from '../../hooks/useAuth';
import {createAndBuyTokenViaPumpfun} from '../../services/pumpfun/pumpfunService';

export const PumpportalLaunchButton = () => {
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [solAmount, setSolAmount] = useState('0.001'); // For example, how much SOL to buy at creation
  const [loading, setLoading] = useState(false);

  // Grab user’s Solana wallet from your Auth hook
  const {solanaWallet} = useAuth();
  const userPublicKey = solanaWallet?.wallets?.[0]?.publicKey || '';

  // Let user pick an image from library
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleLaunch = async () => {
    try {
      if (!userPublicKey) {
        Alert.alert('Error', 'Please connect your wallet first.');
        return;
      }
      if (!tokenName || !tokenSymbol || !description || !imageUri) {
        Alert.alert(
          'Error',
          'Please fill in name, symbol, description, and image.',
        );
        return;
      }

      setLoading(true);

      // This is our new “create + buy” call via PumpFun
      const {txId, mintPublicKey} = await createAndBuyTokenViaPumpfun({
        userPublicKey,
        tokenName,
        tokenSymbol,
        description,
        twitter,
        telegram,
        website,
        imageUri,
        solAmount: Number(solAmount),
        solanaWallet,
      });

      Alert.alert(
        'Success',
        `Created + Bought token!\nMint: ${mintPublicKey}\nTxid: ${txId}\nhttps://solscan.io/tx/${txId}`,
      );
    } catch (error: any) {
      console.error('Launch error:', error);
      Alert.alert('Launch Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pumpfun Token Launch</Text>

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
        style={[styles.input, {height: 60}]}
        placeholder="Description"
        multiline
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Twitter (optional)"
        value={twitter}
        onChangeText={setTwitter}
      />
      <TextInput
        style={styles.input}
        placeholder="Telegram (optional)"
        value={telegram}
        onChangeText={setTelegram}
      />
      <TextInput
        style={styles.input}
        placeholder="Website (optional)"
        value={website}
        onChangeText={setWebsite}
      />

      <TextInput
        style={styles.input}
        placeholder="Initial SOL to Buy (e.g. 0.001)"
        keyboardType="decimal-pad"
        value={solAmount}
        onChangeText={setSolAmount}
      />

      <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
        <Text style={styles.imageButtonText}>
          {imageUri ? 'Change Image' : 'Pick Image'}
        </Text>
      </TouchableOpacity>

      {imageUri && (
        <Image source={{uri: imageUri}} style={styles.imagePreview} />
      )}

      <TouchableOpacity
        onPress={handleLaunch}
        style={styles.launchButton}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.launchButtonText}>Launch Token</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default PumpportalLaunchButton;

const styles = StyleSheet.create({
  container: {padding: 16},
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginVertical: 6,
  },
  imageButton: {
    backgroundColor: 'dodgerblue',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 10,
  },
  imageButtonText: {color: '#fff'},
  imagePreview: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginVertical: 10,
  },
  launchButton: {
    backgroundColor: 'green',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
  },
  launchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
