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

export interface Asset {
  _id: string;
  tagId: string;
  assetType: string;
  subcategory: string;
  brand: string;
  model: string;
  serialNumber: string;
  capacity: string;
  yearOfInstallation: string;
  projectName: string;
  assignedTo: AssignedTo;
  status: string;
  priority: string;
  compliance: Compliance;
  digitalTagType: string;
  alerts: any[];
  documents: any[];
  tags: string[];
  notes: string;
  createdBy: string;
  photos: any[];
  scanHistory: ScanHistory[];
  location: Location;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface AssetsResponse {
  success: boolean;
  assets: Asset[];
}

export interface ApiError {
  message: string;
  status?: number;
}

// Get token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
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
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
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

  // Create new asset
  createAsset: async (assetData: Partial<Asset>): Promise<{ success: boolean; asset: Asset }> => {
    return apiRequest<{ success: boolean; asset: Asset }>('/assets', {
      method: 'POST',
      body: JSON.stringify(assetData),
    });
  },

  // Update asset
  updateAsset: async (assetId: string, assetData: Partial<Asset>): Promise<{ success: boolean; asset: Asset }> => {
    return apiRequest<{ success: boolean; asset: Asset }>(`/assets/${assetId}`, {
      method: 'PUT',
      body: JSON.stringify(assetData),
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
};

export default assetApi; 