import React from 'react';
import {View} from 'react-native';
import {createThreadStyles, getMergedTheme} from './thread.styles';
import {ThreadPost} from './thread.types';
import SectionTextOnly from './sections/SectionTextOnly';
import SectionTextImage from './sections/SectionTextImage';
import SectionTextVideo from './sections/SectionTextVideo';
import SectionPoll from './sections/SectionPoll';
import SectionTrade from './sections/SectionTrade';
import SectionNftListing from './sections/SectionNftListing';

interface PostBodyProps {
  post: ThreadPost;
  themeOverrides?: Partial<Record<string, any>>;
  styleOverrides?: {[key: string]: object};
}

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
 * Renders a single post section by delegating to sub-components
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
