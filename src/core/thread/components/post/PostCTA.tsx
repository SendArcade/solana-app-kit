import React, { useState } from 'react';
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
import type { ThreadPost, ThreadUser } from '../thread.types';
import { createThreadStyles, getMergedTheme } from '../thread.styles';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../state/store';
import { Cluster, clusterApiUrl, Connection } from '@solana/web3.js';
import { CLUSTER } from '@env';
import { useWallet } from '../../../../modules/embeddedWalletProviders/hooks/useWallet';
import TradeModal from '../trade/TradeModal';
import { useAppSelector } from '../../../../hooks/useReduxHooks';
import { DEFAULT_IMAGES, ENDPOINTS } from '../../../../config/constants';
import { TransactionService } from '../../../../modules/embeddedWalletProviders/services/transaction/transactionService';

// Import NFT services
import { buyNft, buyCollectionFloor } from '../../../../modules/nft';

/**
 * Determines the type of CTA to display based on the post's sections
 * @param {ThreadPost} post - The post to analyze
 * @returns {'trade' | 'nft' | 'collection' | null} The type of CTA to display
 */
function getPostSectionType(post: ThreadPost) {
  for (const section of post.sections) {
    if (section.type === 'TEXT_TRADE') return 'trade';
    if (section.type === 'NFT_LISTING') {
      return section.listingData?.isCollection ? 'collection' : 'nft';
    }
  }
  return null;
}

/**
 * Extracts trade data from a post's TEXT_TRADE section
 * @param {ThreadPost} post - The post to extract trade data from
 * @returns {TradeData | null} The trade data if found, null otherwise
 */
function getTradeData(post: ThreadPost) {
  for (const section of post.sections) {
    if (section.type === 'TEXT_TRADE' && section.tradeData) {
      return section.tradeData;
    }
  }
  return null;
}

/**
 * Props for the PostCTA component
 * @interface PostCTAProps
 */
interface PostCTAProps {
  /** The post data to display the CTA for */
  post: ThreadPost;
  /** Theme overrides for customizing appearance */
  themeOverrides?: Partial<Record<string, any>>;
  /** Style overrides for specific components */
  styleOverrides?: {
    /** Container style overrides */
    container?: StyleProp<ViewStyle>;
    /** Button style overrides */
    button?: StyleProp<ViewStyle>;
    /** Button label style overrides */
    buttonLabel?: StyleProp<TextStyle>;
  };
  /** User-provided stylesheet overrides */
  userStyleSheet?: {
    /** Container style overrides */
    container?: StyleProp<ViewStyle>;
    /** Button style overrides */
    button?: StyleProp<ViewStyle>;
    /** Button label style overrides */
    buttonLabel?: StyleProp<TextStyle>;
  };
}

/**
 * A component that displays call-to-action buttons for posts with trade or NFT content
 * 
 * @component
 * @description
 * PostCTA renders appropriate call-to-action buttons based on the post's content type.
 * For trade posts, it shows a "Copy Trade" button that opens a trade modal. For NFT
 * listing posts, it shows a "Buy NFT" button that initiates the NFT purchase process.
 * 
 * Features:
 * - Dynamic CTA based on post content
 * - Trade copying functionality
 * - NFT purchasing integration
 * - Loading states and error handling
 * - Customizable styling
 * 
 * @example
 * ```tsx
 * <PostCTA
 *   post={postData}
 *   themeOverrides={{ '--primary-color': '#1D9BF0' }}
 *   styleOverrides={{
 *     button: { backgroundColor: '#1D9BF0' },
 *     buttonLabel: { color: 'white' }
 *   }}
 * />
 * ```
 */
