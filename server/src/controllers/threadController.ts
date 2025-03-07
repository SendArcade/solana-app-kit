/* eslint-disable @typescript-eslint/no-unused-vars */
import {Request, Response, NextFunction} from 'express';
import knex from '../db/knex';
import {v4 as uuidv4} from 'uuid';

/**
 * Shape of a single post in our DB
 * We do not store username, handle, etc. directly in "posts" now.
 */
type DBPostRow = {
  id: string;
  parent_id: string | null;
  user_id: string; // references users.id
  sections: any; // JSON
  reaction_count: number;
  retweet_count: number;
  quote_count: number;
  created_at: string;
  retweet_of: string | null; // references posts.id
  reactions: Record<string, number>;
};

type DBUserRow = {
  id: string; // user ID or wallet address
  username: string;
  handle: string;
  profile_picture_url: string | null;
  // add "verified" column if available
};

/**
 * Merges DBPostRow with user data from DBUserRow to produce the shape the client needs.
 */
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
    retweetOf: postRow.retweet_of, // <-- Changed: now pass the DB field if available
  };
}

/**
 * Fetch retweetOf post if retweet_of is not null.
 * We'll do a small helper that fetches that post from DB and merges user info.
 */
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

/**
 * Recursively build up the "replies" array for a post.
 */
function buildReplies(post: any, allPosts: any[]): any {
  const replies = allPosts.filter(p => p.parentId === post.id);
  replies.forEach(r => {
    r.replies = buildReplies(r, allPosts);
  });
  return replies;
}

/**
 * GET /api/posts
 * Return all posts with user data, including nested replies.
 */
export async function getAllPosts(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // 1) fetch all posts joined with user data
    const rows = await knex<DBPostRow>('posts')
      .select(
        'posts.*',
        'users.username',
        'users.handle',
        'users.profile_picture_url',
      )
      .leftJoin('users', 'users.id', 'posts.user_id')
      .orderBy('posts.created_at', 'asc');

    // 2) map them to client shape
    const partialPosts = rows.map(mapPostRowToClientShape);

    // 3) fill retweetOf if needed
    for (const p of partialPosts) {
      if (p.retweetOf) {
        const retweetData = await fetchRetweetOf(p.retweetOf);
        p.retweetOf = retweetData;
      }
    }

    // 4) build a tree structure for replies
    const allPostsMapped = partialPosts.map(p => {
      return {...p, retweet_of: undefined};
    });
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
 * Create a root-level post (no parentId).
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
 * Create a reply to a parent post.
 * Body expects: { parentId, userId, sections }
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
 * DELETE /api/posts/:postId
 */
export async function deletePost(req: Request, res: Response) {
  try {
    const {postId} = req.params;
    if (!postId) {
      return res
        .status(400)
        .json({success: false, error: 'Missing postId in params'});
    }

    await knex('posts').where({id: postId}).del();

    return res.json({success: true});
  } catch (err: any) {
    console.error('[deletePost] Error:', err);
    return res.status(500).json({success: false, error: err.message});
  }
}

function isValidUuid(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
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

    if (!isValidUuid(postId)) {
      res.status(400).json({
        success: false,
        error:
          'Invalid post id: reactions can only be added to persisted posts.',
      });
      return;
    }

    const post = await knex('posts').where({id: postId}).first();
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
    return;
  } catch (error: any) {
    console.error('[addReaction] Error:', error);
    res.status(500).json({success: false, error: error.message});
  }
};

/**
 * POST /api/posts/retweet
 * Body: { retweetOf, userId, sections?: ThreadSection[] }
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
