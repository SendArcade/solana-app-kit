// FILE: src/components/thread/sections/SectionTrade.tsx
import React from 'react';
import {View, Text} from 'react-native';
import {TradeData} from '../thread.types';
import { TradeCard } from '../../Common/TradeCard';

/**
 * Props for the SectionTrade component
 * @interface SectionTradeProps
 */
interface SectionTradeProps {
  /** Optional text content to display above the trade card */
  text?: string;
  /** The trade data to display in the card */
  tradeData?: TradeData;
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
export default function SectionTrade({text, tradeData}: SectionTradeProps) {
  return (
    <View>
      {!!text && (
        <Text style={{fontSize: 14, color: '#000', marginBottom: 6}}>
          {text}
        </Text>
      )}
      {tradeData ? (
        <TradeCard tradeData={tradeData} />
      ) : (
        <Text>[Missing trade data]</Text>
      )}
    </View>
  );
}
