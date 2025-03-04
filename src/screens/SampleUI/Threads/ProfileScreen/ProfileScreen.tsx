/*
  FILE: src/screens/SampleUI/Threads/ProfileScreen/ProfileScreen.tsx
*/
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { styles } from './ProfileScreen.styles';
import { useAppSelector, useAppDispatch } from '../../../../hooks/useReduxHooks';
import { ThreadPost } from '../../../../components/thread/thread.types';
import ProfileIcons from '../../../../assets/svgs';
import { updateProfilePic, fetchProfilePic } from '../../../../state/auth/reducer';
import { fetchWithRetries } from '../../../../utils/common/fetch';
import { TENSOR_API_KEY, HELIUS_API_KEY } from '@env';

interface NftItem {
  mint: string;
  name: string;
  image: string;
  collection?: string;
}

const SERVER_BASE_URL = process.env.SERVER_URL || 'http://localhost:3000/api';

/**
 * Quick helper to fix IPFS or ar:// URIs, if needed.
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

  const { allPosts } = useAppSelector(state => state.thread);
  const [myPosts, setMyPosts] = useState<ThreadPost[]>([]);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(storedProfilePic);

  // For the two-step flow
  const [avatarOptionModalVisible, setAvatarOptionModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState<boolean>(false);

  // The user’s “pending” image, whether from library or NFT
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  // For NFT flow
  const [nftsModalVisible, setNftsModalVisible] = useState(false);
  const [ownedNfts, setOwnedNfts] = useState<NftItem[]>([]);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [fetchNftsError, setFetchNftsError] = useState<string | null>(null);

  /*******************************************************
   * 1) Load user’s posts
   *******************************************************/
  useEffect(() => {
    if (!userWallet) {
      setMyPosts([]);
      return;
    }
    const userPosts = allPosts.filter(
      p => p.user.id.toLowerCase() === userWallet.toLowerCase()
    );
    userPosts.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    setMyPosts(userPosts);
  }, [allPosts, userWallet]);

  /*******************************************************
   * 2) Load user’s Profile Pic from DB
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
   * 3) Image picking from Library
   *******************************************************/
  const handlePickProfilePicture = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
    });
    if (result.canceled) {
      setAvatarOptionModalVisible(false);
      return;
    }
    if (!result.assets || result.assets.length === 0) return;
    const asset = result.assets[0];
    if (!asset.uri) return;
    setPendingImageUri(asset.uri);
    setConfirmModalVisible(true);
    setAvatarOptionModalVisible(false);
  };

  /*******************************************************
   * 4) NFT flow: show user’s NFT selection
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
      // This uses the Tensor portfolio API
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
          `Portfolio API request failed with status ${response.status}`
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
          return { mint, name, image: img, collection };
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
    setPendingImageUri(nft.image);
    setNftsModalVisible(false);
    setConfirmModalVisible(true);
  };

  /*******************************************************
   * 5) Confirm uploading the new avatar
   *******************************************************/
  const handleConfirmUpload = async () => {
    if (!pendingImageUri || !userWallet) {
      setConfirmModalVisible(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('userId', userWallet);
      formData.append('profilePic', {
        uri: pendingImageUri,
        type: 'image/jpeg',
        name: `profile_${Date.now()}.jpg`,
      } as any);

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
    } catch (err: any) {
      Alert.alert('Upload Error', err.message);
    } finally {
      setConfirmModalVisible(false);
      setPendingImageUri(null);
    }
  };

  const handleCancelUpload = () => {
    setConfirmModalVisible(false);
    setPendingImageUri(null);
  };

  /*******************************************************
   * 6) Render posts
   *******************************************************/
  const renderPostItem = ({ item }: { item: ThreadPost }) => {
    const firstTextSection = item.sections.find(s => !!s.text)?.text;
    return (
      <View style={styles.postItemContainer}>
        <Image
          source={
            item.user.avatar
              ? { uri: item.user.avatar as string }
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
   * 7) Render
   *******************************************************/
  return (
    <SafeAreaView style={styles.container}>
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
        {/* Pressing this opens the two-option modal */}
        <TouchableOpacity
          style={styles.profileAvatarWrapper}
          onPress={() => setAvatarOptionModalVisible(true)}>
          <Image
            source={
              profilePicUrl
                ? { uri: profilePicUrl }
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
        style={{ flex: 1 }}
        contentContainerStyle={styles.flatListContent}
      />

      {/* *******************************
           (A) PICK-AVATAR-OPTION Modal
         ******************************* */}
      <Modal
        animationType="fade"
        transparent
        visible={avatarOptionModalVisible}
        onRequestClose={() => setAvatarOptionModalVisible(false)}>
        <Pressable
          style={modalUI.overlay}
          onPress={() => setAvatarOptionModalVisible(false)}>
          <Pressable style={modalUI.optionContainer} onPress={e => e.stopPropagation()}>
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
          </Pressable>
        </Pressable>
      </Modal>

      {/* *******************************
           (B) NFT-SELECTION Modal
         ******************************* */}
      <Modal
        animationType="slide"
        transparent
        visible={nftsModalVisible}
        onRequestClose={() => setNftsModalVisible(false)}>
        <View style={modalUI.nftOverlay}>
          <View style={modalUI.nftContainer}>
            <Text style={modalUI.nftTitle}>Select an NFT</Text>
            {loadingNfts ? (
              <View style={{ marginTop: 20 }}>
                <ActivityIndicator size="large" color="#1d9bf0" />
                <Text style={{ marginTop: 8, color: '#666', textAlign: 'center' }}>
                  Loading your NFTs...
                </Text>
              </View>
            ) : fetchNftsError ? (
              <Text style={modalUI.nftError}>{fetchNftsError}</Text>
            ) : (
              <FlatList
                data={ownedNfts}
                keyExtractor={item => item.mint}
                style={{ marginVertical: 10 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={modalUI.nftItem}
                    onPress={() => handleSelectNftAsAvatar(item)}>
                    <View style={modalUI.nftImageContainer}>
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={modalUI.nftImage} />
                      ) : (
                        <View style={modalUI.nftPlaceholder}>
                          <Text style={{ color: '#666' }}>No Image</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={modalUI.nftName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.collection ? (
                        <Text style={modalUI.nftCollection}>{item.collection}</Text>
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
              style={[modalUI.closeButton, { marginTop: 10 }]}
              onPress={() => setNftsModalVisible(false)}>
              <Text style={modalUI.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* *******************************
           (C) CONFIRM Modal
         ******************************* */}
      <Modal
        animationType="slide"
        transparent
        visible={confirmModalVisible}
        onRequestClose={handleCancelUpload}>
        <View style={confirmModalUI.overlay}>
          <View style={confirmModalUI.container}>
            <Text style={confirmModalUI.title}>Confirm Profile Picture</Text>
            {pendingImageUri && (
              <Image
                source={{ uri: pendingImageUri }}
                style={confirmModalUI.preview}
              />
            )}
            <View style={confirmModalUI.buttonRow}>
              <TouchableOpacity
                style={[confirmModalUI.modalButton, { backgroundColor: '#ccc' }]}
                onPress={handleCancelUpload}
              >
                <Text style={confirmModalUI.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[confirmModalUI.modalButton, { backgroundColor: '#1d9bf0' }]}
                onPress={handleConfirmUpload}
              >
                <Text style={confirmModalUI.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/**
 * Modal UI styling for the “choose avatar source” and NFT selection modals.
 */
const modalUI = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  optionContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
    color: '#333',
  },
  optionButton: {
    width: '100%',
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1d9bf0',
    alignItems: 'center',
  },
  optionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  nftOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  nftContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  nftTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  nftError: {
    color: '#c00',
    textAlign: 'center',
    marginTop: 16,
  },
  nftItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  nftImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#eee',
    overflow: 'hidden',
    marginRight: 6,
  },
  nftImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  nftPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nftName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  nftCollection: {
    fontSize: 12,
    color: '#777',
    marginBottom: 2,
  },
  nftMint: {
    fontSize: 10,
    color: '#999',
  },
  closeButton: {
    backgroundColor: '#aaa',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

/**
 * Styling for the confirm modal (the final “Confirm Profile Picture”).
 */
const confirmModalUI = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  preview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
