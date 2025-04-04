import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
import { PublicKey, Connection, clusterApiUrl, Cluster } from '@solana/web3.js';
import {
  ThreadUser,
  TradeData,
  ThreadSection,
  ThreadSectionType,
  ThreadPost
} from '../thread.types';
import SelectTokenModal from './SelectTokenModal';
import { ENDPOINTS } from '../../../../config/constants';
import { CLUSTER } from '@env';
import { useAppDispatch } from '../../../../hooks/useReduxHooks';
import { useWallet } from '../../../../modules/embeddedWalletProviders/hooks/useWallet';
import {
  addPostLocally,
  createRootPostAsync,
} from '../../../../state/thread/reducer';
import styles from './tradeModal.style';
import PastSwapItem from './PastSwapItem';
import { SwapTransaction, fetchRecentSwaps, enrichSwapTransactions } from '../../../../services/swapTransactions';
import { FontAwesome5 } from '@expo/vector-icons';
import { TransactionService } from '../../../../modules/embeddedWalletProviders/services/transaction/transactionService';
import { TokenInfo, TokenService } from '../../../../services/token/tokenService';
import { TradeService } from '../../../../services/trade/tradeService';

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
  initialInputToken?: Partial<TokenInfo>;
  /** Initial output token for the trade */
  initialOutputToken?: Partial<TokenInfo>;
  /** Whether to disable tab switching */
  disableTabs?: boolean;
  /** Initial active tab to show */
  initialActiveTab?: TabOption;
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
  initialActiveTab,
}: TradeModalProps) {
  const dispatch = useAppDispatch();
  // Use our wallet hook
  const { publicKey: userPublicKey, connected, sendTransaction } = useWallet();
  const [selectedTab, setSelectedTab] = useState<TabOption>(() =>
    initialActiveTab ?? 'PAST_SWAPS'
  );

  // Initialize tokens with pending flag until we have complete data
  const [inputToken, setInputToken] = useState<TokenInfo>(TokenService.DEFAULT_SOL_TOKEN);
  const [outputToken, setOutputToken] = useState<TokenInfo>(TokenService.DEFAULT_USDC_TOKEN);

  // Track token initialization status
  const [tokensInitialized, setTokensInitialized] = useState(false);

  const [selectingWhichSide, setSelectingWhichSide] = useState<
    'input' | 'output'
  >('input');
  const [showSelectTokenModal, setShowSelectTokenModal] = useState(false);

  const [solAmount, setSolAmount] = useState('0');
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [solscanTxSig, setSolscanTxSig] = useState('');
  const [currentTokenPrice, setCurrentTokenPrice] = useState<number | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);

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

  // Keep track of whether the component is mounted
  const isMounted = useRef(true);

  // Track pending token operations
  const pendingTokenOps = useRef<{ input: boolean, output: boolean }>({ input: false, output: false });

  // Create a memo-ized user wallet address string for dependencies
  const walletAddress = useMemo(() =>
    userPublicKey ? userPublicKey.toString() : null,
    [userPublicKey]
  );

  /**
   * Setup cleanup and initialization
   */
  useEffect(() => {
    // Set mounted flag
    isMounted.current = true;

    // Return cleanup function
    return () => {
      console.log('[TradeModal] Component unmounting, cleaning up');
      isMounted.current = false;

      // Clear any pending timeouts
      pendingTokenOps.current = { input: false, output: false };
    };
  }, []);

  /**
   * Fetches the user's balance for the current input token
   */
  const fetchTokenBalance = useCallback(async (tokenToUse?: TokenInfo) => {
    if (!connected || !userPublicKey) {
      console.log("[TradeModal] No wallet connected, cannot fetch balance");
      return null;
    }

    const tokenForBalance = tokenToUse || inputToken;

    try {
      console.log(`[TradeModal] Fetching balance for ${tokenForBalance.symbol}...`);
      const balance = await TokenService.fetchTokenBalance(userPublicKey, tokenForBalance);

      // Only update state if component is still mounted and balance is non-null
      if (isMounted.current) {
        console.log(`[TradeModal] Token balance fetched for ${tokenForBalance.symbol}: ${balance}`);

        // Even if balance is 0, we'll set it (instead of null) to indicate we've successfully fetched
        setCurrentBalance(balance);
        return balance;
      }
    } catch (err) {
      console.error('[TradeModal] Error fetching balance:', err);
      if (isMounted.current) {
        setCurrentBalance(0);
        setErrorMsg(`Failed to fetch ${tokenForBalance.symbol} balance`);
        setTimeout(() => isMounted.current && setErrorMsg(''), 3000);
      }
    }
    return null;
  }, [connected, userPublicKey, inputToken]);

  /**
   * Fetches current price of the input token
   */
  const fetchTokenPrice = useCallback(async (tokenToUse?: TokenInfo) => {
    const tokenForPrice = tokenToUse || inputToken;

    try {
      console.log(`[TradeModal] Fetching price for ${tokenForPrice.symbol}...`);
      const price = await TokenService.fetchTokenPrice(tokenForPrice);
      if (isMounted.current) {
        console.log(`[TradeModal] Token price fetched for ${tokenForPrice.symbol}: ${price}`);
        setCurrentTokenPrice(price);
        return price;
      }
    } catch (err) {
      console.error('Error fetching token price:', err);
      if (isMounted.current) {
        setCurrentTokenPrice(null);
      }
    }
    return null;
  }, [inputToken]);

  /**
   * Complete token initialization by fetching complete metadata
   */
  const initializeTokens = useCallback(async () => {
    // Don't initialize if already initializing or completed
    if (!isMounted.current || (pendingTokenOps.current.input && pendingTokenOps.current.output)) {
      return;
    }

    try {
      // Initialize input token
      let completeInputToken: TokenInfo;
      let completeOutputToken: TokenInfo;

      // Mark operations as pending
      pendingTokenOps.current = { input: true, output: true };

      console.log('[TradeModal] Initializing tokens...');

      // If initialInputToken is provided, ensure it's a complete TokenInfo
      if (initialInputToken?.address) {
        completeInputToken = await TokenService.ensureCompleteTokenInfo(initialInputToken);
        console.log('[TradeModal] Initialized input token:', completeInputToken.symbol);
      } else {
        // Default to SOL
        completeInputToken = TokenService.DEFAULT_SOL_TOKEN;
      }

      // Initialize output token
      if (initialOutputToken?.address) {
        completeOutputToken = await TokenService.ensureCompleteTokenInfo(initialOutputToken);
        console.log('[TradeModal] Initialized output token:', completeOutputToken.symbol);
      } else {
        // Default to USDC
        completeOutputToken = TokenService.DEFAULT_USDC_TOKEN;
      }

      if (isMounted.current) {
        // Batch state updates to reduce rerenders
        const tokensChanged =
          completeInputToken.address !== inputToken.address ||
          completeOutputToken.address !== outputToken.address;

        setInputToken(completeInputToken);
        setOutputToken(completeOutputToken);
        pendingTokenOps.current = { input: false, output: false };
        setTokensInitialized(true);

        // Only fetch balance if tokens actually changed or we don't have a balance yet
        if (tokensChanged || currentBalance === null) {
          console.log('[TradeModal] Tokens changed or no balance, fetching balance and price');
          fetchTokenBalance(completeInputToken).then(() => {
            if (isMounted.current) {
              fetchTokenPrice(completeInputToken);
            }
          });
        }
      }
    } catch (error) {
      console.error('[TradeModal] Error initializing tokens:', error);
      pendingTokenOps.current = { input: false, output: false };
    }
  }, [
    initialInputToken,
    initialOutputToken,
    fetchTokenBalance,
    fetchTokenPrice,
    inputToken.address,
    outputToken.address,
    currentBalance
  ]);

  /**
   * Handle visibility changes to reset states
   */
  useEffect(() => {
    if (visible) {
      // Reset states when modal opens
      if (isMounted.current) {
        setResultMsg('');
        setErrorMsg('');
        setSolscanTxSig('');
      }

      // Initialize tokens when modal becomes visible
      if (!tokensInitialized) {
        initializeTokens();
      } else if (connected && userPublicKey) {
        // If tokens are already initialized, fetch both balance and price
        console.log('[TradeModal] Modal visible, fetching balance and price for initialized tokens');

        // Use a small timeout to avoid state updates colliding
        const timer = setTimeout(() => {
          if (isMounted.current) {
            fetchTokenBalance().then(() => {
              if (isMounted.current) {
                fetchTokenPrice();
              }
            });
          }
        }, 100);

        return () => clearTimeout(timer);
      }
    }
  }, [visible, tokensInitialized, initializeTokens, connected, userPublicKey, fetchTokenBalance, fetchTokenPrice]);

  /**
   * Resets states and closes the entire modal
   */
  const handleClose = useCallback(() => {
    setSelectedTab(initialActiveTab ?? 'PAST_SWAPS');
    setResultMsg('');
    setErrorMsg('');
    setSolscanTxSig('');
    setShowSharePrompt(false);
    setSelectedPastSwap(null);
    setSwaps([]);
    setInitialLoading(true);
    hasLoadedInitialDataRef.current = false;
    onClose();
  }, [onClose, initialActiveTab]);

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

    let retryCount = 0;
    const MAX_RETRIES = 2;

    while (retryCount <= MAX_RETRIES) {
      try {
        // Execute the swap using the trade service
        const response = await TradeService.executeSwap(
          inputToken,
          outputToken,
          solAmount,
          userPublicKey,
          sendTransaction,
          {
            statusCallback: (status) => {
              if (isMounted.current) {
                setResultMsg(status);
              }
            }
          }
        );

        if (response.success && response.signature) {
          if (isMounted.current) {
            setResultMsg(`Swap successful!`);

            // Show the share prompt modal
            setPendingBuyInputLamports(response.inputAmount);
            setPendingBuyOutputLamports(response.outputAmount);
            setShowSharePrompt(true);
          }
          return; // Success, exit the retry loop
        } else {
          throw new Error(response.error?.toString() || 'Transaction failed');
        }
      } catch (err: any) {
        console.error('Trade error:', err);

        // Check if this is a signature verification error
        if (err.message.includes('signature verification') && retryCount < MAX_RETRIES) {
          console.log(`Retrying transaction (attempt ${retryCount + 1} of ${MAX_RETRIES})...`);
          retryCount++;
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        if (isMounted.current) {
          // Format error message for user
          let errorMessage = 'Trade failed. ';
          if (err.message.includes('signature verification')) {
            errorMessage += 'Please try again.';
          } else if (err.message.includes('0x1771')) {
            errorMessage += 'Insufficient balance or price impact too high.';
          } else {
            errorMessage += err.message;
          }

          setErrorMsg(errorMessage);
          console.error('Detailed error:', err.message);
        }
        break; // Exit retry loop on non-signature errors
      }
    }

    if (isMounted.current) {
      setLoading(false);
    }
  }, [
    connected,
    userPublicKey,
    solAmount,
    inputToken,
    outputToken,
    sendTransaction,
  ]);

  /**
   * Create the post in Redux after a successful swap
   */
  const shareTradeInFeed = useCallback(
    async (inputLamports: number, outputLamports: number, inputTokenInfo: TokenInfo, outputTokenInfo: TokenInfo) => {
      if (isMounted.current) {
        setLoading(true);
        setResultMsg('Creating post...');
      }

      try {
        // Prepare post content
        const localId = 'local-' + Math.random().toString(36).substr(2, 9);

        // Calculate token quantities
        const localInputQty = inputLamports / Math.pow(10, inputTokenInfo.decimals);
        const localOutputQty = outputLamports / Math.pow(10, outputTokenInfo.decimals);

        // Estimate USD values
        const inputUsdValue = await TokenService.estimateTokenUsdValue(
          inputLamports,
          inputTokenInfo.decimals,
          inputTokenInfo.address,
          inputTokenInfo.symbol
        );

        const outputUsdValue = await TokenService.estimateTokenUsdValue(
          outputLamports,
          outputTokenInfo.decimals,
          outputTokenInfo.address,
          outputTokenInfo.symbol
        );

        const tradeData: TradeData = {
          inputMint: inputTokenInfo.address,
          outputMint: outputTokenInfo.address,
          aggregator: 'Jupiter',
          inputSymbol: inputTokenInfo.symbol,
          inputQuantity: localInputQty.toFixed(4),
          inputUsdValue,
          outputSymbol: outputTokenInfo.symbol,
          outputQuantity: localOutputQty.toFixed(4),
          outputUsdValue,
          // For new trades, use current timestamp in milliseconds
          executionTimestamp: Date.now(),
        };

        const postSections: ThreadSection[] = [
          {
            id: 'swap-post-' + Math.random().toString(36).substr(2, 9),
            type: 'TEXT_TRADE' as ThreadSectionType,
            tradeData,
            text: `I just executed a trade: ${localInputQty.toFixed(4)} ${inputTokenInfo.symbol
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

        if (isMounted.current) {
          setResultMsg('Trade post created successfully!');
        }

        onPostCreated && onPostCreated();
      } catch (err: any) {
        console.error('[shareTradeInFeed] Error =>', err);
        if (isMounted.current) {
          setErrorMsg('Failed to create post');
        }

        // Show error notification
        TransactionService.showError(err);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
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
        if (isMounted.current) {
          setLoading(true);
          setResultMsg('Creating post...');
        }

        // Format amounts properly
        const inputQty = swap.inputToken.amount / Math.pow(10, swap.inputToken.decimals);
        const outputQty = swap.outputToken.amount / Math.pow(10, swap.outputToken.decimals);

        // Convert timestamp to milliseconds if needed (Helius provides timestamps in seconds)
        const timestampMs = swap.timestamp < 10000000000
          ? swap.timestamp * 1000  // Convert to milliseconds if in seconds
          : swap.timestamp;

        // Estimate USD values
        const inputUsdValue = await TokenService.estimateTokenUsdValue(
          swap.inputToken.amount,
          swap.inputToken.decimals,
          swap.inputToken.mint,
          swap.inputToken.symbol
        );

        const outputUsdValue = await TokenService.estimateTokenUsdValue(
          swap.outputToken.amount,
          swap.outputToken.decimals,
          swap.outputToken.mint,
          swap.outputToken.symbol
        );

        // Create trade data object
        const tradeData: TradeData = {
          inputMint: swap.inputToken.mint,
          outputMint: swap.outputToken.mint,
          aggregator: 'Jupiter',
          inputSymbol: swap.inputToken.symbol || 'Unknown',
          inputQuantity: inputQty.toFixed(4),
          inputUsdValue,
          outputSymbol: swap.outputToken.symbol || 'Unknown',
          inputAmountLamports: swap.inputToken.amount.toString(),
          outputAmountLamports: swap.outputToken.amount.toString(),
          outputQuantity: outputQty.toFixed(4),
          outputUsdValue,
          executionTimestamp: timestampMs,
        };

        // Generate a post with the trade data
        const localId = 'local-' + Math.random().toString(36).substr(2, 9);
        const postSections: ThreadSection[] = [
          {
            id: 'swap-post-' + Math.random().toString(36).substr(2, 9),
            type: 'TEXT_TRADE' as ThreadSectionType,
            tradeData,
            text: `I executed a trade: ${inputQty.toFixed(4)} ${swap.inputToken.symbol || 'tokens'
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

        if (isMounted.current) {
          setResultMsg('Past swap shared successfully!');
        }

        onPostCreated && onPostCreated();

        // Close the modal after successful share
        setTimeout(() => handleClose(), 1500);
      } catch (err: any) {
        console.error('[sharePastSwapInFeed] Error =>', err);
        if (isMounted.current) {
          setErrorMsg('Failed to share past swap');
        }

        // Show error notification
        TransactionService.showError(err);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
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

    if (isMounted.current) {
      setLoading(true);
      setResultMsg('Preparing to share transaction...');
      setErrorMsg('');
    }

    try {
      const solscanLink = `https://solscan.io/tx/${solscanTxSig}?cluster=mainnet`;
      const postSections: ThreadSection[] = [
        {
          id: 'solscan-' + Math.random().toString(36).substr(2, 9),
          type: 'TEXT_ONLY' as ThreadSectionType,
          text: `Check out this interesting transaction: ${solscanLink}`,
        },
      ];

      await dispatch(
        createRootPostAsync({
          userId: currentUser.id,
          sections: postSections,
        }),
      ).unwrap();

      if (isMounted.current) {
        setResultMsg('Post created successfully!');
      }

      onPostCreated && onPostCreated();
    } catch (err: any) {
      console.error('Error sharing transaction:', err);
      if (isMounted.current) {
        setErrorMsg('Failed to create post');
      }

      // Show error notification
      TransactionService.showError(err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
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
    if (!walletAddress || isRefreshingRef.current) return;

    isRefreshingRef.current = true;

    if (!initialLoading && isMounted.current) {
      setRefreshing(true);
    }

    try {
      // Fetch raw swap transactions
      const rawSwaps = await fetchRecentSwaps(walletAddress);
      if (rawSwaps.length === 0) {
        if (isMounted.current) {
          setSwaps([]);
        }
        return;
      }

      // Enrich with token metadata
      const enrichedSwaps = await enrichSwapTransactions(rawSwaps);
      if (isMounted.current) {
        setSwaps(enrichedSwaps);

        // If no swap is selected yet and we have swaps, select the first one
        if (!selectedPastSwap && enrichedSwaps.length > 0) {
          setSelectedPastSwap(enrichedSwaps[0]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching past swaps:', err);
    } finally {
      if (isMounted.current) {
        setRefreshing(false);
        setInitialLoading(false);
      }
      isRefreshingRef.current = false;
      hasLoadedInitialDataRef.current = true;

      // Always fetch balance when swaps are loaded, as a fallback
      fetchTokenBalance();
    }
  }, [walletAddress, selectedPastSwap, fetchTokenBalance]);

  // Fetch past swaps when modal becomes visible - only once
  useEffect(() => {
    if (visible && walletAddress && !hasLoadedInitialDataRef.current) {
      if (isMounted.current) {
        setInitialLoading(true);
      }
      handleRefresh();
    }
  }, [visible, walletAddress, handleRefresh]);

  /**
   * Share the selected past swap
   */
  const handleSharePastSwap = useCallback(() => {
    if (!selectedPastSwap) {
      Alert.alert('No swap selected', 'Please select a swap to share.');
      return;
    }

    if (isMounted.current) {
      setLoading(true);
    }

    sharePastSwapInFeed(selectedPastSwap)
      .finally(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      });
  }, [selectedPastSwap, sharePastSwapInFeed]);

  /**
   * Handle max button click - directly fetches the balance if needed
   */
  const handleMaxButtonClick = useCallback(async () => {
    console.log("[TradeModal] MAX button clicked, current balance:", currentBalance);

    if (isMounted.current) {
      setErrorMsg(''); // Clear any existing error messages
    }

    // Validate wallet connection
    if (!connected || !userPublicKey) {
      if (isMounted.current) {
        Alert.alert(
          "Wallet Not Connected",
          "Please connect your wallet to view your balance."
        );
      }
      return;
    }

    // If we already have a balance, use it
    if (currentBalance !== null && currentBalance > 0) {
      setSolAmount(String(currentBalance));
      return;
    }

    // Otherwise, fetch fresh balance
    if (isMounted.current) {
      setResultMsg("Fetching your balance...");
    }

    try {
      const balance = await fetchTokenBalance();

      if (isMounted.current) {
        setResultMsg("");
      }

      // Check if we have a balance after fetching
      if (balance !== null && balance > 0 && isMounted.current) {
        console.log("[TradeModal] Setting max amount from fetched balance:", balance);
        setSolAmount(String(balance));
      } else if (isMounted.current) {
        console.log("[TradeModal] Balance fetch returned:", balance);

        // Check if we actually have lamports but they're below the threshold
        if (balance === 0) {
          // This is likely a case where the user has a very small SOL balance
          // Get the raw balance through connection for SOL
          if (inputToken.symbol === 'SOL' ||
            inputToken.address === 'So11111111111111111111111111111111111111112') {
            try {
              // We checked userPublicKey above, but TypeScript doesn't track that through the async function
              // So we need to check again
              if (!userPublicKey) {
                throw new Error("Public key not available");
              }

              const rpcUrl = ENDPOINTS.helius || clusterApiUrl(CLUSTER as Cluster);
              const connection = new Connection(rpcUrl, 'confirmed');
              const rawBalance = await connection.getBalance(userPublicKey);

              if (rawBalance > 0) {
                // We have some lamports, but not enough for transactions
                Alert.alert(
                  "Low SOL Balance",
                  `You have ${rawBalance / 1e9} SOL, which is too low for transactions. Consider adding more SOL to your wallet.`
                );
                return;
              }
            } catch (e) {
              console.error("[TradeModal] Error checking raw balance:", e);
            }
          }

          // If we reach here, show the generic message
          Alert.alert(
            "Balance Unavailable",
            `Could not get your ${inputToken.symbol} balance. Please check your wallet connection.`
          );
        }
      }
    } catch (error) {
      console.error("[TradeModal] Error in MAX button handler:", error);
      if (isMounted.current) {
        setResultMsg("");
        setErrorMsg(`Failed to fetch your ${inputToken.symbol} balance`);
        setTimeout(() => isMounted.current && setErrorMsg(''), 3000);
      }
    }
  }, [currentBalance, fetchTokenBalance, inputToken.symbol, inputToken.address, userPublicKey, connected]);

  /**
   * When token selection changes, update the balance and price
   */
  const handleTokenSelected = useCallback(async (token: any) => {
    if (!isMounted.current) return;

    try {
      console.log(`[TradeModal] Token selected: ${token.symbol || 'Unknown'}`);

      // Mark token operation as pending
      if (selectingWhichSide === 'input') {
        pendingTokenOps.current.input = true;
      } else {
        pendingTokenOps.current.output = true;
      }

      // Ensure we have complete token info
      const completeToken = await TokenService.ensureCompleteTokenInfo(token);

      if (!isMounted.current) return;

      if (selectingWhichSide === 'input') {
        console.log('[TradeModal] Input token changed to', completeToken.symbol);

        // Update input token state
        setInputToken(completeToken);
        pendingTokenOps.current.input = false;

        // Clear any existing amount since token changed
        setSolAmount('0');
        setCurrentBalance(null);

        // Fetch balance and price for new token with small delay
        setTimeout(async () => {
          if (isMounted.current) {
            try {
              const newBalance = await fetchTokenBalance(completeToken);
              if (isMounted.current && newBalance !== null) {
                await fetchTokenPrice(completeToken);
              }
            } catch (error) {
              console.error('[TradeModal] Error fetching balance/price after token change:', error);
            }
          }
        }, 100);
      } else {
        console.log('[TradeModal] Output token changed to', completeToken.symbol);
        setOutputToken(completeToken);
        pendingTokenOps.current.output = false;
      }

      setShowSelectTokenModal(false);
    } catch (error) {
      console.error('[TradeModal] Error selecting token:', error);
      // Reset pending flags
      if (selectingWhichSide === 'input') {
        pendingTokenOps.current.input = false;
      } else {
        pendingTokenOps.current.output = false;
      }

      if (isMounted.current) {
        setErrorMsg('Failed to load token information');
        setTimeout(() => isMounted.current && setErrorMsg(''), 3000);
      }
    }
  }, [selectingWhichSide, fetchTokenBalance, fetchTokenPrice]);

  /**
   * Render the content of the selected tab
   */
  const renderTabContent = () => {
    if (selectedTab === 'PAST_SWAPS') {
      // PAST_SWAPS tab (History)
      return (
        <View style={styles.pastSwapsContainer}>
          {walletAddress ? (
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
                      style={(refreshing || initialLoading) ? { transform: [{ rotate: '45deg' }] } : undefined}
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
                    renderItem={({ item }) => {
                      // Debug logging to see what's available
                      console.log(`[TradeModal] Rendering swap item:`, {
                        inputTokenImage: item.inputToken.image,
                        inputTokenLogoURI: (item.inputToken as any).logoURI,
                        outputTokenImage: item.outputToken.image,
                        outputTokenLogoURI: (item.outputToken as any).logoURI
                      });

                      // Helper function to get token logo URL with fallbacks
                      const getTokenLogoUrl = (token: any) => {
                        // Try the properties we know about
                        if (token.logoURI) return token.logoURI;
                        if (token.image) return token.image;

                        // Fallbacks for common tokens
                        if (token.symbol === 'SOL' || token.mint === 'So11111111111111111111111111111111111111112') {
                          return 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
                        }

                        if (token.symbol === 'USDC' || token.mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
                          return 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png';
                        }

                        // No logo found
                        return null;
                      };

                      return (
                        <View style={styles.swapItemContainer}>
                          <PastSwapItem
                            swap={item}
                            onSelect={handlePastSwapSelected}
                            selected={selectedPastSwap?.signature === item.signature}
                            inputTokenLogoURI={getTokenLogoUrl(item.inputToken)}
                            outputTokenLogoURI={getTokenLogoUrl(item.outputToken)}
                          />
                        </View>
                      );
                    }}
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
                  {inputToken.logoURI ? (
                    <Image
                      source={{ uri: inputToken.logoURI }}
                      style={styles.tokenIcon}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.tokenIcon, { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ color: '#666', fontWeight: 'bold', fontSize: 10 }}>
                        {inputToken.symbol?.charAt(0) || '?'}
                      </Text>
                    </View>
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
                  {outputToken.logoURI ? (
                    <Image
                      source={{ uri: outputToken.logoURI }}
                      style={styles.tokenIcon}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.tokenIcon, { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ color: '#666', fontWeight: 'bold', fontSize: 10 }}>
                        {outputToken.symbol?.charAt(0) || '?'}
                      </Text>
                    </View>
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
                onPress={handleMaxButtonClick}>
                <Text style={styles.maxButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>
            {currentTokenPrice !== null && !isNaN(parseFloat(solAmount)) ? (
              <Text style={styles.amountUsdValue}>
                ~ ${(parseFloat(solAmount) * currentTokenPrice).toFixed(2)}
              </Text>
            ) : (
              <Text style={styles.amountUsdValue}>
                {parseFloat(solAmount) > 0 ? '~ Fetching price...' : '~ $0.00'}
              </Text>
            )}
          </View>

          {loading ? (
            <View style={{ alignItems: 'center', marginVertical: 24 }}>
              <ActivityIndicator size="large" color="#3871DD" />
              <Text style={{ marginTop: 12, color: '#4B5563' }}>
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
                  onTokenSelected={handleTokenSelected}
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
