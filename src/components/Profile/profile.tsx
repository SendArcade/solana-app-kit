import React, {useEffect, useState} from 'react';
import {
  View,
  SafeAreaView,
  Modal,
  Text,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  Platform,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';

// ======= ADDITIONS for EXACT same approach as older ProfileScreen =======
import * as ImagePicker from 'expo-image-picker';
import {useAppSelector, useAppDispatch} from '../../hooks/useReduxHooks';
import {
  fetchUserProfile,
  updateProfilePic,
  updateUsername,
} from '../../state/auth/reducer';
import {fetchAllPosts} from '../../state/thread/reducer';
import {SERVER_URL} from '@env';
import {ThreadPost} from '../thread/thread.types';
import {NftItem, useFetchNFTs} from '../../hooks/useFetchNFTs';
// ========================================================================

import ProfileInfo from './ProfileInfo/profileInfo';
import SwipeTabs from './slider/slider';
import {
  styles,
  modalStyles,
  confirmModalStyles,
  inlineConfirmStyles,
  editNameModalStyles,
} from './profile.style';
import {DEFAULT_IMAGES} from '../../config/constants';
import {setStatusBarStyle} from 'expo-status-bar';

/**
 * Define the shape of the data needed by this container (unchanged).
 * If you're using Redux, this can be synced with your store.
 */
export interface UserProfileData {
  address: string; // wallet address
  profilePicUrl: string; // stored in DB or server
  username: string;
}

export interface ProfileProps {
  /**
   * If true, this is the user’s own profile (allows editing).
   */
  isOwnProfile?: boolean;

  /**
   * The user object, containing wallet address, profilePicUrl, etc.
   */
  user: UserProfileData;

  /**
   * List of posts belonging to the user.
   * (If you want to supply them from outside, not using Redux.)
   * Otherwise, we will fetch from Redux or filter from global allPosts.
   */
  posts?: ThreadPost[];

  /**
   * A list of NFTs owned by the user (if you want to supply them).
   * Otherwise, we’ll fetch them inside with `useFetchNFTs`.
   */
  nfts?: NftItem[];
  loadingNfts?: boolean;
  fetchNftsError?: string | null;

  /**
   * Additional styling or container overrides (optional).
   */
  containerStyle?: object;
}

/**
 * Profile: A unified profile component that
 * can show user info, a tabbed view of posts & collectibles,
 * and implement EXACT same avatar-change logic as older screens.
 */
export default function Profile({
  isOwnProfile = false,
  user,
  posts = [],
  nfts = [],
  loadingNfts = false,
  fetchNftsError,
  containerStyle,
}: ProfileProps) {
  const dispatch = useAppDispatch();

  // Because user might come from props or from Redux:
  const userWallet = user?.address || null;
  const [profilePicUrl, setProfilePicUrl] = useState<string>(
    user?.profilePicUrl,
  );
  const [localUsername, setLocalUsername] = useState<string>(user?.username);

  // We also keep “myPosts” in local state if we want to show them in the tab
  const allReduxPosts = useAppSelector(state => state.thread.allPosts);
  const [myPosts, setMyPosts] = useState<ThreadPost[]>(posts);

  // ============= EXACT NFT-FETCH LOGIC or use provided props =============
  // If parent did not supply `nfts`, we fetch inside. Otherwise we use them:
  const {
    nfts: fetchedNfts,
    loading,
    error,
  } = useFetchNFTs(userWallet || undefined);
  const resolvedNfts = nfts.length > 0 ? nfts : fetchedNfts;
  const resolvedLoadingNfts = loadingNfts || loading;
  const resolvedNftError = fetchNftsError || error;

  // ============ Manage states for modals and new image picking ============
  const [avatarOptionModalVisible, setAvatarOptionModalVisible] =
    useState(false);
  const [nftsModalVisible, setNftsModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedSource, setSelectedSource] = useState<
    'library' | 'nft' | null
  >(null);

  // For inline confirm (library)
  const [localFileUri, setLocalFileUri] = useState<string | null>(null);

  // Name Edit Modal
  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [tempName, setTempName] = useState(localUsername || '');

  // For turning status bar dark
  useEffect(() => {
    setStatusBarStyle('dark');
  }, []);

  // ========== Fetch user profile from server (like the older screen) =========
  useEffect(() => {
    if (userWallet) {
      dispatch(fetchUserProfile(userWallet))
        .unwrap()
        .then(value => {
          // value will have { profilePicUrl, username } if success
          if (value.profilePicUrl) {
            setProfilePicUrl(value.profilePicUrl);
          }
          if (value.username) {
            setLocalUsername(value.username);
          }
        })
        .catch(err => {
          console.error('Failed to fetch user profile:', err);
        });
    }
  }, [userWallet, dispatch]);

  // ========== Optionally fetch all posts from Redux if parent not providing  =========
  useEffect(() => {
    if (!posts || posts.length === 0) {
      // Ensure allPosts are fetched from server
      dispatch(fetchAllPosts())
        .unwrap()
        .catch(err => console.error('Failed to fetch all posts:', err));
    }
  }, [posts, dispatch]);

  // ========== Filter posts belonging to current userWallet ===============
  useEffect(() => {
    if (!userWallet) {
      setMyPosts([]);
      return;
    }
    // If parent provided `posts`, we use that. Else use `allReduxPosts`.
    const basePosts = posts && posts.length > 0 ? posts : allReduxPosts;
    const userPosts = basePosts.filter(
      p => p.user.id.toLowerCase() === userWallet.toLowerCase(),
    );
    // sort by createdAt desc
    userPosts.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    setMyPosts(userPosts);
  }, [allReduxPosts, userWallet, posts]);

  // ============= EXACT LIBRARY PICK & NFT PICK LOGIC FROM OLDER CODE =========

  /**
   * Called when the user taps on the profile avatar
   */
  function handleAvatarPress() {
    if (!isOwnProfile) return;
    setAvatarOptionModalVisible(true);
  }

  /**
   * Launch image picker for library
   */
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

  /**
   * Switch to NFT modal
   */
  const handleSelectNftOption = () => {
    setAvatarOptionModalVisible(false);
    setNftsModalVisible(true);
  };

  /**
   * User chose an NFT from the list
   */
  const handleSelectNftAsAvatar = (nft: NftItem) => {
    setLocalFileUri(nft.image);
    setSelectedSource('nft');
    setNftsModalVisible(false);
    setConfirmModalVisible(true);
  };

  /**
   * Confirm uploading new avatar (both library & NFT).
   * EXACT approach: do a direct FormData POST to server, then set Redux.
   */
  const handleConfirmUpload = async () => {
    if (!userWallet) {
      Alert.alert('Missing Wallet', 'Connect a wallet before uploading.');
      setConfirmModalVisible(false);
      setLocalFileUri(null);
      setSelectedSource(null);
      return;
    }
    if (!localFileUri) {
      Alert.alert('Missing Image', 'No image to upload.');
      setConfirmModalVisible(false);
      setLocalFileUri(null);
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

      const SERVER_BASE_URL = SERVER_URL || 'http://localhost:3000';
      const response = await fetch(`${SERVER_BASE_URL}/api/profile/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }
      // Update local state + Redux
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

  /**
   * Cancel upload
   */
  const handleCancelUpload = () => {
    setConfirmModalVisible(false);
    setLocalFileUri(null);
    setSelectedSource(null);
  };

  // ================== NAME EDIT LOGIC (EXACT same) ==================
  const handleOpenEditModal = () => {
    if (!isOwnProfile) return;
    setTempName(localUsername || '');
    setEditNameModalVisible(true);
  };

  const handleSaveName = async () => {
    if (!userWallet) {
      Alert.alert('No wallet to update name');
      return;
    }
    if (!tempName.trim()) {
      Alert.alert('Empty Name', 'Please enter a valid name');
      return;
    }
    try {
      await dispatch(
        updateUsername({userId: userWallet, newUsername: tempName.trim()}),
      ).unwrap();
      setLocalUsername(tempName.trim());
    } catch (err: any) {
      Alert.alert('Update Name Failed', err.message || 'Unknown error');
    } finally {
      setEditNameModalVisible(false);
    }
  };

  // =================== RENDER ===================
  return (
    <SafeAreaView
      style={[
        styles.container,
        containerStyle,
        Platform.OS === 'android' && androidStyles.safeArea,
      ]}>
      {/* We pass the relevant info to ProfileInfo. 
          Tapping avatar opens the modal for library or NFT. 
          Tapping “Edit Profile” triggers name edit. */}
      <ProfileInfo
        profilePicUrl={profilePicUrl || ''}
        username={localUsername || 'Unknown'}
        userWallet={userWallet || ''}
        isOwnProfile={isOwnProfile}
        onAvatarPress={handleAvatarPress}
        onEditProfile={handleOpenEditModal}
      />

      {/* The tabbed view: myPosts and myNFTs */}
      <View style={{flex: 1}}>
        <SwipeTabs
          myPosts={myPosts}
          myNFTs={resolvedNfts}
          loadingNfts={resolvedLoadingNfts}
          fetchNftsError={resolvedNftError}
        />
      </View>

      {/* ==================== (A) Modal: Choose avatar source ===================== */}
      <Modal
        animationType="fade"
        transparent
        visible={avatarOptionModalVisible}
        onRequestClose={() => setAvatarOptionModalVisible(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.optionContainer}>
            <Text style={modalStyles.optionTitle}>Choose avatar source</Text>
            <TouchableOpacity
              style={modalStyles.optionButton}
              onPress={handlePickProfilePicture}>
              <Text style={modalStyles.optionButtonText}>Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.optionButton}
              onPress={handleSelectNftOption}>
              <Text style={modalStyles.optionButtonText}>My NFTs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.optionButton, {backgroundColor: 'gray'}]}
              onPress={() => setAvatarOptionModalVisible(false)}>
              <Text style={modalStyles.optionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================== (B) NFT Selection Modal ===================== */}
      <Modal
        animationType="slide"
        transparent
        visible={nftsModalVisible}
        onRequestClose={() => setNftsModalVisible(false)}>
        <View style={modalStyles.nftOverlay}>
          <View style={modalStyles.nftContainer}>
            <Text style={modalStyles.nftTitle}>Select an NFT</Text>
            {resolvedLoadingNfts ? (
              <View style={{marginTop: 20}}>
                <ActivityIndicator size="large" color="#1d9bf0" />
                <Text
                  style={{marginTop: 8, color: '#666', textAlign: 'center'}}>
                  Loading your NFTs...
                </Text>
              </View>
            ) : resolvedNftError ? (
              <Text style={modalStyles.nftError}>{resolvedNftError}</Text>
            ) : (
              <FlatList
                data={resolvedNfts}
                keyExtractor={item => item.mint}
                style={{marginVertical: 10}}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={modalStyles.nftItem}
                    onPress={() => handleSelectNftAsAvatar(item)}>
                    <View style={modalStyles.nftImageContainer}>
                      {item.image ? (
                        <Image
                          source={{uri: item.image}}
                          style={modalStyles.nftImage}
                        />
                      ) : (
                        <View style={modalStyles.nftPlaceholder}>
                          <Text style={{color: '#666'}}>No Image</Text>
                        </View>
                      )}
                    </View>
                    <View style={{flex: 1, marginLeft: 12}}>
                      <Text style={modalStyles.nftName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.collection ? (
                        <Text style={modalStyles.nftCollection}>
                          {item.collection}
                        </Text>
                      ) : null}
                      <Text style={modalStyles.nftMint} numberOfLines={1}>
                        {item.mint.slice(0, 8) + '...' + item.mint.slice(-4)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={modalStyles.nftError}>
                    You have no NFTs in this wallet.
                  </Text>
                }
              />
            )}
            <TouchableOpacity
              style={[modalStyles.closeButton, {marginTop: 10}]}
              onPress={() => setNftsModalVisible(false)}>
              <Text style={modalStyles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================== (C) Confirm NFT or Library Upload Modal ===================== */}
      {selectedSource === 'nft' && confirmModalVisible && (
        <Modal
          animationType="fade"
          transparent
          visible={confirmModalVisible}
          onRequestClose={handleCancelUpload}>
          <View style={confirmModalStyles.overlay}>
            <View style={confirmModalStyles.container}>
              <Text style={confirmModalStyles.title}>
                Confirm NFT Profile Picture
              </Text>
              {localFileUri ? (
                <Image
                  source={{uri: localFileUri}}
                  style={confirmModalStyles.preview}
                  onError={err => {
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

              <View style={confirmModalStyles.buttonRow}>
                <TouchableOpacity
                  style={[
                    confirmModalStyles.modalButton,
                    {backgroundColor: '#aaa'},
                  ]}
                  onPress={handleCancelUpload}>
                  <Text style={confirmModalStyles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    confirmModalStyles.modalButton,
                    {backgroundColor: '#1d9bf0'},
                  ]}
                  onPress={handleConfirmUpload}>
                  <Text style={confirmModalStyles.buttonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Inline Confirmation if selectedSource === 'library' */}
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

      {/* ==================== (D) Edit Name Modal ===================== */}
      <Modal
        animationType="slide"
        transparent
        visible={editNameModalVisible}
        onRequestClose={() => setEditNameModalVisible(false)}>
        <View style={editNameModalStyles.overlay}>
          <View style={editNameModalStyles.container}>
            <Text style={editNameModalStyles.title}>Edit Profile Name</Text>
            <TextInput
              style={editNameModalStyles.input}
              placeholder="Enter your display name"
              value={tempName}
              onChangeText={setTempName}
            />
            <View style={editNameModalStyles.btnRow}>
              <TouchableOpacity
                style={[editNameModalStyles.button, {backgroundColor: 'gray'}]}
                onPress={() => setEditNameModalVisible(false)}>
                <Text style={editNameModalStyles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  editNameModalStyles.button,
                  {backgroundColor: '#1d9bf0'},
                ]}
                onPress={handleSaveName}>
                <Text style={editNameModalStyles.btnText}>Save</Text>
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
