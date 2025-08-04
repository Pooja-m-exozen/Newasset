import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { AssetType } from '../../lib/adminasset';

interface AssetTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  assetType?: AssetType | null;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

interface Field {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export const AssetTypeFormModal: React.FC<AssetTypeFormModalProps> = ({
  isOpen,
  onClose,
  mode,
  assetType,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: [] as Field[]
  });

  const [newField, setNewField] = useState({
    name: '',
    type: 'text',
    required: false,
    description: ''
  });

  useEffect(() => {
    if (assetType && mode === 'edit') {
      setFormData({
        name: assetType.name || '',
        description: assetType.description || '',
        fields: assetType.fields || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        fields: []
      });
    }
  }, [assetType, mode]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFieldChange = (index: number, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      )
    }));
  };

  const addField = () => {
    if (newField.name.trim()) {
      setFormData(prev => ({
        ...prev,
        fields: [...prev.fields, { ...newField }]
      }));
      setNewField({
        name: '',
        type: 'text',
        required: false,
        description: ''
      });
    }
  };

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const getModalTitle = () => {
    return mode === 'create' ? 'Create New Asset Type' : 'Edit Asset Type';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter asset type name"
                required
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter asset type description"
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Custom Fields</Label>
            <div className="mt-2 space-y-4">
              {/* Add new field */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">Add New Field</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600">Field Name</Label>
                    <Input
                      value={newField.name}
                      onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Serial Number"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Field Type</Label>
                    <select
                      value={newField.type}
                      onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="email">Email</option>
                      <option value="url">URL</option>
                      <option value="select">Select</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Description</Label>
                    <Input
                      value={newField.description}
                      onChange={(e) => setNewField(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Field description"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="required"
                      checked={newField.required}
                      onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="required" className="text-xs text-gray-600">Required</Label>
                  </div>
                </div>
                <Button 
                  type="button" 
                  onClick={addField}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  disabled={!newField.name.trim()}
                >
                  Add Field
                </Button>
              </div>

              {/* Existing fields */}
              {formData.fields.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Current Fields</h4>
                  {formData.fields.map((field, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">{field.name}</span>
                            <span className="text-xs text-gray-500">({field.type})</span>
                            {field.required && (
                              <span className="text-xs bg-red-100 text-red-800 px-1 rounded">Required</span>
                            )}
                          </div>
                          {field.description && (
                            <p className="text-xs text-gray-600 mt-1">{field.description}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeField(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'create' ? 'Create Asset Type' : 'Update Asset Type'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 