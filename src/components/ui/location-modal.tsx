import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Badge } from './badge';
import { Checkbox } from './checkbox';
import { Location, CreateLocationRequest, geocodeAddress } from '../../lib/location';
import { MapPin, Loader2, Navigation, Globe, Info, CheckCircle, X } from 'lucide-react';

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
  const [enableGeocoding, setEnableGeocoding] = useState(true);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [coordinatesFound, setCoordinatesFound] = useState(false);

  useEffect(() => {
    if (location && mode === 'edit') {
      setFormData({
        name: location.name,
        type: location.type,
        address: location.address,
        coordinates: location.coordinates,
      });
      setCoordinatesFound(location.coordinates.latitude !== 0 && location.coordinates.longitude !== 0);
    } else {
      setFormData({
        name: '',
        type: '',
        address: '',
        coordinates: { latitude: 0, longitude: 0 },
      });
      setCoordinatesFound(false);
    }
  }, [location, mode]);

  const handleAddressChange = async (address: string) => {
    setFormData({ ...formData, address });
    setGeocodingError(null);

    if (enableGeocoding && address.trim()) {
      setGeocodingLoading(true);
      try {
        const coordinates = await geocodeAddress(address);
        setFormData(prev => ({
          ...prev,
          address,
          coordinates
        }));
        setCoordinatesFound(true);
      } catch (error) {
        setGeocodingError(error instanceof Error ? error.message : 'Failed to geocode address');
        setCoordinatesFound(false);
      } finally {
        setGeocodingLoading(false);
      }
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Get address from coordinates (reverse geocoding)
      try {
        const GOOGLE_MAPS_API_KEY = 'AIzaSyCqvcEKoqwRG5PBDIVp-MjHyjXKT3s4KY4';
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        let address = 'Current Location';
        if (data.status === 'OK' && data.results.length > 0) {
          address = data.results[0].formatted_address;
        }

        setFormData(prev => ({
          ...prev,
          address,
          coordinates: { latitude, longitude }
        }));
        setCoordinatesFound(true);
      } catch (error) {
        // If reverse geocoding fails, still use the coordinates
        setFormData(prev => ({
          ...prev,
          address: 'Current Location',
          coordinates: { latitude, longitude }
        }));
        setCoordinatesFound(true);
      }
    } catch (error) {
      setLocationError('Failed to get current location. Please check your browser permissions.');
      setCoordinatesFound(false);
    } finally {
      setLocationLoading(false);
    }
  };

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-600" />
            {getModalTitle()}
          </DialogTitle>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                <Info className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-medium text-gray-700">Basic Information</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1">Location Name</Label>
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
                  <Label htmlFor="type" className="text-sm font-medium text-gray-700 mb-1">Location Type</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="Enter location type (e.g., Room, Building, Floor)"
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                <MapPin className="w-4 h-4 text-green-500" />
                <h3 className="text-sm font-medium text-gray-700">Location Details</h3>
              </div>
              
              <div>
                <Label htmlFor="address" className="text-sm font-medium text-gray-700 mb-1">
                  Address
                  {enableGeocoding && (
                    <span className="ml-2 text-xs text-blue-600 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      Auto-geocode
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    placeholder="Enter address"
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  />
                  {geocodingLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
                {geocodingError && (
                  <p className="text-sm text-red-600 mt-1">{geocodingError}</p>
                )}
              </div>
            </div>

            {/* Location Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                <Navigation className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-medium text-gray-700">Location Options</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Checkbox
                    id="geocoding"
                    checked={enableGeocoding}
                    onCheckedChange={(checked) => setEnableGeocoding(checked as boolean)}
                  />
                  <Label htmlFor="geocoding" className="text-sm text-gray-700">
                    Automatically get coordinates from address
                  </Label>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Use current location</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="text-xs bg-white border-green-300 hover:border-green-500"
                  >
                    {locationLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Getting...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3 h-3 mr-1" />
                        Get Location
                      </>
                    )}
                  </Button>
                </div>
                {locationError && (
                  <p className="text-sm text-red-600">{locationError}</p>
                )}
              </div>
            </div>

            {/* Status Indicator */}
            {coordinatesFound && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  Coordinates found and ready to save
                </span>
              </div>
            )}

            {/* Hidden coordinates for form submission */}
            <input type="hidden" value={formData.coordinates.latitude} />
            <input type="hidden" value={formData.coordinates.longitude} />
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || geocodingLoading || locationLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Saving...' : mode === 'create' ? 'Create Location' : 'Update Location'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Location Details Component
const LocationDetails = ({ location }: { location: Location | null | undefined }) => {
  if (!location) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-600">Name</Label>
          <p className="text-sm text-gray-900 font-medium">{location.name}</p>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-600">Type</Label>
          <Badge variant="secondary" className="mt-1">{location.type}</Badge>
        </div>
      </div>
      
      <div>
        <Label className="text-sm font-medium text-gray-600">Address</Label>
        <p className="text-sm text-gray-900">{location.address}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-600">Latitude</Label>
          <p className="text-sm text-gray-900 font-mono">
            {location.coordinates.latitude.toFixed(6)}
          </p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600">Longitude</Label>
          <p className="text-sm text-gray-900 font-mono">
            {location.coordinates.longitude.toFixed(6)}
          </p>
        </div>
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