import React from 'react';
import {View} from 'react-native';
import {createThreadStyles, getMergedTheme} from '../thread.styles';
import {ThreadPost} from '../thread.types';
import SectionTextOnly from '../sections/SectionTextOnly';
import SectionTextImage from '../sections/SectionTextImage';
import SectionTextVideo from '../sections/SectionTextVideo';
import SectionPoll from '../sections/SectionPoll';
import SectionTrade from '../sections/SectionTrade';
import SectionNftListing from '../sections/SectionNftListing';

/**
 * Props for the PostBody component
 * @interface PostBodyProps
 */
interface PostBodyProps {
  /** The post data to display in the body */
  post: ThreadPost;
  /** Theme overrides for customizing appearance */
  themeOverrides?: Partial<Record<string, any>>;
  /** Style overrides for specific components */
  styleOverrides?: {[key: string]: object};
}

/**
 * A component that renders the body content of a post in a thread
 * 
 * @component
 * @description
 * PostBody handles the rendering of different types of content sections in a post,
 * including text, images, videos, polls, trades, and NFT listings. It supports
 * multiple sections per post and delegates rendering to specialized section components.
 * 
 * Features:
 * - Multiple content section support
 * - Section type-specific rendering
 * - Customizable styling
 * - Responsive layout
 * 
 * Supported Section Types:
 * - TEXT_ONLY: Plain text content
 * - TEXT_IMAGE: Text with an image
 * - TEXT_VIDEO: Text with a video
 * - TEXT_TRADE: Trade information
 * - POLL: Poll data
 * - NFT_LISTING: NFT listing details
 * 
 * @example
 * ```tsx
 * <PostBody
 *   post={postData}
 *   themeOverrides={{ '--primary-color': '#1D9BF0' }}
 * />
 * ```
 */
export default function PostBody({
  post,
  themeOverrides,
  styleOverrides,
}: PostBodyProps) {
  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(mergedTheme, styleOverrides);

  return (
    <View style={{marginTop: 8}}>
      {post.sections.map(section => (
        <View key={section.id} style={styles.extraContentContainer}>
          <View style={{width: '84%'}}>{renderSection(section)}</View>
        </View>
      ))}
    </View>
  );
}

/**
 * Renders a single post section by delegating to the appropriate section component
 * @param {ThreadPost['sections'][number]} section - The section to render
 * @returns {JSX.Element | null} The rendered section component or null if type is unsupported
 */
function renderSection(section: ThreadPost['sections'][number]) {
  switch (section.type) {
    case 'TEXT_ONLY':
      return <SectionTextOnly text={section.text} />;

    case 'TEXT_IMAGE':
      return (
        <SectionTextImage text={section.text} imageUrl={section.imageUrl} />
      );

    case 'TEXT_VIDEO':
      return (
        <SectionTextVideo text={section.text} videoUrl={section.videoUrl} />
      );

    case 'TEXT_TRADE':
      return <SectionTrade text={section.text} tradeData={section.tradeData} />;

    case 'POLL':
      return <SectionPoll pollData={section.pollData} />;

    case 'NFT_LISTING':
      return <SectionNftListing listingData={section.listingData} />;

    default:
      return null;
  }
}
