import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Badge } from './badge';
import { Checkbox } from './checkbox';
import { ScrollArea } from './scroll-area';
import { Location, CreateLocationRequest, geocodeAddress } from '../../lib/location';
import { MapPin, Loader2, Navigation, Globe, Info, CheckCircle, Building, X, AlertCircle, Calendar, Map, ExternalLink } from 'lucide-react';

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

  const getModalIcon = () => {
    switch (mode) {
      case 'create': return 'bg-green-500';
      case 'edit': return 'bg-blue-500';
      case 'view': return 'bg-purple-500';
      default: return 'bg-green-500';
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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col w-[95vw] sm:w-auto">
        {mode !== 'view' && (
          <DialogHeader className="flex-shrink-0 pb-4">
            <div className="text-center">
              <div className="mx-auto mb-4">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 ${getModalIcon()} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg`}>
                  <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-lg sm:text-xl font-semibold">
                {getModalTitle()}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm sm:text-base">
                {mode === 'create' ? 'Enter the location details below' : 'Update the location information'}
              </DialogDescription>
            </div>
          </DialogHeader>
        )}
        
        {mode === 'view' ? (
          <ScrollArea className="flex-1 max-h-[60vh]">
            <LocationDetails location={location} onClose={onClose} />
          </ScrollArea>
        ) : (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 max-h-[60vh]">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Basic Information */}
                <div className="bg-muted/50 rounded-lg p-4 sm:p-6 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold">Basic Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-semibold mb-2 block">
                        Location Name *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          setFormErrors(prev => ({ ...prev, name: '' }));
                        }}
                        placeholder="Enter location name"
                        required
                        className={`h-10 sm:h-11 ${formErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {formErrors.name && (
                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.name}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="type" className="text-sm font-semibold mb-2 block">
                        Location Type *
                      </Label>
                      <Input
                        id="type"
                        value={formData.type}
                        onChange={(e) => {
                          setFormData({ ...formData, type: e.target.value });
                          setFormErrors(prev => ({ ...prev, type: '' }));
                        }}
                        placeholder="e.g., Office, Warehouse, Factory"
                        required
                        className={`h-10 sm:h-11 ${formErrors.type ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {formErrors.type && (
                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.type}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location Details */}
                <div className="bg-muted/50 rounded-lg p-4 sm:p-6 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold">Location Details</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address" className="text-sm font-semibold mb-2 block">
                        Address *
                        {enableGeocoding && (
                          <span className="ml-2 text-xs text-green-600 flex items-center">
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
                          placeholder="Enter full address"
                          required
                          className={`h-10 sm:h-11 pr-10 ${formErrors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {geocodingLoading && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-green-500" />
                          </div>
                        )}
                      </div>
                      {formErrors.address && (
                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.address}
                        </p>
                      )}
                      {geocodingError && (
                        <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {geocodingError}
                        </p>
                      )}
                    </div>

                    {/* Coordinates Display */}
                    {coordinatesFound && (
                      <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 sm:p-4 border border-green-200 dark:border-green-800">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-800 dark:text-green-300">Coordinates Found</p>
                              <p className="text-xs text-green-600 dark:text-green-400">
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
                            className="text-green-600 border-green-300 hover:bg-green-100 w-full sm:w-auto"
                          >
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span className="hidden sm:inline">View on Map</span>
                            <span className="sm:hidden">View Map</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Options */}
                <div className="bg-muted/50 rounded-lg p-4 sm:p-6 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Navigation className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold">Location Options</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Checkbox
                        id="geocoding"
                        checked={enableGeocoding}
                        onCheckedChange={(checked) => setEnableGeocoding(checked as boolean)}
                        className="border-blue-300 mt-0.5"
                      />
                      <Label htmlFor="geocoding" className="text-sm font-medium leading-relaxed">
                        Automatically get coordinates from address
                      </Label>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        <span className="text-sm font-medium">Use current location</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={getCurrentLocation}
                        disabled={locationLoading}
                        className="text-sm bg-white border-green-300 hover:border-green-500 text-green-700 w-full sm:w-auto"
                      >
                        {locationLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span className="hidden sm:inline">Getting...</span>
                            <span className="sm:hidden">Getting...</span>
                          </>
                        ) : (
                          <>
                            <Navigation className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Get Location</span>
                            <span className="sm:hidden">Get Location</span>
                          </>
                        )}
                      </Button>
                    </div>
                    {locationError && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {locationError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Form Validation Errors */}
                {formErrors.coordinates && (
                  <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {formErrors.coordinates}
                      </p>
                    </div>
                  </div>
                )}

                {/* Hidden coordinates for form submission */}
                <input type="hidden" value={formData.coordinates.latitude} />
                <input type="hidden" value={formData.coordinates.longitude} />
              </form>
            </ScrollArea>
            
            {/* Fixed Footer */}
            <div className="flex-shrink-0 flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-border mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="px-6 order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || geocodingLoading || locationLoading}
                onClick={handleSubmit}
                className="px-6 order-1 sm:order-2"
              >
                {loading ? 'Saving...' : mode === 'create' ? 'Create Location' : 'Update Location'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Enhanced Location Details Component
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
      {/* Enhanced Header */}
      <div className="text-center pb-6 border-b border-border">
        <div className="mx-auto mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <MapPin className="w-10 h-10 text-white" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{location.name}</h2>
          <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
            {location.type}
          </Badge>
        </div>
      </div>

      {/* Location Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information Card */}
        <div className="bg-muted/30 rounded-lg p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">Location Details</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Name</Label>
              <p className="text-base font-medium mt-1">{location.name}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Type</Label>
              <Badge variant="outline" className="mt-1">
                {location.type}
              </Badge>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Created</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm">{new Date(location.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Address Information Card */}
        <div className="bg-muted/30 rounded-lg p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Address</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Full Address</Label>
              <p className="text-base font-medium mt-1">{location.address}</p>
            </div>
            
            {location.coordinates && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Latitude</Label>
                  <p className="text-sm font-mono mt-1">{location.coordinates.latitude.toFixed(6)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Longitude</Label>
                  <p className="text-sm font-mono mt-1">{location.coordinates.longitude.toFixed(6)}</p>
                </div>
              </div>
            )}

            {location.coordinates && (
              <Button
                variant="outline"
                onClick={openInMaps}
                className="w-full mt-2 text-green-600 border-green-300 hover:bg-green-100"
              >
                <Map className="w-4 h-4 mr-2" />
                View on Google Maps
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-muted/30 rounded-lg p-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Info className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold">Additional Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
              <p className="text-sm font-medium">Active</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Verified</p>
              <p className="text-sm font-medium">Yes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Coordinates</p>
              <p className="text-sm font-medium">
                {location.coordinates && location.coordinates.latitude ? 'Available' : 'Not Available'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-border">
        <Button 
          variant="outline" 
          onClick={onClose}
          className="px-6 order-2 sm:order-1"
        >
          Close
        </Button>
        <Button 
          className="px-6 order-1 sm:order-2"
        >
          Edit Location
        </Button>
      </div>
    </div>
  );
}; 