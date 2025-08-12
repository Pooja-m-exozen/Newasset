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
import { 
  MapPin, 
  Loader2, 
  Navigation, 
  Globe, 
  Info, 
  CheckCircle, 
  X, 
  QrCode, 
  Barcode, 
  Wifi,
  RefreshCw,
  User,
  Zap
} from 'lucide-react';
import { QRGenerationModal } from './qr-generation-modal';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  asset?: Asset | null;
  assetTypes: AssetType[];
  onSubmit: (data: AssetFormData) => Promise<Asset | void>;
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
  assignedTo: string;
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

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  projectName: string;
  status: string;
  isVerified: boolean;
  workSchedule: {
    workingDays: any[];
  };
  specialization: any[];
  facilities: any[];
  certifications: any[];
  loginHistory: any[];
  activityLog: any[];
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
    assignedTo: '',
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
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [generatingTagId, setGeneratingTagId] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [createdAsset, setCreatedAsset] = useState<Asset | null>(null);
  const [assetCreationStatus, setAssetCreationStatus] = useState<'idle' | 'creating' | 'success' | 'ready-for-qr'>('idle');


  // Function to get display name for selected user
  const getSelectedUserName = (userId: string) => {
    const user = users.find(u => u._id === userId);
    return user ? user.name : userId;
  };

  // Function to get display email for selected user
  const getSelectedUserEmail = (userId: string) => {
    const user = users.find(u => u._id === userId);
    return user ? user.email : userId;
  };

  // Function to fetch all registered users from API
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('http://192.168.0.5:5021/api/admin', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.users) {
          setUsers(data.users);
          console.log('Users fetched successfully:', data.users);
        } else {
          console.error('Failed to fetch users:', data);
          setUsers([]);
        }
      } else {
        console.error('Failed to fetch users:', response.status);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Function to generate the next available Tag ID - Fast version
  const generateNextTagId = async () => {
    setGeneratingTagId(true);
    
    // Generate a fast fallback Tag ID immediately using timestamp
    const timestamp = Date.now();
    const fastFallbackTagId = `ASSET${timestamp.toString().slice(-6)}`;
    
    // Set the fast fallback immediately for better UX
    setFormData(prev => ({
      ...prev,
      tagId: fastFallbackTagId
    }));
    
    try {
      // Try to get the next sequential number from API (non-blocking)
      const response = await fetch('http://192.168.0.5:5021/api/admin/assets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.assets && data.assets.length > 0) {
          // Find the highest ASSET number
          let highestNumber = 0;
          data.assets.forEach((existingAsset: Asset) => {
            if (existingAsset.tagId && existingAsset.tagId.startsWith('ASSET')) {
              const numberPart = existingAsset.tagId.replace('ASSET', '');
              const number = parseInt(numberPart, 10);
              if (!isNaN(number) && number > highestNumber) {
                highestNumber = number;
              }
            }
          });
          
          // Generate next sequential Tag ID
          const nextNumber = highestNumber + 1;
          const sequentialTagId = `ASSET${nextNumber.toString().padStart(6, '0')}`;
          
          // Update with sequential ID if it's different from fallback
          if (sequentialTagId !== fastFallbackTagId) {
            setFormData(prev => ({
              ...prev,
              tagId: sequentialTagId
            }));
            console.log(`Updated to sequential Tag ID: ${sequentialTagId}`);
          }
        }
      } else {
        console.log('Using fallback Tag ID (API not available)');
      }
    } catch (error) {
      console.log('Using fallback Tag ID (API error)');
    } finally {
      setGeneratingTagId(false);
    }
  };

  // Function to generate Tag ID instantly (no API call)
  const generateInstantTagId = () => {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const instantTagId = `ASSET${timestamp.toString().slice(-6)}${randomSuffix}`;
    
    setFormData(prev => ({
      ...prev,
      tagId: instantTagId
    }));
    
    console.log(`Generated instant Tag ID: ${instantTagId}`);
  };

  // Auto-generate Tag ID when component mounts for new assets
  useEffect(() => {
    if (mode === 'create' && !asset) {
      // Generate Tag ID instantly first, then try to get sequential one
      generateInstantTagId();
      // Optionally try to get sequential ID in background (non-blocking)
      setTimeout(() => {
        generateNextTagId();
      }, 100);
    }
  }, [mode]);

  // Handle asset data when editing or creating
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
        assignedTo: typeof asset.assignedTo === 'string' ? asset.assignedTo : asset.assignedTo?._id || '', // Use asset's assignedTo ID for edit mode
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
    } else if (mode === 'create') {
      // For new assets, leave assignedTo empty so user can select
      setFormData(prev => ({
        ...prev,
        assignedTo: ''
      }));
      setCoordinatesFound(false);
      setAddressInput('');
    }
  }, [asset, mode]);

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);



  // Set current user ID when component mounts
  useEffect(() => {
    const userId = getCurrentUserId();
    const userEmail = getCurrentUserEmail();
    if (userId) {
      setCurrentUserId(userId);
    }
    if (userEmail) {
      setCurrentUserEmail(userEmail);
    }
  }, []);

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

  // Get current user ID from auth token
  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Decode JWT token to get user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
      }
    } catch (error) {
      console.error('Error decoding auth token:', error);
    }
    return null;
  };

  // Get current user email from auth token
  const getCurrentUserEmail = () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Decode JWT token to get user email
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.email;
      }
    } catch (error) {
      console.error('Error decoding auth token:', error);
    }
    return null;
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
    } catch {
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

  // Handle digital tag type change and show generation modal
  const handleDigitalTagTypeChange = (value: string) => {
    handleInputChange('digitalTagType', value);
    
    // Don't open modals automatically - just set the type
    // Modals will be opened after asset creation or manually
  };

  const handleDigitalTagGenerated = (updatedAsset: Asset) => {
    // Handle the generated digital tag and push into global state so views update immediately
    console.log('Digital tag generated for asset:', updatedAsset);
    setShowQRModal(false);
    setCreatedAsset(null);
    
    // Create a complete updated asset object with the new QR code data
    const completeUpdatedAsset: Asset = {
      ...createdAsset!, // Use the created asset as base
      ...updatedAsset,  // Override with any updates from QR generation
      digitalAssets: {
        ...createdAsset?.digitalAssets,
        ...updatedAsset.digitalAssets,
        qrCode: updatedAsset.digitalAssets?.qrCode || createdAsset?.digitalAssets?.qrCode
      }
    };
    
    // Call onSubmit with the updated asset to trigger parent component state update
    // This ensures the view modal immediately shows the new QR code
    if (onSubmit && typeof onSubmit === 'function') {
      onSubmit(completeUpdatedAsset as any).then(() => {
        console.log('Asset updated with QR code in parent component');
      }).catch((error) => {
        console.error('Error updating asset in parent component:', error);
      });
    }
    
    onClose();
  };

  const handleQRModalClose = () => {
    setShowQRModal(false);
    setCreatedAsset(null);
    
    // Close the main modal and show success message
    onClose();
  };

  const handleModalClose = () => {
    // Reset all states when modal is closed
    setAssetCreationStatus('idle');
    setCreatedAsset(null);
    setShowQRModal(false);
    onClose();
  };

  // Show digital tag generation options after asset creation
  const showDigitalTagOptions = () => {
    if (formData.digitalTagType) {
      switch (formData.digitalTagType) {
        case 'qr':
          setShowQRModal(true); // Set state to show QR modal
          break;
        case 'barcode':
          // setShowBarcodeModal(true); // Removed
          break;
        case 'nfc':
          // setShowNFCModal(true); // Removed
          break;
        case 'rfid':
          // RFID handled differently - just set the type
          break;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that assignedTo field has a valid user ID
    if (!formData.assignedTo || !formData.assignedTo.trim()) {
      console.error('No user ID available for assignment');
      return;
    }
    
    // assignedTo now contains the selected user's ID from the dropdown
    // This allows users to assign assets to any registered user
    
    try {
      // Set status to creating
      setAssetCreationStatus('creating');
      
      // Submit the asset and get the response
      const createdAsset = await onSubmit(formData);
      
      // If digital tag type is QR and we have a created asset, show the QR generation modal
      if (formData.digitalTagType === 'qr' && createdAsset && typeof createdAsset === 'object' && createdAsset._id) {
        console.log('Asset created successfully, waiting before showing QR generation modal:', createdAsset);
        
        // Set status to success first
        setAssetCreationStatus('success');
        
        // Create a proper asset object for the modal
        const assetForModal: Asset = {
          ...createdAsset,
          // Ensure all required fields are present
          tagId: createdAsset.tagId || formData.tagId,
          assetType: createdAsset.assetType || formData.assetType,
          brand: createdAsset.brand || formData.brand,
          location: createdAsset.location || formData.location,
          // Use the actual asset ID from the response
          _id: createdAsset._id
        };
        
        setCreatedAsset(assetForModal);
        
        // Wait for the asset to be fully processed and saved in the database
        setTimeout(() => {
          setAssetCreationStatus('ready-for-qr');
          
          // Show QR modal after user has seen the success message
          setTimeout(() => {
            setShowQRModal(true);
          }, 1000); // Wait 1 second after showing ready status
          
        }, 2000); // Wait 2 seconds for backend processing
        
        // Don't close the modal yet - let the user see the success message
        return;
      }
      
      // For non-QR assets or if QR generation is not needed, close the modal
      setAssetCreationStatus('idle');
      onClose();
      
    } catch (error) {
      console.error('Error submitting asset:', error);
      setAssetCreationStatus('idle');
      // Re-throw the error so the parent component can handle it
      throw error;
    }
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
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <div>
                <span>{getModalTitle()}</span>
                {formData.digitalTagType && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Digital Tag:</span>
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      {(() => {
                        switch (formData.digitalTagType) {
                          case 'qr':
                            return (
                              <div className="flex items-center gap-1">
                                <QrCode className="w-3 h-3 text-emerald-600" />
                                <span>QR Code</span>
                              </div>
                            );
                          case 'barcode':
                            return (
                              <div className="flex items-center gap-1">
                                <Barcode className="w-3 h-3 text-orange-600" />
                                <span>Barcode</span>
                              </div>
                            );
                          case 'nfc':
                            return (
                              <div className="flex items-center gap-1">
                                <Wifi className="w-3 h-3 text-purple-600" />
                                <span>NFC</span>
                              </div>
                            );
                          case 'rfid':
                            return (
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                                <span>RFID</span>
                              </div>
                            );
                          default:
                            return formData.digitalTagType;
                        }
                      })()}
                    </Badge>
                  </div>
                )}
              </div>
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
          {/* Asset Creation Status Messages */}
          {assetCreationStatus === 'creating' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Creating Asset...
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Please wait while we save your asset to the database.
                  </p>
                </div>
              </div>
            </div>
          )}

          {assetCreationStatus === 'success' && createdAsset && formData.digitalTagType === 'qr' && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Asset Created Successfully!
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Your asset "{createdAsset.tagId}" has been created and saved to the database.
                  </p>
                </div>
              </div>
            </div>
          )}

          {assetCreationStatus === 'ready-for-qr' && createdAsset && formData.digitalTagType === 'qr' && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                      Ready for QR Code Generation!
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                      Your asset "{createdAsset.tagId}" is ready. You can now generate a QR code for it.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowQRModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate QR Code
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleQRModalClose}
                    className="border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

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
                <Label htmlFor="tagId" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Tag ID *
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">
                    Auto-generated
                  </span>
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="tagId"
                    value={formData.tagId}
                    onChange={(e) => handleInputChange('tagId', e.target.value)}
                    placeholder="e.g., ASSET000001"
                    required
                    className="flex-1 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateInstantTagId}
                    className="border-green-300 dark:border-green-600 hover:border-green-500 dark:hover:border-green-400 text-green-700 dark:text-green-300"
                    title="Generate instant Tag ID (fast)"
                  >
                    <Zap className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateNextTagId}
                    disabled={generatingTagId}
                    className="border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300"
                    title="Generate sequential Tag ID (may take time)"
                  >
                    {generatingTagId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
        
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
                <div className="space-y-2">
                  <Select 
                    value={formData.digitalTagType} 
                    onValueChange={handleDigitalTagTypeChange}
                  >
                    <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <SelectValue placeholder="Select tag type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem value="qr" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <QrCode className="w-4 h-4 text-emerald-600" />
                          <span>QR Code</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="barcode" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <Barcode className="w-4 h-4 text-orange-600" />
                          <span>Barcode</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="rfid" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-600 rounded-sm"></div>
                          <span>RFID</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="nfc" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <Wifi className="w-4 h-4 text-purple-600" />
                          <span>NFC</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Info message when digital tag type is selected */}
                  {formData.digitalTagType && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
                        <div className="flex items-start space-x-2">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-blue-800 dark:text-blue-200">Digital Tag Generation</p>
                            <p className="text-blue-700 dark:text-blue-300 mt-1">
                              {(() => {
                                switch (formData.digitalTagType) {
                                  case 'qr':
                                    return 'QR Code will be generated after asset creation.';
                                  case 'barcode':
                                    return 'Barcode will be generated after asset creation.';
                                  case 'nfc':
                                    return 'NFC data will be generated after asset creation.';
                                  case 'rfid':
                                    return 'RFID configuration is ready.';
                                  default:
                                    return 'Digital tag generation is ready.';
                                }
                              })()}
                            </p>
                          </div>
                        </div>
                    </div>
                  )}
                </div>
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

              <div className="md:col-span-2">
                <Label htmlFor="assignedTo" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Assigned To
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">
                    Select from registered users
                  </span>
                </Label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(value) => handleInputChange('assignedTo', value)}
                >
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <div className="flex items-center justify-between w-full">
                      <span className={formData.assignedTo ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
                        {formData.assignedTo ? (() => {
                          const user = users.find(u => u._id === formData.assignedTo);
                          return user ? user.email : "Select user to assign asset to";
                        })() : "Select user to assign asset to"}
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {loadingUsers ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">Loading users...</div>
                    ) : users.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">No users found</div>
                    ) : (
                      users.map(user => (
                        <SelectItem key={user._id} value={user._id} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="font-medium">{user.email}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formData.assignedTo && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <div className="text-sm">
                        <span className="text-green-700 dark:text-green-300 font-medium">Selected: </span>
                        <span className="text-green-800 dark:text-green-200">
                          {(() => {
                            const user = users.find(u => u._id === formData.assignedTo);
                            return user ? user.email : 'Unknown User';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select a user from the dropdown. The system will submit the user's ID to the backend.
                </p>
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
            <Button type="button" variant="outline" onClick={handleModalClose} className="border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || geocodingLoading || locationLoading || assetCreationStatus === 'creating'}
              className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white"
            >
              {loading || assetCreationStatus === 'creating' ? 'Creating Asset...' : 
               assetCreationStatus === 'success' ? 'Asset Created - Processing...' :
               assetCreationStatus === 'ready-for-qr' ? 'Asset Ready - Generate QR Code' :
               mode === 'create' ? 'Create Asset' : 'Update Asset'}
            </Button>
          </div>
        </form>
      </DialogContent>
      {showQRModal && createdAsset && (
        <QRGenerationModal
          isOpen={showQRModal}
          asset={createdAsset}
          onClose={handleQRModalClose}
          onGenerated={handleDigitalTagGenerated}
        />
      )}
    </Dialog>
  );
}; 