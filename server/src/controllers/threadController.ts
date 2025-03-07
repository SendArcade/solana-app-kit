// FILE: server/src/controllers/threadController.ts

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import knex from '../db/knex';

async function fetchRepliesRecursive(parentId: string): Promise<any[]> {
  const rows = await knex('posts')
    .where({ parent_id: parentId })
    .orderBy('created_at', 'desc');

  const results: any[] = [];
  for (const row of rows) {
    const dbUser = await knex('users').where({ id: row.user_id }).first();
    const avatar = dbUser ? dbUser.profile_picture_url : null;
    const replies = await fetchRepliesRecursive(row.id);

    let retweetData: any = null;
    if (row.retweet_of) {
      retweetData = await fetchSinglePost(row.retweet_of);
    }

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
      reactions: row.reactions || {},
      retweetOf: retweetData,
    });
  }
  return results;
}

async function fetchSinglePost(postId: string): Promise<any | null> {
  const row = await knex('posts').where({ id: postId }).first();
  if (!row) return null;
  const dbUser = await knex('users').where({ id: row.user_id }).first();
  const avatar = dbUser ? dbUser.profile_picture_url : null;
  let retweetData: any = null;
  if (row.retweet_of) {
    retweetData = await fetchSinglePost(row.retweet_of);
  }
  return {
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
    replies: [],
    reactionCount: row.reaction_count,
    retweetCount: row.retweet_count,
    quoteCount: row.quote_count,
    reactions: row.reactions || {},
    retweetOf: retweetData,
  };
}

export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await knex('posts')
      .whereNull('parent_id')
      .orderBy('created_at', 'desc');

    const result = [];
    for (const row of rows) {
      const dbUser = await knex('users').where({ id: row.user_id }).first();
      const avatar = dbUser ? dbUser.profile_picture_url : null;
      const replies = await fetchRepliesRecursive(row.id);

      let retweetData: any = null;
      if (row.retweet_of) {
        retweetData = await fetchSinglePost(row.retweet_of);
      }

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
        reactions: row.reactions || {},
        retweetOf: retweetData,
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
      user_id: user.id,
      username: user.username,
      user_handle: user.handle,
      user_verified: !!user.verified,
      sections: JSON.stringify(sections),
      reaction_count: 0,
      retweet_count: 0,
      quote_count: 0,
      reactions: JSON.stringify({}),
      retweet_of: null,
    });

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
      reactions: {},
      retweetOf: null,
    };

    res.status(201).json({ success: true, data: newPost });
  } catch (err: any) {
    console.error('[createRootPost] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

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
      retweet_of: null,
    });

    await knex('posts').where({ id: parentId }).increment('quote_count', 1);

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
      retweetOf: null,
    };
    res.status(201).json({ success: true, data: newReply });
  } catch (err: any) {
    console.error('[createReply] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

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

export const addReaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const { reactionEmoji } = req.body;
    if (!postId || !reactionEmoji) {
      res.status(400).json({
        success: false,
        error: 'Missing postId or reactionEmoji',
      });
      return;
    }
    const post = await knex('posts').where({ id: postId }).first();
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }
    let reactionsObj = post.reactions || {};
    if (!reactionsObj[reactionEmoji]) {
      reactionsObj[reactionEmoji] = 1;
    } else {
      reactionsObj[reactionEmoji] += 1;
    }
    let totalReactions = 0;
    Object.values(reactionsObj).forEach((val: any) => {
      totalReactions += val;
    });
    await knex('posts')
      .where({ id: postId })
      .update({
        reactions: reactionsObj,
        reaction_count: totalReactions,
      });
    const updatedPost = {
      ...post,
      reactions: reactionsObj,
      reaction_count: totalReactions,
    };
    res.json({ success: true, data: updatedPost });
  } catch (error: any) {
    console.error('[addReaction] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createRetweet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { retweetOf, user, sections } = req.body;
    if (!retweetOf || !user) {
      res
        .status(400)
        .json({ success: false, error: 'retweetOf and user are required' });
      return;
    }

    const originalPost = await knex('posts').where({ id: retweetOf }).first();
    if (!originalPost) {
      res
        .status(404)
        .json({ success: false, error: 'Post to retweet not found' });
      return;
    }

    const newId = uuidv4();
    await knex('posts').insert({
      id: newId,
      parent_id: null,
      user_id: user.id,
      username: user.username,
      user_handle: user.handle,
      user_verified: !!user.verified,
      sections: JSON.stringify(sections || []),
      reaction_count: 0,
      retweet_count: 0,
      quote_count: 0,
      reactions: JSON.stringify({}),
      retweet_of: retweetOf,
    });

    await knex('posts')
      .where({ id: retweetOf })
      .increment('retweet_count', 1);

    const dbUser = await knex('users').where({ id: user.id }).first();
    const avatar = dbUser ? dbUser.profile_picture_url : null;
    const retweetOfData = await fetchSinglePost(retweetOf);

    const newRetweetPost = {
      id: newId,
      parentId: null,
      user: {
        id: user.id,
        username: user.username,
        handle: user.handle,
        verified: !!user.verified,
        avatar,
      },
      sections: sections || [],
      createdAt: new Date().toISOString(),
      replies: [],
      reactionCount: 0,
      retweetCount: 0,
      quoteCount: 0,
      reactions: {},
      retweetOf: retweetOfData,
    };

    res.status(201).json({ success: true, data: newRetweetPost });
  } catch (error: any) {
    console.error('[createRetweet] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PATCH /api/posts/update
 * Body: { postId: string, sections: Section[] }
 * Edits the sections of an existing post.
 */
export const updatePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId, sections } = req.body;
    if (!postId || !sections) {
      res.status(400).json({ success: false, error: 'Missing postId or sections' });
      return;
    }

    const post = await knex('posts').where({ id: postId }).first();
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }

    // Update only the sections
    await knex('posts')
      .where({ id: postId })
      .update({ sections: JSON.stringify(sections) });

    // Re-fetch the updated post fully (with user, retweetOf, etc.)
    const updatedPost = await fetchSinglePost(postId);
    if (!updatedPost) {
      res.status(500).json({ success: false, error: 'Error refetching updated post' });
      return;
    }

    res.json({ success: true, data: updatedPost });
  } catch (err: any) {
    console.error('[updatePost] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
