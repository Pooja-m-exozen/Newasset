'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ManageLocationProvider, useManageLocation } from '../../../contexts/ManageLocationContext';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
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
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2
} from 'lucide-react';
import { Location, CreateLocationRequest, UpdateLocationRequest } from '../../../lib/location';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { useAuth } from '../../../contexts/AuthContext';

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

  const { user } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
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

  const { totalPages, startIndex, endIndex, paginatedLocations } = useMemo(() => {
    const totalPages = Math.ceil(sortedLocations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedLocations = sortedLocations.slice(startIndex, endIndex);
    
    return { totalPages, startIndex, endIndex, paginatedLocations };
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

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "1 day ago";
    return `${Math.floor(diffInHours / 24)} days ago`;
  }, []);



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg flex items-center justify-center shadow-lg">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                    Location Management
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                    {user?.projectName ? `Managing locations for project: ${user.projectName}` : 'Manage and organize your facility locations'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleDownloadExcel}
                  disabled={downloadLoading || locations.length === 0}
                  variant="outline"
                  size="sm"
                  className="border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 text-xs sm:text-sm w-full sm:w-auto justify-center"
                >
                  {downloadLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
                      <span className="hidden sm:inline">Exporting...</span>
                      <span className="sm:hidden">Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">Export</span>
                      <span className="sm:hidden">Export</span>
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => openModal('create')}
                  className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 text-white hover:from-green-700 hover:to-green-800 dark:hover:from-green-800 dark:hover:to-green-900 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Add Location</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950/20 rounded-full">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        {sortedLocations.length} Locations
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Manage your facility locations and site information
                  </p>
                </div>
                
                {/* Search */}
                <div className="w-full max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search locations..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Locations Table */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4 sm:pb-6">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-foreground">Location Management</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Manage locations and site information in a structured table format
                        </p>
                      </div>
                    </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-muted-foreground">
                    {sortedLocations.length} locations
                  </span>
                  <Button 
                    onClick={fetchLocations}
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Refresh</span>
                    )}
                  </Button>
                </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                        <span className="text-muted-foreground">Loading locations...</span>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="text-red-500 mb-2">Error loading locations</div>
                        <div className="text-sm text-muted-foreground mb-4">{error}</div>
                        <Button 
                          onClick={fetchLocations}
                          variant="outline"
                          size="sm"
                        >
                          Retry
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-12">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                                <MapPin className="w-4 h-4" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/80 transition-colors"
                              onClick={() => handleSort("name")}
                            >
                              <div className="flex items-center gap-2">
                                <span>Name</span>
                                <ArrowUpDown className="w-4 h-4" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/80 transition-colors"
                              onClick={() => handleSort("type")}
                            >
                              <div className="flex items-center gap-2">
                                <span>Type</span>
                                <ArrowUpDown className="w-4 h-4" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/80 transition-colors"
                              onClick={() => handleSort("address")}
                            >
                              <div className="flex items-center gap-2">
                                <span>Address</span>
                                <ArrowUpDown className="w-4 h-4" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/80 transition-colors"
                              onClick={() => handleSort("createdAt")}
                            >
                              <div className="flex items-center gap-2">
                                <span>Created</span>
                                <ArrowUpDown className="w-4 h-4" />
                              </div>
                            </TableHead>
                            <TableHead className="w-32 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedLocations.map((location) => (
                            <TableRow key={location._id} className="hover:bg-accent/50 transition-colors">
                              <TableCell>
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                                  {location.name.charAt(0).toUpperCase()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 dark:text-white">{location.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${getTypeColor(location.type)} px-2 py-1 text-xs`}>
                                  {location.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                  {location.address}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(location.createdAt)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 justify-end">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                                    onClick={() => openModal('view', location)}
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20"
                                    onClick={() => openModal('edit', location)}
                                    title="Edit Location"
                                  >
                                    <Edit className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                    onClick={() => handleDelete(location)}
                                    title="Delete Location"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pagination */}
              {totalPages > 1 && (
                <Card className="border-0 shadow-sm mt-6">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1} to {Math.min(endIndex, sortedLocations.length)} of {sortedLocations.length} results
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="hidden sm:inline">Previous</span>
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = i + 1;
                            return (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="w-8 h-8 p-0"
                              >
                                {page}
                              </Button>
                            )
                          })}
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-1"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
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
