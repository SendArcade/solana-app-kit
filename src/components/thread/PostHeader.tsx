// FILE: src/components/thread/PostHeader.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ImageSourcePropType,
} from 'react-native';
import Icons from '../../assets/svgs';
import {createThreadStyles, getMergedTheme} from './thread.styles';
import {ThreadPost, ThreadUser} from './thread.types';
import {DEFAULT_IMAGES} from '../../config/constants';

interface PostHeaderProps {
  /** The post data to display in the header */
  post: ThreadPost;
  /** Callback fired when the menu button is pressed */
  onPressMenu?: (p: ThreadPost) => void;
  /** Callback fired when the delete option is selected */
  onDeletePost?: (p: ThreadPost) => void;
  /** Theme overrides for customizing appearance */
  themeOverrides?: Partial<Record<string, any>>;
  /** Style overrides for specific components */
  styleOverrides?: {[key: string]: object};

  /**
   * NEW: callback if user taps on the user’s avatar/username
   */
  onPressUser?: (user: ThreadUser) => void;
}

export default function PostHeader({
  post,
  onPressMenu,
  onDeletePost,
  themeOverrides,
  styleOverrides,

  onPressUser,
}: PostHeaderProps) {
  const {user, createdAt} = post;
  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(mergedTheme, styleOverrides);

  // Convert date to a short HH:mm string
  const timeString = new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePressMenu = () => {
    if (onPressMenu) {
      onPressMenu(post);
    } else {
      Alert.alert(
        'Menu',
        'Choose an action',
        [
          {
            text: 'Delete',
            onPress: () => {
              if (onDeletePost) onDeletePost(post);
            },
          },
          {text: 'Cancel', style: 'cancel'},
        ],
        {cancelable: true},
      );
    }
  };

  /**
   * Safely returns the image source for a user's avatar
   */
  function getUserAvatarSource(u: ThreadUser): ImageSourcePropType {
    if (u.avatar) {
      if (typeof u.avatar === 'string') {
        return {uri: u.avatar};
      }
      return u.avatar;
    }
    return DEFAULT_IMAGES.user;
  }

  const handleUserPress = () => {
    if (onPressUser) {
      onPressUser(user);
    }
  };

  return (
    <View style={styles.threadItemHeaderRow}>
      <View style={styles.threadItemHeaderLeft}>
        {/* Wrap the avatar in a Touchable to press user */}
        <TouchableOpacity
          onPress={handleUserPress}
          style={{position: 'relative'}}>
          <Image
            source={getUserAvatarSource(user)}
            style={styles.threadItemAvatar}
          />
          <Icons.addUserIcon
            style={{
              position: 'absolute',
              bottom: -4,
              zIndex: 10,
              right: 4,
              width: 16,
              height: 16,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: 'white',
            }}
          />
        </TouchableOpacity>

        <View style={{marginLeft: 8}}>
          {/* Also wrap the username in a Touchable */}
          <TouchableOpacity
            onPress={handleUserPress}
            style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.threadItemUsername}>{user.username}</Text>
            {user.verified && (
              <Icons.BlueCheck
                width={14}
                height={14}
                style={styles.verifiedIcon}
              />
            )}
          </TouchableOpacity>
          <Text style={styles.threadItemHandleTime}>
            {user.handle} • {timeString}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={handlePressMenu}>
        <Icons.DotsThree width={20} height={20} />
      </TouchableOpacity>
    </View>
  );
}
