'use client';

import React, { useEffect, useState } from 'react';
import { AssetProvider, useAssetContext } from '../../../contexts/AdminAssetContext';
import { Asset, AssetType,  } from '../../../lib/adminasset';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Input } from '../../../components/ui/input';
import { AssetCard } from '../../../components/ui/asset-card';
import { AssetViewModal } from '../../../components/ui/asset-view-modal';

import { AssetFormModal } from '../../../components/ui/asset-form-modal';
import { AssetTypeFormModal } from '../../../components/ui/asset-type-form-modal';
import { StatusBadge } from '../../../components/ui/status-badge';
import { PriorityBadge } from '../../../components/ui/priority-badge';
import { SuccessToast } from '../../../components/ui/success-toast';
import { ErrorDisplay } from '../../../components/ui/error-display';
import { EmptyState } from '../../../components/ui/empty-state';
import { PermissionsUI } from '../../../components/ui/permissions-ui';

import { useToast, ToastContainer } from '../../../components/ui/toast';

// Define the Permissions type to match what PermissionsUI expects
// interface PermissionCategory {
//   view?: boolean
//   create?: boolean
//   edit?: boolean
//   delete?: boolean
//   assign?: boolean
//   bulkOperations?: boolean
//   import?: boolean
//   export?: boolean
//   generate?: boolean
//   scan?: boolean
//   bulkGenerate?: boolean
//   download?: boolean
//   customize?: boolean
//   approve?: boolean
//   schedule?: boolean
//   complete?: boolean
//   audit?: boolean
//   report?: boolean
//   share?: boolean
//   assignRoles?: boolean
//   managePermissions?: boolean
//   configure?: boolean
//   backup?: boolean
//   restore?: boolean
//   monitor?: boolean
//   upload?: boolean
//   offline?: boolean
//   sync?: boolean
//   location?: boolean
//   camera?: boolean
//   notifications?: boolean
// }

// interface Permissions {
//   assetManagement: PermissionCategory
//   digitalAssets: PermissionCategory
//   maintenance: PermissionCategory
//   compliance: PermissionCategory
//   analytics: PermissionCategory
//   userManagement: PermissionCategory
//   systemAdmin: PermissionCategory
//   admin: PermissionCategory
//   locationManagement: PermissionCategory
//   documentManagement: PermissionCategory
//   financialManagement: PermissionCategory
//   workflowManagement: PermissionCategory
//   mobileFeatures: PermissionCategory
// }

