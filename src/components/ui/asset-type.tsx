'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AssetProvider, useAssetContext } from '../../contexts/AdminAssetContext';
import { AssetType } from '../../lib/adminasset';
import { Button } from './button';
import { Input } from './input';
import { AssetTypeFormModal } from './asset-type-form-modal';
import { SuccessToast } from './success-toast';
import { ErrorDisplay } from './error-display';
import { EmptyState } from './empty-state';
import { useAuth } from '../../contexts/AuthContext';

// Asset Type Management Component
const AssetTypeManagement: React.FC = () => {
  const { state, fetchAssetTypes, createAssetType, updateAssetType, deleteAssetType, clearError } = useAssetContext();
  const { user } = useAuth();
  const router = useRouter();
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
      } catch {
        // Handle error silently or show user-friendly message
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
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {user?.projectName ? `Loading asset types for ${user.projectName}...` : 'Loading asset types...'}
          </h3>
          <p className="text-base text-muted-foreground">
            {user?.projectName 
              ? `Please wait while we fetch asset type data for project: ${user.projectName}`
              : 'Please wait while we fetch your asset type data'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Error Display */}
      <ErrorDisplay 
        error={state.error} 
        onClearError={clearError} 
      />

      {/* Search and Action Buttons Row */}
      <div className="mb-2 px-4 py-1 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              placeholder="Search asset types by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 text-base"
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={() => router.push('/admin/manageassets')}
            variant="outline"
            className="border-border hover:border-border/80 hover:bg-muted text-foreground flex items-center gap-2 transition-all duration-200 text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7" />
            </svg>
            Back to Assets
          </Button>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Asset Type
          </Button>
        </div>
      </div>

      {/* Asset Types Display */}
      {filteredAssetTypes.length === 0 ? (
        <EmptyState
          title={searchTerm ? 'No matching asset types' : 'No asset types found'}
          description={searchTerm 
            ? 'Try adjusting your search terms'
            : user?.projectName 
              ? `No asset types found for project: ${user.projectName}. Get started by creating your first asset type.`
              : 'Get started by creating your first asset type to define custom fields for your assets'
          }
          actionText={searchTerm ? 'Clear Search' : 'Create Your First Asset Type'}
          onAction={() => searchTerm ? setSearchTerm('') : setIsCreateModalOpen(true)}
          icon={
            <svg className="w-16 h-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
      ) : (
        <div className="bg-background rounded-lg shadow-sm overflow-hidden border border-border">
          <div className="overflow-x-auto bg-background">
            <table className="w-full border-collapse font-sans text-base min-w-[600px]">
              <thead>
                <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                  <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                    #
                  </th>
                  <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                    ASSET TYPE NAME
                  </th>
                  <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                    CREATED
                  </th>
                  <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssetTypes.map((assetType: AssetType, index: number) => (
                  <tr key={assetType._id} className="hover:bg-muted transition-colors">
                    <td className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-blue-800">
                      <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-blue-50 rounded-full text-xs sm:text-sm font-semibold text-blue-800">
                        {index + 1}
                      </div>
                    </td>
                    <td className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-blue-800">
                      {assetType.name}
                    </td>
                    <td className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-blue-600">
                      {new Date(assetType.createdAt).toLocaleDateString()}
                    </td>
                    <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center gap-1 sm:gap-2 justify-center">
                        <button 
                          className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center text-green-600 border border-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors shadow-sm"
                          onClick={() => handleEdit(assetType)}
                          title="Edit Asset Type"
                        >
                          <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center text-destructive border border-destructive rounded-lg hover:bg-destructive/10 transition-colors shadow-sm"
                          onClick={() => handleDelete(assetType._id)}
                          title="Delete Asset Type"
                        >
                          <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
const AssetTypesPage: React.FC = () => {
  return (
    <AssetProvider>
      <div className="min-h-screen bg-background transition-colors duration-200">
        <div className="p-0">
          <div className="max-w-7xl mx-auto">
            <AssetTypeManagement />
          </div>
        </div>
      </div>
    </AssetProvider>
  );
};

export default AssetTypesPage;
