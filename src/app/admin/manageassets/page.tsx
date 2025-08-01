'use client';

import React, { useEffect, useState } from 'react';
import { AssetProvider, useAssetContext } from '../../../contexts/AdminAssetContext';
import { Asset } from '../../../lib/adminasset';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Separator } from '../../../components/ui/separator';

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default';
      case 'inactive': return 'destructive';
      case 'maintenance': return 'secondary';
      case 'intialization': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Badge variant={getStatusVariant(status) as any} className="font-medium text-xs">
      {status}
    </Badge>
  );
};

// Priority Badge Component
const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const getPriorityVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <Badge variant={getPriorityVariant(priority) as any} className="font-medium text-xs">
      {priority}
    </Badge>
  );
};

// View Modal Component
const ViewModal: React.FC<{ asset: Asset | null; isOpen: boolean; onClose: () => void }> = ({ 
  asset, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen || !asset) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">{asset.tagId}</h2>
              <p className="text-sm text-gray-600">{asset.brand} {asset.model}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Status and Priority */}
            <div className="flex gap-3">
              <StatusBadge status={asset.status} />
              <PriorityBadge priority={asset.priority} />
            </div>

            {/* Asset Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Asset Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 font-medium text-sm">Asset Type:</span>
                      <span className="font-semibold text-sm">{asset.assetType} - {asset.subcategory}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 font-medium text-sm">Serial Number:</span>
                      <span className="font-semibold text-sm">{asset.serialNumber}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 font-medium text-sm">Capacity:</span>
                      <span className="font-semibold text-sm">{asset.capacity}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium text-sm">Year of Installation:</span>
                      <span className="font-semibold text-sm">{asset.yearOfInstallation}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Location Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 font-medium text-sm">Building:</span>
                      <span className="font-semibold text-sm">{asset.location.building}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 font-medium text-sm">Floor:</span>
                      <span className="font-semibold text-sm">{asset.location.floor}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium text-sm">Room:</span>
                      <span className="font-semibold text-sm">{asset.location.room}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Assigned Personnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 text-sm font-bold">
                        {asset.assignedTo.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{asset.assignedTo.name}</p>
                        <p className="text-xs text-gray-600">{asset.assignedTo.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {asset.tags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Asset Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {asset.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {asset.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Additional Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-md border">{asset.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <Separator />

            {/* Last Updated */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {new Date(asset.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => {
            // TODO: Implement edit functionality
            console.log('Edit asset:', asset);
            onClose();
          }}>
            Edit Asset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Mobile Asset Card Component
const MobileAssetCard: React.FC<{ asset: Asset; onView: (asset: Asset) => void; onEdit: (asset: Asset) => void; onDelete: (assetId: string) => void }> = ({ 
  asset, 
  onView,
  onEdit, 
  onDelete 
}) => {
  return (
    <Card className="mb-4 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold">{asset.tagId}</h3>
            </div>
            <p className="text-xs text-gray-600">{asset.brand} {asset.model}</p>
          </div>
          <div className="flex flex-col gap-2">
            <StatusBadge status={asset.status} />
            <PriorityBadge priority={asset.priority} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-gray-500 text-xs font-medium">Type</span>
            <p className="font-semibold text-xs">{asset.assetType}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-gray-500 text-xs font-medium">Serial</span>
            <p className="font-semibold text-xs">{asset.serialNumber}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-gray-500 text-xs font-medium">Assigned</span>
            <p className="font-semibold text-xs">{asset.assignedTo.name}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-gray-500 text-xs font-medium">Location</span>
            <p className="font-semibold text-xs">{asset.location.room}</p>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Updated: {new Date(asset.updatedAt).toLocaleDateString()}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onView(asset)}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Button>
            <Button size="sm" onClick={() => onEdit(asset)}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(asset._id)}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Assets List Component
const AssetsList: React.FC = () => {
  const { state, fetchAssets, deleteAsset, clearError } = useAssetContext();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []); // Removed dependency array to fix infinite re-render

  const handleDelete = async (assetId: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      await deleteAsset(assetId);
    }
  };

  const handleEdit = (asset: Asset) => {
    // TODO: Implement edit functionality
    console.log('Edit asset:', asset);
  };

  const handleView = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAsset(null);
  };

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-base font-medium text-gray-600">Loading your assets...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch the latest data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Asset Management</h1>
                <p className="text-sm text-gray-600">Manage and monitor all your facility assets efficiently</p>
              </div>
            </div>
          </div>
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all duration-200 transform hover:scale-105 px-6 py-2 text-sm font-semibold">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Asset
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="flex-1 font-medium text-red-700 text-sm">{state.error}</span>
            <Button variant="ghost" size="sm" onClick={clearError} className="text-red-500 hover:text-red-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* Assets Display */}
      {state.assets.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-16 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">No assets found</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            Get started by adding your first asset to the system.
          </p>
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Your First Asset
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Asset Overview</h3>
                <p className="text-gray-600 text-sm">Showing {state.assets.length} assets</p>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-bold text-gray-900 py-4 text-sm">Asset ID</TableHead>
                      <TableHead className="font-bold text-gray-900 py-4 text-sm">Brand & Model</TableHead>
                      <TableHead className="font-bold text-gray-900 py-4 text-sm">Assigned To</TableHead>
                      <TableHead className="font-bold text-gray-900 py-4 text-sm">Status</TableHead>
                      <TableHead className="font-bold text-gray-900 py-4 text-sm">Priority</TableHead>
                      <TableHead className="font-bold text-gray-900 py-4 text-sm text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.assets.map((asset, index) => (
                      <TableRow 
                        key={asset._id} 
                        className={`hover:bg-blue-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <TableCell className="font-semibold text-gray-900 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                            <span className="text-sm">{asset.tagId}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-sm font-semibold text-gray-900">{asset.brand} {asset.model}</div>
                          <div className="text-xs text-gray-500 mt-1">{asset.serialNumber}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-sm font-semibold text-gray-900">{asset.assignedTo.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{asset.assignedTo.email}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          <StatusBadge status={asset.status} />
                        </TableCell>
                        <TableCell className="py-4">
                          <PriorityBadge priority={asset.priority} />
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex justify-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleView(asset)}
                              className="h-8 w-8 p-0 hover:bg-blue-50"
                              title="View Details"
                            >
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleEdit(asset)}
                              className="h-8 w-8 p-0 hover:bg-green-50"
                              title="Edit Asset"
                            >
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDelete(asset._id)}
                              className="h-8 w-8 p-0 hover:bg-red-50"
                              title="Delete Asset"
                            >
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Asset Overview</h3>
              <p className="text-gray-600 text-sm">Showing {state.assets.length} assets</p>
            </div>
            {state.assets.map((asset) => (
              <MobileAssetCard
                key={asset._id}
                asset={asset}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      {/* View Modal */}
      <ViewModal
        asset={selectedAsset}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

// Main Page Component
const ManageAssetsPage: React.FC = () => {
  return (
    <AssetProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <AssetsList />
          </div>
        </div>
      </div>
    </AssetProvider>
  );
};

export default ManageAssetsPage;
