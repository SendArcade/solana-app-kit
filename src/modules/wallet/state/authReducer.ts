import {SERVER_URL} from '@env';
import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import { WalletProviderType } from '../types';

export interface AuthState {
  provider: WalletProviderType | null;
  address: string | null;
  isLoggedIn: boolean;
  profilePicUrl: string | null;
  username: string | null;
  description: string | null;
  // Attachment data object to hold any attached profile data
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
  description: null,
  attachmentData: {},
};

const SERVER_BASE_URL = SERVER_URL || 'http://localhost:3000';

/**
 * Fetch the user's profile from the server
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
        description: data.description,
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
 * Update the user's username
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
 * Update the user's description
 */
export const updateDescription = createAsyncThunk(
  'auth/updateDescription',
  async (
    {userId, newDescription}: {userId: string; newDescription: string},
    thunkAPI,
  ) => {
    try {
      const response = await fetch(
        `${SERVER_BASE_URL}/api/profile/updateDescription`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({userId, description: newDescription}),
        },
      );
      const data = await response.json();
      if (!data.success) {
        return thunkAPI.rejectWithValue(
          data.error || 'Failed to update description',
        );
      }
      return data.description as string;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.message || 'Error updating description',
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
        provider: WalletProviderType;
        address: string;
        profilePicUrl?: string;
        username?: string;
        description?: string;
      }>,
    ) {
      // Keep existing profile data if no new data provided
      state.provider = action.payload.provider;
      state.address = action.payload.address;
      state.isLoggedIn = true;
      
      // Only update if provided or not existing
      state.profilePicUrl = action.payload.profilePicUrl || state.profilePicUrl;
      state.username = action.payload.username || state.username;
      state.description = action.payload.description || state.description;
    },
    logoutSuccess(state) {
      state.provider = null;
      state.address = null;
      state.isLoggedIn = false;
      state.profilePicUrl = null;
      state.username = null;
      state.description = null;
      state.attachmentData = {};
    },
    updateProfilePic(state, action: PayloadAction<string>) {
      state.profilePicUrl = action.payload;
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchUserProfile.fulfilled, (state, action) => {
      const {
        profilePicUrl,
        username,
        description,
        attachmentData,
      } = action.payload as any;

      // Only update if current user matches requested profile
      const requestedUserId = action.meta.arg;
      if (
        state.isLoggedIn && 
        state.address && 
        requestedUserId && 
        requestedUserId.toLowerCase() === state.address.toLowerCase()
      ) {
        state.profilePicUrl = profilePicUrl || state.profilePicUrl;
        state.username = username || state.username;
        state.description = description || state.description;
        state.attachmentData = attachmentData || state.attachmentData || {};
      }
    });

    builder.addCase(updateUsername.fulfilled, (state, action) => {
      state.username = action.payload;
    });

    builder.addCase(updateDescription.fulfilled, (state, action) => {
      state.description = action.payload;
    });
  },
});

export const {loginSuccess, logoutSuccess, updateProfilePic} = authSlice.actions;
export default authSlice.reducer; 