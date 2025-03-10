import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import tokenModalStyles from './tokenModal.style';

/**
 * Information about a token
 * @interface TokenInfo
 */
export interface TokenInfo {
  /** The token's mint address */
  address: string;
  /** The token's symbol (e.g., 'SOL', 'USDC') */
  symbol: string;
  /** The token's full name */
  name: string;
  /** The number of decimal places for the token */
  decimals: number;
  /** URL to the token's logo image */
  logoURI?: string;
}

/**
 * Props for the SelectTokenModal component
 * @interface SelectTokenModalProps
 */
interface SelectTokenModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback fired when the modal is closed */
  onClose: () => void;
  /** Callback fired when a token is selected */
  onTokenSelected: (token: TokenInfo) => void;
}

/**
 * A modal component for selecting tokens from a list of verified tokens
 * 
 * @component
 * @description
 * SelectTokenModal provides a searchable interface for selecting tokens from a list
 * of verified tokens fetched from Jupiter's API. It supports searching by symbol,
 * name, or address, and displays token logos and details.
 * 
 * Features:
 * - Search functionality
 * - Token logo display
 * - Token details (symbol, name)
 * - Loading state handling
 * - Responsive layout
 * 
 * @example
 * ```tsx
 * <SelectTokenModal
 *   visible={showTokenModal}
 *   onClose={() => setShowTokenModal(false)}
 *   onTokenSelected={(token) => setSelectedToken(token)}
 * />
 * ```
 */
export default function SelectTokenModal({
  visible,
  onClose,
  onTokenSelected,
}: SelectTokenModalProps) {
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (visible) {
      fetchTokens();
    }
  }, [visible]);

  /**
   * Fetches the list of verified tokens from Jupiter's API
   * @returns {Promise<void>}
   */
  const fetchTokens = async () => {
    setLoading(true);
    try {
      const url = 'https://api.jup.ag/tokens/v1/tagged/verified';
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`Failed to load tokens: ${resp.status}`);
      }
      const data = await resp.json();
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid data structure from tokens API');
      }
      const result: TokenInfo[] = data.map((item: any) => ({
        address: item.address,
        symbol: item.symbol,
        name: item.name,
        decimals: item.decimals,
        logoURI: item.logoURI,
      }));
      setTokens(result);
    } catch (err: any) {
      console.error('fetchTokens error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTokens = useMemo(() => {
    if (!searchInput.trim()) return tokens;
    return tokens.filter(
      t =>
        t.symbol.toLowerCase().includes(searchInput.toLowerCase()) ||
        t.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        t.address.toLowerCase().includes(searchInput.toLowerCase()),
    );
  }, [tokens, searchInput]);

  /**
   * Renders a single token item in the list
   * @param {{item: TokenInfo}} props - The token item to render
   * @returns {JSX.Element} The rendered token item
   */
  const renderItem = ({item}: {item: TokenInfo}) => (
    <TouchableOpacity
      style={tokenModalStyles.tokenItem}
      onPress={() => onTokenSelected(item)}>
      <View style={tokenModalStyles.tokenItemContent}>
        {item.logoURI ? (
          <Image
            source={{uri: item.logoURI}}
            style={tokenModalStyles.tokenLogo}
          />
        ) : (
          <View
            style={[tokenModalStyles.tokenLogo, {backgroundColor: '#ccc'}]}
          />
        )}
        <View style={tokenModalStyles.tokenTextContainer}>
          <Text style={tokenModalStyles.tokenSymbol}>{item.symbol}</Text>
          <Text style={tokenModalStyles.tokenName}>{item.name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={tokenModalStyles.modalOverlay}>
        <View style={tokenModalStyles.modalContainer}>
          <Text style={tokenModalStyles.modalTitle}>Select a Token</Text>
          <TextInput
            style={tokenModalStyles.searchInput}
            placeholder="Search by symbol, name, or address"
            value={searchInput}
            onChangeText={setSearchInput}
          />
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#4A90E2"
              style={{marginTop: 20}}
            />
          ) : (
            <FlatList
              data={filteredTokens}
              keyExtractor={item => item.address}
              renderItem={renderItem}
              contentContainerStyle={{paddingBottom: 20, marginTop: 10}}
            />
          )}
          <TouchableOpacity
            style={tokenModalStyles.closeButton}
            onPress={onClose}>
            <Text style={tokenModalStyles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
