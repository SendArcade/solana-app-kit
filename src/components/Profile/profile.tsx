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
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system'; // <-- newly added
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

import ProfileInfo from './ProfileInfo/profileInfo';
import SwipeTabs from './slider/slider';
import {
  styles,
  modalStyles,
  confirmModalStyles,
  inlineConfirmStyles,
  editNameModalStyles,
} from './profile.style';
import {setStatusBarStyle} from 'expo-status-bar';
import {flattenPosts} from '../thread/thread.utils';
import {useAppNavigation} from '../../hooks/useAppNavigation';
import {followUser, unfollowUser} from '../../state/users/reducer';

/**
 * Data about the user whose profile we’re showing
 */
export interface UserProfileData {
  address: string;
  profilePicUrl: string;
  username: string;
}

/**
 * Props for the Profile component
 */
export interface ProfileProps {
  /** If true => show the "Edit Profile" flow, etc. */
  isOwnProfile?: boolean;
  /** The user data (wallet address, profile image, display name) */
  user: UserProfileData;
  /** Pre-fetched posts (optional) */
  posts?: ThreadPost[];
  /** Pre-fetched NFTs (optional) */
  nfts?: NftItem[];
  /** Whether NFT data is loading */
  loadingNfts?: boolean;
  /** Any NFT fetch error */
  fetchNftsError?: string | null;

  /** Optional styling for container */
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

  // The logged-in user’s wallet from Redux
  const myWallet = useAppSelector(state => state.auth.address);

  // The user whose profile we are displaying
  const userWallet = user?.address || null;

  // Local states for profile image & name
  const [profilePicUrl, setProfilePicUrl] = useState<string>(
    user?.profilePicUrl || '',
  );
  const [localUsername, setLocalUsername] = useState<string>(
    user?.username || 'Anonymous',
  );

  // Flattened posts for the user (including replies)
  const [myPosts, setMyPosts] = useState<ThreadPost[]>(posts);

