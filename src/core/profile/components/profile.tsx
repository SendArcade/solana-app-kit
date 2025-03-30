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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { setStatusBarStyle } from 'expo-status-bar';
import { useAppSelector, useAppDispatch } from '../../../hooks/useReduxHooks';
import {
  fetchUserProfile,
  updateProfilePic,
  updateUsername,
  updateDescription,
} from '../../../state/auth/reducer';
import { fetchAllPosts } from '../../../state/thread/reducer';

import { NftItem, useFetchNFTs } from '../../../hooks/useFetchNFTs';
import { useWallet } from '../../../hooks/useWallet';
import {
  uploadProfileAvatar,
  fetchFollowers,
  fetchFollowing,
  checkIfUserFollowsMe,
} from '../../../services/profileService';
import { fetchWalletActionsWithCache, pruneOldActionData } from '../../../state/profile/reducer';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { followUser, unfollowUser } from '../../../state/users/reducer';
import { useFetchPortfolio, AssetItem } from '../../../hooks/useFetchTokens';
import COLORS from '../../../assets/colors';

// Import hooks, utils, and types from the modular structure
import { useProfileFollow, useProfileActions, useProfileManagement } from '../hooks';
import { flattenPosts, isUserWalletOwner } from '../utils/profileUtils';
import { ProfileProps, UserProfileData } from '../types';

