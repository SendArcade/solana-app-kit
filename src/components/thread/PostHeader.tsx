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
import { DEFAULT_IMAGES } from '../../config/constants';

interface PostHeaderProps {
  post: ThreadPost;
  onPressMenu?: (p: ThreadPost) => void;
  onDeletePost?: (p: ThreadPost) => void;
  themeOverrides?: Partial<Record<string, any>>;
  styleOverrides?: {[key: string]: object};
}

export default function PostHeader({
  post,
  onPressMenu,
  onDeletePost,
  themeOverrides,
  styleOverrides,
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
   * Safely returns the image source for a user's avatar.
   */
  function getUserAvatarSource(u: ThreadUser): ImageSourcePropType {
    if (u.avatar) {
      if (typeof u.avatar === 'string') {
        return {uri: u.avatar};
      }
      // If it's already a number or object, assume it's a valid require
      return u.avatar;
    }
    // Fallback if nothing is set
    return DEFAULT_IMAGES.user;
  }

  return (
    <View style={styles.threadItemHeaderRow}>
      <View style={styles.threadItemHeaderLeft}>
        <View style={{position: 'relative'}}>
          <Image
            source={getUserAvatarSource(user)}
            style={styles.threadItemAvatar}
          />

          {/* "Add User" icon in the corner */}
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
        </View>
        <View style={{marginLeft: 8}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.threadItemUsername}>{user.username}</Text>
            {user.verified && (
              <Icons.BlueCheck
                width={14}
                height={14}
                style={styles.verifiedIcon}
              />
            )}
          </View>
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
