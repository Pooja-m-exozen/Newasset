'use client';

import React, { useEffect, useState } from 'react';
import { AssetProvider, useAssetContext } from '../../../contexts/AdminAssetContext';
import { Asset, AssetType } from '../../../lib/adminasset';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { AssetCard } from '../../../components/ui/asset-card';
import { AssetViewModal } from '../../../components/ui/asset-view-modal';
import { AssetFormModal } from '../../../components/ui/asset-form-modal';
import { AssetTypeFormModal } from '../../../components/ui/asset-type-form-modal';
import { DeleteConfirmationDialog } from '../../../components/ui/delete-confirmation-dialog';
import { StatusBadge } from '../../../components/ui/status-badge';
import { PriorityBadge } from '../../../components/ui/priority-badge';
import { SuccessToast } from '../../../components/ui/success-toast';
import { LoadingSpinner } from '../../../components/ui/loading-spinner';
import { ErrorDisplay } from '../../../components/ui/error-display';
import { EmptyState } from '../../../components/ui/empty-state';
import { PageHeader } from '../../../components/ui/page-header';
import { PermissionsUI } from './permissions/assets/admin/PermissionsUI';
import { useToast, ToastContainer } from '../../../components/ui/toast';

// Permissions Display Component
const PermissionsDisplay: React.FC = () => {
  const { 
    state, 
    fetchAdminPermissions, 
    refreshAdminPermissions,
    updateAdminPermissions, 
    clearError 
  } = useAssetContext();
  const { addToast, toasts, removeToast } = useToast();

  useEffect(() => {
    // Fetch permissions when component mounts (only if not already loaded)
    if (!state.adminPermissions && !state.loading) {
      fetchAdminPermissions();
    }
  }, [state.adminPermissions, state.loading]);

  // Add a refetch function for better error handling
  const handleRefetch = () => {
    refreshAdminPermissions();
  };

  const handleUpdatePermissions = async (permissions: any) => {
    try {
      await updateAdminPermissions(permissions);
      addToast({
        type: "success",
        title: "Success",
        message: "Permissions updated successfully on server",
      });
    } catch (error) {
      console.error('Error updating permissions:', error);
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to update permissions. Please check your connection and try again.",
      });
    }
  };

  return (
    <>
      <PermissionsUI
        permissions={state.adminPermissions}
        loading={state.loading}
        error={state.error}
        onUpdatePermissions={handleUpdatePermissions}
        onClearError={clearError}
      />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};

// Create Asset Type Modal Component - Now using AssetTypeFormModal from @ui/asset-type-form-modal
// const CreateAssetTypeModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess?: () => void }> = ({ 
//   isOpen, 
//   onClose,
//   onSuccess
// }) => {
//   // ... old implementation removed - now using AssetTypeFormModal component
// };

// Edit Asset Type Modal Component - Now using AssetTypeFormModal from @ui/asset-type-form-modal
// const EditAssetTypeModal: React.FC<{ isOpen: boolean; onClose: () => void; assetType: AssetType; onSuccess?: () => void }> = ({ 
//   isOpen, 
//   onClose, 
//   assetType,
//   onSuccess
// }) => {
//   // ... old implementation removed - now using AssetTypeFormModal component
// };

// Mobile Asset Card Component - Now using AssetCard from @ui/asset-card
// const MobileAssetCard: React.FC<{ asset: Asset; onView: (asset: Asset) => void; onEdit: (asset: Asset) => void; onDelete: (assetId: string) => void }> = ({ 
//   asset, 
//   onView,
//   onEdit, 
//   onDelete 
// }) => {
//   // ... old implementation removed - now using AssetCard component
// };

