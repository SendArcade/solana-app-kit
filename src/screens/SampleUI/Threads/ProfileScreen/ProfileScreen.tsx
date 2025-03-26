import React, { useEffect } from 'react';
import { View } from 'react-native';
import Profile from '../../../../components/Profile/profile';
import { useAppSelector } from '../../../../hooks/useReduxHooks';
import { ThreadPost } from '../../../../components/thread/thread.types';
import { useFetchNFTs } from '../../../../hooks/useFetchNFTs';
import { useWallet } from '../../../../hooks/useWallet';

export default function ProfileScreen() {
  // Get user data from Redux
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
  const storedUsername = useAppSelector(state => state.auth.username);
  const storedDescription = useAppSelector(state => state.auth.description);
  const attachmentData = useAppSelector(state => state.auth.attachmentData || {});

  // Use the wallet hook to get the user's address
  const { address: userWallet } = useWallet();

  // Get all posts from Redux
  const allPosts = useAppSelector(state => state.thread.allPosts);

  // Filter posts belonging to the current user
  const myPosts: ThreadPost[] = userWallet
    ? allPosts.filter(p => p.user.id.toLowerCase() === userWallet.toLowerCase())
    : [];

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
      />
    </View>
  );
}
