// FILE: src/components/thread/post/PostHeader.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  ImageSourcePropType,
  StyleSheet,
  Platform,
} from 'react-native';
import Icons from '../../../../assets/svgs';
import { createThreadStyles, getMergedTheme } from '../thread.styles';
import { ThreadPost, ThreadUser } from '../thread.types';
import { DEFAULT_IMAGES } from '../../../../config/constants';
import { useWallet } from '../../../../modules/embeddedWalletProviders/hooks/useWallet';
import { getValidImageSource, IPFSAwareImage } from '../../../../utils/IPFSImage';

// Always available direct reference to an image in the bundle
const DEFAULT_AVATAR = require('../../../../assets/images/User.png');

// Generate random background colors for placeholders
function getAvatarColor(username: string): string {
  // Simple hash function to generate consistent colors for the same username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Get a pastel hue
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 80%)`;
}

// The ProfileAvatarView component - simplified to rely on IPFSAwareImage but with a 403/429 fix
function ProfileAvatarView({
  user,
  style,
  size = 40
}: {
  user: ThreadUser,
  style?: any,
  size?: number
}) {
  // --- DEBUGGING START ---
  // console.log('[PostHeader] ProfileAvatarView received user:', JSON.stringify(user));
  // --- DEBUGGING END ---

  // State to track if image has loaded *successfully*
  const [imageLoaded, setImageLoaded] = useState(false);
  // Track if we should use a fallback gateway after failing with the first one
  const [useBackupGateway, setUseBackupGateway] = useState(false);

  // Get user initials for the placeholder
  const initials = user?.username
    ? user.username.charAt(0).toUpperCase()
    : user?.handle ? user.handle.charAt(0).toUpperCase() : '?';

  // Get consistent background color based on username
  const backgroundColor = getAvatarColor(user?.username || user?.handle || '?');

  // Reset fallback gateway when user changes
  useEffect(() => {
    setUseBackupGateway(false);
  }, [user?.id, user?.avatar]);

  // *** DIRECT APPROACH FIX to use reliable IPFS gateways WITHOUT cache buster (ANDROID ONLY) ***
  const source = (() => {
    // Default if no avatar
    if (!user?.avatar) return DEFAULT_AVATAR;

    // On iOS, use the original avatar directly - no transformations needed 
    if (Platform.OS === 'ios') {
      // Simply return the original avatar as provided by the API
      return user.avatar;
    }

    // ANDROID ONLY - Below code only runs on Android
    let ipfsHash: string | null = null;
    let originalUrl: string | null = null;

    // Process string avatars
    if (typeof user.avatar === 'string') {
      originalUrl = String(user.avatar);
      if (originalUrl.includes('ipfs.io/ipfs/')) {
        const parts = originalUrl.split('/ipfs/');
        if (parts.length > 1) ipfsHash = parts[1].split('?')[0]?.split('#')[0];
      } else if (originalUrl.startsWith('ipfs://')) {
        ipfsHash = originalUrl.slice(7).split('?')[0]?.split('#')[0];
      }
    }
    // Process object avatars
    else if (typeof user.avatar === 'object' && user.avatar && !Array.isArray(user.avatar) && 'uri' in user.avatar) {
      originalUrl = user.avatar.uri as string;
      if (originalUrl && originalUrl.includes('ipfs.io/ipfs/')) {
        const parts = originalUrl.split('/ipfs/');
        if (parts.length > 1) ipfsHash = parts[1].split('?')[0]?.split('#')[0];
      }
    }

    // If we found an IPFS hash, construct the corrected source using a gateway that works on Android
    if (ipfsHash) {
      // Problematic hash that's hitting rate limits on Pinata - use additional gateways
      const knownProblematicHashes = ['QmVcntn6HWYG9f13YKBoevhCdtVq7wi1URZuHzSb91CZgZ'];

      let gatewayUri;

      // If we've already had an error with the first gateway, or this is a known problematic hash
      if (useBackupGateway || knownProblematicHashes.includes(ipfsHash)) {
        // Use a different gateway to avoid rate limits
        const fallbackGateways = [
          `https://nftstorage.link/ipfs/${ipfsHash}`,
          `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
          `https://ipfs.io/ipfs/${ipfsHash}`  // Try original as last resort
        ];

        // Use one of the fallback gateways
        gatewayUri = fallbackGateways[0];
        console.log('[PostHeader] Using fallback gateway for IPFS hash:', gatewayUri);
      } else {
        // For all other hashes on first try, continue using Pinata as it works for them
        gatewayUri = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        console.log('[PostHeader] Using transformed IPFS URL on Android:', gatewayUri);
      }

      // Construct the source object, keeping original headers if present in an object avatar
      const headers = (typeof user.avatar === 'object' && !Array.isArray(user.avatar) && user.avatar.headers) ? user.avatar.headers : { 'Accept': '*/*' };
      return { uri: gatewayUri, headers };
    }

    // If it wasn't an IPFS URL needing transformation, return the original source
    if (originalUrl) {
      // If the original was an object, return it directly (handles headers etc.)
      if (typeof user.avatar === 'object' && !Array.isArray(user.avatar)) return user.avatar;
      // Otherwise, return a simple URI object from the string
      return { uri: originalUrl };
    }

    // Fallback / Default (handles require() or array sources)
    return user.avatar || DEFAULT_AVATAR;
  })();

  // Use a STABLE key based on user ID and the original avatar string/URI if possible
  const originalAvatarString = typeof user?.avatar === 'string' ? user.avatar :
    (typeof user?.avatar === 'object' && !Array.isArray(user?.avatar) && user?.avatar?.uri ? user.avatar.uri as string : null);

  // Include the backup gateway state in the key to force a reload with the new gateway
  const gatewayState = useBackupGateway ? '-backup' : '-primary';
  const imageKey = `avatar-${user?.id || 'local'}-${originalAvatarString || 'no-avatar'}${gatewayState}`;

  return (
    <View style={[
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: backgroundColor, // Always show background color initially
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Ensure image stays within bounds
      },
      style
    ]}>
      {/* Initials Text - show only if image hasn't loaded */}
      {!imageLoaded && (
        <Text style={{
          fontSize: size * 0.45,
          fontWeight: '700',
          color: '#333',
          textAlign: 'center',
        }}>
          {initials}
        </Text>
      )}

      {/* Use IPFSAwareImage - it will handle its own errors/defaults */}
      <IPFSAwareImage
        source={source}
        defaultSource={DEFAULT_AVATAR} // IPFSAwareImage handles showing this on error
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          position: 'absolute', // Overlay on top of the background/initials
          top: 0,
          left: 0,
          opacity: imageLoaded ? 1 : 0, // Fade in when loaded
        }}
        key={imageKey} // Use the stable key that includes gateway state
        onLoad={() => {
          // console.log('[PostHeader] IPFSAwareImage onLoad triggered for source:', JSON.stringify(source));
          setImageLoaded(true);
        }} // Mark as loaded successfully
        onError={(error) => {
          console.error('[PostHeader] IPFSAwareImage onError triggered! Source:', JSON.stringify(source), 'Error:', error?.nativeEvent?.error || 'Unknown error');
          setImageLoaded(false); // Ensure initials show on error

          // If we're on Android and haven't tried the backup gateway yet, try it now
          if (Platform.OS === 'android' && !useBackupGateway) {
            console.log('[PostHeader] Trying fallback gateway for image...');
            setUseBackupGateway(true);
          }
        }}
        fadeDuration={Platform.OS === 'android' ? 0 : 150} // Optional fade-in
      />
    </View>
  );
}

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

// Wrap the component in React.memo to prevent unnecessary re-renders
export default React.memo(function PostHeader({
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
          <ProfileAvatarView
            user={user}
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
});

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
