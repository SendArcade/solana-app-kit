// File: src/config/constants.ts

import {
  HELIUS_RPC_URL,
  HELIUS_API_KEY,
  SERVER_URL,
  TURNKEY_BASE_URL,
  TURNKEY_RP_ID,
  TURNKEY_RP_NAME,
  TENSOR_API_KEY,
  // Other env values (e.g. PRIVY_APP_ID, etc.) can be imported as needed.
} from '@env';

export const ENDPOINTS = {
  // Use the SERVER_URL from env
  serverBase: SERVER_URL,
  // Jupiter endpoints – these default values can be overridden by changing SERVER_URL if needed.
  jupiter: {
    quote: 'https://api.jup.ag/swap/v1/quote',
    swap: SERVER_URL + '/api/jupiter/swap',
  },
  // Raydium endpoints are fixed for now.
  raydium: {
    swapApi: 'https://transaction-v1.raydium.io',
    v3Api: 'https://api-v3.raydium.io',
  },
  // Jito block engine endpoint.
  jito: {
    blockEngine: 'https://mainnet.block-engine.jito.wtf:443/api/v1/bundles',
  },
  // Helius RPC endpoint from env
  helius: HELIUS_RPC_URL,
};

export const PUBLIC_KEYS = {
  // Wrapped SOL mint – default constant (can be overridden by a new env value if desired)
  wSolMint: 'So11111111111111111111111111111111111111112',
  // Default receiver public key for transfers
  defaultReceiver: '24MDwQXG2TWiST8ty1rjcrKgtaYaMiLdRxFQawYgZh4v',
  jitoTipAccounts: [
    '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
    'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
    'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
    'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
    'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
    'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
    'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
    '3AVi9Tg9Uo68tJfuvoKvqKNWKc5wPdSSdeBnizKZ6jT',
  ],
};

export const DEFAULT_IMAGES: Record<string, any> = {
  user: require('../assets/images/User.png'),
  user2: require('../assets/images/User2.png'),
  user3: require('../assets/images/User3.png'),
  user5: require('../assets/images/user5.png'),
  SENDlogo: require('../assets/images/SENDlogo.png'),
};
