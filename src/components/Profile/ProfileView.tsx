/**
 * File: src/components/Profile/ProfileView.tsx
 */
import React from 'react';
import {View, StyleProp, ViewStyle} from 'react-native';
import ProfileInfo from './ProfileInfo/profileInfo';
import SwipeTabs from './slider/slider';

import {styles as profileStyles} from './profile.style';
import {ThreadPost} from '../thread/thread.types';
import {NftItem} from '../../hooks/useFetchNFTs';

export interface UserProfileData {
  address: string;
  profilePicUrl: string;
  username: string;
}

export interface ProfileViewProps {
  isOwnProfile: boolean;
  user: UserProfileData;
  myPosts: ThreadPost[];
  myNFTs: NftItem[];
  loadingNfts: boolean;
  fetchNftsError: string | null;
  onAvatarPress?: () => void;
  onEditProfile?: () => void;
  amIFollowing?: boolean;
  areTheyFollowingMe?: boolean;
  onFollowPress?: () => void;
  onUnfollowPress?: () => void;
  followersCount?: number;
  followingCount?: number;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
  onPressPost?: (post: ThreadPost) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Renders the Profile layout: includes ProfileInfo and a tabbed view.
 */
function ProfileViewComponent({
  isOwnProfile,
  user,
  myPosts,
  myNFTs,
  loadingNfts,
  fetchNftsError,
  onAvatarPress,
  onEditProfile,
  amIFollowing,
  areTheyFollowingMe,
  onFollowPress,
  onUnfollowPress,
  followersCount,
  followingCount,
  onPressFollowers,
  onPressFollowing,
  onPressPost,
  containerStyle,
}: ProfileViewProps) {
  return (
    <View style={[profileStyles.container, containerStyle]}>
      <ProfileInfo
        profilePicUrl={user.profilePicUrl}
        username={user.username}
        userWallet={user.address}
        isOwnProfile={isOwnProfile}
        onAvatarPress={onAvatarPress}
        onEditProfile={onEditProfile}
        amIFollowing={amIFollowing}
        areTheyFollowingMe={areTheyFollowingMe}
        onFollowPress={onFollowPress}
        onUnfollowPress={onUnfollowPress}
        followersCount={followersCount}
        followingCount={followingCount}
        onPressFollowers={onPressFollowers}
        onPressFollowing={onPressFollowing}
      />

      <View style={{flex: 1}}>
        <SwipeTabs
          myPosts={myPosts}
          myNFTs={myNFTs}
          loadingNfts={loadingNfts}
          fetchNftsError={fetchNftsError}
          onPressPost={onPressPost}
        />
      </View>
    </View>
  );
}

function arePropsEqual(prev: ProfileViewProps, next: ProfileViewProps) {
  if (prev.isOwnProfile !== next.isOwnProfile) return false;
  if (prev.user.address !== next.user.address) return false;
  if (prev.user.profilePicUrl !== next.user.profilePicUrl) return false;
  if (prev.user.username !== next.user.username) return false;

  if (prev.loadingNfts !== next.loadingNfts) return false;
  if (prev.fetchNftsError !== next.fetchNftsError) return false;
  if (prev.amIFollowing !== next.amIFollowing) return false;
  if (prev.areTheyFollowingMe !== next.areTheyFollowingMe) return false;
  if (prev.followersCount !== next.followersCount) return false;
  if (prev.followingCount !== next.followingCount) return false;

  // Compare array references for myPosts and myNFTs
  if (prev.myPosts !== next.myPosts) return false;
  if (prev.myNFTs !== next.myNFTs) return false;
  return true;
}

export default React.memo(ProfileViewComponent, arePropsEqual);
