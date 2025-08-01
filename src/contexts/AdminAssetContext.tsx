'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { assetApi, Asset, AssetsResponse, ApiError } from '../lib/adminasset';

// State interface
interface AssetState {
  assets: Asset[];
  loading: boolean;
  error: string | null;
  selectedAsset: Asset | null;
}

// Action types
type AssetAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ASSETS'; payload: Asset[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SELECTED_ASSET'; payload: Asset | null }
  | { type: 'ADD_ASSET'; payload: Asset }
  | { type: 'UPDATE_ASSET'; payload: Asset }
  | { type: 'DELETE_ASSET'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AssetState = {
  assets: [],
  loading: false,
  error: null,
  selectedAsset: null,
};

// Reducer function
const assetReducer = (state: AssetState, action: AssetAction): AssetState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ASSETS':
      return { ...state, assets: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_SELECTED_ASSET':
      return { ...state, selectedAsset: action.payload };
    case 'ADD_ASSET':
      return { ...state, assets: [...state.assets, action.payload] };
    case 'UPDATE_ASSET':
      return {
        ...state,
        assets: state.assets.map(asset =>
          asset._id === action.payload._id ? action.payload : asset
        ),
        selectedAsset: state.selectedAsset?._id === action.payload._id ? action.payload : state.selectedAsset,
      };
    case 'DELETE_ASSET':
      return {
        ...state,
        assets: state.assets.filter(asset => asset._id !== action.payload),
        selectedAsset: state.selectedAsset?._id === action.payload ? null : state.selectedAsset,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// Context interface
interface AssetContextType {
  state: AssetState;
  fetchAssets: () => Promise<void>;
  fetchAssetById: (assetId: string) => Promise<void>;
  createAsset: (assetData: Partial<Asset>) => Promise<void>;
  updateAsset: (assetId: string, assetData: Partial<Asset>) => Promise<void>;
  deleteAsset: (assetId: string) => Promise<void>;
  scanAsset: (assetId: string, scanData: {
    location: { latitude: string; longitude: string };
    scanType: string;
    notes?: string;
  }) => Promise<void>;
  setSelectedAsset: (asset: Asset | null) => void;
  clearError: () => void;
}

// Create context
const AssetContext = createContext<AssetContextType | undefined>(undefined);

// Provider component
interface AssetProviderProps {
  children: ReactNode;
}

export const AssetProvider: React.FC<AssetProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(assetReducer, initialState);

  // Fetch all assets
  const fetchAssets = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response: AssetsResponse = await assetApi.getAllAssets();
      
      if (response.success) {
        dispatch({ type: 'SET_ASSETS', payload: response.assets });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch assets' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching assets';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // Fetch asset by ID
  const fetchAssetById = async (assetId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await assetApi.getAssetById(assetId);
      
      if (response.success) {
        dispatch({ type: 'SET_SELECTED_ASSET', payload: response.asset });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch asset' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching asset';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // Create new asset
  const createAsset = async (assetData: Partial<Asset>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await assetApi.createAsset(assetData);
      
      if (response.success) {
        dispatch({ type: 'ADD_ASSET', payload: response.asset });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create asset' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while creating asset';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // Update asset
  const updateAsset = async (assetId: string, assetData: Partial<Asset>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await assetApi.updateAsset(assetId, assetData);
      
      if (response.success) {
        dispatch({ type: 'UPDATE_ASSET', payload: response.asset });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update asset' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating asset';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // Delete asset
  const deleteAsset = async (assetId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await assetApi.deleteAsset(assetId);
      
      if (response.success) {
        dispatch({ type: 'DELETE_ASSET', payload: assetId });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete asset' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting asset';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // Scan asset
  const scanAsset = async (assetId: string, scanData: {
    location: { latitude: string; longitude: string };
    scanType: string;
    notes?: string;
  }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await assetApi.scanAsset(assetId, scanData);
      
      if (response.success) {
        dispatch({ type: 'UPDATE_ASSET', payload: response.asset });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to scan asset' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while scanning asset';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // Set selected asset
  const setSelectedAsset = (asset: Asset | null) => {
    dispatch({ type: 'SET_SELECTED_ASSET', payload: asset });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Context value
  const contextValue: AssetContextType = {
    state,
    fetchAssets,
    fetchAssetById,
    createAsset,
    updateAsset,
    deleteAsset,
    scanAsset,
    setSelectedAsset,
    clearError,
  };

  return (
    <AssetContext.Provider value={contextValue}>
      {children}
    </AssetContext.Provider>
  );
};

// Custom hook to use the context
export const useAssetContext = () => {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error('useAssetContext must be used within an AssetProvider');
  }
  return context;
};

export default AssetContext;
