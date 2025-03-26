import React, { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import Profile from '../../../../components/Profile/profile';
import { useAppSelector, useAppDispatch } from '../../../../hooks/useReduxHooks';
import { ThreadPost } from '../../../../components/thread/thread.types';
import { useFetchNFTs } from '../../../../hooks/useFetchNFTs';
import { useWallet } from '../../../../hooks/useWallet';
import { fetchUserProfile } from '../../../../state/auth/reducer';
import { fetchAllPosts } from '../../../../state/thread/reducer';
import { fetchFollowers, fetchFollowing } from '../../../../services/profileService';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  
  // Get user data from Redux
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
  const storedUsername = useAppSelector(state => state.auth.username);
  const attachmentData = useAppSelector(state => state.auth.attachmentData || {});

  // Use the wallet hook to get the user's address
  const { address: userWallet } = useWallet();

  // Get all posts from Redux
  const allPosts = useAppSelector(state => state.thread.allPosts);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Filter posts belonging to the current user
  const myPosts: ThreadPost[] = userWallet
    ? allPosts.filter(p => p.user.id.toLowerCase() === userWallet.toLowerCase())
    : [];

  // Fetch NFT data using our custom hook
  const {
    nfts,
    loading: loadingNfts,
    error: fetchNftsError,
    refetch: refetchNfts,
  } = useFetchNFTs(userWallet || undefined);

  // Fetch follower/following counts
  const fetchFollowerCounts = useCallback(async () => {
    if (!userWallet) return;
    
    try {
      const followers = await fetchFollowers(userWallet);
      const following = await fetchFollowing(userWallet);
      setFollowerCount(followers.length);
      setFollowingCount(following.length);
    } catch (error) {
      console.error('Error fetching follower counts:', error);
    }
  }, [userWallet]);

  // Initial data load
  useEffect(() => {
    fetchFollowerCounts();
  }, [fetchFollowerCounts]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!userWallet) return;
    
    setRefreshing(true);
    
    try {
      // Refresh profile data
      await dispatch(fetchUserProfile(userWallet)).unwrap();
      
      // Refresh posts
      await dispatch(fetchAllPosts()).unwrap();
      
      // Refresh NFTs
      refetchNfts();
      
      // Refresh follower/following counts
      await fetchFollowerCounts();
      
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [userWallet, dispatch, refetchNfts, fetchFollowerCounts]);

  // Build the user object
  const user = {
    address: userWallet || '',
    profilePicUrl: storedProfilePic || '',
    username: storedUsername || 'Unknown User',
    attachmentData,
  };

  return (
    <View style={{ flex: 1 }}>
      <Profile
        isOwnProfile={true}
        user={user}
        posts={myPosts}
        nfts={nfts}
        loadingNfts={loadingNfts}
        fetchNftsError={fetchNftsError}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        followersCount={followerCount}
        followingCount={followingCount}
      />
    </View>
  );
}
