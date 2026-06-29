import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartService } from '../services/api';

const loadGuestCart = () => {
  const local = localStorage.getItem('guestCart');
  return local ? JSON.parse(local) : [];
};

const initialState = {
  items: loadGuestCart(),
  loading: false,
  error: null,
};

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, thunkAPI) => {
  try {
    const data = await cartService.getCart();
    return data.cart.items;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Fetch cart failed';
    return thunkAPI.rejectWithValue(message);
  }
});

export const addCartItem = createAsyncThunk('cart/addCartItem', async ({ productId, quantity, variant }, thunkAPI) => {
  try {
    const data = await cartService.addToCart(productId, quantity, variant);
    return data.cart.items;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Add item failed';
    return thunkAPI.rejectWithValue(message);
  }
});

export const updateCartItemQty = createAsyncThunk('cart/updateCartItemQty', async ({ productId, quantity, variant }, thunkAPI) => {
  try {
    const data = await cartService.updateQuantity(productId, quantity, variant);
    return data.cart.items;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Update item failed';
    return thunkAPI.rejectWithValue(message);
  }
});

export const removeCartItem = createAsyncThunk('cart/removeCartItem', async ({ productId, variant }, thunkAPI) => {
  try {
    const data = await cartService.removeFromCart(productId, variant);
    return data.cart.items;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Remove item failed';
    return thunkAPI.rejectWithValue(message);
  }
});

export const clearUserCart = createAsyncThunk('cart/clearUserCart', async (_, thunkAPI) => {
  try {
    await cartService.clearCart();
    return [];
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Clear cart failed';
    return thunkAPI.rejectWithValue(message);
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCart: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
    addGuestItem: (state, action) => {
      const { product, quantity, variant } = action.payload;
      
      const itemIndex = state.items.findIndex(item => {
        if (item.product?._id !== product._id) return false;
        if (!variant && !item.variant) return true;
        if (!variant || !item.variant) return false;
        
        const obj1 = item.variant instanceof Map ? Object.fromEntries(item.variant) : item.variant;
        const obj2 = variant;
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) return false;
        return keys1.every(key => obj1[key] === obj2[key]);
      });

      if (itemIndex > -1) {
        state.items[itemIndex].quantity += Number(quantity || 1);
      } else {
        state.items.push({
          product,
          quantity: Number(quantity || 1),
          variant
        });
      }
      localStorage.setItem('guestCart', JSON.stringify(state.items));
    },
    updateGuestItemQty: (state, action) => {
      const { productId, quantity, variant } = action.payload;
      const itemIndex = state.items.findIndex(item => {
        if (item.product?._id !== productId) return false;
        if (!variant && !item.variant) return true;
        if (!variant || !item.variant) return false;
        
        const obj1 = item.variant instanceof Map ? Object.fromEntries(item.variant) : item.variant;
        const obj2 = variant;
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) return false;
        return keys1.every(key => obj1[key] === obj2[key]);
      });

      if (itemIndex > -1) {
        state.items[itemIndex].quantity = Number(quantity);
      }
      localStorage.setItem('guestCart', JSON.stringify(state.items));
    },
    removeGuestItem: (state, action) => {
      const { productId, variant } = action.payload;
      state.items = state.items.filter(item => {
        const isSameProduct = item.product?._id === productId;
        if (!isSameProduct) return true;
        if (!variant && !item.variant) return false;
        if (!variant || !item.variant) return true;
        
        const obj1 = item.variant instanceof Map ? Object.fromEntries(item.variant) : item.variant;
        const obj2 = variant;
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) return true;
        const isMatch = keys1.every(key => obj1[key] === obj2[key]);
        return !isMatch;
      });
      localStorage.setItem('guestCart', JSON.stringify(state.items));
    },
    clearGuestCart: (state) => {
      state.items = [];
      localStorage.removeItem('guestCart');
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Item
      .addCase(addCartItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(addCartItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(addCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Qty
      .addCase(updateCartItemQty.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCartItemQty.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(updateCartItemQty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove Item
      .addCase(removeCartItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Clear Cart
      .addCase(clearUserCart.fulfilled, (state) => {
        state.items = [];
        state.loading = false;
      });
  }
});

export const { resetCart, addGuestItem, updateGuestItemQty, removeGuestItem, clearGuestCart } = cartSlice.actions;
export default cartSlice.reducer;