  // Real followers/following arrays
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);

  // If not my own profile, track if “I” am following them, and if they follow me
  const [amIFollowing, setAmIFollowing] = useState(false);
  const [areTheyFollowingMe, setAreTheyFollowingMe] = useState(false);

  // ============= NFT fetch logic or use the provided NFTs =============
  const {
    nfts: fetchedNfts,
    loading: defaultNftLoading,
    error: defaultNftError,
  } = useFetchNFTs(userWallet || undefined);
  const resolvedNfts = nfts.length > 0 ? nfts : fetchedNfts;
  const resolvedLoadingNfts = loadingNfts || defaultNftLoading;
  const resolvedNftError = fetchNftsError || defaultNftError;

  // ============= States for avatar picking & modals =============
  const [avatarOptionModalVisible, setAvatarOptionModalVisible] =
    useState(false);
  const [localFileUri, setLocalFileUri] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<
    'library' | 'nft' | null
  >(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // Show the NFT list modal
  const [nftsModalVisible, setNftsModalVisible] = useState(false);

  // For editing name
  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [tempName, setTempName] = useState(localUsername || '');

  useEffect(() => {
    setStatusBarStyle('dark');
  }, []);

  // ============ Fetch user profile, followers, following if needed ============
  useEffect(() => {
    if (!userWallet) return;
    dispatch(fetchUserProfile(userWallet))
      .unwrap()
      .then(value => {
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
  }, [userWallet, dispatch]);

  // If it's my own profile => fetch my followers/following
  useEffect(() => {
    if (!userWallet || !isOwnProfile) return;
    if (SERVER_URL) {
      fetch(`${SERVER_URL}/api/profile/followers?userId=${userWallet}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && Array.isArray(data.followers)) {
            setFollowersList(data.followers);
          }
        })
        .catch(e => console.warn('Error fetching my followers:', e));

      fetch(`${SERVER_URL}/api/profile/following?userId=${userWallet}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && Array.isArray(data.following)) {
            setFollowingList(data.following);
          }
        })
        .catch(e => console.warn('Error fetching my following:', e));
    }
  }, [dispatch, userWallet, isOwnProfile]);

  // If viewing another user => fetch their followers/following
  useEffect(() => {
    if (!userWallet || isOwnProfile) return;
    if (SERVER_URL) {
      // fetch their followers
      fetch(`${SERVER_URL}/api/profile/followers?userId=${userWallet}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && Array.isArray(data.followers)) {
            setFollowersList(data.followers);
            // check if I am in that list => means I follow them
            if (
              myWallet &&
              data.followers.findIndex((x: any) => x.id === myWallet) >= 0
            ) {
              setAmIFollowing(true);
            } else {
              setAmIFollowing(false);
            }
          }
        })
        .catch(e => console.warn('Error fetching target user followers:', e));

      // fetch their following
      fetch(`${SERVER_URL}/api/profile/following?userId=${userWallet}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && Array.isArray(data.following)) {
            setFollowingList(data.following);
          }
        })
        .catch(e => console.warn('Error fetching target user following:', e));
    }

    // check if user is in my followers => do they follow me
    if (SERVER_URL && myWallet) {
      fetch(`${SERVER_URL}/api/profile/followers?userId=${myWallet}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && Array.isArray(data.followers)) {
            if (data.followers.some((f: any) => f.id === userWallet)) {
              setAreTheyFollowingMe(true);
            } else {
              setAreTheyFollowingMe(false);
            }
          }
        })
        .catch(e => console.warn('Error checking if they follow me:', e));
    }
  }, [userWallet, isOwnProfile, myWallet]);

  // ============ Possibly fetch all posts if not provided ============
  useEffect(() => {
    if (!posts || posts.length === 0) {
      dispatch(fetchAllPosts()).catch(err =>
        console.error('Failed to fetch posts:', err),
      );
    }
  }, [posts, dispatch]);

  // ============ Flatten & filter posts for this user ============
  useEffect(() => {
    if (!userWallet) {
      setMyPosts([]);
      return;
    }
    const basePosts = posts && posts.length > 0 ? posts : allReduxPosts;
    const flattened = flattenPosts(basePosts);
    const userAllPosts = flattened.filter(
      p => p.user.id.toLowerCase() === userWallet.toLowerCase(),
    );
    userAllPosts.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    setMyPosts(userAllPosts);
  }, [allReduxPosts, userWallet, posts]);

  // ============================================================
  //  Follow / Unfollow user
  // ============================================================
  const handleFollow = async () => {
    if (!myWallet || !userWallet) {
      Alert.alert('Cannot Follow', 'Missing user or my address');
      return;
    }
    try {
      await dispatch(
        followUser({followerId: myWallet, followingId: userWallet}),
      ).unwrap();
      // update local state
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
  };

  const handleUnfollow = async () => {
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
  };

  // ============================================================
  //  Avatar: library or NFT picking
  // ============================================================
  function handleAvatarPress() {
    if (!isOwnProfile) return;
    setAvatarOptionModalVisible(true);
  }

  // Launch image picker from library
  const handlePickProfilePicture = async () => {
    try {
      // NOTE: The older "MediaTypeOptions" is deprecated, but still works for now:
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

  // Show NFT modal
  const handleSelectNftOption = () => {
    setAvatarOptionModalVisible(false);
    setNftsModalVisible(true);
  };

  /**
   * Called when user picks an NFT from the list
   */
  const handleSelectNftAsAvatar = (nft: NftItem) => {
    setLocalFileUri(nft.image); // this is a remote URL
    setSelectedSource('nft');
    setNftsModalVisible(false);
    setConfirmModalVisible(true);
  };


  /**
   * Confirm uploading new avatar => same approach for library or NFT
   */
  const handleConfirmUpload = async () => {
    if (!isOwnProfile) {
      Alert.alert('Permission Denied', 'Cannot change avatar for other user');
      setConfirmModalVisible(false);
      setLocalFileUri(null);
      setSelectedSource(null);
      return;
    }
    if (!userWallet || !localFileUri || !SERVER_URL) {
      Alert.alert('Missing Data', 'No valid image or user to upload to');
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
      console.log('>>> Uploading avatar:', formData.get('profilePic'));
      const SERVER_BASE_URL = SERVER_URL || 'http://localhost:8080';
      console.log('>>> Uploading to:', SERVER_BASE_URL);
      const response = await fetch(`${SERVER_BASE_URL}/api/profile/upload`, {
        method: 'POST',
        body: formData,
      });
      console.log('>>> Response:', response);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }
      dispatch(updateProfilePic(data.url));
      setProfilePicUrl(data.url);
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

  // ============================================================
  //  Name editing flow
  // ============================================================
  const handleOpenEditModal = () => {
    if (!isOwnProfile) return;
    setTempName(localUsername || '');
    setEditNameModalVisible(true);
  };

  const handleSaveName = async () => {
    if (!isOwnProfile || !userWallet || !tempName.trim() || !SERVER_URL) {
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
  };

  // Stats pressing => Followers or Following
  const handlePressFollowers = () => {
    if (followersList.length === 0) {
      Alert.alert('No Followers', 'This user has no followers yet.');
      return;
    }
    navigation.navigate('FollowersFollowingList', {
      mode: 'followers',
      userId: userWallet,
      userList: followersList,
    } as never);
  };

  const handlePressFollowing = () => {
    if (followingList.length === 0) {
      Alert.alert('No Following', 'This user is not following anyone yet.');
      return;
    }
    navigation.navigate('FollowersFollowingList', {
      mode: 'following',
      userId: userWallet,
      userList: followingList,
    } as never);
  };

  // ============================================================
  //  RENDER
  // ============================================================
  return (
    <SafeAreaView
      style={[
        styles.container,
        containerStyle,
        Platform.OS === 'android' && androidStyles.safeArea,
      ]}>
      <ProfileInfo
        profilePicUrl={profilePicUrl}
        username={localUsername}
        userWallet={userWallet || ''}
        isOwnProfile={isOwnProfile}
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
      />

      <View style={{flex: 1}}>
        <SwipeTabs
          myPosts={myPosts}
          myNFTs={resolvedNfts}
          loadingNfts={resolvedLoadingNfts}
          fetchNftsError={resolvedNftError}
          onPressPost={post => {
            navigation.navigate('PostThread', {postId: post.id});
          }}
        />
      </View>

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
                  keyExtractor={item => item.mint || `random-${Math.random().toString(36).substr(2, 9)}`}
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
                        {item?.mint && <Text style={modalStyles.nftMint} numberOfLines={1}>
                          {item?.mint?.slice(0, 8) + '...' + item?.mint?.slice(-4)}
                        </Text>}
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
