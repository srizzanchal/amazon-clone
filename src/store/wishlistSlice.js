import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";
import { errMsg } from "../utils";

export const fetchWishlist = createAsyncThunk("wishlist/fetch", async (_, { rejectWithValue }) => {
  try {
    return (await api.get("/wishlist")).data;
  } catch (e) {
    return rejectWithValue(errMsg(e));
  }
});

// Adds or removes depending on whether the product is already saved. Resolves with the new list.
export const toggleWishlist = createAsyncThunk("wishlist/toggle", async (productId, { getState, rejectWithValue }) => {
  try {
    const saved = getState().wishlist.items.some((p) => p._id === productId);
    const res = saved ? await api.delete(`/wishlist/${productId}`) : await api.post(`/wishlist/${productId}`);
    return { items: res.data, added: !saved };
  } catch (e) {
    return rejectWithValue(errMsg(e));
  }
});

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: { items: [], loaded: false },
  reducers: {
    clearWishlist(state) {
      state.items = [];
      state.loaded = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.fulfilled, (s, { payload }) => {
        s.items = payload;
        s.loaded = true;
      })
      .addCase(toggleWishlist.fulfilled, (s, { payload }) => {
        s.items = payload.items;
      });
  },
});

export const { clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
