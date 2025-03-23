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
import {fixImageUrl} from '../../../utils/common/fixUrl';

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

/**
 * A component to display a group of assets of a specific type
 */
const PortfolioSection: React.FC<PortfolioSectionProps> = ({
  sectionTitle,
  items,
  onItemPress,
  emptyMessage = 'No items to display',
}) => {
  const { width } = Dimensions.get('window');
  const itemWidth = (width - 48) / 2; // 2 columns with some padding

  if (items.length === 0) {
    return null;
  }

  // Custom image renderer that handles loading and errors
  const renderAssetImage = (item: AssetItem) => {
    const imageUrl = item.image ? fixImageUrl(item.image) : '';
    
    if (!imageUrl) {
      return (
        <View style={portfolioStyles.placeholderImage}>
          <Text style={portfolioStyles.placeholderText}>
            {item.symbol || item.name?.charAt(0) || '?'}
          </Text>
        </View>
      );
    }
    
    return (
      <ImageBackground
        source={require('../../../assets/images/SENDlogo.png')}
        style={portfolioStyles.image}
        resizeMode="cover">
        <Image
          source={{uri: imageUrl}}
          style={portfolioStyles.image}
          resizeMode="cover"
        />
      </ImageBackground>
    );
  };

  return (
    <View style={portfolioStyles.sectionContainer}>
      <Text style={portfolioStyles.sectionTitle}>{sectionTitle}</Text>
      <FlatList
        data={items}
        numColumns={2}
        keyExtractor={item => item.id || item.mint}
        columnWrapperStyle={portfolioStyles.columnWrapper}
        renderItem={({item}) => (
          <TouchableOpacity 
            style={[portfolioStyles.itemContainer, {width: itemWidth}]}
            onPress={() => onItemPress && onItemPress(item)}
          >
            <View style={portfolioStyles.imageContainer}>
              {renderAssetImage(item)}
              
              {item.compression?.compressed && (
                <View style={portfolioStyles.compressedBadge}>
                  <Text style={portfolioStyles.compressedText}>C</Text>
                </View>
              )}
            </View>
            
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
  
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1d9bf0" />
        <Text style={styles.loadingText}>Loading portfolio...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
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

  if (items.length === 0 && !nativeBalance) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No assets found in this wallet.</Text>
      </View>
    );
  }

  // Filter items by type
  const tokens = items.filter(item => 
    item.interface === 'V1_TOKEN' || 
    item.interface === 'FungibleToken' ||
    (item.token_info && item.token_info.balance)
  );
  
  const regularNfts = items.filter(item => 
    (item.interface === 'V1_NFT' || item.interface === 'ProgrammableNFT') && 
    (!item.compression || !item.compression.compressed)
  );
  
  const compressedNfts = items.filter(item => 
    item.compression && item.compression.compressed
  );

  const solBalance = nativeBalance ? (nativeBalance / SOL_DECIMAL).toFixed(4) : '0';

  // Filter based on active tab
  const renderItems = () => {
    switch (activeTab) {
      case 'tokens':
        return (
          <>
            <PortfolioSection 
              sectionTitle="Tokens" 
              items={tokens} 
              onItemPress={onItemPress}
              emptyMessage="No tokens found" 
            />
          </>
        );
      case 'nfts':
        return (
          <PortfolioSection 
            sectionTitle="NFTs" 
            items={regularNfts} 
            onItemPress={onItemPress}
            emptyMessage="No NFTs found" 
          />
        );
      case 'cnfts':
        return (
          <PortfolioSection 
            sectionTitle="Compressed NFTs" 
            items={compressedNfts} 
            onItemPress={onItemPress}
            emptyMessage="No compressed NFTs found" 
          />
        );
      case 'all':
      default:
        return (
          <>
            <View style={portfolioStyles.solBalanceContainer}>
              <Text style={portfolioStyles.solBalanceLabel}>SOL Balance</Text>
              <Text style={portfolioStyles.solBalanceValue}>{solBalance} SOL</Text>
            </View>
            
            {tokens.length > 0 && (
              <PortfolioSection 
                sectionTitle="Tokens" 
                items={tokens.slice(0, 6)} 
                onItemPress={onItemPress}
              />
            )}
            
            {regularNfts.length > 0 && (
              <PortfolioSection 
                sectionTitle="NFTs" 
                items={regularNfts.slice(0, 6)} 
                onItemPress={onItemPress}
              />
            )}
            
            {compressedNfts.length > 0 && (
              <PortfolioSection 
                sectionTitle="Compressed NFTs" 
                items={compressedNfts.slice(0, 6)} 
                onItemPress={onItemPress}
              />
            )}
          </>
        );
    }
  };

  return (
    <ScrollView
      style={portfolioStyles.scrollContainer}
      contentContainerStyle={portfolioStyles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} />
      }
    >
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

      {renderItems()}
    </ScrollView>
  );
};

const portfolioStyles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f5f8fa',
    borderRadius: 20,
    marginHorizontal: 12,
    marginTop: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
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
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 8,
    color: '#14171a',
  },
  gridContainer: {
    paddingHorizontal: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
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
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    padding: 8,
    paddingBottom: 4,
    color: '#14171a',
  },
  itemBalance: {
    fontSize: 12,
    color: '#657786',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  itemCollection: {
    fontSize: 12,
    color: '#657786',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  solBalanceContainer: {
    margin: 16,
    backgroundColor: '#f7fbfe',
    borderRadius: 12,
    padding: 16,
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
});

export default Collectibles;
