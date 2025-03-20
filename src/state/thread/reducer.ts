// FILE: src/state/thread/reducer.ts
import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import type {
  ThreadPost,
  ThreadSection,
} from '../../components/thread/thread.types';
import {allposts as fallbackPosts} from '../../mocks/posts';
import {SERVER_URL} from '@env';

const SERVER_BASE_URL = SERVER_URL || 'http://localhost:3000';

// fetchAllPosts
export const fetchAllPosts = createAsyncThunk(
  'thread/fetchAllPosts',
  async (_, {rejectWithValue}) => {
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/posts`);
      const data = await res.json();
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to fetch posts');
      }
      return data.data.length > 0 ? data.data : fallbackPosts;
    } catch (error: any) {
      console.error('Fetch posts error, using fallback posts:', error.message);
      return fallbackPosts;
    }
  },
);

/**
 * createRootPostAsync
 * Instead of passing a full user object, we pass userId only.
 *
 * NOTE: We now also support an optional `localId` that references the local post’s ID.
 * This helps remove any local duplicates if we already inserted a local post.
 */
export const createRootPostAsync = createAsyncThunk(
  'thread/createRootPost',
  async (payload: {
    userId: string;
    sections: ThreadSection[];
    localId?: string;
  }) => {
    const {userId, sections} = payload;
    const res = await fetch(`${SERVER_BASE_URL}/api/posts`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({userId, sections}),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create post');
    return data.data;
  },
);

/**
 * createReplyAsync
 * Pass userId, sections, parentId.
 */
export const createReplyAsync = createAsyncThunk(
  'thread/createReply',
  async (payload: {
    parentId: string;
    userId: string;
    sections: ThreadSection[];
  }) => {
    const res = await fetch(`${SERVER_BASE_URL}/api/posts/reply`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create reply');
    return data.data;
  },
);

/**
 * createRetweetAsync
 * Pass userId, retweetOf, and optionally sections.
 */
export const createRetweetAsync = createAsyncThunk(
  'thread/createRetweet',
  async (payload: {
    retweetOf: string;
    userId: string;
    sections?: ThreadSection[];
  }) => {
    const res = await fetch(`${SERVER_BASE_URL}/api/posts/retweet`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to retweet');
    return data.data as ThreadPost;
  },
);

// updatePostAsync
export const updatePostAsync = createAsyncThunk(
  'thread/updatePost',
  async ({postId, sections}: {postId: string; sections: ThreadSection[]}) => {
    const res = await fetch(`${SERVER_BASE_URL}/api/posts/update`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({postId, sections}),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to update post');
    return data.data as ThreadPost;
  },
);

/**
 * deletePostAsync
 * Now returns an object with postId, retweetOf, and parentId.
 */
export const deletePostAsync = createAsyncThunk(
  'thread/deletePost',
  async (postId: string) => {
    const res = await fetch(`${SERVER_BASE_URL}/api/posts/${postId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to delete post');
    return data; // Expected shape: { success: true, postId, retweetOf, parentId }
  },
);

// addReactionAsync
export const addReactionAsync = createAsyncThunk(
  'thread/addReaction',
  async ({postId, reactionEmoji}: {postId: string; reactionEmoji: string}) => {
    const res = await fetch(`${SERVER_BASE_URL}/api/posts/${postId}/reaction`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({reactionEmoji}),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to add reaction');
    return data.data; // updated post from server
  },
);

interface ThreadState {
  allPosts: ThreadPost[];
  loading: boolean;
  error: string | null;
}

const initialState: ThreadState = {
  allPosts: fallbackPosts,
  loading: false,
  error: null,
};

function removePostRecursive(
  posts: ThreadPost[],
  postId: string,
): ThreadPost[] {
  return posts
    .filter(p => p.id !== postId)
    .map(p => {
      if (p.replies.length > 0) {
        p.replies = removePostRecursive(p.replies, postId);
      }
      return p;
    });
}

export const threadSlice = createSlice({
  name: 'thread',
  initialState,
  reducers: {
    /**
     * Allows creating a post locally if offline or in fallback scenario.
     */
    addPostLocally: (state, action: PayloadAction<ThreadPost>) => {
      state.allPosts.unshift(action.payload);
    },
    /**
     * Allows adding a reply locally.
     */
    addReplyLocally: (
      state,
      action: PayloadAction<{parentId: string; reply: ThreadPost}>,
    ) => {
      const {parentId, reply} = action.payload;
      function addReply(posts: ThreadPost[]): boolean {
        for (const post of posts) {
          if (post.id === parentId) {
            post.replies.unshift(reply);
            post.quoteCount += 1;
            return true;
          }
          if (post.replies && post.replies.length > 0) {
            if (addReply(post.replies)) return true;
          }
        }
        return false;
      }
      addReply(state.allPosts);
    },
    /**
     * Allows adding a retweet locally.
     */
    addRetweetLocally: (state, action: PayloadAction<ThreadPost>) => {
      state.allPosts.unshift(action.payload);
      if (action.payload.retweetOf) {
        const originalId = action.payload.retweetOf.id;
        const updateRetweetCount = (posts: ThreadPost[]) => {
          for (const p of posts) {
            if (p.id === originalId) {
              p.retweetCount += 1;
              return true;
            }
            if (p.replies.length) {
              if (updateRetweetCount(p.replies)) return true;
            }
          }
          return false;
        };
        updateRetweetCount(state.allPosts);
      }
    },
  },
  extraReducers: builder => {
    // fetchAllPosts
    builder.addCase(fetchAllPosts.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAllPosts.fulfilled, (state, action) => {
      state.loading = false;
      state.allPosts = action.payload;
    });
    builder.addCase(fetchAllPosts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch posts';
    });

    // createRootPostAsync
    builder.addCase(createRootPostAsync.fulfilled, (state, action) => {
      // If there's a local ID, remove the local post to avoid duplication
      const localId = action.meta.arg.localId;
      if (localId && localId.startsWith('local-')) {
        state.allPosts = state.allPosts.filter(p => p.id !== localId);
      }
      // Now unshift the new "official" post from server
      state.allPosts.unshift(action.payload);
    });

    // createReplyAsync
    builder.addCase(createReplyAsync.fulfilled, (state, action) => {
      const newReply = action.payload;
      const parentId = newReply.parentId;
      function insertReply(posts: ThreadPost[]): boolean {
        for (const post of posts) {
          if (post.id === parentId) {
            post.replies.unshift(newReply);
            post.quoteCount += 1;
            return true;
          }
          if (post.replies.length > 0) {
            if (insertReply(post.replies)) return true;
          }
        }
        return false;
      }
      insertReply(state.allPosts);
    });

    // createRetweetAsync
    builder.addCase(createRetweetAsync.fulfilled, (state, action) => {
      const newRetweet = action.payload;
      state.allPosts.unshift(newRetweet);
      if (newRetweet.retweetOf?.id) {
        function updateRetweetCount(posts: ThreadPost[]): boolean {
          for (const p of posts) {
            if (p.id === newRetweet?.retweetOf?.id) {
              p.retweetCount += 1;
              return true;
            }
            if (p.replies.length > 0) {
              if (updateRetweetCount(p.replies)) return true;
            }
          }
          return false;
        }
        updateRetweetCount(state.allPosts);
      }
    });
    builder.addCase(createRetweetAsync.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to retweet.';
    });

    // updatePostAsync
    builder.addCase(updatePostAsync.fulfilled, (state, action) => {
      const updatedPost = action.payload;
      function updatePostRecursively(posts: ThreadPost[]): ThreadPost[] {
        return posts.map(p => {
          if (p.id === updatedPost.id) {
            return {...p, sections: updatedPost.sections};
          }
          if (p.replies.length > 0) {
            p.replies = updatePostRecursively(p.replies);
          }
          return p;
        });
      }
      state.allPosts = updatePostRecursively(state.allPosts);
    });

    // deletePostAsync
    builder.addCase(deletePostAsync.fulfilled, (state, action) => {
      const {postId, retweetOf, parentId} = action.payload;
      state.allPosts = removePostRecursive(state.allPosts, postId);

      // If this post is a retweet, decrement the original post's retweetCount.
      if (retweetOf) {
        function decrementRetweet(posts: ThreadPost[]): boolean {
          for (const p of posts) {
            if (p.id === retweetOf) {
              if (p.retweetCount > 0) p.retweetCount -= 1;
              return true;
            }
            if (p.replies.length > 0) {
              if (decrementRetweet(p.replies)) return true;
            }
          }
          return false;
        }
        decrementRetweet(state.allPosts);
      }

      // If this post is a reply, decrement the parent's quoteCount.
      if (parentId) {
        function decrementQuote(posts: ThreadPost[]): boolean {
          for (const p of posts) {
            if (p.id === parentId) {
              if (p.quoteCount > 0) p.quoteCount -= 1;
              return true;
            }
            if (p.replies.length > 0) {
              if (decrementQuote(p.replies)) return true;
            }
          }
          return false;
        }
        decrementQuote(state.allPosts);
      }
    });

    // addReactionAsync
    builder.addCase(addReactionAsync.fulfilled, (state, action) => {
      const updatedPost = action.payload as ThreadPost;
      function replacePost(posts: ThreadPost[]): ThreadPost[] {
        return posts.map(p => {
          if (p.id === updatedPost.id) {
            return {
              ...p,
              reactionCount: updatedPost.reactionCount,
              reactions: updatedPost.reactions,
            };
          }
          if (p.replies.length > 0) {
            p.replies = replacePost(p.replies);
          }
          return p;
        });
      }
      state.allPosts = replacePost(state.allPosts);
    });
  },
});

export const {addPostLocally, addReplyLocally, addRetweetLocally} =
  threadSlice.actions;
export default threadSlice.reducer;
