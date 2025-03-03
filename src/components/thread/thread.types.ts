// FILE: src/components/thread/thread.types.ts
import {
  ImageSourcePropType,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';

export type ThreadSectionType =
  | 'TEXT_ONLY'
  | 'TEXT_IMAGE'
  | 'TEXT_VIDEO'
  | 'TEXT_TRADE'
  | 'POLL'
  | 'NFT_LISTING';

export interface NftListingData {
  mint: string;
  owner: string;
  name?: string;
  image?: string;
  priceSol?: number;
  collId?: string;
}

export interface TradeData {
  // Mints for reference
  inputMint: string;
  outputMint: string;
  aggregator?: string;

  // Final trade details
  inputSymbol: string; // e.g. "SOL"
  inputQuantity: string; // e.g. "1.5"
  inputUsdValue: string; // e.g. "$30.00"

  outputSymbol: string; // e.g. "USDC"
  outputQuantity: string; // e.g. "120"
  outputUsdValue: string; // e.g. "$120.00"
}

export interface PollData {
  question: string;
  options: string[];
  votes: number[];
}

export interface ThreadSection {
  id: string;
  type: ThreadSectionType;
  text?: string;
  imageUrl?: ImageSourcePropType;
  videoUrl?: string;
  tradeData?: TradeData;
  pollData?: PollData;
  listingData?: NftListingData;
}

export interface ThreadUser {
  id: string;
  username: string;
  handle: string;
  avatar: ImageSourcePropType;
  verified?: boolean;
}

export interface ThreadPost {
  id: string;
  parentId?: string | null;
  user: ThreadUser;
  sections: ThreadSection[];
  createdAt: string;
  replies: ThreadPost[];
  reactionCount: number;
  retweetCount: number;
  quoteCount: number;
}

export interface ThreadCTAButton {
  label: string;
  onPress: (post: ThreadPost) => void;
  buttonStyle?: StyleProp<ViewStyle>;
  buttonLabelStyle?: StyleProp<TextStyle>;
}
