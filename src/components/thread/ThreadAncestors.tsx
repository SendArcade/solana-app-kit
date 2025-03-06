import React from 'react';
import {View, Text} from 'react-native';
import {createThreadStyles, getMergedTheme} from './thread.styles';
import {gatherAncestorChain} from './thread.utils';
import { ThreadPost } from './thread.types';

/**
 * Props for the ThreadAncestors component
 * @interface ThreadAncestorsProps
 */
interface ThreadAncestorsProps {
  /** The current post to find ancestors for */
  post: ThreadPost;
  /** Array of root-level posts in the thread */
  rootPosts: ThreadPost[];
  /** Theme overrides for customizing appearance */
  themeOverrides?: Partial<Record<string, any>>;
  /** Style overrides for specific components */
  styleOverrides?: {[key: string]: object};
  /** User-provided stylesheet overrides */
  userStyleSheet?: {[key: string]: object};
}

/**
 * A component that displays the chain of users being replied to in a thread
 * 
 * @component
 * @description
 * ThreadAncestors shows a list of users that a post is replying to in a thread.
 * It traverses up the reply chain to find all unique users being referenced
 * and displays their handles in a comma-separated list.
 * 
 * Features:
 * - Ancestor chain traversal
 * - Unique user handle filtering
 * - Customizable styling
 * - Null handling for root posts
 * 
 * @example
 * ```tsx
 * <ThreadAncestors
 *   post={currentPost}
 *   rootPosts={allPosts}
 *   themeOverrides={{ '--primary-color': '#1D9BF0' }}
 * />
 * ```
 */
export default function ThreadAncestors({
  post,
  rootPosts,
  themeOverrides,
  styleOverrides,
  userStyleSheet,
}: ThreadAncestorsProps) {
  if (!post.parentId) return null;

  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(
    mergedTheme,
    styleOverrides,
    userStyleSheet,
  );

  const chain = gatherAncestorChain(post.id, rootPosts);

  if (chain.length === 0) return null;

  const uniqueHandles = chain.map(p => p.user.handle).filter(Boolean);

  return (
    <View style={styles.replyingContainer}>
      <Text style={styles.replyingText}>
        Replying to{' '}
        <Text style={styles.replyingHandle}>{uniqueHandles.join(', ')}</Text>
      </Text>
    </View>
  );
}
