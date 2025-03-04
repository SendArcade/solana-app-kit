// File: src/state/auth/reducer.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  provider: 'privy' | 'dynamic' | 'turnkey' | null;
  address: string | null;
  isLoggedIn: boolean;
  profilePicUrl: string | null;
}

const initialState: AuthState = {
  provider: null,
  address: null,
  isLoggedIn: false,
  profilePicUrl: null,
};

const SERVER_BASE_URL = process.env.SERVER_URL || 'http://localhost:3000/api';

// Thunk to fetch the user's profile picture from the DB
export const fetchProfilePic = createAsyncThunk(
  'auth/fetchProfilePic',
  async (userId: string, thunkAPI) => {
    const response = await fetch(`${SERVER_BASE_URL}/api/profile?userId=${userId}`);
    const data = await response.json();
    if (data.success && data.url) {
      return data.url;
    } else {
      return thunkAPI.rejectWithValue(data.error || 'Failed to fetch profile picture');
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
      }>
    ) {
      state.provider = action.payload.provider;
      state.address = action.payload.address;
      state.isLoggedIn = true;
      state.profilePicUrl = action.payload.profilePicUrl || null;
    },
    logoutSuccess(state) {
      state.provider = null;
      state.address = null;
      state.isLoggedIn = false;
      state.profilePicUrl = null;
    },
    updateProfilePic(state, action: PayloadAction<string>) {
      state.profilePicUrl = action.payload;
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchProfilePic.fulfilled, (state, action) => {
      state.profilePicUrl = action.payload;
    });
  },
});

export const { loginSuccess, logoutSuccess, updateProfilePic } = authSlice.actions;
export default authSlice.reducer;
