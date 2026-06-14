import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api.js';

export const fetchProperties = createAsyncThunk(
  'properties/fetchAll',
  async (queryParams = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/properties', { params: queryParams });
      return data; // returns paginated response
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch properties');
    }
  }
);

export const fetchPropertyDetail = createAsyncThunk(
  'properties/fetchDetail',
  async (idOrSlug, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/properties/${idOrSlug}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch property details');
    }
  }
);

export const createProperty = createAsyncThunk(
  'properties/create',
  async (propertyData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/properties', propertyData);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create property');
    }
  }
);

export const updateProperty = createAsyncThunk(
  'properties/update',
  async ({ id, propertyData }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/properties/${id}`, propertyData);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update property');
    }
  }
);

export const deleteProperty = createAsyncThunk(
  'properties/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/properties/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete property');
    }
  }
);

const initialState = {
  properties: [],
  currentProperty: null,
  pagination: null,
  loading: false,
  error: null,
};

const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    clearCurrentProperty: (state) => {
      state.currentProperty = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Detail
      .addCase(fetchPropertyDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPropertyDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProperty = action.payload;
      })
      .addCase(fetchPropertyDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createProperty.fulfilled, (state, action) => {
        state.properties.unshift(action.payload);
      })
      // Update
      .addCase(updateProperty.fulfilled, (state, action) => {
        const index = state.properties.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.properties[index] = action.payload;
        }
        if (state.currentProperty?._id === action.payload._id) {
          state.currentProperty = action.payload;
        }
      })
      // Delete
      .addCase(deleteProperty.fulfilled, (state, action) => {
        state.properties = state.properties.filter((p) => p._id !== action.payload);
      });
  },
});

export const { clearCurrentProperty } = propertiesSlice.actions;
export default propertiesSlice.reducer;
