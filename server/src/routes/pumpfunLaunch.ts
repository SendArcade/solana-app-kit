// server/src/routes/pinataLaunch.ts
import {Router} from 'express';
import multer from 'multer';
import {UploadMetadataController} from '../controllers/uploadMetadataController';

// We store uploads in ./uploads by default
const upload = multer({dest: 'uploads/'});

const launchRouter = Router();

/**
 * POST /api/pinata-launch/launch
 * multipart/form-data => { publicKey, tokenName, tokenSymbol, description, image }
 */
launchRouter.post(
  '/uploadMetadata',
  upload.single('image'),
  UploadMetadataController,
);

export {launchRouter};
