import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Transaction,
  Connection,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from '@solana/web3.js';
import * as spl from '@solana/spl-token';
import {createSyncNativeInstruction} from '@solana/spl-token';
import {Buffer} from 'buffer';
global.Buffer = Buffer;

import {useAuth} from '../../hooks/useAuth';
import {styles} from './styles'; // Reuse your existing styles file
import BondingCurveConfigurator from './BondingCurveConfigurator';
import { SERVER_URL } from '@env';

// Adjust this if running on a different server or port

export default function TokenMillScreen() {
  // 1) AUTH CHECK
  const {solanaWallet} = useAuth();
  if (!solanaWallet || !solanaWallet.wallets || solanaWallet.wallets.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Wallet not connected</Text>
      </SafeAreaView>
    );
  }

  // 2) BASIC STATE
  const publicKey = solanaWallet.wallets[0].publicKey;
  const connection = new Connection(clusterApiUrl('devnet'));

  // Addresses and data for forms
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

  // Vesting form
  const [vestingAmount, setVestingAmount] = useState('200000');

  // Swap form
  const [swapType, setSwapType] = useState<'buy' | 'sell'>('buy');
  const [swapAmount, setSwapAmount] = useState('1000000');

  // Bonding curve arrays
  const [askPrices, setAskPrices] = useState<number[]>([]);
  const [bidPrices, setBidPrices] = useState<number[]>([]);

  // UI loading spinner
  const [loading, setLoading] = useState(false);

  //-------------------------------------------------------------------------------------
  // signAndSendLegacyTx HELPER
  //-------------------------------------------------------------------------------------
  const signAndSendLegacyTx = async (base64Tx: string) => {
    // Convert base64 to a Transaction
    const txBuffer = Buffer.from(base64Tx, 'base64');
    const legacyTx = Transaction.from(txBuffer);

    // Get the wallet's provider
    const provider =
      solanaWallet.getProvider && (await solanaWallet.getProvider());
    if (!provider || typeof provider.request !== 'function') {
      throw new Error('Wallet provider does not support request().');
    }

    // Convert the Tx message to base64 for signMessage
    const serializedMessage = legacyTx.serializeMessage();
    const base64Message = Buffer.from(serializedMessage).toString('base64');

    // Prompt user to sign the message
    console.log('[signAndSendLegacyTx] Requesting signature from wallet...');
    const signResult = await provider.request({
      method: 'signMessage',
      params: {message: base64Message},
    });
    if (!signResult || !signResult.signature) {
      throw new Error('No signature from wallet');
    }
    console.log('[signAndSendLegacyTx] Wallet signature obtained.');

    // Attach signature to transaction
    legacyTx.addSignature(
      new PublicKey(publicKey),
      Buffer.from(signResult.signature, 'base64'),
    );

    console.log('[signAndSendLegacyTx] Sending raw transaction...');
    // Serialize & send
    const signedTx = legacyTx.serialize();
    const txSignature = await connection.sendRawTransaction(signedTx);

    console.log('[signAndSendLegacyTx] Confirming transaction:', txSignature);
    await connection.confirmTransaction(txSignature);
    console.log('[signAndSendLegacyTx] Transaction confirmed.');

    return txSignature;
  };

  //-------------------------------------------------------------------------------------
  // NEW: handleFundUser
  // Deposits some SOL from the user to their own wSOL account
  //-------------------------------------------------------------------------------------
  const handleFundUser = async (solAmount: number) => {
    try {
      setLoading(true);
      console.log('[handleFundUser] Creating user wSOL ATA if needed...');

      const wSolMint = new PublicKey(
        'So11111111111111111111111111111111111111112',
      );
      const userPubkey = new PublicKey(publicKey);
      const userQuoteAta = spl.getAssociatedTokenAddressSync(wSolMint, userPubkey);

      // Check if user ATA exists
      const ataInfo = await connection.getAccountInfo(userQuoteAta);
      const tx = new Transaction();

      if (!ataInfo) {
        console.log('[handleFundUser] Creating user wSOL ATA...');
        const createIx = spl.createAssociatedTokenAccountInstruction(
          userPubkey,
          userQuoteAta,
          userPubkey,
          wSolMint,
        );
        tx.add(createIx);
      }

      // Transfer some SOL to that wSOL ATA
      const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
      const transferIx = SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: userQuoteAta,
        lamports,
      });
      tx.add(transferIx);

      // Sync the wSOL account
      const syncIx = createSyncNativeInstruction(userQuoteAta);
      tx.add(syncIx);

      // Prepare to sign + send
      const {blockhash} = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = userPubkey;

      console.log('[handleFundUser] Serializing and sending...');
      const serializedTx = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const base64Tx = serializedTx.toString('base64');

      const sig = await signAndSendLegacyTx(base64Tx);
      console.log('[handleFundUser] Completed. TxSig:', sig);
      Alert.alert('User Funded wSOL', `Deposited ~${solAmount} SOL.\nTx: ${sig}`);
    } catch (error: any) {
      console.error('[handleFundUser] Error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  //-------------------------------------------------------------------------------------
  // 3) MARKET CREATION
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

      console.log('[handleCreateMarket] Sending request to /api/markets:', body);
      const response = await fetch(`${SERVER_URL}/api/markets`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
      const json = await response.json();

      if (!json.success) {
        console.error('[handleCreateMarket] Error from server:', json.error);
        throw new Error(json.error || 'Market creation failed');
      }

      console.log('[handleCreateMarket] Signing market creation transaction...');
      const txSig = await signAndSendLegacyTx(json.transaction);
      console.log('[handleCreateMarket] Transaction signature:', txSig);

      Alert.alert('Market Created', `Market: ${json.marketAddress}\nTx: ${txSig}`);
      setMarketAddress(json.marketAddress);
      setBaseTokenMint(json.baseTokenMint);
    } catch (error: any) {
      console.error('[handleCreateMarket] error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  //-------------------------------------------------------------------------------------
  // 4) STAKE
  //-------------------------------------------------------------------------------------
  const handleStake = async (amount: number) => {
    if (!marketAddress) {
      Alert.alert('Error', 'You must enter or create a market before staking.');
      return;
    }
    try {
      setLoading(true);
      console.log('[handleStake] Sending stake request...');
      const response = await fetch(`${SERVER_URL}/api/stake`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          marketAddress,
          amount,
          userPublicKey: publicKey,
        }),
      });
      const json = await response.json();
      if (!json.success) {
        console.error('[handleStake] Server error:', json.error);
        throw new Error(json.error || 'Stake failed');
      }

      console.log('[handleStake] Signing stake transaction...');
      const txSig = await signAndSendLegacyTx(json.data);
      console.log('[handleStake] Stake transaction signature:', txSig);

      Alert.alert('Staked Successfully', `Tx: ${txSig}`);
    } catch (error: any) {
      console.error('[handleStake] error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  //-------------------------------------------------------------------------------------
  // 5) CREATE VESTING
  //-------------------------------------------------------------------------------------
  const handleCreateVesting = async () => {
    if (!marketAddress || !baseTokenMint) {
      Alert.alert(
        'Error',
        'Enter or create a market and base token mint first.',
      );
      return;
    }

    try {
      setLoading(true);
      console.log('[handleCreateVesting] Sending vesting creation request...');
      const resp = await fetch(`${SERVER_URL}/api/vesting`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
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
        console.error('[handleCreateVesting] Server error:', data.error);
        throw new Error(data.error || 'Vesting creation failed');
      }

      console.log('[handleCreateVesting] Signing vesting creation transaction...');
      const txSig = await signAndSendLegacyTx(data.data.transaction);
      console.log('[handleCreateVesting] Transaction signature:', txSig);

      setVestingPlanAddress(data.data.ephemeralVestingPubkey);

      Alert.alert(
        'Vesting Created',
        `VestingPlan: ${data.data.ephemeralVestingPubkey}\nTx: ${txSig}`,
      );
    } catch (err: any) {
      console.error('[handleCreateVesting] error:', err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  //-------------------------------------------------------------------------------------
  // 6) RELEASE VESTING
  //-------------------------------------------------------------------------------------
  const handleReleaseVesting = async () => {
    if (!marketAddress || !vestingPlanAddress || !baseTokenMint) {
      Alert.alert(
        'Error',
        'Ensure you have a market, baseTokenMint, and vesting plan address.',
      );
      return;
    }

    try {
      setLoading(true);
      console.log('[handleReleaseVesting] Sending vesting release request...');
      const response = await fetch(`${SERVER_URL}/api/vesting/release`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          marketAddress,
          vestingPlanAddress,
          baseTokenMint,
          userPublicKey: publicKey,
        }),
      });
      const data = await response.json();

      if (!data.success) {
        console.error('[handleReleaseVesting] Server error:', data.error);
        throw new Error(data.error || 'Release vesting failed');
      }

      console.log('[handleReleaseVesting] Signing release vesting transaction...');
      const txSig = await signAndSendLegacyTx(data.data);
      console.log('[handleReleaseVesting] Transaction signature:', txSig);

      Alert.alert('Vesting Released', `Tx: ${txSig}`);
    } catch (error: any) {
      console.error('[handleReleaseVesting] Error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  //-------------------------------------------------------------------------------------
  // 7) SWAP (Buy/Sell)
  //-------------------------------------------------------------------------------------
  const handleSwap = async () => {
    if (!marketAddress) {
      Alert.alert('Error', 'Market address is required.');
      return;
    }
    try {
      setLoading(true);
      console.log('[handleSwap] Sending swap request...');
      const response = await fetch(`${SERVER_URL}/api/swap`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          market: marketAddress,
          quoteTokenMint: 'So11111111111111111111111111111111111111112', // wSOL
          action: swapType,
          tradeType: swapType === 'buy' ? 'exactOutput' : 'exactInput',
          amount: parseInt((parseFloat(swapAmount) * 1_000_000).toString(), 10),
          otherAmountThreshold: swapType === 'buy' ? 1000000000 : 0,
          userPublicKey: publicKey,
        }),
      });
      const data = await response.json();

      if (!data.success) {
        console.error('[handleSwap] Server error:', data.error);
        throw new Error(data.error || 'Swap failed');
      }

      console.log('[handleSwap] Signing swap transaction...');
      const txSig = await signAndSendLegacyTx(data.transaction);
      console.log('[handleSwap] Swap transaction signature:', txSig);

      Alert.alert('Swap Success', `Signature: ${txSig}`);
    } catch (error: any) {
      console.error('[handleSwap] error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  //-------------------------------------------------------------------------------------
  // 8) FUND MARKET QUOTE TOKEN ACCOUNT (Wrap SOL)
  //-------------------------------------------------------------------------------------
  const handleFundMarket = async () => {
    if (!marketAddress) {
      Alert.alert(
        'Error',
        'Market address is required to fund the quote token account.',
      );
      return;
    }
    try {
      setLoading(true);
      console.log('[handleFundMarket] Checking market ATA and creating if needed...');

      const marketPubkey = new PublicKey(marketAddress);
      const quoteTokenMint = new PublicKey('So11111111111111111111111111111111111111112');
      const marketQuoteTokenAta = spl.getAssociatedTokenAddressSync(
        quoteTokenMint,
        marketPubkey,
        true,
      );

      // Check if ATA exists. If not, create it.
      const ataInfo = await connection.getAccountInfo(marketQuoteTokenAta);
      const tx = new Transaction();

      if (!ataInfo) {
        console.log('[handleFundMarket] Market quote ATA does not exist. Creating...');
        const createATAIx = spl.createAssociatedTokenAccountInstruction(
          new PublicKey(publicKey),
          marketQuoteTokenAta,
          marketPubkey,
          quoteTokenMint,
        );
        tx.add(createATAIx);
      }

      // Example: deposit 0.1 SOL
      const lamportsToDeposit = Math.floor(0.1 * LAMPORTS_PER_SOL);

      // Transfer instruction
      const transferIx = SystemProgram.transfer({
        fromPubkey: new PublicKey(publicKey),
        toPubkey: marketQuoteTokenAta,
        lamports: lamportsToDeposit,
      });

      // Sync instruction
      const syncIx = createSyncNativeInstruction(marketQuoteTokenAta);

      tx.add(transferIx, syncIx);

      // Serialize and sign
      const {blockhash} = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = new PublicKey(publicKey);

      console.log('[handleFundMarket] Sending transaction to fund market wSOL...');
      const serializedTx = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const base64Tx = serializedTx.toString('base64');

      const txSignature = await signAndSendLegacyTx(base64Tx);
      console.log('[handleFundMarket] Market funded with wSOL. Tx:', txSignature);

      Alert.alert('Market Funded', `wSOL deposited.\nTx: ${txSignature}`);
    } catch (error: any) {
      console.error('[handleFundMarket] error:', error);
      Alert.alert('Error funding market', error.message);
    } finally {
      setLoading(false);
    }
  };

  //-------------------------------------------------------------------------------------
  // 9) SET BONDING CURVE
  //-------------------------------------------------------------------------------------
  const handleSetCurve = async () => {
    if (!marketAddress) {
      Alert.alert('No market', 'Please enter or create a market first!');
      return;
    }
    try {
      setLoading(true);

      console.log('[handleSetCurve] Preparing bonding curve set request...');
      console.log('    market:', marketAddress);
      console.log('    userPublicKey:', publicKey);
      console.log('    askPrices:', askPrices);
      console.log('    bidPrices:', bidPrices);

      const body = {
        market: marketAddress,
        userPublicKey: publicKey,
        askPrices,
        bidPrices,
      };

      const response = await fetch(`${SERVER_URL}/api/set-curve`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
      const json = await response.json();

      if (!json.success) {
        console.error('[handleSetCurve] Server error:', json.error);
        throw new Error(json.error || 'Set curve failed');
      }

      console.log('[handleSetCurve] Signing set-curve transaction...');
      const txSig = await signAndSendLegacyTx(json.transaction);
      console.log('[handleSetCurve] Bonding curve set. Tx:', txSig);

      Alert.alert('Curve Set', `Tx: ${txSig}`);
    } catch (err: any) {
      console.error('[handleSetCurve] error:', err);
      Alert.alert('Error setting curve', err.message);
    } finally {
      setLoading(false);
    }
  };

  //-------------------------------------------------------------------------------------
  // RENDER
  //-------------------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>TokenMill</Text>
        <Text style={styles.subHeader}>Your Pubkey: {publicKey}</Text>

        {loading && (
          <ActivityIndicator
            size="large"
            color="#2a2a2a"
            style={styles.loader}
          />
        )}

        {/* 1) Market Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fund User wSOL</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleFundUser(0.5)}>
            <Text style={styles.buttonText}>Fund User with 0.5 SOL - wSOL</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Existing Market (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Market Address"
            value={marketAddress}
            onChangeText={setMarketAddress}
          />
        </View>

        {/* 2) Base Token Mint */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Base Token Mint (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Base Token Mint"
            value={baseTokenMint}
            onChangeText={setBaseTokenMint}
          />
        </View>

        {/* 3) Vesting Plan Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Existing Vesting Plan Address (Optional)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Vesting Plan Address"
            value={vestingPlanAddress}
            onChangeText={setVestingPlanAddress}
          />
        </View>

        {/* 4) Market Creation */}
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

        {/* Fund Market Quote Token Account */}
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

        {/* BONDING CURVE CONFIGURATOR & SET CURVE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bonding Curve</Text>
          <BondingCurveConfigurator
            onCurveChange={(newAsk: number[], newBid: number[]) => {
              console.log(
                '[BondingCurveConfigurator] onCurveChange callback. ' +
                  `Ask/Bid lengths: ${newAsk.length}, ${newBid.length}`,
              );
              setAskPrices(newAsk);
              setBidPrices(newBid);
            }}
          />
          <TouchableOpacity style={styles.button} onPress={handleSetCurve}>
            <Text style={styles.buttonText}>Set Curve On-Chain</Text>
          </TouchableOpacity>
        </View>

        {/* 5) Swap (Buy/Sell) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Swap (Buy/Sell)</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.swapBtn,
                swapType === 'buy' && styles.swapBtnActive,
              ]}
              onPress={() => setSwapType('buy')}>
              <Text
                style={[
                  styles.swapBtnText,
                  swapType === 'buy' && styles.swapBtnTextActive,
                ]}>
                Buy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.swapBtn,
                swapType === 'sell' && styles.swapBtnActive,
              ]}
              onPress={() => setSwapType('sell')}>
              <Text
                style={[
                  styles.swapBtnText,
                  swapType === 'sell' && styles.swapBtnTextActive,
                ]}>
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

        {/* 6) Staking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stake</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleStake(50000)}>
            <Text style={styles.buttonText}>Stake 50,000 tokens</Text>
          </TouchableOpacity>
        </View>

        {/* 7) Vesting */}
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
          <TouchableOpacity
            style={styles.button}
            onPress={handleReleaseVesting}>
            <Text style={styles.buttonText}>Release Vesting</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* NEW: Fund the user's own wSOL account */}
    </SafeAreaView>
  );
}
