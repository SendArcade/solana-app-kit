import { Router } from 'express';
import multer from 'multer';
import { uploadFileToGCS } from '../utils/gcs';
import knex from '../db/knex';

const profileImageRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/profile/upload
profileImageRouter.post('/upload', upload.single('profilePic'), async (req: any, res: any) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Example: "uploads/profiles/<userId>-<timestamp>"
    const filePath = `uploads/profiles/${userId}-${Date.now()}`;

    // Upload & get static object URL
    const publicUrl = await uploadFileToGCS(
      filePath,
      req.file.buffer,
      req.file.mimetype
    );

    // Create or update user row
    const existingUser = await knex('users').where({ id: userId }).first();
    if (!existingUser) {
      await knex('users').insert({
        id: userId,
        username: userId,
        handle: '@' + userId.slice(0, 6),
        profile_picture_url: publicUrl,
        created_at: new Date(),
        updated_at: new Date(),
      });
    } else {
      await knex('users')
        .where({ id: userId })
        .update({
          profile_picture_url: publicUrl,
          updated_at: new Date(),
        });
    }

    return res.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('[Profile upload error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/profile?userId=xxx
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

    return res.json({ success: true, url: user.profile_picture_url });
  } catch (error: any) {
    console.error('[Profile fetch error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default profileImageRouter;
