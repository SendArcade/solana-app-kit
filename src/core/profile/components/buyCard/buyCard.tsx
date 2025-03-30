import React, { useState } from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ImageBackground
} from 'react-native';
import { styles as buyCardStyles } from './buyCard.style';
import Icons from '../../../../assets/svgs/index';
import { DEFAULT_IMAGES } from '../../../../config/constants';

import { AssetItem, useFetchPortfolio, fixImageUrl } from '../../../../hooks/useFetchTokens';
import { useAppSelector } from '../../../../hooks/useReduxHooks';
import { useAuth } from '../../../../hooks/useAuth';
import TradeModal from '../../../thread/components/trade/TradeModal';

/**
 * Define props for the BuyCard
 */
export interface BuyCardProps {
  /** The name (symbol) of the token to buy (e.g. "$YASH"). */
  tokenName?: string;
  /** A short "title" or default text under the name (e.g. "Sanctum Creator Coin"). */
  description?: string;
  /**
   * The token's main image. This can be:
   *  - A local require(...) asset
   *  - A remote URL string
   *  - Or null/undefined
   */
  tokenImage?: any;
  /**
   * Additional user-provided description or text you want to display,
   * e.g. "This is a custom user description"
   */
  tokenDesc?: string;
  /** The mint address of the token (optional). */
  tokenMint?: string;
  /** Callback triggered when user taps the "Buy" button. */
  onBuyPress?: () => void;
  /** Optional style overrides for the container. */
  containerStyle?: object;

  /**
   * Whether to show the down arrow. If true, we render the arrow
   * that calls `onArrowPress` when tapped.
   */
  showDownArrow?: boolean;

  /**
   * Called when the down arrow is pressed (e.g. open a modal).
   */
  onArrowPress?: () => void;

  /**
   * Optional wallet address to show portfolio for.
   * If not provided, will use connected wallet.
   */
  walletAddress?: string;

  /**
   * Callback when an asset is selected from the portfolio
   * Used for profile token selection.
   */
  onSelectAsset?: (asset: AssetItem) => void;

  /**
   * Whether to show a remove button for the token
   */
  showRemoveButton?: boolean;

  /**
   * Callback when remove button is pressed
   */
  onRemoveToken?: () => void;
}

