/* FILE: src/components/Profile/profile.tsx */

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
import {flattenPosts} from '../thread/thread.utils';
import {setStatusBarStyle} from 'expo-status-bar';
import {useAppNavigation} from '../../hooks/useAppNavigation';
import { followUser, unfollowUser } from '../../state/users/reducer';

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

  // The “I am the logged-in user” wallet from Redux
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

  // Flattened posts for the user
  const [myPosts, setMyPosts] = useState<ThreadPost[]>(posts);

  // **New**: Keep track of the real followers/following arrays
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);

  // If this is not my own profile, we also track if "I" am following them, and if they follow me
  const [amIFollowing, setAmIFollowing] = useState(false);
  const [areTheyFollowingMe, setAreTheyFollowingMe] = useState(false);

  // NFT fetch logic
  const {
    nfts: fetchedNfts,
    loading: defaultNftLoading,
    error: defaultNftError,
  } = useFetchNFTs(userWallet || undefined);
  const resolvedNfts = nfts.length > 0 ? nfts : fetchedNfts;
  const resolvedLoadingNfts = loadingNfts || defaultNftLoading;
  const resolvedNftError = fetchNftsError || defaultNftError;

  // For picking an avatar or editing username (only if my own profile)
  const [avatarOptionModalVisible, setAvatarOptionModalVisible] =
    useState(false);
  const [localFileUri, setLocalFileUri] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] =
    useState<'library' | 'nft' | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [tempName, setTempName] = useState(localUsername || '');

  useEffect(() => {
    setStatusBarStyle('dark');
  }, []);

  // Sync if external user data changes
  useEffect(() => {
    setProfilePicUrl(user?.profilePicUrl || '');
    setLocalUsername(user?.username || 'Anonymous');
  }, [user]);

  /**
   * If we are viewing our own profile => fetch profile, followers, following
   */
  useEffect(() => {
    if (!userWallet || !isOwnProfile) return;
    // 1) fetch the profile from server
    dispatch(fetchUserProfile(userWallet)).catch(err => {
      console.error('Failed to fetch user profile:', err);
    });

    // 2) fetch my followers
    if (SERVER_URL && userWallet) {
      fetch(`${SERVER_URL}/api/profile/followers?userId=${userWallet}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && Array.isArray(data.followers)) {
            setFollowersList(data.followers);
          }
        })
        .catch(e => console.warn('Error fetching my followers:', e));

      // 3) fetch my following
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

  /**
   * If we are viewing someone else’s profile => fetch that user’s followers/following
   * and check if I'm among them.
   */
  useEffect(() => {
    if (!userWallet || isOwnProfile) return;
    // fetch target user’s followers
    if (SERVER_URL) {
      fetch(`${SERVER_URL}/api/profile/followers?userId=${userWallet}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && Array.isArray(data.followers)) {
            setFollowersList(data.followers);
            // Check if *I* am in there => amIFollowing = true
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

      // fetch target user’s following
      fetch(`${SERVER_URL}/api/profile/following?userId=${userWallet}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && Array.isArray(data.following)) {
            setFollowingList(data.following);
          }
        })
        .catch(e => console.warn('Error fetching target user following:', e));
    }

    // Also check if user is in *my* followers => do they follow me
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

  /**
   * Possibly fetch all posts if not provided
   */
  useEffect(() => {
    if (!posts || posts.length === 0) {
      dispatch(fetchAllPosts()).catch(err =>
        console.error('Failed to fetch all posts:', err),
      );
    }
  }, [posts, dispatch]);

  /**
   * Flatten all posts => filter for the user
   */
  useEffect(() => {
    if (!userWallet) {
      setMyPosts([]);
      return;
    }
    const basePosts = posts && posts.length > 0 ? posts : allReduxPosts;
    const flattened = flattenPosts(basePosts);
    const userPosts = flattened.filter(
      p => p.user.id.toLowerCase() === userWallet.toLowerCase(),
    );
    userPosts.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    setMyPosts(userPosts);
  }, [allReduxPosts, userWallet, posts]);

  // ============== Follow / Unfollow ================
  const handleFollow = async () => {
    if (!myWallet || !userWallet) {
      Alert.alert('Cannot Follow', 'Missing user or my address');
      return;
    }
    try {
      // Dispatch the Redux action
      await dispatch(
        followUser({
          followerId: myWallet,
          followingId: userWallet,
        }),
      ).unwrap();

      // Update local state for immediate UI response
      setAmIFollowing(true);
      setFollowersList(prev => {
        if (!prev.some(u => u.id === myWallet)) {
          return [
            ...prev,
            {
              id: myWallet,
              username: 'Me',
              handle: '@me',
              profile_picture_url: '',
            },
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
        unfollowUser({
          followerId: myWallet,
          followingId: userWallet,
        }),
      ).unwrap();

      // Update local state for immediate UI response
      setAmIFollowing(false);
      setFollowersList(prev => prev.filter(u => u.id !== myWallet));
    } catch (err: any) {
      Alert.alert('Unfollow Error', err.message);
    }
  };

  // ============== Avatar picking flow (only if own profile) ================
  const handleAvatarPress = () => {
    if (!isOwnProfile) return;
    setAvatarOptionModalVisible(true);
  };

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

  const handleSelectNftOption = () => {
    setAvatarOptionModalVisible(false);
    setConfirmModalVisible(true);
    setSelectedSource('nft');
  };

  const handleCancelUpload = () => {
    setConfirmModalVisible(false);
    setLocalFileUri(null);
    setSelectedSource(null);
  };

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

      const response = await fetch(`${SERVER_URL}/api/profile/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }
      if (isOwnProfile) {
        dispatch(updateProfilePic(data.url));
      }
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

  // ============== Name editing flow ================
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

  // ============== Press handlers for the followers/following counts => navigate
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

  // (Optional) If you need a callback for "Send to wallet" from the parent:
  const handleSendToWallet = () => {
    // You can keep it empty or do something else here if you like
    console.log('Send to wallet was clicked!');
  };

  // ============== Rendering ================
  return (
    <SafeAreaView
      style={[
        styles.container,
        containerStyle,
        Platform.OS === 'android' && androidStyles.safeArea,
      ]}
    >
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
            // Example: navigate to a detail screen or do nothing
            // navigation.navigate('PostThread', { postId: post.id });
          }}
        />
      </View>

      {/* 
        If it's *not* my own profile, we show the AddButton with "Send to wallet".
        Already inside <ProfileInfo>, we show <AddButton> for "otherProfile." 
        But if you prefer to show it here, you could do so. For demonstration, 
        we rely on the existing logic that calls <AddButton> from <ProfileInfo>.
      */}

      {/* Avatar Option Modal */}
      {isOwnProfile && (
        <Modal
          animationType="fade"
          transparent
          visible={avatarOptionModalVisible}
          onRequestClose={() => setAvatarOptionModalVisible(false)}
        >
          <View style={modalStyles.overlay}>
            <View style={modalStyles.optionContainer}>
              <Text style={modalStyles.optionTitle}>Choose avatar source</Text>
              <TouchableOpacity
                style={modalStyles.optionButton}
                onPress={handlePickProfilePicture}
              >
                <Text style={modalStyles.optionButtonText}>Library</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.optionButton}
                onPress={handleSelectNftOption}
              >
                <Text style={modalStyles.optionButtonText}>My NFTs</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.optionButton, {backgroundColor: 'gray'}]}
                onPress={() => setAvatarOptionModalVisible(false)}
              >
                <Text style={modalStyles.optionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Confirm NFT if selected */}
      {isOwnProfile && selectedSource === 'nft' && confirmModalVisible && (
        <Modal
          animationType="fade"
          transparent
          visible={confirmModalVisible}
          onRequestClose={handleCancelUpload}
        >
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
                  onPress={handleCancelUpload}
                >
                  <Text style={confirmModalStyles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    confirmModalStyles.modalButton,
                    {backgroundColor: '#1d9bf0'},
                  ]}
                  onPress={handleConfirmUpload}
                >
                  <Text style={confirmModalStyles.buttonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Inline confirmation if user picks from “Library” */}
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
              onPress={handleCancelUpload}
            >
              <Text style={inlineConfirmStyles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[inlineConfirmStyles.button, {backgroundColor: '#1d9bf0'}]}
              onPress={handleConfirmUpload}
            >
              <Text style={inlineConfirmStyles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Edit Name Modal */}
      {isOwnProfile && (
        <Modal
          animationType="slide"
          transparent
          visible={editNameModalVisible}
          onRequestClose={() => setEditNameModalVisible(false)}
        >
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
                  onPress={() => setEditNameModalVisible(false)}
                >
                  <Text style={editNameModalStyles.btnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    editNameModalStyles.button,
                    {backgroundColor: '#1d9bf0'},
                  ]}
                  onPress={handleSaveName}
                >
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
