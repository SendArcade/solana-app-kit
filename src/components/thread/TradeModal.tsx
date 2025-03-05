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
  StyleSheet,
} from 'react-native';
import {useAuth} from '../../hooks/useAuth';
import {useAppDispatch} from '../../hooks/useReduxHooks';
import {addPostLocally, createRootPostAsync} from '../../state/thread/reducer';
import {Transaction, VersionedTransaction, Connection} from '@solana/web3.js';
import {TENSOR_API_KEY, HELIUS_RPC_URL} from '@env';
import {ThreadPost, ThreadSection, ThreadUser, TradeData} from './thread.types';
import styles from './tradeModal.style';  // Keep using your existing style definitions for everything else
import SelectTokenModal, {TokenInfo} from './SelectTokenModal';
import { ENDPOINTS } from '../../config/constants';

const JUPITER_SWAP_ENDPOINT = ENDPOINTS.jupiter.swap;

type TabOption = 'TRADE_AND_SHARE' | 'PICK_TX_SHARE';

interface TradeModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: ThreadUser;
  onPostCreated?: () => void;
  initialInputToken?: TokenInfo;
  initialOutputToken?: TokenInfo;
  disableTabs?: boolean;
}

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
      address: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
    },
  );
  const [outputToken, setOutputToken] = useState<TokenInfo>(
    initialOutputToken ?? {
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI:
        'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    },
  );

  const [selectingWhichSide, setSelectingWhichSide] = useState<'input' | 'output'>('input');
  const [showSelectTokenModal, setShowSelectTokenModal] = useState(false);

  const [solAmount, setSolAmount] = useState('0.01');
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [solscanTxSig, setSolscanTxSig] = useState('');

  const handleClose = useCallback(() => {
    setSelectedTab('TRADE_AND_SHARE');
    setResultMsg('');
    setErrorMsg('');
    setSolscanTxSig('');
    onClose();
  }, [onClose]);

  function toBaseUnits(amount: string, decimals: number): number {
    const val = parseFloat(amount);
    if (isNaN(val)) return 0;
    return val * Math.pow(10, decimals);
  }

  async function getTokenDetailsAndPrice(
    mint: string,
  ): Promise<{symbol: string; decimals: number; usdPrice: number}> {
    const tokenResp = await fetch(`https://api.jup.ag/tokens/v1/token/${mint}`);
    if (!tokenResp.ok) {
      throw new Error(`Failed to load token ${mint}: ${tokenResp.status}`);
    }
    const tokenData = await tokenResp.json();
    const symbol = tokenData.symbol || tokenData.name || '???';
    const decimals = tokenData.decimals || 0;
    let usdPrice = 0;
    if (tokenData.extensions && tokenData.extensions.coingeckoId) {
      const cgId = tokenData.extensions.coingeckoId;
      try {
        const cgResp = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`,
        );
        if (cgResp.ok) {
          const cgData = await cgResp.json();
          if (
            cgData[cgId] &&
            cgData[cgId].usd !== undefined &&
            typeof cgData[cgId].usd === 'number'
          ) {
            usdPrice = cgData[cgId].usd;
          }
        }
      } catch (err) {
        console.warn('Coingecko price fetch failed', err);
      }
    }
    return {symbol, decimals, usdPrice};
  }

  const promptPostSwap = useCallback(
    async ({
      inputLamports,
      outputLamports,
    }: {
      inputLamports: number;
      outputLamports: number;
    }) => {
      Alert.alert(
        'Trade Successful',
        'Your trade was successful! Would you like to share your trade on your feed?',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: async () => {
              try {
                const [inputInfo, outputInfo] = await Promise.all([
                  getTokenDetailsAndPrice(inputToken.address),
                  getTokenDetailsAndPrice(outputToken.address),
                ]);

                const finalInputQty = inputLamports / Math.pow(10, inputInfo.decimals);
                const finalOutputQty = outputLamports / Math.pow(10, outputInfo.decimals);

                const totalInputUsd = finalInputQty * inputInfo.usdPrice;
                const totalOutputUsd = finalOutputQty * outputInfo.usdPrice;

                const finalInputQtyStr = finalInputQty.toFixed(4).replace(/\.?0+$/, '');
                const finalOutputQtyStr = finalOutputQty.toFixed(4).replace(/\.?0+$/, '');

                const inputUsdValStr = totalInputUsd > 0 ? `$${totalInputUsd.toFixed(2)}` : '$0.00';
                const outputUsdValStr = totalOutputUsd > 0 ? `$${totalOutputUsd.toFixed(2)}` : '$0.00';

                const tradeData: TradeData = {
                  inputMint: inputToken.address,
                  outputMint: outputToken.address,
                  aggregator: 'Jupiter',
                  inputSymbol: inputInfo.symbol,
                  inputQuantity: finalInputQtyStr,
                  inputUsdValue: inputUsdValStr,
                  outputSymbol: outputInfo.symbol,
                  outputQuantity: finalOutputQtyStr,
                  outputUsdValue: outputUsdValStr,
                };

                const postSections: ThreadSection[] = [
                  {
                    id: 'swap-post-' + Math.random().toString(36).substr(2, 9),
                    type: 'TEXT_TRADE',
                    tradeData,
                    text: `I just executed a trade: ${solAmount} ${inputToken.symbol} for ${outputToken.symbol}!`,
                  },
                ];

                const newPost: ThreadPost = {
                  id: 'local-' + Math.random().toString(36).substr(2, 9),
                  user: currentUser,
                  sections: postSections,
                  createdAt: new Date().toISOString(),
                  parentId: undefined,
                  replies: [],
                  reactionCount: 0,
                  retweetCount: 0,
                  quoteCount: 0,
                };

                dispatch(addPostLocally(newPost));
                setResultMsg('Trade post created successfully!');
                onPostCreated && onPostCreated();

                await dispatch(
                  createRootPostAsync({
                    user: currentUser,
                    sections: postSections,
                  }),
                ).unwrap();
              } catch (err: any) {
                setErrorMsg(err?.message || 'Failed to create post.');
              }
            },
          },
        ],
      );
    },
    [dispatch, onPostCreated, currentUser, solAmount, inputToken, outputToken],
  );

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

      // Get quote
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
      if (quoteData.data && Array.isArray(quoteData.data) && quoteData.data.length > 0) {
        firstRoute = quoteData.data[0];
      } else if (quoteData.routePlan && Array.isArray(quoteData.routePlan) && quoteData.routePlan.length > 0) {
        firstRoute = quoteData;
      } else {
        throw new Error('No routes returned by Jupiter.');
      }

      const outLamports = parseFloat(firstRoute.outAmount) || 0;

      // Build swap Tx from server
      const body = {
        quoteResponse: quoteData,
        userPublicKey: userPublicKey.toString(),
      };
      const swapResp = await fetch(JUPITER_SWAP_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });

      const swapData = await swapResp.json();
      if (!swapResp.ok || !swapData.swapTransaction) {
        throw new Error(swapData.error || 'Failed to get Jupiter swapTransaction.');
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
      const connection = new Connection(HELIUS_RPC_URL, 'confirmed');
      const provider = await userWallet.getProvider();
      const {signature} = await provider.request({
        method: 'signAndSendTransaction',
        params: {transaction, connection},
      });
      if (!signature) {
        throw new Error('No signature returned from signAndSendTransaction');
      }

      setResultMsg(`Swap successful! Tx: ${signature}`);

      // Prompt user to create a post about it
      await promptPostSwap({inputLamports, outputLamports: outLamports});
    } catch (err: any) {
      console.error('Trade error:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [userPublicKey, solAmount, inputToken, outputToken, userWallet, promptPostSwap]);

  const handlePickTxAndShare = useCallback(async () => {
    if (!solscanTxSig.trim()) {
      Alert.alert('No transaction signature', 'Please enter a valid signature.');
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
          user: currentUser,
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

  const renderTabContent = () => {
    if (selectedTab === 'TRADE_AND_SHARE') {
      return (
        <ScrollView style={{width: '100%'}} keyboardShouldPersistTaps="handled">
          <View style={styles.tokenRow}>
            <View style={styles.tokenColumn}>
              <Text style={styles.inputLabel}>From</Text>
              <TouchableOpacity
                style={styles.tokenSelector}
                onPress={() => {
                  setSelectingWhichSide('input');
                  setShowSelectTokenModal(true);
                }}>
                <Text style={styles.tokenSelectorText}>{inputToken.symbol}</Text>
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
                <Text style={styles.tokenSelectorText}>{outputToken.symbol}</Text>
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
            <ActivityIndicator size="large" style={{marginTop: 16}} />
          ) : (
            <TouchableOpacity style={styles.swapButton} onPress={handleTradeAndShare}>
              <Text style={styles.swapButtonText}>Swap & Share</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      );
    }

    // PICK_TX_SHARE tab
    return (
      <View style={{width: '100%'}}>
        <Text style={styles.inputLabel}>Transaction Signature</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Paste Solscan Tx Sig"
          value={solscanTxSig}
          onChangeText={setSolscanTxSig}
          autoCapitalize="none"
        />
        {loading ? (
          <ActivityIndicator size="large" style={{marginTop: 16}} />
        ) : (
          <TouchableOpacity style={styles.swapButton} onPress={handlePickTxAndShare}>
            <Text style={styles.swapButtonText}>Share Tx</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      {/* Container for the entire screen (background + modal) */}
      <View style={{flex: 1}}>
        {/* Background overlay that closes the modal when tapped */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
          />
        </TouchableWithoutFeedback>

        {/* Centered wrapper for the modal content */}
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            // This view acts like your "modalContainer" but inline:
            style={{
              width: '90%',
              maxHeight: '90%',
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 16,
            }}
          >
            {/* Shield to prevent tapping inside from closing the modal */}
            <TouchableWithoutFeedback onPress={() => {}}>
              <View>
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>Token Swap</Text>
                  <TouchableOpacity style={styles.headerClose} onPress={handleClose}>
                    <Text style={styles.headerCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {!disableTabs && (
                  <View style={styles.tabRow}>
                    <TouchableOpacity
                      style={[
                        styles.tabButton,
                        selectedTab === 'TRADE_AND_SHARE' && styles.tabButtonActive,
                      ]}
                      onPress={() => setSelectedTab('TRADE_AND_SHARE')}
                    >
                      <Text
                        style={[
                          styles.tabButtonText,
                          selectedTab === 'TRADE_AND_SHARE' && styles.tabButtonTextActive,
                        ]}
                      >
                        Swap & Share
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.tabButton,
                        selectedTab === 'PICK_TX_SHARE' && styles.tabButtonActive,
                      ]}
                      onPress={() => setSelectedTab('PICK_TX_SHARE')}
                    >
                      <Text
                        style={[
                          styles.tabButtonText,
                          selectedTab === 'PICK_TX_SHARE' && styles.tabButtonTextActive,
                        ]}
                      >
                        Pick Tx & Share
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {renderTabContent()}

                {!!resultMsg && <Text style={styles.resultText}>{resultMsg}</Text>}
                {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

                {/* Token selection modal */}
                <SelectTokenModal
                  visible={showSelectTokenModal}
                  onClose={() => setShowSelectTokenModal(false)}
                  onTokenSelected={(token) => {
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
    </Modal>
  );
}
