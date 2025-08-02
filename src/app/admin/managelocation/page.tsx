'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ManageLocationProvider, useManageLocation } from '../../../contexts/ManageLocationContext';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  Download,
  Settings,
  Clock,
  FileText,
  Share2,
  Archive,
  RefreshCw
} from 'lucide-react';
import { Location, CreateLocationRequest, UpdateLocationRequest } from '../../../lib/location';

const LocationManagementPage = () => {
  return (
    <ManageLocationProvider>
      <LocationManagementContent />
    </ManageLocationProvider>
  );
};

const LocationManagementContent = () => {
  const {
    locations,
    loading,
    error,
    selectedLocation,
    isModalOpen,
    modalMode,
    fetchLocations,
    addLocation,
    editLocation,
    removeLocation,
    openModal,
    closeModal,
    clearError,
  } = useManageLocation();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setShowMoreDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Use all locations since we removed search and filter
  const filteredLocations = locations;

  const handleDelete = (location: Location) => {
    setLocationToDelete(location);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (locationToDelete) {
      await removeLocation(locationToDelete._id);
      setShowDeleteDialog(false);
      setLocationToDelete(null);
    }
  };

  const locationTypes = ['Building', 'Floor', 'Room', 'Area', 'Zone'];

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'building': return 'bg-blue-100 text-blue-800';
      case 'floor': return 'bg-purple-100 text-purple-800';
      case 'room': return 'bg-green-100 text-green-800';
      case 'area': return 'bg-orange-100 text-orange-800';
      case 'zone': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Location Management</h1>
          <p className="text-gray-600 mt-2">Manage and organize your facility locations</p>
        </div>
        <Button 
          onClick={() => openModal('create')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-red-700">{error}</p>
              <Button variant="ghost" size="sm" onClick={clearError}>
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Locations List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Locations</h3>
              <p className="text-sm text-gray-600">Showing {filteredLocations.length} of {locations.length} locations</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-300 hover:border-blue-500 hover:bg-blue-50">
                <Download className="w-4 h-4" />
              </Button>
              <div className="relative" ref={moreDropdownRef}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                  onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                {showMoreDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Export Data</span>
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                        <Share2 className="w-4 h-4" />
                        <span>Share Locations</span>
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                        <Archive className="w-4 h-4" />
                        <span>Archive</span>
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-gray-600">Loading locations...</span>
              </div>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
              <p className="text-gray-600 mb-4">
                Get started by adding your first location
              </p>
              {(
                <Button onClick={() => openModal('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Location
                </Button>
              )}
            </div>
          ) : (
            filteredLocations.map((location) => (
              <div key={location._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold text-gray-900">{location.name}</h4>
                        <Badge className={`${getTypeColor(location.type)} px-2 py-0.5 text-xs`}>
                          {location.type}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{location.address}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(location.createdAt)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Coordinates: {location.coordinates.latitude.toFixed(4)}, {location.coordinates.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:bg-blue-50"
                      onClick={() => openModal('view', location)}
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:bg-green-50"
                      onClick={() => openModal('edit', location)}
                    >
                      <Edit className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:bg-red-50"
                      onClick={() => handleDelete(location)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredLocations.length} of {locations.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">Previous</Button>
              <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Location Modal */}
      <LocationModal />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{locationToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Location Modal Component
const LocationModal = () => {
  const {
    selectedLocation,
    isModalOpen,
    modalMode,
    addLocation,
    editLocation,
    closeModal,
    loading,
  } = useManageLocation();

  const [formData, setFormData] = useState<CreateLocationRequest>({
    name: '',
    type: '',
    address: '',
    coordinates: { latitude: 0, longitude: 0 },
  });

  const locationTypes = ['Building', 'Floor', 'Room', 'Area', 'Zone'];

  React.useEffect(() => {
    if (selectedLocation && modalMode === 'edit') {
      setFormData({
        name: selectedLocation.name,
        type: selectedLocation.type,
        address: selectedLocation.address,
        coordinates: selectedLocation.coordinates,
      });
    } else {
      setFormData({
        name: '',
        type: '',
        address: '',
        coordinates: { latitude: 0, longitude: 0 },
      });
    }
  }, [selectedLocation, modalMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (modalMode === 'create') {
      await addLocation(formData);
    } else if (modalMode === 'edit' && selectedLocation) {
      await editLocation(selectedLocation._id, formData);
    }
  };

  const getModalTitle = () => {
    switch (modalMode) {
      case 'create': return 'Add New Location';
      case 'edit': return 'Edit Location';
      case 'view': return 'Location Details';
      default: return 'Location';
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={closeModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>
            {modalMode === 'view' 
              ? 'View location details'
              : 'Enter the location information below'
            }
          </DialogDescription>
        </DialogHeader>
        
        {modalMode === 'view' ? (
          <LocationDetails location={selectedLocation} />
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
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Update'}
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

export default LocationManagementPage;
