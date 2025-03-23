import React, {useState} from 'react';
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
import {styles} from './buyCard.style';
import Icons from '../../../assets/svgs/index';
import {DEFAULT_IMAGES} from '../../../config/constants';
import TradeModal from '../../thread/trade/TradeModal';
import {useAppSelector} from '../../../hooks/useReduxHooks';
import {useAuth} from '../../../hooks/useAuth';
import {AssetItem, useFetchPortfolio} from '../../../hooks/useFetchTokens';
import {fixImageUrl} from '../../../utils/common/fixUrl';

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
}

// Portfolio asset item display
const PortfolioAssetItem: React.FC<{
  asset: AssetItem;
  onSelect?: (asset: AssetItem) => void;
}> = ({asset, onSelect}) => {
  const {width} = Dimensions.get('window');
  const itemWidth = (width - 48) / 2;
  
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
      <ImageBackground
        source={require("../../../assets/images/SENDlogo.png")}
        style={portfolioStyles.assetImage}
        resizeMode="cover"
      >
        <Image
          source={{uri: imageUrl}}
          style={portfolioStyles.assetImage}
          resizeMode="cover"
        />
      </ImageBackground>
    );
  };
  
  return (
    <TouchableOpacity
      style={[portfolioStyles.assetItem, {width: itemWidth}]}
      onPress={() => onSelect && onSelect(asset)}
    >
      <View style={portfolioStyles.assetImageContainer}>
        {renderAssetImage()}
        
        {asset.compression?.compressed && (
          <View style={portfolioStyles.compressedBadge}>
            <Text style={portfolioStyles.compressedText}>C</Text>
          </View>
        )}
      </View>
      <Text style={portfolioStyles.assetName} numberOfLines={1}>
        {asset.name}
      </Text>
      {asset.token_info ? (
        <Text style={portfolioStyles.assetBalance}>
          {parseFloat(
            (parseInt(asset.token_info.balance) / 
             Math.pow(10, asset.token_info.decimals))
              .toFixed(asset.token_info.decimals)
          ).toString()} {asset.token_info.symbol || asset.symbol}
        </Text>
      ) : null}
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
}) => {
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
  const userName = useAppSelector(state => state.auth.username);
  const {solanaWallet} = useAuth();

  // For simplicity, using the first connected wallet
  const userPublicKey = solanaWallet?.wallets?.[0]?.publicKey || null;
  const effectiveWalletAddress = walletAddress || userPublicKey?.toString();
  
  // Fetch portfolio data when needed
  const {portfolio, loading, error} = useFetchPortfolio(
    showPortfolioModal ? effectiveWalletAddress : undefined
  );

  const currentUser = {
    id: userPublicKey || 'anonymous-user',
    username: userName || 'Anonymous',
    handle: userPublicKey
      ? '@' + userPublicKey.slice(0, 6) + '...' + userPublicKey.slice(-4)
      : '@anonymous',
    verified: true,
    avatar: storedProfilePic ? {uri: storedProfilePic} : DEFAULT_IMAGES.user,
  };

  const handleBuyPress = () => {
    // Open the trade modal
    setShowTradeModal(true);
  };
  
  const handleArrowPress = () => {
    // Custom handler if provided
    if (onArrowPress) {
      onArrowPress();
      return;
    }
    
    // Otherwise, show portfolio modal
    setShowPortfolioModal(true);
  };
  
  const handleSelectAsset = (asset: AssetItem) => {
    // Here you can add logic to select an asset from portfolio
    console.log('Selected asset:', asset);
    setShowPortfolioModal(false);
    
    // If it's a token, you could open the trade modal with this token
    if (asset.token_info) {
      // You could implement this logic based on your requirements
    }
  };

  // Render image for the buy card
  const renderBuyCardImage = () => {
    if (tokenImage) {
      if (typeof tokenImage === 'string') {
        return (
          <Image
            source={{uri: fixImageUrl(tokenImage)}}
            style={styles.img}
            resizeMode="cover"
          />
        );
      } else {
        return (
          <Image
            source={tokenImage}
            style={styles.img}
            resizeMode="cover"
          />
        );
      }
    } else {
      return (
        <Image
          source={DEFAULT_IMAGES.user5}
          style={styles.img}
          resizeMode="cover"
        />
      );
    }
  };

  // Clean the token name to remove $ if present
  const cleanTokenName = tokenName.startsWith('$')
    ? tokenName.substring(1)
    : tokenName;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Left section with image + name/desc */}
      <View style={styles.contentContainer}>
        <View style={styles.imgContainer}>
          {renderBuyCardImage()}
        </View>

        <View>
          <Text
            style={{
              fontWeight: '500',
              fontSize: 15,
            }}>{`Buy $${tokenName}`}</Text>
          {tokenDesc ? (
            <Text style={{fontWeight: '400', fontSize: 13, color: '#999999'}}>
              {tokenDesc}
            </Text>
          ) : (
            <Text
              style={{
                fontWeight: '400',
                fontSize: 12,
                color: '#333',
                marginTop: 4,
              }}>
              Buy my Token
            </Text>
          )}
        </View>
      </View>

      {/* Right section: Buy button + optional arrow */}
      <View style={styles.buyButtonContainer}>
        <TouchableOpacity style={styles.buyButton} onPress={handleBuyPress}>
          <Text style={styles.buyButtonText}>Buy</Text>
        </TouchableOpacity>

        {/* Only show arrow if showDownArrow is true */}
        {showDownArrow && (
          <TouchableOpacity onPress={handleArrowPress}>
            <Icons.Arrow />
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
              <Text style={portfolioStyles.modalTitle}>Portfolio</Text>
              <TouchableOpacity
                style={portfolioStyles.closeButton}
                onPress={() => setShowPortfolioModal(false)}
              >
                <Text style={portfolioStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <View style={portfolioStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#1d9bf0" />
                <Text style={portfolioStyles.loadingText}>Loading portfolio...</Text>
              </View>
            ) : error ? (
              <View style={portfolioStyles.errorContainer}>
                <Text style={portfolioStyles.errorText}>{error}</Text>
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
                      {(portfolio.nativeBalance.lamports / 1000000000).toFixed(4)} SOL
                    </Text>
                  </View>
                )}
                
                {/* Tokens Section */}
                {portfolio.items.filter(item => 
                  item.interface === 'V1_TOKEN' || 
                  item.interface === 'FungibleToken' ||
                  item.token_info
                ).length > 0 && (
                  <View style={portfolioStyles.sectionContainer}>
                    <Text style={portfolioStyles.sectionTitle}>Tokens</Text>
                    <View style={portfolioStyles.assetsGrid}>
                      {portfolio.items
                        .filter(item => 
                          item.interface === 'V1_TOKEN' || 
                          item.interface === 'FungibleToken' ||
                          item.token_info
                        )
                        .map(asset => (
                          <PortfolioAssetItem 
                            key={asset.id || asset.mint} 
                            asset={asset} 
                            onSelect={handleSelectAsset}
                          />
                        ))}
                    </View>
                  </View>
                )}
                
                {/* NFTs Section */}
                {portfolio.items.filter(item => 
                  (item.interface === 'V1_NFT' || item.interface === 'ProgrammableNFT') && 
                  (!item.compression || !item.compression.compressed)
                ).length > 0 && (
                  <View style={portfolioStyles.sectionContainer}>
                    <Text style={portfolioStyles.sectionTitle}>NFTs</Text>
                    <View style={portfolioStyles.assetsGrid}>
                      {portfolio.items
                        .filter(item => 
                          (item.interface === 'V1_NFT' || item.interface === 'ProgrammableNFT') && 
                          (!item.compression || !item.compression.compressed)
                        )
                        .map(asset => (
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
                {portfolio.items.filter(item => 
                  item.compression && item.compression.compressed
                ).length > 0 && (
                  <View style={portfolioStyles.sectionContainer}>
                    <Text style={portfolioStyles.sectionTitle}>Compressed NFTs</Text>
                    <View style={portfolioStyles.assetsGrid}>
                      {portfolio.items
                        .filter(item => item.compression && item.compression.compressed)
                        .map(asset => (
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
    marginTop: 10,
    fontSize: 16,
    color: '#657786',
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
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14171a',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  assetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  assetItem: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    margin: 8,
  },
  assetImageContainer: {
    height: 120,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
    backgroundColor: '#f0f2f5',
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
  solBalanceContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f7fbfe',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
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
});

export default BuyCard;
