// FILE: src/components/thread/sections/SectionTrade.tsx
import React from 'react';
import {View, Text} from 'react-native';
import {TradeData} from '../thread.types';
import TradeCard from '../../TradeCard/TradeCard';

interface SectionTradeProps {
  text?: string;
  tradeData?: TradeData;
}

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
