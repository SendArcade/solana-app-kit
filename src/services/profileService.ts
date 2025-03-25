/**
 * File: src/services/profileService.ts
 *
 * Handles profile-related server requests and logic.
 */

import {SERVER_URL} from '@env';
import { Wallet } from '../state/auth/reducer';

/**
 * Upload a profile avatar image for a given user.
 *
 * @param userWallet   The user's wallet address (unique ID)
 * @param localFileUri Local file URI of the image
 * @returns New remote avatar URL
 * @throws Error on failure
 */
export async function uploadProfileAvatar(
  userWallet: string,
  localFileUri: string,
): Promise<string> {
  if (!userWallet || !localFileUri || !SERVER_URL) {
    throw new Error('Missing data to upload avatar');
  }

  const formData = new FormData();
  formData.append('userId', userWallet);
  // Append the image under "profilePic"
  formData.append('profilePic', {
    uri: localFileUri,
    type: 'image/jpeg',
    name: `profile_${Date.now()}.jpg`,
  } as any);

  const response = await fetch(`${SERVER_URL}/api/profile/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Upload avatar request failed.');
  }

  return data.url as string;
}

/**
 * Fetch a user's followers from the server.
 * @param userId The user's wallet address or ID
 * @returns An array of follower objects
 */
export async function fetchFollowers(userId: string): Promise<any[]> {
  if (!SERVER_URL) {
    console.warn('SERVER_URL not set. Returning empty followers array.');
    return [];
  }
  try {
    const res = await fetch(
      `${SERVER_URL}/api/profile/followers?userId=${userId}`,
    );
    const data = await res.json();
    if (data.success && Array.isArray(data.followers)) {
      return data.followers;
    }
    return [];
  } catch (err) {
    console.warn('Error fetching followers:', err);
    return [];
  }
}

/**
 * Fetch a user's following list from the server.
 * @param userId The user's wallet address or ID
 * @returns An array of following objects
 */
export async function fetchFollowing(userId: string): Promise<any[]> {
  if (!SERVER_URL) {
    console.warn('SERVER_URL not set. Returning empty following array.');
    return [];
  }
  try {
    const res = await fetch(
      `${SERVER_URL}/api/profile/following?userId=${userId}`,
    );
    const data = await res.json();
    if (data.success && Array.isArray(data.following)) {
      return data.following;
    }
    return [];
  } catch (err) {
    console.warn('Error fetching following:', err);
    return [];
  }
}

/**
 * Checks if a target user is in *my* followers list => do they follow me?
 * @param myWallet  My own wallet ID
 * @param userWallet The target user's ID
 * @returns boolean (true => they follow me)
 */
export async function checkIfUserFollowsMe(
  myWallet: string,
  userWallet: string,
): Promise<boolean> {
  if (!SERVER_URL) {
    console.warn(
      'SERVER_URL not set. Returning false for checkIfUserFollowsMe.',
    );
    return false;
  }
  try {
    const res = await fetch(
      `${SERVER_URL}/api/profile/followers?userId=${myWallet}`,
    );
    const data = await res.json();
    if (data.success && Array.isArray(data.followers)) {
      return data.followers.some((f: any) => f.id === userWallet);
    }
    return false;
  } catch (err) {
    console.warn('Error in checkIfUserFollowsMe:', err);
    return false;
  }
}

export const fetchUserProfile = async (userId: string) => {
  try {
    if (!SERVER_URL) {
      throw new Error('SERVER_URL not set');
    }
    const response = await fetch(`${SERVER_URL}/api/profile?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch profile');
    const data = await response.json();
    
    return {
      url: data.url,
      username: data.username,
      attachmentData: data.attachmentData || {},
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

/**
 * Fetch all wallets for a user
 * @param userId User ID
 * @returns Array of user wallets
 */
export const fetchWallets = async (userId: string): Promise<Wallet[]> => {
  try {
    if (!SERVER_URL) {
      console.warn('SERVER_URL not set. Returning empty wallets array.');
      return [];
    }
    
    const response = await fetch(`${SERVER_URL}/api/profile/wallets?userId=${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch wallets: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.success && Array.isArray(data.wallets)) {
      return data.wallets;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching wallets:', error);
    throw error;
  }
};

/**
 * Add a new wallet for a user
 * @param userId User ID
 * @param walletAddress Wallet address to add
 * @param provider Wallet provider
 * @param name Optional wallet name
 * @returns The newly created wallet
 */
export const addWallet = async (
  userId: string,
  walletAddress: string,
  provider: 'privy' | 'dynamic' | 'turnkey' | 'mwa',
  name?: string,
): Promise<Wallet> => {
  try {
    if (!SERVER_URL) {
      throw new Error('SERVER_URL not set');
    }
    
    const response = await fetch(`${SERVER_URL}/api/profile/addWallet`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        userId,
        walletAddress,
        provider,
        name,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add wallet: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to add wallet');
    }
    
    return data.wallet;
  } catch (error) {
    console.error('Error adding wallet:', error);
    throw error;
  }
};

/**
 * Set a wallet as primary
 * @param userId User ID
 * @param walletAddress Wallet address to set as primary
 * @returns Updated list of wallets
 */
export const setPrimaryWallet = async (
  userId: string,
  walletAddress: string,
): Promise<Wallet[]> => {
  try {
    if (!SERVER_URL) {
      throw new Error('SERVER_URL not set');
    }
    
    const response = await fetch(`${SERVER_URL}/api/profile/setPrimaryWallet`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        userId,
        walletAddress,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to set primary wallet: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to set primary wallet');
    }
    
    return data.wallets;
  } catch (error) {
    console.error('Error setting primary wallet:', error);
    throw error;
  }
};

/**
 * Remove a wallet
 * @param userId User ID
 * @param walletAddress Wallet address to remove
 * @returns true if successful
 */
export const removeWallet = async (
  userId: string,
  walletAddress: string,
): Promise<boolean> => {
  try {
    if (!SERVER_URL) {
      throw new Error('SERVER_URL not set');
    }
    
    const response = await fetch(`${SERVER_URL}/api/profile/removeWallet`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        userId,
        walletAddress,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to remove wallet: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to remove wallet');
    }
    
    return true;
  } catch (error) {
    console.error('Error removing wallet:', error);
    throw error;
  }
};

/**
 * Update a wallet's name
 * @param userId User ID
 * @param walletAddress Wallet address to update
 * @param name New wallet name
 * @returns true if successful
 */
export const updateWalletName = async (
  userId: string,
  walletAddress: string,
  name: string,
): Promise<boolean> => {
  try {
    if (!SERVER_URL) {
      throw new Error('SERVER_URL not set');
    }
    
    const response = await fetch(`${SERVER_URL}/api/profile/updateWalletName`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        userId,
        walletAddress,
        name,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update wallet name: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to update wallet name');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating wallet name:', error);
    throw error;
  }
};
