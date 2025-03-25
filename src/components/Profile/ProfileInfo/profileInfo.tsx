import React, {useState, useEffect} from 'react';
import {
  Image,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  ImageBackground,
  StyleSheet
} from 'react-native';
import {findMentioned} from '../../../utils/common/findMentioned';
import AddButton from '../addButton/addButton';
import BuyCard from '../buyCard/buyCard';
import PerksCard from '../perksCard/perksCard';
import ProfileIcons from '../../../assets/svgs/index';
import {styles} from './profileInfo.style';
import {useAppDispatch, useAppSelector} from '../../../hooks/useReduxHooks';
import {attachCoinToProfile} from '../../../state/auth/reducer';
import {HELIUS_API_KEY} from '@env';
import {tokenModalStyles} from './profileInfoTokenModal.style';
import {fixImageUrl, extractAssetImage} from '../../../utils/common/fixUrl'; // <-- We use our improved functions
import {useWallet} from '../../../hooks/useWallet';
import {useAuth} from '../../../hooks/useAuth';
import {Wallet} from '../../../state/auth/reducer';

/**
 * Represents the props for the ProfileInfo component.
 */
export interface ProfileInfoProps {
  /** The user's profile picture URL */
  profilePicUrl: string;
  /** The user's current display name */
  username: string;
  /** The user's Solana wallet address */
  userWallet: string;
  /** Whether this profile belongs to the current user (is own profile) */
  isOwnProfile: boolean;
  /** Callback when user taps the avatar image (e.g. pick a new avatar) */
  onAvatarPress?: () => void;
  /** Callback when user taps "Edit Profile" (open an edit name modal) */
  onEditProfile?: () => void;
  /** Optional short text describing the user's bio. We'll show mention highlighting. */
  bioText?: string;
  /** If the current user is following this user */
  amIFollowing?: boolean;
  /** If this user is following the current user */
  areTheyFollowingMe?: boolean;
  /** Called when we tap "Follow" or "Follow Back" */
  onFollowPress?: () => void;
  /** Called when we tap "Unfollow" */
  onUnfollowPress?: () => void;
  /** Follower count for display */
  followersCount?: number;
  /** Following count for display */
  followingCount?: number;
  /** If provided, pressing follower count triggers onPressFollowers */
  onPressFollowers?: () => void;
  /** If provided, pressing following count triggers onPressFollowing */
  onPressFollowing?: () => void;
  /**
   * Attachment data from the DB. We specifically care about:
   *  { coin?: {
   *       mint: string;
   *       symbol?: string;
   *       name?: string;
   *       image?: string;       // stored from Helius or user-provided
   *       description?: string; // user-provided description
   *  } }
   */
  attachmentData?: {
    coin?: {
      mint: string;
      symbol?: string;
      name?: string;
      image?: string;
      description?: string;
    };
  };
}

/**
 * The ProfileInfo component displays:
 * - Avatar, name, handle, bio
 * - Follower/following stats
 * - Edit/Follow button row
 * - If a coin is attached (attachmentData.coin), shows a BuyCard.
 * - If isOwnProfile, user can attach a token via the down arrow on BuyCard.
 */
