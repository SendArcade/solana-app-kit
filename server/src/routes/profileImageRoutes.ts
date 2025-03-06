// server/src/routes/profileImageRouter.ts

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
 * POST /api/profile/upload
 * Upload or update the profile picture of the user, storing the image on IPFS.
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

      // 1) Compress the image using sharp (keeping current compression logic)
      const outputFormat = 'jpeg';
      const compressedBuffer = await sharp(req.file.buffer)
        .resize({ width: 1024, withoutEnlargement: true })
        .toFormat(outputFormat, { quality: 80 })
        .toBuffer();

      // 2) Write the compressed buffer to a temporary file
      const tempFileName = `profile-${userId}-${Date.now()}.${outputFormat}`;
      const tempFilePath = path.join(os.tmpdir(), tempFileName);
      await fs.promises.writeFile(tempFilePath, compressedBuffer);

      // 3) Define metadata for the IPFS upload
      const metadata = {
        name: 'Profile Picture',
        symbol: 'PFP',
        description: `Profile picture for user ${userId}`,
        showName: false,
      };

      // 4) Upload the image to IPFS via your Pump Fun IPFS API
      //    ipfsResult is expected to be a URL pointing to a JSON metadata file.
      const ipfsResult = await uploadToIpfs(tempFilePath, metadata);

      // 5) Clean up the temporary file
      await fs.promises.unlink(tempFilePath);

      // 6) Fetch the metadata JSON from the returned IPFS URL
      //    and extract the "image" field which contains the direct image URL.
      let ipfsImageUrl = ipfsResult; // Fallback in case fetch fails
      const metadataResponse = await fetch(ipfsResult);
      if (metadataResponse.ok) {
        const metadataJson : any = await metadataResponse.json();
        if (metadataJson.image) {
          ipfsImageUrl = metadataJson.image;
        }
      }

      // 7) Update or create the user record with the direct IPFS image URL
      const existingUser = await knex('users').where({ id: userId }).first();
      if (!existingUser) {
        await knex('users').insert({
          id: userId,
          username: userId, // default to userId if no name set
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
 * GET /api/profile?userId=xxx
 * Returns the user's profile picture URL and username.
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
 * POST /api/profile/updateUsername
 * Updates the user's display name in the "users" table.
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
        profile_picture_url: null, // No profile picture yet
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

export default profileImageRouter;
