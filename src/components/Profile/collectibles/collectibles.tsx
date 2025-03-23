import React, {useState} from 'react';
import {
  View, 
  Image, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  RefreshControl,
  ImageBackground
} from 'react-native';
import {styles} from './collectibles.style';
import {AssetItem} from '../../../hooks/useFetchTokens';
import {fixImageUrl} from '../../../hooks/useFetchTokens';

/**
 * Represents a single NFT item
 */
export interface NftItem {
  mint: string;
  name: string;
  image: string;
  collection?: string;
}

export interface PortfolioSectionProps {
  sectionTitle: string;
  items: AssetItem[];
  onItemPress?: (item: AssetItem) => void;
  emptyMessage?: string;
  displayAsList?: boolean;
}

/**
 * Props for the Collectibles component
 */
interface CollectiblesProps {
  /**
   * The list of NFTs to display (legacy support)
   */
  nfts?: NftItem[];
  /**
   * Full portfolio data (priority over nfts if provided)
   */
  portfolioItems?: AssetItem[];
  /**
   * Native SOL balance in lamports
   */
  nativeBalance?: number;
  /**
   * An optional error message to display if there's a problem
   */
  error?: string | null;
  /**
   * Whether the list is loading
   */
  loading?: boolean;
  /**
   * Callback for refresh action
   */
  onRefresh?: () => void;
  /**
   * Whether the data is currently refreshing
   */
  refreshing?: boolean;
  /**
   * Callback when an item is pressed
   */
  onItemPress?: (item: AssetItem) => void;
}

const SOL_DECIMAL = 1000000000; // 1 SOL = 10^9 lamports

// List renderer for token items
const TokenListItem: React.FC<{
  item: AssetItem;
  onPress?: (item: AssetItem) => void;
}> = ({ item, onPress }) => {
  const imageUrl = item.image ? fixImageUrl(item.image) : '';
  
  const formattedBalance = item.token_info ? 
    parseFloat(
      (parseInt(item.token_info.balance) / Math.pow(10, item.token_info.decimals))
        .toFixed(item.token_info.decimals)
    ).toString() : '0';
  
  const tokenValue = item.token_info?.price_info?.total_price 
    ? `$${item.token_info.price_info.total_price.toFixed(2)}`
    : '';

  return (
    <TouchableOpacity 
      style={portfolioStyles.tokenListItem}
      onPress={() => onPress && onPress(item)}
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
              {item.symbol?.[0] || item.name?.[0] || '?'}
            </Text>
          </View>
        )}
      </View>
      
      {/* Token Details */}
      <View style={portfolioStyles.tokenDetails}>
        <Text style={portfolioStyles.tokenName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={portfolioStyles.tokenSymbol} numberOfLines={1}>
          {item.token_info?.symbol || item.symbol || ''}
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
};

/**
 * A component to display a group of assets of a specific type
 */
