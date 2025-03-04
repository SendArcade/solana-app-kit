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
} from 'react-native';
import type {ThreadPost} from './thread.types';
import {createThreadStyles, getMergedTheme} from './thread.styles';
import {useSelector} from 'react-redux';
import {RootState} from '../../state/store';
import {Connection, Transaction, VersionedTransaction} from '@solana/web3.js';
import {Buffer} from 'buffer';
import {TENSOR_API_KEY, HELIUS_RPC_URL} from '@env';
import {useAuth} from '../../hooks/useAuth';
import TradeModal from './TradeModal';
import {useAppSelector} from '../../hooks/useReduxHooks';

/**
 * Get the post section type.
 */
function getPostSectionType(post: ThreadPost) {
  for (const section of post.sections) {
    if (section.type === 'TEXT_TRADE') return 'trade';
    if (section.type === 'NFT_LISTING') return 'nft';
  }
  return null;
}

/**
 * Get trade data from a post (for TEXT_TRADE sections).
 */
function getTradeData(post: ThreadPost) {
  for (const section of post.sections) {
    if (section.type === 'TEXT_TRADE' && section.tradeData) {
      return section.tradeData;
    }
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
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);

  // For NFT buying spinner
  const [nftLoading, setNftLoading] = useState(false);
  const [nftStatusMsg, setNftStatusMsg] = useState('');

  // New state for confirmation after a successful NFT buy
  const [nftConfirmationVisible, setNftConfirmationVisible] = useState(false);
  const [nftConfirmationMsg, setNftConfirmationMsg] = useState('');

  const selectedFeeTier = useSelector(
    (state: RootState) => state.transaction.selectedFeeTier,
  );
  const {solanaWallet} = useAuth();

  // For simplicity, using the first connected wallet
  const userPublicKey = solanaWallet?.wallets?.[0]?.publicKey || null;
  const userWallet = solanaWallet?.wallets?.[0] || null;

  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(
    mergedTheme,
    styleOverrides as {[key: string]: object} | undefined,
    userStyleSheet as {[key: string]: object} | undefined,
  );

  // Determine which CTA to show based on the post content
  const sectionType = getPostSectionType(post);
  if (!sectionType) return null;

  const tradeData = sectionType === 'trade' ? getTradeData(post) : null;

  /**
   * "Copy Trade" CTA for TEXT_TRADE posts.
   */
  const handleOpenTradeModal = () => {
    if (!tradeData) {
      Alert.alert('Error', 'No trade data available for this post.');
      return;
    }
    setShowTradeModal(true);
  };

  /**
   * "Buy NFT" CTA for NFT_LISTING posts.
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

    const listingPriceSol = listingData.priceSol ?? 0;
    const mint = listingData.mint;

    try {
      setNftLoading(true);
      setNftStatusMsg('Fetching blockhash ...');

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

  // Set CTA label and onPress based on section type
  const ctaLabel = sectionType === 'trade' ? 'Copy Trade' : 'Buy NFT';
  const onCtaPress =
    sectionType === 'trade' ? handleOpenTradeModal : handleBuyListedNft;

  return (
    <View
      style={[styles.threadPostCTAContainer, styleOverrides?.container]}>
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

      {/* Render Trade Modal for Copy Trade */}
      {showTradeModal && tradeData && (
        <TradeModal
          visible={showTradeModal}
          onClose={() => setShowTradeModal(false)}
          currentUser={{
            id: 'current-user',
            username: 'You',
            handle: '@you',
            avatar: storedProfilePic
            ? { uri: storedProfilePic }
            : require('../../assets/images/User.png'),
          }}
          disableTabs={true}
          initialInputToken={{
            address: tradeData.inputMint,
            symbol: tradeData.inputSymbol,
            name:
              tradeData.inputSymbol === 'SOL'
                ? 'Solana'
                : tradeData.inputSymbol,
            decimals: tradeData.inputSymbol === 'SOL' ? 9 : 6,
            logoURI:
              tradeData.inputSymbol === 'SOL'
                ? 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png'
                : 'https://example.com/default-token.png',
          }}
          initialOutputToken={{
            address: tradeData.outputMint,
            symbol: tradeData.outputSymbol,
            name:
              tradeData.outputSymbol === 'USDC'
                ? 'USD Coin'
                : tradeData.outputSymbol,
            decimals: tradeData.outputSymbol === 'USDC' ? 6 : 6,
            logoURI:
              tradeData.outputSymbol === 'USDC'
                ? 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
                : 'https://example.com/default-token.png',
          }}
        />
      )}

      {/* NFT Buying Progress Overlay */}
      <Modal
        visible={nftLoading}
        transparent
        animationType="fade"
        onRequestClose={() => {}}>
        <View style={styles.progressOverlay}>
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color="#1d9bf0" />
            {!!nftStatusMsg && (
              <Text style={styles.progressText}>{nftStatusMsg}</Text>
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
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContainer}>
            <Text style={styles.confirmText}>{nftConfirmationMsg}</Text>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setNftConfirmationVisible(false)}>
              <Text style={styles.confirmButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
