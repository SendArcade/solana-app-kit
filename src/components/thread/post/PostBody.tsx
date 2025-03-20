// FILE: src/components/thread/post/PostBody.tsx
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
  /**
   * A numeric value used to refresh the trade chart in SectionTrade,
   * if it’s included in the post's sections.
   */
  externalRefreshTrigger?: number;
}

/**
 * Renders a single post section by delegating to the appropriate section component
 */
function renderSection(
  section: ThreadPost['sections'][number],
  user: ThreadPost['user'],
  createdAt: string,
  externalRefreshTrigger?: number,
) {
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
      return (
        <SectionTrade
          text={section.text}
          tradeData={section.tradeData}
          user={user}
          createdAt={createdAt}
          externalRefreshTrigger={externalRefreshTrigger}
        />
      );

    case 'POLL':
      return <SectionPoll pollData={section.pollData} />;

    case 'NFT_LISTING':
      return <SectionNftListing listingData={section.listingData} />;

    default:
      return null;
  }
}

function PostBody({
  post,
  themeOverrides,
  styleOverrides,
  externalRefreshTrigger,
}: PostBodyProps) {
  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(mergedTheme, styleOverrides);
  const {user, createdAt} = post;

  return (
    <View style={{marginTop: 8, padding: 0}}>
      {post.sections.map(section => (
        <View key={section.id} style={styles.extraContentContainer}>
          <View style={{width: '84%'}}>
            {renderSection(section, user, createdAt, externalRefreshTrigger)}
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Memo comparison to skip re-renders unless `post` or style props actually change.
 */
function arePropsEqual(prev: PostBodyProps, next: PostBodyProps): boolean {
  // Compare post IDs
  if (prev.post.id !== next.post.id) return false;

  // Compare number of sections
  const prevSections = prev.post.sections || [];
  const nextSections = next.post.sections || [];
  if (prevSections.length !== nextSections.length) return false;

  // Compare each section by id & type
  for (let i = 0; i < prevSections.length; i++) {
    if (
      prevSections[i].id !== nextSections[i].id ||
      prevSections[i].type !== nextSections[i].type
    ) {
      return false;
    }
  }

  // Compare theme/style references
  if (prev.themeOverrides !== next.themeOverrides) return false;
  if (prev.styleOverrides !== next.styleOverrides) return false;

  // Compare externalRefreshTrigger
  if (prev.externalRefreshTrigger !== next.externalRefreshTrigger) return false;

  return true;
}

export default React.memo(PostBody, arePropsEqual);
