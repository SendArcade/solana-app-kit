/**
 * File: src/components/Profile/profile.tsx
 */
import React, {useEffect, useState, useCallback, useMemo} from 'react';
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
import {setStatusBarStyle} from 'expo-status-bar';
import {useAppSelector, useAppDispatch} from '../../hooks/useReduxHooks';
import {
  fetchUserProfile,
  updateProfilePic,
  updateUsername,
} from '../../state/auth/reducer';
import {fetchAllPosts} from '../../state/thread/reducer';
import {ThreadPost} from '../thread/thread.types';
import {NftItem, useFetchNFTs} from '../../hooks/useFetchNFTs';

import ProfileView, {UserProfileData} from './ProfileView';
import {
  styles,
  modalStyles,
  confirmModalStyles,
  inlineConfirmStyles,
  editNameModalStyles,
} from './profile.style';
import {flattenPosts} from '../thread/thread.utils';
import {useAppNavigation} from '../../hooks/useAppNavigation';
import {followUser, unfollowUser} from '../../state/users/reducer';

import {
  uploadProfileAvatar,
  fetchFollowers,
  fetchFollowing,
  checkIfUserFollowsMe,
} from '../../services/profileService';

export interface ProfileProps {
  isOwnProfile?: boolean;
  user: {
    address: string;
    profilePicUrl?: string;
    username?: string;
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
  const navigation = useAppNavigation();

  const myWallet = useAppSelector(state => state.auth.address);
  const userWallet = user?.address || null;

  // Local states
  const [profilePicUrl, setProfilePicUrl] = useState<string>(
    user?.profilePicUrl || '',
  );
  const [localUsername, setLocalUsername] = useState<string>(
    user?.username || 'Anonymous',
  );

  // We removed the separate `myPosts` local state. Instead, we will memoize below.
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [amIFollowing, setAmIFollowing] = useState(false);
  const [areTheyFollowingMe, setAreTheyFollowingMe] = useState(false);

  // NFT
  const {
    nfts: fetchedNfts,
    loading: defaultNftLoading,
    error: defaultNftError,
  } = useFetchNFTs(userWallet || undefined);

  const resolvedNfts = nfts.length > 0 ? nfts : fetchedNfts;
  const resolvedLoadingNfts = loadingNfts || defaultNftLoading;
  const resolvedNftError = fetchNftsError || defaultNftError;

  // Modals
  const [avatarOptionModalVisible, setAvatarOptionModalVisible] =
    useState(false);
  const [localFileUri, setLocalFileUri] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<
    'library' | 'nft' | null
  >(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [nftsModalVisible, setNftsModalVisible] = useState(false);

  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [tempName, setTempName] = useState(localUsername || '');

  useEffect(() => {
    setStatusBarStyle('dark');
  }, []);

  // 1) Fetch user profile (if needed)
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

  // 2) If it's my own profile => fetch my followers/following
  useEffect(() => {
    if (!userWallet || !isOwnProfile) return;
    fetchFollowers(userWallet).then(list => setFollowersList(list));
    fetchFollowing(userWallet).then(list => setFollowingList(list));
  }, [userWallet, isOwnProfile]);

  // 3) If another user's profile => fetch their followers/following, check follow
  useEffect(() => {
    if (!userWallet || isOwnProfile) return;

    fetchFollowers(userWallet).then(followers => {
      setFollowersList(followers);
      if (myWallet && followers.findIndex((x: any) => x.id === myWallet) >= 0) {
        setAmIFollowing(true);
      } else {
        setAmIFollowing(false);
      }
    });

    fetchFollowing(userWallet).then(following => {
      setFollowingList(following);
    });

    if (myWallet) {
      checkIfUserFollowsMe(myWallet, userWallet).then(result => {
        setAreTheyFollowingMe(result);
      });
    }
  }, [userWallet, isOwnProfile, myWallet]);

  // 4) Possibly fetch all posts from Redux if not provided
  useEffect(() => {
    if (!posts || posts.length === 0) {
      dispatch(fetchAllPosts()).catch(err => {
        console.error('Failed to fetch posts:', err);
      });
    }
  }, [posts, dispatch]);

  // 5) Flatten & filter user posts, memoized
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

  // ============ Follow / Unfollow
  const handleFollow = useCallback(async () => {
    if (!myWallet || !userWallet) {
      Alert.alert('Cannot Follow', 'Missing user or my address');
      return;
    }
    try {
      await dispatch(
        followUser({followerId: myWallet, followingId: userWallet}),
      ).unwrap();
      setAmIFollowing(true);
      setFollowersList(prev => {
        if (!prev.some(u => u.id === myWallet)) {
          return [
            ...prev,
            {id: myWallet, username: 'Me', profile_picture_url: ''},
          ];
        }
        return prev;
      });
    } catch (err: any) {
      Alert.alert('Follow Error', err.message);
    }
  }, [dispatch, myWallet, userWallet]);

  const handleUnfollow = useCallback(async () => {
    if (!myWallet || !userWallet) {
      Alert.alert('Cannot Unfollow', 'Missing user or my address');
      return;
    }
    try {
      await dispatch(
        unfollowUser({followerId: myWallet, followingId: userWallet}),
      ).unwrap();
      setAmIFollowing(false);
      setFollowersList(prev => prev.filter(u => u.id !== myWallet));
    } catch (err: any) {
      Alert.alert('Unfollow Error', err.message);
    }
  }, [dispatch, myWallet, userWallet]);

  // ============ Avatar picks
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

  // ============ Editing Name
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
        updateUsername({userId: userWallet, newUsername: tempName.trim()}),
      ).unwrap();
      setLocalUsername(tempName.trim());
    } catch (err: any) {
      Alert.alert('Update Name Failed', err.message || 'Unknown error');
    } finally {
      setEditNameModalVisible(false);
    }
  }, [dispatch, tempName, isOwnProfile, userWallet]);

  // ============ Followers / Following
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

  // Memoize the final user object so it doesn't change if name/pic/wallet are unchanged
  const resolvedUser: UserProfileData = useMemo(
    () => ({
      address: userWallet || '',
      profilePicUrl,
      username: localUsername,
    }),
    [userWallet, profilePicUrl, localUsername],
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
          navigation.navigate('PostThread', {postId: post.id});
        }}
        containerStyle={containerStyle}
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
                style={[modalStyles.optionButton, {backgroundColor: 'gray'}]}
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
                  keyExtractor={item =>
                    item.mint ||
                    `random-${Math.random().toString(36).substr(2, 9)}`
                  }
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
                        {item.mint && (
                          <Text style={modalStyles.nftMint} numberOfLines={1}>
                            {item.mint.slice(0, 8) +
                              '...' +
                              item.mint.slice(-4)}
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
                style={[modalStyles.closeButton, {marginTop: 10}]}
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

      {/* For library selection => inline confirm row at the bottom */}
      {isOwnProfile && selectedSource === 'library' && localFileUri && (
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
                    {backgroundColor: 'gray'},
                  ]}
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
      )}
    </SafeAreaView>
  );
}

const androidStyles = StyleSheet.create({
  safeArea: {
    paddingTop: 30,
  },
});
