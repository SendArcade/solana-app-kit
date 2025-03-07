// server/src/utils/ipfs.ts
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

export async function uploadToIpfs(
  imagePath: string,
  metadata: Record<string, any>,
): Promise<string> {
  const resolvedPath = path.resolve(imagePath);
  const fileBuffer = fs.readFileSync(resolvedPath);

  // 2) Create FormData with all required fields
  const formData = new FormData();

  // Add the image file to FormData
  const fileName = `image-${Date.now()}.png`;
  formData.append('file', fileBuffer, {filename: fileName, contentType: 'image/png'});

  // Add metadata fields to FormData
  formData.append('name', metadata.name || '');
  formData.append('symbol', metadata.symbol || '');
  formData.append('description', metadata.description || '');

  // Add optional social links and other metadata if provided
  if (metadata.twitter) formData.append('twitter', metadata.twitter);
  if (metadata.telegram) formData.append('telegram', metadata.telegram);
  if (metadata.website) formData.append('website', metadata.website);
  formData.append('showName', metadata.showName?.toString() || 'true');

  // 3) Upload to Pump Fun IPFS API
  const metadataResponse = await fetch('https://pump.fun/api/ipfs', {
    method: 'POST',
    body: formData,
  });

  if (!metadataResponse.ok) {
    throw new Error(
      `Failed to upload to Pump Fun IPFS: ${metadataResponse.statusText}`,
    );
  }

  // 4) Extract and return the metadata URI
  const metadataResponseJSON = await metadataResponse.json() as { metadataUri: string };
  const metadataUri = metadataResponseJSON.metadataUri;

  console.log('Metadata URI:', metadataUri);
  return metadataUri;
}