// Main Assets List Component
const AssetsList: React.FC = () => {
  const { 
    state, 
    fetchAssets, 
    createAsset, 
    updateAsset, 
    deleteAsset, 
    fetchAssetTypes, 
    clearError 
  } = useAssetContext();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
      fetchAssets();
    fetchAssetTypes();
  }, []);

  const handleDelete = async (assetId: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
      await deleteAsset(assetId);
        setSuccessMessage('Asset deleted successfully!');
        setShowSuccess(true);
      } catch (error) {
        console.error('Error deleting asset:', error);
      }
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsEditModalOpen(true);
  };

  const handleView = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAsset(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingAsset(null);
  };

  const handleCreateSuccess = () => {
    setSuccessMessage('Asset created successfully!');
    setShowSuccess(true);
  };

  const handleUpdateSuccess = () => {
    setSuccessMessage('Asset updated successfully!');
    setShowSuccess(true);
  };

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" text="Loading assets..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      <ErrorDisplay 
        error={state.error} 
        onClearError={clearError} 
      />

      {/* Enhanced Header Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Asset Overview</h2>
              <p className="text-gray-600 text-sm">Showing {state.assets.length} assets in your facility</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Asset
          </Button>
        </div>
      </div>

      {/* Assets Display */}
      {state.assets.length === 0 ? (
        <EmptyState
          title="No assets found"
          description="Get started by adding your first asset to your facility"
          actionText="Add First Asset"
          onAction={() => setIsCreateModalOpen(true)}
          icon={
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          }
        />
      ) : (
        <>
          {/* Enhanced Desktop Table View */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:bg-gray-100 border-b border-gray-200">
                      <TableHead className="font-bold text-gray-900 py-4 text-sm px-6">Asset ID</TableHead>
                      <TableHead className="font-bold text-gray-900 py-4 text-sm px-6">Brand & Model</TableHead>
                      <TableHead className="font-bold text-gray-900 py-4 text-sm px-6">Assigned To</TableHead>
                      <TableHead className="font-bold text-gray-900 py-4 text-sm px-6">Status</TableHead>
                      <TableHead className="font-bold text-gray-900 py-4 text-sm px-6">Priority</TableHead>
                      <TableHead className="font-bold text-gray-900 py-4 text-sm text-center px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.assets.map((asset, index) => (
                      <TableRow 
                        key={asset._id || `asset-${index}`} 
                        className={`hover:bg-blue-50 transition-all duration-200 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <TableCell className="font-semibold text-gray-900 py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center shadow-sm">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium">{asset.tagId}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-sm font-semibold text-gray-900">{asset.brand} {asset.model}</div>
                          <div className="text-xs text-gray-500 mt-1">{asset.serialNumber}</div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-sm font-semibold text-gray-900">{asset.assignedTo?.name || 'Unassigned'}</div>
                          <div className="text-xs text-gray-500 mt-1">{asset.assignedTo?.email || 'N/A'}</div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <StatusBadge status={asset.status || 'Active'} />
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <PriorityBadge priority={asset.priority || 'Medium'} />
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex justify-center space-x-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleView(asset)}
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:shadow-sm transition-all duration-200"
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
                              className="h-8 w-8 p-0 hover:bg-green-50 hover:shadow-sm transition-all duration-200"
                              title="Edit Asset"
                            >
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => asset._id && handleDelete(asset._id)}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:shadow-sm transition-all duration-200"
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

          {/* Enhanced Mobile Card View */}
          <div className="lg:hidden">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Asset Overview</h3>
              <p className="text-gray-600 text-sm">Showing {state.assets.length} assets</p>
            </div>
            {state.assets.map((asset, index) => (
              <AssetCard
                key={asset._id || `asset-${index}`}
                asset={asset}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                className="mb-4"
              />
            ))}
          </div>
        </>
      )}

      {/* View Modal */}
      <AssetViewModal
        asset={selectedAsset}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

      {/* Create/Edit Asset Modal */}
      <AssetFormModal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setEditingAsset(null);
        }}
        mode={isCreateModalOpen ? 'create' : 'edit'}
          asset={editingAsset}
        assetTypes={state.assetTypes}
        onSubmit={async (data) => {
          if (isCreateModalOpen) {
            await createAsset(data);
            setIsCreateModalOpen(false);
            handleCreateSuccess();
          } else if (isEditModalOpen && editingAsset) {
            await updateAsset(editingAsset._id!, data);
            setIsEditModalOpen(false);
            setEditingAsset(null);
            handleUpdateSuccess();
          }
        }}
        loading={state.loading}
      />

      {/* Success Toast */}
      <SuccessToast
        message={successMessage}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
};

// Asset Type Management Component
const AssetTypeManagement: React.FC = () => {
  const { state, fetchAssetTypes, createAssetType, updateAssetType, deleteAssetType, clearError } = useAssetContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAssetType, setEditingAssetType] = useState<AssetType | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Only fetch if not already loading and no asset types loaded
    if (!state.loading && state.assetTypes.length === 0) {
      fetchAssetTypes();
    }
  }, [state.loading, state.assetTypes.length]);

  const handleEdit = (assetType: AssetType) => {
    setEditingAssetType(assetType);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (assetTypeId: string) => {
    if (window.confirm('Are you sure you want to delete this asset type? This action cannot be undone.')) {
      try {
        await deleteAssetType(assetTypeId);
        setSuccessMessage('Asset type deleted successfully!');
        setShowSuccess(true);
      } catch (error) {
        console.error('Error deleting asset type:', error);
      }
    }
  };

  const handleCreateSuccess = () => {
    setSuccessMessage('Asset type created successfully!');
    setShowSuccess(true);
  };

  const handleUpdateSuccess = () => {
    setSuccessMessage('Asset type updated successfully!');
    setShowSuccess(true);
  };

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" text="Loading asset types..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      <ErrorDisplay 
        error={state.error} 
        onClearError={clearError} 
      />

      {/* Enhanced Header Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Asset Type Management</h2>
              <p className="text-gray-600 text-sm">Define and manage asset types for your facility</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Asset Type
          </Button>
        </div>
      </div>

      {/* Asset Types Display */}
      {state.assetTypes.length === 0 ? (
        <EmptyState
          title="No asset types found"
          description="Get started by creating your first asset type to define custom fields for your assets"
          actionText="Create Your First Asset Type"
          onAction={() => setIsCreateModalOpen(true)}
          icon={
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-green-50 to-green-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Asset Types Overview</h3>
            <p className="text-gray-600 text-sm">Showing {state.assetTypes.length} asset types</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:bg-gray-100 border-b border-gray-200">
                  <TableHead className="font-bold text-gray-900 py-4 text-sm px-6">Asset Type Name</TableHead>
                  <TableHead className="font-bold text-gray-900 py-4 text-sm px-6">Fields</TableHead>
                  <TableHead className="font-bold text-gray-900 py-4 text-sm px-6">Created</TableHead>
                  <TableHead className="font-bold text-gray-900 py-4 text-sm text-center px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.assetTypes.map((assetType: AssetType, index: number) => (
                  <TableRow 
                    key={assetType._id} 
                    className={`hover:bg-green-50 transition-all duration-200 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <TableCell className="font-semibold text-gray-900 py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium">{assetType.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {assetType.fields.map((field: any, fieldIndex: number) => (
                          <Badge key={fieldIndex} variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                            {field.label} ({field.fieldType})
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="text-sm text-gray-600">
                        {new Date(assetType.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex justify-center space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(assetType)}
                          className="h-8 w-8 p-0 hover:bg-green-50 hover:shadow-sm transition-all duration-200"
                          title="Edit Asset Type"
                        >
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDelete(assetType._id)}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:shadow-sm transition-all duration-200"
                          title="Delete Asset Type"
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
      )}

      {/* Create/Edit Asset Type Modal */}
      <AssetTypeFormModal
        isOpen={isCreateModalOpen || isEditModalOpen}
          onClose={() => {
          setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setEditingAssetType(null);
          }}
        mode={isCreateModalOpen ? 'create' : 'edit'}
          assetType={editingAssetType}
        onSubmit={async (data) => {
          if (isCreateModalOpen) {
            await createAssetType(data);
            setIsCreateModalOpen(false);
            handleCreateSuccess();
          } else if (isEditModalOpen && editingAssetType) {
            await updateAssetType(editingAssetType._id, data);
            setIsEditModalOpen(false);
            setEditingAssetType(null);
            handleUpdateSuccess();
          }
        }}
        loading={state.loading}
      />

      {/* Success Toast */}
      <SuccessToast
        message={successMessage}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
};

// Main Page Component
const ManageAssetsPage: React.FC = () => {
  const [showPermissions, setShowPermissions] = useState(false);

  if (showPermissions) {
    return (
      <AssetProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Enhanced Header with better visual hierarchy */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Admin Permissions
                      </h1>
                      <p className="text-gray-600 mt-1">Manage system-wide permissions and access controls</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowPermissions(false)}
                    variant="outline"
                    className="flex items-center gap-2 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Assets
                  </Button>
                </div>
                {/* Enhanced breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <span className="hover:text-gray-700 cursor-pointer">Asset Management</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-medium text-gray-700">Permissions</span>
                </div>
              </div>
              <PermissionsDisplay />
            </div>
          </div>
        </div>
      </AssetProvider>
    );
  }

  return (
    <AssetProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header with modern design */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Asset Management
                    </h1>
                    <p className="text-gray-600 mt-1">Manage your assets and configurations with ease</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowPermissions(true)}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Asset Permissions
                </Button>
              </div>
              
              {/* Enhanced stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Assets</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Asset Types</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Assets</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Tabs with better styling */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <Tabs defaultValue="assets" className="w-full">
                <div className="border-b border-gray-200 bg-gray-50">
                  <TabsList className="grid w-full grid-cols-2 h-16 bg-transparent border-0">
                    <TabsTrigger 
                      value="assets" 
                      className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-none border-0 h-full text-gray-600 hover:text-gray-900 transition-all duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        Assets
                      </div>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="asset-types" 
                      className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm rounded-none border-0 h-full text-gray-600 hover:text-gray-900 transition-all duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Asset Types
                      </div>
                    </TabsTrigger>
                  </TabsList>
                </div>
                <div className="p-6">
                  <TabsContent value="assets" className="mt-0">
                    <AssetsList />
                  </TabsContent>
                  <TabsContent value="asset-types" className="mt-0">
                    <AssetTypeManagement />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </AssetProvider>
  );
};

export default ManageAssetsPage;