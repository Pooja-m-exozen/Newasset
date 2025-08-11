'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { LoadingSpinner } from '../../../../components/ui/loading-spinner';
import { ErrorDisplay } from '../../../../components/ui/error-display';
import { AssetTable } from '../../../../components/ui/asset-table';
import { AssetGrid } from '../../../../components/ui/asset-grid';
import { AssetPDFDownload, AssetExcelDownload } from '../../../../components/ui/asset-pdf-download';
import { ReportProvider, useReportContext } from '../../../../contexts/ReportContext';
import { filterAssets } from '../../../../lib/Report';

// Define asset interface for type safety
interface Asset {
  _id?: string;
  tagId?: string;
  assetId?: string;
  assetType?: string;
  type?: string;
  brand?: string;
  status?: string;
  priority?: string;
  description?: string;
  location?: string | { building?: string; floor?: string; room?: string };
  assignedTo?: string | { name?: string; email?: string };
  userEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}
import { SuccessToast } from '../../../../components/ui/success-toast';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { 
  Activity,
  MapPin,
  Search,
  RefreshCw,
  FileText,
  BarChart3,
  Edit,
  Plus,
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

function AssetsLogsContent() {
  const { assets, loading, error, successMessage, clearError, clearSuccess } = useReportContext();
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

  const filteredAssets = useMemo(() => {
    const filtered = filterAssets(assets, searchTerm, filterStatus, filterPriority, filterType);
    
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
  }, [assets, searchTerm, filterStatus, filterPriority, filterType, sortBy, sortOrder]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterType('all');
    setSortBy('updatedAt');
    setSortOrder('desc');
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
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
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Assets Logs</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Track asset activity, changes, and maintenance history</p>
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

          {/* Search and Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
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
                filename="assets-logs-report.pdf"
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
                {filteredAssets.length} of {assets.length} assets
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {Math.round((filteredAssets.length / assets.length) * 100)}% filtered
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
                  No assets match your current filters. Try adjusting your search criteria or clearing the filters.
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
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Asset
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
                      <h2 className="text-xl font-bold text-foreground">Asset Inventory</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Detailed view of all tracked assets and their current status
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
                <AssetTable
                  assets={filteredAssets}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  onViewDetails={handleViewDetails}
                />
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
                      {React.createElement(getAssetTypeIcon(selectedAsset.assetType || selectedAsset.type || 'unknown'), {
                        className: "w-6 h-6 text-white"
                      })}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground">
                        {selectedAsset.tagId || selectedAsset.assetId || 'Unknown Asset'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedAsset.assetType || selectedAsset.type || 'Unknown Type'} • {selectedAsset.brand || 'Unknown Brand'}
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
                            : selectedAsset.userEmail || 'Unassigned'}
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
                  {selectedAsset.description && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        Description
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg border border-border">
                        <p className="text-sm text-foreground">
                          {selectedAsset.description}
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