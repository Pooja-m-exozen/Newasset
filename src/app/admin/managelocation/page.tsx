'use client';

import React, { useState } from 'react';
import { ManageLocationProvider, useManageLocation } from '../../../contexts/ManageLocationContext';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { LocationCard } from '../../../components/ui/location-card';
import { LocationModal } from '../../../components/ui/location-modal';
import { DeleteConfirmationDialog } from '../../../components/ui/delete-confirmation-dialog';
import { MoreDropdown } from '../../../components/ui/more-dropdown';
import { 
  Plus, 
  Download,
  RefreshCw
} from 'lucide-react';
import { Location } from '../../../lib/location';

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
              <p className="text-sm text-gray-600">Showing {locations.length} of {locations.length} locations</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-300 hover:border-blue-500 hover:bg-blue-50">
                <Download className="w-4 h-4" />
              </Button>
              <MoreDropdown
                onExport={() => console.log('Export clicked')}
                onShare={() => console.log('Share clicked')}
                onArchive={() => console.log('Archive clicked')}
                onSettings={() => console.log('Settings clicked')}
              />
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
          ) : locations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
              <p className="text-gray-600 mb-4">
                Get started by adding your first location
              </p>
                <Button onClick={() => openModal('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Location
                </Button>
            </div>
          ) : (
            locations.map((location) => (
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

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {locations.length} of {locations.length} results
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
  );
};

export default LocationManagementPage;
