// File: src/components/Profile/ProfileView.tsx
import React, { useMemo, memo } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import UserProfileInfo from './ProfileInfo/UserProfileInfo';
import ProfileTabs from './ProfileTabs/ProfileTabs';

import { styles as profileStyles } from './profile.style';
import { ThreadPost } from '../thread/thread.types';
import { NftItem } from '../../hooks/useFetchNFTs';
import { AssetItem, PortfolioData } from '../../hooks/useFetchTokens';

export interface UserProfileData {
  address: string;
  profilePicUrl: string;
  username: string;
  description?: string;
  // Attachment data with coin properties
  attachmentData?: {
    coin?: {
      mint: string;
      symbol?: string;
      name?: string;
      image?: string;
      description?: string;
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

// Pure component that only renders when props actually change
const ProfileInfoMemo = memo(UserProfileInfo);
const ProfileTabsMemo = memo(ProfileTabs);

/**
 * ProfileView - Main profile view container that displays:
 * 1. UserProfileInfo (avatar, name, bio, stats)
 * 2. ProfileTabs (content tabs for posts, portfolio, actions)
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
  myActions,
  loadingActions,
  fetchActionsError,
  portfolioData,
  onRefreshPortfolio,
  refreshingPortfolio,
  onAssetPress,
}: ProfileViewProps) {
  // Ensure attachmentData is always defined
  const attachmentData = useMemo(() => user.attachmentData || {}, [user.attachmentData]);

  // Memoize props for the UserProfileInfo component to prevent re-renders
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
    attachmentData,
    // Social-related dependencies grouped together
    amIFollowing,
    areTheyFollowingMe,
    followersCount,
    followingCount,
    // Callback dependencies
    onAvatarPress,
    onEditProfile,
    onFollowPress,
    onUnfollowPress,
    onPressFollowers,
    onPressFollowing,
  ]);

  // Memoize props for ProfileTabs to prevent unnecessary re-renders
  const profileTabsProps = useMemo(() => ({
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
    // Content-related dependencies grouped together
    myPosts,
    myNFTs,
    myActions, 
    portfolioData,
    // Loading states grouped together
    loadingNfts,
    loadingActions,
    refreshingPortfolio,
    // Error states
    fetchNftsError,
    fetchActionsError,
    // Callback dependencies
    onPressPost,
    onRefreshPortfolio,
    onAssetPress,
  ]);

  // Memoize container style to prevent re-renders
  const containerStyleMemo = useMemo(() => [
    profileStyles.container, 
    containerStyle
  ], [containerStyle]);

  return (
    <View style={containerStyleMemo}>
      <ProfileInfoMemo {...profileInfoProps} />
      <View style={{ flex: 1 }}>
        <ProfileTabsMemo {...profileTabsProps} />
      </View>
    </View>
  );
}

/**
 * Custom comparison function to prevent unnecessary re-renders
 */
function arePropsEqual(prev: ProfileViewProps, next: ProfileViewProps) {
  // User data comparison - check by reference first
  if (prev.user !== next.user) {
    if (prev.user.address !== next.user.address) return false;
    if (prev.user.profilePicUrl !== next.user.profilePicUrl) return false;
    if (prev.user.username !== next.user.username) return false;
    if (prev.user.description !== next.user.description) return false;
  }
  
  if (prev.isOwnProfile !== next.isOwnProfile) return false;
  
  // Deep compare attachmentData.coin if it exists, only if references differ
  if (prev.user.attachmentData !== next.user.attachmentData) {
    const prevCoin = prev.user.attachmentData?.coin;
    const nextCoin = next.user.attachmentData?.coin;
    
    // If one is undefined and the other isn't
    if (!!prevCoin !== !!nextCoin) return false;
    
    // If both exist, compare key properties
    if (prevCoin && nextCoin) {
      if (prevCoin.mint !== nextCoin.mint) return false;
      if (prevCoin.symbol !== nextCoin.symbol) return false;
      if (prevCoin.name !== nextCoin.name) return false;
      if (prevCoin.image !== nextCoin.image) return false;
    }
  }

  // Reference comparisons for arrays
  if (prev.myPosts !== next.myPosts) return false;
  if (prev.myNFTs !== next.myNFTs) return false;
  if (prev.myActions !== next.myActions) return false;
  if (prev.portfolioData !== next.portfolioData) return false;

  // Loading states comparison
  if (prev.loadingNfts !== next.loadingNfts) return false;
  if (prev.fetchNftsError !== next.fetchNftsError) return false;
  if (prev.loadingActions !== next.loadingActions) return false;
  if (prev.fetchActionsError !== next.fetchActionsError) return false;
  if (prev.refreshingPortfolio !== next.refreshingPortfolio) return false;
  
  // Social state comparison
  if (prev.amIFollowing !== next.amIFollowing) return false;
  if (prev.areTheyFollowingMe !== next.areTheyFollowingMe) return false;
  if (prev.followersCount !== next.followersCount) return false;
  if (prev.followingCount !== next.followingCount) return false;
  
  // Callbacks comparison (references only)
  if (prev.onRefreshPortfolio !== next.onRefreshPortfolio) return false;
  if (prev.onAssetPress !== next.onAssetPress) return false;
  if (prev.onPressPost !== next.onPressPost) return false;
  if (prev.onAvatarPress !== next.onAvatarPress) return false;
  if (prev.onEditProfile !== next.onEditProfile) return false;
  if (prev.onFollowPress !== next.onFollowPress) return false;
  if (prev.onUnfollowPress !== next.onUnfollowPress) return false;
  if (prev.onPressFollowers !== next.onPressFollowers) return false;
  if (prev.onPressFollowing !== next.onPressFollowing) return false;
  
  // Style comparison
  if (prev.containerStyle !== next.containerStyle) return false;

  return true;
}

export default React.memo(ProfileViewComponent, arePropsEqual);
