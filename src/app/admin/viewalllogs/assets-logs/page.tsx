'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { LoadingSpinner } from '../../../../components/ui/loading-spinner';
import { ErrorDisplay } from '../../../../components/ui/error-display';
import { EmptyState } from '../../../../components/ui/empty-state';
import { PageHeader } from '../../../../components/ui/page-header';
import { AssetTable } from '../../../../components/ui/asset-table';
import { AssetGrid } from '../../../../components/ui/asset-grid';
import { FilterBar } from '../../../../components/ui/filter-bar';
import { ViewModeToggle } from '../../../../components/ui/view-mode-toggle';
import { ExportButtons } from '../../../../components/ui/export-buttons';
import { AssetPDFDownload, AssetExcelDownload } from '../../../../components/ui/asset-pdf-download';
import { ReportProvider, useReportContext } from '../../../../contexts/ReportContext';
import { filterAssets } from '../../../../lib/Report';
import { SuccessToast } from '../../../../components/ui/success-toast';
import { 
  Download, 
  Activity,
  MapPin
} from 'lucide-react';

function AssetsLogsContent() {
  const { assets, loading, error, successMessage, clearError, clearSuccess } = useReportContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAssets = useMemo(() => {
    let filtered = filterAssets(assets, searchTerm, filterStatus, filterPriority, filterType);
    
    // Sort assets
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a];
      let bValue: any = b[sortBy as keyof typeof b];
      
      if (sortBy === 'updatedAt' || sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
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

  const handleViewDetails = (asset: any) => {
    // Handle asset details view
    console.log('View details for asset:', asset);
  };

  const handlePDFDownload = () => {
    console.log('PDF download initiated');
  };

  const handleExcelDownload = () => {
    console.log('Excel download initiated');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" text="Loading assets..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Error Display */}
          <ErrorDisplay 
            error={error} 
            onClearError={clearError} 
          />

          {/* Success Toast */}
          <SuccessToast
            message={successMessage || ''}
            isVisible={!!successMessage}
            onClose={clearSuccess}
            duration={4000}
          />

          {/* Enhanced Header */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Assets Logs</h1>
                    <p className="text-gray-600 mt-1">Track asset activity, changes, and maintenance history</p>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Enhanced Filter Bar */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <Activity className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <input
                      placeholder="Search assets, users, tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <select 
                      value={filterStatus} 
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="intialization">Initialization</option>
                    </select>

                    <select 
                      value={filterPriority} 
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    >
                      <option value="all">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>

                    <select 
                      value={filterType} 
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="equipment">Equipment</option>
                      <option value="Chiller">Chiller</option>
                      <option value="computer">Computer</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                    Clear
                  </button>
                  
                  <ViewModeToggle
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-4 items-center">
                  <span className="text-sm font-medium text-gray-600">Sort by:</span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  >
                    <option value="updatedAt">Last Updated</option>
                    <option value="createdAt">Created Date</option>
                    <option value="tagId">Tag ID</option>
                    <option value="brand">Brand</option>
                    <option value="assetType">Asset Type</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 flex items-center gap-2"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                    {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <AssetPDFDownload
                assets={filteredAssets}
                filename="assets-report.pdf"
                onDownload={handlePDFDownload}
              />
              <AssetExcelDownload
                assets={filteredAssets}
                filename="assets-report.xlsx"
                onDownload={handleExcelDownload}
              />
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {filteredAssets.length} of {assets.length} assets
            </div>
          </div>

          {/* Assets Display */}
          {filteredAssets.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No assets found</h3>
                <p className="text-gray-600 mb-4">No assets match your current filters</p>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200"
                >
                  Clear Filters
                </button>
              </CardContent>
            </Card>
          ) : viewMode === 'table' ? (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="text-xl font-bold">Asset Inventory</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {filteredAssets.length} of {assets.length} assets
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
            <AssetGrid
              assets={filteredAssets}
              onViewDetails={handleViewDetails}
            />
          )}
        </div>
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