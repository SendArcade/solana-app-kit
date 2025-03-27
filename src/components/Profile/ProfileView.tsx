// File: src/components/Profile/ProfileView.tsx
import React, { useMemo } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import ProfileInfo from './ProfileInfo/profileInfo';
import SwipeTabs from './slider/slider';

import { styles as profileStyles } from './profile.style';
import { ThreadPost } from '../thread/thread.types';
import { NftItem } from '../../hooks/useFetchNFTs';
import { AssetItem, PortfolioData } from '../../hooks/useFetchTokens';

export interface UserProfileData {
  address: string;
  profilePicUrl: string;
  username: string;
  description?: string;
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
}: ProfileViewProps) {
  // Instead of extracting separate coin fields, now use the attachmentData object.
  const attachmentData = user.attachmentData || {};

  // Memoize props for the ProfileInfo component to prevent re-renders of other tabs
  const profileInfoProps = useMemo(() => ({
    profilePicUrl: user.profilePicUrl,
    username: user.username,
    userWallet: user.address,
    bioText: user.description,
    isOwnProfile,
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
    attachmentData,
  }), [
    user.profilePicUrl,
    user.username,
    user.address,
    user.description,
    isOwnProfile,
    onAvatarPress,
    onEditProfile,
    attachmentData,
    // Include these props in dependencies but they shouldn't trigger re-renders of SwipeTabs
    amIFollowing,
    areTheyFollowingMe,
    onFollowPress,
    onUnfollowPress,
    followersCount,
    followingCount,
    onPressFollowers,
    onPressFollowing,
  ]);

  // Memoize props for SwipeTabs to prevent unnecessary re-renders
  const swipeTabsProps = useMemo(() => ({
    myPosts,
    myNFTs,
    loadingNfts,
    fetchNftsError,
    onPressPost,
    myActions,
    loadingActions,
    fetchActionsError,
    portfolioData,
    onRefreshPortfolio,
    refreshingPortfolio,
    onAssetPress,
  }), [
    myPosts,
    myNFTs,
    loadingNfts,
    fetchNftsError,
    onPressPost,
    myActions,
    loadingActions,
    fetchActionsError,
    portfolioData,
    onRefreshPortfolio,
    refreshingPortfolio,
    onAssetPress,
  ]);

  return (
    <View style={[profileStyles.container, containerStyle]}>
      <ProfileInfo {...profileInfoProps} />

      <View style={{ flex: 1 }}>
        <SwipeTabs {...swipeTabsProps} />
      </View>
    </View>
  );
}

function arePropsEqual(prev: ProfileViewProps, next: ProfileViewProps) {
  if (prev.isOwnProfile !== next.isOwnProfile) return false;
  if (prev.user.address !== next.user.address) return false;
  if (prev.user.profilePicUrl !== next.user.profilePicUrl) return false;
  if (prev.user.username !== next.user.username) return false;
  if (prev.user.description !== next.user.description) return false;

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

  return true;
}

export default React.memo(ProfileViewComponent, arePropsEqual);
