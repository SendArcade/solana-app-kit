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
import type {ThreadPost, ThreadUser} from '../thread.types';
import {createThreadStyles, getMergedTheme} from '../thread.styles';
import {useSelector} from 'react-redux';
import {RootState} from '../../../state/store';
import {Cluster, clusterApiUrl, Connection, Transaction, VersionedTransaction} from '@solana/web3.js';
import {Buffer} from 'buffer';
import {TENSOR_API_KEY, HELIUS_RPC_URL, CLUSTER} from '@env';
import {useAuth} from '../../../hooks/useAuth';
import TradeModal from '../trade/TradeModal';
import {useAppSelector} from '../../../hooks/useReduxHooks';
import { DEFAULT_IMAGES, ENDPOINTS } from '../../../config/constants';

/**
 * Determines the type of CTA to display based on the post's sections
 * @param {ThreadPost} post - The post to analyze
 * @returns {'trade' | 'nft' | null} The type of CTA to display
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
  const [tradeLoading, setTradeLoading] = useState(false);
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
  const [floorNft, setFloorNft] = useState<any>(null);
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
  const {solanaWallet} = useAuth();

  // For simplicity, using the first connected wallet
  const userPublicKey = solanaWallet?.wallets?.[0]?.publicKey || null;
  const userWallet = solanaWallet?.wallets?.[0] || null;

  const currentUser: ThreadUser = {
    id: userPublicKey || 'anonymous-user',
    username: userName || 'Anonymous',
    handle: userPublicKey
      ? '@' + userPublicKey.slice(0, 6) + '...' + userPublicKey.slice(-4)
      : '@anonymous',
    verified: true,
    avatar: storedProfilePic ? {uri: storedProfilePic} : DEFAULT_IMAGES.user,
  };

  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(
    mergedTheme,
    styleOverrides as {[key: string]: object} | undefined,
    userStyleSheet as {[key: string]: object} | undefined,
  );

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

  const fetchFloorNFTForCollection = async (collId: string) => {
    try {
      setLoadingFloor(true);
      setNftStatusMsg('Fetching collection floor...');
      
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-tensor-api-key': TENSOR_API_KEY,
        },
      };
      
      const url = `https://api.mainnet.tensordev.io/api/v1/mint/collection?collId=${encodeURIComponent(
        collId
      )}&sortBy=ListingPriceAsc&limit=1`;
      
      const resp = await fetch(url, options);
      if (!resp.ok) {
        throw new Error(`Failed to fetch collection floor: ${resp.status}`);
      }
      
      const data = await resp.json();
      if (data.mints && data.mints.length > 0) {
        const floor = data.mints[0];
        if (floor && floor.mint && floor.listing) {
          const owner = floor.listing.seller;
          const maxPrice = parseFloat(floor.listing.price) / 1_000_000_000;
          console.log(
            `Floor NFT: mint=${floor.mint}, owner=${owner}, maxPrice=${maxPrice}`,
          );
          setNftStatusMsg(`Found floor: ${maxPrice.toFixed(5)} SOL`);
          return { mint: floor.mint, owner, maxPrice };
        }
      }
      
      throw new Error('No floor NFT found for this collection');
    } catch (err: any) {
      console.error('Error fetching floor NFT:', err);
      throw err;
    } finally {
      setLoadingFloor(false);
    }
  };

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
   * Handles the NFT purchase process
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
    if (!userPublicKey) {
      Alert.alert('Error', 'Wallet not connected.');
      return;
    }

    const listingPriceSol = listingData.priceSol ?? 0;
    const mint = listingData.mint;

    try {
      setNftLoading(true);
      setNftStatusMsg('Fetching blockhash ...');

      const rpcUrl = ENDPOINTS.helius || clusterApiUrl(CLUSTER as Cluster);
      const connection = new Connection(rpcUrl, 'confirmed');
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

  const handleBuyCollectionFloor = async () => {
    if (!collectionData) {
      Alert.alert('Error', 'No collection data available for this post.');
      return;
    }
    
    if (!userPublicKey) {
      Alert.alert('Error', 'Wallet not connected.');
      return;
    }
    
    try {
      setNftLoading(true);
      setNftStatusMsg('Fetching collection floor...');
      
      // Get the floor NFT for this collection
      const floorDetails = await fetchFloorNFTForCollection(collectionData.collId);
      if (!floorDetails) {
        throw new Error('No floor NFT found for this collection.');
      }
      
      setNftStatusMsg('Fetching blockhash ...');
      const rpcUrl = ENDPOINTS.helius || clusterApiUrl(CLUSTER as Cluster);
      const connection = new Connection(rpcUrl, 'confirmed');
      const {blockhash} = await connection.getRecentBlockhash();
      
      setNftStatusMsg(`Preparing to buy floor NFT at ${floorDetails.maxPrice.toFixed(5)} SOL...`);
      const maxPriceInLamports = floorDetails.maxPrice * 1_000_000_000;
      
      const buyUrl = `https://api.mainnet.tensordev.io/api/v1/tx/buy?buyer=${userPublicKey}&mint=${floorDetails.mint}&owner=${floorDetails.owner}&maxPrice=${maxPriceInLamports}&blockhash=${blockhash}`;

      const resp = await fetch(buyUrl, {
        headers: {
          'x-tensor-api-key': TENSOR_API_KEY,
        },
      });
      
      const rawText = await resp.text();
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
      
      setNftConfirmationMsg(`Successfully purchased floor NFT from ${collectionData.name} collection!`);
      setNftConfirmationVisible(true);
    } catch (err: any) {
      console.error('Error during buy transaction:', err);
      Alert.alert('Error', err.message || 'Failed to buy floor NFT.');
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
          currentUser={currentUser}
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
