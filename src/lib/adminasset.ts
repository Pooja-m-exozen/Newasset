const API_BASE_URL = 'https://digitalasset.zenapi.co.in/api'

// Types for Asset Creation API
export interface InventoryItem {
  itemName: string
  quantity: number
  status: 'Available' | 'Low Stock' | 'Out of Stock'
  lastUpdated: string
  tagId?: string  // Tag ID for individual inventory item
}

// Enhanced interfaces for Purchase Order, Replacement, and Lifecycle Management
export interface PurchaseOrder {
  poNumber: string
  poDate: string
  vendor: string
  vendorContact: string
  purchaseCost: number
  currency: string
  paymentTerms: string
  deliveryDate: string
  invoiceNumber?: string
  invoiceDate?: string
  notes?: string
  supplier?: string  // NEW: Alternative name for vendor
  purchaseDate?: string  // NEW: Alternative name for poDate
  price?: number  // NEW: Alternative name for purchaseCost
}

export interface ReplacementRecord {
  replacedAssetTagId: string
  replacementDate: string
  replacementReason: string
  costOfReplacement: number
  replacedBy: string
  notes?: string
}

export interface LifecycleStatus {
  status: 'procured' | 'received' | 'installed' | 'commissioned' | 'operational' | 'under_maintenance' | 'retired' | 'disposed'
  date: string
  notes?: string
  updatedBy: string
}

export interface FinancialData {
  purchaseOrder?: PurchaseOrder
  replacementHistory?: ReplacementRecord[]
  lifecycle?: LifecycleStatus[]
  totalCost?: number
  depreciationRate?: number
  currentValue?: number
}

export interface SubAsset {
  id?: string
  _id?: string
  tagId?: string  // NEW: Sub-asset tag ID
  assetName: string
  description?: string
  category: 'Movable' | 'Immovable'
  brand: string
  model: string
  capacity: string
  location: string
  digitalTagType?: string  // NEW: Digital tag type (qr, barcode, nfc)
  digitalAssets?: DigitalAsset  // NEW: Complete digital assets
  hasDigitalAssets?: boolean  // NEW: Quick check flag
  status?: string
  priority?: string
  purchaseOrder?: PurchaseOrder  // NEW: Sub-asset PO tracking
  replacementHistory?: ReplacementRecord[]  // NEW: Sub-asset replacement tracking
  lifecycle?: LifecycleStatus[]  // NEW: Sub-asset lifecycle tracking
  parentAsset?: AssetData  // NEW: Reference to parent asset
  inventory: {
    consumables: InventoryItem[]
    spareParts: InventoryItem[]
    tools: InventoryItem[]
    operationalSupply: InventoryItem[]
  }
}

export interface CreateAssetRequest {
  tagId: string
  assetType: string
  subcategory?: string
  mobilityCategory: 'Movable' | 'Immovable'
  brand: string
  model?: string
  serialNumber?: string
  capacity?: string
  yearOfInstallation?: string
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Retired'
  priority: 'High' | 'Medium' | 'Low'
  project?: {
    projectId: string
    projectName: string
  }
  location: {
    building?: string
    floor?: string
    room?: string
  }
  subAssets?: {
    movable: SubAsset[]
    immovable: SubAsset[]
  }
}

export interface AssetData {
  _id: string
  tagId: string
  assetType: string
  subcategory?: string
  mobilityCategory?: string
  brand: string
  model?: string
  serialNumber?: string
  capacity?: string
  yearOfInstallation?: string
  status?: string
  priority?: string
  project?: {
    projectId: string
    projectName: string
  }
  location?: {
    building?: string
    floor?: string
    room?: string
  }
  financial?: FinancialData  // NEW: Financial tracking data
  subAssets?: {
    movable: SubAsset[]
    immovable: SubAsset[]
  }
  scanHistory?: ScanHistory[]  // Scan history for the asset
  createdAt?: string
  updatedAt?: string
}

export interface CreateAssetResponse {
  success: boolean
  data: AssetData
  message: string
}

