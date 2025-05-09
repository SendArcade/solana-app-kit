import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import {
  Image,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { findMentioned } from '@/shared/utils/common/findMentioned';
import AddButton from '../addButton/addButton';
import BuyCard from '../buyCard/buyCard';
import ProfileIcons from '../../../../assets/svgs/index';
import { styles } from './UserProfileInfo.style';
import { useAppDispatch } from '@/shared/hooks/useReduxHooks';
import {
  attachCoinToProfile,
  removeAttachedCoin,
} from '@/shared/state/auth/reducer';
import { tokenModalStyles } from './profileInfoTokenModal.style';
import COLORS from '../../../../assets/colors';
import TYPOGRAPHY from '../../../../assets/typography';
import { IPFSAwareImage, getValidImageSource } from '@/shared/utils/IPFSImage';
import { UserProfileInfoProps } from '../../types/index';
import ProfileEditDrawer from '../ProfileEditDrawer';

/**
 * TokenAttachModal - Component for the token attachment modal
 */
const TokenAttachModal = memo(({
  visible,
  onClose,
  onConfirm,
  tokenDescription,
  onChangeDescription,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tokenDescription: string;
  onChangeDescription: (text: string) => void;
}) => {
  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}>
      <View style={tokenModalStyles.overlay}>
        <View style={tokenModalStyles.container}>
          <View style={tokenModalStyles.headerRow}>
            <Text style={tokenModalStyles.headerTitle}>Token Details</Text>
            <TouchableOpacity
              style={tokenModalStyles.closeButton}
              onPress={onClose}>
              <Text style={tokenModalStyles.closeButtonText}>X</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginVertical: 8 }}>
            <Text style={{ 
              fontSize: TYPOGRAPHY.size.sm, 
              fontWeight: TYPOGRAPHY.fontWeightToString(TYPOGRAPHY.semiBold),
              color: COLORS.textDark
            }}>
              Description:
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: COLORS.greyBorder,
                borderRadius: 8,
                padding: 8,
                marginTop: 4,
                color: COLORS.textDark
              }}
              placeholder="Write a short token description"
              value={tokenDescription}
              onChangeText={onChangeDescription}
              multiline
            />
          </View>

          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <TouchableOpacity
              style={[
                tokenModalStyles.closeButton,
                { backgroundColor: COLORS.greyMid, marginRight: 8 },
              ]}
              onPress={onClose}>
              <Text style={tokenModalStyles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                tokenModalStyles.closeButton,
                { backgroundColor: COLORS.brandPrimary },
              ]}
              onPress={onConfirm}>
              <Text style={tokenModalStyles.closeButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

/**
 * Bio section with memoized content
 */
const BioSection = memo(({ bioText }: { bioText: string }) => (
  <View style={{ marginTop: 8 }}>
    <Text style={styles.bioSection}>{findMentioned(bioText)}</Text>
  </View>
));

/**
 * Stats section with memoized content
 */
const StatsSection = memo(({
  followersCount,
  followingCount,
  onPressFollowers,
  onPressFollowing,
}: {
  followersCount: number;
  followingCount: number;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
}) => (
  <View style={styles.statsContainer}>
    <TouchableOpacity
      style={styles.statItem}
      onPress={onPressFollowers}>
      <Text style={styles.statCount}>
        {followersCount}
      </Text>
      <Text style={styles.statLabel}>
        Followers
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.statItem}
      onPress={onPressFollowing}>
      <Text style={styles.statCount}>
        {followingCount}
      </Text>
      <Text style={styles.statLabel}>
        Following
      </Text>
    </TouchableOpacity>
  </View>
));

/**
 * Edit Profile Button with memoized content
 */
const EditButton = memo(({ onPress, onSharePress }: { onPress?: () => void; onSharePress?: () => void }) => (
  <View style={{ marginTop: 8, width: '100%', flexDirection: 'row', gap: 12 }}>
    <TouchableOpacity
      style={[styles.editProfileBtn, { flex: 1 }]}
      onPress={onPress}>
      <Text style={styles.editProfileBtnText}>Edit Profile</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.editProfileBtn, { flex: 1 }]}
      onPress={onSharePress}>
      <Text style={styles.editProfileBtnText}>Share Profile</Text>
    </TouchableOpacity>

  </View>
));

