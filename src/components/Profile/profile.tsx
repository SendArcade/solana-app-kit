// File: src/components/Profile/profile.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  ScrollView,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { setStatusBarStyle } from 'expo-status-bar';
import { useAppSelector, useAppDispatch } from '../../hooks/useReduxHooks';
import {
  fetchUserProfile,
  updateProfilePic,
  updateUsername,
} from '../../state/auth/reducer';
import { fetchAllPosts } from '../../state/thread/reducer';
import { ThreadPost } from '../thread/thread.types';
import { NftItem, useFetchNFTs } from '../../hooks/useFetchNFTs';
import { useWallet } from '../../hooks/useWallet';
import {
  uploadProfileAvatar,
  fetchFollowers,
  fetchFollowing,
  checkIfUserFollowsMe,
} from '../../services/profileService';
import { HELIUS_API_KEY } from '@env';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { followUser, unfollowUser } from '../../state/users/reducer';
import { useFetchPortfolio, AssetItem } from '../../hooks/useFetchTokens';

import ProfileView, { UserProfileData } from './ProfileView';
import {
  styles,
  modalStyles,
  confirmModalStyles,
  inlineConfirmStyles,
  editNameModalStyles,
} from './profile.style';
import { flattenPosts } from '../thread/thread.utils';
import { useAppNavigation as useAppNavigationHook } from '../../hooks/useAppNavigation';

export interface ProfileProps {
  isOwnProfile?: boolean;
  user: {
    address: string;
    profilePicUrl?: string;
    username?: string;
    attachmentData?: any;
  };
  posts?: ThreadPost[];
  nfts?: NftItem[];
  loadingNfts?: boolean;
  fetchNftsError?: string | null;
  containerStyle?: object;
}

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
  const allReduxPosts = useAppSelector(state => state.thread.allPosts);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { address: currentWalletAddress } = useWallet();
  const { width } = Dimensions.get('window');
  const itemWidth = (width - 60) / 2;

  const userWallet = user?.address || '';
  const storedProfilePic = user?.profilePicUrl || '';
  const customizationData = user?.attachmentData || {};
  const myWallet = useAppSelector(state => state.auth.address);
