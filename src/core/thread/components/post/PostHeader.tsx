// FILE: src/components/thread/post/PostHeader.tsx

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  ImageSourcePropType,
  StyleSheet,
} from 'react-native';
import Icons from '../../../../assets/svgs';
import { createThreadStyles, getMergedTheme } from '../thread.styles';
import { ThreadPost, ThreadUser } from '../thread.types';
import { DEFAULT_IMAGES } from '../../../../config/constants';
import { useWallet } from '../../../../modules/embeddedWalletProviders/hooks/useWallet';

interface PostHeaderProps {
  /** The post data to display in the header */
  post: ThreadPost;
  /** Callback fired when the user taps the menu and chooses "delete" */
  onDeletePost?: (post: ThreadPost) => void;
  /** Callback fired when the user taps "edit" */
  onEditPost?: (post: ThreadPost) => void;
  /** Theme overrides for customizing appearance */
  themeOverrides?: Partial<Record<string, any>>;
  /** Style overrides for specific components */
  styleOverrides?: { [key: string]: object };

  /**
   * NEW: callback if user taps on the user's avatar/username
   */
  onPressUser?: (user: ThreadUser) => void;
}

export default function PostHeader({
  post,
  onDeletePost,
  onEditPost,
  themeOverrides,
  styleOverrides,

  onPressUser,
}: PostHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, createdAt } = post;
  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(mergedTheme, styleOverrides);

  // Get current user's wallet address to check post ownership
  const { address: currentUserAddress } = useWallet();

  // Check if post belongs to current user
  const isMyPost = currentUserAddress &&
    user.id &&
    currentUserAddress.toLowerCase() === user.id.toLowerCase();

  // Convert date to a short HH:mm string for display
  const timeString = new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleToggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handlePressOutside = () => {
    setMenuOpen(false);
  };

  const handleEdit = () => {
    setMenuOpen(false);
    onEditPost?.(post);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    if (!onDeletePost) return;
    // For safety, confirm before deleting
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeletePost(post) },
      ],
      { cancelable: true },
    );
  };

  /**
   * Safely returns the image source for a user's avatar
   */
  function getUserAvatar(u: ThreadUser): ImageSourcePropType {
    if (u.avatar) {
      if (typeof u.avatar === 'string') {
        return { uri: u.avatar };
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
      {/* If the menu is open, a transparent overlay to detect outside clicks */}
      {menuOpen && (
        <TouchableWithoutFeedback onPress={handlePressOutside}>
          <View style={localHeaderStyles.overlay} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.threadItemHeaderLeft}>
        {/* Wrap the avatar in a Touchable to press user */}
        <TouchableOpacity
          onPress={handleUserPress}
          style={{ position: 'relative' }}>
          <Image
            source={getUserAvatar(user)}
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

        <View style={{ marginLeft: 8 }}>
          {/* Also wrap the username in a Touchable */}
          <TouchableOpacity
            onPress={handleUserPress}
            style={{ flexDirection: 'row', alignItems: 'center' }}>
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

      {/* Only show 3-dot menu if this is the current user's post */}
      {isMyPost && (
        <TouchableOpacity onPress={handleToggleMenu}>
          <Icons.DotsThree width={20} height={20} />
        </TouchableOpacity>
      )}

      {/* The small drop-down menu if menuOpen */}
      {menuOpen && isMyPost && (
        <View style={localHeaderStyles.menuContainer}>
          <TouchableOpacity
            style={localHeaderStyles.menuItem}
            onPress={handleEdit}
          >
            <Text style={localHeaderStyles.menuItemText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={localHeaderStyles.menuItem}
            onPress={handleDelete}
          >
            <Text style={[localHeaderStyles.menuItemText, { color: '#d00' }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const localHeaderStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    right: 0,
    bottom: 0,
    width: '200%',
    height: '200%',
    zIndex: 30,
  },
  menuContainer: {
    position: 'absolute',
    top: 24,
    right: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    zIndex: 9999,
    paddingVertical: 4,
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
  },
});
