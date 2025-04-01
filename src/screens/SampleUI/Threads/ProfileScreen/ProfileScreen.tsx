import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Profile from '../../../../core/profile/components/profile';
import { useAppSelector, useAppDispatch } from '../../../../hooks/useReduxHooks';
import { ThreadPost } from '../../../../core/thread/components/thread.types';
import { useWallet } from '../../../../modules/embeddedWalletProviders/hooks/useWallet';
import { flattenPosts } from '../../../../core/thread/components/thread.utils';
import { useFocusEffect } from '@react-navigation/native';
import { fetchFollowers, fetchFollowing } from '../../../../services/profileService';
import { useFetchNFTs } from '../../../../modules/nft';

export default function ProfileScreen() {
  // Get user data from Redux
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
  const storedUsername = useAppSelector(state => state.auth.username);
  const storedDescription = useAppSelector(state => state.auth.description);
  const attachmentData = useAppSelector(state => state.auth.attachmentData || {});

  // Use the wallet hook to get the user's address
  const { address: userWallet } = useWallet();

  // Add state for counts to force refresh
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Get all posts from Redux
  const allPosts = useAppSelector(state => state.thread.allPosts);

  // Filter posts belonging to the current user, including replies
  const myPosts = useMemo(() => {
    if (!userWallet) return [];

    // Flatten all posts to include nested replies
    const flattenedPosts = flattenPosts(allPosts);

    // Filter for posts by this user
    const userPosts = flattenedPosts.filter(
      (p: ThreadPost) => p.user.id.toLowerCase() === userWallet.toLowerCase()
    );

    // Sort by creation date, newest first
    userPosts.sort((a: ThreadPost, b: ThreadPost) =>
      (new Date(b.createdAt) > new Date(a.createdAt) ? 1 : -1)
    );

    return userPosts;
  }, [userWallet, allPosts]);

  // Fetch NFT data using our custom hook
  const {
    nfts,
    loading: loadingNfts,
    error: fetchNftsError,
  } = useFetchNFTs(userWallet || undefined);

  // Build the user object
  const user = {
    address: userWallet || '',
    profilePicUrl: storedProfilePic || '',
    username: storedUsername || 'Unknown User',
    description: storedDescription || '',
    attachmentData,
  };

  // Refresh follower/following counts when the profile screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (!userWallet) return;

      console.log('[ProfileScreen] Screen focused, refreshing follower/following data');

      // Fetch followers count
      fetchFollowers(userWallet).then(list => {
        console.log('[ProfileScreen] Updated followers count:', list.length);
        setFollowersCount(list.length);
      });

      // Fetch following count
      fetchFollowing(userWallet).then(list => {
        console.log('[ProfileScreen] Updated following count:', list.length);
        setFollowingCount(list.length);
      });

    }, [userWallet])
  );

  // Log user data only when it changes
  useEffect(() => {
    console.log('user', user);
    console.log('attachmentData from Redux:', attachmentData);
  }, [userWallet, storedProfilePic, storedUsername, storedDescription]);

  return (
    <View style={{ flex: 1 }}>
      <Profile
        isOwnProfile={true}
        user={user}
        posts={myPosts}
        nfts={nfts}
        loadingNfts={loadingNfts}
        fetchNftsError={fetchNftsError}
        key={`profile-${followersCount}-${followingCount}`} // Force refresh when counts change
      />
    </View>
  );
}
