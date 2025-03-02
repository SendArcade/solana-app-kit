// FILE: src/components/thread/PostCTA.tsx

import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
  Alert,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import type {ThreadPost} from './thread.types';
import {createThreadStyles, getMergedTheme} from './thread.styles';
import PriorityFeeSelector from '../PriorityFeeSelector';
import {useSelector} from 'react-redux';
import {RootState} from '../../state/store';
import {useTradeTransaction} from '../../hooks/useTradeTransaction';
import {Connection, Transaction, VersionedTransaction} from '@solana/web3.js';
import {Buffer} from 'buffer';
import {TENSOR_API_KEY, HELIUS_RPC_URL} from '@env';
import {useAuth} from '../../hooks/useAuth';

function getPostSectionType(post: ThreadPost) {
  for (const section of post.sections) {
    if (section.type === 'TEXT_TRADE') return 'trade';
    if (section.type === 'NFT_LISTING') return 'nft';
  }
  return null;
}

interface PostCTAProps {
  post: ThreadPost;
  themeOverrides?: Partial<Record<string, any>>;
  styleOverrides?: {
    container?: StyleProp<ViewStyle>;
    button?: StyleProp<ViewStyle>;
    buttonLabel?: StyleProp<TextStyle>;
  };
  userStyleSheet?: {
    container?: StyleProp<ViewStyle>;
    button?: StyleProp<ViewStyle>;
    buttonLabel?: StyleProp<TextStyle>;
  };
}

