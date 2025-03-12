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
 * @example
 * ```tsx
 * <PostBody
 *   post={postData}
 *   themeOverrides={{ '--primary-color': '#1D9BF0' }}
 * />
 * ```
 */
function PostBody({post, themeOverrides, styleOverrides}: PostBodyProps) {
  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(mergedTheme, styleOverrides);

  return (
    <View style={{marginTop: 8, padding: 0}}>
      {post.sections.map(section => (
        <View key={section.id} style={styles.extraContentContainer}>
          <View style={{width: '84%'}}>{renderSection(section)}</View>
        </View>
      ))}
    </View>
  );
}

/**
 * Memo comparison to skip re-renders unless `post` or style props actually change.
 */
function arePropsEqual(
  prev: Readonly<PostBodyProps>,
  next: Readonly<PostBodyProps>,
): boolean {
  // If the post reference changed, check if the ID is the same
  // and if number of sections is the same. If sections changed length => re-render.
  if (prev.post.id !== next.post.id) return false;
  const prevSections = prev.post.sections || [];
  const nextSections = next.post.sections || [];
  if (prevSections.length !== nextSections.length) return false;

  // For a deeper check, compare each section's type or ID quickly
  for (let i = 0; i < prevSections.length; i++) {
    if (
      prevSections[i].id !== nextSections[i].id ||
      prevSections[i].type !== nextSections[i].type
    ) {
      return false;
    }
  }

  // Optional: theme/style overrides if you want to skip if they changed references
  // For safety, if the user passes new objects each time, it's considered changed:
  if (prev.themeOverrides !== next.themeOverrides) return false;
  if (prev.styleOverrides !== next.styleOverrides) return false;

  return true;
}

export default React.memo(PostBody, arePropsEqual);
