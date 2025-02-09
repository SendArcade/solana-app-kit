// File: /src/state/auth/slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface AuthState {
  provider: 'privy' | 'dynamic' | 'turnkey' | null;
  address: string | null;
  isLoggedIn: boolean;
}

const initialState: AuthState = {
  provider: null,
  address: null,
  isLoggedIn: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(
      state,
      action: PayloadAction<{
        provider: 'privy' | 'dynamic' | 'turnkey';
        address: string;
      }>,
    ) {
      state.provider = action.payload.provider;
      state.address = action.payload.address;
      state.isLoggedIn = true;
    },
    logoutSuccess(state) {
      state.provider = null;
      state.address = null;
      state.isLoggedIn = false;
    },
  },
});

export const {loginSuccess, logoutSuccess} = authSlice.actions;
export default authSlice.reducer;
