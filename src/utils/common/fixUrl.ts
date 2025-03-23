export function fixImageUrl(url: string): string {
  if (!url) return '';

  // Handle Helius CDN URLs with double slashes
  if (url.includes('cdn.helius-rpc.com') && url.includes('//https://')) {
    return url.replace('//https://', '/https://');
  }
  
  // Handle URLs with quotes (sometimes in Helius response)
  if (url.startsWith('"') && url.endsWith('"')) {
    return fixImageUrl(url.slice(1, -1));
  }

  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  if (url.startsWith('ar://')) {
    return url.replace('ar://', 'https://arweave.net/');
  }
  if (url.startsWith('/')) {
    return `https://arweave.net${url}`;
  }
  if (!url.startsWith('http') && !url.startsWith('data:')) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Extract the best available image URL from the Helius API asset response
 */
export function extractAssetImage(asset: any): string {
  if (!asset) return '';
  
  // Try to find the image in the most common locations
  const possibleImageSources = [
    // Direct image property
    asset.image,
    
    // Links section
    asset.content?.links?.image,
    
    // First file in the files array
    asset.content?.files?.[0]?.uri,
    asset.content?.files?.[0]?.cdn_uri,
    
    // Metadata
    asset.content?.metadata?.image,
    
    // Check other files for image types
    ...(asset.content?.files || [])
      .filter((file: any) => 
        file.mime?.startsWith('image/') || 
        file.uri?.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)
      )
      .map((file: any) => file.uri || file.cdn_uri)
  ];
  
  // Return the first valid image URL we find
  for (const source of possibleImageSources) {
    if (source && typeof source === 'string') {
      return fixImageUrl(source);
    }
  }
  
  return '';
}
