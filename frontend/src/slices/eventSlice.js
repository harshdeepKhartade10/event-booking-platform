import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

export const fetchEvents = createAsyncThunk('events/fetchEvents', async (_, thunkAPI) => {
  try {
    const res = await axios.get(`${API}/api/events`);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue('Failed to fetch events');
  }
});

export const fetchEventDetails = createAsyncThunk('events/fetchEventDetails', async (id, thunkAPI) => {
  try {
    const res = await axios.get(`${API}/api/events/${id}`);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue('Failed to fetch event details');
  }
});

export const getEventById = createAsyncThunk('events/getEventById', async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token;
    const res = await axios.get(`${API}/api/events/admin/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to fetch event');
  }
});

export const createEvent = createAsyncThunk('events/createEvent', async (formData, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token;
    const res = await axios.post(`${API}/api/events`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    });
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to create event');
  }
});

export const updateEvent = createAsyncThunk('events/updateEvent', async ({ id, formData }, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token;
    const res = await axios.put(`${API}/api/events/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    });
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to update event');
  }
});

export const deleteEvent = createAsyncThunk('events/deleteEvent', async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token;
    await axios.delete(`${API}/api/events/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return id; // Return the deleted event ID
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to delete event');
  }
});

const eventSlice = createSlice({
  name: 'events',
  initialState: {
    events: [],
    eventDetails: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEvents.fulfilled, (state, action) => { state.loading = false; state.events = action.payload; })
      .addCase(fetchEvents.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      
      .addCase(fetchEventDetails.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEventDetails.fulfilled, (state, action) => { state.loading = false; state.eventDetails = action.payload; })
      .addCase(fetchEventDetails.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      
      .addCase(getEventById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getEventById.fulfilled, (state, action) => { state.loading = false; state.eventDetails = action.payload; })
      .addCase(getEventById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      
      .addCase(createEvent.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createEvent.fulfilled, (state, action) => { 
        state.loading = false;
        state.events = [action.payload, ...state.events];
      })
      .addCase(createEvent.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload; 
      })
      
      .addCase(updateEvent.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateEvent.fulfilled, (state, action) => { 
        state.loading = false;
        state.events = state.events.map(event => 
          event._id === action.payload._id ? action.payload : event
        );
        if (state.eventDetails?._id === action.payload._id) {
          state.eventDetails = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload; 
      })
      
      .addCase(deleteEvent.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteEvent.fulfilled, (state, action) => { 
        state.loading = false; 
        state.events = state.events.filter(event => event._id !== action.payload);
        if (state.eventDetails?._id === action.payload) {
          state.eventDetails = null;
        }
      })
      .addCase(deleteEvent.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload; 
      });
  },
});

export default eventSlice.reducer;
