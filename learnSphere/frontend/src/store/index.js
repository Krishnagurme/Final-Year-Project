import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import courseReducer from './courseSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
  },
});

export default store;
