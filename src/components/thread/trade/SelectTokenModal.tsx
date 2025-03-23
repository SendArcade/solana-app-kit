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
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import tokenModalStyles from './tokenModal.style';
import { FontAwesome5 } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

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
    } else {
      // Clear search when modal closes
      setSearchInput('');
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
      onPress={() => onTokenSelected(item)}
      activeOpacity={0.7}>
      <View style={tokenModalStyles.tokenItemContent}>
        {item.logoURI ? (
          <Image
            source={{uri: item.logoURI}}
            style={tokenModalStyles.tokenLogo}
            resizeMode="contain"
          />
        ) : (
          <View style={[tokenModalStyles.tokenLogo, {backgroundColor: '#F3F4F6'}]}>
            <Text style={{color: '#6B7280', fontWeight: '600', fontSize: 12}}>
              {item.symbol.charAt(0)}
            </Text>
          </View>
        )}
        <View style={tokenModalStyles.tokenTextContainer}>
          <Text style={tokenModalStyles.tokenSymbol} numberOfLines={1} ellipsizeMode="tail">
            {item.symbol}
          </Text>
          <Text style={tokenModalStyles.tokenName} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={tokenModalStyles.modalOverlay} />
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={tokenModalStyles.modalOverlay}>
        <View style={tokenModalStyles.modalContainer}>
          <View style={tokenModalStyles.modalHeader}>
            <Text style={tokenModalStyles.modalTitle}>Select a Token</Text>
            <TouchableOpacity 
              style={tokenModalStyles.modalCloseButton}
              onPress={onClose}
            >
              <Text style={tokenModalStyles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={tokenModalStyles.searchContainer}>
            <FontAwesome5 name="search" size={14} color="#9CA3AF" style={tokenModalStyles.searchIcon} />
            <TextInput
              style={tokenModalStyles.searchInput}
              placeholder="Search by name, symbol, or address"
              placeholderTextColor="#9CA3AF"
              value={searchInput}
              onChangeText={setSearchInput}
              clearButtonMode="while-editing"
            />
          </View>
          
          {loading ? (
            <View style={tokenModalStyles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color="#3871DD"
              />
              <Text style={tokenModalStyles.loadingText}>Loading tokens...</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={filteredTokens}
                keyExtractor={item => item.address}
                renderItem={renderItem}
                contentContainerStyle={tokenModalStyles.listContentContainer}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={tokenModalStyles.emptyContainer}>
                    <Text style={tokenModalStyles.emptyText}>
                      No tokens found matching "{searchInput}"
                    </Text>
                  </View>
                }
              />
              
              <TouchableOpacity
                style={tokenModalStyles.closeButton}
                onPress={onClose}>
                <Text style={tokenModalStyles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
