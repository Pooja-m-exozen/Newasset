import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Textarea } from './textarea';
import { Checkbox } from './checkbox';
import { Badge } from './badge';
import { Asset, AssetType } from '../../lib/adminasset';
import { geocodeAddress } from '../../lib/location';
import { MapPin, Loader2, Navigation, Globe, Info, CheckCircle, X } from 'lucide-react';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  asset?: Asset | null;
  assetTypes: AssetType[];
  onSubmit: (data: AssetFormData) => Promise<void>;
  loading?: boolean;
}

interface AssetFormData {
  tagId: string;
  assetType: string;
  subcategory: string;
  brand: string;
  model: string;
  serialNumber: string;
  capacity: string;
  yearOfInstallation: string;
  projectName: string;
  priority: string;
  status: string;
  digitalTagType: string;
  tags: string[];
  notes: string;
  location: {
    latitude: string;
    longitude: string;
    building: string;
    floor: string;
    room: string;
  };
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  onClose,
  mode,
  asset,
  assetTypes,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    tagId: '',
    assetType: '',
    subcategory: '',
    brand: '',
    model: '',
    serialNumber: '',
    capacity: '',
    yearOfInstallation: '',
    projectName: '',
    priority: '',
    status: '',
    digitalTagType: '',
    tags: [] as string[],
    notes: '',
    location: {
      latitude: '0',
      longitude: '0',
      building: '',
      floor: '',
      room: ''
    }
  });

  const [tagInput, setTagInput] = useState('');
  const [enableGeocoding, setEnableGeocoding] = useState(true);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [coordinatesFound, setCoordinatesFound] = useState(false);
  const [addressInput, setAddressInput] = useState('');

  useEffect(() => {
    if (asset && mode === 'edit') {
      setFormData({
        tagId: asset.tagId || '',
        assetType: asset.assetType || '',
        subcategory: asset.subcategory || '',
        brand: asset.brand || '',
        model: asset.model || '',
        serialNumber: asset.serialNumber || '',
        capacity: asset.capacity || '',
        yearOfInstallation: asset.yearOfInstallation || '',
        projectName: asset.projectName || '',
        notes: asset.notes || '',
        priority: asset.priority || '',
        status: asset.status || '',
        digitalTagType: asset.digitalTagType || '',
        tags: asset.tags || [],
        location: {
          latitude: asset.location?.latitude || '0',
          longitude: asset.location?.longitude || '0',
          building: asset.location?.building || '',
          floor: asset.location?.floor || '',
          room: asset.location?.room || ''
        }
      });
      setCoordinatesFound((asset.location?.latitude || '0') !== '0' && (asset.location?.longitude || '0') !== '0');
    } else {
      setFormData({
        tagId: '',
        assetType: '',
        subcategory: '',
        brand: '',
        model: '',
        serialNumber: '',
        capacity: '',
        yearOfInstallation: '',
        projectName: '',
        priority: '',
        status: '',
        digitalTagType: '',
        tags: [],
        notes: '',
        location: {
          latitude: '0',
          longitude: '0',
          building: '',
          floor: '',
          room: ''
        }
      });
      setCoordinatesFound(false);
      setAddressInput('');
    }
  }, [asset, mode]);

  const handleInputChange = (field: string, value: string | string[]) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, string>),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAddressChange = async (address: string) => {
    setAddressInput(address);
    setGeocodingError(null);

    if (enableGeocoding && address.trim()) {
      setGeocodingLoading(true);
      try {
        const coordinates = await geocodeAddress(address);
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            latitude: coordinates.latitude.toString(),
            longitude: coordinates.longitude.toString()
          }
        }));
        setCoordinatesFound(true);
      } catch (err) {
        setGeocodingError(err instanceof Error ? err.message : 'Failed to geocode address');
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

        setAddressInput(address);
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            latitude: latitude.toString(),
            longitude: longitude.toString()
          }
        }));
        setCoordinatesFound(true);
      } catch {
        // If reverse geocoding fails, still use the coordinates
        setAddressInput('Current Location');
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            latitude: latitude.toString(),
            longitude: longitude.toString()
          }
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

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const getModalTitle = () => {
    return mode === 'create' ? 'Create New Asset' : 'Edit Asset';
  };

  // Status and Priority Preview Components
  const StatusPreview = ({ status }: { status: string }) => {
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'active': return 'bg-green-500 dark:bg-green-600 text-white';
        case 'inactive': return 'bg-red-500 dark:bg-red-600 text-white';
        case 'maintenance': return 'bg-yellow-500 dark:bg-yellow-600 text-white';
        case 'retired': return 'bg-gray-500 dark:bg-gray-600 text-white';
        default: return 'bg-gray-500 dark:bg-gray-600 text-white';
      }
    };

    return (
      <Badge className={`${getStatusColor(status)} font-medium text-xs px-2 py-1 rounded-full`}>
        {status || 'Not Set'}
      </Badge>
    );
  };

  const PriorityPreview = ({ priority }: { priority: string }) => {
    const getPriorityColor = (priority: string) => {
      switch (priority.toLowerCase()) {
        case 'high': return 'bg-red-500 dark:bg-red-600 text-white';
        case 'medium': return 'bg-yellow-500 dark:bg-yellow-600 text-white';
        case 'low': return 'bg-green-500 dark:bg-green-600 text-white';
        case 'critical': return 'bg-red-700 dark:bg-red-800 text-white';
        default: return 'bg-gray-500 dark:bg-gray-600 text-white';
      }
    };

    return (
      <Badge className={`${getPriorityColor(priority)} font-medium text-xs px-2 py-1 rounded-full`}>
        {priority || 'Not Set'}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <span>{getModalTitle()}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg flex items-center justify-center">
                <Info className="w-3 h-3 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="tagId" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Tag ID *</Label>
                <Input
                  id="tagId"
                  value={formData.tagId}
                  onChange={(e) => handleInputChange('tagId', e.target.value)}
                  placeholder="e.g., ASSET099000"
                  required
                  className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              
              <div>
                <Label htmlFor="assetType" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Asset Type *</Label>
                <Select 
                  value={formData.assetType} 
                  onValueChange={(value) => handleInputChange('assetType', value)}
                >
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {assetTypes.map(type => (
                      <SelectItem key={type._id} value={type.name} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Subcategory</Label>
                <Input
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={(e) => handleInputChange('subcategory', e.target.value)}
                  placeholder="e.g., computer"
                  className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="brand" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Brand *</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="e.g., Dell"
                  required
                  className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="model" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="e.g., OptiPlex 7090"
                  className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="serialNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                  placeholder="e.g., SN123456788888"
                  className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="capacity" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Capacity</Label>
                <Input
                  id="capacity"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                  placeholder="e.g., 16GB RAM, 512GB SSD"
                  className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="yearOfInstallation" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Year of Installation</Label>
                <Input
                  id="yearOfInstallation"
                  value={formData.yearOfInstallation}
                  onChange={(e) => handleInputChange('yearOfInstallation', e.target.value)}
                  placeholder="e.g., 2023"
                  className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Priority</Label>
                <div className="space-y-2">
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem value="low" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Low</SelectItem>
                      <SelectItem value="medium" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Medium</SelectItem>
                      <SelectItem value="high" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">High</SelectItem>
                      <SelectItem value="critical" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.priority && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Preview:</span>
                      <PriorityPreview priority={formData.priority} />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Status</Label>
                <div className="space-y-2">
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem value="active" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Active</SelectItem>
                      <SelectItem value="inactive" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Inactive</SelectItem>
                      <SelectItem value="maintenance" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Maintenance</SelectItem>
                      <SelectItem value="retired" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.status && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Preview:</span>
                      <StatusPreview status={formData.status} />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="digitalTagType" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Digital Tag Type</Label>
                <Select 
                  value={formData.digitalTagType} 
                  onValueChange={(value) => handleInputChange('digitalTagType', value)}
                >
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <SelectValue placeholder="Select tag type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectItem value="qr" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">QR Code</SelectItem>
                    <SelectItem value="barcode" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Barcode</SelectItem>
                    <SelectItem value="rfid" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">RFID</SelectItem>
                    <SelectItem value="nfc" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">NFC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="projectName" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Project Name</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => handleInputChange('projectName', e.target.value)}
                  placeholder="e.g., Digital Transformation"
                  className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg flex items-center justify-center">
                <MapPin className="w-3 h-3 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Location Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="building" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Building</Label>
                <Input
                  id="building"
                  value={formData.location.building}
                  onChange={(e) => handleInputChange('location.building', e.target.value)}
                  placeholder="e.g., Main Building"
                  className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="floor" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Floor</Label>
                <Input
                  id="floor"
                  value={formData.location.floor}
                  onChange={(e) => handleInputChange('location.floor', e.target.value)}
                  placeholder="e.g., 2nd Floor"
                  className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="room" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Room</Label>
                <Input
                  id="room"
                  value={formData.location.room}
                  onChange={(e) => handleInputChange('location.room', e.target.value)}
                  placeholder="e.g., IT Department"
                  className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Address
                  {enableGeocoding && (
                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      Auto-geocode
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="address"
                    value={addressInput}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    placeholder="Enter address for automatic coordinate detection"
                    className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pr-10"
                  />
                  {geocodingLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500 dark:text-blue-400" />
                    </div>
                  )}
                </div>
                {geocodingError && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center">
                    <X className="w-4 h-4 mr-1" />
                    {geocodingError}
                  </p>
                )}
              </div>
            </div>

            {/* Location Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                <Checkbox
                  id="geocoding"
                  checked={enableGeocoding}
                  onCheckedChange={(checked) => setEnableGeocoding(checked as boolean)}
                />
                <Label htmlFor="geocoding" className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Automatically get coordinates from address
                </Label>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                <div className="flex items-center space-x-3">
                  <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Use current location</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="text-xs bg-white dark:bg-gray-800 border-green-300 dark:border-green-600 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-300"
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
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {locationError}
                </p>
              )}
            </div>

            {/* Status Indicator */}
            {coordinatesFound && (
              <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                  Coordinates found and ready to save
                </span>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-lg flex items-center justify-center">
                <Info className="w-3 h-3 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Information</h3>
            </div>
            
            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="e.g., High-performance workstation for development"
                rows={4}
                className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Tags</Label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    className="flex-1 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTagAdd();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleTagAdd} variant="outline" className="border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300">
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-700">
                        <span className="text-sm text-blue-700 dark:text-blue-400">{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleTagRemove(tag)}
                          className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} className="border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || geocodingLoading || locationLoading}
              className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white"
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Asset' : 'Update Asset'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 