// API Functions for Asset Creation
export const createAsset = async (assetData: CreateAssetRequest): Promise<CreateAssetResponse> => {
  try {
    const token = localStorage.getItem('authToken')
    
    // Transform data to match backend expectations
    const backendData = {
      tagId: assetData.tagId,
      assetType: assetData.assetType,
      subcategory: assetData.subcategory || '',
      mobilityCategory: assetData.mobilityCategory.toLowerCase(), // Convert to lowercase
      brand: assetData.brand,
      model: assetData.model && assetData.model.trim() !== '' ? assetData.model : undefined,
      serialNumber: assetData.serialNumber && assetData.serialNumber.trim() !== '' ? assetData.serialNumber : undefined,
      capacity: assetData.capacity && assetData.capacity.trim() !== '' ? assetData.capacity : undefined,
      yearOfInstallation: assetData.yearOfInstallation && assetData.yearOfInstallation.trim() !== '' ? assetData.yearOfInstallation : undefined,
      status: assetData.status.toLowerCase(), // Convert to lowercase
      priority: assetData.priority.toLowerCase(), // Convert to lowercase
      location: {
        building: assetData.location.building,
        floor: assetData.location.floor,
        room: assetData.location.room
      },
      subAssets: assetData.subAssets ? {
        movable: assetData.subAssets.movable.map(subAsset => ({
          tagId: subAsset.tagId,
          assetName: subAsset.assetName,
          description: subAsset.description,
          category: subAsset.category,
          brand: subAsset.brand,
          model: subAsset.model,
          capacity: subAsset.capacity,
          location: subAsset.location,
          inventory: subAsset.inventory
        })),
        immovable: assetData.subAssets.immovable.map(subAsset => ({
          tagId: subAsset.tagId,
          assetName: subAsset.assetName,
          description: subAsset.description,
          category: subAsset.category,
          brand: subAsset.brand,
          model: subAsset.model,
          capacity: subAsset.capacity,
          location: subAsset.location,
          inventory: subAsset.inventory
        }))
      } : undefined,
      project: assetData.project && assetData.project.projectName ? {
        projectName: assetData.project.projectName,
        ...(assetData.project.projectId && assetData.project.projectId.trim() !== '' ? { projectId: assetData.project.projectId } : {})
      } : {
        projectName: 'Default Project'
      }
    }
    
    // Debug: Log the backend data being sent
    console.log('Backend data being sent:', JSON.stringify(backendData, null, 2))
    console.log('Project in backend data:', backendData.project)
    
    const response = await fetch(`${API_BASE_URL}/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(backendData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to create asset')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error creating asset:', error)
    throw error
  }
}

// API Functions for Asset Management
export const getAssets = async (page: number = 1, limit: number = 10000): Promise<AssetsResponse> => {
  try {
    const token = localStorage.getItem('authToken')
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })
    
    const response = await fetch(`${API_BASE_URL}/assets?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to fetch assets')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error fetching assets:', error)
    throw error
  }
}

export const getAssetsByMobility = async (mobilityCategory: 'movable' | 'immovable' | 'all'): Promise<AssetsResponse> => {
  try {
    const token = localStorage.getItem('authToken')
    
    const url = mobilityCategory === 'all' 
      ? `${API_BASE_URL}/assets`
      : `${API_BASE_URL}/assets/mobility/${mobilityCategory}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to fetch assets')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error fetching assets by mobility:', error)
    throw error
  }
}

export const searchAssets = async (searchTerm: string): Promise<AssetsResponse> => {
  try {
    const token = localStorage.getItem('authToken')
    
    const response = await fetch(`${API_BASE_URL}/assets?search=${encodeURIComponent(searchTerm)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to search assets')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error searching assets:', error)
    throw error
  }
}

