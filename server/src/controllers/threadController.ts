/* eslint-disable @typescript-eslint/no-unused-vars */
import {Request, Response, NextFunction} from 'express';
import knex from '../db/knex';
import {v4 as uuidv4} from 'uuid';

type DBPostRow = {
  id: string;
  parent_id: string | null;
  user_id: string;
  sections: any;
  reaction_count: number;
  retweet_count: number;
  quote_count: number;
  created_at: string;
  retweet_of: string | null;
  reactions: Record<string, number>;
};

type DBUserRow = {
  id: string;
  username: string;
  handle: string;
  profile_picture_url: string | null;
};

function mapPostRowToClientShape(postRow: DBPostRow & DBUserRow) {
  return {
    id: postRow.id,
    parentId: postRow.parent_id,
    user: {
      id: postRow.user_id,
      username: postRow.username,
      handle: postRow.handle,
      avatar: postRow.profile_picture_url
        ? {uri: postRow.profile_picture_url}
        : null,
      verified: false,
    },
    sections: postRow.sections || [],
    createdAt: postRow.created_at,
    replies: [],
    reactionCount: postRow.reaction_count,
    retweetCount: postRow.retweet_count,
    quoteCount: postRow.quote_count,
    reactions: postRow.reactions || {},
    retweetOf: postRow.retweet_of,
  };
}

async function fetchRetweetOf(postId: string): Promise<any | null> {
  const row = await knex<DBPostRow>('posts')
    .select(
      'posts.*',
      'users.username',
      'users.handle',
      'users.profile_picture_url',
    )
    .leftJoin('users', 'users.id', 'posts.user_id')
    .where('posts.id', postId)
    .first();

  if (!row) return null;
  return {
    id: row.id,
    parentId: row.parent_id,
    user: {
      id: row.user_id,
      username: row.username,
      handle: row.handle,
      avatar: row.profile_picture_url ? {uri: row.profile_picture_url} : null,
      verified: false,
    },
    sections: row.sections || [],
    createdAt: row.created_at,
    replies: [],
    reactionCount: row.reaction_count,
    retweetCount: row.retweet_count,
    quoteCount: row.quote_count,
    reactions: row.reactions || {},
    retweetOf: null,
  };
}

function buildReplies(post: any, allPosts: any[]): any {
  const replies = allPosts.filter((p: any) => p.parentId === post.id);
  replies.forEach((r: any) => {
    r.replies = buildReplies(r, allPosts);
  });
  return replies;
}

/**
 * GET /api/posts
 */
export async function getAllPosts(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rows = await knex<DBPostRow>('posts')
      .select(
        'posts.*',
        'users.username',
        'users.handle',
        'users.profile_picture_url',
      )
      .leftJoin('users', 'users.id', 'posts.user_id')
      .orderBy('posts.created_at', 'asc');

    const partialPosts = rows.map(mapPostRowToClientShape);

    // fill retweetOf
    for (const p of partialPosts) {
      if (p.retweetOf) {
        const retweetData = await fetchRetweetOf(p.retweetOf);
        p.retweetOf = retweetData;
      }
    }

    // build tree
    const allPostsMapped = partialPosts.map(p => ({
      ...p,
      retweet_of: undefined,
    }));
    const rootPosts = allPostsMapped.filter(p => !p.parentId);
    rootPosts.forEach(r => {
      r.replies = buildReplies(r, allPostsMapped);
    });

    return res.json({success: true, data: rootPosts});
  } catch (err) {
    console.error('[getAllPosts] Error:', err);
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Create a root-level post
 * Body expects: { userId, sections }
 */
export async function createRootPost(req: Request, res: Response) {
  try {
    const {userId, sections} = req.body;
    if (!userId) {
      return res.status(400).json({success: false, error: 'Missing userId'});
    }
    if (!sections || !Array.isArray(sections)) {
      return res
        .status(400)
        .json({success: false, error: 'sections must be an array'});
    }

    const newId = uuidv4();
    await knex('posts').insert({
      id: newId,
      parent_id: null,
      user_id: userId,
      sections: JSON.stringify(sections),
      reaction_count: 0,
      retweet_count: 0,
      quote_count: 0,
    });

    const row = await knex<DBPostRow>('posts')
      .select(
        'posts.*',
        'users.username',
        'users.handle',
        'users.profile_picture_url',
      )
      .leftJoin('users', 'users.id', 'posts.user_id')
      .where('posts.id', newId)
      .first();

    if (!row) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve newly created post',
      });
    }

    const postMapped = mapPostRowToClientShape(row);
    return res.json({success: true, data: postMapped});
  } catch (err: any) {
    console.error('[createRootPost] Error:', err);
    return res.status(500).json({success: false, error: err.message});
  }
}

