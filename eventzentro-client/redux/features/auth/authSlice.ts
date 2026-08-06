import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAuthChecked: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isAuthChecked: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isAuthChecked = true;
    },

    setAuthChecked: (state) => {
      state.isAuthChecked = true;
    },

    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isAuthChecked = true;
    },
  },
});

export const { setUser, setAuthChecked, logout } = authSlice.actions;

export default authSlice.reducer;
