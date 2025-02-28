import React, {useState, useEffect} from 'react';
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

import Slider from '@react-native-community/slider';
import {Picker} from '@react-native-picker/picker';
import {SafeAreaView} from 'react-native-safe-area-context';

import {
  Transaction,
  Connection,
  PublicKey,
  clusterApiUrl,
} from '@solana/web3.js';
import {Buffer} from 'buffer';
global.Buffer = Buffer;

import {useAuth} from '../../hooks/useAuth';

import {LineChart} from 'react-native-chart-kit';
import BondingCurveCustomizer from '../../components/BondingCurveCustomizer';

const SERVER_URL = 'http://localhost:3000'; // or your real server address

type CurveType = 'linear' | 'power' | 'exponential' | 'logistic';

export default function TokenMillScreen() {
  //-------------------------------------------------------------------------------------
  // 1) AUTH CHECK
  //-------------------------------------------------------------------------------------
  const {solanaWallet} = useAuth();
  if (
    !solanaWallet ||
    !solanaWallet.wallets ||
    solanaWallet.wallets.length === 0
  ) {
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

  const [marketAddress, setMarketAddress] = useState('');
  const [baseTokenMint, setBaseTokenMint] = useState('');

  // Market creation form:
  const [tokenName, setTokenName] = useState('MyToken');
  const [tokenSymbol, setTokenSymbol] = useState('MTK');
  const [metadataUri, setMetadataUri] = useState('https://arweave.net/abc123');
  const [totalSupply, setTotalSupply] = useState('1000000');
  const [creatorFee, setCreatorFee] = useState('3300');
  const [stakingFee, setStakingFee] = useState('6200');

  // Vesting form:
  const [vestingAmount, setVestingAmount] = useState('200000');
  const [vestingPlanAddress, setVestingPlanAddress] = useState('');

  // Swap form:
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
  // 4) REBUILD ASK PRICES WHENEVER PARAMS CHANGE
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
        default:
          val = 0;
      }
      newAsks.push(Math.round(val));
    }
    setAskPrices(newAsks);
  }, [
    curveType,
    nPoints,
    minPrice,
    maxPrice,
    exponent,
    growthRate,
    midPoint,
    steepness,
  ]);

  // Recalculate bid prices as 2% lower than ask prices
  useEffect(() => {
    setBidPrices(askPrices.map(x => Math.floor(x * 0.98)));
  }, [askPrices]);

  //-------------------------------------------------------------------------------------
  // 5) signAndSendLegacyTx HELPER
  //-------------------------------------------------------------------------------------
  const signAndSendLegacyTx = async (base64Tx: string) => {
    const txBuffer = Buffer.from(base64Tx, 'base64');
    const legacyTx = Transaction.from(txBuffer);

    const provider =
      solanaWallet.getProvider && (await solanaWallet.getProvider());
    if (!provider || typeof provider.request !== 'function') {
      throw new Error('Wallet provider does not support request().');
    }
    const serializedMessage = legacyTx.serializeMessage();
    const base64Message = Buffer.from(serializedMessage).toString('base64');

    const signResult = await provider.request({
      method: 'signMessage',
      params: {message: base64Message},
    });
    if (!signResult || !signResult.signature) {
      throw new Error('No signature from wallet');
    }

    legacyTx.addSignature(
      new PublicKey(publicKey),
      Buffer.from(signResult.signature, 'base64'),
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
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || 'Market creation failed');
      }
      const txSig = await signAndSendLegacyTx(json.transaction);
      Alert.alert(
        'Market Created',
        `Market: ${json.marketAddress}\nTx: ${txSig}`,
      );
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
        headers: {'Content-Type': 'application/json'},
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
        throw new Error(data.error || 'Vesting creation failed');
      }
      const txSig = await signAndSendLegacyTx(data.data.transaction);
      setVestingPlanAddress(data.data.ephemeralVestingPubkey);
      Alert.alert(
        'Vesting Created',
        `VestingPlan: ${data.data.ephemeralVestingPubkey}\nTx: ${txSig}`,
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
          userPublicKey: publicKey, // who pays
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Release vesting failed');
      }
      // data.data => base64 transaction
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
        headers: {'Content-Type': 'application/json'},
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
      Alert.alert('Error', error.message);
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
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          market: marketAddress,
          userPublicKey: publicKey,
          askPrices, // from your state
          bidPrices, // from your state
        }),
      });
      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to build setMarketPrices transaction');
      }
  
      // sign & send
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

  const chartData = {
    labels: normalizedAskData.map((_, i) => i.toString()),
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
          <ActivityIndicator
            size="large"
            color="#2a2a2a"
            style={styles.loader}
          />
        )}

        {/* ----------------- Existing Market & Mint ----------------- */}
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
            placeholder="Enter Base Token Mint"
            value={vestingPlanAddress}
            onChangeText={setVestingPlanAddress}
          />
        </View>

        {/* ----------------- Market Creation ----------------- */}
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

        {/* ----------------- Stake ----------------- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stake</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleStake(50000)}>
            <Text style={styles.buttonText}>Stake 50,000 tokens</Text>
          </TouchableOpacity>
        </View>

        {/* ----------------- Vesting ----------------- */}
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

        {/* ----------------- Swap ----------------- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Swap</Text>
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

        {/* ----------------- Bonding Curve Section (in separate component) ----------------- */}
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
          chartData={chartData}
          screenWidth={screenWidth}
          handleSetCurve={handleSetCurve}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e9e9e9',
  },
  container: {
    padding: 16,
    alignItems: 'center',
  },
  header: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2a2a2a',
    marginBottom: 4,
    marginTop: 8,
  },
  subHeader: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  loader: {
    marginVertical: 16,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  section: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#2a2a2a',
  },
  input: {
    backgroundColor: '#fafafa',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 12,
    fontSize: 14,
  },
  picker: {
    width: '100%',
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 4,
  },
  button: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  swapBtn: {
    flex: 1,
    backgroundColor: '#eee',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  swapBtnActive: {
    backgroundColor: '#2a2a2a',
  },
  swapBtnText: {
    color: '#2a2a2a',
    fontWeight: '600',
  },
  swapBtnTextActive: {
    color: '#fff',
  },
  result: {
    marginTop: 8,
    fontSize: 14,
    color: '#2a2a2a',
    textAlign: 'center',
  },
});
