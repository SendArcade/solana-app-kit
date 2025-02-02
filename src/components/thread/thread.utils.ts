import {ThreadPost} from './thread.types';

export function gatherAncestorChain(postId: string, allRootPosts: ThreadPost[]): ThreadPost[] {
  const chain: ThreadPost[] = [];
  let currentId = postId;

  function findParentAndPush(id: string): ThreadPost | undefined {
    for (const root of allRootPosts) {
      const found = deepFind(root, id);
      if (found) {
        if (found.parentId) {
          const parentPost = deepFind(root, found.parentId);
          if (parentPost) {
            chain.unshift(parentPost);
            return parentPost;
          }
        }
      }
    }
    return undefined;
  }

  function deepFind(current: ThreadPost, targetId: string): ThreadPost | undefined {
    if (current.id === targetId) return current;
    for (const reply of current.replies) {
      const found = deepFind(reply, targetId);
      if (found) return found;
    }
    return undefined;
  }

  // Climb until we can no longer find a parent
  let parent = findParentAndPush(currentId);
  while (parent) {
    currentId = parent.id;
    parent = findParentAndPush(currentId);
  }

  return chain;
}

export function generateId(prefix: string) {
  return prefix + '-' + Math.random().toString(36).substr(2, 9);
}

export function findPostById(posts: ThreadPost[], id: string): ThreadPost | undefined {
  for (const post of posts) {
    if (post.id === id) return post;
    if (post.replies.length > 0) {
      const found = findPostById(post.replies, id);
      if (found) return found;
    }
  }
  return undefined;
}

export function removePostRecursive(
  posts: ThreadPost[],
  postId: string,
): ThreadPost[] {
  return posts
    .filter(p => p.id !== postId) // remove the matched one
    .map(p => {
      // also remove from children
      if (p.replies.length > 0) {
        p.replies = removePostRecursive(p.replies, postId);
      }
      return p;
    });
}