// Helper function to validate asset data before sending
export const validateAssetData = (assetData: CreateAssetRequest): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  // Required field validations
  if (!assetData.tagId?.trim()) {
    errors.push('Asset ID is required')
  }
  
  if (!assetData.assetType?.trim()) {
    errors.push('Asset Type is required')
  }
  
  if (!assetData.brand?.trim()) {
    errors.push('Brand is required')
  }

  // Validate sub-assets if provided
  if (assetData.subAssets) {
    const { movable, immovable } = assetData.subAssets
    
    // Validate movable assets
    movable.forEach((subAsset, index) => {
      if (!subAsset.assetName?.trim()) {
        errors.push(`Movable Asset #${index + 1}: Asset Name is required`)
      }
      if (!subAsset.brand?.trim()) {
        errors.push(`Movable Asset #${index + 1}: Brand is required`)
      }
    })
    
    // Validate immovable assets
    immovable.forEach((subAsset, index) => {
      if (!subAsset.assetName?.trim()) {
        errors.push(`Immovable Asset #${index + 1}: Asset Name is required`)
      }
      if (!subAsset.brand?.trim()) {
        errors.push(`Immovable Asset #${index + 1}: Brand is required`)
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Types for Asset Management - Updated with mobilityCategory
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

export interface SubAsset {
  _id?: string;
  assetName: string;
  description?: string;
  brand: string;
  model: string;
  capacity: string;
  location: string;
}

export interface SubAssets {
  movable?: SubAsset[];
  immovable?: SubAsset[];
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
  barcode?: {
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
  nfcData?: {
    url: string;
    data: {
      id: string;
      type: string;
      assetType: string;
      subcategory: string;
      brand: string;
      model: string;
      status: string;
      priority: string;
      location: Location;
      assignedTo: string;
      projectName: string;
      timestamp: number;
      checksum: string;
      signature: string;
    };
    generatedAt: string;
  };
}

export interface Asset {
  subAssets?: SubAssets;
  subAssetSummary?: SubAssetSummary;  // NEW: Summary statistics
  _id?: string;
  tagId: string;
  assetType: string;
  subcategory?: string;
  mobilityCategory?: string;
  brand: string;
  model?: string;
  serialNumber?: string;
  capacity?: string;
  yearOfInstallation?: string;
  project?: {
    projectId: string;
    projectName: string;
  };
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
  customFields?: Record<string, string>;
  createdBy?: AssignedTo;
  photos?: Array<{ url: string; caption?: string; [key: string]: string | number | boolean | object | null | undefined }>;
  scanHistory?: ScanHistory[];
  location: Location;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface SubAssetSummary {
  totalMovable: number;
  totalImmovable: number;
  totalSubAssets: number;
  withTagIds: number;
  withDigitalAssets: number;
}

export interface SubAssetInfo {
  message: string;
  note: string;
}

export interface AssetsResponse {
  success: boolean;
  assets: Asset[];
  pagination?: PaginationInfo;
  message?: string;
  includeSubAssets?: boolean;  // NEW: Control flag
  subAssetInfo?: SubAssetInfo;  // NEW: Information about sub-assets
}

// Project interfaces
export interface Project {
  _id: string;
  name: string;
  code: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: {
    amount: number;
    currency: string;
  };
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
  };
  client: {
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
  };
  settings: {
    notificationSettings: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    allowAssetCreation: boolean;
    requireApproval: boolean;
    autoSync: boolean;
  };
  permissions: {
    assetManagement: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
      assign: boolean;
    };
    maintenance: {
      view: boolean;
      create: boolean;
      edit: boolean;
      approve: boolean;
    };
    analytics: {
      view: boolean;
      export: boolean;
    };
    userManagement: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
    };
  };
  projectManager: string | null;
  facilities: string[];
  createdBy: string;
  team: string[];
  assets: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ProjectsResponse {
  success: boolean;
  projects: Project[];
  count: number;
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
  // Get all projects
  getProjects: async (): Promise<ProjectsResponse> => {
    return apiRequest<ProjectsResponse>('/projects');
  },

  // Get all assets
  getAllAssets: async (page: number = 1, limit: number = 10): Promise<AssetsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    return apiRequest<AssetsResponse>(`/assets?${params.toString()}`);
  },

  // Get assets by project
  getAssetsByProject: async (projectIdentifier: string): Promise<AssetsResponse> => {
    // Try to determine if this is a project ID (ObjectId format) or project name
    const isProjectId = /^[0-9a-fA-F]{24}$/.test(projectIdentifier);
    
    if (isProjectId) {
      // If it's a project ID, try the project ID endpoint first
      try {
        console.log('Trying project ID endpoint with:', projectIdentifier);
        return await apiRequest<AssetsResponse>(`/assets/project/${projectIdentifier}`);
      } catch {
        console.log('Project ID endpoint failed, trying project name endpoint');
        // Fallback to project name endpoint
        return await apiRequest<AssetsResponse>(`/assets/project/${encodeURIComponent(projectIdentifier)}`);
      }
    } else {
      // If it's a project name, try the project name endpoint
      try {
        console.log('Trying project name endpoint with:', projectIdentifier);
        return await apiRequest<AssetsResponse>(`/assets/project/${encodeURIComponent(projectIdentifier)}`);
      } catch {
        console.log('Project name endpoint failed, trying project ID endpoint');
        // Fallback to project ID endpoint
        return await apiRequest<AssetsResponse>(`/assets/project/${projectIdentifier}`);
      }
    }
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
    
    // Debug: Log the asset ID and data being sent to backend
    console.log('updateAsset - Asset ID being sent:', assetId);
    console.log('updateAsset - Asset ID length:', assetId.length);
    console.log('updateAsset - Asset ID format valid:', /^[0-9a-fA-F]{24}$/.test(assetId));
    
    // Transform the data if it's not FormData
    let transformedData = assetData;
    if (!isFormData && assetData && typeof assetData === 'object') {
      // CRITICAL: DON'T send tagId when updating - it's the unique identifier and should NEVER change
      // The backend should preserve the existing tagId regardless of other field changes
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { tagId: _tagId, ...dataWithoutTagId } = assetData as Record<string, unknown>;
      
      // Double-check: Ensure tagId is completely removed (in case it was nested)
      if ('tagId' in dataWithoutTagId) {
        console.warn('WARNING: tagId found in update data after removal - removing it again');
        delete (dataWithoutTagId as Record<string, unknown>).tagId;
      }
      
      // CRITICAL: DO NOT send sub-assets in updates - their tagIds must NEVER change
      // Sub-assets are immutable after creation - only the main asset properties can be updated
      // If sub-assets are sent, remove tagIds from them as a safety measure
      // But ideally, sub-assets should not be sent at all in update requests
      const dataWithoutSubAssets = { ...dataWithoutTagId };
      
      // Remove sub-assets from update payload to prevent any tagId changes
      if ('subAssets' in dataWithoutSubAssets) {
        console.warn('WARNING: subAssets found in update payload - removing to preserve tagIds');
        delete (dataWithoutSubAssets as Record<string, unknown>).subAssets;
      }
      
      // Create a new object without sub-assets
      transformedData = dataWithoutSubAssets;
      
      // NOTE: If sub-assets absolutely must be sent for some reason (e.g., adding new ones),
      // the code below would process them, but we're explicitly NOT sending them to preserve tagIds
      // This is commented out as a safety measure:
      /*
      transformedData = {
        ...dataWithoutTagId,
        subAssets: assetData.subAssets ? (({
          movable: assetData.subAssets.movable?.map(subAsset => {
            // CRITICAL: Preserve _id so backend knows which sub-asset to update
            // Remove tagId, category, parentAsset, and empty inventory arrays
            // Sub-asset tagId should NEVER change - it's the unique identifier
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { tagId: _subAssetTagId, category: _category, parentAsset: _parentAsset, inventory, ...rest } = subAsset as unknown as Record<string, unknown>;
            // Preserve _id if it exists (for existing sub-assets)
            const result = '_id' in subAsset && subAsset._id ? { ...rest, _id: subAsset._id } : rest;
            // Only include inventory if it has items
            const inv = inventory as { consumables?: unknown[]; spareParts?: unknown[]; tools?: unknown[]; operationalSupply?: unknown[] };
            if (inventory && ((inv.consumables?.length ?? 0) > 0 || (inv.spareParts?.length ?? 0) > 0 || (inv.tools?.length ?? 0) > 0 || (inv.operationalSupply?.length ?? 0) > 0)) {
              return { ...result, inventory };
            }
            return result;
          }).filter(Boolean) || [],
          immovable: assetData.subAssets.immovable?.map(subAsset => {
            // CRITICAL: Preserve _id so backend knows which sub-asset to update
            // Remove tagId, category, parentAsset, and empty inventory arrays
            // Sub-asset tagId should NEVER change - it's the unique identifier
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { tagId: _subAssetTagId, category: _category, parentAsset: _parentAsset, inventory, ...rest } = subAsset as unknown as Record<string, unknown>;
            // Preserve _id if it exists (for existing sub-assets)
            const result = '_id' in subAsset && subAsset._id ? { ...rest, _id: subAsset._id } : rest;
            // Only include inventory if it has items
            const inv = inventory as { consumables?: unknown[]; spareParts?: unknown[]; tools?: unknown[]; operationalSupply?: unknown[] };
            if (inventory && ((inv.consumables?.length ?? 0) > 0 || (inv.spareParts?.length ?? 0) > 0 || (inv.tools?.length ?? 0) > 0 || (inv.operationalSupply?.length ?? 0) > 0)) {
              return { ...result, inventory };
            }
            return result;
          }).filter(Boolean) || []
        }) as unknown as SubAssets) : undefined
      };
      */
      
      // Remove location field if it has invalid data (latitude/longitude as "0")
      if (transformedData && typeof transformedData === 'object' && 'location' in transformedData) {
        const locData = transformedData as Record<string, unknown>;
        if (locData.location && typeof locData.location === 'object' && ('latitude' in locData.location || 'longitude' in locData.location)) {
          const loc = locData.location as Record<string, unknown>;
          if (loc.latitude === "0" && loc.longitude === "0" && !loc.building && !loc.floor && !loc.room) {
            delete locData.location;
          }
        }
      }
      
      // Final safety check: Ensure tagId is absolutely not in the payload (main asset)
      if (transformedData && typeof transformedData === 'object' && 'tagId' in transformedData) {
        console.error('ERROR: Main asset tagId should never be in update payload - removing it');
        delete (transformedData as Record<string, unknown>).tagId;
      }
      
      // Final safety check: Ensure no sub-asset tagIds are in the payload
      if (transformedData && typeof transformedData === 'object' && 'subAssets' in transformedData) {
        const subAssets = (transformedData as Record<string, unknown>).subAssets as { movable?: unknown[]; immovable?: unknown[] } | undefined;
        if (subAssets) {
          // Check movable sub-assets
          if (subAssets.movable && Array.isArray(subAssets.movable)) {
            subAssets.movable.forEach((subAsset, index) => {
              if (subAsset && typeof subAsset === 'object' && 'tagId' in subAsset) {
                console.error(`ERROR: Sub-asset tagId found in movable[${index}] - removing it`);
                delete (subAsset as Record<string, unknown>).tagId;
              }
            });
          }
          // Check immovable sub-assets
          if (subAssets.immovable && Array.isArray(subAssets.immovable)) {
            subAssets.immovable.forEach((subAsset, index) => {
              if (subAsset && typeof subAsset === 'object' && 'tagId' in subAsset) {
                console.error(`ERROR: Sub-asset tagId found in immovable[${index}] - removing it`);
                delete (subAsset as Record<string, unknown>).tagId;
              }
            });
          }
        }
      }
      
      console.log('updateAsset - Transformed data (after cleanup):', JSON.stringify(transformedData, null, 2));
      console.log('updateAsset - Confirming tagId is NOT in payload:', !('tagId' in transformedData));
    }
    
    // For FormData, we can't easily check, but tagId should not be included in the form
    if (isFormData && assetData instanceof FormData && assetData.has('tagId')) {
      console.warn('WARNING: FormData contains tagId - this should be removed before sending');
      assetData.delete('tagId');
    }
    
    return apiRequest<{ success: boolean; asset: Asset }>(`/assets/${assetId}`, {
      method: 'PUT',
      body: isFormData ? assetData : JSON.stringify(transformedData),
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

  // Update sub-asset tag ID
  updateSubAssetTagId: async (
    assetId: string,
    subAssetIndex: number,
    category: 'movable' | 'immovable',
    tagId: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/assets/${assetId}/sub-asset/${subAssetIndex}/${category}/tag-id`, {
      method: 'PUT',
      body: JSON.stringify({ tagId }),
    });
  },

  // Sub-asset Digital Asset Generation APIs
  // 1. Individual Sub-Asset QR Code Generation
  generateSubAssetQRCode: async (
    assetId: string,
    subAssetIndex: number,
    category: 'movable' | 'immovable',
    options: {
      size?: number;
      quality?: number;
      includeUrl?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    qrCode: {
      url: string;
      shortUrl: string;
      data: Record<string, unknown>;
      tagId: string;
    };
  }> => {
    return apiRequest(`/digital-assets/sub-asset/${assetId}/${subAssetIndex}/${category}/qr`, {
      method: 'POST',
      body: JSON.stringify({
        size: options.size || 500,
        quality: options.quality || 1.0,
        includeUrl: options.includeUrl !== false
      }),
    });
  },

  // 2. Generate All Digital Assets for One Sub-Asset
  generateSubAssetAllDigitalAssets: async (
    assetId: string,
    subAssetIndex: number,
    category: 'movable' | 'immovable',
    digitalTypes: string[] = ['qr', 'barcode', 'nfc']
  ): Promise<{
    success: boolean;
    digitalAssets: Record<string, unknown>;
    message: string;
  }> => {
    return apiRequest(`/digital-assets/sub-asset/${assetId}/${subAssetIndex}/${category}/all`, {
      method: 'POST',
      body: JSON.stringify({ digitalTypes }),
    });
  },

  // 3. Bulk Generate Digital Assets for All Sub-Assets
  bulkGenerateSubAssetDigitalAssets: async (
    assetId: string,
    options: {
      digitalTypes?: string[];
      qr?: { size?: number };
      barcode?: { scale?: number };
    } = {}
  ): Promise<{
    success: boolean;
    results: Array<Record<string, unknown>>;
    message: string;
    summary?: {
      total: number;
      successful: number;
      failed: number;
    };
  }> => {
    return apiRequest(`/digital-assets/sub-asset/bulk/${assetId}`, {
      method: 'POST',
      body: JSON.stringify({
        digitalTypes: options.digitalTypes || ['qr', 'barcode'],
        qr: options.qr || { size: 400 },
        barcode: options.barcode || { scale: 3 }
      }),
    });
  },

  // Get assets with sub-asset details (performance control)
  getAssetsWithSubAssets: async (includeSubAssets: boolean = true, page: number = 1, limit: number = 1000): Promise<AssetsResponse> => {
    const params = new URLSearchParams({
      includeSubAssets: includeSubAssets.toString(),
      page: page.toString(),
      limit: limit.toString()
    });
    return apiRequest<AssetsResponse>(`/assets?${params.toString()}`);
  },

  // Purchase Order Management APIs
  // Link main asset to Purchase Order
  linkAssetToPO: async (assetId: string, poData: PurchaseOrder): Promise<{ success: boolean; message: string; asset: Asset }> => {
    return apiRequest(`/assets/${assetId}/link-po`, {
      method: 'POST',
      body: JSON.stringify(poData),
    });
  },

  // Link sub-asset to Purchase Order
  linkSubAssetToPO: async (
    assetId: string,
    subAssetIndex: number,
    category: 'movable' | 'immovable',
    poData: PurchaseOrder
  ): Promise<{ success: boolean; message: string; asset: Asset }> => {
    return apiRequest(`/assets/${assetId}/sub-asset/${subAssetIndex}/${category}/link-po`, {
      method: 'POST',
      body: JSON.stringify(poData),
    });
  },

  // Get all assets by Purchase Order number
  getAssetsByPO: async (poNumber: string): Promise<AssetsResponse> => {
    return apiRequest(`/assets/po/${encodeURIComponent(poNumber)}`);
  },

  // Asset Replacement Tracking APIs
  // Record asset replacement
  recordAssetReplacement: async (assetId: string, replacementData: ReplacementRecord): Promise<{ success: boolean; message: string; asset: Asset }> => {
    return apiRequest(`/assets/${assetId}/replace`, {
      method: 'POST',
      body: JSON.stringify(replacementData),
    });
  },

  // Record sub-asset replacement
  recordSubAssetReplacement: async (
    assetId: string,
    subAssetIndex: number,
    category: 'movable' | 'immovable',
    replacementData: ReplacementRecord
  ): Promise<{ success: boolean; message: string; asset: Asset }> => {
    return apiRequest(`/assets/${assetId}/sub-asset/${subAssetIndex}/${category}/replace`, {
      method: 'POST',
      body: JSON.stringify(replacementData),
    });
  },

  // Get asset replacement history
  getAssetReplacementHistory: async (assetId: string): Promise<{ success: boolean; replacementHistory: ReplacementRecord[] }> => {
    return apiRequest(`/assets/${assetId}/replacement-history`);
  },

  // Get sub-asset replacement history
  getSubAssetReplacementHistory: async (
    assetId: string,
    subAssetIndex: number,
    category: 'movable' | 'immovable'
  ): Promise<{ success: boolean; replacementHistory: ReplacementRecord[] }> => {
    return apiRequest(`/assets/${assetId}/sub-asset/${subAssetIndex}/${category}/replacement-history`);
  },

  // Asset Lifecycle Management APIs
  // Update asset lifecycle status
  updateAssetLifecycleStatus: async (assetId: string, lifecycleData: LifecycleStatus): Promise<{ success: boolean; message: string; asset: Asset }> => {
    return apiRequest(`/assets/${assetId}/lifecycle-status`, {
      method: 'PUT',
      body: JSON.stringify(lifecycleData),
    });
  },

  // Update sub-asset lifecycle status
  updateSubAssetLifecycleStatus: async (
    assetId: string,
    subAssetIndex: number,
    category: 'movable' | 'immovable',
    lifecycleData: LifecycleStatus
  ): Promise<{ success: boolean; message: string; asset: Asset }> => {
    return apiRequest(`/assets/${assetId}/sub-asset/${subAssetIndex}/${category}/lifecycle-status`, {
      method: 'PUT',
      body: JSON.stringify(lifecycleData),
    });
  },

  // Get assets by lifecycle status
  getAssetsByLifecycleStatus: async (status: string): Promise<AssetsResponse> => {
    return apiRequest(`/assets/lifecycle/${encodeURIComponent(status)}`);
  },

  // Get asset lifecycle history
  getAssetLifecycleHistory: async (assetId: string): Promise<{ success: boolean; lifecycleHistory: LifecycleStatus[] }> => {
    return apiRequest(`/assets/${assetId}/lifecycle-history`);
  },

  // Get sub-asset lifecycle history
  getSubAssetLifecycleHistory: async (
    assetId: string,
    subAssetIndex: number,
    category: 'movable' | 'immovable'
  ): Promise<{ success: boolean; lifecycleHistory: LifecycleStatus[] }> => {
    return apiRequest(`/assets/${assetId}/sub-asset/${subAssetIndex}/${category}/lifecycle-history`);
  },

  // Financial Management APIs
  // Get asset financial summary
  getAssetFinancialSummary: async (assetId: string): Promise<{ success: boolean; financialData: FinancialData }> => {
    return apiRequest(`/assets/${assetId}/financial-summary`);
  },

  // Update asset financial data
  updateAssetFinancialData: async (assetId: string, financialData: Partial<FinancialData>): Promise<{ success: boolean; message: string; asset: Asset }> => {
    return apiRequest(`/assets/${assetId}/financial`, {
      method: 'PUT',
      body: JSON.stringify(financialData),
    });
  },

  // Get assets by cost range
  getAssetsByCostRange: async (minCost: number, maxCost: number): Promise<AssetsResponse> => {
    const params = new URLSearchParams({
      minCost: minCost.toString(),
      maxCost: maxCost.toString()
    });
    return apiRequest(`/assets/financial/cost-range?${params.toString()}`);
  },

  // Get assets by vendor
  getAssetsByVendor: async (vendor: string): Promise<AssetsResponse> => {
    return apiRequest(`/assets/financial/vendor/${encodeURIComponent(vendor)}`);
  },
};

export default assetApi;