import React from 'react';
import {Image, View, Text, TouchableOpacity} from 'react-native';
import {findMentioned} from '../../../utils/common/findMentioned';
import AddButton from '../addButton/addButton';
import BuyCard from '../buyCard/buyCard';
import PerksCard from '../perksCard/perksCard';
import ProfileIcons from '../../../assets/svgs/index';
import {styles} from './profileInfo.style';

interface ProfileInfoProps {
  /** The user’s profile pic URL */
  profilePicUrl: string;
  /** The user’s display name */
  username: string;
  /** The user’s wallet address */
  userWallet: string;
  /** If this is the owner’s own profile, we hide or show certain items */
  isOwnProfile: boolean;
  /** Called when user taps on the avatar (e.g., to pick a new avatar) */
  onAvatarPress?: () => void;
  /** Called when user taps on “Edit Profile” */
  onEditProfile?: () => void;

  /** Optionally override the displayed text in the “bio” example. */
  bioText?: string;
}

/**
 * ProfileInfo displays the top portion of a user's profile:
 * - Avatar + Name + Handle
 * - short bio, follower counts
 * - If not isOwnProfile, shows “Follows you,” buy card, perks card, add button
 */
const ProfileInfo: React.FC<ProfileInfoProps> = ({
  profilePicUrl,
  username,
  userWallet,
  isOwnProfile,
  onAvatarPress,
  onEditProfile,
  bioText,
}) => {
  // Example placeholders
  const handleString = userWallet
    ? '@' + userWallet.slice(0, 6) + '...' + userWallet.slice(-4)
    : '@no_wallet';
  // If the parent didn’t pass a custom bio, we default here:
  const sampleBio =
    bioText ||
    `Hey folks! I'm ${username} building on Solana. Mention @someone to highlight.`;

  const canShowFollowsYou = !isOwnProfile;
  const canShowBuyPerks = !isOwnProfile;
  const canShowAddButton = !isOwnProfile;

  return (
    <View style={styles.profileInfo}>
      {/* Top row with avatar & name */}
      <View style={{flexDirection: 'row', gap: 12, alignItems: 'center'}}>
        <TouchableOpacity
          style={styles.profImgContainer}
          onPress={onAvatarPress}
          disabled={!isOwnProfile ? true : false}>
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
            <Text style={{fontSize: 12, fontWeight: '500', color: '#999999'}}>
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

      {/* short bio */}
      <View style={{marginTop: 8}}>
        <Text style={styles.bioSection}>{findMentioned(sampleBio)}</Text>
      </View>

      {/* follower/following placeholders */}
      <View style={{flexDirection: 'row', gap: 12, marginTop: 8}}>
        <View style={{flexDirection: 'row', gap: 2}}>
          <Text style={{fontSize: 12, fontWeight: '600'}}>98 </Text>
          <Text style={{fontSize: 12, fontWeight: '500', color: '#B7B7B7'}}>
            Followers
          </Text>
        </View>
        <View style={{flexDirection: 'row', gap: 2}}>
          <Text style={{fontSize: 12, fontWeight: '600'}}>42 </Text>
          <Text style={{fontSize: 12, fontWeight: '500', color: '#B7B7B7'}}>
            Following
          </Text>
        </View>
        <View style={{flexDirection: 'row', gap: 2}}>
          <ProfileIcons.PinLocation />
          <Text style={{fontSize: 12, fontWeight: '500', color: '#B7B7B7'}}>
            Global
          </Text>
        </View>
      </View>

      {/* Edit profile button: only relevant if isOwnProfile === true */}
      {isOwnProfile && (
        <View style={{marginTop: 8}}>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={onEditProfile}>
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* buy card */}
      {canShowBuyPerks && (
        <View style={{marginTop: 12}}>
          <BuyCard />
        </View>
      )}

      {/* perks card */}
      {canShowBuyPerks && (
        <View style={{marginTop: 12}}>
          <PerksCard />
        </View>
      )}

      {/* “Follow Back” / “Send to wallet” buttons, etc */}
      {canShowAddButton && (
        <View style={{marginTop: 12}}>
          <AddButton />
        </View>
      )}
    </View>
  );
};

export default ProfileInfo;
