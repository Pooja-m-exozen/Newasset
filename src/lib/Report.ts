// Report utility functions and API calls
const API_BASE_URL = 'http://192.168.0.5:5021/api'

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

export interface Asset {
  _id: string;
  tagId: string;
  assetType: string;
  subcategory?: string;
  brand: string;
  model?: string;
  serialNumber?: string;
  capacity?: string;
  yearOfInstallation?: string;
  projectName?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  status?: string;
  priority?: string;
  digitalTagType?: string;
  tags?: string[];
  notes?: string;
  createdBy?: string;
  location: {
    latitude: string;
    longitude: string;
    floor?: string;
    room?: string;
    building?: string;
  };
  createdAt: string;
  updatedAt: string;
  maintenanceSchedule?: {
    lastMaintenance: string;
    nextMaintenance: string;
    maintenanceType: string;
  };
  performanceMetrics?: {
    efficiency: number;
    uptime: number;
    temperature: number;
    energyConsumption: number;
    vibration: number;
  };
}

export interface ApiResponse {
  success: boolean;
  assets: Asset[];
}

export interface MaintenanceLog {
  id: string;
  assetId: string;
  assetName: string;
  maintenanceType: string;
  description: string;
  technicianId: string;
  technicianName: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  cost?: number;
}

// Updated AuditLog interface based on the API response
export interface AuditLog {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  action: string;
  resourceType: string;
  resourceId: string;
  details: {
    tagId?: string;
    assetType?: string;
    subcategory?: string;
    capacity?: string;
    brand?: string;
    yearOfInstallation?: string;
    location?: {
      latitude: string;
      longitude: string;
    };
    photos?: string[];
    projectName?: string;
    [key: string]: string | number | boolean | object | null | undefined; // For other dynamic properties
  };
  timestamp: string;
  __v: number;
}

export interface AuditLogsResponse {
  success: boolean;
  logs: AuditLog[];
}

