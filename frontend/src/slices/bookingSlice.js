import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

export const getAllBookings = createAsyncThunk('bookings/getAllBookings', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token;
    const response = await axios.get(`${API}/api/admin/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to fetch bookings');
  }
});

export const updateBookingStatus = createAsyncThunk('bookings/updateStatus', async ({ bookingId, status }, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token;
    const response = await axios.put(
      `${API}/api/admin/bookings/${bookingId}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` }}
    );
    return response.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to update booking status');
  }
});

const bookingSlice = createSlice({
  name: 'bookings',
  initialState: {
    bookings: [],
    loading: 'idle', // 'idle' | 'pending' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    clearBookingError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Get All Bookings
    builder.addCase(getAllBookings.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(getAllBookings.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.bookings = action.payload;
    });
    builder.addCase(getAllBookings.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload;
    });

    // Update Booking Status
    builder.addCase(updateBookingStatus.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(updateBookingStatus.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      // Update the specific booking in the state
      const index = state.bookings.findIndex(b => b._id === action.payload._id);
      if (index !== -1) {
        state.bookings[index] = action.payload;
      }
    });
    builder.addCase(updateBookingStatus.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload;
    });
  },
});

export const { clearBookingError } = bookingSlice.actions;
export default bookingSlice.reducer;