/**
 * Create a reply
 * Body: { parentId, userId, sections }
 * - increments the parent's quote_count in DB
 */
export async function createReply(req: Request, res: Response) {
  try {
    const {parentId, userId, sections} = req.body;
    if (!parentId || !userId || !sections) {
      return res
        .status(400)
        .json({success: false, error: 'Missing parentId, userId or sections'});
    }

    const newId = uuidv4();
    await knex('posts').insert({
      id: newId,
      parent_id: parentId,
      user_id: userId,
      sections: JSON.stringify(sections),
      reaction_count: 0,
      retweet_count: 0,
      quote_count: 0,
    });

    // increment parent's quote_count
    const parentPost = await knex<DBPostRow>('posts')
      .where({id: parentId})
      .first();
    if (parentPost) {
      await knex('posts')
        .where({id: parentId})
        .update({quote_count: parentPost.quote_count + 1});
    }

    const row = await knex<DBPostRow>('posts')
      .select(
        'posts.*',
        'users.username',
        'users.handle',
        'users.profile_picture_url',
      )
      .leftJoin('users', 'users.id', 'posts.user_id')
      .where('posts.id', newId)
      .first();

    if (!row) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve newly created reply',
      });
    }

    const postMapped = mapPostRowToClientShape(row);
    return res.json({success: true, data: postMapped});
  } catch (err: any) {
    console.error('[createReply] Error:', err);
    return res.status(500).json({success: false, error: err.message});
  }
}

/**
 * Delete a post
 * - If it's a retweet, decrement the retweet_count of the original post
 * - If it is a reply, decrement the parent's quote_count
 * - Then delete, letting DB CASCADE handle nested replies
 */
export async function deletePost(req: Request, res: Response) {
  try {
    const {postId} = req.params;
    if (!postId) {
      return res
        .status(400)
        .json({success: false, error: 'Missing postId in params'});
    }

    const post = await knex<DBPostRow>('posts').where({id: postId}).first();
    if (!post) {
      return res.status(404).json({success: false, error: 'Post not found'});
    }

    // if retweet, decrement retweet_count of retweet_of
    if (post.retweet_of) {
      const original = await knex<DBPostRow>('posts')
        .where({id: post.retweet_of})
        .first();
      if (original && original.retweet_count > 0) {
        await knex('posts')
          .where({id: original.id})
          .update({retweet_count: original.retweet_count - 1});
      }
    }

    // if reply, decrement parent's quote_count
    if (post.parent_id) {
      const parent = await knex<DBPostRow>('posts')
        .where({id: post.parent_id})
        .first();
      if (parent && parent.quote_count > 0) {
        await knex('posts')
          .where({id: parent.id})
          .update({quote_count: parent.quote_count - 1});
      }
    }

    // DB cascade will remove children
    await knex('posts').where({id: postId}).del();

    return res.json({
      success: true,
      postId,
      retweetOf: post.retweet_of,
      parentId: post.parent_id,
    });
  } catch (err: any) {
    console.error('[deletePost] Error:', err);
    return res.status(500).json({success: false, error: err.message});
  }
}

/**
 * PATCH /api/posts/:postId/reaction
 * Body: { reactionEmoji }
 */
