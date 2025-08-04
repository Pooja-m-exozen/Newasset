import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Textarea } from './textarea';
import { Asset, AssetType } from '../../lib/adminasset';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  asset?: Asset | null;
  assetTypes: AssetType[];
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  onClose,
  mode,
  asset,
  assetTypes,
  onSubmit,
  loading = false
}) => {
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
      latitude: '',
      longitude: '',
      building: '',
      floor: '',
      room: ''
    }
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (asset && mode === 'edit') {
      setFormData({
        tagId: asset.tagId || '',
        assetType: asset.assetType || '',
        subcategory: asset.subcategory || '',
        brand: asset.brand || '',
        model: asset.model || '',
        serialNumber: asset.serialNumber || '',
        capacity: asset.capacity || '',
        yearOfInstallation: asset.yearOfInstallation || '',
        projectName: asset.projectName || '',
        notes: asset.notes || '',
        priority: asset.priority || '',
        digitalTagType: asset.digitalTagType || '',
        tags: asset.tags || [],
        location: {
          latitude: asset.location?.latitude || '',
          longitude: asset.location?.longitude || '',
          building: asset.location?.building || '',
          floor: asset.location?.floor || '',
          room: asset.location?.room || ''
        }
      });
    } else {
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
        tags: [],
        notes: '',
        location: {
          latitude: '',
          longitude: '',
          building: '',
          floor: '',
          room: ''
        }
      });
    }
  }, [asset, mode]);

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

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const getModalTitle = () => {
    return mode === 'create' ? 'Create New Asset' : 'Edit Asset';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tagId" className="text-sm font-medium text-gray-700">Tag ID *</Label>
                <Input
                  id="tagId"
                  value={formData.tagId}
                  onChange={(e) => handleInputChange('tagId', e.target.value)}
                  placeholder="e.g., ASSET099000"
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="assetType" className="text-sm font-medium text-gray-700">Asset Type *</Label>
                <Select 
                  value={formData.assetType} 
                  onValueChange={(value) => handleInputChange('assetType', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map(type => (
                      <SelectItem key={type._id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700">Subcategory</Label>
                <Input
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={(e) => handleInputChange('subcategory', e.target.value)}
                  placeholder="e.g., computer"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="brand" className="text-sm font-medium text-gray-700">Brand *</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="e.g., Dell"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="model" className="text-sm font-medium text-gray-700">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="e.g., OptiPlex 7090"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="serialNumber" className="text-sm font-medium text-gray-700">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                  placeholder="e.g., SN123456788888"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="capacity" className="text-sm font-medium text-gray-700">Capacity</Label>
                <Input
                  id="capacity"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                  placeholder="e.g., 16GB RAM, 512GB SSD"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="yearOfInstallation" className="text-sm font-medium text-gray-700">Year of Installation</Label>
                <Input
                  id="yearOfInstallation"
                  value={formData.yearOfInstallation}
                  onChange={(e) => handleInputChange('yearOfInstallation', e.target.value)}
                  placeholder="e.g., 2023"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="digitalTagType" className="text-sm font-medium text-gray-700">Digital Tag Type</Label>
                <Select 
                  value={formData.digitalTagType} 
                  onValueChange={(value) => handleInputChange('digitalTagType', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select tag type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qr">QR Code</SelectItem>
                    <SelectItem value="barcode">Barcode</SelectItem>
                    <SelectItem value="rfid">RFID</SelectItem>
                    <SelectItem value="nfc">NFC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="projectName" className="text-sm font-medium text-gray-700">Project Name</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => handleInputChange('projectName', e.target.value)}
                  placeholder="e.g., Digital Transformation"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Location Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="building" className="text-sm font-medium text-gray-700">Building</Label>
                <Input
                  id="building"
                  value={formData.location.building}
                  onChange={(e) => handleInputChange('location.building', e.target.value)}
                  placeholder="e.g., Main Building"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="floor" className="text-sm font-medium text-gray-700">Floor</Label>
                <Input
                  id="floor"
                  value={formData.location.floor}
                  onChange={(e) => handleInputChange('location.floor', e.target.value)}
                  placeholder="e.g., 2nd Floor"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="room" className="text-sm font-medium text-gray-700">Room</Label>
                <Input
                  id="room"
                  value={formData.location.room}
                  onChange={(e) => handleInputChange('location.room', e.target.value)}
                  placeholder="e.g., IT Department"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="latitude" className="text-sm font-medium text-gray-700">Latitude *</Label>
                <Input
                  id="latitude"
                  value={formData.location.latitude}
                  onChange={(e) => handleInputChange('location.latitude', e.target.value)}
                  placeholder="e.g., 40.7128"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="longitude" className="text-sm font-medium text-gray-700">Longitude *</Label>
                <Input
                  id="longitude"
                  value={formData.location.longitude}
                  onChange={(e) => handleInputChange('location.longitude', e.target.value)}
                  placeholder="e.g., -74.0060"
                  required
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
            
            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="e.g., High-performance workstation for development"
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Tags</Label>
              <div className="mt-1 space-y-2">
                <div className="flex space-x-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTagAdd();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleTagAdd} variant="outline">
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <div key={index} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-md">
                        <span className="text-sm">{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleTagRemove(tag)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'create' ? 'Create Asset' : 'Update Asset'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 