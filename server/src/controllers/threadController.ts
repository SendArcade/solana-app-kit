import { Request, Response } from 'express';

import { v4 as uuidv4 } from 'uuid';
import knex from '../db/knex';

// Helper: recursively fetch replies for a given parent post
async function fetchRepliesRecursive(parentId: string): Promise<any[]> {
  const rows = await knex('posts')
    .where({ parent_id: parentId })
    .orderBy('created_at', 'desc');
  const results = [];
  for (const row of rows) {
    const replies = await fetchRepliesRecursive(row.id);
    results.push({
      id: row.id,
      parentId: row.parent_id,
      user: {
        id: row.user_id,
        username: row.username,
        handle: row.user_handle,
        verified: row.user_verified,
        avatar: null, // you can replace with an avatar URL if stored elsewhere
      },
      sections: row.sections,
      createdAt: row.created_at,
      replies: replies,
      reactionCount: row.reaction_count,
      retweetCount: row.retweet_count,
      quoteCount: row.quote_count,
    });
  }
  return results;
}

/**
 * GET /api/posts
 * Fetch all root posts along with nested replies.
 */
export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch root posts (where parent_id is null)
    const rows = await knex('posts')
      .whereNull('parent_id')
      .orderBy('created_at', 'desc');

    const result = [];
    for (const row of rows) {
      const replies = await fetchRepliesRecursive(row.id);
      result.push({
        id: row.id,
        parentId: row.parent_id,
        user: {
          id: row.user_id,
          username: row.username,
          handle: row.user_handle,
          verified: row.user_verified,
          avatar: null,
        },
        sections: row.sections,
        createdAt: row.created_at,
        replies: replies,
        reactionCount: row.reaction_count,
        retweetCount: row.retweet_count,
        quoteCount: row.quote_count,
      });
    }
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[getAllPosts] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/posts
 * Create a new root post.
 */
export const createRootPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user, sections } = req.body;
    if (!user || !sections) {
      res.status(400).json({ success: false, error: 'user and sections are required' });
      return;
    }
    const postId = uuidv4();
    await knex('posts').insert({
      id: postId,
      parent_id: null,
      user_id: user.id,
      username: user.username,
      user_handle: user.handle,
      user_verified: !!user.verified,
      sections: JSON.stringify(sections),
      reaction_count: 0,
      retweet_count: 0,
      quote_count: 0,
    });
    res.status(201).json({ success: true, id: postId });
  } catch (err: any) {
    console.error('[createRootPost] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/posts/reply
 * Create a reply to an existing post.
 */
export const createReply = async (req: Request, res: Response): Promise<void> => {
  try {
    const { parentId, user, sections } = req.body;
    if (!parentId || !user || !sections) {
      res.status(400).json({ success: false, error: 'parentId, user, and sections are required' });
      return;
    }
    // Verify the parent post exists
    const parentExists = await knex('posts').where({ id: parentId }).first();
    if (!parentExists) {
      res.status(400).json({ success: false, error: 'Parent post does not exist' });
      return;
    }
    const postId = uuidv4();
    await knex('posts').insert({
      id: postId,
      parent_id: parentId,
      user_id: user.id,
      username: user.username,
      user_handle: user.handle,
      user_verified: !!user.verified,
      sections: JSON.stringify(sections),
      reaction_count: 0,
      retweet_count: 0,
      quote_count: 0,
    });
    // Optionally, increment parent's quoteCount
    await knex('posts').where({ id: parentId }).increment('quote_count', 1);
    res.status(201).json({ success: true, id: postId });
  } catch (err: any) {
    console.error('[createReply] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * DELETE /api/posts/:postId
 * Delete a post (and cascade-delete its replies).
 */
export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    if (!postId) {
      res.status(400).json({ success: false, error: 'No postId provided' });
      return;
    }
    // Check if the post exists
    const post = await knex('posts').where({ id: postId }).first();
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }
    // If this is a reply, optionally decrement parent's quoteCount
    if (post.parent_id) {
      await knex('posts').where({ id: post.parent_id }).decrement('quote_count', 1);
    }
    await knex('posts').where({ id: postId }).del();
    res.json({ success: true });
  } catch (err: any) {
    console.error('[deletePost] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
