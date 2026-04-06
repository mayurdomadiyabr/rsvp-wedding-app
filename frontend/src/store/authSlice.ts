import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

function loadTokens(): AuthState {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, isAuthenticated: false };
  }
  const access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");
  return {
    accessToken: access,
    refreshToken: refresh,
    isAuthenticated: !!access,
  };
}

const authSlice = createSlice({
  name: "auth",
  initialState: loadTokens(),
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ access: string; refresh: string }>
    ) {
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh;
      state.isAuthenticated = true;
      localStorage.setItem("access_token", action.payload.access);
      localStorage.setItem("refresh_token", action.payload.refresh);
    },
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
