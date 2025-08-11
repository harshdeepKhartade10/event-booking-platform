import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

export const register = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
  try {
    const res = await axios.post(`${API}/api/auth/register`, userData);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

// Regular user login
export const login = createAsyncThunk('auth/login', async (userData, thunkAPI) => {
  try {
    const res = await axios.post(`${API}/api/auth/login`, userData);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

// Admin login with additional checks
export const adminLogin = createAsyncThunk('auth/adminLogin', async (userData, thunkAPI) => {
  try {
    const res = await axios.post(`${API}/api/auth/login`, userData);
    if (!res.data.user.isAdmin) {
      throw new Error('Access denied. Admin privileges required.');
    }
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Admin login failed');
  }
});

export const fetchProfile = createAsyncThunk('auth/profile', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token;
    const res = await axios.get(`${API}/api/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue('Failed to fetch profile');
  }
});

const initialState = {
  user: null,
  token: localStorage.getItem('token') || '',
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = '';
      localStorage.removeItem('token');
    },
    setToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem('token', action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => { state.loading = false; state.user = action.payload.user; state.token = action.payload.token; localStorage.setItem('token', action.payload.token); })
      .addCase(register.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => { state.loading = false; state.user = action.payload.user; state.token = action.payload.token; localStorage.setItem('token', action.payload.token); })
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(adminLogin.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(adminLogin.fulfilled, (state, action) => { state.loading = false; state.user = action.payload.user; state.token = action.payload.token; localStorage.setItem('token', action.payload.token); })
      .addCase(adminLogin.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchProfile.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProfile.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(fetchProfile.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { logout, setToken } = authSlice.actions;
export default authSlice.reducer;
