// FILE: src/components/thread/sections/SectionTrade.tsx
import React from 'react';
import {View, Text, ImageSourcePropType} from 'react-native';
import {ThreadUser, TradeData} from '../thread.types';
import {TradeCard} from '../../Common/TradeCard';
import {DEFAULT_IMAGES} from '../../../config/constants';

interface SectionTradeProps {
  text?: string;
  tradeData?: TradeData;
  user?: ThreadUser;
  createdAt?: string;
  externalRefreshTrigger?: number;
}

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

function SectionTrade({
  text,
  tradeData,
  user,
  createdAt,
  externalRefreshTrigger,
}: SectionTradeProps) {
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
            executionTimestamp,
          }}
          showGraphForOutputToken={true}
          userAvatar={userAvatar}
          externalRefreshTrigger={externalRefreshTrigger}
        />
      ) : (
        <Text>[Missing trade data]</Text>
      )}
    </View>
  );
}

function arePropsEqual(
  prev: Readonly<SectionTradeProps>,
  next: Readonly<SectionTradeProps>,
) {
  if (prev.text !== next.text) return false;
  if (prev.externalRefreshTrigger !== next.externalRefreshTrigger) return false;

  const p = prev.tradeData;
  const n = next.tradeData;
  if (!p || !n) return p === n;
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
