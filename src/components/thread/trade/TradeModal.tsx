import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Image,
  Clipboard,
  FlatList,
} from 'react-native';
import {
  Transaction,
  VersionedTransaction,
  Connection,
  clusterApiUrl,
  Cluster,
  PublicKey,
} from '@solana/web3.js';
import {TENSOR_API_KEY, HELIUS_RPC_URL, CLUSTER} from '@env';
import {
  ThreadPost,
  ThreadSection,
  ThreadUser,
  TradeData,
} from '../thread.types';
import SelectTokenModal, {TokenInfo} from './SelectTokenModal';
import {ENDPOINTS} from '../../../config/constants';
import {useAppDispatch} from '../../../hooks/useReduxHooks';
import {useAuth} from '../../../hooks/useAuth';
import {useWallet} from '../../../hooks/useWallet';
import {
  addPostLocally,
  createRootPostAsync,
} from '../../../state/thread/reducer';
import styles from './tradeModal.style';
import PastSwapItem from './PastSwapItem';
import { SwapTransaction, fetchRecentSwaps, enrichSwapTransactions } from '../../../services/swapTransactions';
import { FontAwesome5 } from '@expo/vector-icons';

/**
 * Available tab options in the TradeModal
 * @type {'TRADE_AND_SHARE' | 'PAST_SWAPS'}
 */
type TabOption = 'TRADE_AND_SHARE' | 'PAST_SWAPS';

interface TradeModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback fired when the modal is closed */
  onClose: () => void;
  /** Current user information */
  currentUser: ThreadUser;
  /** Callback fired when a trade post is created */
  onPostCreated?: () => void;
  /** Initial input token for the trade */
  initialInputToken?: TokenInfo;
  /** Initial output token for the trade */
  initialOutputToken?: TokenInfo;
  /** Whether to disable tab switching */
  disableTabs?: boolean;
}

/**
 * A modal component for executing token trades and sharing them on the feed.
 *
 * It handles three main flows:
 * 1. Swap & Share (posts a trade summary on success)
 * 2. Pick an existing Tx signature & share it
 * 3. Select from past swaps & share them
 *
 * UI inspired by Jupiter with a clean, modern aesthetic.
 */
