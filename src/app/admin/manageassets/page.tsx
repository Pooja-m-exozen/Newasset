
'use client';

import React, { useEffect, useState } from 'react';
import { AssetProvider, useAssetContext } from '../../../contexts/AdminAssetContext';
import { Asset } from '../../../lib/adminasset';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { AssetViewModal } from '../../../components/ui/asset-view-modal';

import { AssetFormModal } from '../../../components/ui/asset-form-modal';
import { SuccessToast } from '../../../components/ui/success-toast';
import { ErrorDisplay } from '../../../components/ui/error-display';
import { EmptyState } from '../../../components/ui/empty-state';
import { PermissionsUI } from '../../../components/ui/permissions-ui';

import { useToast, ToastContainer } from '../../../components/ui/toast';
import { useAuth } from '../../../contexts/AuthContext';
import { Package } from 'lucide-react';

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
const PermissionsDisplay: React.FC<{ onBackToAssets: () => void }> = ({ onBackToAssets }) => {
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
        onBackToAssets={onBackToAssets}
      />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};

// Main Assets List Component
const AssetsList: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
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
  const { user } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Fetch all assets - filtering will be done on the frontend
    console.log('Initial fetch for all assets - will filter by project on frontend');
    fetchAssets();
    fetchAssetTypes();
  }, [fetchAssets, fetchAssetTypes]);

  // Listen for custom event to open create asset modal
  useEffect(() => {
    const handleOpenCreateAssetModal = () => {
      setIsCreateModalOpen(true);
    };

    window.addEventListener('openCreateAssetModal', handleOpenCreateAssetModal);
    
    return () => {
      window.removeEventListener('openCreateAssetModal', handleOpenCreateAssetModal);
    };
  }, []);

  const handleDelete = async (assetId: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset(assetId);
        setSuccessMessage('Asset deleted successfully!');
        setShowSuccess(true);
      } catch {
        // Handle error silently or show user-friendly message
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
    // First filter by project name to show only assets for the current user's project
    const userProjectName = user?.projectName?.trim().toLowerCase();
    const assetProjectName = asset.project?.projectName?.trim().toLowerCase();
    
    // Only show assets from the same project as the logged-in user
    if (userProjectName && assetProjectName !== userProjectName) {
      return false;
    }
    
    // Then apply search filter
    return asset.tagId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           asset.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           asset.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pagination calculations
  const totalItems = filteredAssets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {user?.projectName ? `Loading assets for ${user.projectName}...` : 'Loading assets...'}
          </h3>
          <p className="text-muted-foreground">
            {user?.projectName 
              ? `Please wait while we fetch asset data for project: ${user.projectName}`
              : 'Please wait while we fetch your asset data'
            }
          </p>
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


      {/* Assets Display */}
      {filteredAssets.length === 0 ? (
        <EmptyState
          title={searchTerm ? 'No matching assets' : 'No assets found'}
          description={searchTerm 
            ? 'Try adjusting your search terms'
            : user?.projectName 
              ? `No assets found for project: ${user.projectName}. Get started by adding your first asset.`
            : 'Get started by adding your first asset to your facility'
          }
          actionText="Add First Asset"
          onAction={() => setIsCreateModalOpen(true)}
          icon={
            <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          }
        />
      ) : (
        <>
          {/* Responsive Table View */}
          <div className="block">
            <div className="bg-background rounded-lg shadow-sm overflow-hidden border border-border">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse font-sans text-base min-w-[800px]">
                  <thead>
                    <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        #
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        ASSET ID
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        TYPE & MODEL
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        MOBILITY
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        ASSIGNED TO
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        STATUS
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAssets.map((asset, index) => (
                      <tr key={asset._id || `asset-${index}`} className="hover:bg-muted transition-colors">
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-blue-800">
                          <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-blue-50 rounded-full text-xs sm:text-sm font-semibold text-blue-800">
                            {startIndex + index + 1}
                          </div>
                        </td>
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                          <span className="text-xs sm:text-sm font-medium text-primary cursor-pointer hover:underline">
                            {asset.tagId}
                          </span>
                        </td>
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1 sm:p-2 bg-blue-50 rounded-lg">
                              <svg className="w-3 h-3 sm:w-5 sm:h-5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-medium text-blue-800">
                                {asset.brand} {asset.model}
                              </div>
                              <div className="text-xs text-blue-600">
                                {asset.assetType || 'Unknown Type'}
                              </div>
                              {/* Sub-asset Summary */}
                              {asset.subAssetSummary && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {asset.subAssetSummary.totalSubAssets > 0 && (
                                    <span className="inline-flex items-center gap-1">
                                      <Package className="w-3 h-3" />
                                      {asset.subAssetSummary.totalSubAssets} sub-assets
                                      {asset.subAssetSummary.withTagIds > 0 && (
                                        <span className="text-blue-600">
                                          ({asset.subAssetSummary.withTagIds} with tag IDs)
                                        </span>
                                      )}
                                      {asset.subAssetSummary.withDigitalAssets > 0 && (
                                        <span className="text-green-600">
                                          ({asset.subAssetSummary.withDigitalAssets} with digital assets)
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                          <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-50 text-blue-800">
                            {asset.mobilityCategory || 'Not Set'}
                          </span>
                        </td>
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-50 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <span className="text-xs sm:text-sm text-blue-800">
                              {asset.assignedTo?.name || 'Unassigned'}
                            </span>
                          </div>
                        </td>
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                          <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                            {asset.status || 'Active'}
                          </span>
                        </td>
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex items-center gap-1 sm:gap-2 justify-center">
                            <button 
                              className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors shadow-sm"
                              onClick={() => handleView(asset)}
                              title="View Asset"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button 
                              className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-green-600 border border-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors shadow-sm"
                              onClick={() => handleEdit(asset)}
                              title="Edit Asset"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-destructive border border-destructive rounded-lg hover:bg-destructive/10 transition-colors shadow-sm"
                              onClick={() => asset._id && handleDelete(asset._id)}
                              title="Delete Asset"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Modern Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-background border-t border-border px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{startIndex + 1}-{Math.min(endIndex, totalItems)}</span> of <span className="font-semibold text-foreground">{totalItems}</span> assets
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0 border-border hover:border-primary text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0 border-border hover:border-primary text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`h-8 w-8 p-0 text-sm ${
                              currentPage === pageNum 
                                ? "bg-primary hover:bg-primary/90 text-primary-foreground border-primary" 
                                : "border-border hover:border-primary text-muted-foreground hover:text-primary"
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0 border-border hover:border-primary text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0 border-border hover:border-primary text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            )}
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
          // Debug: Log the form data being submitted
          console.log('Form data being submitted:', data);
          console.log('User project info:', user);
          
          // Transform AssetFormData to match Asset interface structure
          const transformedData: Partial<Asset> = {
            ...data,
            // Keep the project structure as is since it's already in the correct format
            project: data.project,
            assignedTo: data.assignedTo ? { _id: data.assignedTo, name: '', email: '' } : undefined,
            // Ensure customFields are included
            customFields: data.customFields || {},
            // Transform subAssets to match the expected SubAsset interface
            subAssets: data.subAssets ? {
              movable: data.subAssets.movable?.map(subAsset => ({
                ...subAsset,
                category: 'Movable' as const,
                inventory: {
                  consumables: [],
                  spareParts: [],
                  tools: [],
                  operationalSupply: []
                }
              })) || [],
              immovable: data.subAssets.immovable?.map(subAsset => ({
                ...subAsset,
                category: 'Immovable' as const,
                inventory: {
                  consumables: [],
                  spareParts: [],
                  tools: [],
                  operationalSupply: []
                }
              })) || []
            } : undefined
          };
          
          console.log('Transformed data for API:', transformedData);

          if (isCreateModalOpen) {
            try {
              // Create asset and get the response
              const createdAsset = await createAsset(transformedData);
              console.log('Asset created successfully:', createdAsset);
              
              // Refresh the assets list to show the newly created asset
              console.log('Refreshing all assets - will filter by project on frontend');
              await fetchAssets();
              
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
            } catch (error) {
              // Don't close the modal on error, let the user see the error
              throw error;
            }
          } else if (isEditModalOpen && editingAsset) {
            try {
              console.log('Updating asset with ID:', editingAsset._id);
              console.log('Sub-assets being sent to backend:', transformedData.subAssets);
              await updateAsset(editingAsset._id!, transformedData);
              
              // Refresh the assets list to show the updated asset
              console.log('Refreshing all assets - will filter by project on frontend');
              await fetchAssets();
              
              setIsEditModalOpen(false);
              setEditingAsset(null);
              handleUpdateSuccess();
            } catch (error) {
              throw error;
            }
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
  const [searchTerm, setSearchTerm] = useState('');

  if (showPermissions) {
    return (
      <AssetProvider>
        <div className="min-h-screen bg-background">
          <div className="p-0">
            <div className="max-w-7xl mx-auto">
              {/* Permissions Content */}
              <div className="mb-0">
                   </div>
              <PermissionsDisplay onBackToAssets={() => setShowPermissions(false)} />
            </div>
          </div>
        </div>
      </AssetProvider>
    );
  }

  return (
    <AssetProvider>
      <div className="min-h-screen bg-background transition-colors duration-200">
        <div className="p-0">
          <div className="max-w-7xl mx-auto">
            {/* Search and Action Buttons Row */}
            <div className="mb-2 px-4 py-1 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              {/* Search Input */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  <Input
                    placeholder="Search assets by ID, brand, model, or serial number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
                  />
                  </div>
                  </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                {/* <Button 
                  onClick={() => setShowPermissions(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                  Asset Permissions
                </Button> */}
                      </div>
                </div>

            {/* Assets Content */}
            <div className="bg-background rounded-lg shadow-sm">
                <div className="p-0">
                    <AssetsList searchTerm={searchTerm} />
                </div>
            </div>

          </div>
        </div>
      </div>
    </AssetProvider>
  );
};

export default ManageAssetsPage;
