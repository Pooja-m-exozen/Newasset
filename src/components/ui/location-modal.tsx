import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Badge } from './badge';
import { Checkbox } from './checkbox';
import { ScrollArea } from './scroll-area';
import { Location, CreateLocationRequest, geocodeAddress } from '../../lib/location';
import { Loader2, Navigation, CheckCircle, AlertCircle, Calendar, Map, ExternalLink } from 'lucide-react';

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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    setFormErrors({});
  }, [location, mode]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Location name is required';
    }
    
    if (!formData.type.trim()) {
      errors.type = 'Location type is required';
    }
    
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    
    if (enableGeocoding && (!formData.coordinates.latitude || !formData.coordinates.longitude)) {
      errors.coordinates = 'Coordinates are required when geocoding is enabled';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddressChange = async (address: string) => {
    setFormData({ ...formData, address });
    setGeocodingError(null);
    setFormErrors(prev => ({ ...prev, address: '', coordinates: '' }));

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
      } catch {
        // If reverse geocoding fails, still use the coordinates
        setFormData(prev => ({
          ...prev,
          address: 'Current Location',
          coordinates: { latitude, longitude }
        }));
        setCoordinatesFound(true);
      }
    } catch  {
      setLocationError('Failed to get current location. Please check your browser permissions.');
      setCoordinatesFound(false);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
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

  const openInMaps = () => {
    if (formData.coordinates.latitude && formData.coordinates.longitude) {
      const url = `https://www.google.com/maps?q=${formData.coordinates.latitude},${formData.coordinates.longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {getModalTitle()}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Enter location details below' : 
             mode === 'edit' ? 'Update location information' : 
             'View location details'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'view' ? (
          <ScrollArea className="max-h-[60vh]">
            <LocationDetails location={location} onClose={onClose} />
          </ScrollArea>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Location Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setFormErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="Enter location name"
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.name}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Location Type *</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => {
                      setFormData({ ...formData, type: e.target.value });
                      setFormErrors(prev => ({ ...prev, type: '' }));
                    }}
                    placeholder="e.g., Office, Warehouse"
                    className={formErrors.type ? 'border-red-500' : ''}
                  />
                  {formErrors.type && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.type}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Location Details</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">
                    Address *
                    {enableGeocoding && (
                      <span className="ml-2 text-xs text-gray-500">(Auto-geocode enabled)</span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      placeholder="Enter full address"
                      className={`pr-10 ${formErrors.address ? 'border-red-500' : ''}`}
                    />
                    {geocodingLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                      </div>
                    )}
                  </div>
                  {formErrors.address && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.address}
                    </p>
                  )}
                  {geocodingError && (
                    <p className="text-sm text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {geocodingError}
                    </p>
                  )}
                </div>

                {/* Current Location Button */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Navigation className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">Use Current Location</p>
                        <p className="text-sm text-gray-600">Get coordinates from GPS</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                    >
                      {locationLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Getting...
                        </>
                      ) : (
                        'Get Location'
                      )}
                    </Button>
                  </div>
                  {locationError && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-3">
                      <AlertCircle className="w-4 h-4" />
                      {locationError}
                    </p>
                  )}
                </div>

                {/* Coordinates Display */}
                {coordinatesFound && (
                  <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">Coordinates Found</p>
                          <p className="text-sm text-green-600 font-mono">
                            Lat: {formData.coordinates.latitude.toFixed(6)}, 
                            Lng: {formData.coordinates.longitude.toFixed(6)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openInMaps}
                        className="text-green-700 border-green-300 hover:bg-green-100"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Map
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Settings</h3>
              
              <div className="flex items-start space-x-3 p-4 border rounded-lg bg-gray-50">
                <Checkbox
                  id="geocoding"
                  checked={enableGeocoding}
                  onCheckedChange={(checked) => setEnableGeocoding(checked as boolean)}
                />
                <div>
                  <Label htmlFor="geocoding" className="font-medium">
                    Automatic Coordinate Detection
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Automatically convert addresses to GPS coordinates
                  </p>
                </div>
              </div>

              {/* Form Validation Errors */}
              {formErrors.coordinates && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-700">
                      {formErrors.coordinates}
                    </p>
                  </div>
                </div>
              )}

              {/* Hidden coordinates for form submission */}
              <input type="hidden" value={formData.coordinates.latitude} />
              <input type="hidden" value={formData.coordinates.longitude} />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || geocodingLoading || locationLoading}
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

// Simple Location Details Component
const LocationDetails = ({ location, onClose }: { location: Location | null | undefined; onClose: () => void }) => {
  if (!location) return null;

  const openInMaps = () => {
    if (location.coordinates.latitude && location.coordinates.longitude) {
      const url = `https://www.google.com/maps?q=${location.coordinates.latitude},${location.coordinates.longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">Location Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">Name</Label>
            <p className="font-medium mt-1">{location.name}</p>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-600">Type</Label>
            <Badge variant="outline" className="mt-1">
              {location.type}
            </Badge>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-600">Created</Label>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-gray-500" />
              <p className="text-sm">{new Date(location.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">Address & Coordinates</h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">Full Address</Label>
            <p className="font-medium mt-1">{location.address}</p>
          </div>
          
          {location.coordinates && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Latitude</Label>
                <p className="font-mono text-sm mt-1">{location.coordinates.latitude.toFixed(6)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Longitude</Label>
                <p className="font-mono text-sm mt-1">{location.coordinates.longitude.toFixed(6)}</p>
              </div>
            </div>
          )}

          {location.coordinates && (
            <Button
              variant="outline"
              onClick={openInMaps}
              className="w-full"
            >
              <Map className="w-4 h-4 mr-2" />
              View on Google Maps
            </Button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}; 