export default function PostCTA({
  post,
  themeOverrides,
  styleOverrides,
  userStyleSheet,
}: PostCTAProps) {
  const [showTradeModal, setShowTradeModal] = useState(false);
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
  const [loadingFloor, setLoadingFloor] = useState(false);
  const userName = useAppSelector(state => state.auth.username);

  // For NFT buying spinner
  const [nftLoading, setNftLoading] = useState(false);
  const [nftStatusMsg, setNftStatusMsg] = useState('');

  // New state for confirmation after a successful NFT buy
  const [nftConfirmationVisible, setNftConfirmationVisible] = useState(false);
  const [nftConfirmationMsg, setNftConfirmationMsg] = useState('');

  const selectedFeeTier = useSelector(
    (state: RootState) => state.transaction.selectedFeeTier,
  );

  // Use the useWallet hook instead of direct useAuth
  const { wallet, address, publicKey, sendTransaction } = useWallet();

  // Get the wallet address as a string
  const userPublicKey = address || null;

  const currentUser: ThreadUser = {
    id: userPublicKey || 'anonymous-user',
    username: userName || 'Anonymous',
    handle: userPublicKey
      ? '@' + userPublicKey.slice(0, 6) + '...' + userPublicKey.slice(-4)
      : '@anonymous',
    verified: true,
    avatar: storedProfilePic ? { uri: storedProfilePic } : DEFAULT_IMAGES.user,
  };

  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(
    mergedTheme,
    styleOverrides as { [key: string]: object } | undefined,
    userStyleSheet as { [key: string]: object } | undefined,
  );

  // Helper to get collection data from a post
  function getCollectionData(post: ThreadPost) {
    for (const section of post.sections) {
      if (section.type === 'NFT_LISTING' && section.listingData) {
        if (section.listingData.isCollection && section.listingData.collId) {
          return {
            collId: section.listingData.collId,
            name: section.listingData.collectionName || section.listingData.name,
            image: section.listingData.image,
            description: section.listingData.collectionDescription
          };
        }
      }
    }
    return null;
  }

  // Determine which CTA to show based on the post content
  const sectionType = getPostSectionType(post);
  if (!sectionType) return null;

  const tradeData = sectionType === 'trade' ? getTradeData(post) : null;
  const collectionData = sectionType === 'collection' ? getCollectionData(post) : null;

  /**
   * Opens the trade modal for copying a trade
   * @returns {void}
   */
  const handleOpenTradeModal = () => {
    if (!tradeData) {
      Alert.alert('Error', 'No trade data available for this post.');
      return;
    }
    setShowTradeModal(true);
  };

  /**
   * Handles the NFT purchase process using the new wallet functionality
   * @returns {Promise<void>}
   */
  const handleBuyListedNft = async () => {
    const listingData = post.sections.find(
      s => s.type === 'NFT_LISTING',
    )?.listingData;
    if (!listingData) {
      Alert.alert('Error', 'No NFT listing data found in this post.');
      return;
    }
    if (!publicKey || !userPublicKey) {
      Alert.alert('Error', 'Wallet not connected.');
      return;
    }

    const listingPriceSol = listingData.priceSol ?? 0;
    const mint = listingData.mint;
    const owner = listingData.owner || '';

    if (!mint) {
      Alert.alert('Error', 'Invalid NFT mint address.');
      return;
    }

    try {
      setNftLoading(true);
      setNftStatusMsg('Preparing buy transaction...');

      const signature = await buyNft(
        userPublicKey,
        mint,
        listingPriceSol,
        owner, 
        sendTransaction,
        status => setNftStatusMsg(status)
      );

      setNftConfirmationMsg('NFT purchased successfully!');
      setNftConfirmationVisible(true);
      
      // Show success notification
      TransactionService.showSuccess(signature, 'nft');
    } catch (err: any) {
      console.error('Error during buy transaction:', err);
      // Show error notification
      TransactionService.showError(err);
    } finally {
      setNftLoading(false);
      setNftStatusMsg('');
    }
  };

  /**
   * Handles buying the floor NFT from a collection
   * @returns {Promise<void>}
   */
  const handleBuyCollectionFloor = async () => {
    if (!collectionData) {
      Alert.alert('Error', 'No collection data available for this post.');
      return;
    }

    if (!publicKey || !userPublicKey) {
      Alert.alert('Error', 'Wallet not connected.');
      return;
    }

    try {
      setNftLoading(true);
      setNftStatusMsg('Fetching collection floor...');

      const signature = await buyCollectionFloor(
        userPublicKey,
        collectionData.collId,
        sendTransaction,
        status => setNftStatusMsg(status)
      );

      setNftConfirmationMsg(`Successfully purchased floor NFT from ${collectionData.name} collection!`);
      setNftConfirmationVisible(true);
      
      // Show success notification
      TransactionService.showSuccess(signature, 'nft');
    } catch (err: any) {
      console.error('Error during buy transaction:', err);
      TransactionService.showError(err);
    } finally {
      setNftLoading(false);
      setNftStatusMsg('');
    }
  };

  // Set CTA label and onPress based on section type
  let ctaLabel = 'Copy Trade';
  let onCtaPress = handleOpenTradeModal;

  if (sectionType === 'nft') {
    ctaLabel = 'Buy NFT';
    onCtaPress = handleBuyListedNft;
  } else if (sectionType === 'collection') {
    ctaLabel = 'Buy Collection Floor';
    onCtaPress = handleBuyCollectionFloor;
  }

  return (
    <View style={[styles.threadPostCTAContainer, styleOverrides?.container]}>
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
          currentUser={currentUser}
          disableTabs={true}
          initialActiveTab="TRADE_AND_SHARE"
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
                : tradeData.inputSymbol === 'USDC'
                  ? 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
                  : '', // Empty logoURI will trigger a fetch for complete metadata
          }}
          initialOutputToken={{
            address: tradeData.outputMint,
            symbol: tradeData.outputSymbol,
            name:
              tradeData.outputSymbol === 'USDC'
                ? 'USD Coin'
                : tradeData.outputSymbol === 'SOL'
                  ? 'Solana'
                  : tradeData.outputSymbol,
            decimals: tradeData.outputSymbol === 'USDC' ? 6 : tradeData.outputSymbol === 'SOL' ? 9 : 6,
            logoURI:
              tradeData.outputSymbol === 'USDC'
                ? 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
                : tradeData.outputSymbol === 'SOL'
                  ? 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png'
                  : '', // Empty logoURI will trigger a fetch for complete metadata
          }}
        />
      )}

      {/* NFT Buying Progress Overlay */}
      <Modal
        visible={nftLoading}
        transparent
        animationType="fade"
        onRequestClose={() => { }}>
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
