/**
 * Profile module type definitions
 */

// User profile data structure
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

// Profile component props
export interface ProfileProps {
  isOwnProfile?: boolean;
  user: {
    address: string;
    profilePicUrl?: string;
    username?: string;
    description?: string;
    attachmentData?: any;
  };
  posts?: ThreadPost[];
  nfts?: NftItem[];
  loadingNfts?: boolean;
  fetchNftsError?: string | null;
  containerStyle?: object;
}

// Profile view component props
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
  // New loading state prop to prevent flickering
  isLoading?: boolean;
}

// User profile info component props
export interface UserProfileInfoProps {
  /** The user's profile picture URL */
  profilePicUrl: string;
  /** The user's current display name */
  username: string;
  /** The user's Solana wallet address */
  userWallet: string;
  /** Whether this profile belongs to the current user (is own profile) */
  isOwnProfile: boolean;
  /** Callback when user taps the avatar image (e.g. pick a new avatar) */
  onAvatarPress?: () => void;
  /** Callback when user taps "Edit Profile" (open an edit name modal) */
  onEditProfile?: () => void;
  /** Optional short text describing the user's bio. We'll show mention highlighting. */
  bioText?: string;
  /** If the current user is following this user */
  amIFollowing?: boolean;
  /** If this user is following the current user */
  areTheyFollowingMe?: boolean;
  /** Called when we tap "Follow" or "Follow Back" */
  onFollowPress?: () => void;
  /** Called when we tap "Unfollow" */
  onUnfollowPress?: () => void;
  /** Follower count for display */
  followersCount?: number;
  /** Following count for display */
  followingCount?: number;
  /** If provided, pressing follower count triggers onPressFollowers */
  onPressFollowers?: () => void;
  /** If provided, pressing following count triggers onPressFollowing */
  onPressFollowing?: () => void;
  /**
   * Attachment data from the DB. We specifically care about:
   *  { coin?: {
   *       mint: string;
   *       symbol?: string;
   *       name?: string;
   *       image?: string;       // stored from Helius or user-provided
   *       description?: string; // user-provided description
   *  } }
   */
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

// Profile tabs component props
export interface ProfileTabsProps {
  myPosts: ThreadPost[];
  myNFTs: NftItem[];
  loadingNfts?: boolean;
  fetchNftsError?: string | null;
  myActions: any[];
  loadingActions?: boolean;
  fetchActionsError?: string | null;
  onPressPost?: (post: ThreadPost) => void;
  portfolioData?: PortfolioData;
  onRefreshPortfolio?: () => void;
  refreshingPortfolio?: boolean;
  onAssetPress?: (asset: AssetItem) => void;
}

// Actions page component props
export interface ActionsPageProps {
  myActions: Action[];
  loadingActions?: boolean;
  fetchActionsError?: string | null;
  walletAddress?: string;
}

// Actions related types
export interface RawTokenAmount {
  tokenAmount: string;
  decimals: number;
}

export interface TokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  fromTokenAccount: string;
  toTokenAccount: string;
  tokenAmount: number;
  mint: string;
  tokenName?: string;
  symbol?: string;
}

export interface NativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number;
}

export interface TokenDetail {
  userAccount: string;
  tokenAccount: string;
  mint: string;
  rawTokenAmount: RawTokenAmount;
}

export interface SwapEvent {
  tokenInputs?: TokenDetail[];
  tokenOutputs?: TokenDetail[];
  tokenFees?: TokenDetail[];
  nativeInput?: {account: string; amount: string | number};
  nativeOutput?: {account: string; amount: string | number};
  nativeFees?: Array<{account: string; amount: string | number}>;
  innerSwaps?: any[];
}

export interface TransactionEvents {
  nft?: any;
  swap?: SwapEvent;
  compressed?: any;
  distributeCompressionRewards?: {amount: number};
  setAuthority?: any;
}

// Import needed types
import { AssetItem, PortfolioData } from '../../../hooks/useFetchTokens';
import { StyleProp, ViewStyle } from 'react-native';
import { Action } from '../services/profileActions';import { ThreadPost } from '../../thread/types';
import { NftItem } from '../../../modules/nft';
 