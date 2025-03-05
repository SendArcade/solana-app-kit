import React, {useState} from 'react';
import {
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Text,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icons from '../../assets/svgs';
import {useAppDispatch, useAppSelector} from '../../hooks/useReduxHooks';
import {
  createRootPostAsync,
  createReplyAsync,
  addPostLocally,
  addReplyLocally,
} from '../../state/thread/reducer';
import {createThreadStyles, getMergedTheme} from './thread.styles';
import {ThreadSection, ThreadSectionType, ThreadUser} from './thread.types';
import {
  ImageLibraryOptions,
  launchImageLibrary,
} from 'react-native-image-picker';
import {TENSOR_API_KEY} from '@env';
import {useAuth} from '../../hooks/useAuth';
import TradeModal from './TradeModal';
import { DEFAULT_IMAGES } from '../../config/constants';

interface NftItem {
  mint: string;
  name: string;
  image: string;
  priceSol?: number;
  collection?: string;
}

interface ThreadComposerProps {
  currentUser: ThreadUser; // must have user.id = wallet address
  parentId?: string; // if present, it's a reply
  onPostCreated?: () => void;
  themeOverrides?: Partial<Record<string, any>>;
  styleOverrides?: {[key: string]: object};
  userStyleSheet?: {[key: string]: object};
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
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
  const {solanaWallet} = useAuth();
  const userPublicKey = solanaWallet?.wallets?.[0]?.publicKey || null;

  // Helper function to get a proper image source
  const getAvatarSource = () => {
    if (storedProfilePic && typeof storedProfilePic === 'string') {
      return {uri: storedProfilePic};
    }
    if (currentUser.avatar) {
      if (typeof currentUser.avatar === 'string') {
        return {uri: currentUser.avatar};
      } else {
        // Already a valid image source (e.g. a number from require)
        return currentUser.avatar;
      }
    }
    return DEFAULT_IMAGES.user;
  };

  // Basic composer state
  const [textValue, setTextValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // NFT listing states
  const [showListingModal, setShowListingModal] = useState(false);
  const [listingItems, setListingItems] = useState<NftItem[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [selectedListingNft, setSelectedListingNft] = useState<NftItem | null>(
    null,
  );

  // Show/hide the TradeModal
  const [showTradeModal, setShowTradeModal] = useState(false);

  // Merged theme
  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(
    mergedTheme,
    styleOverrides,
    userStyleSheet,
  );

  /***************************************************
   * Post creation logic
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

    // Image section
    if (selectedImage) {
      // If using an image-only section, ensure the type matches the expected one.
      sections.push({
        id: 'section-' + Math.random().toString(36).substr(2, 9),
        type: 'IMAGE_ONLY' as ThreadSectionType,
        imageUrl: {uri: selectedImage},
      });
    }

    // NFT listing
    if (selectedListingNft) {
      sections.push({
        id: 'section-' + Math.random().toString(36).substr(2, 9),
        type: 'NFT_LISTING',
        listingData: {
          mint: selectedListingNft.mint,
          owner: currentUser.id, // wallet address
          priceSol: selectedListingNft.priceSol,
          name: selectedListingNft.name,
          image: selectedListingNft.image,
        },
      });
    }

    // Fallback post if network fails
    const fallbackPost = {
      id: 'local-' + Math.random().toString(36).substr(2, 9),
      user: currentUser,
      sections,
      createdAt: new Date().toISOString(),
      parentId: parentId ?? undefined,
      replies: [],
      reactionCount: 0,
      retweetCount: 0,
      quoteCount: 0,
    };

    try {
      if (parentId) {
        // create a reply
        await dispatch(
          createReplyAsync({
            parentId,
            user: currentUser, // user.id = wallet address
            sections,
          }),
        ).unwrap();
      } else {
        // create a root post
        await dispatch(
          createRootPostAsync({
            user: currentUser, // user.id = wallet address
            sections,
          }),
        ).unwrap();
      }

      // Clear composer
      setTextValue('');
      setSelectedImage(null);
      setSelectedListingNft(null);
      onPostCreated && onPostCreated();
    } catch (error: any) {
      console.warn(
        'Network request failed, adding post locally:',
        error.message,
      );
      if (parentId) {
        dispatch(addReplyLocally({parentId, reply: fallbackPost}));
      } else {
        dispatch(addPostLocally(fallbackPost));
      }
      setTextValue('');
      setSelectedImage(null);
      setSelectedListingNft(null);
      onPostCreated && onPostCreated();
    }
  };

  /***************************************************
   * Media picking
   ***************************************************/
  const handleMediaPress = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 1,
      includeBase64: true,
    };
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error:', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (asset.base64 && asset.type) {
          setSelectedImage(`data:${asset.type};base64,${asset.base64}`);
        } else if (asset.uri) {
          setSelectedImage(asset.uri);
        }
      }
    });
  };

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
      console.log('Fetched listings:', data);
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


  /***************************************************
   * RENDER
   ***************************************************/
  return (
    <View>
      <View style={styles.composerContainer}>
        <View style={styles.composerAvatarContainer}>
          <Image source={getAvatarSource()} style={styles.composerAvatar} />
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
            {/* Selected image preview */}
            {selectedImage && (
              <Image
                source={{uri: selectedImage}}
                style={{width: 100, height: 100, marginTop: 10}}
              />
            )}
            {/* NFT listing preview */}
            {selectedListingNft && (
              <View style={styles.composerTradePreview}>
                <Image
                  source={{uri: selectedListingNft.image}}
                  style={styles.composerTradeImage}
                />
                <View style={{marginLeft: 8, flex: 1}}>
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
                  <Text style={{color: '#fff', fontWeight: '600'}}>X</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* Buttons */}
            <View style={styles.iconsRow}>
              <View style={styles.leftIcons}>
                <TouchableOpacity onPress={handleMediaPress}>
                  <Icons.MediaIcon width={18} height={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleNftListingPress}
                  style={{marginLeft: 8}}>
                  <Text style={{fontSize: 12, color: '#666666'}}>
                    NFT Listing
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowTradeModal(true)}
                  style={{marginLeft: 8}}>
                  <Text style={{fontSize: 12, color: '#333333'}}>
                    Trade/Share
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handlePost}>
                <Text style={{color: '#1d9bf0', fontWeight: '600'}}>
                  {parentId ? 'Reply' : 'Post'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
  
        <Modal
          animationType="slide"
          transparent={true}
          visible={showListingModal}
          onRequestClose={closeListingModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>NFT Listing Modal</Text>
              {loadingListings ? (
                <ActivityIndicator size="large" color="#1d9bf0" />
              ) : listingItems.length === 0 ? (
                <Text style={{marginTop: 16, color: '#666'}}>
                  No active listings found.
                </Text>
              ) : (
                <FlatList
                  data={listingItems}
                  keyExtractor={item => item.mint}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={styles.listingCard}
                      onPress={() => handleSelectListing(item)}>
                      <Image
                        source={{uri: item.image}}
                        style={styles.listingImage}
                      />
                      <View style={{flex: 1, marginLeft: 10}}>
                        <Text style={styles.listingName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {item.priceSol !== undefined && (
                          <Text style={styles.listingPrice}>
                            {item.priceSol.toFixed(2)} SOL
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                  style={{marginTop: 10, width: '100%'}}
                />
              )}
              <TouchableOpacity
                onPress={closeListingModal}
                style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
  
        <TradeModal
          visible={showTradeModal}
          onClose={() => setShowTradeModal(false)}
          currentUser={currentUser}
          onPostCreated={onPostCreated}
        />
      </View>
    );
  }
