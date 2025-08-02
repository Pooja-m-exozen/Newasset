'use client';

import React, { useEffect, useState } from 'react';
import { AssetProvider, useAssetContext } from '../../../contexts/AdminAssetContext';
import { Asset, AssetType } from '../../../lib/adminasset';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Separator } from '../../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
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
              <StatusBadge status={asset.status || 'Active'} />
              <PriorityBadge priority={asset.priority || 'Medium'} />
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
                      <span className="font-semibold text-sm">{asset.assetType} - {asset.subcategory || 'N/A'}</span>
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
                    {asset.assignedTo ? (
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 text-sm font-bold">
                        {asset.assignedTo.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{asset.assignedTo.name}</p>
                        <p className="text-xs text-gray-600">{asset.assignedTo.email}</p>
                      </div>
                    </div>
                    ) : (
                      <p className="text-sm text-gray-500">No assignment</p>
                    )}
                  </CardContent>
                </Card>

                {asset.tags && asset.tags.length > 0 && (
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
              Last updated: {asset.updatedAt ? new Date(asset.updatedAt).toLocaleDateString() : 'N/A'}
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

// Create Asset Modal Component
const CreateAssetModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess?: () => void }> = ({ 
  isOpen, 
  onClose,
  onSuccess
}) => {
  const { createAsset, fetchAssetTypes, state } = useAssetContext();
  const [formData, setFormData] = useState({
    tagId: '',
    assetType: '',
    subcategory: '',
    brand: '',
    model: '',
    serialNumber: '',
    capacity: '',
    yearOfInstallation: '',
    projectName: '',
    priority: '',
    digitalTagType: '',
    tags: [] as string[],
    notes: '',
    location: {
      building: '',
      floor: '',
      room: '',
      latitude: '',
      longitude: ''
    },
    photos: [] as File[]
  });

  // Fetch asset types when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAssetTypes();
    }
  }, [isOpen, fetchAssetTypes]);

  // Reset brand and capacity when asset type changes
  useEffect(() => {
    if (formData.assetType) {
      setFormData(prev => ({
        ...prev,
        brand: '',
        capacity: ''
      }));
    }
  }, [formData.assetType]);

  // Get selected asset type and its fields
  const selectedAssetType = state.assetTypes.find(type => type.name === formData.assetType);
  const brandField = selectedAssetType?.fields.find(field => field.label === 'Brand');
  const capacityField = selectedAssetType?.fields.find(field => field.label === 'Capacity');

  const handleInputChange = (field: string, value: string | string[]) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create JSON object for asset data
      const assetData = {
        tagId: formData.tagId,
        assetType: formData.assetType,
        subcategory: formData.subcategory,
        brand: formData.brand,
        model: formData.model,
        serialNumber: formData.serialNumber,
        capacity: formData.capacity,
        yearOfInstallation: formData.yearOfInstallation,
        projectName: formData.projectName,
        priority: formData.priority,
        digitalTagType: formData.digitalTagType,
        tags: formData.tags,
        notes: formData.notes,
        location: {
          building: formData.location.building,
          floor: formData.location.floor,
          room: formData.location.room,
          latitude: formData.location.latitude,
          longitude: formData.location.longitude
        }
      };
      
      await createAsset(assetData);
      onClose();
      // Reset form
      setFormData({
        tagId: '',
        assetType: '',
        subcategory: '',
        brand: '',
        model: '',
        serialNumber: '',
        capacity: '',
        yearOfInstallation: '',
        projectName: '',
        priority: '',
        digitalTagType: '',
        tags: [] as string[],
        notes: '',
        location: {
          building: '',
          floor: '',
          room: '',
          latitude: '',
          longitude: ''
        },
        photos: [] as File[]
      });
      onSuccess?.();
    } catch (error) {
      console.error('Error creating asset:', error);
      // Error will be handled by the context and displayed in the main component
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Create New Asset</h2>
              <p className="text-sm text-gray-600">Add a new asset to your facility</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Asset Tag ID *</label>
                  <Input
                    value={formData.tagId}
                    onChange={(e) => handleInputChange('tagId', e.target.value)}
                    placeholder="e.g., ASSET099000"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Asset Type *</label>
                  <select
                    value={formData.assetType}
                    onChange={(e) => handleInputChange('assetType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={state.loading}
                  >
                    <option value="">Select Asset Type</option>
                    {state.loading ? (
                      <option value="" disabled>Loading asset types...</option>
                    ) : (
                      state.assetTypes.map((type) => (
                        <option key={type._id} value={type.name}>
                          {type.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Subcategory</label>
                  <Input
                    value={formData.subcategory}
                    onChange={(e) => handleInputChange('subcategory', e.target.value)}
                    placeholder="e.g., computer"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Brand *</label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="e.g., Dell"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Model</label>
                  <Input
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="e.g., OptiPlex 7090"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Serial Number</label>
                  <Input
                    value={formData.serialNumber}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    placeholder="e.g., SN123456788888"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Capacity</label>
                  <Input
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    placeholder="e.g., 16GB RAM, 512GB SSD"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Year of Installation</label>
                  <Input
                    value={formData.yearOfInstallation}
                    onChange={(e) => handleInputChange('yearOfInstallation', e.target.value)}
                    placeholder="e.g., 2023"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Digital Tag Type</label>
                  <select
                    value={formData.digitalTagType}
                    onChange={(e) => handleInputChange('digitalTagType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Tag Type</option>
                    <option value="qr">QR Code</option>
                    <option value="barcode">Barcode</option>
                    <option value="rfid">RFID</option>
                    <option value="nfc">NFC</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Project Name</label>
                  <Input
                    value={formData.projectName}
                    onChange={(e) => handleInputChange('projectName', e.target.value)}
                    placeholder="e.g., Digital Transformation"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
                  <Input
                    value={formData.tags.join(', ')}
                    onChange={(e) => {
                      const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                      setFormData(prev => ({ ...prev, tags: tagsArray }));
                    }}
                    placeholder="e.g., IT, computer, desktop"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="e.g., High-performance workstation for development"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[80px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Building</label>
                  <Input
                    value={formData.location.building}
                    onChange={(e) => handleInputChange('location.building', e.target.value)}
                    placeholder="e.g., Main Building"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Floor</label>
                  <Input
                    value={formData.location.floor}
                    onChange={(e) => handleInputChange('location.floor', e.target.value)}
                    placeholder="e.g., 2nd Floor"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Room</label>
                  <Input
                    value={formData.location.room}
                    onChange={(e) => handleInputChange('location.room', e.target.value)}
                    placeholder="e.g., IT Department"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Latitude *</label>
                  <Input
                    value={formData.location.latitude}
                    onChange={(e) => handleInputChange('location.latitude', e.target.value)}
                    placeholder="e.g., 40.7128"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Longitude *</label>
                  <Input
                    value={formData.location.longitude}
                    onChange={(e) => handleInputChange('location.longitude', e.target.value)}
                    placeholder="e.g., -74.0060"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Photos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Upload Photos</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setFormData(prev => ({
                        ...prev,
                        photos: [...prev.photos, ...files]
                      }));
                    }}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600">Click to upload photos</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 10MB each</p>
                  </label>
                </div>
                
                {/* Display selected photos */}
                {formData.photos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Photos ({formData.photos.length})</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {formData.photos.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                photos: prev.photos.filter((_, i) => i !== index)
                              }));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={state.loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={state.loading}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
          >
            {state.loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Creating...
              </>
            ) : (
              'Create Asset'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Create Asset Type Modal Component
const CreateAssetTypeModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess?: () => void }> = ({ 
  isOpen, 
  onClose,
  onSuccess
}) => {
  const { createAssetType, state } = useAssetContext();
  const [formData, setFormData] = useState<{
    name: string;
    fields: Array<{
      label: string;
      fieldType: 'text' | 'dropdown';
      options: string[];
    }>;
  }>({
    name: '',
    fields: [
      { label: '', fieldType: 'text', options: [] }
    ]
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFieldChange = (index: number, field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      )
    }));
  };

  const addField = () => {
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, { label: '', fieldType: 'text', options: [] }]
    }));
  };

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Filter out empty fields
      const validFields = formData.fields.filter(field => field.label.trim() !== '');
      
      const assetTypeData = {
        name: formData.name,
        fields: validFields
      };
      
      await createAssetType(assetTypeData);
      onClose();
      onSuccess?.();
      
      // Reset form
      setFormData({
        name: '',
        fields: [{ label: '', fieldType: 'text', options: [] }]
      });
    } catch (error) {
      console.error('Error creating asset type:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Create New Asset Type</h2>
              <p className="text-sm text-gray-600">Define a new asset type with custom fields</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Asset Type Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Asset Type Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Generator, Chiller, Pump"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Fields Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Custom Fields
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.fields.map((field, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">Field {index + 1}</h4>
                    {formData.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Field Label *</label>
                      <Input
                        value={field.label}
                        onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                        placeholder="e.g., Capacity, Brand, Model"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Field Type *</label>
                      <select
                        value={field.fieldType}
                        onChange={(e) => handleFieldChange(index, 'fieldType', e.target.value as 'text' | 'dropdown')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="text">Text Input</option>
                        <option value="dropdown">Dropdown</option>
                      </select>
                    </div>
                  </div>
                  
                  {(field.fieldType as string) === 'dropdown' && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Dropdown Options *</label>
                      <Input
                        value={field.options.join(', ')}
                        onChange={(e) => handleFieldChange(index, 'options', e.target.value.split(',').map(opt => opt.trim()))}
                        placeholder="e.g., Texmo, Kirloskar, Carrier (comma separated)"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate options with commas</p>
                    </div>
                  )}
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addField}
                className="w-full border-dashed border-gray-300 hover:border-gray-400"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Field
              </Button>
            </CardContent>
          </Card>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={state.loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={state.loading}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
          >
            {state.loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Creating...
              </>
            ) : (
              'Create Asset Type'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Edit Asset Type Modal Component
const EditAssetTypeModal: React.FC<{ isOpen: boolean; onClose: () => void; assetType: AssetType; onSuccess?: () => void }> = ({ 
  isOpen, 
  onClose, 
  assetType,
  onSuccess
}) => {
  const { updateAssetType, state } = useAssetContext();
  const [formData, setFormData] = useState<{
    name: string;
    fields: Array<{
      label: string;
      fieldType: 'text' | 'dropdown';
      options: string[];
    }>;
  }>({
    name: '',
    fields: []
  });

  // Update form data when assetType prop changes
  useEffect(() => {
    if (assetType) {
      setFormData({
        name: assetType.name,
        fields: assetType.fields
      });
    }
  }, [assetType]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFieldChange = (index: number, field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      )
    }));
  };

  const addField = () => {
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, { label: '', fieldType: 'text', options: [] }]
    }));
  };

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Filter out empty fields
      const validFields = formData.fields.filter(field => field.label.trim() !== '');
      
      const assetTypeData = {
        name: formData.name,
        fields: validFields
      };
      
      await updateAssetType(assetType._id, assetTypeData);
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error updating asset type:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Edit Asset Type</h2>
              <p className="text-sm text-gray-600">Modify the fields for this asset type</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Asset Type Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Asset Type Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Generator, Chiller, Pump"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Fields Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Custom Fields
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.fields.map((field, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">Field {index + 1}</h4>
                    {formData.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Field Label *</label>
                      <Input
                        value={field.label}
                        onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                        placeholder="e.g., Capacity, Brand, Model"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Field Type *</label>
                      <select
                        value={field.fieldType}
                        onChange={(e) => handleFieldChange(index, 'fieldType', e.target.value as 'text' | 'dropdown')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="text">Text Input</option>
                        <option value="dropdown">Dropdown</option>
                      </select>
                    </div>
                  </div>
                  
                  {(field.fieldType as string) === 'dropdown' && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Dropdown Options *</label>
                      <Input
                        value={field.options.join(', ')}
                        onChange={(e) => handleFieldChange(index, 'options', e.target.value.split(',').map(opt => opt.trim()))}
                        placeholder="e.g., Texmo, Kirloskar, Carrier (comma separated)"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate options with commas</p>
                    </div>
                  )}
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addField}
                className="w-full border-dashed border-gray-300 hover:border-gray-400"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Field
              </Button>
            </CardContent>
          </Card>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={state.loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={state.loading}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
          >
            {state.loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Updating...
              </>
            ) : (
              'Update Asset Type'
            )}
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
            <StatusBadge status={asset.status || 'Active'} />
            <PriorityBadge priority={asset.priority || 'Medium'} />
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
            <p className="font-semibold text-xs">{asset.assignedTo?.name || 'Unassigned'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-gray-500 text-xs font-medium">Location</span>
            <p className="font-semibold text-xs">{asset.location.room}</p>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Updated: {asset.updatedAt ? new Date(asset.updatedAt).toLocaleDateString() : 'N/A'}
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
            <Button size="sm" variant="destructive" onClick={() => asset._id && onDelete(asset._id)}>
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
  const { state, fetchAssets, deleteAsset, clearError, createAssetType } = useAssetContext();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Only fetch if not already loading and no assets loaded
    if (!state.loading && state.assets.length === 0) {
      fetchAssets();
    }
  }, [state.loading, state.assets.length]);

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
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all duration-200 transform hover:scale-105 px-6 py-2 text-sm font-semibold" onClick={() => setIsCreateModalOpen(true)}>
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
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg" onClick={() => setIsCreateModalOpen(true)}>
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
                        key={asset._id || `asset-${index}`} 
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
                          <div className="text-sm font-semibold text-gray-900">{asset.assignedTo?.name || 'Unassigned'}</div>
                          <div className="text-xs text-gray-500 mt-1">{asset.assignedTo?.email || 'N/A'}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          <StatusBadge status={asset.status || 'Active'} />
                        </TableCell>
                        <TableCell className="py-4">
                          <PriorityBadge priority={asset.priority || 'Medium'} />
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
                              onClick={() => asset._id && handleDelete(asset._id)}
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
            {state.assets.map((asset, index) => (
              <MobileAssetCard
                key={asset._id || `asset-${index}`}
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

      {/* Create Asset Modal */}
      <CreateAssetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Asset Modal */}
      {editingAsset && (
        <EditAssetModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          asset={editingAsset}
          onSuccess={handleUpdateSuccess}
        />
      )}

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
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-base font-medium text-gray-600">Loading asset types...</p>
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
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Asset Type Management</h1>
                <p className="text-sm text-gray-600">Define and manage asset types for your facility</p>
              </div>
            </div>
          </div>
          <Button size="lg" className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg transition-all duration-200 transform hover:scale-105 px-6 py-2 text-sm font-semibold" onClick={() => setIsCreateModalOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Asset Type
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

      {/* Asset Types Display */}
      {state.assetTypes.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-16 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">No asset types found</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            Get started by creating your first asset type to define custom fields for your assets.
          </p>
          <Button size="lg" className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg" onClick={() => setIsCreateModalOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Your First Asset Type
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Asset Types Overview</h3>
            <p className="text-gray-600 text-sm">Showing {state.assetTypes.length} asset types</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-bold text-gray-900 py-4 text-sm">Asset Type Name</TableHead>
                  <TableHead className="font-bold text-gray-900 py-4 text-sm">Fields</TableHead>
                  <TableHead className="font-bold text-gray-900 py-4 text-sm">Created</TableHead>
                  <TableHead className="font-bold text-gray-900 py-4 text-sm text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.assetTypes.map((assetType: AssetType, index: number) => (
                  <TableRow 
                    key={assetType._id} 
                    className={`hover:bg-green-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <TableCell className="font-semibold text-gray-900 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <span className="text-sm">{assetType.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-wrap gap-1">
                        {assetType.fields.map((field: any, fieldIndex: number) => (
                          <Badge key={fieldIndex} variant="outline" className="text-xs">
                            {field.label} ({field.fieldType})
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-sm text-gray-600">
                        {new Date(assetType.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex justify-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(assetType)}
                          className="h-8 w-8 p-0 hover:bg-green-50"
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
                          className="h-8 w-8 p-0 hover:bg-red-50"
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

      {/* Create Asset Type Modal */}
      <CreateAssetTypeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Asset Type Modal */}
      {editingAssetType && (
        <EditAssetTypeModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingAssetType(null);
          }}
          assetType={editingAssetType}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {/* Success Toast */}
      <SuccessToast
        message={successMessage}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
};

// Success Toast Component
const SuccessToast: React.FC<{ message: string; isVisible: boolean; onClose: () => void }> = ({ 
  message, 
  isVisible, 
  onClose 
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:bg-green-600 rounded-full p-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Edit Asset Modal Component
const EditAssetModal: React.FC<{ isOpen: boolean; onClose: () => void; asset: Asset; onSuccess?: () => void }> = ({ 
  isOpen, 
  onClose,
  asset,
  onSuccess
}) => {
  const { updateAsset, fetchAssetTypes, state } = useAssetContext();
  const [formData, setFormData] = useState({
    tagId: '',
    assetType: '',
    subcategory: '',
    brand: '',
    model: '',
    serialNumber: '',
    capacity: '',
    yearOfInstallation: '',
    projectName: '',
    priority: '',
    digitalTagType: '',
    tags: [] as string[],
    notes: '',
    location: {
      building: '',
      floor: '',
      room: '',
      latitude: '',
      longitude: ''
    },
    photos: [] as File[]
  });

  // Update form data when asset prop changes
  useEffect(() => {
    if (asset) {
      setFormData({
        tagId: asset.tagId,
        assetType: asset.assetType,
        subcategory: asset.subcategory || '',
        brand: asset.brand,
        model: asset.model || '',
        serialNumber: asset.serialNumber || '',
        capacity: asset.capacity || '',
        yearOfInstallation: asset.yearOfInstallation || '',
        projectName: asset.projectName || '',
        priority: asset.priority || '',
        digitalTagType: asset.digitalTagType || '',
        tags: asset.tags || [],
        notes: asset.notes || '',
        location: {
          building: asset.location?.building || '',
          floor: asset.location?.floor || '',
          room: asset.location?.room || '',
          latitude: asset.location.latitude,
          longitude: asset.location.longitude
        },
        photos: [] as File[]
      });
    }
  }, [asset]);

  // Fetch asset types when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAssetTypes();
    }
  }, [isOpen, fetchAssetTypes]);

  // Reset brand and capacity when asset type changes
  useEffect(() => {
    if (formData.assetType) {
      setFormData(prev => ({
        ...prev,
        brand: '',
        capacity: ''
      }));
    }
  }, [formData.assetType]);

  // Get selected asset type and its fields
  const selectedAssetType = state.assetTypes.find(type => type.name === formData.assetType);
  const brandField = selectedAssetType?.fields.find(field => field.label === 'Brand');
  const capacityField = selectedAssetType?.fields.find(field => field.label === 'Capacity');

  const handleInputChange = (field: string, value: string | string[]) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create JSON object for asset data
      const assetData = {
        tagId: formData.tagId,
        assetType: formData.assetType,
        subcategory: formData.subcategory,
        brand: formData.brand,
        model: formData.model,
        serialNumber: formData.serialNumber,
        capacity: formData.capacity,
        yearOfInstallation: formData.yearOfInstallation,
        projectName: formData.projectName,
        priority: formData.priority,
        digitalTagType: formData.digitalTagType,
        tags: formData.tags,
        notes: formData.notes,
        location: {
          building: formData.location.building,
          floor: formData.location.floor,
          room: formData.location.room,
          latitude: formData.location.latitude,
          longitude: formData.location.longitude
        }
      };
      
      await updateAsset(asset._id!, assetData);
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error updating asset:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Edit Asset</h2>
              <p className="text-sm text-gray-600">Update asset information</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
        {/* Basic Information */}
<Card>
  <CardHeader>
    <CardTitle className="text-base flex items-center gap-2">
      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Basic Information
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Asset Tag ID *</label>
        <Input
          value={formData.tagId}
          onChange={e => handleInputChange('tagId', e.target.value)}
          placeholder="e.g., ASSET099000"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Asset Type *</label>
        <select
          value={formData.assetType}
          onChange={e => handleInputChange('assetType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
          disabled={state.loading}
        >
          <option value="">Select Asset Type</option>
          {state.loading ? (
            <option value="" disabled>Loading asset types...</option>
          ) : (
            state.assetTypes.map((type) => (
              <option key={type._id} value={type.name}>
                {type.name}
              </option>
            ))
          )}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Subcategory</label>
        <Input
          value={formData.subcategory}
          onChange={e => handleInputChange('subcategory', e.target.value)}
          placeholder="e.g., computer"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Capacity</label>
        <Input
          value={formData.capacity}
          onChange={e => handleInputChange('capacity', e.target.value)}
          placeholder="e.g., 16GB RAM, 512GB SSD"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Brand *</label>
        <Input
          value={formData.brand}
          onChange={e => handleInputChange('brand', e.target.value)}
          placeholder="e.g., Dell"
          required
          disabled={!formData.assetType}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Year of Installation</label>
        <Input
          value={formData.yearOfInstallation}
          onChange={e => handleInputChange('yearOfInstallation', e.target.value)}
          placeholder="e.g., 2023"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Model</label>
        <Input
          value={formData.model}
          onChange={e => handleInputChange('model', e.target.value)}
          placeholder="e.g., OptiPlex 7090"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Serial Number</label>
        <Input
          value={formData.serialNumber}
          onChange={e => handleInputChange('serialNumber', e.target.value)}
          placeholder="e.g., SN123456788888"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
        <select
          value={formData.priority}
          onChange={e => handleInputChange('priority', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Select Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Digital Tag Type</label>
        <select
          value={formData.digitalTagType}
          onChange={e => handleInputChange('digitalTagType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Select Tag Type</option>
          <option value="qr">QR Code</option>
          <option value="barcode">Barcode</option>
          <option value="rfid">RFID</option>
          <option value="nfc">NFC</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Project Name</label>
        <Input
          value={formData.projectName}
          onChange={e => handleInputChange('projectName', e.target.value)}
          placeholder="e.g., Digital Transformation"
        />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
        <Input
          value={formData.tags.join(', ')}
          onChange={e => {
            const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            setFormData(prev => ({ ...prev, tags: tagsArray }));
          }}
          placeholder="e.g., IT, computer, desktop"
        />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Notes</label>
        <textarea
          value={formData.notes}
          onChange={e => handleInputChange('notes', e.target.value)}
          placeholder="e.g., High-performance workstation for development"
          className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[80px]"
        />
      </div>
    </div>
  </CardContent>
</Card>

{/* Location Information */}
<Card>
  <CardHeader>
    <CardTitle className="text-base flex items-center gap-2">
      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      Location Information
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Building</label>
        <Input
          value={formData.location.building}
          onChange={e => handleInputChange('location.building', e.target.value)}
          placeholder="e.g., Main Building"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Floor</label>
        <Input
          value={formData.location.floor}
          onChange={e => handleInputChange('location.floor', e.target.value)}
          placeholder="e.g., 2nd Floor"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Room</label>
        <Input
          value={formData.location.room}
          onChange={e => handleInputChange('location.room', e.target.value)}
          placeholder="e.g., IT Department"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Latitude *</label>
        <Input
          value={formData.location.latitude}
          onChange={e => handleInputChange('location.latitude', e.target.value)}
          placeholder="e.g., 40.7128"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Longitude *</label>
        <Input
          value={formData.location.longitude}
          onChange={e => handleInputChange('location.longitude', e.target.value)}
          placeholder="e.g., -74.0060"
          required
        />
      </div>
    </div>
  </CardContent>
</Card>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={state.loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={state.loading}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
          >
            {state.loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Updating...
              </>
            ) : (
              'Update Asset'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Page Component
const ManageAssetsPage: React.FC = () => {
  const [showPermissions, setShowPermissions] = useState(false);

  if (showPermissions) {
    return (
      <AssetProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Admin Permissions</h1>
                  <p className="text-gray-600 mt-2">Manage system-wide permissions</p>
                                           <p className="text-xs text-blue-600 mt-1">
                      
                         </p>
                </div>
                <Button 
                  onClick={() => setShowPermissions(false)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Assets
                </Button>
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
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Asset Management</h1>
                <p className="text-gray-600 mt-2">Manage your assets and configurations</p>
              </div>
              <Button 
                onClick={() => setShowPermissions(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              Asset Permissions
              </Button>
            </div>
            <Tabs defaultValue="assets" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="asset-types">Asset Types</TabsTrigger>
              </TabsList>
              <TabsContent value="assets">
                <AssetsList />
              </TabsContent>
              <TabsContent value="asset-types">
                <AssetTypeManagement />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AssetProvider>
  );
};

export default ManageAssetsPage;
 