import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { AssetType } from '../../lib/adminasset';
import { X, Plus, Trash2, Settings, Info } from 'lucide-react';
import { Badge } from './badge';

interface AssetTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  assetType?: AssetType | null;
  onSubmit: (data: AssetTypeFormData) => Promise<void>;
  loading?: boolean;
}

interface AssetTypeFormData {
  name: string;
  description: string;
  fields: Field[];
}

interface Field {
  label: string;
  fieldType: string;
  required?: boolean;
  description?: string;
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
    label: '',
    fieldType: 'text',
    required: false,
    description: ''
  });

  useEffect(() => {
    if (assetType && mode === 'edit') {
      setFormData({
        name: assetType.name || '',
        description: '', // AssetType doesn't have description field
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



  const addField = () => {
    if (newField.label.trim()) {
      setFormData(prev => ({
        ...prev,
        fields: [...prev.fields, { ...newField }]
      }));
      setNewField({
        label: '',
        fieldType: 'text',
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <span>{getModalTitle()}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg flex items-center justify-center">
                <Info className="w-3 h-3 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter asset type name"
                  required
                  className="border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter asset type description"
                  rows={3}
                  className="border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>
          </div>
          
          {/* Custom Fields */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg flex items-center justify-center">
                <Settings className="w-3 h-3 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Fields</h3>
            </div>
            
            <div className="space-y-4">
              {/* Add new field */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-gray-800/50">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
                  Add New Field
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Field Name</Label>
                    <Input
                      value={newField.label}
                      onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="e.g., Serial Number"
                      className="border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Field Type</Label>
                    <select
                      value={newField.fieldType}
                      onChange={(e) => setNewField(prev => ({ ...prev, fieldType: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500 dark:focus:ring-green-400"
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
                    <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Description</Label>
                    <Input
                      value={newField.description}
                      onChange={(e) => setNewField(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Field description"
                      className="border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="required"
                      checked={newField.required}
                      onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400"
                    />
                    <Label htmlFor="required" className="text-xs text-gray-600 dark:text-gray-400">Required</Label>
                  </div>
                </div>
                <Button 
                  type="button" 
                  onClick={addField}
                  variant="outline"
                  size="sm"
                  className="mt-4 border-green-300 dark:border-green-600 hover:border-green-500 dark:hover:border-green-500 text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                  disabled={!newField.label.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>

              {/* Existing fields */}
              {formData.fields.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Current Fields ({formData.fields.length})</h4>
                  {formData.fields.map((field, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">{field.label}</span>
                            <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400">
                              {field.fieldType}
                            </Badge>
                            {field.required && (
                              <Badge className="text-xs bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700">
                                Required
                              </Badge>
                            )}
                          </div>
                          {field.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">{field.description}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeField(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} className="border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.name.trim()}
              className="bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white"
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Asset Type' : 'Update Asset Type'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 