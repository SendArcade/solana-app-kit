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

// Minimal structure for a token.
export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

interface SelectTokenModalProps {
  visible: boolean;
  onClose: () => void;
  onTokenSelected: (token: TokenInfo) => void;
}

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
      // Refresh tokens when the modal opens.
      fetchTokens();
    }
  }, [visible]);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      // Use the "tagged/verified" endpoint to get a filtered list of tokens with full details.
      const url = 'https://api.jup.ag/tokens/v1/tagged/verified';
      const resp = await fetch(url, {
        headers: {
          // Uncomment and set your API key if needed:
          // 'x-api-key': process.env.JUPITER_API_KEY || '',
        },
      });
      if (!resp.ok) {
        throw new Error(`Failed to load tokens: ${resp.status}`);
      }
      const data = await resp.json();
      // Expected structure: an array of token objects.
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid data structure from Jupiter tokens API');
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

  const renderItem = ({item}: {item: TokenInfo}) => (
    <TouchableOpacity
      style={tokenModalStyles.tokenItem}
      onPress={() => onTokenSelected(item)}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
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
        <View style={{marginLeft: 8}}>
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
            placeholder="Search by symbol, name, or mint"
            value={searchInput}
            onChangeText={setSearchInput}
          />

          {loading ? (
            <ActivityIndicator size="large" color="#1d9bf0" />
          ) : (
            <FlatList
              data={filteredTokens}
              keyExtractor={item => item.address}
              renderItem={renderItem}
              contentContainerStyle={{paddingBottom: 20}}
              style={{width: '100%', marginTop: 10}}
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
