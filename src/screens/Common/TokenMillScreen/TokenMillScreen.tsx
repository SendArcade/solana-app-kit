// File: src/screens/Common/TokenMillScreen/TokenMillScreen.tsx
import React, {useState} from 'react';
import {View, Text, ScrollView, ActivityIndicator, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Cluster, Connection, clusterApiUrl} from '@solana/web3.js';

import {useAuth} from '../../../hooks/useAuth';
import {useWallet} from '../../../hooks/useWallet';
import {tokenMillScreenStyles as styles} from './TokenMillScreen.style';
import FundUserCard from '../../../components/tokenMill/FundUserCard';
import ExistingAddressesCard from '../../../components/tokenMill/ExistingAddressCard';
import MarketCreationCard from '../../../components/tokenMill/MarketCreationCard';
import FundMarketCard from '../../../components/tokenMill/FundMarketCard';
import BondingCurveCard from '../../../components/tokenMill/BondingCurveCard';
import SwapCard from '../../../components/tokenMill/SwapCard';
import StakingCard from '../../../components/tokenMill/StakingCard';
import VestingCard from '../../../components/tokenMill/VestingCard';
import { ENDPOINTS } from '../../../config/constants';
import { CLUSTER } from '@env';
import { useAppSelector } from '../../../hooks/useReduxHooks';

export default function TokenMillScreen() {
  // 1) Auth & Connection
  const {wallet, address} = useWallet();
  const {solanaWallet} = useAuth();
  const myWallet = useAppSelector(state => state.auth.address);
  

  if (!wallet && !solanaWallet?.wallets?.length && !myWallet) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Wallet not connected</Text>
      </SafeAreaView>
    );
  }
  
  // Make sure we have a valid public key string
  const publicKey = (myWallet || address || solanaWallet?.wallets?.[0]?.publicKey) || '';
  if (!publicKey) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>No valid wallet public key found</Text>
      </SafeAreaView>
    );
  }

  const rpcUrl = clusterApiUrl(CLUSTER as Cluster) || ENDPOINTS.helius;
  const connection = new Connection(rpcUrl, 'confirmed');

  // 2) Common states
  const [loading, setLoading] = useState(false);
  const [marketAddress, setMarketAddress] = useState('');
  const [baseTokenMint, setBaseTokenMint] = useState('');
  const [vestingPlanAddress, setVestingPlanAddress] = useState('');

  // Get the most appropriate wallet to use for transactions
  const getWalletForTransactions = () => {
    // Prefer the standardized wallet if available
    if (wallet) {
      return wallet;
    }
    
    // Fall back to solanaWallet if available
    if (solanaWallet) {
      return solanaWallet;
    }
    
    // If no wallet available, show error
    Alert.alert('Error', 'No wallet is available for transactions');
    return null;
  };
  
  const walletForTx = getWalletForTransactions();
  
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
        {walletForTx && (
          <FundUserCard
            connection={connection}
            publicKey={publicKey}
            solanaWallet={walletForTx}
            setLoading={setLoading}
          />
        )}

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
        {walletForTx && (
          <MarketCreationCard
            connection={connection}
            publicKey={publicKey}
            solanaWallet={walletForTx}
            setLoading={setLoading}
            onMarketCreated={(addr, mint) => {
              setMarketAddress(addr);
              setBaseTokenMint(mint);
            }}
          />
        )}

        {/* 4) Fund market's wSOL account */}
        {marketAddress && walletForTx && (
          <FundMarketCard
            marketAddress={marketAddress}
            connection={connection}
            publicKey={publicKey}
            solanaWallet={walletForTx}
            setLoading={setLoading}
          />
        )}

        {/* 5) Bonding Curve */}
        {walletForTx && (
          <BondingCurveCard
            marketAddress={marketAddress}
            connection={connection}
            publicKey={publicKey}
            solanaWallet={walletForTx}
            setLoading={setLoading}
          />
        )}

        {/* 6) Swap */}
        {walletForTx && (
          <SwapCard
            marketAddress={marketAddress}
            connection={connection}
            publicKey={publicKey}
            solanaWallet={walletForTx}
            setLoading={setLoading}
          />
        )}

        {/* 7) Staking */}
        {walletForTx && (
          <StakingCard
            marketAddress={marketAddress}
            connection={connection}
            publicKey={publicKey}
            solanaWallet={walletForTx}
            setLoading={setLoading}
          />
        )}

        {/* 8) Vesting */}
        {walletForTx && (
          <VestingCard
            marketAddress={marketAddress}
            baseTokenMint={baseTokenMint}
            vestingPlanAddress={vestingPlanAddress}
            setVestingPlanAddress={setVestingPlanAddress}
            connection={connection}
            publicKey={publicKey}
            solanaWallet={walletForTx}
            setLoading={setLoading}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
