import React, {useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Icons from '../../assets/svgs';
import {createThreadStyles, getMergedTheme} from './thread.styles';
import {ThreadPost} from './thread.types';

/**
 * Props for the PostFooter component
 * @interface PostFooterProps
 */
interface PostFooterProps {
  /** The post data associated with this footer */
  post: ThreadPost;
  /** Callback fired when the comment button is pressed */
  onPressComment?: (post: ThreadPost) => void;
  /** Theme overrides for customizing appearance */
  themeOverrides?: Partial<Record<string, any>>;
  /** Style overrides for specific components */
  styleOverrides?: {[key: string]: object};
}

/**
 * A component that renders the footer section of a post
 * 
 * @component
 * @description
 * PostFooter displays engagement metrics and action buttons below a post.
 * It shows comment counts, like counts, and other interaction options.
 * The component supports customizable styling through themes and style overrides.
 * 
 * @example
 * ```tsx
 * <PostFooter
 *   post={postData}
 *   onPressComment={handleCommentPress}
 *   themeOverrides={customTheme}
 * />
 * ```
 */
export default function PostFooter({
  post,
  onPressComment,
  themeOverrides,
  styleOverrides,
}: PostFooterProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(mergedTheme, styleOverrides);

  const toggleBookmark = () => {
    setIsBookmarked(prev => !prev);
  };

  return (
    <View style={styles.footerContainer}>
      <View style={styles.itemIconsRow}>
        <View style={{flexDirection: 'row', gap: 16}}>
          {/* Comment icon */}
          <TouchableOpacity
            style={styles.itemLeftIcons}
            onPress={() => onPressComment && onPressComment(post)}>
            <Icons.CommentIdle width={20} height={20} />
            <Text style={styles.iconText}>{post.quoteCount || 0}</Text>
          </TouchableOpacity>

          {/* Retweet */}
          <View style={styles.itemLeftIcons}>
            <Icons.RetweetIdle width={20} height={20} />
            <Text style={styles.iconText}>{post.retweetCount || 0}</Text>
          </View>

          {/* Reaction */}
          <View style={styles.itemLeftIcons}>
            <Icons.ReactionIdle width={20} height={20} />
            <Text style={styles.iconText}>{post.reactionCount || 0}</Text>
          </View>
        </View>

        {/* Right side icons */}
        <View style={styles.itemRightIcons}>
          <Icons.GridIcon width={20} height={20} />
          <TouchableOpacity onPress={toggleBookmark}>
            {isBookmarked ? (
              <Icons.BookmarkActive width={20} height={20} />
            ) : (
              <Icons.BookmarkIdle width={20} height={20} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
