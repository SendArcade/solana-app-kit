import {SERVER_URL} from '@env';
import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';

// Wallet interface for multiple wallets
export interface Wallet {
  id?: number;
  user_id: string;
  wallet_address: string;
  provider: 'privy' | 'dynamic' | 'turnkey' | 'mwa';
  name: string;
  is_primary: boolean;
  created_at?: string;
}

export interface AuthState {
  provider: 'privy' | 'dynamic' | 'turnkey' | 'mwa' |  null;
  address: string | null;
  isLoggedIn: boolean;
  profilePicUrl: string | null;
  username: string | null; // storing user's chosen display name
  // NEW: array of user wallets
  wallets: Wallet[];
  // NEW: unique userId (not necessarily a wallet address)
  userId: string | null;
  // NEW: attachmentData object to hold any attached profile data (e.g., coin)
  attachmentData?: {
    coin?: {
      mint: string;
      symbol?: string;
      name?: string;
    };
  };
}

const initialState: AuthState = {
  provider: null,
  address: null,
  isLoggedIn: false,
  profilePicUrl: null,
  username: null,
  wallets: [],
  userId: null,
  attachmentData: {},
};

const SERVER_BASE_URL = SERVER_URL || 'http://localhost:3000';

/**
 * Fetch the user's profile from the server, including profile pic URL, username,
 * and attachment data.
 */
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (userId: string, thunkAPI) => {
    const response = await fetch(
      `${SERVER_BASE_URL}/api/profile?userId=${userId}`,
    );
    const data = await response.json();
    if (data.success) {
      return {
        profilePicUrl: data.url,
        username: data.username,
        attachmentData: data.attachmentData || {},
      };
    } else {
      return thunkAPI.rejectWithValue(
        data.error || 'Failed to fetch user profile',
      );
    }
  },
);

/**
 * Fetch all wallets for a user
 */
export const fetchUserWallets = createAsyncThunk(
  'auth/fetchUserWallets',
  async (userId: string, thunkAPI) => {
    try {
      const response = await fetch(
        `${SERVER_BASE_URL}/api/profile/wallets?userId=${userId}`,
      );
      const data = await response.json();
      if (!data.success) {
        return thunkAPI.rejectWithValue(
          data.error || 'Failed to fetch user wallets',
        );
      }
      return data.wallets as Wallet[];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.message || 'Error fetching wallets',
      );
    }
  },
);

/**
 * Add a new wallet for the user
 */
export const addWallet = createAsyncThunk(
  'auth/addWallet',
  async (
    {
      userId,
      walletAddress,
      provider,
      name,
    }: {
      userId: string;
      walletAddress: string;
      provider: 'privy' | 'dynamic' | 'turnkey' | 'mwa';
      name?: string;
    },
    thunkAPI,
  ) => {
    try {
      const response = await fetch(`${SERVER_BASE_URL}/api/profile/addWallet`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          userId,
          walletAddress,
          provider,
          name,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        return thunkAPI.rejectWithValue(
          data.error || 'Failed to add wallet',
        );
      }
      return data.wallet as Wallet;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.message || 'Error adding wallet',
      );
    }
  },
);

/**
 * Set a wallet as primary
 */
export const setPrimaryWallet = createAsyncThunk(
  'auth/setPrimaryWallet',
  async (
    {
      userId,
      walletAddress,
    }: {
      userId: string;
      walletAddress: string;
    },
    thunkAPI,
  ) => {
    try {
      const response = await fetch(
        `${SERVER_BASE_URL}/api/profile/setPrimaryWallet`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            userId,
            walletAddress,
          }),
        },
      );
      const data = await response.json();
      if (!data.success) {
        return thunkAPI.rejectWithValue(
          data.error || 'Failed to set primary wallet',
        );
      }
      return data.wallets as Wallet[];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.message || 'Error setting primary wallet',
      );
    }
  },
);

/**
 * Remove a wallet
 */