export default function PostCTA({
  post,
  themeOverrides,
  styleOverrides,
  userStyleSheet,
}: PostCTAProps) {
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeLoading, setTradeLoading] = useState(false);

  // For NFT buying spinner
  const [nftLoading, setNftLoading] = useState(false);
  const [nftStatusMsg, setNftStatusMsg] = useState('');

  // New state for confirmation after a successful buy
  const [nftConfirmationVisible, setNftConfirmationVisible] = useState(false);
  const [nftConfirmationMsg, setNftConfirmationMsg] = useState('');

  const [selectedMode, setSelectedMode] = useState<'priority' | 'jito'>(
    'priority',
  );
  const selectedFeeTier = useSelector(
    (state: RootState) => state.transaction.selectedFeeTier,
  );
  const {solanaWallet} = useAuth();

  // For simplicity, using the first connected wallet
  const userPublicKey = solanaWallet?.wallets?.[0]?.publicKey || null;
  const userWallet = solanaWallet?.wallets?.[0] || null;
  const {sendTrade} = useTradeTransaction();

  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(
    mergedTheme,
    styleOverrides as {[key: string]: object} | undefined,
    userStyleSheet as {[key: string]: object} | undefined,
  );

  // Determine which CTA to show based on the post content
  const sectionType = getPostSectionType(post);
  if (!sectionType) return null;

  /**
   * 1) "Copy Trade" CTA (for TEXT_TRADE posts)
   */
  const handleOpenTradeModal = () => {
    setShowTradeModal(true);
  };

  const handleSubmitTrade = async () => {
    try {
      setTradeLoading(true);
      await sendTrade(selectedMode);
    } catch (err: any) {
      Alert.alert(
        'Trade Error',
        err.message || 'Failed to send trade transaction.',
      );
    } finally {
      setShowTradeModal(false);
      setTradeLoading(false);
    }
  };

  /**
   * 2) "Buy NFT" CTA (for NFT_LISTING posts)
   *    This replicates the approach from BuySection to fetch blockhash,
   *    call the Tensor buy endpoint, and sign each returned transaction.
   */
  const handleBuyListedNft = async () => {
    const listingData = post.sections.find(
      s => s.type === 'NFT_LISTING',
    )?.listingData;
    if (!listingData) {
      Alert.alert('Error', 'No NFT listing data found in this post.');
      return;
    }
    if (!userPublicKey) {
      Alert.alert('Error', 'Wallet not connected.');
      return;
    }

    // Basic fields from the listing data
    const listingPriceSol = listingData.priceSol ?? 0;
    const mint = listingData.mint;

    try {
      setNftLoading(true);
      setNftStatusMsg('Fetching blockhash ...');

      // For mainnet
      const connection = new Connection(HELIUS_RPC_URL, 'confirmed');
      const {blockhash} = await connection.getRecentBlockhash();
      setNftStatusMsg(`Blockhash: ${blockhash} fetched.\nPreparing buy tx ...`);

      const maxPriceInLamports = listingPriceSol * 1_000_000_000;
      const buyUrl = `https://api.mainnet.tensordev.io/api/v1/tx/buy?buyer=${userPublicKey}&mint=${mint}&owner=${userPublicKey}&maxPrice=${maxPriceInLamports}&blockhash=${blockhash}`;

      const resp = await fetch(buyUrl, {
        headers: {
          'x-tensor-api-key': TENSOR_API_KEY,
        },
      });
      const rawText = await resp.text();
      console.log('Buy response:', rawText);
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error('Tensor returned non-JSON response.');
      }
      if (!data.txs || data.txs.length === 0) {
        throw new Error('No transactions returned from Tensor buy endpoint.');
      }

      setNftStatusMsg(`Signing ${data.txs.length} transaction(s)...`);
      for (let i = 0; i < data.txs.length; i++) {
        const txObj = data.txs[i];
        let transaction: Transaction | VersionedTransaction;

        if (txObj.txV0) {
          const txBuffer = Buffer.from(txObj.txV0.data, 'base64');
          transaction = VersionedTransaction.deserialize(txBuffer);
        } else if (txObj.tx) {
          const txBuffer = Buffer.from(txObj.tx.data, 'base64');
          transaction = Transaction.from(txBuffer);
        } else {
          throw new Error(`Unknown transaction format in item #${i + 1}`);
        }

        if (!userWallet) {
          throw new Error('Wallet not connected.');
        }
        const provider = await userWallet.getProvider();
        const {signature} = await provider.request({
          method: 'signAndSendTransaction',
          params: {transaction, connection},
        });
        if (!signature) {
          throw new Error(
            'Failed to sign transaction or no signature returned.',
          );
        }

        setNftStatusMsg(`TX #${i + 1} signature: ${signature}`);
      }
      // Instead of Alert.alert, set the confirmation modal
      setNftConfirmationMsg('NFT purchased successfully!');
      setNftConfirmationVisible(true);
    } catch (err: any) {
      console.error('Error during buy transaction:', err);
      Alert.alert('Error', err.message || 'Failed to buy NFT.');
    } finally {
      setNftLoading(false);
      setNftStatusMsg('');
    }
  };

  // CTA label & onPress
  const ctaLabel = sectionType === 'trade' ? 'Copy Trade' : 'Buy NFT';
  const onCtaPress =
    sectionType === 'trade' ? handleOpenTradeModal : handleBuyListedNft;

  return (
    <View style={[styles.threadPostCTAContainer, styleOverrides?.container]}>
      {/* The main CTA button */}
      <TouchableOpacity
        style={[styles.threadPostCTAButton, styleOverrides?.button]}
        onPress={onCtaPress}
        activeOpacity={0.8}>
        <Text
          style={[
            styles.threadPostCTAButtonLabel,
            styleOverrides?.buttonLabel,
          ]}>
          {ctaLabel}
        </Text>
      </TouchableOpacity>

      {/* Trade Modal */}
      <Modal
        visible={showTradeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTradeModal(false)}>
        <View style={styles.tradeModalOverlay}>
          <View style={styles.tradeModalContainer}>
            <Text style={styles.tradeModalTitle}>Trade Settings</Text>
            <View style={styles.tradeModeSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.tradeModeButton,
                  {
                    backgroundColor:
                      selectedMode === 'priority' ? '#1d9bf0' : '#f0f0f0',
                  },
                ]}
                onPress={() => setSelectedMode('priority')}>
                <Text
                  style={{
                    color: selectedMode === 'priority' ? '#fff' : '#000',
                  }}>
                  Priority Fee
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tradeModeButton,
                  {
                    backgroundColor:
                      selectedMode === 'jito' ? '#1d9bf0' : '#f0f0f0',
                  },
                ]}
                onPress={() => setSelectedMode('jito')}>
                <Text
                  style={{
                    color: selectedMode === 'jito' ? '#fff' : '#000',
                  }}>
                  Jito Bundle
                </Text>
              </TouchableOpacity>
            </View>

            {selectedMode === 'priority' && (
              <View style={{width: '100%', marginTop: 10}}>
                <PriorityFeeSelector />
              </View>
            )}

            {tradeLoading ? (
              <ActivityIndicator
                size="large"
                color="#1d9bf0"
                style={{marginTop: 20}}
              />
            ) : (
              <TouchableOpacity
                style={[styles.tradeConfirmButton, {marginTop: 20}]}
                onPress={handleSubmitTrade}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>Submit</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={{marginTop: 12}}
              onPress={() => setShowTradeModal(false)}>
              <Text style={{color: '#1d9bf0'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* NFT Buying Progress Overlay */}
      <Modal
        visible={nftLoading}
        transparent
        animationType="fade"
        onRequestClose={() => {}}>
        <View style={uiStyles.progressOverlay}>
          <View style={uiStyles.progressContainer}>
            <ActivityIndicator size="large" color="#fff" />
            {!!nftStatusMsg && (
              <Text style={uiStyles.progressText}>{nftStatusMsg}</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* NFT Confirmation Modal */}
      <Modal
        visible={nftConfirmationVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNftConfirmationVisible(false)}>
        <View style={uiStyles.confirmOverlay}>
          <View style={uiStyles.confirmContainer}>
            <Text style={uiStyles.confirmText}>{nftConfirmationMsg}</Text>
            <TouchableOpacity
              style={uiStyles.confirmButton}
              onPress={() => setNftConfirmationVisible(false)}>
              <Text style={uiStyles.confirmButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/** Additional UI for overlays */
const uiStyles = StyleSheet.create({
  progressOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    padding: 24,
    backgroundColor: '#333',
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  progressText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmContainer: {
    padding: 24,
    backgroundColor: '#333',
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  confirmText: {
    marginBottom: 20,
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#1d9bf0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
