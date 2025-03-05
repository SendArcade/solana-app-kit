// server/src/controllers/threadController.ts
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import knex from '../db/knex';

async function fetchRepliesRecursive(parentId: string): Promise<any[]> {
  const rows = await knex('posts')
    .where({ parent_id: parentId })
    .orderBy('created_at', 'desc');

  const results: any[] = [];
  for (const row of rows) {
    // find user in the DB
    const dbUser = await knex('users').where({ id: row.user_id }).first();
    const avatar = dbUser ? dbUser.profile_picture_url : null;

    const replies = await fetchRepliesRecursive(row.id);

    results.push({
      id: row.id,
      parentId: row.parent_id,
      user: {
        id: row.user_id,
        username: row.username,
        handle: row.user_handle,
        verified: row.user_verified,
        avatar: avatar,
      },
      sections: row.sections,
      createdAt: row.created_at,
      replies: replies,
      reactionCount: row.reaction_count,
      retweetCount: row.retweet_count,
      quoteCount: row.quote_count,
      // NEW: parse "reactions" from DB
      reactions: row.reactions || {},
    });
  }
  return results;
}

/**
 * GET /api/posts
 */
export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await knex('posts')
      .whereNull('parent_id')
      .orderBy('created_at', 'desc');

    const result = [];
    for (const row of rows) {
      // fetch user from users table
      const dbUser = await knex('users').where({ id: row.user_id }).first();
      const avatar = dbUser ? dbUser.profile_picture_url : null;

      const replies = await fetchRepliesRecursive(row.id);

      result.push({
        id: row.id,
        parentId: row.parent_id,
        user: {
          id: row.user_id,
          username: row.username,
          handle: row.user_handle,
          verified: row.user_verified,
          avatar,
        },
        sections: row.sections,
        createdAt: row.created_at,
        replies,
        reactionCount: row.reaction_count,
        retweetCount: row.retweet_count,
        quoteCount: row.quote_count,
        // parse "reactions" from DB
        reactions: row.reactions || {},
      });
    }

    res.json({ success: true, data: result });
    return;
  } catch (err: any) {
    console.error('[getAllPosts] Error:', err);
    res.status(500).json({ success: false, error: err.message });
    return;
  }
};

/**
 * POST /api/posts
 * Create a new root post
 */
export const createRootPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user, sections } = req.body;
    if (!user || !sections) {
      res.status(400).json({
        success: false,
        error: 'user and sections are required',
      });
      return;
    }

    const postId = uuidv4();
    await knex('posts').insert({
      id: postId,
      parent_id: null,
      user_id: user.id, // wallet address from client
      username: user.username,
      user_handle: user.handle,
      user_verified: !!user.verified,
      sections: JSON.stringify(sections),
      reaction_count: 0,
      retweet_count: 0,
      quote_count: 0,
      // Store an empty object in "reactions" column by default
      reactions: JSON.stringify({}),
    });

    // fetch user again for avatar
    const dbUser = await knex('users').where({ id: user.id }).first();
    const avatar = dbUser ? dbUser.profile_picture_url : null;

    const newPost = {
      id: postId,
      parentId: null,
      user: {
        id: user.id,
        username: user.username,
        handle: user.handle,
        verified: !!user.verified,
        avatar,
      },
      sections,
      createdAt: new Date().toISOString(),
      replies: [],
      reactionCount: 0,
      retweetCount: 0,
      quoteCount: 0,
      reactions: {}, // empty object
    };

    res.status(201).json({ success: true, data: newPost });
    return;
  } catch (err: any) {
    console.error('[createRootPost] Error:', err);
    res.status(500).json({ success: false, error: err.message });
    return;
  }
};

/**
 * POST /api/posts/reply
 */
export const createReply = async (req: Request, res: Response): Promise<void> => {
  try {
    const { parentId, user, sections } = req.body;
    if (!parentId || !user || !sections) {
      res.status(400).json({
        success: false,
        error: 'parentId, user, and sections are required',
      });
      return;
    }

    // check parent
    const parentRow = await knex('posts').where({ id: parentId }).first();
    if (!parentRow) {
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
      reactions: JSON.stringify({}),
    });

    // increment parent's quoteCount
    await knex('posts').where({ id: parentId }).increment('quote_count', 1);

    // fetch user again for avatar
    const dbUser = await knex('users').where({ id: user.id }).first();
    const avatar = dbUser ? dbUser.profile_picture_url : null;

    const newReply = {
      id: postId,
      parentId,
      user: {
        id: user.id,
        username: user.username,
        handle: user.handle,
        verified: !!user.verified,
        avatar,
      },
      sections,
      createdAt: new Date().toISOString(),
      replies: [],
      reactionCount: 0,
      retweetCount: 0,
      quoteCount: 0,
      reactions: {},
    };
    res.status(201).json({ success: true, data: newReply });
    return;
  } catch (err: any) {
    console.error('[createReply] Error:', err);
    res.status(500).json({ success: false, error: err.message });
    return;
  }
};

/**
 * DELETE /api/posts/:postId
 */
export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    if (!postId) {
      res.status(400).json({ success: false, error: 'No postId provided' });
      return;
    }
    const post = await knex('posts').where({ id: postId }).first();
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }
    // if it's a reply, decrement parent's quoteCount
    if (post.parent_id) {
      await knex('posts').where({ id: post.parent_id }).decrement('quote_count', 1);
    }
    await knex('posts').where({ id: postId }).del();

    res.json({ success: true });
    return;
  } catch (err: any) {
    console.error('[deletePost] Error:', err);
    res.status(500).json({ success: false, error: err.message });
    return;
  }
};

/**
 * PATCH /api/posts/:postId/reaction
 * body: { reactionEmoji: string }
 */
export const addReaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { postId } = req.params;
      const { reactionEmoji } = req.body;
  
      if (!postId || !reactionEmoji) {
        res.status(400).json({
          success: false,
          error: 'Missing postId or reactionEmoji',
        });
        return; // Just return without the Response object
      }
  
      // fetch the post
      const post = await knex('posts').where({ id: postId }).first();
      if (!post) {
        res.status(404).json({ success: false, error: 'Post not found' });
        return; // Just return without the Response object
      }
  
      // Because the DB (JSONB) might already return an object:
      // if it's string-based, you'd do type-checking, but let's assume it's an object:
      let reactionsObj = post.reactions || {};
  
      // If needed, do a safe type check:
      // if (typeof post.reactions === 'string') {
      //   reactionsObj = JSON.parse(post.reactions);
      // } else {
      //   reactionsObj = post.reactions || {};
      // }
  
      // increment the emoji
      if (!reactionsObj[reactionEmoji]) {
        reactionsObj[reactionEmoji] = 1;
      } else {
        reactionsObj[reactionEmoji] += 1;
      }
  
      // sum up total
      let totalReactions = 0;
      Object.values(reactionsObj).forEach((val: any) => {
        totalReactions += val;
      });
  
      // Update DB: if you used .jsonb('reactions'), you can store it directly
      await knex('posts')
        .where({ id: postId })
        .update({
          reactions: reactionsObj, // store the raw object if JSONB
          reaction_count: totalReactions,
        //   updated_at: new Date(),
        });
  
      // return updated post
      const updatedPost = {
        ...post,
        reactions: reactionsObj,
        reaction_count: totalReactions,
      };
  
      res.json({ success: true, data: updatedPost });
      return; // Add explicit return here
    } catch (error: any) {
      console.error('[addReaction] Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };
