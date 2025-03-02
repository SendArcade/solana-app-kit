import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Text,
  Modal,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import Icons from '../../assets/svgs';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { addRootPost, addReply } from '../../state/thread/reducer';
import { createThreadStyles, getMergedTheme } from './thread.styles';
import { ThreadSection, ThreadSectionType, ThreadUser } from './thread.types';
import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker';
import { TENSOR_API_KEY } from '@env';
import { useAuth } from '../../hooks/useAuth';

// Example “NftItem” type for the user’s active listings
interface NftItem {
  mint: string;
  name: string;
  image: string;
  priceSol?: number;
  collection?: string;
}

interface ThreadComposerProps {
  currentUser: ThreadUser;
  parentId?: string; // if present, it's a reply
  onPostCreated?: () => void;
  themeOverrides?: Partial<Record<string, any>>;
  styleOverrides?: { [key: string]: object };
  userStyleSheet?: { [key: string]: object };
}

export default function ThreadComposer({
  currentUser,
  parentId,
  onPostCreated,
  themeOverrides,
  styleOverrides,
  userStyleSheet,
}: ThreadComposerProps) {
  const dispatch = useAppDispatch();
  const { solanaWallet } = useAuth();
  const userPublicKey = solanaWallet?.wallets?.[0]?.publicKey || null;

  // Basic composer state
  const [textValue, setTextValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // State for NFT Trade feature (active listings)
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeListings, setTradeListings] = useState<NftItem[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [selectedTradeNft, setSelectedTradeNft] = useState<NftItem | null>(null);

  // NEW: State for a separate "Trade" modal
  const [showNewTradeModal, setShowNewTradeModal] = useState(false);

  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(mergedTheme, styleOverrides, userStyleSheet);

  /***************************************************
   * 1) Existing composer logic for text + image
   ***************************************************/
  const handlePost = () => {
    // If user typed nothing and didn’t select an image or NFT, do nothing
    if (!textValue.trim() && !selectedImage && !selectedTradeNft) return;

    const sections: ThreadSection[] = [];

    // Text section
    if (textValue.trim()) {
      sections.push({
        id: 'section-' + Math.random().toString(36).substr(2, 9),
        type: 'TEXT_ONLY' as ThreadSectionType,
        text: textValue.trim(),
      });
    }

    // Image section
    if (selectedImage) {
      sections.push({
        id: 'section-' + Math.random().toString(36).substr(2, 9),
        type: 'IMAGE_ONLY' as ThreadSectionType,
        imageUrl: { uri: selectedImage },
      });
    }

    // NFT listing section (if one was selected)
    if (selectedTradeNft) {
      sections.push({
        id: 'section-' + Math.random().toString(36).substr(2, 9),
        type: 'NFT_LISTING',
        listingData: {
          mint: selectedTradeNft.mint,
          owner: currentUser.id, // or use userPublicKey if needed
          priceSol: selectedTradeNft.priceSol,
          name: selectedTradeNft.name,
          image: selectedTradeNft.image,
        },
      });
    }

    // Dispatch as a reply or as a new root post
    if (parentId) {
      dispatch(addReply({ parentId, user: currentUser, sections }));
    } else {
      dispatch(addRootPost({ user: currentUser, sections }));
    }

    // Clear the inputs
    setTextValue('');
    setSelectedImage(null);
    setSelectedTradeNft(null);
    onPostCreated && onPostCreated();
  };

  const handleMediaPress = () => {
    const options: ImageLibraryOptions = { mediaType: 'photo', quality: 1 };
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error:', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const uri = response.assets[0].uri;
        if (uri) setSelectedImage(uri);
      }
    });
  };

  /***************************************************
   * 2) NFT TRADE logic: fetch + show user’s active listings
   ***************************************************/
  const handleTradePress = async () => {
    setShowTradeModal(true);
    if (tradeListings.length === 0) {
      await fetchActiveListings(userPublicKey);
    }
  };

  const fetchActiveListings = async (userPublicKey: string | null) => {
    if (!userPublicKey) {
      Alert.alert('Not logged in', 'Connect your wallet first');
      return;
    }
    setLoadingListings(true);
    try {
      const url = `https://api.mainnet.tensordev.io/api/v1/user/active_listings?wallets=${userPublicKey}&sortBy=PriceAsc&limit=50`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { accept: 'application/json', 'x-tensor-api-key': TENSOR_API_KEY },
      });
      if (!res.ok) throw new Error(`Failed to fetch listings. status=${res.status}`);
      const data = await res.json();
      if (data.listings && Array.isArray(data.listings)) {
        const mapped: NftItem[] = data.listings.map((item: any) => {
          const mintObj = item.mint || {};
          const mintAddress =
            typeof item.mint === 'object' && item.mint.onchainId
              ? item.mint.onchainId
              : item.mint;
          const nftName = mintObj?.name || 'Unnamed NFT';
          const nftImage = mintObj?.imageUri
            ? fixImageUrl(mintObj.imageUri)
            : 'https://via.placeholder.com/150';
          const lamports = parseInt(item.grossAmount || '0', 10);
          const priceSol = lamports / 1_000_000_000;
          return { mint: mintAddress, name: nftName, image: nftImage, priceSol, collection: mintObj?.collName || '' };
        });
        setTradeListings(mapped);
      } else {
        setTradeListings([]);
      }
    } catch (err: any) {
      console.error('fetchActiveListings error:', err);
      Alert.alert('Error', err.message);
    } finally {
      setLoadingListings(false);
    }
  };

  const closeTradeModal = () => setShowTradeModal(false);
  const handleSelectListing = (item: NftItem) => {
    setSelectedTradeNft(item);
    closeTradeModal();
  };

  // Helper to fix image URLs
  const fixImageUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('ipfs://')) return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    if (url.startsWith('ar://')) return url.replace('ar://', 'https://arweave.net/');
    if (url.startsWith('/')) return `https://arweave.net${url}`;
    if (!url.startsWith('http') && !url.startsWith('data:')) return `https://${url}`;
    return url;
  };

  // Render item in NFT Trade modal
  const renderListingItem = ({ item }: { item: NftItem }) => (
    <TouchableOpacity style={tradeModalStyles.listingCard} onPress={() => handleSelectListing(item)}>
      <Image source={{ uri: item.image }} style={tradeModalStyles.listingImage} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={tradeModalStyles.listingName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.priceSol !== undefined && (
          <Text style={tradeModalStyles.listingPrice}>
            {item.priceSol.toFixed(2)} SOL
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  /***************************************************
   * 3) NEW: Trade Modal for additional trade options
   ***************************************************/
  const handleNewTradePress = () => {
    setShowNewTradeModal(true);
  };

  const closeNewTradeModal = () => {
    setShowNewTradeModal(false);
  };

  /***************************************************
   * RENDER
   ***************************************************/
  return (
    <View>
      {/* Main composer area */}
      <View style={styles.composerContainer}>
        <View style={styles.composerAvatarContainer}>
          <Image source={currentUser.avatar} style={styles.composerAvatar} />
        </View>
        <View style={styles.composerMiddle}>
          <Text style={styles.composerUsername}>{currentUser.username}</Text>
          <TextInput
            style={styles.composerInput}
            placeholder={parentId ? 'Reply...' : "What's happening?"}
            placeholderTextColor="#999"
            value={textValue}
            onChangeText={setTextValue}
            multiline
          />
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={{ width: 100, height: 100, marginTop: 10 }} />
          )}
          {selectedTradeNft && (
            <View style={styles.composerTradePreview}>
              <Image source={{ uri: selectedTradeNft.image }} style={styles.composerTradeImage} />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={styles.composerTradeName} numberOfLines={1}>
                  {selectedTradeNft.name}
                </Text>
                {selectedTradeNft.priceSol && (
                  <Text style={styles.composerTradePrice}>
                    {selectedTradeNft.priceSol.toFixed(2)} SOL
                  </Text>
                )}
              </View>
              <TouchableOpacity style={styles.composerTradeRemove} onPress={() => setSelectedTradeNft(null)}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>X</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.iconsRow}>
            <View style={styles.leftIcons}>
              <TouchableOpacity onPress={handleMediaPress}>
                <Icons.MediaIcon width={18} height={18} />
              </TouchableOpacity>
              {/* Existing NFT Trade button */}
              <TouchableOpacity
                onPress={handleTradePress}
                style={{
                  marginLeft: 10,
                  backgroundColor: '#F0F0F0',
                  padding: 4,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 12, color: '#666666' }}>Nft Trade</Text>
              </TouchableOpacity>
              {/* New Trade button */}
              <TouchableOpacity
                onPress={handleNewTradePress}
                style={{
                  marginLeft: 10,
                  backgroundColor: '#E0E0E0',
                  padding: 4,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 12, color: '#333333' }}>Trade</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handlePost}>
              <Text style={{ color: '#1d9bf0', fontWeight: '600' }}>
                {parentId ? 'Reply' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* NFT Trade Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTradeModal}
        onRequestClose={closeTradeModal}
      >
        <View style={tradeModalStyles.modalOverlay}>
          <View style={tradeModalStyles.modalContainer}>
            <Text style={tradeModalStyles.modalTitle}>Select an NFT</Text>
            {loadingListings ? (
              <ActivityIndicator size="large" color="#1d9bf0" />
            ) : tradeListings.length === 0 ? (
              <Text style={{ marginTop: 16, color: '#666' }}>No active listings found.</Text>
            ) : (
              <FlatList
                data={tradeListings}
                keyExtractor={(item) => item.mint}
                renderItem={renderListingItem}
                style={{ marginTop: 10, width: '100%' }}
              />
            )}
            <TouchableOpacity onPress={closeTradeModal} style={tradeModalStyles.closeButton}>
              <Text style={tradeModalStyles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* NEW: Trade Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showNewTradeModal}
        onRequestClose={closeNewTradeModal}
      >
        <View style={newTradeModalStyles.modalOverlay}>
          <View style={newTradeModalStyles.modalContainer}>
            <Text style={newTradeModalStyles.modalTitle}>Trade Modal</Text>
            <Text style={newTradeModalStyles.modalContent}>
              This is a new trade modal. Add your trade options or UI here.
            </Text>
            <TouchableOpacity onPress={closeNewTradeModal} style={newTradeModalStyles.closeButton}>
              <Text style={newTradeModalStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const tradeModalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  listingCard: {
    flexDirection: 'row',
    padding: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  listingImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  listingName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
  listingPrice: {
    marginTop: 2,
    fontSize: 12,
    color: '#999',
  },
  closeButton: {
    marginTop: 12,
    backgroundColor: '#1d9bf0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

const newTradeModalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalContent: {
    fontSize: 16,
    color: '#444',
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#1d9bf0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
