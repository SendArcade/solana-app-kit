import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import {
  styles,
  modalUI,
  confirmModalUI,
  inlineConfirmStyles,
} from './ProfileScreen.styles';
import {useAppSelector, useAppDispatch} from '../../../../hooks/useReduxHooks';
import {ThreadPost} from '../../../../components/thread/thread.types';
import ProfileIcons from '../../../../assets/svgs';
import {
  updateProfilePic,
  fetchProfilePic,
} from '../../../../state/auth/reducer';
import {fetchWithRetries} from '../../../../utils/common/fetch';
import {TENSOR_API_KEY} from '@env';

interface NftItem {
  mint: string;
  name: string;
  image: string;
  collection?: string;
}

const SERVER_BASE_URL = process.env.SERVER_URL || 'http://localhost:3000/api';

/**
 * Helper to fix IPFS/ar:// URIs if needed.
 */
function fixImageUrl(url: string): string {
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
}

export default function ProfileScreen() {
  const userWallet = useAppSelector(state => state.auth.address);
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
  const dispatch = useAppDispatch();

  const {allPosts} = useAppSelector(state => state.thread);
  const [myPosts, setMyPosts] = useState<ThreadPost[]>([]);

  // Current profile pic
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(
    storedProfilePic,
  );

  // Modal for NFT flow (we use inline confirmation for library images)
  const [avatarOptionModalVisible, setAvatarOptionModalVisible] =
    useState(false);
  const [confirmModalVisible, setConfirmModalVisible] =
    useState<boolean>(false);

  // This state stores the new avatar URI (from library or NFT)
  const [localFileUri, setLocalFileUri] = useState<string | null>(null);
  // We use selectedSource to know if the image came from 'library' or 'nft'
  const [selectedSource, setSelectedSource] = useState<
    'library' | 'nft' | null
  >(null);

  // NFT modal states
  const [nftsModalVisible, setNftsModalVisible] = useState(false);
  const [ownedNfts, setOwnedNfts] = useState<NftItem[]>([]);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [fetchNftsError, setFetchNftsError] = useState<string | null>(null);

  /*******************************************************
   * Request media library permissions
   *******************************************************/
  useEffect(() => {
    (async () => {
      console.log('>>> Requesting media library permissions...');
      const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need your permission to access the library.',
        );
      }
    })();
  }, []);

  /*******************************************************
   * Load user’s posts
   *******************************************************/
  useEffect(() => {
    if (!userWallet) {
      setMyPosts([]);
      return;
    }
    const userPosts = allPosts.filter(
      p => p.user.id.toLowerCase() === userWallet.toLowerCase(),
    );
    userPosts.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    setMyPosts(userPosts);
  }, [allPosts, userWallet]);

  /*******************************************************
   * Load user’s Profile Pic from DB
   *******************************************************/
  useEffect(() => {
    if (userWallet) {
      dispatch(fetchProfilePic(userWallet))
        .unwrap()
        .then(url => {
          setProfilePicUrl(url);
        })
        .catch(err => {
          console.error('Failed to fetch profile picture:', err);
        });
    }
  }, [userWallet, dispatch]);

  /*******************************************************
   * Library Image Picker (minimal approach, inline confirmation)
   *******************************************************/
  const handlePickProfilePicture = async () => {
    try {
      console.log('>>> handlePickProfilePicture (library)');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
      });
      console.log('>>> Picker result:', result);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        console.log('>>> Picked library image URI:', pickedUri);
        setLocalFileUri(pickedUri);
        setSelectedSource('library');
        setAvatarOptionModalVisible(false);
      }
    } catch (error: any) {
      console.log('>>> handlePickProfilePicture error:', error);
      Alert.alert('Error picking image', error.message);
    }
  };

  /*******************************************************
   * NFT Flow: Show NFT selection modal
   *******************************************************/
  const handleSelectNftOption = () => {
    setAvatarOptionModalVisible(false);
    setNftsModalVisible(true);
    fetchOwnedNfts();
  };

  const fetchOwnedNfts = useCallback(async () => {
    if (!userWallet) return;
    console.log('>>> Fetching NFTs for wallet:', userWallet);
    setLoadingNfts(true);
    setOwnedNfts([]);
    setFetchNftsError(null);
    try {
      const url = `https://api.mainnet.tensordev.io/api/v1/user/portfolio?wallet=${userWallet}&includeUnverified=true&includeCompressed=true&includeFavouriteCount=true`;
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-tensor-api-key': TENSOR_API_KEY,
        },
      };
      const response = await fetchWithRetries(url, options);
      if (!response.ok) {
        throw new Error(
          `Portfolio API request failed with status ${response.status}`,
        );
      }
      const data = await response.json();
      const dataArray = Array.isArray(data) ? data : [];
      const mappedNfts: NftItem[] = dataArray
        .map((item: any) => {
          if (!item.setterMintMe) return null;
          const mint = item.setterMintMe;
          const name = item.name || 'Unnamed NFT';
          const img = fixImageUrl(item.imageUri || '');
          const collection = item.slugDisplay || '';
          return {mint, name, image: img, collection};
        })
        .filter(Boolean) as NftItem[];
      setOwnedNfts(mappedNfts);
    } catch (err: any) {
      console.error('[fetchOwnedNfts] error:', err);
      setFetchNftsError(err.message);
    } finally {
      setLoadingNfts(false);
    }
  }, [userWallet]);

  const handleSelectNftAsAvatar = (nft: NftItem) => {
    console.log('>>> handleSelectNftAsAvatar for:', nft.mint);
    setLocalFileUri(nft.image);
    setSelectedSource('nft');
    setNftsModalVisible(false);
    // Open NFT confirm modal (we use a modal overlay for NFT)
    setConfirmModalVisible(true);
  };

  /*******************************************************
   * Confirm Upload (common for both flows)
   *******************************************************/
  const handleConfirmUpload = async () => {
    if (!localFileUri) {
      Alert.alert('Missing Image', 'No image to upload.');
      setConfirmModalVisible(false);
      setSelectedSource(null);
      return;
    }
    if (!userWallet) {
      Alert.alert('Missing Wallet', 'Connect a wallet before uploading.');
      setConfirmModalVisible(false);
      setSelectedSource(null);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('userId', userWallet);
      formData.append('profilePic', {
        uri: localFileUri,
        type: 'image/jpeg',
        name: `profile_${Date.now()}.jpg`,
      } as any);
      console.log('>>> Uploading to:', `${SERVER_BASE_URL}/profile/upload`);
      const response = await fetch(`${SERVER_BASE_URL}/profile/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }
      setProfilePicUrl(data.url);
      dispatch(updateProfilePic(data.url));
      console.log('>>> Updated profile pic to:', data.url);
    } catch (err: any) {
      Alert.alert('Upload Error', err.message);
      console.log('>>> handleConfirmUpload error:', err);
    } finally {
      setConfirmModalVisible(false);
      setLocalFileUri(null);
      setSelectedSource(null);
    }
  };

  const handleCancelUpload = () => {
    console.log('>>> Canceling confirm upload');
    setConfirmModalVisible(false);
    setLocalFileUri(null);
    setSelectedSource(null);
  };

  /*******************************************************
   * Render posts
   *******************************************************/
  const renderPostItem = ({item}: {item: ThreadPost}) => {
    const firstTextSection = item.sections.find(s => !!s.text)?.text;
    return (
      <View style={styles.postItemContainer}>
        <Image
          source={
            item.user.avatar
              ? {uri: item.user.avatar}
              : require('../../../../assets/images/User.png')
          }
          style={styles.postItemAvatar}
        />
        <View style={styles.postItemContent}>
          <View style={styles.postHeaderRow}>
            <Text style={styles.postUsername}>{item.user.username}</Text>
            <Text style={styles.postHandle}>{item.user.handle}</Text>
          </View>
          {item.parentId ? (
            <Text style={styles.replyNote}>Replying to {item.parentId}</Text>
          ) : null}
          {firstTextSection && (
            <Text style={styles.postText}>{firstTextSection}</Text>
          )}
        </View>
      </View>
    );
  };

  /*******************************************************
   * Main render
   *******************************************************/
  return (
    <SafeAreaView
      style={
        (styles.container, Platform.OS === 'android' && androidStyles.safeArea)
      }>
      {/* Banner */}
      <View style={styles.bannerContainer}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?fit=crop&w=1200&q=80',
          }}
          style={styles.bannerImage}
        />
      </View>

      {/* Profile header */}
      <View style={styles.profileHeaderContainer}>
        <TouchableOpacity
          style={styles.profileAvatarWrapper}
          onPress={() => setAvatarOptionModalVisible(true)}>
          <Image
            source={
              profilePicUrl
                ? {uri: profilePicUrl}
                : require('../../../../assets/images/User.png')
            }
            style={styles.profileAvatar}
          />
        </TouchableOpacity>
        <View style={styles.profileTextInfo}>
          <Text style={styles.profileUsername}>My Profile</Text>
          <View style={styles.usernameRow}>
            <Text style={styles.profileHandle}>
              {userWallet
                ? '@' + userWallet.slice(0, 6) + '...' + userWallet.slice(-4)
                : '@no_wallet'}
            </Text>
            <ProfileIcons.BlueCheck
              width={14}
              height={14}
              style={styles.verifiedIcon}
            />
          </View>
          <Text style={styles.profileBio}>
            Explorer, builder, and #Solana advocate. Sharing my journey in web3.
          </Text>
        </View>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.editProfileBtn}>
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>42</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>98</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
        </View>
      </View>

      {/* Inline confirmation for library image */}
      {selectedSource === 'library' && localFileUri && (
        <View style={inlineConfirmStyles.container}>
          <Text style={inlineConfirmStyles.title}>Confirm Profile Picture</Text>
          <Image
            source={{uri: localFileUri}}
            style={inlineConfirmStyles.preview}
            onError={err => {
              console.log('Inline confirm image load fail:', err.nativeEvent);
              Alert.alert('Image Load Error', JSON.stringify(err.nativeEvent));
            }}
          />
          <View style={inlineConfirmStyles.buttonRow}>
            <TouchableOpacity
              style={[inlineConfirmStyles.button, {backgroundColor: '#aaa'}]}
              onPress={handleCancelUpload}>
              <Text style={inlineConfirmStyles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[inlineConfirmStyles.button, {backgroundColor: '#1d9bf0'}]}
              onPress={handleConfirmUpload}>
              <Text style={inlineConfirmStyles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Posts */}
      <FlatList
        data={myPosts}
        keyExtractor={post => post.id}
        renderItem={renderPostItem}
        ListEmptyComponent={
          <View style={styles.noPostContainer}>
            <Text style={styles.noPostText}>
              You haven&apos;t posted or replied yet!
            </Text>
          </View>
        }
        style={{flex: 1}}
        contentContainerStyle={styles.flatListContent}
      />

      {/* (A) Avatar Option Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={avatarOptionModalVisible}
        onRequestClose={() => setAvatarOptionModalVisible(false)}>
        <View style={modalUI.overlay}>
          <View style={modalUI.optionContainer}>
            <Text style={modalUI.optionTitle}>Choose avatar source</Text>
            <TouchableOpacity
              style={modalUI.optionButton}
              onPress={handlePickProfilePicture}>
              <Text style={modalUI.optionButtonText}>Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalUI.optionButton}
              onPress={handleSelectNftOption}>
              <Text style={modalUI.optionButtonText}>My NFTs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalUI.optionButton, {backgroundColor: 'gray'}]}
              onPress={() => setAvatarOptionModalVisible(false)}>
              <Text style={modalUI.optionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* (B) NFT-Selection Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={nftsModalVisible}
        onRequestClose={() => setNftsModalVisible(false)}>
        <View style={modalUI.nftOverlay}>
          <View style={modalUI.nftContainer}>
            <Text style={modalUI.nftTitle}>Select an NFT</Text>
            {loadingNfts ? (
              <View style={{marginTop: 20}}>
                <ActivityIndicator size="large" color="#1d9bf0" />
                <Text
                  style={{marginTop: 8, color: '#666', textAlign: 'center'}}>
                  Loading your NFTs...
                </Text>
              </View>
            ) : fetchNftsError ? (
              <Text style={modalUI.nftError}>{fetchNftsError}</Text>
            ) : (
              <FlatList
                data={ownedNfts}
                keyExtractor={item => item.mint}
                style={{marginVertical: 10}}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={modalUI.nftItem}
                    onPress={() => handleSelectNftAsAvatar(item)}>
                    <View style={modalUI.nftImageContainer}>
                      {item.image ? (
                        <Image
                          source={{uri: item.image}}
                          style={modalUI.nftImage}
                        />
                      ) : (
                        <View style={modalUI.nftPlaceholder}>
                          <Text style={{color: '#666'}}>No Image</Text>
                        </View>
                      )}
                    </View>
                    <View style={{flex: 1, marginLeft: 12}}>
                      <Text style={modalUI.nftName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.collection ? (
                        <Text style={modalUI.nftCollection}>
                          {item.collection}
                        </Text>
                      ) : null}
                      <Text style={modalUI.nftMint} numberOfLines={1}>
                        {item.mint.slice(0, 8) + '...' + item.mint.slice(-4)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={modalUI.nftError}>
                    You have no NFTs in this wallet.
                  </Text>
                }
              />
            )}
            <TouchableOpacity
              style={[modalUI.closeButton, {marginTop: 10}]}
              onPress={() => setNftsModalVisible(false)}>
              <Text style={modalUI.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* (C) NFT Confirm Modal */}
      {selectedSource === 'nft' && confirmModalVisible && (
        <Modal
          animationType="fade"
          transparent
          visible={confirmModalVisible}
          onRequestClose={handleCancelUpload}>
          <View style={confirmModalUI.overlay}>
            <View style={confirmModalUI.container}>
              <Text style={confirmModalUI.title}>
                Confirm NFT Profile Picture
              </Text>
              {localFileUri ? (
                <Image
                  source={{uri: localFileUri}}
                  style={confirmModalUI.preview}
                  onError={err => {
                    console.log(
                      'NFT confirm modal image load fail:',
                      err.nativeEvent,
                    );
                    Alert.alert(
                      'Image Load Error',
                      JSON.stringify(err.nativeEvent),
                    );
                  }}
                />
              ) : (
                <Text style={{marginVertical: 20, color: '#666'}}>
                  No pending image
                </Text>
              )}
              <View style={confirmModalUI.buttonRow}>
                <TouchableOpacity
                  style={[
                    confirmModalUI.modalButton,
                    {backgroundColor: '#aaa'},
                  ]}
                  onPress={handleCancelUpload}>
                  <Text style={confirmModalUI.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    confirmModalUI.modalButton,
                    {backgroundColor: '#1d9bf0'},
                  ]}
                  onPress={handleConfirmUpload}>
                  <Text style={confirmModalUI.buttonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const androidStyles = StyleSheet.create({
  safeArea: {
    paddingTop: 30, // Additional padding for Android devices
  },
});