export default function TradeModal({
  visible,
  onClose,
  currentUser,
  onPostCreated,
  initialInputToken,
  initialOutputToken,
  disableTabs,
}: TradeModalProps) {
  const dispatch = useAppDispatch();
  // Use our wallet hook
  const { publicKey: userPublicKey, connected, sendTransaction } = useWallet();

  const [selectedTab, setSelectedTab] = useState<TabOption>('PAST_SWAPS');

  const [inputToken, setInputToken] = useState<TokenInfo>(
    initialInputToken ?? {
      address: 'So11111111111111111111111111111111111111112', // wSOL
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
    },
  );
  const [outputToken, setOutputToken] = useState<TokenInfo>(
    initialOutputToken ?? {
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI:
        'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    },
  );

  const [selectingWhichSide, setSelectingWhichSide] = useState<
    'input' | 'output'
  >('input');
  const [showSelectTokenModal, setShowSelectTokenModal] = useState(false);

  const [solAmount, setSolAmount] = useState('0.01');
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [solscanTxSig, setSolscanTxSig] = useState('');

  // State to handle "Share your trade?" prompt
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  // Store lamports for creating the post
  const [pendingBuyInputLamports, setPendingBuyInputLamports] =
    useState<number>(0);
  const [pendingBuyOutputLamports, setPendingBuyOutputLamports] =
    useState<number>(0);
    
  // State for selected past swap
  const [selectedPastSwap, setSelectedPastSwap] = useState<SwapTransaction | null>(null);

  // State for past swaps
  const [swaps, setSwaps] = useState<SwapTransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Ref to prevent multiple refreshes
  const isRefreshingRef = useRef(false);
  const hasLoadedInitialDataRef = useRef(false);

  /**
   * Resets states and closes the entire modal
   */
  const handleClose = useCallback(() => {
    setSelectedTab('PAST_SWAPS');
    setResultMsg('');
    setErrorMsg('');
    setSolscanTxSig('');
    setShowSharePrompt(false);
    setSelectedPastSwap(null);
    setSwaps([]);
    setInitialLoading(true);
    hasLoadedInitialDataRef.current = false;
    onClose();
  }, [onClose]);

  /**
   * Converts a decimal amount to base units (e.g., SOL -> lamports)
   */
  function toBaseUnits(amount: string, decimals: number): number {
    const val = parseFloat(amount);
    if (isNaN(val)) return 0;
    return val * Math.pow(10, decimals);
  }

  /**
   * This method triggers a Jupiter swap, returning a transaction that we sign & send.
   * On success, we ask user if they want to share the trade on the feed.
   */
  const handleTradeAndShare = useCallback(async () => {
    if (!connected || !userPublicKey) {
      Alert.alert('Wallet not connected', 'Please connect your wallet first.');
      return;
    }
    if (isNaN(parseFloat(solAmount)) || parseFloat(solAmount) <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount to swap.');
      return;
    }
    setLoading(true);
    setResultMsg('');
    setErrorMsg('');

    try {
      const inputLamports = Number(toBaseUnits(solAmount, inputToken.decimals));

      // 1) Get quote from Jupiter
      console.log('Getting Jupiter quote...');
      const quoteUrl = `${ENDPOINTS.jupiter.quote}?inputMint=${
        inputToken.address
      }&outputMint=${outputToken.address}&amount=${Math.round(
        inputLamports,
      )}&slippageBps=50&swapMode=ExactIn`;
      const quoteResp = await fetch(quoteUrl);
      if (!quoteResp.ok) {
        throw new Error(`Jupiter quote failed: ${quoteResp.status}`);
      }
      const quoteData = await quoteResp.json();
      console.log('Jupiter quote received');
      
      let firstRoute;
      if (
        quoteData.data &&
        Array.isArray(quoteData.data) &&
        quoteData.data.length > 0
      ) {
        firstRoute = quoteData.data[0];
      } else if (
        quoteData.routePlan &&
        Array.isArray(quoteData.routePlan) &&
        quoteData.routePlan.length > 0
      ) {
        firstRoute = quoteData;
      } else {
        throw new Error('No routes returned by Jupiter.');
      }

      const outLamports = parseFloat(firstRoute.outAmount) || 0;

      // 2) Build swap Tx from server
      console.log('Building swap transaction from server...');
      const body = {
        quoteResponse: quoteData,
        userPublicKey: userPublicKey.toString(),
      };
      const swapResp = await fetch(ENDPOINTS.jupiter.swap, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
      const swapData = await swapResp.json();
      if (!swapResp.ok || !swapData.swapTransaction) {
        throw new Error(
          swapData.error || 'Failed to get Jupiter swapTransaction.',
        );
      }
      console.log('Swap transaction received from server');

      const {swapTransaction} = swapData;
      const txBuffer = Buffer.from(swapTransaction, 'base64');
      let transaction: Transaction | VersionedTransaction;
      try {
        transaction = VersionedTransaction.deserialize(txBuffer);
        console.log('Deserialized as VersionedTransaction');
      } catch {
        transaction = Transaction.from(txBuffer);
        console.log('Deserialized as legacy Transaction');
        
        // Ensure feePayer is set for legacy transactions
        if (!transaction.feePayer) {
          transaction.feePayer = new PublicKey(userPublicKey.toString());
          console.log('Set feePayer on legacy transaction');
        }
      }

      const rpcUrl = ENDPOINTS.helius || clusterApiUrl(CLUSTER as Cluster);
      console.log('Using RPC URL:', rpcUrl);
      const connection = new Connection(rpcUrl, 'confirmed');
      
      // Use wallet hook to send the transaction
      console.log('Sending transaction...');
      try {
        const signature = await sendTransaction(
          transaction,
          connection,
          { 
            statusCallback: (status) => console.log(`[JupiterSwap] ${status}`),
            confirmTransaction: true
          }
        );

        console.log('Transaction successfully sent with signature:', signature);
        setResultMsg(`Swap successful! Tx: ${signature}`);

        // Show the share prompt modal
        setPendingBuyInputLamports(inputLamports);
        setPendingBuyOutputLamports(outLamports);
        setShowSharePrompt(true);
      } catch (txError: any) {
        console.error('Transaction sending error:', txError);
        
        // Extract useful error information
        let errorMessage = txError.message || 'Unknown transaction error';
        if (txError.logs) {
          console.error('Transaction logs:', txError.logs);
          errorMessage += '\n\nTransaction logs: ' + txError.logs.slice(0, 2).join('\n');
        }
        
        throw new Error('Transaction failed: ' + errorMessage);
      }
    } catch (err: any) {
      console.error('Trade error:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    connected,
    userPublicKey,
    solAmount,
    inputToken,
    outputToken,
    sendTransaction,
    setPendingBuyInputLamports,
    setPendingBuyOutputLamports,
  ]);

  /**
   * Create the post in Redux after a successful swap
   */
  const shareTradeInFeed = useCallback(
    async (inputLamports: number, outputLamports: number, inputTokenInfo: TokenInfo, outputTokenInfo: TokenInfo) => {
      try {
        // Prepare post content
        const localId = 'local-' + Math.random().toString(36).substr(2, 9);

        // Build some placeholders for "display name" & USD values
        // (In a real scenario, you'd fetch up-to-date token prices.)
        const localInputQty = inputLamports / Math.pow(10, inputTokenInfo.decimals);
        const localOutputQty =
          outputLamports / Math.pow(10, outputTokenInfo.decimals);

        const tradeData: TradeData = {
          inputMint: inputTokenInfo.address,
          outputMint: outputTokenInfo.address,
          aggregator: 'Jupiter',
          inputSymbol: inputTokenInfo.symbol,
          inputQuantity: localInputQty.toFixed(4),
          inputUsdValue: '$??',
          outputSymbol: outputTokenInfo.symbol,
          outputQuantity: localOutputQty.toFixed(4),
          outputUsdValue: '$??',
        };

        const postSections: ThreadSection[] = [
          {
            id: 'swap-post-' + Math.random().toString(36).substr(2, 9),
            type: 'TEXT_TRADE',
            tradeData,
            text: `I just executed a trade: ${localInputQty.toFixed(4)} ${
              inputTokenInfo.symbol
            } → ${outputTokenInfo.symbol}!`,
          },
        ];

        // local post
        const newLocalPost: ThreadPost = {
          id: localId,
          user: currentUser,
          sections: postSections,
          createdAt: new Date().toISOString(),
          parentId: undefined,
          replies: [],
          reactionCount: 0,
          retweetCount: 0,
          quoteCount: 0,
        };

        // Insert a local placeholder post
        dispatch(addPostLocally(newLocalPost));

        // Then do server post
        await dispatch(
          createRootPostAsync({
            userId: currentUser.id,
            sections: postSections,
            localId,
          }),
        ).unwrap();

        setResultMsg('Trade post created successfully!');
        onPostCreated && onPostCreated();
      } catch (err: any) {
        console.error('[shareTradeInFeed] Error =>', err);
        setErrorMsg(err.message || 'Failed to create trade post');
      }
    },
    [dispatch, currentUser, onPostCreated],
  );

  /**
   * Create post from a past swap transaction
   */
  const sharePastSwapInFeed = useCallback(
    async (swap: SwapTransaction) => {
      try {
        // Format amounts properly
        const inputQty = swap.inputToken.amount / Math.pow(10, swap.inputToken.decimals);
        const outputQty = swap.outputToken.amount / Math.pow(10, swap.outputToken.decimals);

        // Create trade data object
        const tradeData: TradeData = {
          inputMint: swap.inputToken.mint,
          outputMint: swap.outputToken.mint,
          aggregator: 'Jupiter',
          inputSymbol: swap.inputToken.symbol || 'Unknown',
          inputQuantity: inputQty.toFixed(4),
          inputUsdValue: '$??',
          outputSymbol: swap.outputToken.symbol || 'Unknown',
          inputAmountLamports: swap.inputToken.amount.toString(),
          outputAmountLamports: swap.outputToken.amount.toString(),
          outputQuantity: outputQty.toFixed(4),
          outputUsdValue: '$??',
          executionTimestamp: swap.timestamp,
        };

        // Generate a post with the trade data
        const localId = 'local-' + Math.random().toString(36).substr(2, 9);
        const postSections: ThreadSection[] = [
          {
            id: 'swap-post-' + Math.random().toString(36).substr(2, 9),
            type: 'TEXT_TRADE',
            tradeData,
            text: `I executed a trade: ${inputQty.toFixed(4)} ${
              swap.inputToken.symbol || 'tokens'
            } → ${outputQty.toFixed(4)} ${swap.outputToken.symbol || 'tokens'}!`,
          },
        ];

        // Create local post
        const newLocalPost: ThreadPost = {
          id: localId,
          user: currentUser,
          sections: postSections,
          createdAt: new Date().toISOString(),
          parentId: undefined,
          replies: [],
          reactionCount: 0,
          retweetCount: 0,
          quoteCount: 0,
        };

        // Insert locally and then dispatch to server
        dispatch(addPostLocally(newLocalPost));
        await dispatch(
          createRootPostAsync({
            userId: currentUser.id,
            sections: postSections,
            localId,
          }),
        ).unwrap();

        setResultMsg('Past swap shared successfully!');
        onPostCreated && onPostCreated();
        
        // Close the modal after successful share
        setTimeout(() => handleClose(), 1500);
      } catch (err: any) {
        console.error('[sharePastSwapInFeed] Error =>', err);
        setErrorMsg(err.message || 'Failed to share past swap');
      }
    },
    [dispatch, currentUser, onPostCreated, handleClose],
  );

  /**
   * Allow user to paste from clipboard
   */
  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getString();
      if (text) {
        setSolscanTxSig(text.trim());
      }
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
    }
  };

  /**
   * Share a transaction by its signature
   */
  const handlePickTxAndShare = useCallback(async () => {
    if (!solscanTxSig.trim()) {
      Alert.alert(
        'No transaction signature',
        'Please enter a valid signature.',
      );
      return;
    }
    setLoading(true);
    setResultMsg('');
    setErrorMsg('');

    try {
      const solscanLink = `https://solscan.io/tx/${solscanTxSig}?cluster=mainnet`;
      const postSections: ThreadSection[] = [
        {
          id: 'solscan-' + Math.random().toString(36).substr(2, 9),
          type: 'TEXT_ONLY',
          text: `Check out this interesting transaction: ${solscanLink}`,
        },
      ];

      await dispatch(
        createRootPostAsync({
          userId: currentUser.id,
          sections: postSections,
        }),
      ).unwrap();

      setResultMsg('Post created referencing your transaction!');
      onPostCreated && onPostCreated();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [dispatch, solscanTxSig, currentUser, onPostCreated]);

  /**
   * Handle selection of a past swap from the PastSwapsTab
   */
  const handlePastSwapSelected = useCallback((swap: SwapTransaction) => {
    setSelectedPastSwap(swap);
  }, []);

  /**
   * Handle refresh for past swaps
   */
  const handleRefresh = useCallback(async () => {
    // Prevent concurrent refreshes
    if (!userPublicKey || isRefreshingRef.current) return;
    
    isRefreshingRef.current = true;
    
    if (!initialLoading) {
      setRefreshing(true);
    }
    
    try {
      // Fetch raw swap transactions
      const rawSwaps = await fetchRecentSwaps(userPublicKey.toString());
      if (rawSwaps.length === 0) {
        setSwaps([]);
        return;
      }
      
      // Enrich with token metadata
      const enrichedSwaps = await enrichSwapTransactions(rawSwaps);
      setSwaps(enrichedSwaps);
      
      // If no swap is selected yet and we have swaps, select the first one
      if (!selectedPastSwap && enrichedSwaps.length > 0) {
        setSelectedPastSwap(enrichedSwaps[0]);
      }
    } catch (err: any) {
      console.error('Error fetching past swaps:', err);
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
      isRefreshingRef.current = false;
      hasLoadedInitialDataRef.current = true;
    }
  }, [userPublicKey, selectedPastSwap]);

  // Fetch past swaps when modal becomes visible - only once
  useEffect(() => {
    if (visible && userPublicKey && !hasLoadedInitialDataRef.current) {
      setInitialLoading(true);
      handleRefresh();
    }
  }, [visible, userPublicKey, handleRefresh]);

  /**
   * Share the selected past swap
   */
  const handleSharePastSwap = useCallback(() => {
    if (!selectedPastSwap) {
      Alert.alert('No swap selected', 'Please select a swap to share.');
      return;
    }
    
    setLoading(true);
    
    sharePastSwapInFeed(selectedPastSwap)
      .finally(() => setLoading(false));
  }, [selectedPastSwap, sharePastSwapInFeed]);

  /**
   * Render the content of the selected tab
   */
  const renderTabContent = () => {
    if (selectedTab === 'PAST_SWAPS') {
      // PAST_SWAPS tab (History)
      return (
        <View style={styles.pastSwapsContainer}>
          {userPublicKey ? (
            <>
              <View style={styles.pastSwapsContent}>
                <View style={styles.pastSwapsHeader}>
                  <Text style={styles.pastSwapsHeaderText}>
                    Recent Swaps
                  </Text>
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={handleRefresh}
                    disabled={refreshing || initialLoading}
                  >
                    <FontAwesome5
                      name="sync"
                      size={14}
                      color="#4B5563"
                      style={(refreshing || initialLoading) ? {transform: [{rotate: '45deg'}]} : undefined}
                    />
                  </TouchableOpacity>
                </View>
                
                {initialLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3871DD" />
                    <Text style={styles.loadingText}>
                      Loading your transaction history...
                    </Text>
                  </View>
                ) : refreshing ? (
                  <View style={styles.refreshingOverlay}>
                    <ActivityIndicator size="small" color="#3871DD" />
                  </View>
                ) : swaps.length === 0 ? (
                  <View style={styles.emptySwapsList}>
                    <View style={styles.emptySwapsIcon}>
                      <FontAwesome5 name="exchange-alt" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.emptySwapsText}>No Swap History</Text>
                    <Text style={styles.emptySwapsSubtext}>
                      Complete a token swap to see it here
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={swaps}
                    renderItem={({item}) => (
                      <View style={styles.swapItemContainer}>
                        <PastSwapItem
                          swap={item}
                          onSelect={handlePastSwapSelected}
                          selected={selectedPastSwap?.signature === item.signature}
                        />
                      </View>
                    )}
                    keyExtractor={item => item.signature}
                    contentContainerStyle={styles.swapsList}
                    showsVerticalScrollIndicator={true}
                    initialNumToRender={5}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                  />
                )}
              </View>
              
              {selectedPastSwap && !loading && !initialLoading && (
                <TouchableOpacity
                  style={styles.swapButton}
                  onPress={handleSharePastSwap}>
                  <Text style={styles.swapButtonText}>
                    Share Selected Swap
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.walletNotConnected}>
              <View style={styles.connectWalletIcon}>
                <FontAwesome5 name="wallet" size={20} color="#9CA3AF" />
              </View>
              <Text style={styles.walletNotConnectedText}>
                Please connect your wallet to view your past swaps
              </Text>
            </View>
          )}
          
          {loading && selectedPastSwap && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#3871DD" />
              <Text style={styles.loadingText}>Sharing selected swap...</Text>
            </View>
          )}
        </View>
      );
    } else {
      // TRADE_AND_SHARE tab (Swap)
      return (
        <ScrollView
          style={styles.fullWidthScroll}
          keyboardShouldPersistTaps="handled">
          {/* Token Selection Area */}
          <View style={styles.tokenRow}>
            <View style={styles.tokenColumn}>
              <Text style={styles.inputLabel}>From</Text>
              <TouchableOpacity
                style={styles.tokenSelector}
                onPress={() => {
                  setSelectingWhichSide('input');
                  setShowSelectTokenModal(true);
                }}>
                <View style={styles.tokenSelectorInner}>
                  {inputToken.logoURI && (
                    <Image
                      source={{uri: inputToken.logoURI}}
                      style={styles.tokenIcon}
                      resizeMode="contain"
                    />
                  )}
                  <Text style={styles.tokenSelectorText}>
                    {inputToken.symbol}
                  </Text>
                </View>
                <FontAwesome5 name="chevron-down" size={12} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.arrowContainer}>
              <FontAwesome5 name="arrow-right" size={12} color="#3871DD" />
            </View>

            <View style={styles.tokenColumn}>
              <Text style={styles.inputLabel}>To</Text>
              <TouchableOpacity
                style={styles.tokenSelector}
                onPress={() => {
                  setSelectingWhichSide('output');
                  setShowSelectTokenModal(true);
                }}>
                <View style={styles.tokenSelectorInner}>
                  {outputToken.logoURI && (
                    <Image
                      source={{uri: outputToken.logoURI}}
                      style={styles.tokenIcon}
                      resizeMode="contain"
                    />
                  )}
                  <Text style={styles.tokenSelectorText}>
                    {outputToken.symbol}
                  </Text>
                </View>
                <FontAwesome5 name="chevron-down" size={12} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount Input Area */}
          <View style={styles.amountInputContainer}>
            <Text style={styles.inputLabel}>Amount ({inputToken.symbol})</Text>
            <View style={styles.amountInputRow}>
              <TextInput
                style={styles.amountInput}
                value={solAmount}
                onChangeText={setSolAmount}
                keyboardType="decimal-pad"
                placeholder={`0.0`}
              />
              <TouchableOpacity
                style={styles.maxButton}
                onPress={() => {
                  // In a real app, this would fetch and set max balance
                  setSolAmount('1.0');
                }}>
                <Text style={styles.maxButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.amountUsdValue}>~ $??</Text>
          </View>

          {loading ? (
            <View style={{alignItems: 'center', marginVertical: 24}}>
              <ActivityIndicator size="large" color="#3871DD" />
              <Text style={{marginTop: 12, color: '#4B5563'}}>
                Preparing your swap...
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.swapButton}
              onPress={handleTradeAndShare}>
              <Text style={styles.swapButtonText}>Swap & Share</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      {/* Container for the entire screen */}
      <View style={styles.flexFill}>
        {/* Dark overlay that closes the modal when tapped */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.darkOverlay} />
        </TouchableWithoutFeedback>

        {/* Centered wrapper for the modal content */}
        <View style={styles.centeredWrapper}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContentContainer}>
            <TouchableWithoutFeedback>
              <View>
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>Token Swap</Text>
                  <TouchableOpacity
                    style={styles.headerClose}
                    onPress={handleClose}>
                    <Text style={styles.headerCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {!disableTabs && (
                  <View style={styles.tabRow}>
                    <TouchableOpacity
                      style={[
                        styles.tabButton,
                        selectedTab === 'PAST_SWAPS' &&
                          styles.tabButtonActive,
                      ]}
                      onPress={() => setSelectedTab('PAST_SWAPS')}>
                      <Text
                        style={[
                          styles.tabButtonText,
                          selectedTab === 'PAST_SWAPS' &&
                            styles.tabButtonTextActive,
                        ]}>
                        History
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.tabButton,
                        selectedTab === 'TRADE_AND_SHARE' &&
                          styles.tabButtonActive,
                      ]}
                      onPress={() => setSelectedTab('TRADE_AND_SHARE')}>
                      <Text
                        style={[
                          styles.tabButtonText,
                          selectedTab === 'TRADE_AND_SHARE' &&
                            styles.tabButtonTextActive,
                        ]}>
                        Swap
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {renderTabContent()}

                {!!resultMsg && (
                  <Text style={styles.resultText}>{resultMsg}</Text>
                )}
                {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

                {/* Token selection modal */}
                <SelectTokenModal
                  visible={showSelectTokenModal}
                  onClose={() => setShowSelectTokenModal(false)}
                  onTokenSelected={token => {
                    if (selectingWhichSide === 'input') {
                      setInputToken(token);
                    } else {
                      setOutputToken(token);
                    }
                    setShowSelectTokenModal(false);
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </View>

      {/**
       * "Share your trade?" confirmation modal
       */}
      <Modal
        visible={showSharePrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSharePrompt(false)}>
        <TouchableWithoutFeedback onPress={() => setShowSharePrompt(false)}>
          <View style={styles.sharePromptBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.sharePromptContainer}>
          <View style={styles.sharePromptBox}>
            <Text style={styles.sharePromptTitle}>Share Your Trade?</Text>
            <Text style={styles.sharePromptDescription}>
              Your swap was successful! Would you like to create a post about
              it?
            </Text>
            <View style={styles.sharePromptButtonRow}>
              <TouchableOpacity
                style={[styles.sharePromptBtn, styles.sharePromptBtnCancel]}
                onPress={() => setShowSharePrompt(false)}>
                <Text style={styles.sharePromptBtnText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sharePromptBtn, styles.sharePromptBtnConfirm]}
                onPress={() => {
                  setShowSharePrompt(false);
                  // Actually share in feed
                  shareTradeInFeed(
                    pendingBuyInputLamports,
                    pendingBuyOutputLamports,
                    inputToken,
                    outputToken,
                  );
                }}>
                <Text style={[styles.sharePromptBtnText, styles.sharePromptConfirmText]}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