const currentUserWallet = currentWalletAddress || myWallet;

  // Local states for profile picture and username
  const [profilePicUrl, setProfilePicUrl] = useState<string>(storedProfilePic);
  const [localUsername, setLocalUsername] = useState<string>(user?.username || 'Anonymous');

  // Followers/following state
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [amIFollowing, setAmIFollowing] = useState(false);
  const [areTheyFollowingMe, setAreTheyFollowingMe] = useState(false);

  // --- ACTIONS state ---
  const [myActions, setMyActions] = useState<any[]>([]);
  const [loadingActions, setLoadingActions] = useState<boolean>(false);
  const [fetchActionsError, setFetchActionsError] = useState<string | null>(null);

  // NFT fetch hook - use it only when nfts are not provided via props
  const {
    nfts: fetchedNfts,
    loading: defaultNftLoading,
    error: defaultNftError,
  } = useFetchNFTs(userWallet || undefined);

  // Portfolio fetch hook - fetch the complete portfolio including tokens, NFTs, and compressed NFTs
  const {
    portfolio,
    loading: loadingPortfolio,
    error: portfolioError,
  } = useFetchPortfolio(userWallet || undefined);

  // For refreshing the portfolio data
  const [refreshingPortfolio, setRefreshingPortfolio] = useState(false);
  
  const handleRefreshPortfolio = useCallback(async () => {
    if (!userWallet) return;
    
    setRefreshingPortfolio(true);
    try {
      // Re-fetch portfolio (in a real app, you would implement a refresh method in the hook)
      // For now, we'll just simulate a refresh with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error('Error refreshing portfolio:', err);
    } finally {
      setRefreshingPortfolio(false);
    }
  }, [userWallet]);

  // Handle asset press
  const handleAssetPress = useCallback((asset: AssetItem) => {
    // You can implement what happens when an asset is pressed
    console.log('Asset pressed:', asset);
    
    // For NFTs, you might want to show a detail view
    if (asset.interface === 'V1_NFT' || asset.interface === 'ProgrammableNFT') {
      // Example: navigation.navigate('NFTDetail', { asset });
    }
    // For tokens, you might want to show a transaction history or trade modal
    else if (asset.interface === 'V1_TOKEN' || asset.token_info) {
      // Example: navigation.navigate('TokenDetail', { asset });
    }
  }, []);

  const resolvedNfts = nfts.length > 0 ? nfts : fetchedNfts;
  const resolvedLoadingNfts = loadingNfts || defaultNftLoading;
  const resolvedNftError = fetchNftsError || defaultNftError;

  // --- Fetch Actions ---
  useEffect(() => {
    if (!userWallet) return;

    let isCancelled = false;
    setLoadingActions(true);
    setFetchActionsError(null);

    const fetchActions = async () => {
      try {
        console.log('Fetching actions for wallet:', userWallet);
        const heliusUrl = `https://api.helius.xyz/v0/addresses/${userWallet}/transactions?api-key=${HELIUS_API_KEY}&limit=20`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(heliusUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Helius fetch failed with status ${res.status}`);
        }

        const data = await res.json();
        console.log('Data received, items:', data?.length || 0);

        if (!isCancelled) {
          setMyActions(data || []);
        }
      } catch (err: any) {
        console.error('Error fetching actions:', err.message);
        if (!isCancelled) {
          setFetchActionsError(err.message || 'Failed to fetch actions');
        }
      } finally {
        if (!isCancelled) {
          setLoadingActions(false);
        }
      }
    };

    fetchActions();
    return () => {
      isCancelled = true;
    };
  }, [userWallet]);

  // --- Fetch user profile if needed ---
  useEffect(() => {
    if (!userWallet) return;
    dispatch(fetchUserProfile(userWallet))
      .unwrap()
      .then(value => {
        if (value.profilePicUrl) setProfilePicUrl(value.profilePicUrl);
        if (value.username) setLocalUsername(value.username);
      })
      .catch(err => {
        console.error('Failed to fetch user profile:', err);
      });
  }, [userWallet, dispatch]);

  // --- Followers/Following logic ---
  useEffect(() => {
    if (!userWallet || !isOwnProfile) return;
    fetchFollowers(userWallet).then(list => setFollowersList(list));
    fetchFollowing(userWallet).then(list => setFollowingList(list));
  }, [userWallet, isOwnProfile]);

  useEffect(() => {
    if (!userWallet || isOwnProfile) return;
    fetchFollowers(userWallet).then(followers => {
      setFollowersList(followers);
      if (currentUserWallet && followers.findIndex((x: any) => x.id === currentUserWallet) >= 0) {
        setAmIFollowing(true);
      } else {
        setAmIFollowing(false);
      }
    });
    fetchFollowing(userWallet).then(following => {
      setFollowingList(following);
    });
    if (currentUserWallet) {
      checkIfUserFollowsMe(currentUserWallet, userWallet).then(result => {
        setAreTheyFollowingMe(result);
      });
    }
  }, [userWallet, isOwnProfile, currentUserWallet]);

  // --- Fetch posts if not provided ---
  useEffect(() => {
    if (!posts || posts.length === 0) {
      dispatch(fetchAllPosts()).catch(err => {
        console.error('Failed to fetch posts:', err);
      });
    }
  }, [posts, dispatch]);

  // --- Flatten & filter user posts ---
  const myPosts = useMemo(() => {
    if (!userWallet) return [];
    const base = posts && posts.length > 0 ? posts : allReduxPosts;
    const flat = flattenPosts(base);
    const userAll = flat.filter(
      p => p.user.id.toLowerCase() === userWallet.toLowerCase(),
    );
    userAll.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    return userAll;
  }, [userWallet, posts, allReduxPosts]);

  // --- Follow / Unfollow handlers ---
  const handleFollow = useCallback(async () => {
    if (!currentUserWallet || !userWallet) {
      Alert.alert('Cannot Follow', 'Missing user or my address');
      return;
    }
    try {
      await dispatch(
        followUser({ followerId: currentUserWallet, followingId: userWallet }),
      ).unwrap();
      setAmIFollowing(true);
      setFollowersList(prev => {
        if (!prev.some(u => u.id === currentUserWallet)) {
          return [
            ...prev,
            { id: currentUserWallet, username: 'Me', profile_picture_url: '' },
          ];
        }
        return prev;
      });
    } catch (err: any) {
      Alert.alert('Follow Error', err.message);
    }
  }, [dispatch, currentUserWallet, userWallet]);

  const handleUnfollow = useCallback(async () => {
    if (!currentUserWallet || !userWallet) {
      Alert.alert('Cannot Unfollow', 'Missing user or my address');
      return;
    }
    try {
      await dispatch(
        unfollowUser({ followerId: currentUserWallet, followingId: userWallet }),
      ).unwrap();
      setAmIFollowing(false);
      setFollowersList(prev => prev.filter(u => u.id !== currentUserWallet));
    } catch (err: any) {
      Alert.alert('Unfollow Error', err.message);
    }
  }, [dispatch, currentUserWallet, userWallet]);

  // --- Avatar selection, modals, editing name logic (unchanged) ---
  const [avatarOptionModalVisible, setAvatarOptionModalVisible] =
    useState(false);
  const [localFileUri, setLocalFileUri] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<'library' | 'nft' | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [nftsModalVisible, setNftsModalVisible] = useState(false);
  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [tempName, setTempName] = useState(localUsername || '');

  useEffect(() => {
    setStatusBarStyle('dark');
  }, []);

  const handleAvatarPress = useCallback(() => {
    if (!isOwnProfile) return;
    setAvatarOptionModalVisible(true);
  }, [isOwnProfile]);

  const handlePickProfilePicture = useCallback(async () => {
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
  }, []);

  const handleSelectNftOption = useCallback(() => {
    setAvatarOptionModalVisible(false);
    setNftsModalVisible(true);
  }, []);

  const handleSelectNftAsAvatar = useCallback((nft: NftItem) => {
    setLocalFileUri(nft.image);
    setSelectedSource('nft');
    setNftsModalVisible(false);
    setConfirmModalVisible(true);
  }, []);

  const handleConfirmUpload = useCallback(async () => {
    if (!isOwnProfile) {
      Alert.alert('Permission Denied', 'Cannot change avatar for other user');
      setConfirmModalVisible(false);
      setLocalFileUri(null);
      setSelectedSource(null);
      return;
    }
    if (!userWallet || !localFileUri) {
      Alert.alert('Missing Data', 'No valid image or user to upload to');
      setConfirmModalVisible(false);
      setLocalFileUri(null);
      setSelectedSource(null);
      return;
    }

    try {
      const newUrl = await uploadProfileAvatar(userWallet, localFileUri);
      dispatch(updateProfilePic(newUrl));
      setProfilePicUrl(newUrl);
    } catch (err: any) {
      Alert.alert('Upload Error', err.message);
      console.log('>>> handleConfirmUpload error:', err);
    } finally {
      setConfirmModalVisible(false);
      setLocalFileUri(null);
      setSelectedSource(null);
    }
  }, [dispatch, userWallet, localFileUri, isOwnProfile]);

  const handleCancelUpload = useCallback(() => {
    setConfirmModalVisible(false);
    setLocalFileUri(null);
    setSelectedSource(null);
  }, []);

  const handleOpenEditModal = useCallback(() => {
    if (!isOwnProfile) return;
    setTempName(localUsername || '');
    setEditNameModalVisible(true);
  }, [isOwnProfile, localUsername]);

  const handleSaveName = useCallback(async () => {
    if (!isOwnProfile || !userWallet || !tempName.trim()) {
      setEditNameModalVisible(false);
      return;
    }
    try {
      await dispatch(
        updateUsername({ userId: userWallet, newUsername: tempName.trim() }),
      ).unwrap();
      setLocalUsername(tempName.trim());
    } catch (err: any) {
      Alert.alert('Update Name Failed', err.message || 'Unknown error');
    } finally {
      setEditNameModalVisible(false);
    }
  }, [dispatch, tempName, isOwnProfile, userWallet]);

  const handlePressFollowers = useCallback(() => {
    if (followersList.length === 0) {
      Alert.alert('No Followers', 'This user has no followers yet.');
      return;
    }
    navigation.navigate('FollowersFollowingList', {
      mode: 'followers',
      userId: userWallet,
      userList: followersList,
    } as never);
  }, [followersList, navigation, userWallet]);

  const handlePressFollowing = useCallback(() => {
    if (followingList.length === 0) {
      Alert.alert('No Following', 'This user is not following anyone yet.');
      return;
    }
    navigation.navigate('FollowersFollowingList', {
      mode: 'following',
      userId: userWallet,
      userList: followingList,
    } as never);
  }, [followingList, navigation, userWallet]);

  const resolvedUser: UserProfileData = useMemo(
    () => ({
      address: userWallet || '',
      profilePicUrl,
      username: localUsername,
      attachmentData: customizationData,
    }),
    [userWallet, profilePicUrl, localUsername, customizationData],
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        containerStyle,
        Platform.OS === 'android' && androidStyles.safeArea,
      ]}>
      <ProfileView
        isOwnProfile={isOwnProfile}
        user={resolvedUser}
        myPosts={myPosts}
        myNFTs={resolvedNfts}
        loadingNfts={resolvedLoadingNfts}
        fetchNftsError={resolvedNftError}
        onAvatarPress={handleAvatarPress}
        onEditProfile={handleOpenEditModal}
        amIFollowing={amIFollowing}
        areTheyFollowingMe={areTheyFollowingMe}
        onFollowPress={handleFollow}
        onUnfollowPress={handleUnfollow}
        followersCount={followersList.length}
        followingCount={followingList.length}
        onPressFollowers={handlePressFollowers}
        onPressFollowing={handlePressFollowing}
        onPressPost={post => {
          navigation.navigate('PostThread', { postId: post.id });
        }}
        containerStyle={containerStyle}
        myActions={myActions}
        loadingActions={loadingActions}
        fetchActionsError={fetchActionsError}
        // Add portfolio data
        portfolioData={portfolio}
        onRefreshPortfolio={handleRefreshPortfolio}
        refreshingPortfolio={refreshingPortfolio}
        onAssetPress={handleAssetPress}
      />

      {/* (A) Avatar Option Modal */}
      {isOwnProfile && (
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
                style={[modalStyles.optionButton, { backgroundColor: 'gray' }]}
                onPress={() => setAvatarOptionModalVisible(false)}>
                <Text style={modalStyles.optionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* (B) NFT Selection Modal */}
      {isOwnProfile && (
        <Modal
          animationType="slide"
          transparent
          visible={nftsModalVisible}
          onRequestClose={() => setNftsModalVisible(false)}>
          <View style={modalStyles.nftOverlay}>
            <View style={modalStyles.nftContainer}>
              <Text style={modalStyles.nftTitle}>Select an NFT</Text>
              {resolvedLoadingNfts ? (
                <View style={{ marginTop: 20 }}>
                  <ActivityIndicator size="large" color="#1d9bf0" />
                  <Text style={{ marginTop: 8, color: '#666', textAlign: 'center' }}>
                    Loading your NFTs...
                  </Text>
                </View>
              ) : resolvedNftError ? (
                <Text style={modalStyles.nftError}>{resolvedNftError}</Text>
              ) : (
                <FlatList
                  data={resolvedNfts}
                  keyExtractor={item =>
                    item.mint ||
                    `random-${Math.random().toString(36).substr(2, 9)}`
                  }
                  style={{ marginVertical: 10 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={modalStyles.nftItem}
                      onPress={() => handleSelectNftAsAvatar(item)}>
                      <View style={modalStyles.nftImageContainer}>
                        {item.image ? (
                          <Image
                            source={{ uri: item.image }}
                            style={modalStyles.nftImage}
                          />
                        ) : (
                          <View style={modalStyles.nftPlaceholder}>
                            <Text style={{ color: '#666' }}>No Image</Text>
                          </View>
                        )}
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={modalStyles.nftName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {item.collection ? (
                          <Text style={modalStyles.nftCollection}>
                            {item.collection}
                          </Text>
                        ) : null}
                        {item.mint && (
                          <Text style={modalStyles.nftMint} numberOfLines={1}>
                            {item.mint.slice(0, 8) + '...' + item.mint.slice(-4)}
                          </Text>
                        )}
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
                style={[modalStyles.closeButton, { marginTop: 10 }]}
                onPress={() => setNftsModalVisible(false)}>
                <Text style={modalStyles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* (C) Confirm Modal if source = 'nft' or library */}
      {isOwnProfile && selectedSource === 'nft' && confirmModalVisible && (
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
                  source={{ uri: localFileUri }}
                  style={confirmModalStyles.preview}
                  onError={err => {
                    Alert.alert(
                      'Image Load Error',
                      JSON.stringify(err.nativeEvent),
                    );
                  }}
                />
              ) : (
                <Text style={{ marginVertical: 20, color: '#666' }}>
                  No pending image
                </Text>
              )}
              <View style={confirmModalStyles.buttonRow}>
                <TouchableOpacity
                  style={[
                    confirmModalStyles.modalButton,
                    { backgroundColor: '#aaa' },
                  ]}
                  onPress={handleCancelUpload}>
                  <Text style={confirmModalStyles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    confirmModalStyles.modalButton,
                    { backgroundColor: '#1d9bf0' },
                  ]}
                  onPress={handleConfirmUpload}>
                  <Text style={confirmModalStyles.buttonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* For library selection => inline confirm row at the bottom */}
      {isOwnProfile && selectedSource === 'library' && localFileUri && (
        <View style={inlineConfirmStyles.container}>
          <Text style={inlineConfirmStyles.title}>Confirm Profile Picture</Text>
          <Image
            source={{ uri: localFileUri }}
            style={inlineConfirmStyles.preview}
            onError={err => {
              Alert.alert('Image Load Error', JSON.stringify(err.nativeEvent));
            }}
          />
          <View style={inlineConfirmStyles.buttonRow}>
            <TouchableOpacity
              style={[inlineConfirmStyles.button, { backgroundColor: '#aaa' }]}
              onPress={handleCancelUpload}>
              <Text style={inlineConfirmStyles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[inlineConfirmStyles.button, { backgroundColor: '#1d9bf0' }]}
              onPress={handleConfirmUpload}>
              <Text style={inlineConfirmStyles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* (E) Edit Name Modal */}
      {isOwnProfile && (
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
                  style={[
                    editNameModalStyles.button,
                    { backgroundColor: 'gray' },
                  ]}
                  onPress={() => setEditNameModalVisible(false)}>
                  <Text style={editNameModalStyles.btnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    editNameModalStyles.button,
                    { backgroundColor: '#1d9bf0' },
                  ]}
                  onPress={handleSaveName}>
                  <Text style={editNameModalStyles.btnText}>Save</Text>
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
    paddingTop: 30,
  },
});


