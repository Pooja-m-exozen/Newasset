'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Activity,
  MapPin,
  Search,
  RefreshCw,
  FileText,
  BarChart3,
  Edit,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Building2,
  User,
  Building,
  Smartphone,
  Monitor,
  Server
} from 'lucide-react';

// API Base URL constant
const API_BASE_URL = 'http://192.168.0.5:5021/api';

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
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [viewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Fetch asset types from API
  const fetchAssetTypes = async () => {
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
  };

  // Fetch assets from API and filter by user's project
  const fetchProjectAssets = async () => {
    try {
      if (!user?.projectName) {
        throw new Error('User project not found. Please login again.');
      }

      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_BASE_URL}/assets`, {
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
      
      let allAssets: Asset[] = [];
      
      // Extract assets from response
      if (data.success && data.assets) {
        allAssets = data.assets;
      } else if (data.assets) {
        allAssets = data.assets;
      } else if (Array.isArray(data)) {
        allAssets = data;
      } else {
        const possibleAssets = data.data || data.items || data.results || [];
        if (Array.isArray(possibleAssets)) {
          allAssets = possibleAssets as Asset[];
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
  };

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
    
    let filtered = filterAssets(transformedAssets as Asset[], searchTerm, filterStatus, filterPriority, filterType);
    
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
  }, [projectAssets, searchTerm, filterStatus, filterPriority, filterType, selectedAssetType, sortBy, sortOrder]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterType('all');
    setSelectedAssetType('all');
    setSortBy('updatedAt');
    setSortOrder('desc');
  };

  // Sort functionality handled by the sortBy and sortOrder state variables
  // No need for separate handleSort function as sorting is controlled by the Select components

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
      active: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: XCircle },
      maintenance: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertCircle },
      intialization: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      medium: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      high: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
      critical: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low;
    
    return (
      <Badge className={`${config.color} px-2 py-1 rounded-full text-xs font-medium`}>
        {priority}
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
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3 font-medium text-sm text-muted-foreground">S.No</th>
              <th className="text-left p-3 font-medium text-sm text-muted-foreground">Asset Name</th>
              <th className="text-left p-3 font-medium text-sm text-muted-foreground">Asset Tag Number</th>
              <th className="text-left p-3 font-medium text-sm text-muted-foreground">Vendor Name</th>
              <th className="text-left p-3 font-medium text-sm text-muted-foreground">Asset Category</th>
              <th className="text-left p-3 font-medium text-sm text-muted-foreground">Location</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, index) => (
              <tr key={asset._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="p-3 text-sm text-muted-foreground">{index + 1}</td>
                <td className="p-3">
                  <div className="font-medium text-foreground">
                    {asset.brand} {asset.model || ''}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {asset.assetType}
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-mono text-sm text-foreground">
                    {asset.tagId || 'N/A'}
                  </div>
                  {asset.serialNumber && (
                    <div className="text-xs text-muted-foreground">
                      SN: {asset.serialNumber}
                    </div>
                  )}
                </td>
                <td className="p-3 text-sm text-foreground">
                  {/* Use customFields.Vendor Name if available, otherwise fallback to brand */}
                  {(() => {
                    const vendorName = asset.customFields?.['Vendor Name'];
                    return (typeof vendorName === 'string' ? vendorName : null) || asset.brand || 'N/A';
                  })()}
                </td>
                <td className="p-3">
                  <Badge variant="outline" className="text-xs">
                    {asset.assetType || 'Unknown'}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div className="text-sm text-foreground">
                      {formatLocation(asset.location)}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-background to-muted">
        <div className="flex-1 overflow-auto">
          <div className="flex items-center justify-center h-full">
        <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-muted-foreground">Loading assets logs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-muted">
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 sm:px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {selectedAssetType !== 'all' ? `${selectedAssetType} Assets` : 'Assets'} Logs
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Track {selectedAssetType !== 'all' ? selectedAssetType.toLowerCase() : 'asset'} activity, changes, and maintenance history for {user?.projectName || 'your project'}
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-3 sm:p-6 space-y-4 sm:space-y-6">
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

          {/* Project Info Banner */}
          {user?.projectName && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Building2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Currently viewing {selectedAssetType !== 'all' ? selectedAssetType.toLowerCase() : 'all'} assets for project: <span className="font-bold">{user.projectName}</span>
                  {selectedAssetType !== 'all' && (
                    <span className="ml-2 text-blue-600 dark:text-blue-400">
                      (Filtered by {selectedAssetType})
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col lg:flex-row gap-4 flex-1">
                  <div className="w-full max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search assets, users, tags, or descriptions..."
                        className="pl-10 h-11 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Asset Type Dropdown */}
                  <div className="w-full max-w-md">
                    <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
                      <SelectTrigger className="h-11 text-sm">
                        <SelectValue placeholder="Select Asset Type" />
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
                
                <Button
                  variant="outline"
                  onClick={fetchProjectAssets}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Assets
                </Button>
              </div>
                  
              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-border mt-6">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="intialization">Initialization</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="Chiller">Chiller</SelectItem>
                        <SelectItem value="computer">Computer</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="updatedAt">Last Updated</SelectItem>
                        <SelectItem value="createdAt">Created Date</SelectItem>
                        <SelectItem value="tagId">Tag ID</SelectItem>
                        <SelectItem value="brand">Brand</SelectItem>
                        <SelectItem value="assetType">Asset Type</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats and Export Section */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 p-6 bg-card/60 backdrop-blur-sm rounded-xl border border-border">
            <div className="flex items-center gap-4">
            
              <AssetPDFDownload
                assets={filteredAssets}
                filename={`${user?.projectName || 'project'}-${selectedAssetType !== 'all' ? selectedAssetType.toLowerCase() : 'all'}-asset-details.pdf`}
                selectedAssetType={selectedAssetType}
                onDownload={handlePDFDownload}
              />
              <AssetExcelDownload
                assets={filteredAssets}
                filename="assets-logs-report.xlsx"
                onDownload={handleExcelDownload}
              />
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                {filteredAssets.length} of {projectAssets.length} assets
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {projectAssets.length > 0 ? Math.round((filteredAssets.length / projectAssets.length) * 100) : 0}% filtered
              </div>
            </div>
          </div>

          {/* Assets Display */}
          {filteredAssets.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Activity className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">No assets found</h3>
                <p className="text-muted-foreground mb-6 text-lg max-w-md mx-auto">
                  {projectAssets.length === 0 
                    ? `No assets found for project: ${user?.projectName || 'your project'}`
                    : 'No assets match your current filters. Try adjusting your search criteria or clearing the filters.'
                  }
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={handleClearFilters}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Clear Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={fetchProjectAssets}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Assets
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : viewMode === 'table' ? (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Project Assets Inventory</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Detailed view of all tracked assets for {user?.projectName || 'your project'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-muted-foreground">
                      {filteredAssets.length} assets
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ProjectAssetsTable assets={filteredAssets} />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Asset Grid View</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Visual overview of all assets in card format
                      </p>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AssetGrid
                  assets={filteredAssets}
                  onViewDetails={handleViewDetails}
                />
              </CardContent>
            </Card>
          )}

          {/* Asset View Modal */}
          <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
            <DialogContent className="max-w-2xl bg-card border-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Asset Details
                </DialogTitle>
              </DialogHeader>
              
              {selectedAsset && (
                <div className="space-y-6">
                  {/* Asset Header */}
                  <div className="flex items-center gap-4 p-4 bg-card/50 rounded-lg border border-border">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                      {React.createElement(getAssetTypeIcon(selectedAsset.assetType || 'unknown'), {
                        className: "w-6 h-6 text-white"
                      })}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground">
                        {selectedAsset.tagId || 'Unknown Asset'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedAsset.assetType || 'Unknown Type'} • {selectedAsset.brand || 'Unknown Brand'}
                      </p>
                    </div>
                  </div>

                  {/* Asset Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Assigned To */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <User className="w-4 h-4" />
                        Assigned To
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg border border-border">
                        <p className="text-sm text-foreground font-medium">
                          {typeof selectedAsset.assignedTo === 'object' && selectedAsset.assignedTo?.name 
                            ? selectedAsset.assignedTo.name 
                            : typeof selectedAsset.assignedTo === 'string' 
                            ? selectedAsset.assignedTo 
                            : 'Unassigned'}
                        </p>
                        {typeof selectedAsset.assignedTo === 'object' && selectedAsset.assignedTo?.email && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedAsset.assignedTo.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        Location
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg border border-border">
                        <p className="text-sm text-foreground font-medium">
                          {selectedAsset.location ? formatLocation(selectedAsset.location) : 'Location not specified'}
                        </p>
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        Created
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg border border-border">
                        <p className="text-sm text-foreground font-medium">
                          {selectedAsset.createdAt ? formatDate(selectedAsset.createdAt) : 'Date not available'}
                        </p>
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Last Updated
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg border border-border">
                        <p className="text-sm text-foreground font-medium">
                          {selectedAsset.updatedAt ? formatDate(selectedAsset.updatedAt) : 'Date not available'}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Activity className="w-4 h-4" />
                        Status
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg border border-border">
                        {getStatusBadge(selectedAsset.status || 'active')}
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <AlertCircle className="w-4 h-4" />
                        Priority
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg border border-border">
                        {getPriorityBadge(selectedAsset.priority || 'medium')}
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {selectedAsset.notes && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        Notes
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg border border-border">
                        <p className="text-sm text-foreground">
                          {selectedAsset.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={closeViewModal}
                      className="text-foreground border-border hover:bg-accent"
                    >
                      Close
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Asset
                    </Button>
                  </div>
        </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
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