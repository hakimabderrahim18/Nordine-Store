import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { wishlistService } from '../services/api';

const initialState = {
  products: [],
  loading: false,
  error: null,
};

export const fetchWishlist = createAsyncThunk('wishlist/fetchWishlist', async (_, thunkAPI) => {
  try {
    const data = await wishlistService.getWishlist();
    return data.wishlist.products;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Fetch wishlist failed';
    return thunkAPI.rejectWithValue(message);
  }
});

export const toggleWishlist = createAsyncThunk('wishlist/toggleWishlist', async (productId, thunkAPI) => {
  try {
    const data = await wishlistService.toggleItem(productId);
    return data.wishlist.products;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Toggle wishlist item failed';
    return thunkAPI.rejectWithValue(message);
  }
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    resetWishlist: (state) => {
      state.products = [];
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Toggle Item
      .addCase(toggleWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(toggleWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { resetWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