// API Functions
export const fetchAssets = async (): Promise<Asset[]> => {
  try {
    const data: ApiResponse = await apiRequest('/assets');
    
    if (data.success) {
      return data.assets;
    } else {
      throw new Error('Failed to fetch assets');
    }
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
};

export const fetchMaintenanceLogs = async (): Promise<MaintenanceLog[]> => {
  try {
    const data: { logs: MaintenanceLog[] } = await apiRequest('/maintenance-logs');
    return data.logs || [];
  } catch (error) {
    console.error('Error fetching maintenance logs:', error);
    throw error;
  }
};

export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  try {
    const data: AuditLogsResponse = await apiRequest('/export/audit-trails');
    
    if (data.success) {
      return data.logs || [];
    } else {
      throw new Error('Failed to fetch audit logs');
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

// Filter Functions
export const filterAssets = (
  assets: Asset[],
  searchTerm: string,
  statusFilter: string,
  priorityFilter: string,
  typeFilter: string
): Asset[] => {
  return assets.filter(asset => {
    const matchesSearch = asset.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.assignedTo?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || asset.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || asset.assetType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });
};

export const filterAuditLogs = (
  logs: AuditLog[],
  searchTerm: string,
  actionFilter: string,
  resourceTypeFilter: string
): AuditLog[] => {
  return logs.filter(log => {
    const matchesSearch = log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.tagId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesResourceType = resourceTypeFilter === 'all' || log.resourceType === resourceTypeFilter;
    
    return matchesSearch && matchesAction && matchesResourceType;
  });
};

export const filterMaintenanceLogs = (
  logs: MaintenanceLog[],
  searchTerm: string,
  statusFilter: string,
  priorityFilter: string,
  typeFilter: string
): MaintenanceLog[] => {
  return logs.filter(log => {
    const matchesSearch = log.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.technicianName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || log.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || log.maintenanceType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });
};

// Export Functions
export const generatePDFData = (assets: Asset[]) => {
  return {
    title: 'Asset Report',
    date: new Date().toLocaleDateString(),
    assets: assets.map(asset => ({
      tagId: asset.tagId,
      brand: asset.brand,
      model: asset.model,
      assetType: asset.assetType,
      status: asset.status,
      assignedTo: asset.assignedTo?.name || 'Unassigned',
      location: asset.location.building || 'Location not specified',
      priority: asset.priority,
      createdAt: new Date(asset.createdAt).toLocaleDateString(),
      lastUpdated: new Date(asset.updatedAt).toLocaleDateString()
    }))
  };
};

export const generateAuditLogsPDFData = (logs: AuditLog[]) => {
  return {
    title: 'Audit Trails Report',
    date: new Date().toLocaleDateString(),
    logs: logs.map(log => ({
      user: log.user.name,
      email: log.user.email,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      details: log.details,
      timestamp: new Date(log.timestamp).toLocaleString(),
      tagId: log.details.tagId || 'N/A',
      assetType: log.details.assetType || 'N/A',
      brand: log.details.brand || 'N/A',
      projectName: log.details.projectName || 'N/A'
    }))
  };
};

export const generateExcelData = (assets: Asset[]) => {
  return assets.map(asset => ({
    'Tag ID': asset.tagId,
    'Brand': asset.brand,
    'Model': asset.model || '',
    'Asset Type': asset.assetType,
    'Subcategory': asset.subcategory || '',
    'Status': asset.status || '',
    'Priority': asset.priority || '',
    'Assigned To': asset.assignedTo?.name || 'Unassigned',
    'Email': asset.assignedTo?.email || '',
    'Building': asset.location.building || '',
    'Floor': asset.location.floor || '',
    'Room': asset.location.room || '',
    'Created Date': new Date(asset.createdAt).toLocaleDateString(),
    'Last Updated': new Date(asset.updatedAt).toLocaleDateString(),
    'Serial Number': asset.serialNumber || '',
    'Capacity': asset.capacity || '',
    'Project Name': asset.projectName || '',
    'Digital Tag Type': asset.digitalTagType || '',
    'Year of Installation': asset.yearOfInstallation || ''
  }));
};

export const generateAuditLogsExcelData = (logs: AuditLog[]) => {
  return logs.map(log => ({
    'User': log.user.name,
    'Email': log.user.email,
    'Action': log.action,
    'Resource Type': log.resourceType,
    'Resource ID': log.resourceId,
    'Tag ID': log.details.tagId || 'N/A',
    'Asset Type': log.details.assetType || 'N/A',
    'Brand': log.details.brand || 'N/A',
    'Capacity': log.details.capacity || 'N/A',
    'Project Name': log.details.projectName || 'N/A',
    'Year of Installation': log.details.yearOfInstallation || 'N/A',
    'Timestamp': new Date(log.timestamp).toLocaleString(),
    'Details': JSON.stringify(log.details)
  }));
};

// Utility Functions
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

export const getStatusBadge = (status: string) => {
  const statusConfig = {
    active: { color: 'bg-green-100 text-green-800', label: 'Active' },
    inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
    maintenance: { color: 'bg-yellow-100 text-yellow-800', label: 'Maintenance' },
    intialization: { color: 'bg-blue-100 text-blue-800', label: 'Initialization' }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
  
  return {
    className: config.color,
    label: config.label
  };
};

export const getPriorityBadge = (priority: string) => {
  const priorityConfig = {
    low: { color: 'bg-gray-100 text-gray-800', label: 'Low' },
    medium: { color: 'bg-blue-100 text-blue-800', label: 'Medium' },
    high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
    critical: { color: 'bg-red-100 text-red-800', label: 'Critical' }
  };
  
  const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
  
  return {
    className: config.color,
    label: config.label
  };
};

export const getActionBadge = (action: string) => {
  const actionConfig = {
    create: { color: 'bg-green-100 text-green-800', label: 'Create' },
    update: { color: 'bg-blue-100 text-blue-800', label: 'Update' },
    delete: { color: 'bg-red-100 text-red-800', label: 'Delete' },
    view: { color: 'bg-gray-100 text-gray-800', label: 'View' },
    login: { color: 'bg-purple-100 text-purple-800', label: 'Login' },
    logout: { color: 'bg-orange-100 text-orange-800', label: 'Logout' }
  };
  
  const config = actionConfig[action.toLowerCase() as keyof typeof actionConfig] || actionConfig.view;
  
  return {
    className: config.color,
    label: config.label
  };
};
