import React, {useEffect, useState, useCallback} from 'react';
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
} from 'react-native';
import {
  Transaction,
  VersionedTransaction,
  Connection,
  clusterApiUrl,
  Cluster,
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
import {
  addPostLocally,
  createRootPostAsync,
} from '../../../state/thread/reducer';
import styles from './tradeModal.style';

/**
 * Available tab options in the TradeModal
 * @type {'TRADE_AND_SHARE' | 'PICK_TX_SHARE'}
 */
type TabOption = 'TRADE_AND_SHARE' | 'PICK_TX_SHARE';

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
 * It handles two main flows:
 * 1. Swap & Share (posts a trade summary on success)
 * 2. Pick an existing Tx signature & share it
 *
 * We also improved the UI/UX by using a modal for confirming share, instead of `Alert.alert`.
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
  const {solanaWallet} = useAuth();
  const userPublicKey = solanaWallet?.wallets?.[0]?.publicKey || null;
  const userWallet = solanaWallet?.wallets?.[0] || null;

  const [selectedTab, setSelectedTab] = useState<TabOption>('TRADE_AND_SHARE');

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

  // === NEW state to handle improved "Share your trade?" prompt ===
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  // We'll store the lamports so that if the user chooses "YES", we know how to create the post
  const [pendingBuyInputLamports, setPendingBuyInputLamports] =
    useState<number>(0);
  const [pendingBuyOutputLamports, setPendingBuyOutputLamports] =
    useState<number>(0);

  /**
   * Resets states and closes the entire modal
   */
  const handleClose = useCallback(() => {
    setSelectedTab('TRADE_AND_SHARE');
    setResultMsg('');
    setErrorMsg('');
    setSolscanTxSig('');
    setShowSharePrompt(false);
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
    if (!userPublicKey) {
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

      const {swapTransaction} = swapData;
      const txBuffer = Buffer.from(swapTransaction, 'base64');
      let transaction: Transaction | VersionedTransaction;
      try {
        transaction = VersionedTransaction.deserialize(txBuffer);
      } catch {
        transaction = Transaction.from(txBuffer);
      }

      if (!userWallet) {
        throw new Error('No wallet found to sign transaction.');
      }
      const rpcUrl = ENDPOINTS.helius || clusterApiUrl(CLUSTER as Cluster);
      const connection = new Connection(rpcUrl, 'confirmed');
      const provider = await userWallet.getProvider();
      const {signature} = await provider.request({
        method: 'signAndSendTransaction',
        params: {transaction, connection},
      });
      if (!signature) {
        throw new Error('No signature returned from signAndSendTransaction');
      }

      setResultMsg(`Swap successful! Tx: ${signature}`);

      // Instead of Alert, we now show a custom modal "Want to share your trade?"
      setPendingBuyInputLamports(inputLamports);
      setPendingBuyOutputLamports(outLamports);
      setShowSharePrompt(true);
    } catch (err: any) {
      console.error('Trade error:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    userPublicKey,
    solAmount,
    inputToken,
    outputToken,
    userWallet,
    setPendingBuyInputLamports,
    setPendingBuyOutputLamports,
  ]);

  /**
   * Actually create the post in Redux:
   *  - We create a local post object with a "local-..." ID
   *  - Dispatch addPostLocally
   *  - Then dispatch createRootPostAsync with { localId } to avoid duplication
   */
  const shareTradeInFeed = useCallback(
    async (inputLamports: number, outputLamports: number) => {
      try {
        // Prepare post content
        const localId = 'local-' + Math.random().toString(36).substr(2, 9);

        // Build some placeholders for "display name" & USD values
        // (In a real scenario, you'd fetch up-to-date token prices.)
        const localInputQty = inputLamports / Math.pow(10, inputToken.decimals);
        const localOutputQty =
          outputLamports / Math.pow(10, outputToken.decimals);

        const tradeData: TradeData = {
          inputMint: inputToken.address,
          outputMint: outputToken.address,
          aggregator: 'Jupiter',
          inputSymbol: inputToken.symbol,
          inputQuantity: localInputQty.toFixed(4),
          inputUsdValue: '$??',
          outputSymbol: outputToken.symbol,
          outputQuantity: localOutputQty.toFixed(4),
          outputUsdValue: '$??',
        };

        const postSections: ThreadSection[] = [
          {
            id: 'swap-post-' + Math.random().toString(36).substr(2, 9),
            type: 'TEXT_TRADE',
            tradeData,
            text: `I just executed a trade: ${localInputQty.toFixed(4)} ${
              inputToken.symbol
            } → ${outputToken.symbol}!`,
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
    [dispatch, currentUser, inputToken, outputToken, onPostCreated],
  );

  /**
   * handlePickTxAndShare:
   * The user can simply share any existing Tx by entering the signature
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
   * Render the content of the selected tab
   */
  const renderTabContent = () => {
    if (selectedTab === 'TRADE_AND_SHARE') {
      return (
        <ScrollView
          style={styles.fullWidthScroll}
          keyboardShouldPersistTaps="handled">
          <View style={styles.tokenRow}>
            <View style={styles.tokenColumn}>
              <Text style={styles.inputLabel}>From</Text>
              <TouchableOpacity
                style={styles.tokenSelector}
                onPress={() => {
                  setSelectingWhichSide('input');
                  setShowSelectTokenModal(true);
                }}>
                <Text style={styles.tokenSelectorText}>
                  {inputToken.symbol}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.arrowContainer}>
              <Text style={styles.arrowText}>→</Text>
            </View>

            <View style={styles.tokenColumn}>
              <Text style={styles.inputLabel}>To</Text>
              <TouchableOpacity
                style={styles.tokenSelector}
                onPress={() => {
                  setSelectingWhichSide('output');
                  setShowSelectTokenModal(true);
                }}>
                <Text style={styles.tokenSelectorText}>
                  {outputToken.symbol}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.inputLabel}>Amount ({inputToken.symbol})</Text>
          <TextInput
            style={styles.textInput}
            value={solAmount}
            onChangeText={setSolAmount}
            keyboardType="decimal-pad"
            placeholder={`Enter amount in ${inputToken.symbol}`}
          />

          {loading ? (
            <ActivityIndicator size="large" style={styles.activityLoader} />
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

    // PICK_TX_SHARE tab
    return (
      <View style={styles.tabContentContainer}>
        <Text style={styles.inputLabel}>Transaction Signature</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Paste Solscan Tx Sig"
          value={solscanTxSig}
          onChangeText={setSolscanTxSig}
          autoCapitalize="none"
        />
        {loading ? (
          <ActivityIndicator size="large" style={styles.activityLoader} />
        ) : (
          <TouchableOpacity
            style={styles.swapButton}
            onPress={handlePickTxAndShare}>
            <Text style={styles.swapButtonText}>Share Tx</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      {/* Container for the entire screen (background + modal) */}
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
            <TouchableWithoutFeedback onPress={() => {}}>
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
                        Swap & Share
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.tabButton,
                        selectedTab === 'PICK_TX_SHARE' &&
                          styles.tabButtonActive,
                      ]}
                      onPress={() => setSelectedTab('PICK_TX_SHARE')}>
                      <Text
                        style={[
                          styles.tabButtonText,
                          selectedTab === 'PICK_TX_SHARE' &&
                            styles.tabButtonTextActive,
                        ]}>
                        Pick Tx & Share
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
       * A nice "Share your trade?" modal to confirm
       * We store the pending buy lamports in state and pass them if user says "Yes"
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
                  );
                }}>
                <Text style={styles.sharePromptBtnText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
