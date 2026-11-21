import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Wallet } from '@/src/types';

interface AuthState {
  user: User | null;
  wallet: Wallet | null;
  token: string | null;
  isHydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  wallet: null,
  token: null,
  isHydrated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrate: (state) => {
      if (typeof window !== 'undefined') {
        try {
          const token = localStorage.getItem('paypen_token');
          const userStr = localStorage.getItem('paypen_user');
          const walletStr = localStorage.getItem('paypen_wallet');

          state.token = token;
          state.user = userStr ? JSON.parse(userStr) : null;
          state.wallet = walletStr ? JSON.parse(walletStr) : null;
        } catch {
          // ignore corrupted local storage
        }
      }
      state.isHydrated = true;
    },
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string; wallet?: Wallet | null }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.wallet = action.payload.wallet || action.payload.user.wallet || null;

      if (typeof window !== 'undefined') {
        localStorage.setItem('paypen_token', action.payload.token);
        localStorage.setItem('paypen_user', JSON.stringify(action.payload.user));
        if (state.wallet) {
          localStorage.setItem('paypen_wallet', JSON.stringify(state.wallet));
        } else {
          localStorage.removeItem('paypen_wallet');
        }
      }
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('paypen_token', action.payload);
      }
    },
    markVerified: (state) => {
      if (state.user) {
        state.user.is_email_verified = true;
        state.user.email_verified_at = new Date().toISOString();
        if (typeof window !== 'undefined') {
          localStorage.setItem('paypen_user', JSON.stringify(state.user));
        }
      }
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      if (action.payload.wallet) {
        state.wallet = action.payload.wallet;
        if (typeof window !== 'undefined') {
          localStorage.setItem('paypen_wallet', JSON.stringify(action.payload.wallet));
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('paypen_user', JSON.stringify(action.payload));
      }
    },
    updateWallet: (state, action: PayloadAction<Wallet>) => {
      state.wallet = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('paypen_wallet', JSON.stringify(action.payload));
      }
    },
    logout: (state) => {
      state.user = null;
      state.wallet = null;
      state.token = null;

      if (typeof window !== 'undefined') {
        localStorage.removeItem('paypen_token');
        localStorage.removeItem('paypen_user');
        localStorage.removeItem('paypen_wallet');
      }
    },
  },
});

export const { hydrate, setCredentials, setToken, markVerified, updateUser, updateWallet, logout } = authSlice.actions;
export default authSlice.reducer;
