'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  assetApi, 
  Asset, 
  AssetsResponse, 
  AssetType, 
  AssetTypesResponse, 
  CreateAssetTypeRequest, 
  CreateAssetTypeResponse,
  AssetPermission,
  AssetPermissionsResponse,
  CreateAssetPermissionRequest,
  CreateAssetPermissionResponse,
  UpdateAssetPermissionRequest,
  UpdateAssetPermissionResponse,
  AdminPermissions,
  AdminPermissionsResponse,
  SetPermissionsRequest,
  SetPermissionsResponse
} from '../lib/adminasset';

// State interface
interface AssetState {
  assets: Asset[];
  assetTypes: AssetType[];
  permissions: AssetPermission[];
  adminPermissions: AdminPermissions | null;
  loading: boolean;
  error: string | null;
  selectedAsset: Asset | null;
}

// Action types
type AssetAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ASSETS'; payload: Asset[] }
  | { type: 'SET_ASSET_TYPES'; payload: AssetType[] }
  | { type: 'SET_PERMISSIONS'; payload: AssetPermission[] }
  | { type: 'SET_ADMIN_PERMISSIONS'; payload: AdminPermissions }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SELECTED_ASSET'; payload: Asset | null }
  | { type: 'ADD_ASSET'; payload: Asset }
  | { type: 'UPDATE_ASSET'; payload: Asset }
  | { type: 'DELETE_ASSET'; payload: string }
  | { type: 'ADD_PERMISSION'; payload: AssetPermission }
  | { type: 'UPDATE_PERMISSION'; payload: AssetPermission }
  | { type: 'DELETE_PERMISSION'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AssetState = {
  assets: [],
  assetTypes: [],
  permissions: [],
  adminPermissions: null,
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
    case 'SET_ASSET_TYPES':
      return { ...state, assetTypes: action.payload, error: null };
    case 'SET_PERMISSIONS':
      return { ...state, permissions: action.payload, error: null };
    case 'SET_ADMIN_PERMISSIONS':
      return { ...state, adminPermissions: action.payload, error: null };
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
    case 'ADD_PERMISSION':
      return { ...state, permissions: [...state.permissions, action.payload] };
    case 'UPDATE_PERMISSION':
      return {
        ...state,
        permissions: state.permissions.map(permission =>
          permission._id === action.payload._id ? action.payload : permission
        ),
      };
    case 'DELETE_PERMISSION':
      return {
        ...state,
        permissions: state.permissions.filter(permission => permission._id !== action.payload),
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
  fetchAssetTypes: () => Promise<void>;
  fetchPermissions: () => Promise<void>;
  fetchPermissionsByAssetId: (assetId: string) => Promise<void>;
  fetchAdminPermissions: () => Promise<void>;
  updateAdminPermissions: (permissions: AdminPermissions) => Promise<void>;
  setPermissions: (role: string, permissions: SetPermissionsRequest['permissions']) => Promise<void>;
  refreshAdminPermissions: () => Promise<void>;
  createAssetType: (assetTypeData: CreateAssetTypeRequest) => Promise<void>;
  updateAssetType: (assetTypeId: string, assetTypeData: CreateAssetTypeRequest) => Promise<void>;
  deleteAssetType: (assetTypeId: string) => Promise<void>;
  createPermission: (permissionData: CreateAssetPermissionRequest) => Promise<void>;
  updatePermission: (permissionId: string, permissionData: UpdateAssetPermissionRequest) => Promise<void>;
  deletePermission: (permissionId: string) => Promise<void>;
  fetchAssetById: (assetId: string) => Promise<void>;
  createAsset: (assetData: Partial<Asset> | FormData) => Promise<void>;
  updateAsset: (assetId: string, assetData: Partial<Asset> | FormData) => Promise<void>;
  deleteAsset: (assetId: string) => Promise<void>;
  scanAsset: (assetId: string, scanData: {
    location: { latitude: string; longitude: string };
    scanType: string;
    notes?: string;
  }) => Promise<void>;
  setSelectedAsset: (asset: Asset | null) => void;
  clearError: () => void;
  getCurrentPermissions: () => Promise<void>;
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
  const fetchAssets = React.useCallback(async () => {
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
  }, []);

  // Fetch all asset types
  const fetchAssetTypes = React.useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (state.loading) {
      console.log('Already loading, skipping fetchAssetTypes call');
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response: AssetTypesResponse = await assetApi.getAssetTypes();
      
      if (response.success) {
        dispatch({ type: 'SET_ASSET_TYPES', payload: response.assetTypes });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch asset types' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching asset types';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.loading]);

  // Fetch all permissions
  const fetchPermissions = React.useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (state.loading) {
      console.log('Already loading, skipping fetchPermissions call');
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response: AssetPermissionsResponse = await assetApi.getAssetPermissions();
      
      if (response.success) {
        dispatch({ type: 'SET_PERMISSIONS', payload: response.permissions });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch permissions' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching permissions';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.loading]);

  // Fetch permissions by asset ID
  const fetchPermissionsByAssetId = React.useCallback(async (assetId: string) => {
    // Prevent multiple simultaneous calls
    if (state.loading) {
      console.log('Already loading, skipping fetchPermissionsByAssetId call');
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response: AssetPermissionsResponse = await assetApi.getAssetPermissionsByAssetId(assetId);
      
      if (response.success) {
        dispatch({ type: 'SET_PERMISSIONS', payload: response.permissions });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch permissions for asset' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching permissions for asset';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.loading]);

  // Fetch admin permissions
  const fetchAdminPermissions = React.useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (state.loading) {
      console.log('Already loading, skipping fetchAdminPermissions call');
      return;
    }
    
    // Prevent fetching if permissions are already loaded
    if (state.adminPermissions) {
      console.log('Permissions already loaded, skipping fetchAdminPermissions call');
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response: AdminPermissionsResponse = await assetApi.getAdminPermissions();
      
      if (response.success) {
        dispatch({ type: 'SET_ADMIN_PERMISSIONS', payload: response.permissions });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch admin permissions' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching admin permissions';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.loading, state.adminPermissions]);

  // Update admin permissions
  const updateAdminPermissions = React.useCallback(async (permissions: AdminPermissions) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response: AdminPermissionsResponse = await assetApi.updateAdminPermissions(permissions);
      
      if (response.success) {
        dispatch({ type: 'SET_ADMIN_PERMISSIONS', payload: response.permissions });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update admin permissions' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating admin permissions';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  // Force refresh admin permissions (for manual refresh)
  const refreshAdminPermissions = React.useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response: AdminPermissionsResponse = await assetApi.getAdminPermissions();
      
      if (response.success) {
        dispatch({ type: 'SET_ADMIN_PERMISSIONS', payload: response.permissions });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch admin permissions' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching admin permissions';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

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
  const createAsset = async (assetData: Partial<Asset> | FormData) => {
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
  const updateAsset = async (assetId: string, assetData: Partial<Asset> | FormData) => {
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
  const clearError = React.useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Create new asset type
  const createAssetType = async (assetTypeData: CreateAssetTypeRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response: CreateAssetTypeResponse = await assetApi.createAssetType(assetTypeData);
      
      if (response.success) {
        // Add the new asset type to the existing asset types
        dispatch({ type: 'SET_ASSET_TYPES', payload: [...state.assetTypes, response.assetType] });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create asset type' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while creating asset type';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // Update asset type
  const updateAssetType = async (assetTypeId: string, assetTypeData: CreateAssetTypeRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response: CreateAssetTypeResponse = await assetApi.updateAssetType(assetTypeId, assetTypeData);
      
      if (response.success) {
        dispatch({ type: 'SET_ASSET_TYPES', payload: state.assetTypes.map(type =>
          type._id === assetTypeId ? response.assetType : type
        ) });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update asset type' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating asset type';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // Delete asset type
  const deleteAssetType = async (assetTypeId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await assetApi.deleteAssetType(assetTypeId);
      
      if (response.success) {
        dispatch({ type: 'SET_ASSET_TYPES', payload: state.assetTypes.filter(type => type._id !== assetTypeId) });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete asset type' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting asset type';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // Create new permission
  const createPermission = async (permissionData: CreateAssetPermissionRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response: CreateAssetPermissionResponse = await assetApi.createAssetPermission(permissionData);
      
      if (response.success) {
        dispatch({ type: 'ADD_PERMISSION', payload: response.permission });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create permission' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while creating permission';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // Update permission
  const updatePermission = async (permissionId: string, permissionData: UpdateAssetPermissionRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response: UpdateAssetPermissionResponse = await assetApi.updateAssetPermission(permissionId, permissionData);
      
      if (response.success) {
        dispatch({ type: 'UPDATE_PERMISSION', payload: response.permission });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update permission' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating permission';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // Delete permission
  const deletePermission = async (permissionId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await assetApi.deleteAssetPermission(permissionId);
      
      if (response.success) {
        dispatch({ type: 'DELETE_PERMISSION', payload: permissionId });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete permission' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting permission';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // Set permissions
  const setPermissions = async (role: string, permissions: SetPermissionsRequest['permissions']) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response: SetPermissionsResponse = await assetApi.setPermissions(role, permissions);
      
      if (response.success) {
        // Convert the response data to AdminPermissions format
        const adminPermissions: AdminPermissions = {
          assetManagement: {
            view: permissions.view,
            create: permissions.create,
            edit: permissions.edit,
            delete: permissions.delete,
            assign: false,
            bulkOperations: false,
            import: false,
            export: permissions.export
          },
          digitalAssets: {
            generate: false,
            scan: false,
            bulkGenerate: false,
            download: false,
            customize: false
          },
          maintenance: {
            view: permissions.view,
            create: permissions.create,
            edit: permissions.edit,
            delete: permissions.delete,
            approve: false,
            schedule: false,
            assign: false,
            complete: false
          },
          compliance: {
            view: permissions.view,
            create: permissions.create,
            edit: permissions.edit,
            approve: false,
            audit: false,
            report: false
          },
          analytics: {
            view: permissions.view,
            export: permissions.export,
            customize: false,
            share: false
          },
          userManagement: {
            view: permissions.view,
            create: permissions.create,
            edit: permissions.edit,
            delete: permissions.delete,
            assignRoles: false,
            managePermissions: false
          },
          systemAdmin: {
            view: permissions.view,
            configure: permissions.edit,
            backup: false,
            restore: false,
            monitor: false
          },
          admin: {
            view: permissions.view,
            configure: permissions.edit,
            backup: false,
            restore: false,
            monitor: false
          },
          locationManagement: {
            view: permissions.view,
            create: permissions.create,
            edit: permissions.edit,
            delete: permissions.delete,
            assign: false
          },
          documentManagement: {
            view: permissions.view,
            upload: permissions.create,
            edit: permissions.edit,
            delete: permissions.delete,
            share: false
          },
          financialManagement: {
            view: permissions.view,
            edit: permissions.edit,
            report: false,
            approve: false
          },
          workflowManagement: {
            view: permissions.view,
            create: permissions.create,
            edit: permissions.edit,
            approve: false,
            assign: false
          },
          mobileFeatures: {
            scan: false,
            offline: false,
            sync: permissions.sync,
            location: false,
            camera: false,
            notifications: false
          },
          view: permissions.view,
          create: permissions.create,
          edit: permissions.edit,
          delete: permissions.delete,
          export: permissions.export,
          sync: permissions.sync
        };
        
        dispatch({ type: 'SET_ADMIN_PERMISSIONS', payload: adminPermissions });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message || 'Failed to set permissions' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while setting permissions';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // Get current permissions for a role
  const getCurrentPermissions = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Use the actual permissions API that returns the complex structure
      const response: AdminPermissionsResponse = await assetApi.getActualPermissions();
      
      if (response.success && response.permissions) {
        dispatch({ type: 'SET_ADMIN_PERMISSIONS', payload: response.permissions });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to get current permissions' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while getting current permissions';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // Context value
  const contextValue: AssetContextType = {
    state,
    fetchAssets,
    fetchAssetTypes,
    fetchPermissions,
    fetchPermissionsByAssetId,
    fetchAdminPermissions,
    updateAdminPermissions,
    setPermissions,
    refreshAdminPermissions,
    createAssetType,
    updateAssetType,
    deleteAssetType,
    createPermission,
    updatePermission,
    deletePermission,
    fetchAssetById,
    createAsset,
    updateAsset,
    deleteAsset,
    scanAsset,
    setSelectedAsset,
    clearError,
    getCurrentPermissions,
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
