'use client';

import React, { useState } from 'react';
import { ManageLocationProvider, useManageLocation } from '../../../contexts/ManageLocationContext';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { LocationCard } from '../../../components/ui/location-card';
import { LocationModal } from '../../../components/ui/location-modal';
import { DeleteConfirmationDialog } from '../../../components/ui/delete-confirmation-dialog';
import { MoreDropdown } from '../../../components/ui/more-dropdown';
import { 
  Plus, 
  Download,
  RefreshCw,
  Search,
  Filter,
  MapPin,
  Building,
  FileText,
  X
} from 'lucide-react';
import { Location } from '../../../lib/location';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [downloadLoading, setDownloadLoading] = useState(false);

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

  const handleModalSubmit = async (data: any) => {
    if (modalMode === 'create') {
      await addLocation(data);
    } else if (modalMode === 'edit' && selectedLocation) {
      await editLocation(selectedLocation._id, data);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloadLoading(true);
    try {
      const filteredLocations = locations.filter(location => {
        const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            location.address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || location.type === filterType;
        return matchesSearch && matchesType;
      });

      const headers = ['Name', 'Type', 'Address', 'Latitude', 'Longitude', 'Created At'];
      const rows = filteredLocations.map(location => [
        location.name,
        location.type,
        location.address,
        location.coordinates.latitude,
        location.coordinates.longitude,
        new Date(location.createdAt).toLocaleDateString()
      ]);
      
      const csvContent = [headers, ...rows].map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `locations_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloadLoading(false);
    }
  };

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        location.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || location.type === filterType;
    return matchesSearch && matchesType;
  });

  const locationTypes = ['all', ...Array.from(new Set(locations.map(l => l.type)))];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <MapPin className="w-8 h-8 mr-3 text-blue-600" />
                Location Management
              </h1>
              <p className="text-gray-600 mt-2">Manage and organize your facility locations</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleDownloadExcel}
                disabled={downloadLoading || locations.length === 0}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
              >
                {downloadLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                  </>
                )}
              </Button>
              <Button 
                onClick={() => openModal('create')}
                className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Location
              </Button>
            </div>
          </div>
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

        {/* Filters and Search */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Locations</CardTitle>
              <div className="text-sm text-gray-500">
                {filteredLocations.length} of {locations.length} locations
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search locations by name or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type === 'all' ? 'All Types' : type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(searchTerm || filterType !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('all');
                    }}
                    className="border-gray-300 hover:border-blue-500"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
            
            {/* Locations List */}
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
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || filterType !== 'all' ? 'No matching locations' : 'No locations found'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filterType !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Get started by adding your first location'
                    }
                  </p>
                  {!searchTerm && filterType === 'all' && (
                    <Button onClick={() => openModal('create')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Location
                    </Button>
                  )}
                </div>
              ) : (
                filteredLocations.map((location) => (
                  <LocationCard
                    key={location._id}
                    location={location}
                    onView={(location) => openModal('view', location)}
                    onEdit={(location) => openModal('edit', location)}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Modal */}
        <LocationModal
          isOpen={isModalOpen}
          onClose={closeModal}
          mode={modalMode}
          location={selectedLocation}
          onSubmit={handleModalSubmit}
          loading={loading}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Delete Location"
          description="Are you sure you want to delete"
          itemName={locationToDelete?.name}
        />
      </div>
    </div>
  );
};

export default LocationManagementPage;
