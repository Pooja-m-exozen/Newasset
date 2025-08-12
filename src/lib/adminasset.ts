const API_BASE_URL = 'http://192.168.0.5:5021/api'

// Types for Asset Management
export interface Location {
  latitude: string;
  longitude: string;
  floor?: string;
  room?: string;
  building?: string;
}

export interface AssignedTo {
  _id: string;
  name: string;
  email: string;
}

export interface Compliance {
  certifications: string[];
  expiryDates: string[];
  regulatoryRequirements: string[];
}

export interface ScanHistory {
  _id: string;
  scannedBy: string;
  scannedAt: string;
  location: {
    latitude: string;
    longitude: string;
  };
  scanType: string;
  notes?: string;
}

export interface DigitalAsset {
  qrCode?: {
    url: string;
    data: {
      t: string;        // tagId
      a: string;        // assetType
      s: string;        // subcategory
      b: string;        // brand
      m: string;        // model
      st: string;       // status
      p: string;        // priority
      l: Location;      // location
      u: string;        // url
      pr: string;       // projectName
      lm: string | null; // location metadata
      nm: string | null; // notes metadata
      url: string;      // asset url
      ts: number;       // timestamp
      c: string;        // checksum
    };
    generatedAt: string;
  };
}

export interface Asset {
  _id?: string;
  tagId: string;
  assetType: string;
  subcategory?: string;
  brand: string;
  model?: string;
  serialNumber?: string;
  capacity?: string;
  yearOfInstallation?: string;
  projectName?: string;
  assignedTo?: AssignedTo;
  status?: string;
  priority?: string;
  compliance?: Compliance;
  digitalTagType?: string;
  digitalAssets?: DigitalAsset;
  alerts?: Array<{ message: string; type: string; timestamp: string; [key: string]: string | number | boolean | object | null | undefined }>;
  documents?: Array<{ name: string; url: string; type: string; [key: string]: string | number | boolean | object | null | undefined }>;
  tags?: string[];
  notes?: string;
  createdBy?: AssignedTo;
  photos?: Array<{ url: string; caption?: string; [key: string]: string | number | boolean | object | null | undefined }>;
  scanHistory?: ScanHistory[];
  location: Location;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface AssetsResponse {
  success: boolean;
  assets: Asset[];
}

export interface ApiError {
  message: string;
  status?: number;
}

// New interfaces for Asset Types
export interface Field {
  _id: string;
  label: string;
  fieldType: 'text' | 'dropdown';
  options: string[];
  required: boolean;
}

export interface AssetType {
  _id: string;
  name: string;
  fields: Field[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface AssetTypesResponse {
  success: boolean;
  assetTypes: AssetType[];
}

// Interface for creating asset types
export interface CreateAssetTypeRequest {
  name: string;
  fields: {
    label: string;
    fieldType: 'text' | 'dropdown';
    options?: string[];
  }[];
}

export interface CreateAssetTypeResponse {
  success: boolean;
  assetType: AssetType;
}

// Asset Permissions Interfaces
export interface AssetPermission {
  _id: string;
  userId: string;
  assetId: string;
  permissions: string[];
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// New Admin Permissions Interface
export interface AdminPermissions {
  assetManagement: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    assign: boolean;
    bulkOperations: boolean;
    import: boolean;
    export: boolean;
  };
  digitalAssets: {
    generate: boolean;
    scan: boolean;
    bulkGenerate: boolean;
    download: boolean;
    customize: boolean;
  };
  maintenance: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
    schedule: boolean;
    assign: boolean;
    complete: boolean;
  };
  compliance: {
    view: boolean;
    create: boolean;
    edit: boolean;
    approve: boolean;
    audit: boolean;
    report: boolean;
  };
  analytics: {
    view: boolean;
    export: boolean;
    customize: boolean;
    share: boolean;
  };
  userManagement: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    assignRoles: boolean;
    managePermissions: boolean;
  };
  systemAdmin: {
    view: boolean;
    configure: boolean;
    backup: boolean;
    restore: boolean;
    monitor: boolean;
  };
  admin: {
    view: boolean;
    configure: boolean;
    backup: boolean;
    restore: boolean;
    monitor: boolean;
  };
  locationManagement: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    assign: boolean;
  };
  documentManagement: {
    view: boolean;
    upload: boolean;
    edit: boolean;
    delete: boolean;
    share: boolean;
  };
  financialManagement: {
    view: boolean;
    edit: boolean;
    report: boolean;
    approve: boolean;
  };
  workflowManagement: {
    view: boolean;
    create: boolean;
    edit: boolean;
    approve: boolean;
    assign: boolean;
  };
  mobileFeatures: {
    scan: boolean;
    offline: boolean;
    sync: boolean;
    location: boolean;
    camera: boolean;
    notifications: boolean;
  };
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  sync: boolean;
}