import ProfileView from './ProfileView';
import {
  styles,
  modalStyles,
  confirmModalStyles,
  inlineConfirmStyles,
  editNameModalStyles,
} from './profile.style';
import { ThreadPost } from '../../thread/types';

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
  const myWallet = useAppSelector(state => state.auth.address);

  // Get profile actions from Redux state
  const profileActions = useAppSelector(state => state.profile.actions);

  const currentUserWallet = currentWalletAddress || myWallet;
  const userWallet = user?.address || '';
  const storedProfilePic = user?.profilePicUrl || '';
  const customizationData = user?.attachmentData || {};

  // Local states for profile data
  const [profilePicUrl, setProfilePicUrl] = useState<string>(storedProfilePic);
  const [localUsername, setLocalUsername] = useState<string>(user?.username || 'Anonymous');
  const [localDescription, setLocalDescription] = useState<string>(user?.description || '');

  // Followers/following state
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [amIFollowing, setAmIFollowing] = useState(false);
  const [areTheyFollowingMe, setAreTheyFollowingMe] = useState(false);

  // Loading state tracking
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isFollowersLoading, setIsFollowersLoading] = useState(true);
  const [isFollowingLoading, setIsFollowingLoading] = useState(true);
  const [isFollowStatusLoading, setIsFollowStatusLoading] = useState(!isOwnProfile);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // NFT fetch hook - use it only when nfts are not provided via props
  const {
    nfts: fetchedNfts,
    loading: defaultNftLoading,
    error: defaultNftError,
  } = useFetchNFTs(userWallet || undefined);

  // Portfolio fetch hook
  const {
    portfolio,
    loading: loadingPortfolio,
    error: portfolioError,
  } = useFetchPortfolio(userWallet || undefined);

  // For refreshing the portfolio data
  const [refreshingPortfolio, setRefreshingPortfolio] = useState(false);

  // Extract values with fallbacks
  const resolvedNfts = nfts.length > 0 ? nfts : fetchedNfts;
  const resolvedLoadingNfts = loadingNfts || defaultNftLoading;
  const resolvedNftError = fetchNftsError || defaultNftError;

  // Get actions data from Redux
  const myActions = useMemo(() =>
    userWallet ? (profileActions.data[userWallet] || []) : [],
    [userWallet, profileActions.data]
  );

  const loadingActions = useMemo(() =>
    !!userWallet && !!profileActions.loading[userWallet],
    [userWallet, profileActions.loading]
  );

  const fetchActionsError = useMemo(() =>
    userWallet ? profileActions.error[userWallet] : null,
    [userWallet, profileActions.error]
  );

  // Combined loading state to prevent flickering
  const isLoading = useMemo(() => {
    // Don't show loading if initial data has been loaded
    if (initialDataLoaded) return false;

    // Only show loading state for own profile
    if (!isOwnProfile) return false;

    return (
      isProfileLoading ||
      isFollowersLoading ||
      isFollowingLoading ||
      loadingActions ||
      loadingPortfolio
    );
  }, [
    initialDataLoaded,
    isOwnProfile,
    isProfileLoading,
    isFollowersLoading,
    isFollowingLoading,
    loadingActions,
    loadingPortfolio
  ]);

  // Mark data as initially loaded once all critical data is fetched
  useEffect(() => {
    if (
      // For own profile, wait for all necessary data
      isOwnProfile ? (
        !isProfileLoading &&
        !isFollowersLoading &&
        !isFollowingLoading &&
        !loadingActions
      ) : (
        // For other profiles, don't wait as long
        !isProfileLoading
      )
    ) {
      // Delay setting this flag to ensure all rendering is complete
      const timer = setTimeout(() => {
        setInitialDataLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [
    isOwnProfile,
    isProfileLoading,
    isFollowersLoading,
    isFollowingLoading,
    isFollowStatusLoading,
    loadingActions
  ]);

  // --- Fetch Actions ---
  useEffect(() => {
    if (!userWallet) return;

    // Check if we have recent data to avoid unnecessary fetches
    const lastFetched = profileActions.lastFetched[userWallet] || 0;
    const currentTime = Date.now();
    const isFresh = currentTime - lastFetched < 60000; // 1 minute

    // Only fetch if we don't have fresh data
    if (!profileActions.data[userWallet]?.length || !isFresh) {
      dispatch(fetchWalletActionsWithCache({ walletAddress: userWallet }));
    } else {
      // If we have fresh data, mark actions as loaded
      setInitialDataLoaded(prevState => prevState || true);
    }
  }, [userWallet, dispatch, profileActions.data, profileActions.lastFetched]);

  // --- Fetch user profile if needed ---
  useEffect(() => {
    if (!userWallet) {
      setIsProfileLoading(false);
      return;
    }

    setIsProfileLoading(true);
    dispatch(fetchUserProfile(userWallet))
      .unwrap()
      .then(value => {
        if (value.profilePicUrl) setProfilePicUrl(value.profilePicUrl);
        if (value.username) setLocalUsername(value.username);
        if (value.description) setLocalDescription(value.description);
      })
      .catch(err => {
        console.error('Failed to fetch user profile:', err);
      })
      .finally(() => {
        setIsProfileLoading(false);
      });
  }, [userWallet, dispatch]);

  // --- Followers/Following logic ---
  useEffect(() => {
    if (!userWallet || !isOwnProfile) {
      if (isOwnProfile) {
        setIsFollowersLoading(false);
        setIsFollowingLoading(false);
      }
      return;
    }

    setIsFollowersLoading(true);
    setIsFollowingLoading(true);

    fetchFollowers(userWallet)
      .then(list => {
        setFollowersList(list);
        setIsFollowersLoading(false);
      })
      .catch(() => setIsFollowersLoading(false));

    fetchFollowing(userWallet)
      .then(list => {
        setFollowingList(list);
        setIsFollowingLoading(false);
      })
      .catch(() => setIsFollowingLoading(false));
  }, [userWallet, isOwnProfile]);

  useEffect(() => {
    if (!userWallet || isOwnProfile) {
      if (!isOwnProfile) {
        setIsFollowStatusLoading(false);
        setIsFollowersLoading(false);
        setIsFollowingLoading(false);
      }
      return;
    }

    setIsFollowersLoading(true);
    setIsFollowingLoading(true);
    setIsFollowStatusLoading(true);

    fetchFollowers(userWallet)
      .then(followers => {
        setFollowersList(followers);
        if (currentUserWallet && followers.findIndex((x: any) => x.id === currentUserWallet) >= 0) {
          setAmIFollowing(true);
        } else {
          setAmIFollowing(false);
        }
        setIsFollowersLoading(false);
      })
      .catch(() => setIsFollowersLoading(false));

    fetchFollowing(userWallet)
      .then(following => {
        setFollowingList(following);
        setIsFollowingLoading(false);
      })
      .catch(() => setIsFollowingLoading(false));

    if (currentUserWallet) {
      checkIfUserFollowsMe(currentUserWallet, userWallet)
        .then(result => {
          setAreTheyFollowingMe(result);
          setIsFollowStatusLoading(false);
        })
        .catch(() => setIsFollowStatusLoading(false));
    } else {
      setIsFollowStatusLoading(false);
    }
  }, [userWallet, isOwnProfile, currentUserWallet]);

  // Refresh follower/following data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!userWallet) return;

      // We'll always refresh the data for the displayed profile
      console.log(`[useFocusEffect] Refreshing data for ${isOwnProfile ? 'own profile' : 'other profile'}: ${userWallet}`);

      // Always fetch the followers for the current displayed profile
      fetchFollowers(userWallet).then(list => {
        setFollowersList(list);

        // Also update amIFollowing status for other profiles
        if (!isOwnProfile && currentUserWallet) {
          const isFollowing = list.some((x: any) => x.id === currentUserWallet);
          setAmIFollowing(isFollowing);
        }
      });

      // Always fetch the following for the current displayed profile
      fetchFollowing(userWallet).then(list => {
        setFollowingList(list);
      });

      // If viewing other's profile, check if they follow current user
      if (!isOwnProfile && currentUserWallet) {
        checkIfUserFollowsMe(currentUserWallet, userWallet).then(result => {
          setAreTheyFollowingMe(result);
        });
      }
    }, [userWallet, isOwnProfile, currentUserWallet])
  );

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

    // Choose base posts from props or Redux
    const base = posts && posts.length > 0 ? posts : allReduxPosts;

    // Use flattenPosts to extract all posts including nested replies
    const flat = flattenPosts(base);

    // Filter for all posts where the user is the author
    const userAll = flat.filter(
      p => p.user.id.toLowerCase() === userWallet.toLowerCase(),
    );

    // Sort by most recent first
    userAll.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

    return userAll;
  }, [userWallet, posts, allReduxPosts]);

  // --- Refresh Portfolio handler ---
  const handleRefreshPortfolio = useCallback(async () => {
    if (!userWallet) return;
    setRefreshingPortfolio(true);

    try {
      // Refresh actions with force refresh
      await dispatch(fetchWalletActionsWithCache({
        walletAddress: userWallet,
        forceRefresh: true
      })).unwrap();

      // Wait for additional data refreshes
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error('Error refreshing profile data:', err);
    } finally {
      setRefreshingPortfolio(false);
    }
  }, [userWallet, dispatch]);

  // --- Asset press handler ---
  const handleAssetPress = useCallback((asset: AssetItem) => {
    console.log('Asset pressed:', asset);
    // For NFTs, show detail view
    if (asset.interface === 'V1_NFT' || asset.interface === 'ProgrammableNFT') {
      // navigation.navigate('NFTDetail', { asset });
    }
    // For tokens, show transaction history
    else if (asset.interface === 'V1_TOKEN' || asset.token_info) {
      // navigation.navigate('TokenDetail', { asset });
    }
  }, []);

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

      // Update UI immediately to show I'm following this person
      setAmIFollowing(true);

      // Update followers list for the profile we're viewing
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

      // Update UI immediately
      setAmIFollowing(false);

      // Update followers list for the profile we're viewing
      setFollowersList(prev => prev.filter(u => u.id !== currentUserWallet));
    } catch (err: any) {
      Alert.alert('Unfollow Error', err.message);
    }
  }, [dispatch, currentUserWallet, userWallet]);

  // --- Avatar modals state ---
  const [avatarOptionModalVisible, setAvatarOptionModalVisible] = useState(false);
  const [localFileUri, setLocalFileUri] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<'library' | 'nft' | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [nftsModalVisible, setNftsModalVisible] = useState(false);
  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [tempName, setTempName] = useState(localUsername || '');
  const [tempDescription, setTempDescription] = useState(localDescription || '');

  useEffect(() => {
    setStatusBarStyle('dark');
  }, []);

  // --- Avatar selection handlers ---
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

  // --- Avatar upload/confirm handlers ---
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

  // --- Profile edit handlers ---
  const handleOpenEditModal = useCallback(() => {
    if (!isOwnProfile) return;
    setTempName(localUsername || '');
    setTempDescription(localDescription || '');
    setEditNameModalVisible(true);
  }, [isOwnProfile, localUsername, localDescription]);

  const handleSaveName = useCallback(async () => {
    if (!isOwnProfile || !userWallet) {
      setEditNameModalVisible(false);
      return;
    }

    try {
      let updatedUsername = false;
      let updatedDescription = false;

      // Only dispatch if name changed
      if (tempName.trim() && tempName.trim() !== localUsername) {
        await dispatch(
          updateUsername({ userId: userWallet, newUsername: tempName.trim() }),
        ).unwrap();
        setLocalUsername(tempName.trim());
        updatedUsername = true;
      }

      // Only dispatch if description changed  
      if (tempDescription !== localDescription) {
        await dispatch(
          updateDescription({ userId: userWallet, newDescription: tempDescription.trim() }),
        ).unwrap();
        setLocalDescription(tempDescription.trim());
        updatedDescription = true;
      }

      if (updatedUsername && updatedDescription) {
        Alert.alert('Profile Updated', 'Your name and description have been updated.');
      } else if (updatedUsername) {
        Alert.alert('Name Updated', 'Your display name has been updated.');
      } else if (updatedDescription) {
        Alert.alert('Description Updated', 'Your bio has been updated.');
      }

    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Unknown error');
    } finally {
      setEditNameModalVisible(false);
    }
  }, [dispatch, tempName, tempDescription, isOwnProfile, userWallet, localUsername, localDescription]);

  // --- Follow navigation handlers ---
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

  // Memoize follow/unfollow callbacks
  const memoizedFollowProps = useMemo(() => ({
    amIFollowing,
    areTheyFollowingMe,
    onFollowPress: handleFollow,
    onUnfollowPress: handleUnfollow,
    followersCount: followersList.length,
    followingCount: followingList.length,
    onPressFollowers: handlePressFollowers,
    onPressFollowing: handlePressFollowing
  }), [
    followersList.length,
    followingList.length,
    handleFollow,
    handleUnfollow,
    handlePressFollowers,
    handlePressFollowing,
    amIFollowing,
    areTheyFollowingMe
  ]);

  // Create resolved user data
  const resolvedUser: UserProfileData = useMemo(
    () => ({
      address: userWallet || '',
      profilePicUrl,
      username: localUsername,
      description: localDescription,
      attachmentData: customizationData,
    }),
    [userWallet, profilePicUrl, localUsername, localDescription, customizationData],
  );

  // Handle post navigation
  const handlePostPress = useCallback((post: ThreadPost) => {
    navigation.navigate('PostThread', { postId: post.id });
  }, [navigation]);

  // This will clean up old action data periodically
  useEffect(() => {
    // Cleanup timer to prevent state bloat
    const cleanupTimer = setInterval(() => {
      dispatch(pruneOldActionData());
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(cleanupTimer);
  }, [dispatch]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        containerStyle,
        Platform.OS === 'android' && androidStyles.safeArea,
      ]}>
      {/* Main profile view */}
      <ProfileView
        isOwnProfile={isOwnProfile}
        user={resolvedUser}
        myPosts={myPosts}
        myNFTs={resolvedNfts}
        loadingNfts={resolvedLoadingNfts}
        fetchNftsError={resolvedNftError}
        onAvatarPress={handleAvatarPress}
        onEditProfile={handleOpenEditModal}
        {...memoizedFollowProps}
        onPressPost={handlePostPress}
        containerStyle={containerStyle}
        myActions={myActions}
        loadingActions={loadingActions}
        fetchActionsError={fetchActionsError}
        portfolioData={portfolio}
        onRefreshPortfolio={handleRefreshPortfolio}
        refreshingPortfolio={refreshingPortfolio}
        onAssetPress={handleAssetPress}
        isLoading={isLoading}
      />

      {/* Avatar Option Modal */}
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
                style={[modalStyles.optionButton, { backgroundColor: COLORS.greyMid }]}
                onPress={() => setAvatarOptionModalVisible(false)}>
                <Text style={modalStyles.optionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* NFT Selection Modal */}
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
                  <ActivityIndicator size="large" color={COLORS.brandPrimary} />
                  <Text style={{ marginTop: 8, color: COLORS.greyDark, textAlign: 'center' }}>
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
                            <Text style={{ color: COLORS.greyDark }}>No Image</Text>
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

      {/* NFT Confirm Modal */}
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
                <Text style={{ marginVertical: 20, color: COLORS.greyDark }}>
                  No pending image
                </Text>
              )}
              <View style={confirmModalStyles.buttonRow}>
                <TouchableOpacity
                  style={[
                    confirmModalStyles.modalButton,
                    { backgroundColor: COLORS.greyMid },
                  ]}
                  onPress={handleCancelUpload}>
                  <Text style={confirmModalStyles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    confirmModalStyles.modalButton,
                    { backgroundColor: COLORS.brandPrimary },
                  ]}
                  onPress={handleConfirmUpload}>
                  <Text style={confirmModalStyles.buttonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Library image confirmation */}
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
              style={[inlineConfirmStyles.button, { backgroundColor: COLORS.greyMid }]}
              onPress={handleCancelUpload}>
              <Text style={inlineConfirmStyles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[inlineConfirmStyles.button, { backgroundColor: COLORS.brandPrimary }]}
              onPress={handleConfirmUpload}>
              <Text style={inlineConfirmStyles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <Modal
          animationType="slide"
          transparent
          visible={editNameModalVisible}
          onRequestClose={() => setEditNameModalVisible(false)}>
          <View style={editNameModalStyles.overlay}>
            <View style={editNameModalStyles.container}>
              <Text style={editNameModalStyles.title}>Edit Profile</Text>
              <TextInput
                style={editNameModalStyles.input}
                placeholder="Enter your display name"
                value={tempName}
                onChangeText={setTempName}
              />
              <TextInput
                style={[editNameModalStyles.input, { height: 80 }]}
                placeholder="Enter your bio"
                value={tempDescription}
                onChangeText={setTempDescription}
                multiline
                numberOfLines={3}
              />
              <View style={editNameModalStyles.btnRow}>
                <TouchableOpacity
                  style={[
                    editNameModalStyles.button,
                    { backgroundColor: COLORS.greyMid },
                  ]}
                  onPress={() => setEditNameModalVisible(false)}>
                  <Text style={editNameModalStyles.btnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    editNameModalStyles.button,
                    { backgroundColor: COLORS.brandPrimary },
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