/**
 * TokenCard section with memoized content
 */
const TokenCard = memo(({
  attachmentData,
  userWallet,
  isOwnProfile,
  onSelectToken,
  onRemoveCoin
}: {
  attachmentData: UserProfileInfoProps['attachmentData'];
  userWallet: string;
  isOwnProfile: boolean;
  onSelectToken: (token: any) => void;
  onRemoveCoin: () => void;
}) => (
  <View style={{ marginTop: 12 }}>
    <BuyCard
      tokenName={attachmentData?.coin?.symbol || 'Pin your coin'}
      description={
        attachmentData?.coin?.name || 'Attach a token to your profile'
      }
      tokenImage={attachmentData?.coin?.image || null}
      tokenDesc={attachmentData?.coin?.description || ''}
      onBuyPress={() => { }}
      tokenMint={attachmentData?.coin?.mint}
      showDownArrow={isOwnProfile}
      onArrowPress={undefined}
      walletAddress={userWallet}
      onSelectAsset={onSelectToken}
      showRemoveButton={isOwnProfile && !!attachmentData?.coin}
      onRemoveToken={onRemoveCoin}
    />
  </View>
));

/**
 * Follow button section with memoized content
 */
const FollowButton = memo(({
  amIFollowing,
  areTheyFollowingMe,
  onPressFollow,
  onPressUnfollow,
  recipientAddress
}: {
  amIFollowing?: boolean;
  areTheyFollowingMe?: boolean;
  onPressFollow?: () => void;
  onPressUnfollow?: () => void;
  recipientAddress: string;
}) => (
  <View style={{ marginTop: 12 }}>
    <AddButton
      amIFollowing={!!amIFollowing}
      areTheyFollowingMe={!!areTheyFollowingMe}
      onPressFollow={onPressFollow || (() => { })}
      onPressUnfollow={onPressUnfollow || (() => { })}
      recipientAddress={recipientAddress}
    />
  </View>
));

/**
 * ProfileHeader - Component for the profile header with avatar, name, and badges
 */
const ProfileHeader = memo(({
  profilePicUrl,
  username,
  handleString,
  showFollowsYou,
  isOwnProfile,
  onAvatarPress,
}: {
  profilePicUrl: string;
  username: string;
  handleString: string;
  showFollowsYou: boolean;
  isOwnProfile: boolean;
  onAvatarPress?: () => void;
}) => {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <TouchableOpacity
        style={styles.profImgContainer}
        onPress={onAvatarPress}
        disabled={!isOwnProfile}>
        <IPFSAwareImage
          style={styles.profImg}
          source={profilePicUrl ? getValidImageSource(profilePicUrl) : require('../../../../assets/images/User.png')}
          defaultSource={require('../../../../assets/images/User.png')}
          key={Platform.OS === 'android' ? `profile-${Date.now()}` : 'profile'}
        />
      </TouchableOpacity>

      <View>
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          <Text style={styles.username}>
            {username}
          </Text>
          <ProfileIcons.SubscriptionTick />
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
          <Text style={styles.handleText}>
            {handleString}
          </Text>
          {showFollowsYou && (
            <Text style={styles.followsBadge}>
              Follows you
            </Text>
          )}
        </View>
      </View>
    </View>
  );
});

/**
 * UserProfileInfo - The main profile info component showing:
 * - Avatar, name, handle, bio
 * - Follower/following stats
 * - Edit/Follow button row
 * - If a coin is attached (attachmentData.coin), shows a BuyCard.
 * - If isOwnProfile, user can attach a token via the down arrow on BuyCard.
 */
