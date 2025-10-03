'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ManageLocationProvider, useManageLocation } from '../../../contexts/ManageLocationContext';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { LocationModal } from '../../../components/ui/location-modal';
import { DeleteConfirmationDialog } from '../../../components/ui/delete-confirmation-dialog';
import { 
  Plus, 
  Download,
  Search,
  MapPin,
  Eye,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { Location, CreateLocationRequest, UpdateLocationRequest } from '../../../lib/location';
import { Input } from '../../../components/ui/input';

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
  } = useManageLocation();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Remove the duplicate fetchLocations call since the context already handles this
  // useEffect(() => {
  //   if (locations.length === 0 && !loading) {
  //     fetchLocations();
  //   }
  // }, [locations.length, loading, fetchLocations]);

  const handleDelete = useCallback((location: Location) => {
    setLocationToDelete(location);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (locationToDelete) {
      await removeLocation(locationToDelete._id);
      setShowDeleteDialog(false);
      setLocationToDelete(null);
    }
  }, [locationToDelete, removeLocation]);

  const handleModalSubmit = useCallback(async (data: CreateLocationRequest | UpdateLocationRequest) => {
    if (modalMode === 'create') {
      await addLocation(data as CreateLocationRequest);
      closeModal();
    } else if (modalMode === 'edit' && selectedLocation) {
      await editLocation(selectedLocation._id, data as UpdateLocationRequest);
      closeModal();
    }
  }, [modalMode, selectedLocation, addLocation, editLocation, closeModal]);

  const filteredLocations = useMemo(() => {
    return locations.filter(location => {
      const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          location.address.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [locations, searchTerm]);

  const sortedLocations = useMemo(() => {
    return [...filteredLocations].sort((a, b) => {
      const aValue = a[sortField as keyof Location] || "";
      const bValue = b[sortField as keyof Location] || "";
      
      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    });
  }, [filteredLocations, sortField, sortDirection]);

  const { startIndex, paginatedLocations } = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedLocations = sortedLocations.slice(startIndex, endIndex);
    
    return { startIndex, paginatedLocations };
  }, [sortedLocations, currentPage, itemsPerPage]);

  const handleDownloadExcel = useCallback(async () => {
    setDownloadLoading(true);
    try {
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
        type: 'text/csv;charset=utf-8;'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `locations_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloadLoading(false);
    }
  }, [filteredLocations]);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }, [sortField, sortDirection]);

  const getTypeColor = useCallback((type: string) => {
    switch (type.toLowerCase()) {
      case 'office': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'warehouse': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'factory': return 'bg-green-100 text-green-800 border-green-200'
      case 'retail': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'residential': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }, []);




  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="flex-1 overflow-auto">
        {/* Main Content */}
        <main className="px-4 pb-1 sm:px-6 sm:pb-2 space-y-4 sm:space-y-6">
          {loading && locations.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Loading Location Management</h2>
                  <p className="text-sm text-muted-foreground">Please wait while we fetch your data...</p>
                </div>
                </div>
              </div>
          ) : (
            <>
              {/* Simple Search and Actions */}
              <div className="flex items-center justify-between gap-4">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      placeholder="Search locations..."
                    className="pl-10 h-10 text-sm bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
              </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                <Button
                  onClick={handleDownloadExcel}
                  disabled={downloadLoading || locations.length === 0}
                  variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                </Button>
                <Button 
                  onClick={() => openModal('create')}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Location</span>
                </Button>
                </div>
              </div>

              {/* Locations Table */}
              <Card className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                        <span className="text-gray-600 dark:text-gray-400">Loading locations...</span>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="text-red-500 mb-2">Error loading locations</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</div>
                        <Button 
                          onClick={fetchLocations}
                          className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Loader2 className="w-4 h-4 mr-2" />
                          Try Again
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto bg-white">
                      <table className="w-full border-collapse font-sans text-base">
                        <thead>
                          <tr className="bg-white border-b border-blue-200">
                            <th className="border border-blue-200 px-4 py-3 text-left font-semibold text-blue-900 bg-blue-50 text-sm">
                              #
                            </th>
                            <th 
                              className="border border-blue-200 px-4 py-3 text-left font-semibold text-blue-900 bg-blue-50 text-sm cursor-pointer hover:bg-blue-100 transition-colors"
                              onClick={() => handleSort("name")}
                            >
                              LOCATION NAME
                            </th>
                            <th 
                              className="border border-blue-200 px-4 py-3 text-left font-semibold text-blue-900 bg-blue-50 text-sm cursor-pointer hover:bg-blue-100 transition-colors"
                              onClick={() => handleSort("type")}
                            >
                              TYPE
                            </th>
                            <th 
                              className="border border-blue-200 px-4 py-3 text-left font-semibold text-blue-900 bg-blue-50 text-sm cursor-pointer hover:bg-blue-100 transition-colors"
                              onClick={() => handleSort("address")}
                            >
                              ADDRESS
                            </th>
                            <th 
                              className="border border-blue-200 px-4 py-3 text-left font-semibold text-blue-900 bg-blue-50 text-sm cursor-pointer hover:bg-blue-100 transition-colors"
                              onClick={() => handleSort("createdAt")}
                            >
                              CREATED
                            </th>
                            <th className="border border-blue-200 px-4 py-3 text-center font-semibold text-blue-900 bg-blue-50 text-sm">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedLocations.map((location, index) => (
                            <tr key={location._id} className="hover:bg-gray-50 transition-colors">
                              <td className="border border-blue-200 px-4 py-3 text-sm font-medium text-gray-700">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-sm font-semibold text-blue-700">
                                  {startIndex + index + 1}
                                </div>
                              </td>
                              <td className="border border-blue-200 px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-green-100 rounded">
                                    <MapPin className="w-4 h-4 text-green-600" />
                                  </div>
                                  <span className="text-sm font-medium text-blue-600 cursor-pointer hover:underline">
                                    {location.name}
                                  </span>
                                </div>
                              </td>
                              <td className="border border-blue-200 px-4 py-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(location.type)}`}>
                                  {location.type}
                                </span>
                              </td>
                              <td className="border border-blue-200 px-4 py-3 text-sm text-gray-700">
                                {location.address}
                              </td>
                              <td className="border border-blue-200 px-4 py-3 text-sm text-gray-700">
                                {new Date(location.createdAt).toISOString().split('T')[0]}
                              </td>
                              <td className="border border-blue-200 px-4 py-3">
                                <div className="flex items-center gap-2 justify-center">
                                  <button 
                                    className="w-9 h-9 flex items-center justify-center text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                                    onClick={() => openModal('view', location)}
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button 
                                    className="w-9 h-9 flex items-center justify-center text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors shadow-sm"
                                    onClick={() => openModal('edit', location)}
                                    title="Edit Location"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    className="w-9 h-9 flex items-center justify-center text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                                    onClick={() => handleDelete(location)}
                                    title="Delete Location"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

            </>
          )}
        </main>
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
