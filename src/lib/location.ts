const API_BASE_URL = 'https://digitalasset.zenapi.co.in/api'

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  _id: string;
  name: string;
  type: string;
  parentId: string | null;
  address: string;
  coordinates: LocationCoordinates;
  isDeleted: boolean;
  createdBy: string;
  createdAt: string;
  __v: number;
}

export interface CreateLocationRequest {
  name: string;
  type: string;
  parentId?: string | null;
  address: string;
  coordinates: LocationCoordinates;
}

export interface UpdateLocationRequest {
  name?: string;
  type?: string;
  parentId?: string | null;
  address?: string;
  coordinates?: LocationCoordinates;
}

export interface ApiResponse<T> {
  success: boolean;
  locations?: T[];
  location?: T;
  message?: string;
}

// Google Maps Geocoding Response Interface
export interface GoogleMapsGeocodingResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
  status: string;
}

// Get token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// Geocoding function to convert address to coordinates
export const geocodeAddress = async (address: string): Promise<LocationCoordinates> => {
  const GOOGLE_MAPS_API_KEY = 'AIzaSyCqvcEKoqwRG5PBDIVp-MjHyjXKT3s4KY4';
  
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    console.log('Geocoding URL:', url);

    const response = await fetch(url);
    const data: GoogleMapsGeocodingResponse = await response.json();
    
    console.log('Geocoding response:', data);
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng
      };
    } else {
      throw new Error(`Geocoding failed: ${data.status}`);
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw new Error('Failed to geocode address. Please check the address or try again.');
  }
};

// Reverse geocoding function to convert coordinates to address
export const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
  const GOOGLE_MAPS_API_KEY = 'AIzaSyCqvcEKoqwRG5PBDIVp-MjHyjXKT3s4KY4';
  
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    console.log('Reverse geocoding URL:', url);

    const response = await fetch(url);
    const data: GoogleMapsGeocodingResponse = await response.json();
    
    console.log('Reverse geocoding response:', data);
    
    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address;
    } else {
      throw new Error(`Reverse geocoding failed: ${data.status}`);
    }
  } catch (error) {
    console.error('Error reverse geocoding coordinates:', error);
    throw new Error('Failed to get address from coordinates. Please try again.');
  }
};

// Generic API request function with authentication
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication token not found');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };

  // Only add Content-Type for JSON requests
  if (!(options.body instanceof FormData)) {
    config.headers = {
      ...config.headers,
      'Content-Type': 'application/json',
    };
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};

// Get all locations
export const getLocations = async (): Promise<Location[]> => {
  try {
    const data: ApiResponse<Location> = await apiRequest<ApiResponse<Location>>('/locations');
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch locations');
    }

    return data.locations || [];
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
};

// Create a new location
export const createLocation = async (locationData: CreateLocationRequest): Promise<Location> => {
  try {
    const data: ApiResponse<Location> = await apiRequest<ApiResponse<Location>>('/locations', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to create location');
    }

    return data.location || {} as Location;
  } catch (error) {
    console.error('Error creating location:', error);
    throw error;
  }
};

// Update a location
export const updateLocation = async (id: string, locationData: UpdateLocationRequest): Promise<Location> => {
  try {
    const data: ApiResponse<Location> = await apiRequest<ApiResponse<Location>>(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update location');
    }

    return data.location || {} as Location;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

// Delete a location (soft delete)
export const deleteLocation = async (id: string): Promise<void> => {
  try {
    const data: ApiResponse<Location> = await apiRequest<ApiResponse<Location>>(`/locations/${id}`, {
      method: 'DELETE',
    });
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete location');
    }
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
};

// Get location by ID
export const getLocationById = async (id: string): Promise<Location> => {
  try {
    const data: ApiResponse<Location> = await apiRequest<ApiResponse<Location>>(`/locations/${id}`);
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch location');
    }

    return data.location || {} as Location;
  } catch (error) {
    console.error('Error fetching location:', error);
    throw error;
  }
}; 