// FILE: src/components/thread/RetweetPreview.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { ThreadPost } from './thread.types';
import retweetPreviewStyles from './RetweetPreview.styles';

/**
 * Props for showing a retweeted post in condensed form.
 */
interface RetweetPreviewProps {
  retweetOf: ThreadPost;
  onPress?: (post: ThreadPost) => void;
}

/**
 * A condensed preview of the retweeted post.
 */
export default function RetweetPreview({ retweetOf, onPress }: RetweetPreviewProps) {
  const handlePress = () => {
    if (onPress) onPress(retweetOf);
  };

  // For an avatar fallback
  const avatarSource =
    typeof retweetOf.user?.avatar === 'string'
      ? { uri: retweetOf.user.avatar }
      : require('../../assets/images/User.png'); // or your fallback

  const firstTextSection = retweetOf.sections.find(s => !!s.text)?.text;

  return (
    <TouchableOpacity
      style={retweetPreviewStyles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={retweetPreviewStyles.headerRow}>
        <Image source={avatarSource} style={retweetPreviewStyles.avatar} />
        <View style={{ marginLeft: 8 }}>
          <Text style={retweetPreviewStyles.username}>{retweetOf.user.username}</Text>
          <Text style={retweetPreviewStyles.handle}>{retweetOf.user.handle}</Text>
        </View>
      </View>
      {firstTextSection && (
        <Text style={retweetPreviewStyles.previewText} numberOfLines={3}>
          {firstTextSection}
        </Text>
      )}
    </TouchableOpacity>
  );
}
