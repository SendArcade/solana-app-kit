import React, {useState} from 'react';
import {Image, Text, TouchableOpacity, View, Animated} from 'react-native';
import {styles} from './buyCard.style';
import Icons from '../../../assets/svgs/index';
import {DEFAULT_IMAGES} from '../../../config/constants';
import TradeModal from '../../thread/trade/TradeModal';
import {useAppSelector} from '../../../hooks/useReduxHooks';
import {useAuth} from '../../../hooks/useAuth';

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
}

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
}) => {
  const [showTradeModal, setShowTradeModal] = useState(false);
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
  const userName = useAppSelector(state => state.auth.username);
  const {solanaWallet} = useAuth();

  // For simplicity, using the first connected wallet
  const userPublicKey = solanaWallet?.wallets?.[0]?.publicKey || null;

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

  // Clean the token name to remove $ if present
  const cleanTokenName = tokenName.startsWith('$')
    ? tokenName.substring(1)
    : tokenName;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Left section with image + name/desc */}
      <View style={styles.contentContainer}>
        <View style={styles.imgContainer}>
          {tokenImage ? (
            typeof tokenImage === 'string' ? (
              <Image
                source={{uri: tokenImage}}
                style={styles.img}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={tokenImage}
                style={styles.img}
                resizeMode="cover"
              />
            )
          ) : (
            <Image
              source={DEFAULT_IMAGES.communityImg}
              style={styles.img}
              resizeMode="cover"
            />
          )}
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
          <TouchableOpacity onPress={onArrowPress}>
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
            logoURI: typeof tokenImage === 'string' ? tokenImage : '',
          }}
        />
      )}
    </View>
  );
};

export default BuyCard;
