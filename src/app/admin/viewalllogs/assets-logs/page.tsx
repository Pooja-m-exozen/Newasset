'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { LoadingSpinner } from '../../../../components/ui/loading-spinner';
import { ErrorDisplay } from '../../../../components/ui/error-display';
import { AssetGrid } from '../../../../components/ui/asset-grid';
import { AssetPDFDownload, AssetExcelDownload } from '../../../../components/ui/asset-pdf-download';
import { ReportProvider, useReportContext } from '../../../../contexts/ReportContext';
import { filterAssets, type Asset } from '../../../../lib/Report';
import { SuccessToast } from '../../../../components/ui/success-toast';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { useAuth } from '../../../../contexts/AuthContext';
import { 
  MapPin,
  Search,
  FileText,
  BarChart3,
  Edit,
  Calendar,
  Clock,
  User,
  Building,
  Smartphone,
  Monitor,
  Server,
  Eye,
  MoreHorizontal,
  PieChart,
  Database,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// API Base URL constant
const API_BASE_URL = 'https://digitalasset.zenapi.co.in/api';

interface AssetsResponse {
  success?: boolean;
  assets?: Asset[];
  data?: Asset[];
  items?: Asset[];
  results?: Asset[];
}

function AssetsLogsContent() {
  const { user } = useAuth();
  const { loading, error, successMessage, clearError, clearSuccess } = useReportContext();
  const [projectAssets, setProjectAssets] = useState<Asset[]>([]);
  const [assetTypes, setAssetTypes] = useState<Array<{_id: string, name: string}>>([]);
  const [selectedAssetType, setSelectedAssetType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch asset types from API
  const fetchAssetTypes = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_BASE_URL}/asset-types`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch asset types: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.assetTypes) {
        setAssetTypes(data.assetTypes);
      }
    } catch (err) {
      console.error('Error fetching asset types:', err);
    }
  }, []);

  // Fetch assets from API and filter by user's project
  const fetchProjectAssets = useCallback(async () => {
    try {
      if (!user?.projectName) {
        throw new Error('User project not found. Please login again.');
      }

      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Try to fetch all assets with a high limit first
      let allAssets: Asset[] = [];
      let page = 1;
      const limit = 1000; // High limit to get all records
      let hasMoreData = true;

      while (hasMoreData) {
        const response = await fetch(`${API_BASE_URL}/assets?limit=${limit}&page=${page}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please login again.');
          }
          throw new Error(`Failed to fetch assets: ${response.status}`);
        }

        const data: AssetsResponse = await response.json();
        
        let pageAssets: Asset[] = [];
        
        // Extract assets from response
        if (data.success && data.assets) {
          pageAssets = data.assets;
        } else if (data.assets) {
          pageAssets = data.assets;
        } else if (Array.isArray(data)) {
          pageAssets = data;
        } else {
          const possibleAssets = data.data || data.items || data.results || [];
          if (Array.isArray(possibleAssets)) {
            pageAssets = possibleAssets as Asset[];
          }
        }

        // If we got fewer assets than the limit, we've reached the end
        if (pageAssets.length < limit) {
          hasMoreData = false;
        }

        allAssets = [...allAssets, ...pageAssets];
        page++;

        // Safety check to prevent infinite loops
        if (page > 100) {
          console.warn('Reached maximum page limit (100), stopping pagination');
          break;
        }
      }

      // Filter assets by user's project name
      const userAssets = allAssets.filter(asset => {
        // Check both the old projectName property and the new nested project structure
        const assetProjectName = asset.project?.projectName || asset.projectName;
        return assetProjectName === user.projectName;
      });

      if (userAssets.length === 0) {
        console.warn(`No assets found for project: ${user.projectName}`);
      }
      
      setProjectAssets(userAssets);
    } catch (err) {
      console.error('Error fetching project assets:', err);
      // Don't set error here as we still want to show the page
    }
  }, [user?.projectName]);

  // Load project assets and asset types when user changes
  useEffect(() => {
    if (user?.projectName) {
      fetchProjectAssets();
      fetchAssetTypes();
    }
  }, [user?.projectName, fetchProjectAssets, fetchAssetTypes]);

  const filteredAssets = useMemo(() => {
    // Transform assets to match Report library's Asset interface
    const transformedAssets = projectAssets.map(asset => ({
      ...asset,
      createdBy: asset.createdBy ? {
        _id: asset.createdBy,
        name: asset.createdBy, // Use the string as both ID and name
        email: '' // Default empty email
      } : undefined
    }));
    
    // Count unique TAG IDs - this is the true asset count
    const uniqueTagIds = [...new Set(transformedAssets.map(asset => asset.tagId))];
    console.log('Assets Logs - Unique TAG IDs count:', uniqueTagIds.length);
    console.log('Assets Logs - First few TAG IDs:', uniqueTagIds.slice(0, 5));
    
    // Remove duplicates based on tagId first
    const uniqueAssets = transformedAssets.filter((asset, index, self) => 
      index === self.findIndex(a => a.tagId === asset.tagId)
    );
    
    console.log('Assets Logs - Original assets:', projectAssets.length);
    console.log('Assets Logs - Unique assets after deduplication:', uniqueAssets.length);
    
    let filtered = filterAssets(uniqueAssets as Asset[], searchTerm, 'all', 'all', 'all');
    
    // Additional filtering by selected asset type
    if (selectedAssetType !== 'all') {
      filtered = filtered.filter(asset => asset.assetType === selectedAssetType);
    }
    
    // Sort assets
    filtered.sort((a, b) => {
      let aValue: unknown = a[sortBy as keyof typeof a];
      let bValue: unknown = b[sortBy as keyof typeof b];
      
      if (sortBy === 'updatedAt' || sortBy === 'createdAt') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      
      if (sortOrder === 'asc') {
        return (aValue as number) > (bValue as number) ? 1 : -1;
      } else {
        return (aValue as number) < (bValue as number) ? 1 : -1;
      }
    });
    
    return filtered;
  }, [projectAssets, searchTerm, selectedAssetType, sortBy, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedAssetType, sortBy, sortOrder]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedAssetType('all');
    setSortBy('updatedAt');
    setSortOrder('desc');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleViewDetails = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedAsset(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAssetTypeIcon = (assetType: string) => {
    switch (assetType?.toLowerCase()) {
      case 'computer':
      case 'dell':
        return Monitor;
      case 'smartphone':
      case 'mobile':
        return Smartphone;
      case 'server':
        return Server;
      default:
        return Building;
    }
  };

  const handlePDFDownload = () => {
    console.log('PDF download initiated');
  };

  const handleExcelDownload = () => {
    console.log('Excel download initiated');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700', icon: '✓' },
      inactive: { color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-700', icon: '✗' },
      maintenance: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-700', icon: '⚠' },
      intialization: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-700', icon: '⏱' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border`}>
        <span className="text-sm">{config.icon}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700' },
      medium: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-700' },
      high: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-700' },
      critical: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-700' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low;
    
    return (
      <Badge className={`${config.color} px-3 py-1.5 rounded-full text-xs font-semibold border`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const formatLocation = (location: Asset['location']) => {
    if (!location) return 'No location specified';
    
    if (typeof location === 'string') {
      return location;
    }
    
    if (typeof location === 'object') {
      const parts = [];
      if (location.building) parts.push(location.building);
      if (location.floor) parts.push(`${location.floor} floor`);
      if (location.room) parts.push(location.room);
      
      return parts.length > 0 ? parts.join(' - ') : 'Location specified';
    }
    
    return 'No location specified';
  };



  // Custom table component for the specific columns
  const ProjectAssetsTable = ({ assets }: { assets: Asset[] }) => {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 px-4 py-3 border-b border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Asset Inventory</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {assets.length} assets
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-3 p-4">
            {assets.map((asset) => (
              <div key={asset._id} className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
                {/* Asset Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                      {React.createElement(getAssetTypeIcon(asset.assetType || 'unknown'), {
                        className: "w-5 h-5 text-white"
                      })}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                        {asset.brand} {asset.model || ''}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {asset.assetType} • {asset.tagId || 'No Tag'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(asset.status || 'active')}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(asset)}
                      className="h-9 w-9 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Asset Details Grid */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Tag ID</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {asset.tagId || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Vendor</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {(() => {
                        const vendorName = asset.customFields?.['Vendor Name'];
                        return (typeof vendorName === 'string' ? vendorName : null) || asset.brand || 'N/A';
                      })()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Location</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-sm text-right max-w-[60%] truncate">
                      {formatLocation(asset.location)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Serial Number</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {asset.serialNumber || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 px-6 py-4 border-b border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Asset Inventory</h3>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {assets.length} assets
                </span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-600">
                  <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300 w-16">#</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300 min-w-[200px]">Asset Details</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300 min-w-[150px]">Tag & Serial</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300 min-w-[120px]">Vendor</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300 w-32">Category</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300 min-w-[180px]">Location</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300 w-28">Status</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, index) => (
                  <tr key={asset._id} className="group border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-200">
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                      <div className="flex items-center justify-center w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-semibold">
                        {index + 1}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                          {React.createElement(getAssetTypeIcon(asset.assetType || 'unknown'), {
                            className: "w-5 h-5 text-white"
                          })}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                            {asset.brand} {asset.model || ''}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {asset.assetType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {asset.tagId || 'N/A'}
                        </div>
                        {asset.serialNumber && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            SN: {asset.serialNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                        {(() => {
                          const vendorName = asset.customFields?.['Vendor Name'];
                          return (typeof vendorName === 'string' ? vendorName : null) || asset.brand || 'N/A';
                        })()}
                      </div>
                      {asset.customFields?.['HSN'] && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          HSN: {String(asset.customFields['HSN'])}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs font-medium border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        {asset.assetType || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="text-sm text-slate-900 dark:text-slate-100 truncate">
                          {formatLocation(asset.location)}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(asset.status || 'active')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(asset)}
                          className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(asset)}
                          className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="More Options"
                        >
                          <MoreHorizontal className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Pagination Component
  const PaginationComponent = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-600">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span>Showing</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {startIndex + 1}-{Math.min(endIndex, filteredAssets.length)}
          </span>
          <span>of</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {filteredAssets.length}
          </span>
          <span>assets</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0 border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-2 py-1 text-slate-500 dark:text-slate-400">...</span>
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page as number)}
                    className={`h-8 w-8 p-0 text-sm ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0 border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">Loading Assets Dashboard...</p>
            <p className="text-sm text-slate-500 dark:text-slate-500">Please wait while we fetch your project data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:h-16 gap-4 sm:gap-0">
            <div className="flex items-center space-x-4 min-w-0">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl flex-shrink-0">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  Assets Management
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                  {user?.projectName || 'Project'} • Asset Inventory & Analytics
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Display */}
        <ErrorDisplay 
          error={error} 
          onClearError={clearError} 
        />

        {/* Success Toast */}
        {successMessage && (
          <SuccessToast
            message={successMessage}
            onClose={clearSuccess}
            duration={4000}
          />
        )}



        {/* Search, Filters, and View Controls */}
        <Card className="mb-8 border-slate-200 dark:border-slate-700 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search and Asset Type */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Search assets, tags, serial numbers..."
                    className="pl-10 h-12 text-base border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="w-full sm:w-auto sm:min-w-[180px]">
                  <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
                    <SelectTrigger className="h-12 text-base border-slate-200 dark:border-slate-700">
                      <SelectValue placeholder="All Asset Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Asset Types</SelectItem>
                      {assetTypes.map(type => (
                        <SelectItem key={type._id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* View Mode Buttons and Export Controls */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setViewMode('table')}
                  className={`${viewMode === 'table' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700'} w-full sm:w-auto`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Table View
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewMode('grid')}
                  className={`${viewMode === 'grid' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700'} w-full sm:w-auto`}
                >
                  <PieChart className="w-4 h-4 mr-2" />
                  Grid View
                </Button>
                
                <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                
                <AssetPDFDownload
                  assets={filteredAssets}
                  filename={`${user?.projectName || 'project'}-${selectedAssetType !== 'all' ? selectedAssetType.toLowerCase() : 'all'}-asset-details.pdf`}
                  selectedAssetType={selectedAssetType}
                  projectName={user?.projectName || 'Unknown Project'}
                  onDownload={handlePDFDownload}
                />
                <AssetExcelDownload
                  assets={filteredAssets}
                  filename={`${user?.projectName || 'project'}-assets-report.xlsx`}
                  projectName={user?.projectName || 'Unknown Project'}
                  onDownload={handleExcelDownload}
                />
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Assets Display */}
        {filteredAssets.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
            <CardContent className="p-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Database className="w-12 h-12 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No assets found</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 text-lg max-w-md mx-auto">
                {projectAssets.length === 0 
                  ? `No assets found for project: ${user?.projectName || 'your project'}`
                  : 'No assets match your current filters. Try adjusting your search criteria or clearing the filters.'
                }
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={handleClearFilters}
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                >
                  Clear Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchProjectAssets}
                  className="border-slate-200 dark:border-slate-700"
                >
                  Refresh Assets
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'table' ? (
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Asset Inventory</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Comprehensive view of all tracked assets for {user?.projectName || 'your project'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {filteredAssets.length} assets
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ProjectAssetsTable assets={paginatedAssets} />
              <PaginationComponent />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg">
                    <PieChart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Asset Grid View</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Visual overview of all assets in card format
                    </p>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AssetGrid
                assets={paginatedAssets}
                onViewDetails={handleViewDetails}
              />
              <PaginationComponent />
            </CardContent>
          </Card>
        )}

        {/* Asset View Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-3xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg">
                  <Database className="w-5 h-5 text-white" />
                </div>
                Asset Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedAsset && (
              <div className="space-y-6">
                {/* Asset Header */}
                <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl">
                    {React.createElement(getAssetTypeIcon(selectedAsset.assetType || 'unknown'), {
                      className: "w-8 h-8 text-white"
                    })}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedAsset.tagId || 'Unknown Asset'}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {selectedAsset.assetType || 'Unknown Type'} • {selectedAsset.brand || 'Unknown Brand'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedAsset.status || 'active')}
                    {getPriorityBadge(selectedAsset.priority || 'medium')}
                  </div>
                </div>

                {/* Asset Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assigned To */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <User className="w-4 h-4" />
                      Assigned To
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                      <p className="text-sm text-slate-900 dark:text-white font-medium">
                        {typeof selectedAsset.assignedTo === 'object' && selectedAsset.assignedTo?.name 
                          ? selectedAsset.assignedTo.name 
                          : typeof selectedAsset.assignedTo === 'string' 
                          ? selectedAsset.assignedTo 
                          : 'Unassigned'}
                      </p>
                      {typeof selectedAsset.assignedTo === 'object' && selectedAsset.assignedTo?.email && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {selectedAsset.assignedTo.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <MapPin className="w-4 h-4" />
                      Location
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                      <p className="text-sm text-slate-900 dark:text-white font-medium">
                        {selectedAsset.location ? formatLocation(selectedAsset.location) : 'Location not specified'}
                      </p>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <Calendar className="w-4 h-4" />
                      Created
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                      <p className="text-sm text-slate-900 dark:text-white font-medium">
                        {selectedAsset.createdAt ? formatDate(selectedAsset.createdAt) : 'Date not available'}
                      </p>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <Clock className="w-4 h-4" />
                      Last Updated
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                      <p className="text-sm text-slate-900 dark:text-white font-medium">
                        {selectedAsset.updatedAt ? formatDate(selectedAsset.updatedAt) : 'Date not available'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                {selectedAsset.notes && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <FileText className="w-4 h-4" />
                      Notes
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                      <p className="text-sm text-slate-900 dark:text-white">
                        {selectedAsset.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-600">
                  <Button
                    variant="outline"
                    onClick={closeViewModal}
                    className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Close
                  </Button>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Asset
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function AssetsLogsPage() {
  return (
    <ReportProvider>
      <AssetsLogsContent />
    </ReportProvider>
  );
} 