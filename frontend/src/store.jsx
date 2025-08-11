import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import eventReducer from './slices/eventSlice';
import bookingReducer from './slices/bookingSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventReducer,
    booking: bookingReducer,
  },
});

export default store;
