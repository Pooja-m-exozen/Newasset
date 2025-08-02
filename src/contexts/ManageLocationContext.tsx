'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Location, 
  CreateLocationRequest, 
  UpdateLocationRequest,
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getLocationById
} from '../lib/location';

interface ManageLocationContextType {
  locations: Location[];
  loading: boolean;
  error: string | null;
  selectedLocation: Location | null;
  isModalOpen: boolean;
  modalMode: 'create' | 'edit' | 'view';
  
  // Actions
  fetchLocations: () => Promise<void>;
  addLocation: (locationData: CreateLocationRequest) => Promise<void>;
  editLocation: (id: string, locationData: UpdateLocationRequest) => Promise<void>;
  removeLocation: (id: string) => Promise<void>;
  selectLocation: (location: Location | null) => void;
  openModal: (mode: 'create' | 'edit' | 'view', location?: Location) => void;
  closeModal: () => void;
  clearError: () => void;
}

const ManageLocationContext = createContext<ManageLocationContextType | undefined>(undefined);

export const useManageLocation = () => {
  const context = useContext(ManageLocationContext);
  if (context === undefined) {
    throw new Error('useManageLocation must be used within a ManageLocationProvider');
  }
  return context;
};

interface ManageLocationProviderProps {
  children: ReactNode;
}

export const ManageLocationProvider: React.FC<ManageLocationProviderProps> = ({ children }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLocations();
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  const addLocation = async (locationData: CreateLocationRequest) => {
    try {
      setLoading(true);
      setError(null);
      const newLocation = await createLocation(locationData);
      setLocations(prev => [...prev, newLocation]);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create location');
    } finally {
      setLoading(false);
    }
  };

  const editLocation = async (id: string, locationData: UpdateLocationRequest) => {
    try {
      setLoading(true);
      setError(null);
      const updatedLocation = await updateLocation(id, locationData);
      setLocations(prev => 
        prev.map(location => 
          location._id === id ? updatedLocation : location
        )
      );
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  const removeLocation = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteLocation(id);
      setLocations(prev => prev.filter(location => location._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete location');
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (location: Location | null) => {
    setSelectedLocation(location);
  };

  const openModal = (mode: 'create' | 'edit' | 'view', location?: Location) => {
    setModalMode(mode);
    if (location) {
      setSelectedLocation(location);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLocation(null);
    setModalMode('create');
  };

  const clearError = () => {
    setError(null);
  };

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations();
  }, []);

  const value: ManageLocationContextType = {
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
    selectLocation,
    openModal,
    closeModal,
    clearError,
  };

  return (
    <ManageLocationContext.Provider value={value}>
      {children}
    </ManageLocationContext.Provider>
  );
};
