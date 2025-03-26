// FILE: src/components/thread/sections/SectionTrade.tsx
import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, ImageSourcePropType } from 'react-native';
import { ThreadUser, TradeData } from '../thread.types';
import { TradeCard } from '../../Common/TradeCard';
import { DEFAULT_IMAGES } from '../../../config/constants';

interface SectionTradeProps {
  text?: string;
  tradeData?: TradeData;
  user?: ThreadUser;
  createdAt?: string;
  externalRefreshTrigger?: number;
}

// Global cache for user avatars to prevent recreating image sources
const userAvatarCache = new Map<string, ImageSourcePropType>();

// Moved outside component to avoid recreation on each render
function getUserAvatar(u?: ThreadUser): ImageSourcePropType {
  if (!u) return DEFAULT_IMAGES.user;

  // Use user ID as cache key
  const cacheKey = u.id || 'unknown';

  // Check cache first
  if (userAvatarCache.has(cacheKey)) {
    return userAvatarCache.get(cacheKey)!;
  }

  // Create and cache the avatar image source
  let avatarSource: ImageSourcePropType;
  if (u.avatar) {
    if (typeof u.avatar === 'string') {
      avatarSource = { uri: u.avatar };
    } else {
      avatarSource = u.avatar;
    }
  } else {
    avatarSource = DEFAULT_IMAGES.user;
  }

  // Store in cache
  userAvatarCache.set(cacheKey, avatarSource);
  return avatarSource;
}

function SectionTrade({
  text,
  tradeData,
  user,
  createdAt,
  externalRefreshTrigger,
}: SectionTradeProps) {
  // Keep a ref to the previous trade data to avoid unnecessary re-renders
  const prevTradeDataRef = useRef<TradeData | undefined>(tradeData);

  // Keep track if the component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update the ref when tradeData changes
  useEffect(() => {
    prevTradeDataRef.current = tradeData;
  }, [tradeData]);

  // Memoize values to prevent unnecessary re-renders
  const userAvatar = useMemo(() => getUserAvatar(user), [user?.id, user?.avatar]);

  // Only create a new tradeData object if necessary
  const enhancedTradeData = useMemo(() => {
    if (!tradeData) return undefined;

    return {
      ...tradeData,
      executionTimestamp: createdAt || tradeData.executionTimestamp,
    };
  }, [tradeData, createdAt]);

  // If tradeData is missing, don't render a TradeCard
  if (!enhancedTradeData) {
    return <Text>[Missing trade data]</Text>;
  }

  return (
    <View>
      {!!text && (
        <Text style={{ fontSize: 14, color: '#000', marginBottom: 6 }}>
          {text}
        </Text>
      )}
      <TradeCard
        tradeData={enhancedTradeData}
        showGraphForOutputToken={true}
        userAvatar={userAvatar}
        externalRefreshTrigger={externalRefreshTrigger}
      />
    </View>
  );
}

// Improved deep comparison function for props
function arePropsEqual(
  prev: Readonly<SectionTradeProps>,
  next: Readonly<SectionTradeProps>,
) {
  // Text comparison
  if (prev.text !== next.text) return false;

  // External refresh trigger comparison
  if (prev.externalRefreshTrigger !== next.externalRefreshTrigger) return false;

  // Created at comparison
  if (prev.createdAt !== next.createdAt) return false;

  // User comparison - check ID and avatar specifically since it's what we use
  if (
    (prev.user?.id !== next.user?.id) ||
    (prev.user?.avatar !== next.user?.avatar)
  ) {
    return false;
  }

  // Deep tradeData comparison - only compare if IDs are different
  // This prevents re-rendering for the same trade data
  const p = prev.tradeData;
  const n = next.tradeData;

  // If both are undefined, they're equal
  if (!p && !n) return true;

  // If only one is undefined, they're not equal
  if (!p || !n) return false;

  // Add a quick comparison for ID if available
  if (p.id && n.id && p.id === n.id) {
    return true;
  }

  // Compare all tradeData properties
  if (p.inputMint !== n.inputMint) return false;
  if (p.outputMint !== n.outputMint) return false;
  if (p.inputSymbol !== n.inputSymbol) return false;
  if (p.outputSymbol !== n.outputSymbol) return false;
  if (p.inputQuantity !== n.inputQuantity) return false;
  if (p.outputQuantity !== n.outputQuantity) return false;
  if (p.inputUsdValue !== n.inputUsdValue) return false;
  if (p.outputUsdValue !== n.outputUsdValue) return false;
  if (p.aggregator !== n.aggregator) return false;
  if (p.inputAmountLamports !== n.inputAmountLamports) return false;
  if (p.outputAmountLamports !== n.outputAmountLamports) return false;
  if (p.executionTimestamp !== n.executionTimestamp) return false;

  return true;
}

export default React.memo(SectionTrade, arePropsEqual);