function UserProfileInfo({
  profilePicUrl,
  username,
  userWallet,
  isOwnProfile,
  onAvatarPress,
  onEditProfile,
  onShareProfile,
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
}: UserProfileInfoProps) {
  const dispatch = useAppDispatch();

  // Local state to handle updates
  const [localProfilePic, setLocalProfilePic] = useState(profilePicUrl);
  const [localUsername, setLocalUsername] = useState(username);
  const [localBioText, setLocalBioText] = useState(bioText);

  // Update local state when props change
  useEffect(() => {
    setLocalProfilePic(profilePicUrl);
    setLocalUsername(username);
    setLocalBioText(bioText);
  }, [profilePicUrl, username, bioText]);

  // Format wallet address as a handle
  const handleString = useMemo(() =>
    userWallet
      ? '@' + userWallet.slice(0, 6) + '...' + userWallet.slice(-4)
      : '@no_wallet',
    [userWallet]
  );

  // Default bio with username if none provided
  const sampleBio = useMemo(() =>
    localBioText ||
    `Hey folks! I'm ${localUsername} building on Solana. Mention @someone to highlight.`,
    [localBioText, localUsername]
  );

  // Conditionals for UI elements - memoized to prevent recalculations
  const canShowFollowsYou = useMemo(() =>
    !isOwnProfile && areTheyFollowingMe,
    [isOwnProfile, areTheyFollowingMe]
  );

  const canShowAddButton = useMemo(() =>
    !isOwnProfile,
    [isOwnProfile]
  );

  const showBuyCard = useMemo(() =>
    isOwnProfile || (attachmentData.coin && attachmentData.coin.mint),
    [isOwnProfile, attachmentData.coin]
  );

  // Token attachment state
  const [tokenDescription, setTokenDescription] = useState('');
  const [showAttachDetailsModal, setShowAttachDetailsModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<{
    mintPubkey: string;
    name?: string;
    imageUrl?: string;
    symbol?: string;
  } | null>(null);

  // Profile edit drawer state
  const [showEditProfileDrawer, setShowEditProfileDrawer] = useState(false);

  /**
   * Combined handler for avatar press and edit profile
   */
  const handleEditProfilePress = useCallback(() => {
    if (!isOwnProfile) return;
    setShowEditProfileDrawer(true);
  }, [isOwnProfile]);

  /**
   * Handle profile updated event
   */
  const handleProfileUpdated = useCallback((field: 'image' | 'username' | 'description') => {
    // Refresh the local state based on the field that was updated
    if (field === 'image' && onAvatarPress) {
      onAvatarPress();
    } else if ((field === 'username' || field === 'description') && onEditProfile) {
      onEditProfile();
    }
  }, [onAvatarPress, onEditProfile]);

  /**
   * Handle token selection from the portfolio modal
   */
  const handleSelectToken = useCallback((token: any) => {
    setSelectedToken({
      mintPubkey: token.id || token.mint,
      name: token.name || 'Unknown',
      imageUrl: token.image || '',
      symbol: token.symbol || token.token_info?.symbol,
    });
    setTokenDescription('');
    setShowAttachDetailsModal(true);
  }, []); // No external dependencies needed

  /**
   * Confirm token attachment and dispatch to Redux
   */
  const handleAttachCoinConfirm = useCallback(async () => {
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
  }, [selectedToken, isOwnProfile, tokenDescription, userWallet]); // dispatch is stable

  /**
   * Handle removing an attached coin
   */
  const handleRemoveCoin = useCallback(() => {
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
  }, [isOwnProfile, userWallet]); // dispatch is stable

  // Modal handlers with no dependencies
  const handleCloseModal = useCallback(() => setShowAttachDetailsModal(false), []);
  const handleDescriptionChange = useCallback((text: string) => setTokenDescription(text), []);

  return (
    <View style={styles.profileInfo}>
      {/* Profile Header with Avatar and Name */}
      <ProfileHeader
        profilePicUrl={localProfilePic}
        username={localUsername}
        handleString={handleString}
        showFollowsYou={canShowFollowsYou}
        isOwnProfile={isOwnProfile}
        onAvatarPress={handleEditProfilePress}
      />

      {/* Short bio */}
      <BioSection bioText={sampleBio} />

      {/* Follower/following stats */}
      <StatsSection
        followersCount={followersCount}
        followingCount={followingCount}
        onPressFollowers={onPressFollowers}
        onPressFollowing={onPressFollowing}
      />


      {showBuyCard && (
        <TokenCard
          attachmentData={attachmentData}
          userWallet={userWallet}
          isOwnProfile={isOwnProfile}
          onSelectToken={handleSelectToken}
          onRemoveCoin={handleRemoveCoin}
        />
      )}

      {/* Edit profile button (for own profile) */}
      {isOwnProfile && <EditButton onPress={handleEditProfilePress} onSharePress={onShareProfile} />}

      {/* BuyCard for token (own profile or if token is attached) */}


      {/* Follow/unfollow button (for other profiles) */}
      {canShowAddButton && (
        <FollowButton
          amIFollowing={amIFollowing}
          areTheyFollowingMe={areTheyFollowingMe}
          onPressFollow={onFollowPress}
          onPressUnfollow={onUnfollowPress}
          recipientAddress={userWallet}
        />
      )}

      {/* Token attachment modal */}
      <TokenAttachModal
        visible={showAttachDetailsModal}
        onClose={handleCloseModal}
        onConfirm={handleAttachCoinConfirm}
        tokenDescription={tokenDescription}
        onChangeDescription={handleDescriptionChange}
      />

      {/* Profile Edit Drawer - new unified profile editor */}
      {isOwnProfile && (
        <ProfileEditDrawer
          visible={showEditProfileDrawer}
          onClose={() => setShowEditProfileDrawer(false)}
          profileData={{
            userId: userWallet,
            profilePicUrl: localProfilePic,
            username: localUsername,
            description: localBioText || sampleBio,
          }}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </View>
  );
}

// Optimize re-renders with detailed prop comparison
function arePropsEqual(
  prevProps: UserProfileInfoProps,
  nextProps: UserProfileInfoProps,
) {
  // Fast-path for reference equality
  if (prevProps === nextProps) return true;

  // Profile data
  if (prevProps.profilePicUrl !== nextProps.profilePicUrl) return false;
  if (prevProps.username !== nextProps.username) return false;
  if (prevProps.userWallet !== nextProps.userWallet) return false;
  if (prevProps.isOwnProfile !== nextProps.isOwnProfile) return false;
  if (prevProps.bioText !== nextProps.bioText) return false;

  // Social status
  if (prevProps.amIFollowing !== nextProps.amIFollowing) return false;
  if (prevProps.areTheyFollowingMe !== nextProps.areTheyFollowingMe) return false;
  if (prevProps.followersCount !== nextProps.followersCount) return false;
  if (prevProps.followingCount !== nextProps.followingCount) return false;

  // Check attachmentData only if needed
  if (prevProps.attachmentData !== nextProps.attachmentData) {
    // If one has coin and the other doesn't
    const prevHasCoin = !!prevProps.attachmentData?.coin;
    const nextHasCoin = !!nextProps.attachmentData?.coin;
    if (prevHasCoin !== nextHasCoin) return false;

    // If both have coins, compare important properties
    if (prevHasCoin && nextHasCoin) {
      const prevCoin = prevProps.attachmentData?.coin;
      const nextCoin = nextProps.attachmentData?.coin;

      if (prevCoin?.mint !== nextCoin?.mint) return false;
      if (prevCoin?.symbol !== nextCoin?.symbol) return false;
      if (prevCoin?.name !== nextCoin?.name) return false;
      if (prevCoin?.image !== nextCoin?.image) return false;
      if (prevCoin?.description !== nextCoin?.description) return false;
    }
  }

  // Check callbacks by reference
  if (prevProps.onAvatarPress !== nextProps.onAvatarPress) return false;
  if (prevProps.onEditProfile !== nextProps.onEditProfile) return false;
  if (prevProps.onFollowPress !== nextProps.onFollowPress) return false;
  if (prevProps.onUnfollowPress !== nextProps.onUnfollowPress) return false;
  if (prevProps.onPressFollowers !== nextProps.onPressFollowers) return false;
  if (prevProps.onPressFollowing !== nextProps.onPressFollowing) return false;

  return true;
}

export default React.memo(UserProfileInfo, arePropsEqual); 