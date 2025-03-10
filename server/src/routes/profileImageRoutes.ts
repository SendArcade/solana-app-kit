/*************************************
 * FILE: server/src/routes/profileImageRoutes.ts
 *************************************/

import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import os from 'os';
import knex from '../db/knex';
import { uploadToIpfs } from '../utils/ipfs';
import fetch from 'node-fetch';

const profileImageRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * ------------------------------------------
 *  EXISTING: Upload profile image logic
 * ------------------------------------------
 */
profileImageRouter.post(
  '/upload',
  upload.single('profilePic'),
  async (req: any, res: any) => {
    try {
      const userId = req.body.userId;
      if (!userId) {
        return res.status(400).json({ success: false, error: 'Missing userId' });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      // 1) Compress the image using sharp
      const outputFormat = 'jpeg';
      const compressedBuffer = await sharp(req.file.buffer)
        .resize({ width: 1024, withoutEnlargement: true })
        .toFormat(outputFormat, { quality: 80 })
        .toBuffer();

      // 2) Write to a temp file
      const tempFileName = `profile-${userId}-${Date.now()}.${outputFormat}`;
      const tempFilePath = path.join(os.tmpdir(), tempFileName);
      await fs.promises.writeFile(tempFilePath, compressedBuffer);

      // 3) Prepare IPFS metadata
      const metadata = {
        name: 'Profile Picture',
        symbol: 'PFP',
        description: `Profile picture for user ${userId}`,
        showName: false,
      };

      // 4) Upload image to IPFS
      const ipfsResult = await uploadToIpfs(tempFilePath, metadata);

      // 5) Clean up temp file
      await fs.promises.unlink(tempFilePath);

      // 6) Attempt to fetch the returned metadata JSON
      let ipfsImageUrl = ipfsResult;
      const metadataResponse = await fetch(ipfsResult);
      if (metadataResponse.ok) {
        const metadataJson: any = await metadataResponse.json();
        if (metadataJson.image) {
          ipfsImageUrl = metadataJson.image;
        }
      }

      // 7) Upsert user in "users" table, setting profile_picture_url
      const existingUser = await knex('users').where({ id: userId }).first();
      if (!existingUser) {
        await knex('users').insert({
          id: userId,
          username: userId, // default
          handle: '@' + userId.slice(0, 6),
          profile_picture_url: ipfsImageUrl,
          created_at: new Date(),
          updated_at: new Date(),
        });
      } else {
        await knex('users').where({ id: userId }).update({
          profile_picture_url: ipfsImageUrl,
          updated_at: new Date(),
        });
      }

      return res.json({ success: true, url: ipfsImageUrl });
    } catch (error: any) {
      console.error('[Profile upload error]', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },
);

/**
 * ------------------------------------------
 *  EXISTING: Fetch user’s profile data
 * ------------------------------------------
 */
profileImageRouter.get('/', async (req: any, res: any) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId' });
    }

    const user = await knex('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Return basic user info, possibly we can also return followers/following counts
    // (But we have separate endpoints for that.)
    return res.json({
      success: true,
      url: user.profile_picture_url,
      username: user.username,
    });
  } catch (error: any) {
    console.error('[Profile fetch error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ------------------------------------------
 *  EXISTING: Update user’s username
 * ------------------------------------------
 */
profileImageRouter.post('/updateUsername', async (req: any, res: any) => {
  try {
    const { userId, username } = req.body;
    if (!userId || !username) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId or username',
      });
    }

    const existingUser = await knex('users').where({ id: userId }).first();
    if (!existingUser) {
      await knex('users').insert({
        id: userId,
        username,
        handle: '@' + userId.slice(0, 6),
        profile_picture_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
    } else {
      await knex('users').where({ id: userId }).update({
        username,
        updated_at: new Date(),
      });
    }

    return res.json({ success: true, username });
  } catch (error: any) {
    console.error('[updateUsername error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ------------------------------------------
 *  NEW: Follow a user
 *  Body: { followerId, followingId }
 * ------------------------------------------
 */
profileImageRouter.post('/follow', async (req: any, res: any) => {
  try {
    const { followerId, followingId } = req.body;
    if (!followerId || !followingId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing followerId or followingId' });
    }
    if (followerId === followingId) {
      return res
        .status(400)
        .json({ success: false, error: 'Cannot follow yourself' });
    }

    // Ensure both users exist
    const followerExists = await knex('users').where({ id: followerId }).first();
    const followingExists = await knex('users').where({ id: followingId }).first();
    if (!followerExists || !followingExists) {
      return res
        .status(404)
        .json({ success: false, error: 'Follower or following user not found' });
    }

    // Insert into follows if not already present
    await knex('follows').insert({
      follower_id: followerId,
      following_id: followingId,
    }).onConflict(['follower_id', 'following_id']).ignore();

    return res.json({ success: true });
  } catch (error: any) {
    console.error('[Follow user error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ------------------------------------------
 *  NEW: Unfollow a user
 *  Body: { followerId, followingId }
 * ------------------------------------------
 */
profileImageRouter.post('/unfollow', async (req: any, res: any) => {
  try {
    const { followerId, followingId } = req.body;
    if (!followerId || !followingId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing followerId or followingId' });
    }

    // Delete from follows table
    await knex('follows')
      .where({ follower_id: followerId, following_id: followingId })
      .del();

    return res.json({ success: true });
  } catch (error: any) {
    console.error('[Unfollow user error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ------------------------------------------
 *  NEW: GET list of a user’s followers
 *  Query param: ?userId=xxx
 * ------------------------------------------
 */
profileImageRouter.get('/followers', async (req: any, res: any) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing userId param' });
    }

    const rows = await knex('follows')
      .select('follower_id')
      .where({ following_id: userId });

    const followerIds = rows.map(r => r.follower_id);

    // Optional: fetch user details
    const followers = await knex('users').whereIn('id', followerIds);

    return res.json({
      success: true,
      followers,
    });
  } catch (error: any) {
    console.error('[Get followers error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ------------------------------------------
 *  NEW: GET list of a user’s following
 *  Query param: ?userId=xxx
 * ------------------------------------------
 */
profileImageRouter.get('/following', async (req: any, res: any) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing userId param' });
    }

    const rows = await knex('follows')
      .select('following_id')
      .where({ follower_id: userId });

    const followingIds = rows.map(r => r.following_id);

    // Optional: fetch user details
    const following = await knex('users').whereIn('id', followingIds);

    return res.json({
      success: true,
      following,
    });
  } catch (error: any) {
    console.error('[Get following error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default profileImageRouter;
