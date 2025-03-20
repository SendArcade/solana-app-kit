// FILE: src/components/thread/retweet/RetweetPreview.tsx

import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ThreadPost } from '../thread.types';
import PostBody from '../post/PostBody';
import { createThreadStyles, getMergedTheme } from '../thread.styles';


const localStyles = StyleSheet.create({
  container: {
    marginTop: 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  handle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  collapsedContainer: {

    maxHeight: 120,
    overflow: 'hidden',
  },
  seeMoreButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#ddd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
});


interface RetweetPreviewProps {

  retweetOf: ThreadPost;

  onPress?: (post: ThreadPost) => void;

  themeOverrides?: Partial<Record<string, any>>;
  styleOverrides?: { [key: string]: object };
}


export default function RetweetPreview({
  retweetOf,
  onPress,
  themeOverrides,
  styleOverrides,
}: RetweetPreviewProps) {
  // State for toggling between collapsed and expanded
  const hasTradeSection = retweetOf.sections.some(
    section => section.type === 'TEXT_TRADE',
  );
  const [expanded, setExpanded] = useState(hasTradeSection || false);

  // Merge your theme if needed
  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(mergedTheme, styleOverrides);

  // If the retweeted user's avatar is a string, we treat it as a URI
  const avatarSource =
    typeof retweetOf.user.avatar === 'string'
      ? { uri: retweetOf.user.avatar }
      : retweetOf.user.avatar;

  
  const textSection = retweetOf.sections.find(s => s.text);
  const textLength = textSection?.text?.length ?? 0;
  const multipleSections = retweetOf.sections.length > 1;
  const isTruncatable = multipleSections || textLength > 120;

  const handlePressShowTweet = () => {
    if (onPress) {
      onPress(retweetOf);
    }
  };

  return (
    <View style={localStyles.container}>
      {/* Header row (avatar + name/handle) */}
      <View style={localStyles.headerRow}>
        <Image source={avatarSource} style={localStyles.avatar} />
        <View style={{ marginLeft: 8 }}>
          <Text style={localStyles.username}>{retweetOf.user.username}</Text>
          <Text style={localStyles.handle}>{retweetOf.user.handle}</Text>
        </View>
      </View>

      {/* The post body, collapsed or expanded */}
      <View style={{ marginTop: 8 }}>
        {expanded ? (
          // Show entire PostBody
          <PostBody
            post={retweetOf}
            themeOverrides={themeOverrides}
            styleOverrides={styleOverrides as any}
          />
        ) : (
          // Collapsed: wrap PostBody in a container with limited height
          <View style={localStyles.collapsedContainer}>
            <PostBody
              post={retweetOf}
              themeOverrides={themeOverrides}
              styleOverrides={styleOverrides as any}
            />
          </View>
        )}
      </View>

      {/* Show "See More"/"See Less" only if content is large enough */}
      {isTruncatable && (
        <TouchableOpacity
          style={localStyles.seeMoreButton}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={localStyles.seeMoreText}>
            {expanded ? 'See Less' : 'See More'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Optional "Show Tweet" button, if onPress is provided */}
      {onPress && (
        <TouchableOpacity
          style={[localStyles.seeMoreButton, { marginTop: 4, backgroundColor: '#ccc' }]}
          onPress={handlePressShowTweet}
        >
          <Text style={localStyles.seeMoreText}>Show Tweet</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
