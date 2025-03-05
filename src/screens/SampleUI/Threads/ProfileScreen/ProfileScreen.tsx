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
  TextInput,
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
  fetchUserProfile,
  updateUsername,
} from '../../../../state/auth/reducer';
import {fetchWithRetries} from '../../../../utils/common/fetch';
import {SERVER_URL, TENSOR_API_KEY} from '@env';
import { DEFAULT_IMAGES } from '../../../../config/constants';

interface NftItem {
  mint: string;
  name: string;
  image: string;
  collection?: string;
}

const SERVER_BASE_URL = SERVER_URL || 'http://localhost:3000';

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
  const storedUsername = useAppSelector(state => state.auth.username);
  const dispatch = useAppDispatch();

  const {allPosts} = useAppSelector(state => state.thread);
  const [myPosts, setMyPosts] = useState<ThreadPost[]>([]);

  // Current profile pic in local component state
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(
    storedProfilePic,
  );

  // Modal for editing user name
  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [tempName, setTempName] = useState(storedUsername || '');

  // Modal for avatar picking approach
  const [avatarOptionModalVisible, setAvatarOptionModalVisible] =
    useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState<boolean>(false);

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
    const userPosts = allPosts.filter(p => {
      console.log('Post being checked:', p, userWallet);
      return p.user.id.toLowerCase() === userWallet.toLowerCase();
    });
    userPosts.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    setMyPosts(userPosts);
  }, [allPosts, userWallet]);

  /*******************************************************
   * Load user’s Profile Pic + username from DB
   *******************************************************/
  useEffect(() => {
    if (userWallet) {
      dispatch(fetchUserProfile(userWallet))
        .unwrap()
        .then(value => {
          setProfilePicUrl(value.profilePicUrl);
        })
        .catch(err => {
          console.error('Failed to fetch user profile:', err);
        });
    }
  }, [userWallet, dispatch]);

  /*******************************************************
   * Library Image Picker (inline confirmation)
   *******************************************************/
  const handlePickProfilePicture = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        setLocalFileUri(pickedUri);
        setSelectedSource('library');
        setAvatarOptionModalVisible(false);
      }
    } catch (error: any) {
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
      setFetchNftsError(err.message);
    } finally {
      setLoadingNfts(false);
    }
  }, [userWallet]);

  const handleSelectNftAsAvatar = (nft: NftItem) => {
    setLocalFileUri(nft.image);
    setSelectedSource('nft');
    setNftsModalVisible(false);
    setConfirmModalVisible(true);
  };

  /*******************************************************
   * Confirm Upload (common for library or NFT)
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

      const response = await fetch(`${SERVER_BASE_URL}/api/profile/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }
      setProfilePicUrl(data.url);
      dispatch(updateProfilePic(data.url));
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
    setConfirmModalVisible(false);
    setLocalFileUri(null);
    setSelectedSource(null);
  };

  /*******************************************************
   * Edit Name Modal Flow
   *******************************************************/
  const handleOpenEditModal = () => {
    setTempName(storedUsername || '');
    setEditNameModalVisible(true);
  };

  const handleSaveName = async () => {
    if (!userWallet) return Alert.alert('No wallet to update name');
    if (!tempName.trim()) {
      Alert.alert('Empty Name', 'Please enter a valid name');
      return;
    }
    try {
      await dispatch(
        updateUsername({ userId: userWallet, newUsername: tempName.trim() }),
      ).unwrap();
    } catch (err: any) {
      Alert.alert('Update Name Failed', err.message || 'Unknown error');
    } finally {
      setEditNameModalVisible(false);
    }
  };

  /*******************************************************
   * Render user’s posts
   *******************************************************/
  const renderPostItem = ({item}: {item: ThreadPost}) => {
    const firstTextSection = item.sections.find(s => !!s.text)?.text;
    return (
      <View style={styles.postItemContainer}>
        <Image
          source={
            item.user.avatar
              ? {uri: item.user.avatar}
              : DEFAULT_IMAGES.user
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

  return (
    <SafeAreaView
      style={[
        styles.container,
        Platform.OS === 'android' && androidStyles.safeArea,
      ]}>
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
                : DEFAULT_IMAGES.user
            }
            style={styles.profileAvatar}
          />
        </TouchableOpacity>
        <View style={styles.profileTextInfo}>
          <Text style={styles.profileUsername}>
            {storedUsername || 'My Profile'}
          </Text>
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
          <TouchableOpacity style={styles.editProfileBtn} onPress={handleOpenEditModal}>
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

      {/* Posts List */}
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

      {/** (A) Modal for choosing avatar approach */}
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

      {/** (B) NFT Selection Modal */}
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
                <Text style={{marginTop: 8, color: '#666', textAlign: 'center'}}>
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

      {/** (C) Confirm NFT Upload Modal */}
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
                    Alert.alert('Image Load Error', JSON.stringify(err.nativeEvent));
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

      {/** (D) Edit Name Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={editNameModalVisible}
        onRequestClose={() => setEditNameModalVisible(false)}>
        <View style={editModalStyles.overlay}>
          <View style={editModalStyles.container}>
            <Text style={editModalStyles.title}>Edit Profile Name</Text>
            <TextInput
              style={editModalStyles.input}
              placeholder="Enter your display name"
              value={tempName}
              onChangeText={setTempName}
            />
            <View style={editModalStyles.btnRow}>
              <TouchableOpacity
                style={[editModalStyles.button, {backgroundColor: 'gray'}]}
                onPress={() => setEditNameModalVisible(false)}>
                <Text style={editModalStyles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[editModalStyles.button, {backgroundColor: '#1d9bf0'}]}
                onPress={handleSaveName}>
                <Text style={editModalStyles.btnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const androidStyles = StyleSheet.create({
  safeArea: {
    paddingTop: 30,
  },
});

/**
 * Minimal local styles for the "Edit Name" modal
 */
const editModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 15,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    minWidth: 80,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginLeft: 10,
  },
  btnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
