import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {allposts} from '../../mocks/posts';
import {
  findPostById,
  generateId,
  removePostRecursive,
} from '../../components/thread/thread.utils';
import type {
  ThreadPost,
  ThreadSection,
  ThreadUser,
} from '../../components/thread/thread.types';

interface ThreadState {
  allPosts: ThreadPost[];
}

const initialState: ThreadState = {
  allPosts: allposts,
};

export const threadSlice = createSlice({
  name: 'thread',
  initialState,
  reducers: {
    addRootPost: (
      state,
      action: PayloadAction<{
        user: ThreadUser;
        sections: ThreadSection[];
      }>,
    ) => {
      const newPost: ThreadPost = {
        id: generateId('post'),
        user: action.payload.user,
        parentId: undefined,
        sections: action.payload.sections,
        createdAt: new Date().toISOString(),
        replies: [],
        reactionCount: 0,
        retweetCount: 0,
        quoteCount: 0,
      };
      state.allPosts.unshift(newPost); // place new post at top
    },
    addReply: (
      state,
      action: PayloadAction<{
        parentId: string;
        user: ThreadUser;
        sections: ThreadSection[];
      }>,
    ) => {
      const {parentId, user, sections} = action.payload;
      const newReply: ThreadPost = {
        id: generateId('post'),
        user,
        parentId,
        sections,
        createdAt: new Date().toISOString(),
        replies: [],
        reactionCount: 0,
        retweetCount: 0,
        quoteCount: 0,
      };

      const parentPost = findPostById(state.allPosts, parentId);
      if (parentPost) {
        parentPost.replies.unshift(newReply);
        parentPost.quoteCount += 1;
      }
      // Also store in flat array to keep allPosts comprehensive
      state.allPosts.unshift(newReply);
    },
    deletePost: (state, action: PayloadAction<{postId: string}>) => {
      const {postId} = action.payload;
      const postToDelete = findPostById(state.allPosts, postId);
      if (!postToDelete) return;

      // If it's a reply, decrement the parent's reply count
      if (postToDelete.parentId) {
        const parentPost = findPostById(state.allPosts, postToDelete.parentId);
        if (parentPost && parentPost.quoteCount > 0) {
          parentPost.quoteCount -= 1;
          parentPost.replies = parentPost.replies.filter(r => r.id !== postId);
        }
      }
      // Remove all replies recursively from the flat array
      state.allPosts = removePostRecursive(state.allPosts, postId);
    },
  },
});

export const {addRootPost, addReply, deletePost} = threadSlice.actions;
export default threadSlice.reducer;
