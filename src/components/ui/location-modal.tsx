import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Badge } from './badge';
import { Location, CreateLocationRequest } from '../../lib/location';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  location?: Location | null;
  onSubmit: (data: CreateLocationRequest) => Promise<void>;
  loading?: boolean;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  mode,
  location,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState<CreateLocationRequest>({
    name: '',
    type: '',
    address: '',
    coordinates: { latitude: 0, longitude: 0 },
  });

  const locationTypes = ['Building', 'Floor', 'Room', 'Area', 'Zone'];

  useEffect(() => {
    if (location && mode === 'edit') {
      setFormData({
        name: location.name,
        type: location.type,
        address: location.address,
        coordinates: location.coordinates,
      });
    } else {
      setFormData({
        name: '',
        type: '',
        address: '',
        coordinates: { latitude: 0, longitude: 0 },
      });
    }
  }, [location, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Add New Location';
      case 'edit': return 'Edit Location';
      case 'view': return 'Location Details';
      default: return 'Location';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>
            {mode === 'view' 
              ? 'View location details'
              : 'Enter the location information below'
            }
          </DialogDescription>
        </DialogHeader>
        
        {mode === 'view' ? (
          <LocationDetails location={location} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter location name"
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <Label htmlFor="type" className="text-sm font-medium text-gray-700 mb-1">Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="border-gray-200 shadow-lg">
                  {locationTypes.map(type => (
                    <SelectItem key={type} value={type} className="text-sm font-medium">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="address" className="text-sm font-medium text-gray-700 mb-1">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude" className="text-sm font-medium text-gray-700 mb-1">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.coordinates.latitude}
                  onChange={(e) => setFormData({
                    ...formData,
                    coordinates: {
                      ...formData.coordinates,
                      latitude: parseFloat(e.target.value) || 0
                    }
                  })}
                  placeholder="12.9716"
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="longitude" className="text-sm font-medium text-gray-700 mb-1">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.coordinates.longitude}
                  onChange={(e) => setFormData({
                    ...formData,
                    coordinates: {
                      ...formData.coordinates,
                      longitude: parseFloat(e.target.value) || 0
                    }
                  })}
                  placeholder="77.5946"
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Location Details Component
const LocationDetails = ({ location }: { location: Location | null }) => {
  if (!location) return null;

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-600">Name</Label>
        <p className="text-sm text-gray-900">{location.name}</p>
      </div>
      
      <div>
        <Label className="text-sm font-medium text-gray-600">Type</Label>
        <Badge variant="secondary" className="mt-1">{location.type}</Badge>
      </div>
      
      <div>
        <Label className="text-sm font-medium text-gray-600">Address</Label>
        <p className="text-sm text-gray-900">{location.address}</p>
      </div>
      
      <div>
        <Label className="text-sm font-medium text-gray-600">Coordinates</Label>
        <p className="text-sm text-gray-900">
          {location.coordinates.latitude.toFixed(6)}, {location.coordinates.longitude.toFixed(6)}
        </p>
      </div>
      
      <div>
        <Label className="text-sm font-medium text-gray-600">Created</Label>
        <p className="text-sm text-gray-900">
          {new Date(location.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}; 