// FILE: server/src/controllers/UploadMetadataController.ts

import {Request, Response} from 'express';
import {uploadToIpfs} from '../utils/ipfs';

export async function UploadMetadataController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {tokenName, tokenSymbol, description, twitter, telegram, website} =
      req.body;
    if (!tokenName || !tokenSymbol || !description) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields (tokenName, tokenSymbol, description)',
      });
      return;
    }
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'Image file is required. (Form field name: "image")',
      });
      return;
    }

    // Upload image and metadata to IPFS via Pump.fun
    // Use buffer instead of path since we're using memory storage
    const imageBuffer = req.file.buffer;
    if (!imageBuffer) {
      res.status(400).json({
        success: false,
        error: 'Image buffer is missing from the uploaded file',
      });
      return;
    }

    const metadataObj = {
      name: tokenName,
      symbol: tokenSymbol,
      description,
      showName: true,
      twitter: twitter || '',
      telegram: telegram || '',
      website: website || '',
    };
    const metadataUri = await uploadToIpfs(imageBuffer, metadataObj);

    res.json({
      success: true,
      metadataUri,
    });
  } catch (err: any) {
    console.error('[UploadMetadataController] Error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Unknown error uploading metadata.',
    });
  }
}
