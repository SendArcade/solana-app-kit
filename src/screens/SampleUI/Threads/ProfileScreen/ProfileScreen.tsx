import React from 'react';
import {View} from 'react-native';
import Profile from '../../../../components/Profile/profile';
import {useAppSelector} from '../../../../hooks/useReduxHooks';
import {ThreadPost} from '../../../../components/thread/thread.types';
import {useFetchNFTs} from '../../../../hooks/useFetchNFTs';

export default function ProfileScreen() {
  // Get user data from Redux
  const userWallet = useAppSelector(state => state.auth.address);
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
  const storedUsername = useAppSelector(state => state.auth.username);
  const attachmentData = useAppSelector(state => state.auth.attachmentData || {});

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
    attachmentData,
  };
  console.log('user', user);
  console.log('attachmentData from Redux:', attachmentData);
  return (
    <View style={{flex: 1}}>
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