// Portfolio asset item display
const PortfolioAssetItem: React.FC<{
  asset: AssetItem;
  onSelect?: (asset: AssetItem) => void;
}> = ({ asset, onSelect }) => {
  const { width } = Dimensions.get('window');
  const itemWidth = (width - 48) / 2;

  // For tokens, use a list item style
  if (asset.assetType === 'token') {
    const imageUrl = asset.image ? fixImageUrl(asset.image) : '';

    const formattedBalance = asset.token_info ?
      parseFloat(
        (parseInt(asset.token_info.balance) / Math.pow(10, asset.token_info.decimals))
          .toFixed(asset.token_info.decimals)
      ).toString() : '0';

    const tokenValue = asset.token_info?.price_info?.total_price
      ? `$${asset.token_info.price_info.total_price.toFixed(2)}`
      : '';

    return (
      <TouchableOpacity
        style={portfolioStyles.tokenItem}
        onPress={() => onSelect && onSelect(asset)}
        activeOpacity={0.7}
      >
        {/* Token Logo */}
        <View style={portfolioStyles.tokenLogoContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={portfolioStyles.tokenLogo}
              resizeMode="cover"
            />
          ) : (
            <View style={portfolioStyles.tokenLogoPlaceholder}>
              <Text style={portfolioStyles.tokenLogoPlaceholderText}>
                {asset.symbol?.[0] || asset.name?.[0] || '?'}
              </Text>
            </View>
          )}
        </View>

        {/* Token Details */}
        <View style={portfolioStyles.tokenDetails}>
          <Text style={portfolioStyles.tokenName} numberOfLines={1}>
            {asset.name}
          </Text>
          <Text style={portfolioStyles.tokenSymbol} numberOfLines={1}>
            {asset.token_info?.symbol || asset.symbol || ''}
          </Text>
        </View>

        {/* Token Balance & Value */}
        <View style={portfolioStyles.tokenBalanceContainer}>
          <Text style={portfolioStyles.tokenBalance}>
            {formattedBalance}
          </Text>
          {tokenValue ? (
            <Text style={portfolioStyles.tokenValue}>
              {tokenValue}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  // For NFTs, use a grid item style
  // Properly handle image rendering
  const renderAssetImage = () => {
    const imageUrl = asset.image ? fixImageUrl(asset.image) : '';

    if (!imageUrl) {
      return (
        <View style={portfolioStyles.assetPlaceholder}>
          <Text style={portfolioStyles.assetPlaceholderText}>
            {asset.symbol?.[0] || asset.name?.[0] || '?'}
          </Text>
        </View>
      );
    }

    return (
      <View style={portfolioStyles.assetImageWrapper}>
        <Image
          source={require('../../../../assets/images/SENDlogo.png')}
          style={portfolioStyles.fallbackImage}
          resizeMode="cover"
        />
        <Image
          source={{ uri: imageUrl }}
          style={portfolioStyles.assetImage}
          resizeMode="cover"
        />
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[portfolioStyles.assetItem, { width: itemWidth }]}
      onPress={() => onSelect && onSelect(asset)}
      activeOpacity={0.7}
    >
      <View style={portfolioStyles.assetImageContainer}>
        {renderAssetImage()}

        {asset.compression?.compressed && (
          <View style={portfolioStyles.compressedBadge}>
            <Text style={portfolioStyles.compressedText}>C</Text>
          </View>
        )}

        {/* Show price if available */}
        {asset.token_info?.price_info?.price_per_token && (
          <View style={portfolioStyles.priceBadge}>
            <Text style={portfolioStyles.priceText}>
              ${asset.token_info.price_info.price_per_token.toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      <View style={portfolioStyles.assetDetails}>
        <Text style={portfolioStyles.assetName} numberOfLines={1}>
          {asset.name}
        </Text>

        {asset.collection?.name ? (
          <Text style={portfolioStyles.assetCollection} numberOfLines={1}>
            {asset.collection.name}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

/**
 * A card component for purchasing creator coins.
 * Displays a token image, name/symbol, optional user description, and an optional arrow.
 */
const BuyCard: React.FC<BuyCardProps> = ({
  tokenName = '$YASH',
  description = 'Sanctum Creator Coin',
  tokenImage,
  tokenDesc = '',
  tokenMint,
  onBuyPress,
  containerStyle,
  showDownArrow = false,
  onArrowPress,
  walletAddress,
  onSelectAsset,
  showRemoveButton = false,
  onRemoveToken,
}) => {
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
  const userName = useAppSelector(state => state.auth.username);
  const { solanaWallet } = useAuth();

  // For simplicity, using the first connected wallet
  const userPublicKey = solanaWallet?.wallets?.[0]?.publicKey || null;
  const effectiveWalletAddress = walletAddress || userPublicKey?.toString();

  // Fetch portfolio data when needed
  const { portfolio, loading, error } = useFetchPortfolio(
    showPortfolioModal ? effectiveWalletAddress : undefined
  );

  const currentUser = {
    id: userPublicKey || 'anonymous-user',
    username: userName || 'Anonymous',
    handle: userPublicKey
      ? '@' + userPublicKey.slice(0, 6) + '...' + userPublicKey.slice(-4)
      : '@anonymous',
    verified: true,
    avatar: storedProfilePic ? { uri: storedProfilePic } : DEFAULT_IMAGES.user,
  };

  const handleBuyPress = () => {
    // Open the trade modal
    setShowTradeModal(true);
  };

  const handleArrowPress = () => {
    // Custom handler if provided
    if (onArrowPress) {
      onArrowPress();
      return; // Don't open portfolio modal if custom handler is provided
    }

    // Open portfolio modal
    setShowPortfolioModal(true);
  };

  const handleSelectAsset = (asset: AssetItem) => {
    // Close the portfolio modal
    setShowPortfolioModal(false);

    // If onSelectAsset is provided, call it with the asset
    if (onSelectAsset) {
      onSelectAsset(asset);
    } else {
      // Default behavior (for normal BuyCard usage)
      console.log('Selected asset:', asset);
      // If it's a token, you could open the trade modal with this token
      if (asset.token_info) {
        // You could implement this logic based on your requirements
      }
    }
  };

  // Render image for the buy card
  const renderBuyCardImage = () => {
    // If we're in "Pin your coin" state and no token image, don't show an image
    if (isPinYourCoin && !tokenImage) {
      return null;
    }

    if (tokenImage) {
      if (typeof tokenImage === 'string') {
        return (
          <View style={cardStyles.imgWrapper}>
            <Image
              source={require('../../../../assets/images/SENDlogo.png')}
              style={cardStyles.imgBackground}
              resizeMode="cover"
            />
            <Image
              source={{ uri: fixImageUrl(tokenImage) }}
              style={cardStyles.img}
              resizeMode="cover"
            />
          </View>
        );
      } else {
        return (
          <Image
            source={tokenImage}
            style={cardStyles.img}
            resizeMode="cover"
          />
        );
      }
    } else {
      return null; // Don't show any image if no tokenImage is provided
    }
  };

  // Clean the token name to remove $ if present
  const cleanTokenName = tokenName.startsWith('$')
    ? tokenName.substring(1)
    : tokenName;

  // Group portfolio items by type
  const tokens = portfolio.items?.filter(item =>
    item.assetType === 'token'
  ) || [];

  const regularNfts = portfolio.items?.filter(item =>
    item.assetType === 'nft'
  ) || [];

  const compressedNfts = portfolio.items?.filter(item =>
    item.assetType === 'cnft'
  ) || [];

  const solBalance = portfolio.nativeBalance
    ? (portfolio.nativeBalance.lamports / 1000000000).toFixed(4)
    : '0';

  // Is this a "Pin your coin" state? (No token attached yet)
  const isPinYourCoin = tokenName === 'Pin your coin' || !tokenMint;

  return (
    <View style={[
      cardStyles.container,
      isPinYourCoin ? cardStyles.pinYourCoinContainer : null,
      containerStyle
    ]}>
      {/* Left section with image + name/desc */}
      <View style={cardStyles.contentContainer}>
        {renderBuyCardImage() && (
          <View style={cardStyles.imgContainer}>
            {renderBuyCardImage()}
          </View>
        )}

        <View>
          <Text
            style={{
              fontWeight: '500',
              fontSize: isPinYourCoin ? 16 : 15,
              color: isPinYourCoin ? '#1d9bf0' : '#000000',
            }}>
            {isPinYourCoin ? tokenName : `Buy $${tokenName}`}
          </Text>
          {tokenDesc ? (
            <Text style={{ fontWeight: '400', fontSize: 13, color: '#999999' }}>
              {tokenDesc}
            </Text>
          ) : (
            <Text
              style={{
                fontWeight: '400',
                fontSize: 12,
                color: '#666',
                marginTop: 4,
              }}>
              {isPinYourCoin ? description : 'Buy my Token'}
            </Text>
          )}
        </View>
      </View>

      {/* Right section: Buy button + optional arrow */}
      <View style={cardStyles.buyButtonContainer}>
        {!isPinYourCoin && (
          <TouchableOpacity style={cardStyles.buyButton} onPress={handleBuyPress}>
            <Text style={cardStyles.buyButtonText}>Buy</Text>
          </TouchableOpacity>
        )}

        {/* Only show arrow if showDownArrow is true */}
        {showDownArrow && (
          <TouchableOpacity
            style={[cardStyles.arrowButton, isPinYourCoin ? cardStyles.pinArrowButton : null]}
            onPress={handleArrowPress}
          >
            {isPinYourCoin ? (
              <>
                <Text style={cardStyles.pinButtonText}>Add Coin</Text>
              </>
            ) : (
              <Icons.Arrow />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Trade Modal */}
      {showTradeModal && (
        <TradeModal
          visible={showTradeModal}
          onClose={() => setShowTradeModal(false)}
          currentUser={currentUser}
          disableTabs={true}
          initialInputToken={{
            address: 'So11111111111111111111111111111111111111112', // SOL mint address
            symbol: 'SOL',
            name: 'Solana',
            decimals: 9,
            logoURI:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
          }}
          initialOutputToken={{
            address: tokenMint || '', // Use the token mint if provided
            symbol: cleanTokenName,
            name: description || cleanTokenName,
            decimals: 6, // Assuming most tokens use 6 decimals
            logoURI: typeof tokenImage === 'string' ? fixImageUrl(tokenImage) : '',
          }}
          initialActiveTab="TRADE_AND_SHARE"
        />
      )}

      {/* Portfolio Modal */}
      <Modal
        visible={showPortfolioModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPortfolioModal(false)}
      >
        <View style={portfolioStyles.modalContainer}>
          <View style={portfolioStyles.modalContent}>
            <View style={portfolioStyles.modalHeader}>
              <Text style={portfolioStyles.modalTitle}>
                {onSelectAsset ? "Select a Token to Pin" : "Your Portfolio"}
              </Text>
              <TouchableOpacity
                style={portfolioStyles.closeButton}
                onPress={() => setShowPortfolioModal(false)}
              >
                <Text style={portfolioStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Actions section at the top when a token is already attached */}
            {showRemoveButton && tokenMint && onSelectAsset && (
              <View style={portfolioStyles.actionsContainer}>
                <Text style={portfolioStyles.actionsText}>
                  Currently pinned: {tokenName}
                </Text>
                <TouchableOpacity
                  style={portfolioStyles.removeButton}
                  onPress={() => {
                    setShowPortfolioModal(false);
                    if (onRemoveToken) onRemoveToken();
                  }}
                >
                  <Text style={portfolioStyles.removeButtonText}>Remove Pin</Text>
                </TouchableOpacity>
                <View style={portfolioStyles.divider} />
              </View>
            )}

            {loading ? (
              <View style={portfolioStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#1d9bf0" />
                <Text style={portfolioStyles.loadingText}>Loading your assets...</Text>
              </View>
            ) : error ? (
              <View style={portfolioStyles.errorContainer}>
                <Text style={portfolioStyles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={portfolioStyles.retryButton}
                  onPress={() => {
                    // Close and reopen the modal to retry
                    setShowPortfolioModal(false);
                    setTimeout(() => setShowPortfolioModal(true), 500);
                  }}
                >
                  <Text style={portfolioStyles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : portfolio.items.length === 0 ? (
              <View style={portfolioStyles.emptyContainer}>
                <Text style={portfolioStyles.emptyText}>No assets found in this wallet.</Text>
              </View>
            ) : (
              <ScrollView style={portfolioStyles.assetsContainer}>
                {/* SOL Balance */}
                {portfolio.nativeBalance && (
                  <View style={portfolioStyles.solBalanceContainer}>
                    <Text style={portfolioStyles.solBalanceLabel}>SOL Balance</Text>
                    <Text style={portfolioStyles.solBalanceValue}>
                      {solBalance} SOL
                    </Text>
                  </View>
                )}

                {/* Token selection instructions for profile modal */}
                {onSelectAsset && (
                  <View style={portfolioStyles.instructionsContainer}>
                    <Text style={portfolioStyles.instructionsText}>
                      Select a token or NFT to pin to your profile
                    </Text>
                  </View>
                )}

                {/* Tokens Section */}
                {tokens.length > 0 && (
                  <View style={portfolioStyles.sectionContainer}>
                    <Text style={portfolioStyles.sectionTitle}>Tokens</Text>
                    <View style={portfolioStyles.tokenListContainer}>
                      {tokens.map((asset, index) => (
                        <React.Fragment key={asset.id || asset.mint}>
                          <PortfolioAssetItem
                            asset={asset}
                            onSelect={handleSelectAsset}
                          />
                          {index < tokens.length - 1 && <View style={portfolioStyles.divider} />}
                        </React.Fragment>
                      ))}
                    </View>
                  </View>
                )}

                {/* NFTs Section */}
                {regularNfts.length > 0 && (
                  <View style={portfolioStyles.sectionContainer}>
                    <Text style={portfolioStyles.sectionTitle}>NFTs</Text>
                    <View style={portfolioStyles.assetsGrid}>
                      {regularNfts.map(asset => (
                        <PortfolioAssetItem
                          key={asset.id || asset.mint}
                          asset={asset}
                          onSelect={handleSelectAsset}
                        />
                      ))}
                    </View>
                  </View>
                )}

                {/* Compressed NFTs Section */}
                {compressedNfts.length > 0 && (
                  <View style={portfolioStyles.sectionContainer}>
                    <Text style={portfolioStyles.sectionTitle}>Compressed NFTs</Text>
                    <View style={portfolioStyles.assetsGrid}>
                      {compressedNfts.map(asset => (
                        <PortfolioAssetItem
                          key={asset.id || asset.mint}
                          asset={asset}
                          onSelect={handleSelectAsset}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Combine buyCardStyles with additional styles
const cardStyles = {
  ...buyCardStyles,
  imgWrapper: {
    width: '100%' as const,
    height: '100%' as const,
    position: 'relative' as const,
  },
  imgBackground: {
    position: 'absolute' as const,
    width: '100%' as const,
    height: '100%' as const,
    opacity: 0.2,
  },
  pinYourCoinContainer: {
    borderStyle: 'dashed' as const,
    borderColor: '#1d9bf0',
    backgroundColor: 'rgba(29, 155, 240, 0.05)',
  },
  arrowButton: {
    padding: 8,
    marginLeft: 8,
  },
  pinArrowButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1d9bf0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pinButtonText: {
    color: 'white',
    fontWeight: '600' as const,
    fontSize: 14,
    marginLeft: 6,
  },
};

const portfolioStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#14171a',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: '#f7f8fa',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#657786',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#657786',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e0245e',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1d9bf0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#657786',
    textAlign: 'center',
  },
  assetsContainer: {
    flex: 1,
  },
  sectionContainer: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14171a',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  assetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  assetItem: {
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    margin: 8,
    overflow: 'hidden',
  },
  assetImageContainer: {
    height: 120,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f2f5',
  },
  assetImageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  fallbackImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.2,
  },
  assetImage: {
    width: '100%',
    height: '100%',
  },
  assetPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f7f8fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#AAB8C2',
  },
  assetDetails: {
    padding: 8,
  },
  assetName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#14171a',
    marginBottom: 2,
  },
  assetBalance: {
    fontSize: 12,
    color: '#657786',
  },
  assetCollection: {
    fontSize: 12,
    color: '#657786',
  },
  solBalanceContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f7fbfe',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  solBalanceLabel: {
    fontSize: 14,
    color: '#657786',
    marginBottom: 4,
  },
  solBalanceValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#14171a',
  },
  compressedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(29, 155, 240, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compressedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    margin: 8,
    overflow: 'hidden',
  },
  tokenLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 8,
  },
  tokenLogo: {
    width: '100%',
    height: '100%',
  },
  tokenLogoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f7f8fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenLogoPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#AAB8C2',
  },
  tokenDetails: {
    flex: 1,
  },
  tokenName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#14171a',
    marginBottom: 2,
  },
  tokenSymbol: {
    fontSize: 12,
    color: '#657786',
  },
  tokenBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenBalance: {
    fontSize: 12,
    color: '#657786',
  },
  tokenValue: {
    fontSize: 12,
    color: '#657786',
  },
  tokenListContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f2f5',
    marginLeft: 56,
  },
  actionsContainer: {
    padding: 16,
    backgroundColor: '#f7f9fa',
    marginBottom: 8,
  },
  actionsText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  removeButton: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f7f7f7',
    borderWidth: 1,
    borderColor: '#e0245e',
    borderRadius: 16,
    marginBottom: 8,
  },
  removeButtonText: {
    color: '#e0245e',
    fontSize: 14,
    fontWeight: '500',
  },
  instructionsContainer: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  instructionsText: {
    fontSize: 14,
    color: '#657786',
    fontStyle: 'italic',
  },
});

export default BuyCard;
