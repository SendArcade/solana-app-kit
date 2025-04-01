// File: src/config/index.ts

import {
  PRIVY_APP_ID,
  PRIVY_CLIENT_ID,
  DYNAMIC_ENVIRONMENT_ID,
  TURNKEY_BASE_URL,
  TURNKEY_RP_ID,
  TURNKEY_RP_NAME,
} from '@env';

import {dummyProfileData} from '../mocks/profileInfoData';
import {tweetsData} from '../mocks/tweets';
import {allposts} from '../mocks/posts';
import {dummyData} from '../mocks/users';

/** Extended config for each auth provider */
export interface PrivyConfig {
  appId: string;
  clientId: string;
}

export interface DynamicConfig {
  environmentId: string;
  appName: string;
  appLogoUrl: string;
}

export interface TurnkeyConfig {
  baseUrl: string;
  rpId: string;
  rpName: string;
}

/** The shape of our custom AuthProviderConfig */
export interface AuthProviderConfig {
  provider: 'privy' | 'dynamic' | 'turnkey';
  loginMethods: Array<'email' | 'sms' | 'google' | 'apple'>;
  privy: PrivyConfig;
  dynamic: DynamicConfig;
  turnkey: TurnkeyConfig;
}

/** Transaction config (unchanged) */
export interface TransactionProviderConfig {
  defaultFeeTier: string;
  defaultMode: 'priority' | 'jito';
  feeTiers: {
    low: number;
    medium: number;
    high: number;
    'very-high': number;
  };
  network: 'mainnet-beta' | 'devnet' | 'testnet';
}

/** Mock data config (unchanged) */
export interface MockDataConfig {
  profileData: typeof dummyProfileData;
  tweetsData: typeof tweetsData;
  postsData: typeof allposts;
  usersData: typeof dummyData;
}

/** Provide default auth config, reading from env or fallback. */
export const DefaultAuthConfig: AuthProviderConfig = {
  provider: 'dynamic', // or 'dynamic', 'turnkey', etc.
  loginMethods: ['email', 'google', 'apple'],

  privy: {
    // Read from environment variables or fallback
    appId: PRIVY_APP_ID || '',
    clientId: PRIVY_CLIENT_ID || '',
  },

  dynamic: {
    environmentId: DYNAMIC_ENVIRONMENT_ID || '',
    appName: 'Solana App Kit',
    appLogoUrl: 'https://solana.com/src/img/branding/solanaLogoMark.svg',
  },

  turnkey: {
    baseUrl: TURNKEY_BASE_URL || '',
    rpId: TURNKEY_RP_ID || '',
    rpName: TURNKEY_RP_NAME || '',
  },
};

/** Provide default transaction config. */
export const DefaultTransactionConfig: TransactionProviderConfig = {
  defaultMode: 'priority',
  feeTiers: {
    low: 100000,
    medium: 5000000,
    high: 100000000,
    'very-high': 2000000000,
  },
  network: 'mainnet-beta',
  defaultFeeTier: ''
};

/** Provide default mock data config. */
export const DefaultMockDataConfig: MockDataConfig = {
  profileData: dummyProfileData,
  tweetsData: tweetsData,
  postsData: allposts,
  usersData: dummyData,
};

/** Overall customization config shape. */
export interface CustomizationConfig {
  auth: AuthProviderConfig;
  transaction: TransactionProviderConfig;
  mockData: MockDataConfig;
}

/** The combined default config. */
export const DefaultCustomizationConfig: CustomizationConfig = {
  auth: DefaultAuthConfig,
  transaction: DefaultTransactionConfig,
  mockData: DefaultMockDataConfig,
};
