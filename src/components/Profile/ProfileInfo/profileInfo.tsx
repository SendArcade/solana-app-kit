import React, { useState } from 'react';
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
} from 'react-native';
import { findMentioned } from '../../../utils/common/findMentioned';
import AddButton from '../addButton/addButton';
import BuyCard from '../buyCard/buyCard';
import PerksCard from '../perksCard/perksCard';
import ProfileIcons from '../../../assets/svgs/index';
import { styles } from './profileInfo.style';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import { attachCoinToProfile, removeAttachedCoin } from '../../../state/auth/reducer';
import { HELIUS_API_KEY } from '@env';
import { tokenModalStyles } from './profileInfoTokenModal.style';
import { fixImageUrl, extractAssetImage } from '../../../utils/common/fixUrl'; // <-- We use our improved functions

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

  // ------------------------------------------------------------------
  // (A) State for the "Attach Token" flows
  // ------------------------------------------------------------------
  const [tokenDescription, setTokenDescription] = useState('');
  const [showAttachDetailsModal, setShowAttachDetailsModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<{
    mintPubkey: string;
    name?: string;
    imageUrl?: string;
    symbol?: string;
  } | null>(null);

  /**
   * user final confirm => attach coin => store image & user description
   */
  const handleAttachCoinConfirm = async () => {
    if (!selectedToken || !isOwnProfile) {
      setShowAttachDetailsModal(false);
      return;
    }
    const { mintPubkey, name, imageUrl, symbol } = selectedToken;

    const coinData = {
      mint: mintPubkey,
      symbol: symbol || name || 'MyToken',
      name: name || 'MyToken',
      image: imageUrl || '',
      description: tokenDescription.trim(),
    };

    try {
      await dispatch(
        attachCoinToProfile({
          userId: userWallet,
          attachmentData: { coin: coinData },
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

  /**
   * Handle token selection from the portfolio modal
   */
  const handleSelectToken = (token: any) => {
    setSelectedToken({
      mintPubkey: token.id || token.mint,
      name: token.name || 'Unknown',
      imageUrl: token.image || '',
      symbol: token.symbol || token.token_info?.symbol,
    });
    setTokenDescription('');
    setShowAttachDetailsModal(true);
  };

  /**
   * Remove the attached coin
   */
  const handleRemoveCoin = async () => {
    if (!isOwnProfile) return;
    
    Alert.alert(
      'Remove Coin',
      'Are you sure you want to remove the attached coin?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(
                removeAttachedCoin({
                  userId: userWallet,
                }),
              ).unwrap();
              Alert.alert('Success', 'Coin removed from your profile');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove coin');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.profileInfo}>
      {/* Row with avatar & name */}
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <TouchableOpacity
          style={styles.profImgContainer}
          onPress={onAvatarPress}
          disabled={!isOwnProfile}>
          <Image
            style={styles.profImg}
            source={
              profilePicUrl
                ? { uri: profilePicUrl }
                : require('../../../assets/images/User.png')
            }
          />
        </TouchableOpacity>

        <View>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', lineHeight: 22 }}>
              {username}
            </Text>
            <ProfileIcons.SubscriptionTick />
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#999999' }}>
              {handleString}
            </Text>
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
      <View style={{ marginTop: 8 }}>
        <Text style={styles.bioSection}>{findMentioned(sampleBio)}</Text>
      </View>

      {/* Follower/following row */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', gap: 2 }}
          onPress={onPressFollowers}>
          <Text style={{ fontSize: 12, fontWeight: '600' }}>
            {followersCount}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#B7B7B7' }}>
            Followers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flexDirection: 'row', gap: 2 }}
          onPress={onPressFollowing}>
          <Text style={{ fontSize: 12, fontWeight: '600' }}>
            {followingCount}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#B7B7B7' }}>
            Following
          </Text>
        </TouchableOpacity>

        {/* <View style={{ flexDirection: 'row', gap: 2 }}>
          <ProfileIcons.PinLocation />
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#B7B7B7' }}>
            Global
          </Text>
        </View> */}
      </View>

      {/* Edit profile if it's your profile */}
      {isOwnProfile && (
        <View style={{ marginTop: 8, flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={onEditProfile}>
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* If there's a coin attached, show BuyCard with user-provided + fetched data */}
      {/* Else we can show a default "BuyCard" or no card at all. */}
      <View style={{ marginTop: 12 }}>
        <BuyCard
          tokenName={attachmentData.coin?.symbol || 'Pin your coin'}
          description={attachmentData.coin?.name || 'Attach a token to your profile'}
          tokenImage={attachmentData.coin?.image || null}
          tokenDesc={attachmentData.coin?.description || ''}
          onBuyPress={() => { }}
          tokenMint={attachmentData.coin?.mint}
          /**
           * Show the arrow only if isOwnProfile is true => user can change attached token
           * On arrow press => open the portfolio modal directly
           */
          showDownArrow={isOwnProfile}
          onArrowPress={undefined}
          walletAddress={userWallet}
          onSelectAsset={handleSelectToken}
          showRemoveButton={isOwnProfile && !!attachmentData.coin}
          onRemoveToken={handleRemoveCoin}
        />
      </View>

      {/* If viewing someone else's profile, show perks card */}
      {/* {!isOwnProfile && (
        <View style={{marginTop: 12}}>
          <PerksCard />
        </View>
      )} */}

      {/* Show follow/unfollow if it's not your own profile */}
      {canShowAddButton && (
        <View style={{ marginTop: 12 }}>
          <AddButton
            amIFollowing={amIFollowing}
            areTheyFollowingMe={areTheyFollowingMe}
            onPressFollow={onFollowPress || (() => { })}
            onPressUnfollow={onUnfollowPress || (() => { })}
            recipientAddress={userWallet}
          />
        </View>
      )}

      {/* Details modal for token description */}
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

            <View style={{ marginVertical: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600' }}>
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

            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity
                style={[
                  tokenModalStyles.closeButton,
                  { backgroundColor: '#aaa', marginRight: 8 },
                ]}
                onPress={() => setShowAttachDetailsModal(false)}>
                <Text style={tokenModalStyles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  tokenModalStyles.closeButton,
                  { backgroundColor: '#1d9bf0' },
                ]}
                onPress={handleAttachCoinConfirm}>
                <Text style={tokenModalStyles.closeButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileInfo;
