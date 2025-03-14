// File: src/components/Profile/ProfileInfo/profileInfo.tsx
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
  /** If it's the owner's own profile */
  isOwnProfile: boolean;
  /** Called when user taps the avatar */
  onAvatarPress?: () => void;
  /** Called when user taps “Edit Profile” */
  onEditProfile?: () => void;
  /** An optional custom bio text */
  bioText?: string;
  /** If I'm currently following this user */
  amIFollowing?: boolean;
  /** If they follow me */
  areTheyFollowingMe?: boolean;
  /** Called to follow/unfollow */
  onFollowPress?: () => void;
  onUnfollowPress?: () => void;
  /** The real follower/following counts */
  followersCount?: number;
  followingCount?: number;
  /** Tapping the “followers” or “following” count => open screen */
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
}

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
}) => {
  const handleString = userWallet
    ? '@' + userWallet.slice(0, 6) + '...' + userWallet.slice(-4)
    : '@no_wallet';

  const sampleBio =
    bioText ||
    `Hey folks! I'm ${username} building on Solana. Mention @someone to highlight.`;

  const canShowFollowsYou = !isOwnProfile && areTheyFollowingMe;
  const canShowBuyPerks = !isOwnProfile;
  const canShowAddButton = !isOwnProfile;

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

      {/* follower/following row */}
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

      {/* Edit profile button if it's my own profile */}
      {isOwnProfile && (
        <View style={{marginTop: 8}}>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={onEditProfile}>
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* buy card, perks => only for other profile */}
      {canShowBuyPerks && (
        <View style={{marginTop: 12}}>
          <BuyCard />
        </View>
      )}
      {canShowBuyPerks && (
        <View style={{marginTop: 12}}>
          <PerksCard />
        </View>
      )}

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
    </View>
  );
};

export default ProfileInfo;