export const removeWallet = createAsyncThunk(
  'auth/removeWallet',
  async (
    {
      userId,
      walletAddress,
    }: {
      userId: string;
      walletAddress: string;
    },
    thunkAPI,
  ) => {
    try {
      const response = await fetch(
        `${SERVER_BASE_URL}/api/profile/removeWallet`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            userId,
            walletAddress,
          }),
        },
      );
      const data = await response.json();
      if (!data.success) {
        return thunkAPI.rejectWithValue(
          data.error || 'Failed to remove wallet',
        );
      }
      
      // After successful removal, fetch updated wallets
      const walletsResponse = await fetch(
        `${SERVER_BASE_URL}/api/profile/wallets?userId=${userId}`,
      );
      const walletsData = await walletsResponse.json();
      
      if (!walletsData.success) {
        return thunkAPI.rejectWithValue(
          walletsData.error || 'Failed to fetch updated wallets',
        );
      }
      
      return {
        removedWallet: walletAddress,
        updatedWallets: walletsData.wallets,
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.message || 'Error removing wallet',
      );
    }
  },
);

/**
 * Update a wallet's name
 */
export const updateWalletName = createAsyncThunk(
  'auth/updateWalletName',
  async (
    {
      userId,
      walletAddress,
      name,
    }: {
      userId: string;
      walletAddress: string;
      name: string;
    },
    thunkAPI,
  ) => {
    try {
      const response = await fetch(
        `${SERVER_BASE_URL}/api/profile/updateWalletName`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            userId,
            walletAddress,
            name,
          }),
        },
      );
      const data = await response.json();
      if (!data.success) {
        return thunkAPI.rejectWithValue(
          data.error || 'Failed to update wallet name',
        );
      }
      return { walletAddress, name };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.message || 'Error updating wallet name',
      );
    }
  },
);

/**
 * Update the user's username in the database.
 */
export const updateUsername = createAsyncThunk(
  'auth/updateUsername',
  async (
    {userId, newUsername}: {userId: string; newUsername: string},
    thunkAPI,
  ) => {
    try {
      const response = await fetch(
        `${SERVER_BASE_URL}/api/profile/updateUsername`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({userId, username: newUsername}),
        },
      );
      const data = await response.json();
      if (!data.success) {
        return thunkAPI.rejectWithValue(
          data.error || 'Failed to update username',
        );
      }
      return data.username as string;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.message || 'Error updating username',
      );
    }
  },
);

/**
 * Attach or update a coin on the user's profile.
 * Now accepts: { userId, attachmentData } where attachmentData = { coin: { mint, symbol, name } }
 */
