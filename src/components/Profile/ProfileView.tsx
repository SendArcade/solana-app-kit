// File: src/components/Profile/ProfileView.tsx
import React from 'react';
import {View, StyleProp, ViewStyle} from 'react-native';
import ProfileInfo from './ProfileInfo/profileInfo';
import SwipeTabs from './slider/slider';

import {styles as profileStyles} from './profile.style';
import {ThreadPost} from '../thread/thread.types';
import {NftItem} from '../../hooks/useFetchNFTs';
import {AssetItem, PortfolioData} from '../../hooks/useFetchTokens';

export interface UserProfileData {
  address: string;
  profilePicUrl: string;
  username: string;
  // Instead of separate coin fields, we now store an object
  attachmentData?: {
    coin?: {
      mint: string;
      symbol?: string;
      name?: string;
    };
  };
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
  myActions: any[];
  loadingActions: boolean;
  fetchActionsError: string | null;
  // Portfolio related props
  portfolioData?: PortfolioData;
  onRefreshPortfolio?: () => void;
  refreshingPortfolio?: boolean;
  onAssetPress?: (asset: AssetItem) => void;
  // Refresh props
  refreshing?: boolean;
  onRefresh?: () => void;
}

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
  myActions,
  loadingActions,
  fetchActionsError,
  // Portfolio related props
  portfolioData,
  onRefreshPortfolio,
  refreshingPortfolio,
  onAssetPress,
  // Refresh props
  refreshing = false,
  onRefresh,
}: ProfileViewProps) {
  // Instead of extracting separate coin fields, now use the attachmentData object.
  const attachmentData = user.attachmentData || {};

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
        // Pass the new attachmentData object
        attachmentData={attachmentData}
      />

      <View style={{flex: 1}}>
        <SwipeTabs
          myPosts={myPosts}
          myNFTs={myNFTs}
          loadingNfts={loadingNfts}
          fetchNftsError={fetchNftsError}
          onPressPost={onPressPost}
          myActions={myActions}
          loadingActions={loadingActions}
          fetchActionsError={fetchActionsError}
          portfolioData={portfolioData}
          onRefreshPortfolio={onRefreshPortfolio}
          refreshingPortfolio={refreshingPortfolio}
          onAssetPress={onAssetPress}
          refreshing={refreshing}
          onRefresh={onRefresh}
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

  if (prev.myPosts !== next.myPosts) return false;
  if (prev.myNFTs !== next.myNFTs) return false;
  if (prev.myActions !== next.myActions) return false;
  if (prev.loadingActions !== next.loadingActions) return false;
  if (prev.fetchActionsError !== next.fetchActionsError) return false;

  if (prev.portfolioData !== next.portfolioData) return false;
  if (prev.onRefreshPortfolio !== next.onRefreshPortfolio) return false;
  if (prev.refreshingPortfolio !== next.refreshingPortfolio) return false;
  if (prev.onAssetPress !== next.onAssetPress) return false;
  
  // Compare refresh props
  if (prev.refreshing !== next.refreshing) return false;
  if (prev.onRefresh !== next.onRefresh) return false;

  return true;
}

export default React.memo(ProfileViewComponent, arePropsEqual);