// New interfaces for the updated API
export interface SetPermissionsRequest {
  role: string;
  permissions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
    sync: boolean;
  };
}

export interface AccessControl {
  timeRestrictions: {
    daysOfWeek: string[];
  };
  locationRestrictions: {
    enabled: boolean;
    allowedLocations: string[];
  };
  facilityAccess: string;
  assetAccess: string;
  dataAccess: string;
}

export interface AdvancedFeatures {
  predictiveAnalytics: boolean;
  machineLearning: boolean;
  apiAccess: boolean;
  thirdPartyIntegrations: boolean;
  customWorkflows: boolean;
  advancedReporting: boolean;
}

export interface SecuritySettings {
  deviceRestrictions: {
    web: boolean;
    mobile: boolean;
    tablet: boolean;
  };
  mfaRequired: boolean;
  ipRestrictions: string[];
}

export interface SetPermissionsResponse {
  success: boolean;
  message: string;
  data: {
    accessControl: AccessControl;
    advancedFeatures: AdvancedFeatures;
    securitySettings: SecuritySettings;
    version: number;
    isActive: boolean;
    _id: string;
    role: string;
    __v: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface AdminPermissionsResponse {
  success: boolean;
  permissions: AdminPermissions;
}

export interface AssetPermissionsResponse {
  success: boolean;
  permissions: AssetPermission[];
}

export interface CreateAssetPermissionRequest {
  userId: string;
  assetId: string;
  permissions: string[];
  expiresAt?: string;
}

export interface CreateAssetPermissionResponse {
  success: boolean;
  permission: AssetPermission;
}

export interface UpdateAssetPermissionRequest {
  permissions: string[];
  expiresAt?: string;
  isActive?: boolean;
}

export interface UpdateAssetPermissionResponse {
  success: boolean;
  permission: AssetPermission;
}

// Get token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// Generic API request function with authentication
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication token not found');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };

  // Only add Content-Type for JSON requests
  if (!(options.body instanceof FormData)) {
    config.headers = {
      ...config.headers,
      'Content-Type': 'application/json',
    };
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};

// Asset API functions
export const assetApi = {
  // Get all assets
  getAllAssets: async (): Promise<AssetsResponse> => {
    return apiRequest<AssetsResponse>('/assets');
  },

  // Get asset by ID
  getAssetById: async (assetId: string): Promise<{ success: boolean; asset: Asset }> => {
    return apiRequest<{ success: boolean; asset: Asset }>(`/assets/${assetId}`);
  },

  // Get all asset types
  getAssetTypes: async (): Promise<AssetTypesResponse> => {
    const response = await apiRequest<AssetTypesResponse>('/asset-types');
    return response;
  },

  // Create new asset type
  createAssetType: async (assetTypeData: CreateAssetTypeRequest): Promise<CreateAssetTypeResponse> => {
    return apiRequest<CreateAssetTypeResponse>('/asset-types', {
      method: 'POST',
      body: JSON.stringify(assetTypeData),
    });
  },

  // Update asset type
  updateAssetType: async (assetTypeId: string, assetTypeData: CreateAssetTypeRequest): Promise<CreateAssetTypeResponse> => {
    return apiRequest<CreateAssetTypeResponse>(`/asset-types/${assetTypeId}`, {
      method: 'PUT',
      body: JSON.stringify(assetTypeData),
    });
  },

  // Delete asset type
  deleteAssetType: async (assetTypeId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/asset-types/${assetTypeId}`, {
      method: 'DELETE',
    });
  },

  // Create new asset
  createAsset: async (assetData: Partial<Asset> | FormData): Promise<{ success: boolean; asset: Asset }> => {
    const isFormData = assetData instanceof FormData;
    
    return apiRequest<{ success: boolean; asset: Asset }>('/assets', {
      method: 'POST',
      body: isFormData ? assetData : JSON.stringify(assetData),
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    });
  },

  // Update asset
  updateAsset: async (assetId: string, assetData: Partial<Asset> | FormData): Promise<{ success: boolean; asset: Asset }> => {
    const isFormData = assetData instanceof FormData;
    
    return apiRequest<{ success: boolean; asset: Asset }>(`/assets/${assetId}`, {
      method: 'PUT',
      body: isFormData ? assetData : JSON.stringify(assetData),
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    });
  },

  // Delete asset
  deleteAsset: async (assetId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/assets/${assetId}`, {
      method: 'DELETE',
    });
  },

  // Scan asset
  scanAsset: async (assetId: string, scanData: {
    location: { latitude: string; longitude: string };
    scanType: string;
    notes?: string;
  }): Promise<{ success: boolean; asset: Asset }> => {
    return apiRequest<{ success: boolean; asset: Asset }>(`/assets/${assetId}/scan`, {
      method: 'POST',
      body: JSON.stringify(scanData),
    });
  },

  // Asset Permissions API functions
  // Get all asset permissions
  getAssetPermissions: async (): Promise<AssetPermissionsResponse> => {
    return apiRequest<AssetPermissionsResponse>('/permissions/assets/admin');
  },

  // Get permissions for specific asset
  getAssetPermissionsByAssetId: async (assetId: string): Promise<AssetPermissionsResponse> => {
    return apiRequest<AssetPermissionsResponse>(`/permissions/assets/${assetId}`);
  },

  // Create new asset permission
  createAssetPermission: async (permissionData: CreateAssetPermissionRequest): Promise<CreateAssetPermissionResponse> => {
    return apiRequest<CreateAssetPermissionResponse>('/permissions/assets', {
      method: 'POST',
      body: JSON.stringify(permissionData),
    });
  },

  // Update asset permission
  updateAssetPermission: async (permissionId: string, permissionData: UpdateAssetPermissionRequest): Promise<UpdateAssetPermissionResponse> => {
    return apiRequest<UpdateAssetPermissionResponse>(`/permissions/assets/${permissionId}`, {
      method: 'PUT',
      body: JSON.stringify(permissionData),
    });
  },

  // Delete asset permission
  deleteAssetPermission: async (permissionId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/permissions/assets/${permissionId}`, {
      method: 'DELETE',
    });
  },

  // Admin Permissions API functions
  // Get admin permissions
  getAdminPermissions: async (): Promise<AdminPermissionsResponse> => {
    return apiRequest<AdminPermissionsResponse>('/admin/permissions/assets/admin');
  },

  // Get current permissions for a role
  getCurrentPermissions: async (role: string): Promise<SetPermissionsResponse> => {
    return apiRequest<SetPermissionsResponse>(`/admin/permissions/assets/${role}`);
  },

  // Get actual permissions from the admin endpoint
  getActualPermissions: async (): Promise<AdminPermissionsResponse> => {
    return apiRequest<AdminPermissionsResponse>('/admin/permissions/assets/admin');
  },

  // Update admin permissions
  updateAdminPermissions: async (permissions: AdminPermissions): Promise<AdminPermissionsResponse> => {
    return apiRequest<AdminPermissionsResponse>('/admin/permissions/assets/admin', {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  },

  // Set permissions for a role
  setPermissions: async (role: string, permissions: SetPermissionsRequest['permissions']): Promise<SetPermissionsResponse> => {
    return apiRequest<SetPermissionsResponse>('/admin/permissions/assets', {
      method: 'POST',
      body: JSON.stringify({ role, permissions }),
    });
  },
};

export default assetApi; 