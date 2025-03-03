import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import Icons from '../../assets/svgs';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import {
  createRootPostAsync,
  createReplyAsync,
  addPostLocally,
  addReplyLocally,
} from '../../state/thread/reducer';
import { createThreadStyles, getMergedTheme } from './thread.styles';
import { ThreadSection, ThreadSectionType, ThreadUser } from './thread.types';
import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker';
import { TENSOR_API_KEY } from '@env';
import { useAuth } from '../../hooks/useAuth';

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

  // NFT listing states
  const [showListingModal, setShowListingModal] = useState(false);
  const [listingItems, setListingItems] = useState<NftItem[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [selectedListingNft, setSelectedListingNft] = useState<NftItem | null>(null);

  // Additional Trade modal state
  const [showTradeModal, setShowTradeModal] = useState(false);

  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(mergedTheme, styleOverrides, userStyleSheet);

  /***************************************************
   * 1) Post creation
   ***************************************************/
  const handlePost = async () => {
    if (!textValue.trim() && !selectedImage && !selectedListingNft) return;

    const sections: ThreadSection[] = [];

    // Text section
    if (textValue.trim()) {
      sections.push({
        id: 'section-' + Math.random().toString(36).substr(2, 9),
        type: 'TEXT_ONLY' as ThreadSectionType,
        text: textValue.trim(),
      });
    }

    // Image section – send image as a data URL (base64 encoded)
    if (selectedImage) {
      sections.push({
        id: 'section-' + Math.random().toString(36).substr(2, 9),
        type: 'IMAGE_ONLY' as ThreadSectionType,
        imageUrl: { uri: selectedImage },
      });
    }

    // NFT listing section
    if (selectedListingNft) {
      sections.push({
        id: 'section-' + Math.random().toString(36).substr(2, 9),
        type: 'NFT_LISTING',
        listingData: {
          mint: selectedListingNft.mint,
          owner: currentUser.id,
          priceSol: selectedListingNft.priceSol,
          name: selectedListingNft.name,
          image: selectedListingNft.image,
        },
      });
    }

    // Construct a fallback post object to use if network fails.
    const fallbackPost = {
      id: 'local-' + Math.random().toString(36).substr(2, 9),
      user: currentUser,
      sections,
      createdAt: new Date().toISOString(),
      parentId: parentId ? parentId : undefined,
      replies: [],
      reactionCount: 0,
      retweetCount: 0,
      quoteCount: 0,
    };

    try {
      if (parentId) {
        await dispatch(createReplyAsync({ parentId, user: currentUser, sections })).unwrap();
      } else {
        await dispatch(createRootPostAsync({ user: currentUser, sections })).unwrap();
      }
      // Clear input values and trigger any provided callback.
      setTextValue('');
      setSelectedImage(null);
      setSelectedListingNft(null);
      onPostCreated && onPostCreated();
    } catch (error: any) {
      console.warn('Network request failed, adding post locally:', error.message);
      // If network fails, add post locally.
      if (parentId) {
        dispatch(addReplyLocally({ parentId, reply: fallbackPost }));
      } else {
        dispatch(addPostLocally(fallbackPost));
      }
      // Clear inputs and trigger callback regardless.
      setTextValue('');
      setSelectedImage(null);
      setSelectedListingNft(null);
      onPostCreated && onPostCreated();
    }
  };

  /***************************************************
   * 2) Image picking
   ***************************************************/
  const handleMediaPress = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 1,
      includeBase64: true, // Include base64 data
    };
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error:', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        // If base64 is provided, build a data URL so the <Image> component can decode it.
        if (asset.base64 && asset.type) {
          setSelectedImage(`data:${asset.type};base64,${asset.base64}`);
        } else if (asset.uri) {
          setSelectedImage(asset.uri);
        }
      }
    });
  };

  /***************************************************
   * 3) NFT Listing Modal
   ***************************************************/
  const handleNftListingPress = async () => {
    setShowListingModal(true);
    if (listingItems.length === 0) {
      await fetchActiveListings(userPublicKey);
    }
  };

  const fetchActiveListings = async (pubkey: string | null) => {
    if (!pubkey) {
      Alert.alert('Not logged in', 'Connect your wallet first');
      return;
    }
    setLoadingListings(true);
    try {
      const url = `https://api.mainnet.tensordev.io/api/v1/user/active_listings?wallets=${pubkey}&sortBy=PriceAsc&limit=50`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-tensor-api-key': TENSOR_API_KEY,
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch listings. status=${res.status}`);
      }
      const data = await res.json();
      if (data.listings && Array.isArray(data.listings)) {
        const mapped: NftItem[] = data.listings.map((item: any) => {
          const mintObj = item.mint || {};
          const mintAddress =
            typeof item.mint === 'object' && item.mint.onchainId
              ? item.mint.onchainId
              : item.mint;
          const nftName = mintObj?.name || 'Unnamed NFT';
          const nftImage = fixImageUrl(mintObj?.imageUri) || '';
          const lamports = parseInt(item.grossAmount || '0', 10);
          const priceSol = lamports / 1_000_000_000;
          return {
            mint: mintAddress,
            name: nftName,
            image: nftImage,
            priceSol,
            collection: mintObj?.collName || '',
          };
        });
        setListingItems(mapped);
      } else {
        setListingItems([]);
      }
    } catch (err: any) {
      console.error('fetchActiveListings error:', err);
      Alert.alert('Error', err.message);
    } finally {
      setLoadingListings(false);
    }
  };

  const fixImageUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    if (url.startsWith('ar://')) {
      return url.replace('ar://', 'https://arweave.net/');
    }
    if (url.startsWith('/')) {
      return `https://arweave.net${url}`;
    }
    if (!url.startsWith('http') && !url.startsWith('data:')) {
      return `https://${url}`;
    }
    return url;
  };

  const closeListingModal = () => {
    setShowListingModal(false);
  };

  const handleSelectListing = (item: NftItem) => {
    setSelectedListingNft(item);
    closeListingModal();
  };

  const renderListingItem = ({ item }: { item: NftItem }) => (
    <TouchableOpacity
      style={modalStyles.listingCard}
      onPress={() => handleSelectListing(item)}>
      <Image source={{ uri: item.image }} style={modalStyles.listingImage} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={modalStyles.listingName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.priceSol !== undefined && (
          <Text style={modalStyles.listingPrice}>
            {item.priceSol.toFixed(2)} SOL
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  /***************************************************
   * 4) Additional Trade Modal
   ***************************************************/
  const handleTradePress = () => {
    setShowTradeModal(true);
  };

  const closeTradeModal = () => {
    setShowTradeModal(false);
  };

  /***************************************************
   * 5) RENDER
   ***************************************************/
  return (
    <View>
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
            <Image
              source={{ uri: selectedImage }}
              style={{ width: 100, height: 100, marginTop: 10 }}
            />
          )}
          {selectedListingNft && (
            <View style={styles.composerTradePreview}>
              <Image
                source={{ uri: selectedListingNft.image }}
                style={styles.composerTradeImage}
              />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={styles.composerTradeName} numberOfLines={1}>
                  {selectedListingNft.name}
                </Text>
                {selectedListingNft.priceSol && (
                  <Text style={styles.composerTradePrice}>
                    {selectedListingNft.priceSol.toFixed(2)} SOL
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.composerTradeRemove}
                onPress={() => setSelectedListingNft(null)}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>X</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.iconsRow}>
            <View style={styles.leftIcons}>
              <TouchableOpacity onPress={handleMediaPress}>
                <Icons.MediaIcon width={18} height={18} />
              </TouchableOpacity>
              {/* NFT Listing Modal Trigger */}
              <TouchableOpacity
                onPress={handleNftListingPress}
                style={styles.nftListingTrigger}>
                <Text style={{ fontSize: 12, color: '#666666' }}>
                  NFT Listing
                </Text>
              </TouchableOpacity>
              {/* Additional Trade Modal Trigger */}
              <TouchableOpacity
                onPress={handleTradePress}
                style={styles.tradeModalTrigger}>
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

      {/* NFT Listing Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showListingModal}
        onRequestClose={closeListingModal}>
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContainer}>
            <Text style={modalStyles.modalTitle}>NFT Listing Modal</Text>
            {loadingListings ? (
              <ActivityIndicator size="large" color="#1d9bf0" />
            ) : listingItems.length === 0 ? (
              <Text style={{ marginTop: 16, color: '#666' }}>
                No active listings found.
              </Text>
            ) : (
              <FlatList
                data={listingItems}
                keyExtractor={(item) => item.mint}
                renderItem={renderListingItem}
                style={{ marginTop: 10, width: '100%' }}
              />
            )}
            <TouchableOpacity
              onPress={closeListingModal}
              style={modalStyles.closeButton}>
              <Text style={modalStyles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Additional Trade Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTradeModal}
        onRequestClose={closeTradeModal}>
        <View style={tradeModalStyles.modalOverlay}>
          <View style={tradeModalStyles.modalContainer}>
            <Text style={tradeModalStyles.modalTitle}>Trade Modal</Text>
            <Text style={tradeModalStyles.modalContent}>
              Customize your trade in this modal...
            </Text>
            <TouchableOpacity
              onPress={closeTradeModal}
              style={tradeModalStyles.closeButton}>
              <Text style={tradeModalStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/** Minimal styling for modals */
const modalStyles = StyleSheet.create({
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

const tradeModalStyles = StyleSheet.create({
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