export const attachCoinToProfile = createAsyncThunk(
  'auth/attachCoinToProfile',
  async (
    {
      userId,
      attachmentData,
    }: {
      userId: string;
      attachmentData: {coin: {mint: string; symbol?: string; name?: string}};
    },
    thunkAPI,
  ) => {
    try {
      const response = await fetch(
        `${SERVER_BASE_URL}/api/profile/attachCoin`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            userId,
            attachmentData,
          }),
        },
      );
      const data = await response.json();
      if (!data.success) {
        return thunkAPI.rejectWithValue(data.error || 'Failed to attach coin');
      }
      return data.attachmentData as {
        coin: {mint: string; symbol?: string; name?: string};
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.message || 'Attach coin request failed.',
      );
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(
      state,
      action: PayloadAction<{
        provider: 'privy' | 'dynamic' | 'turnkey' | 'mwa';
        address: string;
        userId?: string;
        profilePicUrl?: string;
        username?: string;
        wallet?: Wallet;
      }>,
    ) {
      state.provider = action.payload.provider;
      state.address = action.payload.address;
      state.isLoggedIn = true;
      state.profilePicUrl = action.payload.profilePicUrl || null;
      state.username = action.payload.username || null;
      state.userId = action.payload.userId || action.payload.address;
      
      // Add the wallet if provided
      if (action.payload.wallet) {
        const exists = state.wallets.some(
          w => w.wallet_address === action.payload.wallet?.wallet_address
        );
        
        if (!exists) {
          state.wallets.push(action.payload.wallet);
        }
      } else if (action.payload.address) {
        // If no wallet object but we have address and provider, create a basic one
        const exists = state.wallets.some(
          w => w.wallet_address === action.payload.address
        );
        
        if (!exists) {
          const newWallet: Wallet = {
            user_id: action.payload.userId || action.payload.address,
            wallet_address: action.payload.address,
            provider: action.payload.provider,
            name: action.payload.username || 'Default Wallet',
            is_primary: true,
          };
          state.wallets.push(newWallet);
        }
      }
    },
    logoutSuccess(state) {
      state.provider = null;
      state.address = null;
      state.isLoggedIn = false;
      state.profilePicUrl = null;
      state.username = null;
      state.attachmentData = {};
      state.wallets = [];
      state.userId = null;
    },
    updateProfilePic(state, action: PayloadAction<string>) {
      state.profilePicUrl = action.payload;
    },
    // Set the active wallet from one of the user's wallets
    switchWallet(state, action: PayloadAction<string>) {
      const targetWallet = state.wallets.find(
        w => w.wallet_address === action.payload
      );
      if (targetWallet) {
        state.address = targetWallet.wallet_address;
        state.provider = targetWallet.provider;
      }
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchUserProfile.fulfilled, (state, action) => {
      const {
        profilePicUrl: fetchedProfilePicUrl,
        username: fetchedUsername,
        attachmentData,
      } = action.payload as any;

      const requestedUserId = action.meta.arg;
      if (
        requestedUserId &&
        state.userId &&
        requestedUserId.toLowerCase() === state.userId.toLowerCase()
      ) {
        state.profilePicUrl = fetchedProfilePicUrl || null;
        state.username = fetchedUsername || null;
        state.attachmentData = attachmentData || {};
      }
    });

    builder.addCase(updateUsername.fulfilled, (state, action) => {
      state.username = action.payload;
    });

    builder.addCase(attachCoinToProfile.fulfilled, (state, action) => {
      if (state.address) {
        state.attachmentData = {coin: action.payload.coin};
      }
    });
    
    // Handle fetchUserWallets
    builder.addCase(fetchUserWallets.fulfilled, (state, action) => {
      state.wallets = action.payload;
      
      // Update current active address if there's a primary wallet
      const primaryWallet = action.payload.find(w => w.is_primary);
      if (primaryWallet) {
        state.address = primaryWallet.wallet_address;
        state.provider = primaryWallet.provider;
      }
    });
    
    // Handle addWallet
    builder.addCase(addWallet.fulfilled, (state, action) => {
      const newWallet = action.payload;
      
      // Add the new wallet if it doesn't exist
      const exists = state.wallets.some(
        w => w.wallet_address === newWallet.wallet_address
      );
      
      if (!exists) {
        state.wallets.push(newWallet);
      }
      
      // If it's primary, update the current address and provider
      if (newWallet.is_primary) {
        state.address = newWallet.wallet_address;
        state.provider = newWallet.provider;
      }
    });
    
    // Handle setPrimaryWallet
    builder.addCase(setPrimaryWallet.fulfilled, (state, action) => {
      state.wallets = action.payload;
      
      // Update current active address to the new primary
      const primaryWallet = action.payload.find(w => w.is_primary);
      if (primaryWallet) {
        state.address = primaryWallet.wallet_address;
        state.provider = primaryWallet.provider;
      }
    });
    
    // Handle removeWallet
    builder.addCase(removeWallet.fulfilled, (state, action) => {
      const { removedWallet, updatedWallets } = action.payload as any;
      
      // Update wallets list
      state.wallets = updatedWallets;
      
      // If we removed the active wallet, switch to the primary
      if (state.address === removedWallet) {
        const primaryWallet = updatedWallets.find((w: Wallet) => w.is_primary);
        if (primaryWallet) {
          state.address = primaryWallet.wallet_address;
          state.provider = primaryWallet.provider;
        } else if (updatedWallets.length > 0) {
          // If no primary, use the first wallet
          state.address = updatedWallets[0].wallet_address;
          state.provider = updatedWallets[0].provider;
        } else {
          // If no wallets left, clear address and provider
          state.address = null;
          state.provider = null;
        }
      }
    });
    
    // Handle updateWalletName
    builder.addCase(updateWalletName.fulfilled, (state, action) => {
      const { walletAddress, name } = action.payload as any;
      
      // Find and update the wallet name
      const wallet = state.wallets.find(w => w.wallet_address === walletAddress);
      if (wallet) {
        wallet.name = name;
      }
    });
  },
});

export const {loginSuccess, logoutSuccess, updateProfilePic, switchWallet} =
  authSlice.actions;
export default authSlice.reducer;