// Permissions Display Component
const PermissionsDisplay: React.FC = () => {
  const { 
    state, 
    fetchAdminPermissions, 
    clearError 
  } = useAssetContext();
  const { toasts, removeToast } = useToast();

  useEffect(() => {
    // Fetch permissions when component mounts (only if not already loaded)
    if (!state.adminPermissions && !state.loading) {
      fetchAdminPermissions();
    }
  }, [state.adminPermissions, state.loading, fetchAdminPermissions]);

  return (
    <>
      <PermissionsUI
        loading={state.loading}
        error={state.error}
        onClearError={clearError}
        bearerToken={localStorage.getItem('authToken') || undefined}
        role="viewer"
      />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};

// Main Assets List Component
const AssetsList: React.FC = () => {
  const { 
    state, 
    fetchAssets, 
    createAsset, 
    updateAsset, 
    deleteAsset, 
    fetchAssetTypes, 
    clearError,
    updateAssetInState
  } = useAssetContext();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
      fetchAssets();
    fetchAssetTypes();
  }, [fetchAssets, fetchAssetTypes]);

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

  const handleAssetUpdated = (updatedAsset: Asset) => {
    // Update the asset in the state
    updateAssetInState(updatedAsset);
    
    // Update the selected asset if it's the one being viewed
    if (selectedAsset?._id === updatedAsset._id) {
      setSelectedAsset(updatedAsset);
    }
    
    // Show success message
    setSuccessMessage('Asset updated successfully!');
    setShowSuccess(true);
  };



  const handleCreateSuccess = () => {
    setSuccessMessage('Asset created successfully!');
    setShowSuccess(true);
  };

  const handleUpdateSuccess = () => {
    setSuccessMessage('Asset updated successfully!');
    setShowSuccess(true);
  };



  const filteredAssets = state.assets.filter(asset => {
    const matchesSearch = asset.tagId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        asset.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        asset.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Loading assets...</h3>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch your asset data</p>
        </div>
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
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Asset Management</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Manage and track all facility assets</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Asset
          </Button>
        </div>



        {/* Search and Filter Section */}
        <div className="mt-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              placeholder="Search assets by ID, brand, model, or serial number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Retired">Retired</option>
            </select>
            {(searchTerm || filterStatus !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredAssets.length} of {state.assets.length} assets
        </div>
      </div>

      {/* Assets Display */}
      {filteredAssets.length === 0 ? (
        <EmptyState
          title={searchTerm || filterStatus !== 'all' ? 'No matching assets' : 'No assets found'}
          description={searchTerm || filterStatus !== 'all' 
            ? 'Try adjusting your search or filters'
            : 'Get started by adding your first asset to your facility'
          }
          actionText="Add First Asset"
          onAction={() => setIsCreateModalOpen(true)}
          icon={
            <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          }
        />
      ) : (
        <>
          {/* Enhanced Desktop Table View */}
          <div className="hidden lg:block">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <TableHead className="font-bold text-gray-900 dark:text-white py-4 text-sm px-6">Asset ID</TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-white py-4 text-sm px-6">Brand & Model</TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-white py-4 text-sm px-6">Assigned To</TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-white py-4 text-sm px-6">Status</TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-white py-4 text-sm px-6">Priority</TableHead>
                      <TableHead className="font-bold text-gray-900 dark:text-white py-4 text-sm text-center px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map((asset, index) => {
                      const getStatusBackground = (status: string) => {
                        switch (status?.toLowerCase()) {
                          case 'maintenance':
                            return 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30';
                          case 'inactive':
                            return 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30';
                          case 'retired':
                            return 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700';
                          default:
                            return index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800';
                        }
                      };

                      return (
                        <TableRow 
                          key={asset._id || `asset-${index}`} 
                          className={`${getStatusBackground(asset.status || '')} transition-all duration-200 border-b border-gray-100 dark:border-gray-700`}
                        >
                        <TableCell className="font-semibold text-gray-900 dark:text-white py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center shadow-sm">
                              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{asset.tagId}</span>
                              {asset.digitalAssets?.qrCode && (
                                <div className="w-2 h-2 bg-green-500 rounded-full" title="Has QR Code"></div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{asset.brand} {asset.model}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{asset.serialNumber}</div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{asset.assignedTo?.name || 'Unassigned'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{asset.assignedTo?.email || 'N/A'}</div>
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
                              className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-sm transition-all duration-200"
                              title="View Details"
                            >
                              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleEdit(asset)}
                              className="h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-900/20 hover:shadow-sm transition-all duration-200"
                              title="Edit Asset"
                            >
                              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>

                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => asset._id && handleDelete(asset._id)}
                              className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-sm transition-all duration-200"
                              title="Delete Asset"
                            >
                              <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Enhanced Mobile Card View */}
          <div className="lg:hidden">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Asset Overview</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Showing {filteredAssets.length} assets</p>
            </div>
            {filteredAssets.map((asset, index) => (
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
        onAssetUpdated={handleAssetUpdated}
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
          // Transform AssetFormData to match Asset interface structure
          const transformedData: Partial<Asset> = {
            ...data,
            assignedTo: data.assignedTo ? { _id: data.assignedTo, name: '', email: '' } : undefined
          };

          if (isCreateModalOpen) {
            // Create asset and get the response
            const createdAsset = await createAsset(transformedData);
            
            // If the asset has a digital tag type of QR, don't close the modal yet
            // The asset form modal will handle showing the QR generation interface
            if (data.digitalTagType === 'qr' && createdAsset) {
              console.log('Asset created successfully, ready for QR generation:', createdAsset);
              // Return the created asset so the modal can show QR generation
              return createdAsset;
            } else {
              // For non-QR assets, close the modal and show success message
              setIsCreateModalOpen(false);
              handleCreateSuccess();
            }
          } else if (isEditModalOpen && editingAsset) {
            await updateAsset(editingAsset._id!, transformedData);
            setIsEditModalOpen(false);
            setEditingAsset(null);
            handleUpdateSuccess();
          }
        }}
        loading={state.loading}
      />



      {/* Success Toast */}
      {showSuccess && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccess(false)}
        />
      )}
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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Only fetch if not already loading and no asset types loaded
    if (!state.loading && state.assetTypes.length === 0) {
      fetchAssetTypes();
    }
  }, [state.loading, state.assetTypes.length, fetchAssetTypes]);

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

  const filteredAssetTypes = state.assetTypes.filter(assetType => {
    const matchesSearch = assetType.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Loading asset types...</h3>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch your asset type data</p>
        </div>
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
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Asset Type Management</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Define and manage asset types for your facility</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 text-white hover:from-green-700 hover:to-green-800 dark:hover:from-green-800 dark:hover:to-green-900 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Asset Type
          </Button>
        </div>

        {/* Search and Filter Section */}
        <div className="mt-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              placeholder="Search asset types by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          {searchTerm && (
            <Button
              variant="outline"
              onClick={() => setSearchTerm('')}
              className="border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredAssetTypes.length} of {state.assetTypes.length} asset types
        </div>
      </div>

      {/* Asset Types Display */}
      {filteredAssetTypes.length === 0 ? (
        <EmptyState
          title={searchTerm ? 'No matching asset types' : 'No asset types found'}
          description={searchTerm 
            ? 'Try adjusting your search terms'
            : 'Get started by creating your first asset type to define custom fields for your assets'
          }
          actionText={searchTerm ? 'Clear Search' : 'Create Your First Asset Type'}
          onAction={() => searchTerm ? setSearchTerm('') : setIsCreateModalOpen(true)}
          icon={
            <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Asset Types Overview</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Showing {filteredAssetTypes.length} asset types</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <TableHead className="font-bold text-gray-900 dark:text-white py-4 text-sm px-6">Asset Type Name</TableHead>
                  <TableHead className="font-bold text-gray-900 dark:text-white py-4 text-sm px-6">Created</TableHead>
                  <TableHead className="font-bold text-gray-900 dark:text-white py-4 text-sm text-center px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssetTypes.map((assetType: AssetType, index: number) => (
                  <TableRow 
                    key={assetType._id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}`}
                  >
                    <TableCell className="font-semibold text-gray-900 dark:text-white py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium">{assetType.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(assetType.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex justify-center space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(assetType)}
                          className="h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-900/20 hover:shadow-sm transition-all duration-200"
                          title="Edit Asset Type"
                        >
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDelete(assetType._id)}
                          className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-sm transition-all duration-200"
                          title="Delete Asset Type"
                        >
                          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          // Transform the data to match CreateAssetTypeRequest format
          const transformedData = {
            name: data.name,
            fields: data.fields.map(field => ({
              label: field.label,
              fieldType: field.fieldType as 'text' | 'dropdown',
              options: field.fieldType === 'dropdown' ? (field.options || []) : undefined
            }))
          };
          
          if (isCreateModalOpen) {
            await createAssetType(transformedData);
            setIsCreateModalOpen(false);
            handleCreateSuccess();
          } else if (isEditModalOpen && editingAssetType) {
            await updateAssetType(editingAssetType._id, transformedData);
            setIsEditModalOpen(false);
            setEditingAssetType(null);
            handleUpdateSuccess();
          }
        }}
        loading={state.loading}
      />

      {/* Success Toast */}
      {showSuccess && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
  );
};

// Main Page Component
const ManageAssetsPage: React.FC = () => {
  const [showPermissions, setShowPermissions] = useState(false);

  if (showPermissions) {
    return (
      <AssetProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Enhanced Header with better visual hierarchy */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                                 <div className="flex items-center gap-4">
                 <div className="relative">
                   <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                     <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                     </svg>
                   </div>
                   <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 dark:bg-green-400 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                     <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                     </svg>
                   </div>
                 </div>
                 <div>
                   <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                     Admin Permissions
                   </h1>
                   <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">Manage system-wide permissions and access controls</p>
                   <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                       <span>Last updated: {new Date().toLocaleDateString()}</span>
                     </div>
                     <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                       </svg>
                       <span>Active</span>
                     </div>
                   </div>
                 </div>
               </div>
                  <Button 
                    onClick={() => setShowPermissions(false)}
                    variant="outline"
                    className="flex items-center gap-2 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 shadow-sm text-sm"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Assets
                  </Button>
                </div>
                {/* Enhanced breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span className="hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors">Asset Management</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Permissions</span>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header with modern design */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      Asset Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Manage your assets and configurations with ease</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowPermissions(true)}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 text-white hover:from-purple-700 hover:to-purple-800 dark:hover:from-purple-800 dark:hover:to-purple-900 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Asset Permissions
                </Button>
              </div>
            </div>

            {/* Enhanced Tabs with better styling */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <Tabs defaultValue="assets" className="w-full">
                <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <TabsList className="grid w-full grid-cols-2 h-16 bg-transparent border-0">
                    <TabsTrigger 
                      value="assets" 
                      className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm rounded-none border-0 h-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-all duration-200"
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
                      className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 data-[state=active]:shadow-sm rounded-none border-0 h-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-all duration-200"
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