/**
 * Custom hook for profile following functionality
 */
import { useState, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import { 
  fetchFollowers, 
  fetchFollowing, 
  checkIfUserFollowsMe,
} from '../services/profileService';
import { followUser, unfollowUser } from '../../../state/users/reducer';

/**
 * Hook for handling follow/unfollow functionality
 * @param userWallet Target user wallet address
 * @param currentWallet Current user wallet address
 * @returns Object with follow state and actions
 */
export function useProfileFollow(userWallet: string, currentWallet: string) {
  const dispatch = useAppDispatch();
  
  // States
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [amIFollowing, setAmIFollowing] = useState(false);
  const [areTheyFollowingMe, setAreTheyFollowingMe] = useState(false);

  // Loading states
  const [isFollowersLoading, setIsFollowersLoading] = useState(true);
  const [isFollowingLoading, setIsFollowingLoading] = useState(true);
  const [isFollowStatusLoading, setIsFollowStatusLoading] = useState(true);
  
  // Check if the current user is already following this profile
  const followingReducerState = useAppSelector((state) => state.users.following);
  
  // Load followers
  const loadFollowers = useCallback(async () => {
    if (!userWallet) return;
    
    setIsFollowersLoading(true);
    try {
      const followers = await fetchFollowers(userWallet);
      setFollowersList(followers);
      
      // Update "am I following" status if we're looking at another user's profile
      if (userWallet !== currentWallet) {
        const isFollowing = followers.some(
          (follower) => follower.address === currentWallet
        );
        setAmIFollowing(isFollowing);
      }
    } catch (error) {
      console.error('Error loading followers:', error);
    } finally {
      setIsFollowersLoading(false);
    }
  }, [userWallet, currentWallet]);

  // Load users being followed by this profile
  const loadFollowing = useCallback(async () => {
    if (!userWallet) return;
    
    setIsFollowingLoading(true);
    try {
      const following = await fetchFollowing(userWallet);
      setFollowingList(following);
      
      // Update "are they following me" status if we're looking at another user's profile
      if (userWallet !== currentWallet) {
        const isFollowingMe = following.some(
          (followed) => followed.address === currentWallet
        );
        setAreTheyFollowingMe(isFollowingMe);
      }
    } catch (error) {
      console.error('Error loading following:', error);
    } finally {
      setIsFollowingLoading(false);
    }
  }, [userWallet, currentWallet]);

  // Check if this user follows the current user
  const checkFollowStatus = useCallback(async () => {
    if (!userWallet || !currentWallet || userWallet === currentWallet) {
      setIsFollowStatusLoading(false);
      return;
    }
    
    setIsFollowStatusLoading(true);
    try {
      const theyFollowMe = await checkIfUserFollowsMe(userWallet, currentWallet);
      setAreTheyFollowingMe(theyFollowMe);
      
      // Check if we're following them
      const iAmFollowing = followingReducerState.some(
        (address) => address === userWallet
      );
      setAmIFollowing(iAmFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setIsFollowStatusLoading(false);
    }
  }, [userWallet, currentWallet, followingReducerState]);

  // Follow a user
  const handleFollowUser = useCallback(async () => {
    if (!userWallet || !currentWallet || userWallet === currentWallet) return;
    
    try {
      await dispatch(followUser(userWallet));
      setAmIFollowing(true);
      // Update followers list
      setFollowersList((prev) => [
        ...prev,
        { address: currentWallet }
      ]);
    } catch (error) {
      console.error('Error following user:', error);
    }
  }, [userWallet, currentWallet, dispatch]);

  // Unfollow a user
  const handleUnfollowUser = useCallback(async () => {
    if (!userWallet || !currentWallet || userWallet === currentWallet) return;
    
    try {
      await dispatch(unfollowUser(userWallet));
      setAmIFollowing(false);
      // Update followers list
      setFollowersList((prev) => 
        prev.filter((follower) => follower.address !== currentWallet)
      );
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  }, [userWallet, currentWallet, dispatch]);

  // Load data when the component mounts
  useEffect(() => {
    if (userWallet && currentWallet) {
      loadFollowers();
      loadFollowing();
      checkFollowStatus();
    }
  }, [userWallet, currentWallet, loadFollowers, loadFollowing, checkFollowStatus]);

  return {
    // Data
    followersList,
    followingList,
    followersCount: followersList.length,
    followingCount: followingList.length,
    amIFollowing,
    areTheyFollowingMe,
    
    // Loading states
    isFollowersLoading,
    isFollowingLoading,
    isFollowStatusLoading,
    
    // Actions
    handleFollowUser,
    handleUnfollowUser,
    refreshFollowers: loadFollowers,
    refreshFollowing: loadFollowing,
  };
} 