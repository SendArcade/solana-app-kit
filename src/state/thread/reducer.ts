import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { ThreadPost, ThreadUser, ThreadSection } from '../../components/thread/thread.types';
import { allposts as fallbackPosts } from '../../mocks/posts';

// Our server’s base URL
const SERVER_BASE_URL = process.env.SERVER_URL || 'http://localhost:3000/api';

// Async thunk to fetch all posts.
// In case of failure, we return fallbackPosts so the state isn’t cleared.
export const fetchAllPosts = createAsyncThunk('thread/fetchAllPosts', async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${SERVER_BASE_URL}/posts`);
    const data = await res.json();
    if (!data.success) {
      return rejectWithValue(data.error || 'Failed to fetch posts');
    }
    // If the API returns posts (even an empty array) we use that;
    // otherwise, fallback to our mocks.
    return data.data.length > 0 ? data.data : fallbackPosts;
  } catch (error: any) {
    console.error('Fetch posts error, using fallback posts:', error.message);
    return fallbackPosts;
  }
});

// Async thunk to create a new root post. It returns a complete post object.
export const createRootPostAsync = createAsyncThunk(
  'thread/createRootPost',
  async (payload: { user: ThreadUser; sections: ThreadSection[] }) => {
    const res = await fetch(`${SERVER_BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create post');
    const newPost: ThreadPost = {
      id: data.id,
      user: payload.user,
      sections: payload.sections,
      createdAt: new Date().toISOString(),
      parentId: undefined,
      replies: [],
      reactionCount: 0,
      retweetCount: 0,
      quoteCount: 0,
    };
    return newPost;
  }
);

// Async thunk to create a reply post. Returns a complete reply object.
export const createReplyAsync = createAsyncThunk(
  'thread/createReply',
  async (payload: { parentId: string; user: ThreadUser; sections: ThreadSection[] }) => {
    const res = await fetch(`${SERVER_BASE_URL}/posts/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create reply');
    const newReply: ThreadPost = {
      id: data.id,
      user: payload.user,
      sections: payload.sections,
      createdAt: new Date().toISOString(),
      parentId: payload.parentId,
      replies: [],
      reactionCount: 0,
      retweetCount: 0,
      quoteCount: 0,
    };
    return newReply;
  }
);

export const deletePostAsync = createAsyncThunk(
  'thread/deletePost',
  async (postId: string) => {
    const res = await fetch(`${SERVER_BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to delete post');
    return postId;
  }
);

interface ThreadState {
  allPosts: ThreadPost[];
  loading: boolean;
  error: string | null;
}

// Initialize with fallback posts so that even if the API call fails, we have data.
const initialState: ThreadState = {
  allPosts: fallbackPosts,
  loading: false,
  error: null,
};

export const threadSlice = createSlice({
  name: 'thread',
  initialState,
  reducers: {
    // Fallback action for when network call fails – add a new root post locally.
    addPostLocally: (state, action: PayloadAction<ThreadPost>) => {
      state.allPosts.unshift(action.payload);
    },
    // Fallback action for replies: find the parent post and add the reply.
    addReplyLocally: (state, action: PayloadAction<{ parentId: string; reply: ThreadPost }>) => {
      const { parentId, reply } = action.payload;
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
  },
  extraReducers: (builder) => {
    // fetchAllPosts
    builder.addCase(fetchAllPosts.pending, (state) => {
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
      // Do not clear state; leave fallback posts in place.
    });

    // createRootPostAsync – prepend new post to state.
    builder.addCase(createRootPostAsync.fulfilled, (state, action) => {
      state.allPosts.unshift(action.payload);
    });

    // createReplyAsync – find parent and insert reply.
    builder.addCase(createReplyAsync.fulfilled, (state, action) => {
      const newReply = action.payload;
      const parentId = newReply.parentId;
      function addReply(posts: ThreadPost[]): boolean {
        for (const post of posts) {
          if (post.id === parentId) {
            post.replies.unshift(newReply);
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
    });

    // deletePostAsync – remove post (and nested replies) from state.
    builder.addCase(deletePostAsync.fulfilled, (state, action) => {
      const postId = action.payload;
      function removeRecursive(posts: ThreadPost[]): ThreadPost[] {
        return posts
          .filter((p) => p.id !== postId)
          .map((p) => ({
            ...p,
            replies: removeRecursive(p.replies),
          }));
      }
      state.allPosts = removeRecursive(state.allPosts);
    });
  },
});

export const { addPostLocally, addReplyLocally } = threadSlice.actions;
export default threadSlice.reducer;
