import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import propertiesReducer from './propertiesSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    properties: propertiesReducer,
  },
});

export default store;
