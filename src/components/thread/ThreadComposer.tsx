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
import TradeModal from './/trade/TradeModal';
import {DEFAULT_IMAGES} from '../../config/constants';
import {NftItem, useFetchNFTs} from '../../hooks/useFetchNFTs';

/**
 * Props for the ThreadComposer component
 * @interface ThreadComposerProps
 */
interface ThreadComposerProps {
  /** Current user information - must have user.id set to wallet address */
  currentUser: ThreadUser;
  /** Optional parent post ID - if present, this composer is for a reply */
  parentId?: string;
  /** Callback fired when a new post is created */
  onPostCreated?: () => void;
  /** Theme overrides for customizing appearance */
  themeOverrides?: Partial<Record<string, any>>;
  /** Style overrides for specific components */
  styleOverrides?: {[key: string]: object};
  /** User-provided stylesheet overrides */
  userStyleSheet?: {[key: string]: object};
}

/**
 * A component for composing new posts and replies in a thread
 *
 * @component
 * @description
 * ThreadComposer provides a rich text editor for creating new posts and replies in a thread.
 * It supports text input, image attachments, and NFT listings. The component handles both
 * root-level posts and nested replies, with appropriate styling and behavior for each case.
 *
 * Features:
 * - Text input with placeholder text
 * - Image attachment support
 * - NFT listing integration
 * - Reply composition
 * - Offline fallback support
 * - Customizable theming
 *
 * @example
 * ```tsx
 * <ThreadComposer
 *   currentUser={user}
 *   parentId="post-123" // Optional, for replies
 *   onPostCreated={() => refetchPosts()}
 *   themeOverrides={{ '--primary-color': '#1D9BF0' }}
 * />
 * ```
 */
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

  // Basic composer state
  const [textValue, setTextValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // NFT listing states
  const [showListingModal, setShowListingModal] = useState(false);
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

  // Reuse shared NFT hook
  const {
    nfts: listingItems,
    loading: loadingListings,
    error: fetchNftsError,
  } = useFetchNFTs(userPublicKey || undefined);

  /**
   * Post creation logic
   */
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
      sections.push({
        id: 'section-' + Math.random().toString(36).substr(2, 9),
        type: 'TEXT_IMAGE',
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
          priceSol: undefined, // or logic if you have a price
          name: selectedListingNft.name,
          image: selectedListingNft.image,
        },
      });
    }

    // Fallback post if network fails
    const fallbackPost = {
      id: 'local-' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
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
        // create a reply by passing only the user id
        await dispatch(
          createReplyAsync({
            parentId,
            userId: currentUser.id,
            sections,
          }),
        ).unwrap();
      } else {
        // create a root post by passing only the user id
        await dispatch(
          createRootPostAsync({
            userId: currentUser.id,
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

  /**
   * Media picking
   */
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

  /**
   * Listing Flow
   */
  const handleNftListingPress = () => {
    setShowListingModal(true);
  };

  const handleSelectListing = (item: NftItem) => {
    setSelectedListingNft(item);
    setShowListingModal(false);
  };

  return (
    <View>
      <View style={styles.composerContainer}>
        <View style={styles.composerAvatarContainer}>
          <Image
            source={
              storedProfilePic
                ? {uri: storedProfilePic}
                : currentUser.avatar
                ? currentUser.avatar
                : DEFAULT_IMAGES.user
            }
            style={styles.composerAvatar}
          />
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
                {/* If price is known, display it */}
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

      {/* Listing Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showListingModal}
        onRequestClose={() => setShowListingModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>NFT Listing Modal</Text>

            {loadingListings ? (
              <ActivityIndicator
                size="large"
                color="#1d9bf0"
                style={{marginTop: 20}}
              />
            ) : fetchNftsError ? (
              <Text style={{marginTop: 16, color: '#666', textAlign: 'center'}}>
                {fetchNftsError}
              </Text>
            ) : listingItems.length === 0 ? (
              <Text style={{marginTop: 16, color: '#666', textAlign: 'center'}}>
                No NFTs found.
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
                      {/* Optional: show item.collection */}
                    </View>
                  </TouchableOpacity>
                )}
                style={{marginTop: 10, width: '100%'}}
              />
            )}

            <TouchableOpacity
              onPress={() => setShowListingModal(false)}
              style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Trade Modal */}
      <TradeModal
        visible={showTradeModal}
        onClose={() => setShowTradeModal(false)}
        currentUser={currentUser}
        onPostCreated={onPostCreated}
      />
    </View>
  );
}
