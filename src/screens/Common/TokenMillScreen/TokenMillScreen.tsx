// File: src/screens/Common/TokenMillScreen/TokenMillScreen.tsx
import React, {useState} from 'react';
import {View, Text, ScrollView, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Connection, clusterApiUrl} from '@solana/web3.js';

import {useAuth} from '../../../hooks/useAuth';
import {tokenMillScreenStyles as styles} from './TokenMillScreen.style';
import FundUserCard from '../../../components/tokenMill/FundUserCard';
import ExistingAddressesCard from '../../../components/tokenMill/ExistingAddressCard';
import MarketCreationCard from '../../../components/tokenMill/MarketCreationCard';
import FundMarketCard from '../../../components/tokenMill/FundMarketCard';
import BondingCurveCard from '../../../components/tokenMill/BondingCurveCard';
import SwapCard from '../../../components/tokenMill/SwapCard';
import StakingCard from '../../../components/tokenMill/StakingCard';
import VestingCard from '../../../components/tokenMill/VestingCard';

export default function TokenMillScreen() {
  // 1) Auth & Connection
  const {solanaWallet} = useAuth();
  if (!solanaWallet?.wallets?.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Wallet not connected</Text>
      </SafeAreaView>
    );
  }
  const publicKey = solanaWallet.wallets[0].publicKey;
  const connection = new Connection(clusterApiUrl('devnet'));

  // 2) Common states
  const [loading, setLoading] = useState(false);
  const [marketAddress, setMarketAddress] = useState('');
  const [baseTokenMint, setBaseTokenMint] = useState('');
  const [vestingPlanAddress, setVestingPlanAddress] = useState('');

  // 3) Render
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>TokenMill</Text>
        <Text style={styles.subHeader}>Your Pubkey: {publicKey}</Text>
        {loading && (
          <ActivityIndicator
            color="#2a2a2a"
            style={styles.loader}
            size="large"
          />
        )}

        {/* 1) Fund user wSOL */}
        <FundUserCard
          connection={connection}
          publicKey={publicKey}
          solanaWallet={solanaWallet}
          setLoading={setLoading}
        />

        {/* 2) Existing addresses */}
        <ExistingAddressesCard
          marketAddress={marketAddress}
          setMarketAddress={setMarketAddress}
          baseTokenMint={baseTokenMint}
          setBaseTokenMint={setBaseTokenMint}
          vestingPlanAddress={vestingPlanAddress}
          setVestingPlanAddress={setVestingPlanAddress}
        />

        {/* 3) Create market */}
        <MarketCreationCard
          connection={connection}
          publicKey={publicKey}
          solanaWallet={solanaWallet}
          setLoading={setLoading}
          onMarketCreated={(addr, mint) => {
            setMarketAddress(addr);
            setBaseTokenMint(mint);
          }}
        />

        {/* 4) Fund market's wSOL account */}
        {marketAddress ? (
          <FundMarketCard
            marketAddress={marketAddress}
            connection={connection}
            publicKey={publicKey}
            solanaWallet={solanaWallet}
            setLoading={setLoading}
          />
        ) : null}

        {/* 5) Bonding Curve */}
        <BondingCurveCard
          marketAddress={marketAddress}
          connection={connection}
          publicKey={publicKey}
          solanaWallet={solanaWallet}
          setLoading={setLoading}
        />

        {/* 6) Swap */}
        <SwapCard
          marketAddress={marketAddress}
          connection={connection}
          publicKey={publicKey}
          solanaWallet={solanaWallet}
          setLoading={setLoading}
        />

        {/* 7) Staking */}
        <StakingCard
          marketAddress={marketAddress}
          connection={connection}
          publicKey={publicKey}
          solanaWallet={solanaWallet}
          setLoading={setLoading}
        />

        {/* 8) Vesting */}
        <VestingCard
          marketAddress={marketAddress}
          baseTokenMint={baseTokenMint}
          vestingPlanAddress={vestingPlanAddress}
          setVestingPlanAddress={setVestingPlanAddress}
          connection={connection}
          publicKey={publicKey}
          solanaWallet={solanaWallet}
          setLoading={setLoading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
