export function fixImageUrl(url: string): string {
  if (!url) return '';

  // Handle Helius CDN URLs with double slashes
  if (url.includes('cdn.helius-rpc.com') && url.includes('//https://')) {
    return url.replace('//https://', '/https://');
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