const PortfolioSection: React.FC<PortfolioSectionProps> = ({
  sectionTitle,
  items,
  onItemPress,
  emptyMessage = 'No items to display',
  displayAsList = false,
}) => {
  const { width } = Dimensions.get('window');
  const itemWidth = (width - 60) / 2; // 2 columns with some padding

  if (items.length === 0) {
    return (
      <View style={portfolioStyles.emptySection}>
        <Text style={portfolioStyles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  // Custom image renderer that handles loading and errors
  const renderAssetImage = (item: AssetItem) => {
    const imageUrl = item.image ? fixImageUrl(item.image) : '';
    
    if (!imageUrl) {
      // If no image is available, display a placeholder with the token symbol/name
      return (
        <View style={portfolioStyles.placeholderImage}>
          <Text style={portfolioStyles.placeholderText}>
            {item.symbol || item.name?.charAt(0) || '?'}
          </Text>
        </View>
      );
    }
    
    return (
      <View style={portfolioStyles.imageWrapper}>
        <Image
          source={require('../../../assets/images/SENDlogo.png')}
          style={portfolioStyles.fallbackImage}
          resizeMode="cover"
        />
        <Image
          source={{ uri: imageUrl }}
          style={portfolioStyles.image}
          resizeMode="cover"
        />
      </View>
    );
  };

  // List format for tokens
  if (displayAsList) {
    return (
      <View style={portfolioStyles.sectionContainer}>
        <Text style={portfolioStyles.sectionTitle}>{sectionTitle}</Text>
        <FlatList
          key="list"
          data={items}
          keyExtractor={item => item.id || item.mint}
          renderItem={({item}) => (
            <TokenListItem item={item} onPress={onItemPress} />
          )}
          scrollEnabled={false}
          contentContainerStyle={portfolioStyles.listContainer}
          ItemSeparatorComponent={() => <View style={portfolioStyles.separator} />}
        />
      </View>
    );
  }

  // Grid format for NFTs
  return (
    <View style={portfolioStyles.sectionContainer}>
      <Text style={portfolioStyles.sectionTitle}>{sectionTitle}</Text>
      <FlatList
        key="grid"
        data={items}
        numColumns={2}
        keyExtractor={item => item.id || item.mint}
        columnWrapperStyle={portfolioStyles.columnWrapper}
        renderItem={({item}) => (
          <TouchableOpacity 
            style={[portfolioStyles.itemContainer, {width: itemWidth}]}
            onPress={() => onItemPress && onItemPress(item)}
            activeOpacity={0.7}
          >
            <View style={portfolioStyles.imageContainer}>
              {renderAssetImage(item)}
              
              {/* Display badges for special asset types */}
              {item.compression?.compressed && (
                <View style={portfolioStyles.compressedBadge}>
                  <Text style={portfolioStyles.compressedText}>C</Text>
                </View>
              )}
              
              {/* Show token price if available */}
              {item.token_info?.price_info?.price_per_token && (
                <View style={portfolioStyles.priceBadge}>
                  <Text style={portfolioStyles.priceText}>
                    ${item.token_info.price_info.price_per_token.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={portfolioStyles.itemDetails}>
              <Text style={portfolioStyles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              
              {item.token_info ? (
                <Text style={portfolioStyles.itemBalance}>
                  {parseFloat(
                    (parseInt(item.token_info.balance) / Math.pow(10, item.token_info.decimals))
                      .toFixed(item.token_info.decimals)
                  ).toString()} {item.token_info.symbol || item.symbol}
                </Text>
              ) : item.collection?.name ? (
                <Text style={portfolioStyles.itemCollection} numberOfLines={1}>
                  {item.collection.name}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
        scrollEnabled={false}
        contentContainerStyle={portfolioStyles.gridContainer}
      />
    </View>
  );
};

/**
 * Renders a complete portfolio view with tokens, NFTs, and compressed NFTs
 */
const Collectibles: React.FC<CollectiblesProps> = ({
  nfts,
  portfolioItems,
  nativeBalance,
  error,
  loading,
  onRefresh,
  refreshing,
  onItemPress,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'tokens' | 'nfts' | 'cnfts'>('all');
  
  // Show loading state while fetching data
  if (loading) {
    return (
      <View style={portfolioStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#1d9bf0" />
        <Text style={portfolioStyles.loadingText}>Loading your portfolio...</Text>
      </View>
    );
  }
  
  // Show error state if there was a problem
  if (error) {
    return (
      <View style={portfolioStyles.errorContainer}>
        <Text style={portfolioStyles.errorText}>{error}</Text>
        {onRefresh && (
          <TouchableOpacity 
            style={portfolioStyles.retryButton}
            onPress={onRefresh}
          >
            <Text style={portfolioStyles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Convert legacy nfts to AssetItems if no portfolioItems provided
  const items = portfolioItems || (nfts ? nfts.map(nft => ({
    id: nft.mint,
    mint: nft.mint,
    name: nft.name,
    image: nft.image,
    collection: { name: nft.collection },
    interface: 'V1_NFT',
  } as AssetItem)) : []);

  // Show empty state if no assets found
  if (items.length === 0 && !nativeBalance) {
    return (
      <View style={portfolioStyles.emptyContainer}>
        <Text style={portfolioStyles.emptyText}>No assets found in this wallet.</Text>
        {onRefresh && (
          <TouchableOpacity 
            style={portfolioStyles.retryButton}
            onPress={onRefresh}
          >
            <Text style={portfolioStyles.retryText}>Refresh</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Filter items by type
  const tokens = items.filter(item => 
    item.assetType === 'token'
  );
  
  const regularNfts = items.filter(item => 
    item.assetType === 'nft'
  );
  
  const compressedNfts = items.filter(item => 
    item.assetType === 'cnft'
  );

  const solBalance = nativeBalance ? (nativeBalance / SOL_DECIMAL).toFixed(4) : '0';

  // Filter based on active tab
  const renderItems = () => {
    switch (activeTab) {
      case 'tokens':
        return tokens.length > 0 ? (
          <PortfolioSection 
            sectionTitle="Tokens" 
            items={tokens} 
            onItemPress={onItemPress}
            emptyMessage="No tokens found"
            displayAsList={true}
          />
        ) : (
          <View style={portfolioStyles.emptyTabContent}>
            <Text style={portfolioStyles.emptyTabText}>No tokens found in this wallet</Text>
          </View>
        );
        
      case 'nfts':
        return regularNfts.length > 0 ? (
          <PortfolioSection 
            sectionTitle="NFTs" 
            items={regularNfts} 
            onItemPress={onItemPress}
            emptyMessage="No NFTs found" 
            displayAsList={false}
          />
        ) : (
          <View style={portfolioStyles.emptyTabContent}>
            <Text style={portfolioStyles.emptyTabText}>No NFTs found in this wallet</Text>
          </View>
        );
        
      case 'cnfts':
        return compressedNfts.length > 0 ? (
          <PortfolioSection 
            sectionTitle="Compressed NFTs" 
            items={compressedNfts} 
            onItemPress={onItemPress}
            emptyMessage="No compressed NFTs found" 
            displayAsList={false}
          />
        ) : (
          <View style={portfolioStyles.emptyTabContent}>
            <Text style={portfolioStyles.emptyTabText}>No compressed NFTs found in this wallet</Text>
          </View>
        );
        
      case 'all':
      default:
        return (
          <>
            {/* SOL Balance Card */}
            <View style={portfolioStyles.solBalanceContainer}>
              <Text style={portfolioStyles.solBalanceLabel}>SOL Balance</Text>
              <Text style={portfolioStyles.solBalanceValue}>{solBalance} SOL</Text>
            </View>
            
            {/* Tokens Section */}
            {tokens.length > 0 && (
              <PortfolioSection 
                sectionTitle="Tokens" 
                items={tokens.slice(0, 6)} 
                onItemPress={onItemPress}
                displayAsList={true}
              />
            )}
            
            {/* NFTs Section */}
            {regularNfts.length > 0 && (
              <PortfolioSection 
                sectionTitle="NFTs" 
                items={regularNfts.slice(0, 4)} 
                onItemPress={onItemPress}
                displayAsList={false}
              />
            )}
            
            {/* Compressed NFTs Section */}
            {compressedNfts.length > 0 && (
              <PortfolioSection 
                sectionTitle="Compressed NFTs" 
                items={compressedNfts.slice(0, 4)} 
                onItemPress={onItemPress}
                displayAsList={false}
              />
            )}
            
            {/* Show a view all button if there are more items than shown */}
            {tokens.length > 6 || regularNfts.length > 4 || compressedNfts.length > 4 ? (
              <TouchableOpacity 
                style={portfolioStyles.viewAllButton}
                onPress={() => {
                  // Navigate to the category with the most items
                  if (tokens.length >= regularNfts.length && tokens.length >= compressedNfts.length) {
                    setActiveTab('tokens');
                  } else if (regularNfts.length >= compressedNfts.length) {
                    setActiveTab('nfts');
                  } else {
                    setActiveTab('cnfts');
                  }
                }}
              >
                <Text style={portfolioStyles.viewAllText}>View All Assets</Text>
              </TouchableOpacity>
            ) : null}
          </>
        );
    }
  };

  return (
    <ScrollView
      style={portfolioStyles.scrollContainer}
      contentContainerStyle={portfolioStyles.scrollContent}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing || false} 
          onRefresh={onRefresh}
          colors={['#1d9bf0']} 
          tintColor={'#1d9bf0'}
        />
      }
    >
      {/* Tabs for filtering different asset types */}
      <View style={portfolioStyles.tabContainer}>
        <TouchableOpacity
          style={[
            portfolioStyles.tab,
            activeTab === 'all' && portfolioStyles.activeTab,
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text 
            style={[
              portfolioStyles.tabText, 
              activeTab === 'all' && portfolioStyles.activeTabText
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            portfolioStyles.tab,
            activeTab === 'tokens' && portfolioStyles.activeTab,
          ]}
          onPress={() => setActiveTab('tokens')}
        >
          <Text 
            style={[
              portfolioStyles.tabText, 
              activeTab === 'tokens' && portfolioStyles.activeTabText
            ]}
          >
            Tokens
          </Text>
          {tokens.length > 0 && (
            <View style={portfolioStyles.badgeContainer}>
              <Text style={portfolioStyles.badgeText}>{tokens.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            portfolioStyles.tab,
            activeTab === 'nfts' && portfolioStyles.activeTab,
          ]}
          onPress={() => setActiveTab('nfts')}
        >
          <Text 
            style={[
              portfolioStyles.tabText, 
              activeTab === 'nfts' && portfolioStyles.activeTabText
            ]}
          >
            NFTs
          </Text>
          {regularNfts.length > 0 && (
            <View style={portfolioStyles.badgeContainer}>
              <Text style={portfolioStyles.badgeText}>{regularNfts.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            portfolioStyles.tab,
            activeTab === 'cnfts' && portfolioStyles.activeTab,
          ]}
          onPress={() => setActiveTab('cnfts')}
        >
          <Text 
            style={[
              portfolioStyles.tabText, 
              activeTab === 'cnfts' && portfolioStyles.activeTabText
            ]}
          >
            cNFTs
          </Text>
          {compressedNfts.length > 0 && (
            <View style={portfolioStyles.badgeContainer}>
              <Text style={portfolioStyles.badgeText}>{compressedNfts.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Render the appropriate content based on selected tab */}
      {renderItems()}
    </ScrollView>
  );
};

const portfolioStyles = StyleSheet.create({
  // Main container styles
  scrollContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f5f8fa',
    borderRadius: 20,
    marginHorizontal: 12,
    marginTop: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    color: '#657786',
    fontWeight: '500',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1d9bf0',
  },
  activeTabText: {
    color: '#1d9bf0',
    fontWeight: '600',
  },
  badgeContainer: {
    backgroundColor: '#1d9bf0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Token list styles
  tokenListItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tokenLogoContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenLogo: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  tokenLogoPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e1e8ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenLogoPlaceholderText: {
    color: '#657786',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tokenDetails: {
    flex: 1,
    marginLeft: 14,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#14171a',
    marginBottom: 2,
  },
  tokenSymbol: {
    fontSize: 13,
    color: '#657786',
  },
  tokenBalanceContainer: {
    alignItems: 'flex-end',
  },
  tokenBalance: {
    fontSize: 16,
    fontWeight: '500',
    color: '#14171a',
  },
  tokenValue: {
    fontSize: 13,
    color: '#1d9bf0',
    marginTop: 2,
  },
  listContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginHorizontal: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f2f5',
    marginLeft: 60,
  },
  
  // Section styles
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 12,
    color: '#14171a',
  },
  gridContainer: {
    paddingHorizontal: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  
  // Item styles
  itemContainer: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
    margin: 6,
  },
  imageContainer: {
    height: 150,
    width: '100%',
    position: 'relative',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f2f5',
  },
  imageWrapper: {
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
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#AAB8C2',
  },
  
  // Badges
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
  
  // Item details
  itemDetails: {
    padding: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14171a',
    marginBottom: 4,
  },
  itemBalance: {
    fontSize: 12,
    color: '#657786',
  },
  itemCollection: {
    fontSize: 12,
    color: '#657786',
  },
  
  // SOL Balance
  solBalanceContainer: {
    margin: 16,
    backgroundColor: '#f7fbfe',
    borderRadius: 12,
    padding: 16,
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
  
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#657786',
    textAlign: 'center',
  },
  
  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorText: {
    fontSize: 16,
    color: '#e0245e',
    textAlign: 'center',
    marginBottom: 16,
  },
  
  // Empty states
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#657786',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptySection: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTabContent: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTabText: {
    fontSize: 16,
    color: '#657786',
    textAlign: 'center',
  },
  
  // Buttons
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
  viewAllButton: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d9bf0',
  },
});

export default Collectibles;
