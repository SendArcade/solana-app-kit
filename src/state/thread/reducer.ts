// File: src/state/thread/reducer.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { ThreadPost, ThreadUser, ThreadSection } from '../../components/thread/thread.types';

// Our server’s base URL
const SERVER_BASE_URL = process.env.SERVER_URL || 'http://localhost:3000/api';

// Async thunks
export const fetchAllPosts = createAsyncThunk('thread/fetchAllPosts', async () => {
  const res = await fetch(`${SERVER_BASE_URL}/posts`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch posts');
  // data.data is the array of posts with nested replies
  return data.data as ThreadPost[];
});

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
    // Return the newly created post's ID so we can optionally re-fetch or do something else
    return data.id as string;
  }
);

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
    return data.id as string;
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
    return postId; // So we can remove it from Redux
  }
);

interface ThreadState {
  allPosts: ThreadPost[];
  loading: boolean;
  error: string | null;
}

const initialState: ThreadState = {
  allPosts: [],
  loading: false,
  error: null,
};

export const threadSlice = createSlice({
  name: 'thread',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchAllPosts
    builder.addCase(fetchAllPosts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAllPosts.fulfilled, (state, action) => {
      state.loading = false;
      state.allPosts = action.payload; // entire array from server
    });
    builder.addCase(fetchAllPosts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch';
    });

    // createRootPostAsync
    builder.addCase(createRootPostAsync.fulfilled, (state, action) => {
      // After post is created, we might simply re-fetch all posts from server
      // or we can do nothing and rely on fetch. Implementation detail is up to you.
    });

    // createReplyAsync
    builder.addCase(createReplyAsync.fulfilled, (state, action) => {
      // Similarly, we can re-fetch or do nothing
    });

    // deletePostAsync
    builder.addCase(deletePostAsync.fulfilled, (state, action) => {
      // We can re-fetch from server or remove from state.
      // Implementation: we remove from state quickly for better UX
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

export default threadSlice.reducer;
