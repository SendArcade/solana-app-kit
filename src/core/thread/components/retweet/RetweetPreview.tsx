// FILE: src/components/thread/retweet/RetweetPreview.tsx

import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ThreadPost } from '../thread.types';
import PostBody from '../post/PostBody';
import { createThreadStyles, getMergedTheme } from '../thread.styles';
import Icons from '../../../../assets/svgs';

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

  // Check if this is a quote retweet (has sections with text)
  const isQuoteRetweet = retweetOf.sections && retweetOf.sections.length > 0;
  const quoteText = isQuoteRetweet
    ? retweetOf.sections.find(s => s.text)?.text
    : '';

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
  const isTruncatable = multipleSections || textLength > 100;

  const handlePressShowTweet = () => {
    if (onPress) {
      onPress(retweetOf);
    }
  };

  // Calculate if we're viewing text, image, video, or other content
  const hasImage = retweetOf.sections.some(s => s.type === 'TEXT_IMAGE' && s.imageUrl);
  const hasVideo = retweetOf.sections.some(s => s.type === 'TEXT_VIDEO' && s.videoUrl);
  const hasTrade = hasTradeSection;

  return (
    <View style={localStyles.container}>
      {/* Retweet indicator */}
      <View style={localStyles.retweetIndicator}>
        <Icons.RetweetIdle width={12} height={12} color="#657786" />
        <Text style={localStyles.retweetText}>Retweet</Text>
      </View>

      {/* Quote text if this is a quote retweet */}
      {isQuoteRetweet && quoteText && (
        <View style={localStyles.quoteContainer}>
          <Text style={localStyles.quoteText}>{quoteText}</Text>
        </View>
      )}

      {/* Header row (avatar + name/handle) */}
      <View style={localStyles.headerRow}>
        <Image source={avatarSource} style={localStyles.avatar} />
        <View style={localStyles.userInfo}>
          <Text style={localStyles.username} numberOfLines={1}>{retweetOf.user.username}</Text>
          <Text style={localStyles.handle} numberOfLines={1}>{retweetOf.user.handle}</Text>
        </View>
      </View>

      {/* The post body, collapsed or expanded */}
      <View style={localStyles.bodyContainer}>
        {expanded ? (
          // Show entire PostBody
          <PostBody
            post={retweetOf}
            themeOverrides={themeOverrides}
            styleOverrides={styleOverrides as any}
          />
        ) : (
          // Collapsed: wrap PostBody in a container with limited height
          <View style={[
            localStyles.collapsedContainer,
            (hasImage || hasVideo) ? localStyles.mediaContainer : {},
            hasTrade ? { maxHeight: 300 } : {}
          ]}>
            <PostBody
              post={retweetOf}
              themeOverrides={themeOverrides}
              styleOverrides={styleOverrides as any}
            />
          </View>
        )}
      </View>

      {/* Footer with actions */}
      <View style={localStyles.footerContainer}>
        {/* Show "See More"/"See Less" only if content is large enough */}
        {isTruncatable && (
          <TouchableOpacity
            style={localStyles.actionButton}
            onPress={() => setExpanded(!expanded)}
          >
            <Text style={localStyles.actionButtonText}>
              {expanded ? 'See Less' : 'See More'}
            </Text>
          </TouchableOpacity>
        )}

        {/* "Show Tweet" button, if onPress is provided */}
        {onPress && (
          <TouchableOpacity
            style={localStyles.actionButton}
            onPress={handlePressShowTweet}
          >
            <Text style={localStyles.actionButtonText}>View Original</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    backgroundColor: '#F5F8FA',
  },
  retweetIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  retweetText: {
    fontSize: 12,
    color: '#657786',
    marginLeft: 4,
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DDD', // Placeholder color
  },
  userInfo: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14171A',
  },
  handle: {
    fontSize: 12,
    color: '#657786',
    marginTop: 1,
  },
  bodyContainer: {
    marginBottom: 8,
  },
  collapsedContainer: {
    maxHeight: 150,
    overflow: 'hidden',
  },
  mediaContainer: {
    maxHeight: 240, // Taller for media content
  },
  footerContainer: {
    flexDirection: 'row',
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E1E8ED',
    paddingTop: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EFF3F7',
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#1DA1F2',
    fontWeight: '600',
  },
  quoteContainer: {
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 12,
    color: '#657786',
  },
});