export const addReaction = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {postId} = req.params;
    const {reactionEmoji} = req.body;

    if (!postId || !reactionEmoji) {
      res.status(400).json({
        success: false,
        error: 'Missing postId or reactionEmoji',
      });
      return;
    }

    const post = await knex<DBPostRow>('posts').where({id: postId}).first();
    if (!post) {
      res.status(404).json({success: false, error: 'Post not found'});
      return;
    }

    let reactionsObj = post.reactions || {};
    if (typeof reactionsObj === 'string') {
      reactionsObj = JSON.parse(reactionsObj);
    }

    if (!reactionsObj[reactionEmoji]) {
      reactionsObj[reactionEmoji] = 1;
    } else {
      reactionsObj[reactionEmoji] += 1;
    }

    let totalReactions = 0;
    Object.values(reactionsObj).forEach((val: any) => {
      totalReactions += val;
    });

    await knex('posts').where({id: postId}).update({
      reactions: reactionsObj,
      reaction_count: totalReactions,
    });

    const updatedPost = {
      ...post,
      reactions: reactionsObj,
      reaction_count: totalReactions,
    };

    res.json({success: true, data: updatedPost});
  } catch (error: any) {
    console.error('[addReaction] Error:', error);
    res.status(500).json({success: false, error: error.message});
  }
};

/**
 * POST /api/posts/retweet
 * Body: { retweetOf, userId, sections? }
 * - Increments the retweetOf post’s retweet_count
 */
export async function createRetweet(req: Request, res: Response) {
  try {
    const {retweetOf, userId, sections = []} = req.body;
    if (!retweetOf || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing retweetOf or userId',
      });
    }

    const newId = uuidv4();
    await knex('posts').insert({
      id: newId,
      parent_id: null,
      user_id: userId,
      sections: JSON.stringify(sections),
      reaction_count: 0,
      retweet_count: 0,
      quote_count: 0,
      retweet_of: retweetOf,
    });

    // increment original's retweet_count
    const original = await knex<DBPostRow>('posts')
      .where({id: retweetOf})
      .first();
    if (original) {
      await knex<DBPostRow>('posts')
        .where({id: retweetOf})
        .update({retweet_count: original.retweet_count + 1});
    }

    const row = await knex<DBPostRow>('posts')
      .select(
        'posts.*',
        'users.username',
        'users.handle',
        'users.profile_picture_url',
      )
      .leftJoin('users', 'users.id', 'posts.user_id')
      .where('posts.id', newId)
      .first();

    if (!row) {
      return res.json({success: false, error: 'Failed to fetch retweet post'});
    }

    const mappedPost = mapPostRowToClientShape(row);
    if (mappedPost && mappedPost.retweetOf) {
      mappedPost.retweetOf = await fetchRetweetOf(mappedPost.retweetOf);
    }

    return res.json({success: true, data: mappedPost});
  } catch (err: any) {
    console.error('[createRetweet] Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to retweet',
    });
  }
}

/**
 * PATCH /api/posts/update
 * Body: { postId, sections }
 * - For editing text sections, etc.
 */
export async function updatePost(req: Request, res: Response) {
  try {
    const {postId, sections} = req.body;
    if (!postId || !sections) {
      return res.status(400).json({
        success: false,
        error: 'Missing postId or sections',
      });
    }

    await knex('posts')
      .where({id: postId})
      .update({sections: JSON.stringify(sections)});

    const updatedRow = await knex<DBPostRow>('posts')
      .select(
        'posts.*',
        'users.username',
        'users.handle',
        'users.profile_picture_url',
      )
      .leftJoin('users', 'users.id', 'posts.user_id')
      .where('posts.id', postId)
      .first();

    if (!updatedRow) {
      return res.json({success: false, error: 'Post not found after update'});
    }
    const mappedPost = mapPostRowToClientShape(updatedRow);

    return res.json({success: true, data: mappedPost});
  } catch (error: any) {
    console.error('[updatePost] Error:', error);
    return res.status(500).json({success: false, error: error.message});
  }
}
