

// File: src/state/auth/reducer.ts
import { SERVER_URL } from '@env';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  provider: 'privy' | 'dynamic' | 'turnkey' | null;
  address: string | null;
  isLoggedIn: boolean;
  profilePicUrl: string | null;
  username: string | null;    // <-- new for storing user’s chosen display name
}

const initialState: AuthState = {
  provider: null,
  address: null,
  isLoggedIn: false,
  profilePicUrl: null,
  username: null,
};

const SERVER_BASE_URL = SERVER_URL || 'http://localhost:3000';

/**
 * Fetch the user's profile from the server, including profile pic URL & username.
 */
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (userId: string, thunkAPI) => {
    const response = await fetch(`${SERVER_BASE_URL}/api/profile?userId=${userId}`);
    const data = await response.json();
    if (data.success) {
      return { profilePicUrl: data.url, username: data.username };
    } else {
      return thunkAPI.rejectWithValue(data.error || 'Failed to fetch user profile');
    }
  }
);

/**
 * Update the user's username in the database.
 */
export const updateUsername = createAsyncThunk(
  'auth/updateUsername',
  async ({ userId, newUsername }: { userId: string; newUsername: string }, thunkAPI) => {
    try {
      const response = await fetch(`${SERVER_BASE_URL}/api/profile/updateUsername`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, username: newUsername }),
      });
      const data = await response.json();
      console.log('updateUsername response:', data);
      if (!data.success) {
        return thunkAPI.rejectWithValue(data.error || 'Failed to update username');
      }
      return data.username as string;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || 'Error updating username');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(
      state,
      action: PayloadAction<{
        provider: 'privy' | 'dynamic' | 'turnkey';
        address: string;
        profilePicUrl?: string;
        username?: string;
      }>
    ) {
      state.provider = action.payload.provider;
      state.address = action.payload.address;
      state.isLoggedIn = true;
      state.profilePicUrl = action.payload.profilePicUrl || null;
      state.username = action.payload.username || null;
    },
    logoutSuccess(state) {
      state.provider = null;
      state.address = null;
      state.isLoggedIn = false;
      state.profilePicUrl = null;
      state.username = null;
    },
    updateProfilePic(state, action: PayloadAction<string>) {
      state.profilePicUrl = action.payload;
    },
  },
  extraReducers: builder => {
    // fetchUserProfile
    builder.addCase(fetchUserProfile.fulfilled, (state, action) => {
      state.profilePicUrl = action.payload.profilePicUrl;
      state.username = action.payload.username;
    });

    // updateUsername
    builder.addCase(updateUsername.fulfilled, (state, action) => {
      state.username = action.payload; // the updated name from server
    });
  },
});

export const { loginSuccess, logoutSuccess, updateProfilePic } = authSlice.actions;
export default authSlice.reducer;
