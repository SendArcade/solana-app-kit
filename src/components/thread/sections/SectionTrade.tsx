// FILE: src/components/thread/sections/SectionTrade.tsx
import React from 'react';
import {View, Text, ImageSourcePropType} from 'react-native';
import {ThreadUser, TradeData} from '../thread.types';
import {TradeCard} from '../../Common/TradeCard';
import { DEFAULT_IMAGES } from '../../../config/constants';

/**
 * Props for the SectionTrade component
 * @interface SectionTradeProps
 */
interface SectionTradeProps {
  /** Optional text content to display above the trade card */
  text?: string;
  /** The trade data to display in the card */
  tradeData?: TradeData;
  user?: ThreadUser;
  createdAt?: string;
}

/**
 * A component that renders a trade card in a post section
 *
 * @component
 * @description
 * SectionTrade displays a trade card with optional text content in a post.
 * The trade card shows detailed information about a token swap, including
 * input and output tokens, quantities, and USD values. The component uses
 * the TradeCard component to render the actual trade details.
 *
 * Features:
 * - Text and trade card combination
 * - Optional text content
 * - Detailed trade information display
 * - Missing data handling
 * - Consistent styling
 *
 * @example
 * ```tsx
 * <SectionTrade
 *   text="Just executed this trade!"
 *   tradeData={{
 *     inputMint: "So11111111111111111111111111111111111111112",
 *     outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
 *     inputSymbol: "SOL",
 *     outputSymbol: "USDC",
 *     inputQuantity: "1.5",
 *     outputQuantity: "30.5",
 *     inputUsdValue: "$45.00",
 *     outputUsdValue: "$30.50"
 *   }}
 * />
 * ```
 */

function getUserAvatar(u?: ThreadUser): ImageSourcePropType {
  if (!u) return DEFAULT_IMAGES.user;
  
  if (u.avatar) {
    if (typeof u.avatar === 'string') {
      return {uri: u.avatar};
    }
    return u.avatar;
  }
  
  return DEFAULT_IMAGES.user;
}
function SectionTrade({text, tradeData, user, createdAt}: SectionTradeProps) {

  const executionTimestamp = createdAt;

  const userAvatar = getUserAvatar(user);
  return (
    <View>
      {!!text && (
        <Text style={{fontSize: 14, color: '#000', marginBottom: 6}}>
          {text}
        </Text>
      )}
      {tradeData ? (
    <TradeCard 
    tradeData={{
      ...tradeData,
      executionTimestamp // Add executionTimestamp to tradeData
    }}
    showGraphForOutputToken={true} 
    userAvatar={userAvatar} // Pass user avatar to TradeCard
  />
      ) : (
        <Text>[Missing trade data]</Text>
      )}
    </View>
  );
}

/**
 * Memo comparison to skip re-renders unless `text` or `tradeData` changes.
 */
function arePropsEqual(
  prev: Readonly<SectionTradeProps>,
  next: Readonly<SectionTradeProps>,
) {
  if (prev.text !== next.text) return false;
  const p = prev.tradeData;
  const n = next.tradeData;
  // If either side is missing tradeData => not equal
  if (!p || !n) return p === n; // they’re equal only if both are null/undefined
  // Compare each field
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
  return true;
}

export default React.memo(SectionTrade, arePropsEqual);
