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
} from 'react-native';
import { setStatusBarStyle } from 'expo-status-bar';
import { useAppSelector, useAppDispatch } from '@/shared/hooks/useReduxHooks';
import {
  fetchUserProfile,
} from '@/shared/state/auth/reducer';
import { fetchAllPosts } from '@/shared/state/thread/reducer';

import { useFetchNFTs } from '@/modules/nft';
import { NftItem } from '@/modules/nft/types';
import { useWallet } from '@/modules/walletProviders/hooks/useWallet';
import {
  fetchFollowers,
  fetchFollowing,
  checkIfUserFollowsMe,
} from '../services/profileService';
import { fetchWalletActionsWithCache, pruneOldActionData } from '@/shared/state/profile/reducer';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { followUser, unfollowUser } from '@/shared/state/users/reducer';
import COLORS from '@/assets/colors';

// Import hooks, utils, and types from the modular structure
import { flattenPosts, isUserWalletOwner } from '@/core/profile/utils/profileUtils';
import { ProfileProps, UserProfileData } from '@/core/profile/types';

import ProfileView from './ProfileView';
import { styles } from './profile.style';
import { ThreadPost } from '@/core/thread/types';
import { useFetchPortfolio } from '@/modules/dataModule/hooks/useFetchTokens';
import { AssetItem } from '@/modules/dataModule/types/assetTypes';
import EditPostModal from '@/core/thread/components/EditPostModal';

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
  const [editingPost, setEditingPost] = useState<ThreadPost | null>(null); // State for post being edited

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

  // --- Avatar and Profile update handlers ---
  const handleProfileUpdated = useCallback((field: 'image' | 'username' | 'description') => {
    // Immediately refresh profile data after any update
    if (userWallet) {
      setIsProfileLoading(true);
      dispatch(fetchUserProfile(userWallet))
        .unwrap()
        .then(value => {
          if (value.profilePicUrl) setProfilePicUrl(value.profilePicUrl);
          if (value.username) setLocalUsername(value.username);
          if (value.description) setLocalDescription(value.description);
          console.log(`Profile updated (${field}):`, value);
        })
        .catch(err => {
          console.error('Failed to refresh user profile after update:', err);
        })
        .finally(() => {
          setIsProfileLoading(false);
        });
    }
  }, [dispatch, userWallet]);

  // --- Post edit handler ---
  const handleEditPost = useCallback((postToEdit: ThreadPost) => {
    if (isOwnProfile || postToEdit.user.id === currentUserWallet) {
      setEditingPost(postToEdit);
    } else {
      Alert.alert("Permission Denied", "You cannot edit this post.");
    }
  }, [isOwnProfile, currentUserWallet]);

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

  useEffect(() => {
    setStatusBarStyle('dark');
  }, []);

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
        onAvatarPress={() => handleProfileUpdated('image')}
        onEditProfile={() => handleProfileUpdated('username')}
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
        onEditPost={handleEditPost}
      />

      {/* Edit Post Modal */}
      <EditPostModal
        isVisible={!!editingPost}
        onClose={() => setEditingPost(null)}
        post={editingPost}
      />
    </SafeAreaView>
  );
}

const androidStyles = StyleSheet.create({
  safeArea: {
    paddingTop: 30,
  },
});