const ProfileInfo: React.FC<ProfileInfoProps> = ({
  profilePicUrl,
  username,
  userWallet,
  isOwnProfile,
  onAvatarPress,
  onEditProfile,
  bioText,
  amIFollowing = false,
  areTheyFollowingMe = false,
  onFollowPress,
  onUnfollowPress,
  followersCount = 0,
  followingCount = 0,
  onPressFollowers,
  onPressFollowing,
  attachmentData = {},
}) => {
  // We'll create a short handle like '@xxxx...yyyy'
  const handleString = userWallet
    ? '@' + userWallet.slice(0, 6) + '...' + userWallet.slice(-4)
    : '@no_wallet';

  // A default or fallback bio, if none is provided
  const sampleBio =
    bioText ||
    `Hey folks! I'm ${username} building on Solana. Mention @someone to highlight.`;

  // If the user we are viewing is following me, we can display a "Follows you" badge
  const canShowFollowsYou = !isOwnProfile && areTheyFollowingMe;
  // Show the "AddButton" row only if it's not your own profile
  const canShowAddButton = !isOwnProfile;

  const dispatch = useAppDispatch();
  // Move the Redux selector to the top level of the component
  const authProvider = useAppSelector(state => state.auth.provider);
  const userId = useAppSelector(state => state.auth.userId);

  // Get wallet-related hooks
  const { wallets, address: currentWalletAddress, switchWallet, hasWallet } = useWallet();
  const { createNewWallet, setPrimaryWallet, removeWallet } = useAuth();

  // ------------------------------------------------------------------
  // (A) State for the "Attach Token" flows (now triggered by arrow press)
  // ------------------------------------------------------------------
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [fetchTokensError, setFetchTokensError] = useState<string | null>(null);

  /**
   * The "tokens" array will hold the results from Helius DAS:
   * Each item => { mintPubkey, name?: string, imageUrl?: string }
   */
  const [tokens, setAvailableTokens] = useState<
    Array<{
      mintPubkey: string;
      name?: string;
      imageUrl?: string;
      symbol?: string;
      decimals?: number;
      tokenAmount?: number;
      groupOrder?: number;
    }>
  >([]);

  // Additional states for user-provided description
  const [showAttachDetailsModal, setShowAttachDetailsModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<{
    mintPubkey: string;
    name?: string;
    imageUrl?: string;
  } | null>(null);
  const [tokenDescription, setTokenDescription] = useState('');

  // ------------------------------------------------------------------
  // (B) States for managing multiple wallets
  // ------------------------------------------------------------------
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [selectedWalletForAction, setSelectedWalletForAction] = useState<Wallet | null>(null);
  const [showWalletActionMenu, setShowWalletActionMenu] = useState(false);
  const [walletActionError, setWalletActionError] = useState<string | null>(null);

  /**
   * Open the "Attach Token" modal by fetching the user's tokens (NFT or fungible).
   */
  const handleOpenCoinModal = async () => {
    if (!isOwnProfile) return;
    setShowCoinModal(true);
    // Start fresh
    setLoadingTokens(true);
    setFetchTokensError(null);

    try {
      // Use the pre-fetched auth provider from the top-level
      console.log('Fetching assets for provider:', authProvider);

      const bodyParams = {
        jsonrpc: '2.0',
        id: 'get-assets',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: userWallet,
          page: 1,
          limit: 100,
          displayOptions: {
            showFungible: true, // get BOTH fungible tokens & NFTs
            showNativeBalance: false,
            showInscription: false,
            showZeroBalance: false,
          },
        },
      };
      
      // Use a public RPC endpoint that doesn't require auth to avoid cross-wallet issues
      const publicRpcUrl = "https://api.mainnet-beta.solana.com";
      
      try {
        // First try with Helius
        const heliusUrl = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
        const res = await fetch(heliusUrl, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(bodyParams),
        });
        
        if (!res.ok) {
          throw new Error(`Helius request failed with status ${res.status}`);
        }
        
        const data = await res.json();
        const rawItems = data?.result?.items || [];
        
        processTokenData(rawItems);
      } catch (heliusError) {
        console.error('Helius request failed, falling back to public RPC:', heliusError);
        
        // Fallback to simpler getTokenAccounts request via public RPC
        setFetchTokensError('Could not fetch all assets. Showing basic tokens only.');
        setLoadingTokens(false);
      }
    } catch (error: any) {
      console.error('Failed to fetch tokens:', error);
      setFetchTokensError(error.message || 'Failed to fetch tokens');
      setLoadingTokens(false);
    }
  };
  
  // Helper function to process token data from RPC
  const processTokenData = (rawItems: any[]) => {
    const mappedTokens: Array<{
      mintPubkey: string;
      name?: string;
      imageUrl?: string;
      symbol?: string;
      decimals?: number;
      tokenAmount?: number;
      groupOrder?: number;
    }> = [];

    // Map Helius data to our format
    for (const item of rawItems) {
      if (item.id) {
        try {
          // Group to show fungibles first, then NFTs
          const isFungible = 
            item.interface === 'FungibleToken' || 
            item.token_info?.symbol || 
            false;
          const groupOrder = isFungible ? 0 : 1;

          // Extract the best available image
          const imageUrl = extractAssetImage(item);

          mappedTokens.push({
            mintPubkey: item.id,
            name: item.content?.metadata?.name || item.token_info?.symbol || 'Unknown',
            symbol: item.token_info?.symbol || item.content?.metadata?.symbol,
            decimals: item.token_info?.decimals,
            imageUrl: imageUrl,
            tokenAmount: item.token_info ? parseFloat(item.token_info.balance) / 10 ** (item.token_info.decimals || 0) : 1,
            groupOrder,
          });
        } catch (e) {
          console.warn('Error processing token', item.id, e);
        }
      }
    }

    // Sort: fungibles first, then NFTs, then by name
    mappedTokens.sort((a, b) => {
      if ((a.groupOrder || 0) !== (b.groupOrder || 0)) return (a.groupOrder || 0) - (b.groupOrder || 0);
      return (a.name || '').localeCompare(b.name || '');
    });

    setAvailableTokens(mappedTokens);
    setLoadingTokens(false);
  };

  /**
   * Handle user selection => open "attach details" modal
   */
  const handleSelectToken = (tokenItem: {
    mintPubkey: string;
    name?: string;
    imageUrl?: string;
  }) => {
    setSelectedToken(tokenItem);
    setShowCoinModal(false);
    setTokenDescription('');
    setShowAttachDetailsModal(true);
  };

  /**
   * user final confirm => attach coin => store image & user description
   */
  const handleAttachCoinConfirm = async () => {
    if (!selectedToken || !isOwnProfile) {
      setShowAttachDetailsModal(false);
      return;
    }
    const {mintPubkey, name, imageUrl} = selectedToken;

    const coinData = {
      mint: mintPubkey,
      symbol: name || 'MyToken',
      name: name || 'MyToken',
      image: imageUrl || '',
      description: tokenDescription.trim(),
    };

    try {
      await dispatch(
        attachCoinToProfile({
          userId: userWallet,
          attachmentData: {coin: coinData},
        }),
      ).unwrap();
      Alert.alert(
        'Success',
        'Token attached/updated with fetched image + your description!',
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to attach coin');
    } finally {
      setShowAttachDetailsModal(false);
    }
  };
  
  // Custom image renderer for tokens in the selection modal
  const renderTokenImage = (imageUrl: string) => {
    if (!imageUrl) {
      return (
        <View
          style={[
            tokenModalStyles.tokenItemImage,
            {
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#eee',
            },
          ]}>
          <Text style={{fontSize: 10, color: '#999'}}>
            No Img
          </Text>
        </View>
      );
    }
    
    const fixedUrl = fixImageUrl(imageUrl);
    
    return (
      <ImageBackground
        source={require('../../../assets/images/SENDlogo.png')}
        style={tokenModalStyles.tokenItemImage}>
        <Image
          source={{uri: fixedUrl}}
          style={tokenModalStyles.tokenItemImage}
          resizeMode="cover"
          onError={e =>
            console.log(
              'Image load error:',
              e.nativeEvent.error,
              'for URL:',
              fixedUrl,
            )
          }
        />
      </ImageBackground>
    );
  };

  // ------------------------------------------------------------------
  // (C) Functions for managing multiple wallets
  // ------------------------------------------------------------------
  
  // Open the wallet management modal
  const handleOpenWalletModal = () => {
    if (!isOwnProfile) return;
    setShowWalletModal(true);
  };

  // Switch between wallets
  const handleSwitchWallet = (wallet: Wallet) => {
    if (!isOwnProfile) return;
    
    if (hasWallet(wallet.wallet_address)) {
      switchWallet(wallet.wallet_address);
      setShowWalletModal(false);
    } else {
      Alert.alert('Error', 'Wallet not found');
    }
  };

  // Create a new wallet
  const handleCreateNewWallet = async () => {
    if (!isOwnProfile || !userId) return;
    
    // Validate name
    if (!newWalletName.trim()) {
      setWalletActionError('Please enter a wallet name');
      return;
    }
    
    try {
      setIsCreatingWallet(true);
      setWalletActionError(null);
      
      // Call function from useAuth
      const newWallet = await createNewWallet(newWalletName);
      
      // Reset form and close modal
      setNewWalletName('');
      setShowAddWalletModal(false);
      setShowWalletModal(true); // Return to wallet list
      
      if (newWallet) {
        Alert.alert('Success', 'New wallet created successfully!');
      }
    } catch (error: any) {
      setWalletActionError(error.message || 'Failed to create wallet');
    } finally {
      setIsCreatingWallet(false);
    }
  };

  // Open wallet action menu for a specific wallet
  const handleOpenWalletActionMenu = (wallet: Wallet) => {
    setSelectedWalletForAction(wallet);
    setShowWalletActionMenu(true);
  };

  // Set the selected wallet as primary
  const handleSetPrimaryWallet = async () => {
    if (!selectedWalletForAction || !userId) return;
    
    try {
      await setPrimaryWallet(selectedWalletForAction.wallet_address);
      setShowWalletActionMenu(false);
      setSelectedWalletForAction(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to set wallet as primary');
    }
  };

  // Remove the selected wallet
  const handleRemoveWallet = async () => {
    if (!selectedWalletForAction || !userId) return;
    
    // Don't allow removing the last wallet
    if (wallets.length <= 1) {
      Alert.alert('Error', 'Cannot remove the only wallet');
      setShowWalletActionMenu(false);
      setSelectedWalletForAction(null);
      return;
    }
    
    // Confirm removal
    Alert.alert(
      'Remove Wallet',
      'Are you sure you want to remove this wallet? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setShowWalletActionMenu(false);
            setSelectedWalletForAction(null);
          },
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeWallet(selectedWalletForAction.wallet_address);
              setShowWalletActionMenu(false);
              setSelectedWalletForAction(null);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove wallet');
            }
          },
        },
      ]
    );
  };

  // Get a shorter version of the wallet address for display
  const getShortenedAddress = (address: string) => {
    return address.slice(0, 6) + '...' + address.slice(-4);
  };

  // Get correct style for a wallet item based on whether it's the current wallet
  const getWalletItemStyle = (walletAddress: string) => {
    const isCurrentWallet = walletAddress === currentWalletAddress;
    return {
      ...walletStyles.walletItem,
      backgroundColor: isCurrentWallet ? '#e0f7fa' : '#ffffff',
      borderColor: isCurrentWallet ? '#1d9bf0' : '#eeeeee',
    };
  };

  return (
    <View style={styles.profileInfo}>
      {/* Row with avatar & name */}
      <View style={{flexDirection: 'row', gap: 12, alignItems: 'center'}}>
        <TouchableOpacity
          style={styles.profImgContainer}
          onPress={onAvatarPress}
          disabled={!isOwnProfile}>
          <Image
            style={styles.profImg}
            source={
              profilePicUrl
                ? {uri: profilePicUrl}
                : require('../../../assets/images/User.png')
            }
          />
        </TouchableOpacity>

        <View>
          <View style={{flexDirection: 'row', gap: 4, alignItems: 'center'}}>
            <Text style={{fontSize: 18, fontWeight: '600', lineHeight: 22}}>
              {username}
            </Text>
            <ProfileIcons.SubscriptionTick />
          </View>

          <View style={{flexDirection: 'row', gap: 12, marginTop: 4}}>
            <TouchableOpacity 
              style={walletStyles.walletSelector}
              onPress={handleOpenWalletModal}
              disabled={!isOwnProfile}>
              <Text style={{fontSize: 12, fontWeight: '500', color: '#999999'}}>
                {handleString}
              </Text>
              {isOwnProfile && (
                <Text style={walletStyles.dropdownIcon}>▼</Text>
              )}
            </TouchableOpacity>
            {canShowFollowsYou && (
              <Text
                style={{
                  backgroundColor: '#F6F7F9',
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  paddingVertical: 4,
                  fontSize: 12,
                  fontWeight: '500',
                  textAlign: 'left',
                  color: '#999999',
                }}>
                Follows you
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Short bio */}
      <View style={{marginTop: 8}}>
        <Text style={styles.bioSection}>{findMentioned(sampleBio)}</Text>
      </View>

      {/* Follower/following row */}
      <View style={{flexDirection: 'row', gap: 12, marginTop: 8}}>
        <TouchableOpacity
          style={{flexDirection: 'row', gap: 2}}
          onPress={onPressFollowers}>
          <Text style={{fontSize: 12, fontWeight: '600'}}>
            {followersCount}
          </Text>
          <Text style={{fontSize: 12, fontWeight: '500', color: '#B7B7B7'}}>
            Followers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{flexDirection: 'row', gap: 2}}
          onPress={onPressFollowing}>
          <Text style={{fontSize: 12, fontWeight: '600'}}>
            {followingCount}
          </Text>
          <Text style={{fontSize: 12, fontWeight: '500', color: '#B7B7B7'}}>
            Following
          </Text>
        </TouchableOpacity>

        <View style={{flexDirection: 'row', gap: 2}}>
          <ProfileIcons.PinLocation />
          <Text style={{fontSize: 12, fontWeight: '500', color: '#B7B7B7'}}>
            Global
          </Text>
        </View>
      </View>

      {/* If it's your own profile, show wallet count indicator */}
      {isOwnProfile && (
        <View style={{marginTop: 4, flexDirection: 'row', gap: 8, alignItems: 'center'}}>
          <Text style={{fontSize: 12, fontWeight: '500', color: '#666'}}>
            {wallets.length} Wallet{wallets.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            style={walletStyles.addWalletButton}
            onPress={() => {
              setShowAddWalletModal(true);
              setShowWalletModal(false);
              setNewWalletName('');
              setWalletActionError(null);
            }}>
            <Text style={walletStyles.addWalletButtonText}>+ Add Wallet</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Edit profile if it's your profile */}
      {isOwnProfile && (
        <View style={{marginTop: 8, flexDirection: 'row', gap: 12}}>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={onEditProfile}>
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* If there's a coin attached, show BuyCard with user-provided + fetched data */}
      {/* Else we can show a default "BuyCard" or no card at all. */}
      <View style={{marginTop: 12}}>
        <BuyCard
          tokenName={attachmentData.coin?.symbol || '$Coin'}
          description={attachmentData.coin?.name || 'Creator Coin'}
          tokenImage={attachmentData.coin?.image || null}
          tokenDesc={attachmentData.coin?.description || ''}
          onBuyPress={() => {}}
          tokenMint={attachmentData.coin?.mint}
          /**
           * Show the arrow only if isOwnProfile is true => user can change attached token
           * On arrow press => open the modal
           */
          showDownArrow={isOwnProfile}
          onArrowPress={handleOpenCoinModal}
        />
      </View>

      {/* Show follow/unfollow if it's not your own profile */}
      {canShowAddButton && (
        <View style={{marginTop: 12}}>
          <AddButton
            amIFollowing={amIFollowing}
            areTheyFollowingMe={areTheyFollowingMe}
            onPressFollow={onFollowPress || (() => {})}
            onPressUnfollow={onUnfollowPress || (() => {})}
            recipientAddress={userWallet}
          />
        </View>
      )}

      {/* 1) Helius token selection modal */}
      <Modal
        transparent
        visible={showCoinModal}
        animationType="fade"
        onRequestClose={() => setShowCoinModal(false)}>
        <View style={tokenModalStyles.overlay}>
          <View style={tokenModalStyles.container}>
            <View style={tokenModalStyles.headerRow}>
              <Text style={tokenModalStyles.headerTitle}>Select a Token</Text>
              <TouchableOpacity
                style={tokenModalStyles.closeButton}
                onPress={() => setShowCoinModal(false)}>
                <Text style={tokenModalStyles.closeButtonText}>X</Text>
              </TouchableOpacity>
            </View>

            {/* LOADING or ERROR states */}
            {loadingTokens && (
              <View style={{marginTop: 8, alignItems: 'center'}}>
                <ActivityIndicator size="small" color="#999" />
                <Text style={tokenModalStyles.loadingText}>
                  Loading tokens from Helius...
                </Text>
              </View>
            )}
            {fetchTokensError && !loadingTokens && (
              <Text style={tokenModalStyles.errorText}>{fetchTokensError}</Text>
            )}

            {/* LIST of tokens */}
            {!loadingTokens &&
              !fetchTokensError &&
              tokens &&
              tokens.length > 0 && (
                <FlatList
                  data={tokens}
                  keyExtractor={item => item.mintPubkey}
                  style={tokenModalStyles.listContainer}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={tokenModalStyles.tokenItem}
                      onPress={() => handleSelectToken(item)}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        {renderTokenImage(item.imageUrl || '')}

                        <View style={tokenModalStyles.tokenInfo}>
                          <Text style={tokenModalStyles.tokenName}>
                            {item.name}
                          </Text>
                          <Text
                            style={tokenModalStyles.tokenMint}
                            numberOfLines={1}>
                            Mint: {item.mintPubkey}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}

            {/* If tokens array is empty */}
            {!loadingTokens &&
              !fetchTokensError &&
              tokens &&
              tokens.length === 0 && (
                <Text style={tokenModalStyles.emptyText}>
                  No tokens found in Helius data.
                </Text>
              )}
          </View>
        </View>
      </Modal>

      {/* 2) Attach details (custom description) modal */}
      <Modal
        animationType="slide"
        transparent
        visible={showAttachDetailsModal}
        onRequestClose={() => setShowAttachDetailsModal(false)}>
        <View style={tokenModalStyles.overlay}>
          <View style={tokenModalStyles.container}>
            <View style={tokenModalStyles.headerRow}>
              <Text style={tokenModalStyles.headerTitle}>Token Details</Text>
              <TouchableOpacity
                style={tokenModalStyles.closeButton}
                onPress={() => setShowAttachDetailsModal(false)}>
                <Text style={tokenModalStyles.closeButtonText}>X</Text>
              </TouchableOpacity>
            </View>

            <View style={{marginVertical: 8}}>
              <Text style={{fontSize: 14, fontWeight: '600'}}>
                Description:
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 8,
                  padding: 8,
                  marginTop: 4,
                }}
                placeholder="Write a short token description"
                value={tokenDescription}
                onChangeText={setTokenDescription}
                multiline
              />
            </View>

            <View style={{flexDirection: 'row', marginTop: 16}}>
              <TouchableOpacity
                style={[
                  tokenModalStyles.closeButton,
                  {backgroundColor: '#aaa', marginRight: 8},
                ]}
                onPress={() => setShowAttachDetailsModal(false)}>
                <Text style={tokenModalStyles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  tokenModalStyles.closeButton,
                  {backgroundColor: '#1d9bf0'},
                ]}
                onPress={handleAttachCoinConfirm}>
                <Text style={tokenModalStyles.closeButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3) Wallet Management Modal */}
      <Modal
        transparent
        visible={showWalletModal}
        animationType="slide"
        onRequestClose={() => setShowWalletModal(false)}>
        <View style={walletStyles.overlay}>
          <View style={walletStyles.container}>
            <View style={walletStyles.headerRow}>
              <Text style={walletStyles.headerTitle}>My Wallets</Text>
              <TouchableOpacity
                style={walletStyles.closeButton}
                onPress={() => setShowWalletModal(false)}>
                <Text style={walletStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={wallets}
              keyExtractor={item => item.wallet_address}
              style={walletStyles.listContainer}
              renderItem={({item}) => (
                <View style={getWalletItemStyle(item.wallet_address)}>
                  <TouchableOpacity
                    style={walletStyles.walletItemMain}
                    onPress={() => handleSwitchWallet(item)}>
                    <View>
                      <Text style={walletStyles.walletName}>{item.name}</Text>
                      <Text style={walletStyles.walletAddress}>
                        {getShortenedAddress(item.wallet_address)}
                      </Text>
                      {item.is_primary && (
                        <View style={walletStyles.primaryBadge}>
                          <Text style={walletStyles.primaryBadgeText}>Primary</Text>
                        </View>
                      )}
                    </View>
                    <Text style={walletStyles.walletProvider}>
                      {item.provider.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={walletStyles.walletActionButton}
                    onPress={() => handleOpenWalletActionMenu(item)}>
                    <Text style={walletStyles.walletActionButtonText}>⋮</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={walletStyles.emptyText}>No wallets found</Text>
              }
            />

            <TouchableOpacity
              style={walletStyles.addButton}
              onPress={() => {
                setShowAddWalletModal(true);
                setShowWalletModal(false);
                setNewWalletName('');
                setWalletActionError(null);
              }}>
              <Text style={walletStyles.addButtonText}>+ Add New Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 4) Add Wallet Modal */}
      <Modal
        transparent
        visible={showAddWalletModal}
        animationType="slide"
        onRequestClose={() => {
          setShowAddWalletModal(false);
          setShowWalletModal(true);
        }}>
        <View style={walletStyles.overlay}>
          <View style={walletStyles.container}>
            <View style={walletStyles.headerRow}>
              <Text style={walletStyles.headerTitle}>Create New Wallet</Text>
              <TouchableOpacity
                style={walletStyles.closeButton}
                onPress={() => {
                  setShowAddWalletModal(false);
                  setShowWalletModal(true);
                }}>
                <Text style={walletStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{marginVertical: 16}}>
              <Text style={walletStyles.inputLabel}>Wallet Name</Text>
              <TextInput
                style={walletStyles.input}
                placeholder="Enter wallet name"
                value={newWalletName}
                onChangeText={setNewWalletName}
              />
              {walletActionError && (
                <Text style={walletStyles.errorText}>{walletActionError}</Text>
              )}
            </View>

            <TouchableOpacity
              style={walletStyles.createButton}
              onPress={handleCreateNewWallet}
              disabled={isCreatingWallet}>
              {isCreatingWallet ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={walletStyles.createButtonText}>Create Wallet</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={walletStyles.cancelButton}
              onPress={() => {
                setShowAddWalletModal(false);
                setShowWalletModal(true);
              }}
              disabled={isCreatingWallet}>
              <Text style={walletStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 5) Wallet Action Menu */}
      <Modal
        transparent
        visible={showWalletActionMenu}
        animationType="fade"
        onRequestClose={() => {
          setShowWalletActionMenu(false);
          setSelectedWalletForAction(null);
        }}>
        <TouchableOpacity
          style={walletStyles.actionMenuOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowWalletActionMenu(false);
            setSelectedWalletForAction(null);
          }}>
          <View 
            style={walletStyles.actionMenuContainer}
            // This prevents the modal from closing when clicking inside the menu
            onStartShouldSetResponder={() => true}>
            <Text style={walletStyles.actionMenuTitle}>
              Wallet Actions
            </Text>
            
            {selectedWalletForAction && !selectedWalletForAction.is_primary && (
              <TouchableOpacity
                style={walletStyles.actionMenuItem}
                onPress={handleSetPrimaryWallet}>
                <Text style={walletStyles.actionMenuItemText}>Set as Primary</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[walletStyles.actionMenuItem, {borderBottomWidth: 0}]}
              onPress={handleRemoveWallet}>
              <Text style={[walletStyles.actionMenuItemText, {color: '#ff3b30'}]}>
                Remove Wallet
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Add styles for the wallet-related UI
const walletStyles = StyleSheet.create({
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dropdownIcon: {
    fontSize: 8,
    color: '#999999',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  listContainer: {
    marginVertical: 8,
    maxHeight: 300,
  },
  walletItem: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletItemMain: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
  },
  walletAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  walletProvider: {
    fontSize: 12,
    color: '#888',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  walletActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  walletActionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  addButton: {
    backgroundColor: '#1d9bf0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  primaryBadge: {
    backgroundColor: '#e1f5fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  primaryBadgeText: {
    fontSize: 10,
    color: '#0277bd',
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  errorText: {
    color: '#ff3b30',
    marginTop: 4,
    fontSize: 12,
  },
  createButton: {
    backgroundColor: '#1d9bf0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionMenuContainer: {
    width: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionMenuTitle: {
    fontSize: 16,
    fontWeight: '600',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    textAlign: 'center',
  },
  actionMenuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionMenuItemText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  addWalletButton: {
    backgroundColor: '#e0f7fa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  addWalletButtonText: {
    fontSize: 12,
    color: '#0277bd',
    fontWeight: '500',
  },
});

export default ProfileInfo;
