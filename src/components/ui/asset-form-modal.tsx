import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Textarea } from './textarea';
import { Checkbox } from './checkbox';
import { Badge } from './badge';
import { Asset, AssetType } from '../../lib/adminasset';
import { geocodeAddress, reverseGeocode } from '../../lib/location';
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
  User
} from 'lucide-react';
import { QRGenerationModal } from './qr-generation-modal';
import { useAuth } from '../../contexts/AuthContext';

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
  project: {
    projectId: string;
  projectName: string;
  };
  assignedTo: string;
  priority: string;
  status: string;
  digitalTagType: string;
  tags: string[];
  notes: string;
  customFields: Record<string, string>;
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
    workingDays: string[];
  };
  specialization: string[];
  facilities: string[];
  certifications: string[];
  loginHistory: string[];
  activityLog: string[];
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
  const { user } = useAuth();
  // Form state
  const [formData, setFormData] = useState({
    tagId: '', assetType: '', subcategory: '', brand: '', model: '', serialNumber: '', capacity: '', yearOfInstallation: '',
    project: { projectId: '', projectName: '' }, assignedTo: '', priority: '', status: '', digitalTagType: '',
    tags: [] as string[], notes: '', customFields: {} as Record<string, string>,
    location: { latitude: '0', longitude: '0', building: '', floor: '', room: '' }
  });

  // UI state
  const [tagInput, setTagInput] = useState('');
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const [addressInput, setAddressInput] = useState('');
  
  // Loading states
  const [generatingSerialNumber, setGeneratingSerialNumber] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Feature toggles
  const [enableGeocoding, setEnableGeocoding] = useState(true);
  const [coordinatesFound, setCoordinatesFound] = useState(false);
  
  // Error states
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Modal states
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Array<{
    _id: string;
    name: string;
    code: string;
    description: string;
    status: string;
  }>>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [createdAsset, setCreatedAsset] = useState<Asset | null>(null);
  const [assetCreationStatus, setAssetCreationStatus] = useState<'idle' | 'creating' | 'success' | 'ready-for-qr'>('idle');

  // Fetch data functions
  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const response = await fetch('http://192.168.0.5:5021/api/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.projects) {
          setProjects(data.projects);
          console.log('Fetched projects:', data.projects);
        } else {
          setProjects([]);
        }
      } else {
        setProjects([]);
      }
    } catch {
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      // Only fetch users if we have a project name to filter by
      if (!user?.projectName) {
        console.warn('No project name available, skipping user fetch');
        setUsers([]);
        return;
      }

      // Try to fetch users with project filter first
      let response = await fetch(`http://192.168.0.5:5021/api/admin?projectName=${encodeURIComponent(user.projectName)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.users) {
          // Filter users to only show those from the current user's project
          const filteredUsers = data.users.filter((userItem: User) => 
            userItem.projectName === user?.projectName
          );
          setUsers(filteredUsers);
          console.log(`Filtered users for project "${user?.projectName}":`, filteredUsers);
        } else {
          setUsers([]);
        }
      } else {
        // Fallback: fetch all users and filter client-side
        console.log('Project filter query failed, falling back to client-side filtering');
        response = await fetch('http://192.168.0.5:5021/api/admin', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.users) {
            // Filter users to only show those from the current user's project
            const filteredUsers = data.users.filter((userItem: User) => 
              userItem.projectName === user?.projectName
            );
            setUsers(filteredUsers);
            console.log(`Client-side filtered users for project "${user?.projectName}":`, filteredUsers);
          } else {
            setUsers([]);
          }
        } else {
          setUsers([]);
        }
      }
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [user?.projectName]);

  const fetchUsersForProject = useCallback(async (projectName: string) => {
    setLoadingUsers(true);
    try {
      // Try to fetch users with project filter first
      let response = await fetch(`http://192.168.0.5:5021/api/admin?projectName=${encodeURIComponent(projectName)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.users) {
          // Filter users to only show those from the selected project
          const filteredUsers = data.users.filter((userItem: User) => 
            userItem.projectName === projectName
          );
          setUsers(filteredUsers);
          console.log(`Filtered users for project "${projectName}":`, filteredUsers);
        } else {
          setUsers([]);
        }
      } else {
        // Fallback: fetch all users and filter client-side
        console.log('Project filter query failed, falling back to client-side filtering');
        response = await fetch('http://192.168.0.5:5021/api/admin', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.users) {
            // Filter users to only show those from the selected project
            const filteredUsers = data.users.filter((userItem: User) => 
              userItem.projectName === projectName
            );
            setUsers(filteredUsers);
            console.log(`Client-side filtered users for project "${projectName}":`, filteredUsers);
          } else {
            setUsers([]);
          }
        } else {
          setUsers([]);
        }
      }
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Generate unique IDs
  const generateTagId = () => {
    // Get project name initials (first letter of each word)
    const projectName = user?.projectName || '';
    const projectInitials = projectName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('');
    
    // Get asset type initial (first letter)
    const assetTypeInitial = formData.assetType ? formData.assetType.charAt(0).toUpperCase() : 'A';
    
    // Generate sequential number (you might want to get this from backend in production)
    const timestamp = Date.now();
    const sequentialNumber = (timestamp % 1000).toString().padStart(3, '0');
    
    // Format: ProjectInitials + AssetTypeInitial + SequentialNumber
    // Example: "Sriram Suhana Project" + "Laptop" + "001" = "SSPL001"
    const tagId = `${projectInitials}${assetTypeInitial}${sequentialNumber}`;
    
    setFormData(prev => ({ ...prev, tagId }));
  };

  const generateSerialNumber = () => {
    setGeneratingSerialNumber(true);
    
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const serialNumber = `SN${timestamp.toString().slice(-8)}${randomSuffix}`;
    
    setFormData(prev => ({ ...prev, serialNumber }));
    setGeneratingSerialNumber(false);
  };

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      fetchProjects(); // Fetch available projects
      fetchUsers();
      
      // Debug: Log user context to understand what's available
      console.log('User context in AssetFormModal:', {
        user,
        projectId: user?.projectId,
        projectName: user?.projectName,
        hasProjectId: !!user?.projectId,
        hasProjectName: !!user?.projectName
      });
      console.log('Note: If projectId is missing, the system will use projectName as the identifier');
      console.log(`Will filter users by project: "${user?.projectName}"`);
      
      if (asset && mode === 'edit') {
        // Edit mode: populate with existing asset data
        setFormData({
          tagId: asset.tagId || '', assetType: asset.assetType || '', subcategory: asset.subcategory || '',
          brand: asset.brand || '', model: asset.model || '', serialNumber: asset.serialNumber || '',
          capacity: asset.capacity || '', yearOfInstallation: asset.yearOfInstallation || '',
          project: { projectId: asset.project?.projectId || '', projectName: asset.project?.projectName || '' },
          assignedTo: typeof asset.assignedTo === 'string' ? asset.assignedTo : asset.assignedTo?._id || '',
          notes: asset.notes || '', priority: asset.priority || '', status: asset.status || '',
          digitalTagType: asset.digitalTagType || '', tags: asset.tags || [], customFields: asset.customFields || {},
          location: {
            latitude: asset.location?.latitude || '0', longitude: asset.location?.longitude || '0',
            building: asset.location?.building || '', floor: asset.location?.floor || '', room: asset.location?.room || ''
          }
        });
        setCoordinatesFound((asset.location?.latitude || '0') !== '0' && (asset.location?.longitude || '0') !== '0');
        
        // Fetch users for the asset's project if it has one
        if (asset.project?.projectName) {
          fetchUsersForProject(asset.project.projectName);
          console.log(`Editing asset for project: "${asset.project.projectName}"`);
        }
      } else if (mode === 'create') {
        // Create mode: set defaults and generate IDs
        setFormData(prev => ({
          ...prev, 
          tagId: '', // Start with empty Tag ID
          assignedTo: '', 
          project: { 
            projectId: user?.projectId || user?.projectName || '', // Use projectName as fallback if projectId is missing
            projectName: user?.projectName || '' 
          }
        }));
        
        // Ensure project is set from user context
        if (user?.projectName) {
          setFormData(prev => ({
            ...prev,
            project: {
              projectId: user.projectId || user.projectName || '', // Use projectName as fallback if projectId is missing
              projectName: user.projectName || ''
            }
          }));
          
          // Fetch users for the default project
          fetchUsersForProject(user.projectName);
          console.log(`Creating asset for project: "${user.projectName}"`);
        }
        
        // Don't generate initial tag ID - let user select asset type first
        // generateSerialNumber(); // Keep this if you want serial number auto-generated
        setCoordinatesFound(false);
        setAddressInput('');
      }
    }
  }, [isOpen, mode, asset, user, fetchUsers, fetchUsersForProject, fetchProjects]);





  const handleInputChange = (field: string, value: string | string[]) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...(prev[parent as keyof typeof prev] as Record<string, string>), [child]: value }
      }));
      
      // Check if coordinates are valid when manually entered
      if (parent === 'location' && (child === 'latitude' || child === 'longitude')) {
        const lat = parent === 'location' && child === 'latitude' ? value : formData.location.latitude;
        const lng = parent === 'location' && child === 'longitude' ? value : formData.location.longitude;
        
        if (lat && lng && lat !== '0' && lng !== '0') {
          const latNum = parseFloat(lat as string);
          const lngNum = parseFloat(lng as string);
          
          if (!isNaN(latNum) && !isNaN(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180) {
            setCoordinatesFound(true);
            setGeocodingError(null);
            
            // Get address name from coordinates
            getAddressFromCoordinates(lat as string, lng as string);
          }
        }
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
      
      // Auto-generate tag ID when asset type changes
      if (field === 'assetType' && value) {
        // Generate new Tag ID immediately when asset type changes
        generateTagId();
      }
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
          location: { ...prev.location, latitude: coordinates.latitude.toString(), longitude: coordinates.longitude.toString() }
        }));
        setCoordinatesFound(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to geocode address';
        setGeocodingError(errorMessage);
        setCoordinatesFound(false);
        
        // Clear the address input when geocoding fails to show it's not working
        setAddressInput('');
        
        // If geocoding fails, still allow manual coordinate entry
        console.warn('Geocoding failed, allowing manual coordinate entry:', errorMessage);
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
      
      // Update form data with coordinates
        setFormData(prev => ({
          ...prev,
        location: { ...prev.location, latitude: latitude.toString(), longitude: longitude.toString() }
        }));
        setCoordinatesFound(true);
      setGeocodingError(null); // Clear any previous geocoding errors
      
      // Get address name from coordinates
      await getAddressFromCoordinates(latitude.toString(), longitude.toString());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLocationError(`Failed to get current location: ${errorMessage}. Please check your browser permissions or try manual entry.`);
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

  const handleCustomFieldAdd = () => {
    if (customFieldName.trim() && customFieldValue.trim()) {
      setFormData(prev => ({
        ...prev,
        customFields: { ...prev.customFields, [customFieldName.trim()]: customFieldValue.trim() }
      }));
      setCustomFieldName('');
      setCustomFieldValue('');
    }
  };



  // Get address name from coordinates
  const getAddressFromCoordinates = async (latitude: string, longitude: string) => {
    if (latitude && longitude && latitude !== '0' && longitude !== '0') {
      try {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          const address = await reverseGeocode(lat, lng);
          setAddressInput(address);
          console.log('Address from coordinates:', address);
        }
      } catch (error) {
        console.warn('Failed to get address from coordinates:', error);
        // Keep the current address input if reverse geocoding fails
      }
    }
  };

  // Handle digital tag type change and show generation modal
  const handleDigitalTagTypeChange = (value: string) => {
    handleInputChange('digitalTagType', value);
    
    // Don't open modals automatically - just set the type
    // Modals will be opened after asset creation or manually
  };

  const handleProjectChange = (projectId: string) => {
    const selectedProject = projects.find(p => p._id === projectId);
    if (selectedProject) {
      setFormData(prev => ({
        ...prev,
        project: {
          projectId: selectedProject._id,
          projectName: selectedProject.name
        }
      }));
      
      // Fetch users for the selected project
      fetchUsersForProject(selectedProject.name);
      console.log(`Project changed to: "${selectedProject.name}" (ID: ${selectedProject._id})`);
    }
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
      onSubmit(completeUpdatedAsset as unknown as AssetFormData).then(() => {
        console.log('Asset updated with QR code in parent component');
      }).catch(() => {
        // Handle error silently
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



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug: Log current form data
    console.log('Current form data:', formData);
    console.log('Project data:', formData.project);
    console.log('User project data:', { projectId: user?.projectId, projectName: user?.projectName });
    console.log('Note: If projectId is missing, projectName will be used as the identifier');
    
    // Validate required fields
    if (!formData.assignedTo?.trim()) {
      alert('Please select a user to assign the asset to.');
      return;
    }
    
    // Validate project data is set from logged-in user
    if (!formData.project.projectName) {
      alert('Please select a project for this asset.');
      return;
    }
    
    try {
      // Ensure project data is set from selected project
      const formDataWithUserProject = {
        ...formData,
        project: {
          projectId: formData.project.projectId, // This will be the ID for backend
          projectName: formData.project.projectName // This will be the name for display
        }
      };
      
      console.log('Submitting asset with project:', {
        projectId: formData.project.projectId, // ID for backend submission
        projectName: formData.project.projectName // Name for UI display
      });
      console.log('Note: Project ID will be sent to backend, project name is for UI display only');
      
      setAssetCreationStatus('creating');
      const createdAsset = await onSubmit(formDataWithUserProject);
      
      // Handle QR code generation if needed
      if (formData.digitalTagType === 'qr' && createdAsset && typeof createdAsset === 'object' && createdAsset._id) {
        setAssetCreationStatus('success');
        setCreatedAsset(createdAsset as Asset);
        
        // Show QR generation modal after delay
        setTimeout(() => {
          setAssetCreationStatus('ready-for-qr');
          setTimeout(() => setShowQRModal(true), 1000);
        }, 2000);
        return;
      }
      
      // Close modal for non-QR assets
      setAssetCreationStatus('idle');
      onClose();
    } catch {
      setAssetCreationStatus('idle');
      throw new Error('Failed to submit asset');
    }
  };

  const getModalTitle = () => {
    return mode === 'create' ? 'Create New Asset' : 'Edit Asset';
  };

  // Preview Components
  const StatusPreview = ({ status }: { status: string }) => {
    const colors = {
      active: 'bg-green-500 dark:bg-green-600',
      inactive: 'bg-red-500 dark:bg-red-600',
      maintenance: 'bg-yellow-500 dark:bg-yellow-600',
      retired: 'bg-gray-500 dark:bg-gray-600'
    };

    return (
      <Badge className={`${colors[status.toLowerCase() as keyof typeof colors] || colors.retired} text-white font-medium text-xs px-2 py-1 rounded-full`}>
        {status || 'Not Set'}
      </Badge>
    );
  };

  const PriorityPreview = ({ priority }: { priority: string }) => {
    const colors = {
      high: 'bg-red-500 dark:bg-red-600',
      medium: 'bg-yellow-500 dark:bg-yellow-600',
      low: 'bg-green-500 dark:bg-green-600',
      critical: 'bg-red-700 dark:bg-red-800'
    };

    return (
      <Badge className={`${colors[priority.toLowerCase() as keyof typeof colors] || 'bg-gray-500 dark:bg-gray-600'} text-white font-medium text-xs px-2 py-1 rounded-full`}>
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
                    Your asset &quot;{createdAsset.tagId}&quot; has been created and saved to the database.
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
                      Your asset &quot;{createdAsset.tagId}&quot; is ready. You can now generate a QR code for it.
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
                    placeholder="e.g., SSPL001"
                    required
                    className="flex-1 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateTagId}
                    className="border-blue-300 dark:border-blue-600 hover:border-blue-500 dark:hover:border-blue-400 text-blue-700 dark:text-blue-300"
                    title="Generate new Tag ID"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
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
                <Label htmlFor="serialNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Serial Number
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">
                    Auto-generated
                  </span>
                </Label>
                <div className="flex space-x-2">
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                  placeholder="e.g., SN123456788888"
                    className="flex-1 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateSerialNumber}
                    disabled={generatingSerialNumber}
                    className="border-blue-300 dark:border-blue-600 hover:border-blue-500 dark:hover:border-blue-400 text-blue-700 dark:text-blue-300"
                    title="Generate new Serial Number"
                  >
                    {generatingSerialNumber ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
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
                    </SelectContent>
                  </Select>
                  
                  {/* Info message when digital tag type is selected */}
                  {formData.digitalTagType && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
                        <div className="flex items-start space-x-2">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-blue-800 dark:text-blue-200">Digital Tag Generation</p>
                          </div>
                        </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="project" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Project *
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">
                    Select project for this asset
                  </span>
                </Label>
                <Select
                  value={formData.project.projectId}
                  onValueChange={handleProjectChange}
                >
                  {/* Custom trigger to show project name instead of ID */}
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <div className="flex items-center justify-between w-full">
                      <span className={formData.project.projectId ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
                        {formData.project.projectId ? formData.project.projectName : "Select project"}
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {loadingProjects ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">Loading projects...</div>
                    ) : projects.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">No projects available</div>
                    ) : (
                      // Filter projects to show only the user's project
                      projects
                        .filter(project => project.name === user?.projectName)
                        .map(project => (
                          <SelectItem key={project._id} value={project._id} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                              <div>
                                <div className="font-medium">{project.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {project.code} • {project.status}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
                
                {formData.project.projectId && formData.project.projectName && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <div className="text-sm">
                        <span className="text-green-700 dark:text-green-300 font-medium">Selected Project: </span>
                        <span className="text-green-800 dark:text-green-200">
                          {formData.project.projectName}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {!formData.project.projectId && (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 text-yellow-600 dark:text-yellow-400">⚠️</div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        <span className="font-medium">No Project Selected:</span> Please select a project to continue.
                      </div>
                    </div>
                  </div>
                )}
              </div>





              <div className="md:col-span-2">
                <Label htmlFor="assignedTo" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Assigned To
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">
                    Select from users in project: {formData.project.projectName || 'Select a project first'}
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
                      <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                        No users found in project &quot;{formData.project.projectName || 'Select a project first'}&quot;. Contact your administrator to add users to this project.
                      </div>
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
                  {coordinatesFound && formData.location.latitude !== '0' && formData.location.longitude !== '0' && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Auto-generated from coordinates
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="address"
                    value={addressInput}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    placeholder="Enter address for automatic coordinate detection"
                    className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pr-10"
                  />
                  {geocodingLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500 dark:text-blue-400" />
                    </div>
                  )}
                </div>
                {geocodingError && (
                  <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
                    <div className="flex items-start space-x-2">
                      <div className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0">⚠️</div>
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">Geocoding Failed</p>
                        <p className="text-yellow-700 dark:text-yellow-300 mt-1">{geocodingError}</p>
                        <div className="mt-3 flex space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddressChange(addressInput)}
                            disabled={geocodingLoading}
                            className="border-yellow-300 dark:border-yellow-600 hover:border-yellow-400 dark:hover:border-yellow-500 text-yellow-700 dark:text-yellow-300"
                          >
                            {geocodingLoading ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3 mr-1" />
                            )}
                            Retry Geocoding
                          </Button>
              </div>
                      </div>
                    </div>
                  </div>
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
                  Enable geocoding
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
                  Coordinates ready
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
                <div className="flex space-x-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    className="flex-1 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                />
                <Button type="button" onClick={handleTagAdd} variant="outline" className="border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300">Add</Button>
                </div>
                {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {formData.tags.map((tag, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-700">
                        <span className="text-sm text-blue-700 dark:text-blue-400">{tag}</span>
                      <button type="button" onClick={() => handleTagRemove(tag)} className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Custom Fields</Label>
              
              {/* Predefined Custom Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="vendorName" className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Vendor Name</Label>
                  <Input
                    id="vendorName"
                    value={formData.customFields['Vendor Name'] || ''}
                    onChange={(e) => handleInputChange('customFields', { ...formData.customFields, 'Vendor Name': e.target.value })}
                    placeholder="e.g., Kone"
                    className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                  />
                </div>
                
                <div>
                  <Label htmlFor="hsn" className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">HSN Code</Label>
                  <Input
                    id="hsn"
                    value={formData.customFields['HSN'] || ''}
                    onChange={(e) => handleInputChange('customFields', { ...formData.customFields, 'HSN': e.target.value })}
                    placeholder="e.g., 998718"
                    className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                  />
                </div>
                
                <div>
                  <Label htmlFor="rateUOM" className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Rate/UOM</Label>
                  <Input
                    id="rateUOM"
                    value={formData.customFields['Rate//UOM'] || ''}
                    onChange={(e) => handleInputChange('customFields', { ...formData.customFields, 'Rate//UOM': e.target.value })}
                    placeholder="e.g., 20967.45"
                    className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                  />
                </div>
                
                <div>
                  <Label htmlFor="baseValue" className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Base Value</Label>
                  <Input
                    id="baseValue"
                    value={formData.customFields['Base value'] || ''}
                    onChange={(e) => handleInputChange('customFields', { ...formData.customFields, 'Base value': e.target.value })}
                    placeholder="e.g., 20967.45"
                    className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                  />
                </div>
              </div>
              
              {/* Additional Custom Fields */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <Label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">Additional Custom Fields</Label>
                <div className="flex space-x-2">
                  <Input
                    value={customFieldName}
                    onChange={(e) => setCustomFieldName(e.target.value)}
                    placeholder="Field name (e.g., Warranty)"
                    className="flex-1 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCustomFieldAdd())}
                  />
                  <Input
                    value={customFieldValue}
                    onChange={(e) => setCustomFieldValue(e.target.value)}
                    placeholder="Field value"
                    className="flex-1 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCustomFieldAdd())}
                  />
                  <Button type="button" variant="outline" onClick={handleCustomFieldAdd} className="border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 text-sm">Add</Button>
                </div>
                {Object.keys(formData.customFields).length > 0 && (
                  <div className="space-y-2 mt-3">
                    {Object.entries(formData.customFields).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                        <span className="text-sm"><span className="font-medium">{key}:</span> {value}</span>
                        <button type="button" onClick={() => {
                          const newCustomFields = { ...formData.customFields };
                          delete newCustomFields[key];
                          setFormData(prev => ({ ...prev, customFields: newCustomFields }));
                        }} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-2">
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