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
import {usePumpFun} from '../../hooks/usePumpFun';
import {PumpfunLaunchStyles} from './Pumpfun.styles';
import PumpfunCard from './PumpfunCard';

/**
 * Props for the PumpfunLaunchSection component
 * @interface PumpfunLaunchSectionProps
 */
export interface PumpfunLaunchSectionProps {
  /** Optional style override for the container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional style override for the input fields */
  inputStyle?: StyleProp<TextStyle>;
  /** Optional style override for the launch button */
  buttonStyle?: StyleProp<ViewStyle>;
  /** Custom label for the launch button (defaults to 'Launch Token') */
  launchButtonLabel?: string;
}

/**
 * A component that provides a user interface for launching new tokens through Pump.fun
 * 
 * @component
 * @description
 * PumpfunLaunchSection is a comprehensive form component that allows users to create
 * and launch new tokens on the Pump.fun platform. It provides a complete interface
 * for token creation with image upload support and initial purchase functionality.
 * 
 * Features:
 * - Token name and symbol input
 * - Description field
 * - Social media links (Twitter, Telegram)
 * - Website URL
 * - Token image upload via device gallery
 * - Initial purchase amount in SOL
 * - Loading state handling
 * - Input validation
 * - Error handling and user feedback
 * - Customizable styling
 * 
 * @example
 * ```tsx
 * <PumpfunLaunchSection
 *   containerStyle={styles.customContainer}
 *   inputStyle={styles.customInput}
 *   buttonStyle={styles.customButton}
 *   launchButtonLabel="Create Token"
 * />
 * ```
 */
export const PumpfunLaunchSection: React.FC<PumpfunLaunchSectionProps> = ({
  containerStyle,
  inputStyle,
  buttonStyle,
  launchButtonLabel = 'Launch Token',
}) => {
  const {launchToken} = usePumpFun();

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
