import React, {useState} from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {usePumpfun} from '../../hooks/usePumpFun';
import {PumpfunLaunchStyles} from './Pumpfun.styles';
import PumpfunCard from './PumpfunCard';

export interface PumpfunLaunchSectionProps {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  launchButtonLabel?: string;
}

/**
 * A reusable component that allows the user to create + buy a Pumpfun token at launch.
 */
export const PumpfunLaunchSection: React.FC<PumpfunLaunchSectionProps> = ({
  containerStyle,
  inputStyle,
  buttonStyle,
  launchButtonLabel = 'Launch Token',
}) => {
  const {launchToken} = usePumpfun();

  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [solAmount, setSolAmount] = useState('0.001');
  const [loading, setLoading] = useState(false);

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
    if (!tokenName || !tokenSymbol || !description || !imageUri) {
      Alert.alert(
        'Error',
        'Please fill in name, symbol, description, and select an image.',
      );
      return;
    }

    setLoading(true);
    try {
      await launchToken({
        tokenName,
        tokenSymbol,
        description,
        twitter,
        telegram,
        website,
        imageUri,
        solAmount: Number(solAmount),
      });
    } catch (error: any) {
      console.error('Launch error:', error);
      Alert.alert('Launch Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PumpfunCard containerStyle={containerStyle}>
      <Text style={PumpfunLaunchStyles.header}>Pumpfun Token Launch</Text>

      <TextInput
        style={[PumpfunLaunchStyles.input, inputStyle]}
        placeholder="Token Name"
        value={tokenName}
        onChangeText={setTokenName}
      />
      <TextInput
        style={[PumpfunLaunchStyles.input, inputStyle]}
        placeholder="Token Symbol"
        value={tokenSymbol}
        onChangeText={setTokenSymbol}
      />
      <TextInput
        style={[PumpfunLaunchStyles.input, inputStyle, {height: 60}]}
        placeholder="Description"
        multiline
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={[PumpfunLaunchStyles.input, inputStyle]}
        placeholder="Twitter (optional)"
        value={twitter}
        onChangeText={setTwitter}
      />
      <TextInput
        style={[PumpfunLaunchStyles.input, inputStyle]}
        placeholder="Telegram (optional)"
        value={telegram}
        onChangeText={setTelegram}
      />
      <TextInput
        style={[PumpfunLaunchStyles.input, inputStyle]}
        placeholder="Website (optional)"
        value={website}
        onChangeText={setWebsite}
      />
      <TextInput
        style={[PumpfunLaunchStyles.input, inputStyle]}
        placeholder="Initial SOL to Buy (e.g. 0.001)"
        keyboardType="decimal-pad"
        value={solAmount}
        onChangeText={setSolAmount}
      />

      <TouchableOpacity
        onPress={pickImage}
        style={PumpfunLaunchStyles.imageButton}>
        <Text style={PumpfunLaunchStyles.imageButtonText}>
          {imageUri ? 'Change Image' : 'Pick Image'}
        </Text>
      </TouchableOpacity>

      {imageUri && (
        <Image
          source={{uri: imageUri}}
          style={PumpfunLaunchStyles.imagePreview}
        />
      )}

      <TouchableOpacity
        onPress={handleLaunch}
        style={[PumpfunLaunchStyles.launchButton, buttonStyle]}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={PumpfunLaunchStyles.launchButtonText}>
            {launchButtonLabel}
          </Text>
        )}
      </TouchableOpacity>
    </PumpfunCard>
  );
};

export default PumpfunLaunchSection;
