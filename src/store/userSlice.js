import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";
import { errMsg, load } from "../utils";

const authThunk = (name, url) =>
  createAsyncThunk(`user/${name}`, async (body, { rejectWithValue }) => {
    try {
      return (await api.post(url, body)).data;
    } catch (e) {
      return rejectWithValue(errMsg(e));
    }
  });

export const login = authThunk("login", "/auth/login");
export const register = authThunk("register", "/auth/register");

// Validates the session cookie with the server on app start (the stored profile is only a UI cache).
export const fetchMe = createAsyncThunk("user/me", async (_, { rejectWithValue }) => {
  try {
    return (await api.get("/auth/me")).data;
  } catch (e) {
    return rejectWithValue({ status: e.response?.status });
  }
});

export const logoutUser = createAsyncThunk("user/logout", async () => {
  try {
    await api.post("/auth/logout"); // server clears the httpOnly cookie
  } catch {
    /* even if the request fails we sign out locally */
  }
});

const userSlice = createSlice({
  name: "user",
  initialState: { user: load("userInfo", null), status: "idle", error: "" },
  reducers: {
    sessionExpired(state) {
      state.user = null;
    },
    clearError(state) {
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    [login, register].forEach((thunk) =>
      builder
        .addCase(thunk.pending, (s) => {
          s.status = "loading";
          s.error = "";
        })
        .addCase(thunk.fulfilled, (s, { payload }) => {
          s.status = "idle";
          s.user = payload;
        })
        .addCase(thunk.rejected, (s, { payload }) => {
          s.status = "idle";
          s.error = payload || "Request failed";
        })
    );
    builder
      .addCase(fetchMe.fulfilled, (s, { payload }) => {
        s.user = payload;
      })
      .addCase(fetchMe.rejected, (s, { payload }) => {
        // only a real 401 ends the session; a network error keeps the cached profile
        if (payload?.status === 401) s.user = null;
      })
      .addCase(logoutUser.fulfilled, (s) => {
        s.user = null;
      });
  },
});

export const { sessionExpired, clearError } = userSlice.actions;
export default userSlice.reducer;
