import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { styles } from './styles';

import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Transaction,
  Connection,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from '@solana/web3.js';
import * as spl from '@solana/spl-token';
import { createSyncNativeInstruction } from '@solana/spl-token';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { useAuth } from '../../hooks/useAuth';

import { LineChart } from 'react-native-chart-kit';
import BondingCurveCustomizer from '../../components/BondingCurveCustomizer';

const SERVER_URL = 'http://localhost:3000'; // or your real server address

type CurveType = 'linear' | 'power' | 'exponential' | 'logistic';

export default function TokenMillScreen() {
  //-------------------------------------------------------------------------------------
  // 1) AUTH CHECK
  //-------------------------------------------------------------------------------------
  const { solanaWallet } = useAuth();
  if (!solanaWallet || !solanaWallet.wallets || solanaWallet.wallets.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Wallet not connected</Text>
      </SafeAreaView>
    );
  }

  //-------------------------------------------------------------------------------------
  // 2) BASIC STATE FOR YOUR SOLANA & MARKET
  //-------------------------------------------------------------------------------------
  const publicKey = solanaWallet.wallets[0].publicKey;
  const connection = new Connection(clusterApiUrl('devnet'));

  // -- Input Fields: Existing Market, Base Token Mint, Vesting Plan Address --
  const [marketAddress, setMarketAddress] = useState('');
  const [baseTokenMint, setBaseTokenMint] = useState('');
  const [vestingPlanAddress, setVestingPlanAddress] = useState('');

  // Market creation form:
  const [tokenName, setTokenName] = useState('MyToken');
  const [tokenSymbol, setTokenSymbol] = useState('MTK');
  const [metadataUri, setMetadataUri] = useState('https://arweave.net/abc123');
  const [totalSupply, setTotalSupply] = useState('1000000');
  const [creatorFee, setCreatorFee] = useState('3300');
  const [stakingFee, setStakingFee] = useState('6200');

  // Vesting form:
  const [vestingAmount, setVestingAmount] = useState('200000');

  // Swap form (Buy/Sell):
  const [swapType, setSwapType] = useState<'buy' | 'sell'>('buy');
  const [swapAmount, setSwapAmount] = useState('1000000');

  // UI loading spinner:
  const [loading, setLoading] = useState(false);

  //-------------------------------------------------------------------------------------
  // 3) BONDING CURVE STATE
  //-------------------------------------------------------------------------------------
  const [curveType, setCurveType] = useState<CurveType>('power');
  const [nPoints, setNPoints] = useState(11);
  const [minPrice, setMinPrice] = useState(10);
  const [maxPrice, setMaxPrice] = useState(500000);

  const [exponent, setExponent] = useState(1.0);
  const [growthRate, setGrowthRate] = useState(1.0);

  const [midPoint, setMidPoint] = useState(0.5);
  const [steepness, setSteepness] = useState(5.0);

  const [askPrices, setAskPrices] = useState<number[]>([]);
  const [bidPrices, setBidPrices] = useState<number[]>([]);

  //-------------------------------------------------------------------------------------
  // 4) REBUILD ASK PRICES WHENEVER PARAMETERS CHANGE
  //-------------------------------------------------------------------------------------
  useEffect(() => {
    const newAsks: number[] = [];
    for (let i = 0; i < nPoints; i++) {
      const t = i / (nPoints - 1); // safe since nPoints >= 5
      let val: number;
      switch (curveType) {
        case 'linear':
          val = minPrice + (maxPrice - minPrice) * t;
          break;
        case 'power':
          val = minPrice + (maxPrice - minPrice) * Math.pow(t, exponent);
          break;
        case 'exponential': {
          const ratio = Math.pow(maxPrice / Math.max(minPrice, 1), t);
          val = minPrice * Math.pow(ratio, growthRate / 2);
          break;
        }
        case 'logistic': {
          const logistic = 1 / (1 + Math.exp(-steepness * (t - midPoint)));
          val = minPrice + (maxPrice - minPrice) * logistic;
          break;
        }
      }
      newAsks.push(Math.round(val));
    }
    setAskPrices(newAsks);
  }, [curveType, nPoints, minPrice, maxPrice, exponent, growthRate, midPoint, steepness]);

  // Whenever askPrices changes, recalc bidPrices as 98% of askPrices
  useEffect(() => {
    setBidPrices(askPrices.map(x => Math.floor(x * 0.98)));
  }, [askPrices]);

  //-------------------------------------------------------------------------------------
  // 5) signAndSendLegacyTx HELPER
  //-------------------------------------------------------------------------------------
  const signAndSendLegacyTx = async (base64Tx: string) => {
    const txBuffer = Buffer.from(base64Tx, 'base64');
    const legacyTx = Transaction.from(txBuffer);

    const provider = solanaWallet.getProvider && (await solanaWallet.getProvider());
    if (!provider || typeof provider.request !== 'function') {
      throw new Error('Wallet provider does not support request().');
    }
    const serializedMessage = legacyTx.serializeMessage();
    const base64Message = Buffer.from(serializedMessage).toString('base64');

    const signResult = await provider.request({
      method: 'signMessage',
      params: { message: base64Message },
    });
    if (!signResult || !signResult.signature) {
      throw new Error('No signature from wallet');
    }

    legacyTx.addSignature(
      new PublicKey(publicKey),
      Buffer.from(signResult.signature, 'base64')
    );

    const signedTx = legacyTx.serialize();
    const txSignature = await connection.sendRawTransaction(signedTx);
    await connection.confirmTransaction(txSignature);
    return txSignature;
  };

  //-------------------------------------------------------------------------------------
  // 6) MARKET CREATION / STAKING / VESTING / SWAP
  //-------------------------------------------------------------------------------------
  const handleCreateMarket = async () => {
    try {
      setLoading(true);
      const body = {
        name: tokenName,
        symbol: tokenSymbol,
        uri: metadataUri,
        totalSupply: parseInt(totalSupply, 10),
        creatorFeeShare: parseInt(creatorFee, 10),
        stakingFeeShare: parseInt(stakingFee, 10),
        userPublicKey: publicKey,
      };
      const response = await fetch(`${SERVER_URL}/api/markets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || 'Market creation failed');
      }
      const txSig = await signAndSendLegacyTx(json.transaction);
      Alert.alert('Market Created', `Market: ${json.marketAddress}\nTx: ${txSig}`);
      setMarketAddress(json.marketAddress);
      setBaseTokenMint(json.baseTokenMint);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async (amount: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${SERVER_URL}/api/stake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketAddress,
          amount,
          userPublicKey: publicKey,
        }),
      });
      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || 'Stake failed');
      }
      const txSig = await signAndSendLegacyTx(json.data);
      Alert.alert('Staked Successfully', `Tx: ${txSig}`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVesting = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`${SERVER_URL}/api/vesting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketAddress,
          recipient: publicKey,
          amount: parseInt(vestingAmount, 10),
          startTime: Math.floor(Date.now() / 1000),
          duration: 3600,
          cliffDuration: 1800,
          baseTokenMint,
          userPublicKey: publicKey,
        }),
      });
      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.error || 'Vesting creation failed');
      }
      const txSig = await signAndSendLegacyTx(data.data.transaction);
      setVestingPlanAddress(data.data.ephemeralVestingPubkey);
      Alert.alert(
        'Vesting Created',
        `VestingPlan: ${data.data.ephemeralVestingPubkey}\nTx: ${txSig}`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseVesting = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SERVER_URL}/api/vesting/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketAddress,
          vestingPlanAddress,
          baseTokenMint,
          userPublicKey: publicKey,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Release vesting failed');
      }
      const txSig = await signAndSendLegacyTx(data.data);
      Alert.alert('Vesting Released', `Tx: ${txSig}`);
    } catch (error: any) {
      console.error('[handleReleaseVesting] Error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SERVER_URL}/api/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market: marketAddress,
          quoteTokenMint: 'So11111111111111111111111111111111111111112',
          action: swapType,
          tradeType: 'exactInput',
          amount: parseInt(swapAmount, 10),
          otherAmountThreshold: 1,
          userPublicKey: publicKey,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Swap failed');
      }
      const txSig = await signAndSendLegacyTx(data.transaction);
      Alert.alert('Swap Success', `Signature: ${txSig}`);
    } catch (error: any) {
      console.log('[handleSwap] Error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  //-------------------------------------------------------------------------------------
  // NEW: FUND MARKET QUOTE TOKEN ACCOUNT (WRAP SOL) FUNCTION
  //-------------------------------------------------------------------------------------
  const handleFundMarket = async () => {
    if (!marketAddress) {
      Alert.alert('Error', 'Market address is required to fund the quote token account.');
      return;
    }
    try {
      setLoading(true);
      console.log("[handleFundMarket] Starting funding process for market:", marketAddress);
      const marketPubkey = new PublicKey(marketAddress);
      const quoteTokenMint = new PublicKey("So11111111111111111111111111111111111111112");
      // Derive the market's quote token associated token account (ATA)
      const marketQuoteTokenAta = spl.getAssociatedTokenAddressSync(
        quoteTokenMint,
        marketPubkey,
        true
      );
      console.log("[handleFundMarket] Derived market quote ATA:", marketQuoteTokenAta.toBase58());
  
      // Check if the ATA exists; if not, add an instruction to create it.
      const ataInfo = await connection.getAccountInfo(marketQuoteTokenAta);
      const tx = new Transaction();
      if (!ataInfo) {
        console.log("[handleFundMarket] Market quote ATA does not exist, creating it...");
        const createATAIx = spl.createAssociatedTokenAccountInstruction(
          new PublicKey(publicKey), // payer
          marketQuoteTokenAta,      // ATA to create
          marketPubkey,             // owner of the ATA
          quoteTokenMint
        );
        tx.add(createATAIx);
      } else {
        console.log("[handleFundMarket] Market quote ATA already exists.");
      }
  
      // Specify amount to deposit (e.g., 0.1 SOL)
      const lamportsToDeposit = Math.floor(0.1 * LAMPORTS_PER_SOL);
      console.log("[handleFundMarket] Depositing lamports:", lamportsToDeposit);
  
      // Create a transfer instruction from your wallet to the market's wSOL ATA
      const transferIx = SystemProgram.transfer({
        fromPubkey: new PublicKey(publicKey),
        toPubkey: marketQuoteTokenAta,
        lamports: lamportsToDeposit,
      });
      console.log("[handleFundMarket] Created transfer instruction.");
  
      // Create a sync instruction so the token program recognizes the new balance
      const syncIx = createSyncNativeInstruction(marketQuoteTokenAta);
      console.log("[handleFundMarket] Created sync instruction.");
  
      tx.add(transferIx, syncIx);
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = new PublicKey(publicKey);
      console.log("[handleFundMarket] Transaction built. Serializing transaction...");
  
      const serializedTx = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const base64Tx = serializedTx.toString('base64');
      console.log("[handleFundMarket] Serialized transaction to base64. Sending transaction...");
  
      const txSignature = await signAndSendLegacyTx(base64Tx);
      console.log("[handleFundMarket] Transaction sent successfully. Signature:", txSignature);
      Alert.alert('Market Funded', `wSOL deposited.\nTx: ${txSignature}`);
    } catch (error: any) {
      console.error("[handleFundMarket] Error:", error);
      // If error is a SendTransactionError, log its details.
      if (error && typeof error.getLogs === 'function') {
        console.log("[handleFundMarket] Transaction logs:", error.getLogs());
      }
      Alert.alert('Error funding market', error.message);
    } finally {
      setLoading(false);
    }
  };
  

  //-------------------------------------------------------------------------------------
  // 7) handleSetCurve: Calls /api/set-curve with askPrices + bidPrices
  //-------------------------------------------------------------------------------------
  const handleSetCurve = async () => {
    if (!marketAddress) {
      Alert.alert('Error', 'No Market Address found; create market first.');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${SERVER_URL}/api/set-curve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market: marketAddress,
          userPublicKey: publicKey,
          askPrices,
          bidPrices,
        }),
      });
      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to build setMarketPrices transaction');
      }
      const txSig = await signAndSendLegacyTx(json.data.transaction);
      Alert.alert('Bonding Curve Set', `Tx: ${txSig}`);
    } catch (error: any) {
      Alert.alert('Error setting curve', error.message);
    } finally {
      setLoading(false);
    }
  };

  //-------------------------------------------------------------------------------------
  // 8) Chart Data & Dynamic Scale (with safety checks)
  //-------------------------------------------------------------------------------------
  // Ensure all numbers are finite:
  const safeAskPrices = askPrices.map(n => (Number.isFinite(n) ? n : 0));
  const safeBidPrices = bidPrices.map(n => (Number.isFinite(n) ? n : 0));

  const maxAsk = Math.max(...safeAskPrices, 0);
  const maxBid = Math.max(...safeBidPrices, 0);
  const globalMax = Math.max(maxAsk, maxBid);

  let scaleFactor = 1;
  let labelSuffix = '';
  if (globalMax >= 1_000_000) {
    scaleFactor = 1_000_000;
    labelSuffix = 'M';
  } else if (globalMax >= 1_000) {
    scaleFactor = 1_000;
    labelSuffix = 'K';
  }

  // Normalize data by scaleFactor
  const normalizedAskData = safeAskPrices.map(n => n / scaleFactor);
  const normalizedBidData = safeBidPrices.map(n => n / scaleFactor);

  // If all data points are the same, adjust the last point by a tiny amount to avoid zero range
  if (
    normalizedAskData.length > 0 &&
    Math.min(...normalizedAskData) === Math.max(...normalizedAskData)
  ) {
    normalizedAskData[normalizedAskData.length - 1] += 0.0001;
  }
  if (
    normalizedBidData.length > 0 &&
    Math.min(...normalizedBidData) === Math.max(...normalizedBidData)
  ) {
    normalizedBidData[normalizedBidData.length - 1] += 0.0001;
  }

  const chartDataObj = {
    labels: askPrices.map((_, i) => i.toString()),
    datasets: [
      {
        data: normalizedAskData,
        color: () => '#f55',
        strokeWidth: 2,
      },
      {
        data: normalizedBidData,
        color: () => '#55f',
        strokeWidth: 2,
      },
    ],
    legend: [`Ask (${labelSuffix})`, `Bid (${labelSuffix})`],
  };

  const screenWidth = Dimensions.get('window').width;

  //-------------------------------------------------------------------------------------
  // 9) RENDER
  //-------------------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>TokenMill</Text>
        <Text style={styles.subHeader}>Your Pubkey: {publicKey}</Text>

        {loading && (
          <ActivityIndicator size="large" color="#2a2a2a" style={styles.loader} />
        )}

        {/* --- 1) Input Fields --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Existing Market (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Market Address"
            value={marketAddress}
            onChangeText={setMarketAddress}
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Base Token Mint (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Base Token Mint"
            value={baseTokenMint}
            onChangeText={setBaseTokenMint}
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Existing Vesting Plan Address (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Vesting Plan Address"
            value={vestingPlanAddress}
            onChangeText={setVestingPlanAddress}
          />
        </View>

        {/* --- 2) Market Creation --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Market (Token)</Text>
          <TextInput
            style={styles.input}
            placeholder="Token Name"
            value={tokenName}
            onChangeText={setTokenName}
          />
          <TextInput
            style={styles.input}
            placeholder="Token Symbol"
            value={tokenSymbol}
            onChangeText={setTokenSymbol}
          />
          <TextInput
            style={styles.input}
            placeholder="Metadata URI"
            value={metadataUri}
            onChangeText={setMetadataUri}
          />
          <TextInput
            style={styles.input}
            placeholder="Total Supply"
            value={totalSupply}
            onChangeText={setTotalSupply}
          />
          <TextInput
            style={styles.input}
            placeholder="Creator Fee BPS"
            value={creatorFee}
            onChangeText={setCreatorFee}
          />
          <TextInput
            style={styles.input}
            placeholder="Staking Fee BPS"
            value={stakingFee}
            onChangeText={setStakingFee}
          />

          <TouchableOpacity style={styles.button} onPress={handleCreateMarket}>
            <Text style={styles.buttonText}>Create Market</Text>
          </TouchableOpacity>
          {!!marketAddress && (
            <Text style={styles.result}>Market Address: {marketAddress}</Text>
          )}
        </View>

        {/* --- NEW: FUND MARKET QUOTE TOKEN ACCOUNT --- */}
        {marketAddress ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Fund Market Quote Token Account (Wrap SOL)
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleFundMarket}>
              <Text style={styles.buttonText}>Fund Market (0.1 SOL)</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* --- 3) Bonding Curve Customizer --- */}
        <BondingCurveCustomizer
          curveType={curveType}
          setCurveType={setCurveType}
          nPoints={nPoints}
          setNPoints={setNPoints}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          exponent={exponent}
          setExponent={setExponent}
          growthRate={growthRate}
          setGrowthRate={setGrowthRate}
          midPoint={midPoint}
          setMidPoint={setMidPoint}
          steepness={steepness}
          setSteepness={setSteepness}
          askPrices={askPrices}
          bidPrices={bidPrices}
          chartData={chartDataObj}
          screenWidth={screenWidth}
          handleSetCurve={handleSetCurve}
        />

        {/* --- 4) Buy/Sell (Swap) --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Swap (Buy/Sell)</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.swapBtn, swapType === 'buy' && styles.swapBtnActive]}
              onPress={() => setSwapType('buy')}
            >
              <Text style={[styles.swapBtnText, swapType === 'buy' && styles.swapBtnTextActive]}>
                Buy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.swapBtn, swapType === 'sell' && styles.swapBtnActive]}
              onPress={() => setSwapType('sell')}
            >
              <Text style={[styles.swapBtnText, swapType === 'sell' && styles.swapBtnTextActive]}>
                Sell
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Swap Amount"
            value={swapAmount}
            onChangeText={setSwapAmount}
          />
          <TouchableOpacity style={styles.button} onPress={handleSwap}>
            <Text style={styles.buttonText}>Swap</Text>
          </TouchableOpacity>
        </View>

        {/* --- 5) Staking --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stake</Text>
          <TouchableOpacity style={styles.button} onPress={() => handleStake(50000)}>
            <Text style={styles.buttonText}>Stake 50,000 tokens</Text>
          </TouchableOpacity>
        </View>

        {/* --- 6) Vesting --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vesting</Text>
          <TextInput
            style={styles.input}
            placeholder="Vesting Amount"
            value={vestingAmount}
            onChangeText={setVestingAmount}
          />
          <TouchableOpacity style={styles.button} onPress={handleCreateVesting}>
            <Text style={styles.buttonText}>Create Vesting</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleReleaseVesting}>
            <Text style={styles.buttonText}>Release Vesting</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
