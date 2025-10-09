import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Textarea } from './textarea';
import { Badge } from './badge';
import { Asset, AssetType } from '../../lib/adminasset';
import { geocodeAddress, reverseGeocode } from '../../lib/location';
import {
  Loader2,
  Navigation,
  Info,
  X,
  QrCode,
  Barcode,
  Wifi,
  RefreshCw,
  User,
  Tag,
  FileText,
  Plus,
  Minus,
  Shield,
  Package
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
  mobilityCategory: string;
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
  compliance: {
    certifications: string[];
    expiryDates: string[];
    regulatoryRequirements: string[];
  };
  subAssets: {
    movable: Array<{
      assetName: string;
      description: string;
      brand: string;
      model: string;
      capacity: string;
      location: string;
    }>;
    immovable: Array<{
      assetName: string;
      description: string;
      brand: string;
      model: string;
      capacity: string;
      location: string;
    }>;
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
    tagId: '', assetType: '', subcategory: '', mobilityCategory: '', brand: '', model: '', serialNumber: '', capacity: '', yearOfInstallation: '',
    project: { projectId: '', projectName: '' }, assignedTo: '', priority: '', status: '', digitalTagType: '',
    tags: [] as string[], notes: '', customFields: {} as Record<string, string>,
    location: { latitude: '0', longitude: '0', building: '', floor: '', room: '' },
    compliance: { certifications: [] as string[], expiryDates: [] as string[], regulatoryRequirements: [] as string[] },
    subAssets: { movable: [] as Array<{ assetName: string; description: string; brand: string; model: string; capacity: string; location: string; }>, immovable: [] as Array<{ assetName: string; description: string; brand: string; model: string; capacity: string; location: string; }> }
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
  // const [coordinatesFound, setCoordinatesFound] = useState(false);
 
  // Error states
  // const [geocodingError, setGeocodingError] = useState<string | null>(null);
  // const [locationError, setLocationError] = useState<string | null>(null);
 
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
 
  // Collapsible sections state
  const [isAdditionalInfoExpanded, setIsAdditionalInfoExpanded] = useState(false);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [isCustomFieldsExpanded, setIsCustomFieldsExpanded] = useState(false);
  const [isComplianceExpanded, setIsComplianceExpanded] = useState(false);
  const [isSubAssetsExpanded, setIsSubAssetsExpanded] = useState(false);
 
  // Compliance state
  const [certificationInput, setCertificationInput] = useState('');
  const [expiryDateInput, setExpiryDateInput] = useState('');
  const [regulatoryRequirementInput, setRegulatoryRequirementInput] = useState('');
 

  // Fetch data functions
  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const response = await fetch('https://digitalasset.zenapi.co.in/api/projects', {
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
      let response = await fetch(`https://digitalasset.zenapi.co.in/api/admin?projectName=${encodeURIComponent(user.projectName)}`, {
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
        response = await fetch('https://digitalasset.zenapi.co.in/api/admin', {
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
      let response = await fetch(`https://digitalasset.zenapi.co.in/api/admin?projectName=${encodeURIComponent(projectName)}`, {
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
        response = await fetch('https://digitalasset.zenapi.co.in/api/admin', {
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
          tagId: asset.tagId || '', assetType: asset.assetType || '', subcategory: asset.subcategory || '', mobilityCategory: asset.mobilityCategory || '',
          brand: asset.brand || '', model: asset.model || '', serialNumber: asset.serialNumber || '',
          capacity: asset.capacity || '', yearOfInstallation: asset.yearOfInstallation || '',
          project: { projectId: asset.project?.projectId || '', projectName: asset.project?.projectName || '' },
          assignedTo: typeof asset.assignedTo === 'string' ? asset.assignedTo : asset.assignedTo?._id || '',
          notes: asset.notes || '', priority: asset.priority || '', status: asset.status || '',
          digitalTagType: asset.digitalTagType || '', tags: asset.tags || [], customFields: asset.customFields || {},
          location: {
            latitude: asset.location?.latitude || '0', longitude: asset.location?.longitude || '0',
            building: asset.location?.building || '', floor: asset.location?.floor || '', room: asset.location?.room || ''
          },
          compliance: {
            certifications: asset.compliance?.certifications || [],
            expiryDates: asset.compliance?.expiryDates || [],
            regulatoryRequirements: asset.compliance?.regulatoryRequirements || []
          },
          subAssets: {
            movable: (asset.subAssets?.movable || []).map(subAsset => ({
              assetName: subAsset.assetName,
              description: subAsset.description || '',
              brand: subAsset.brand,
              model: subAsset.model,
              capacity: subAsset.capacity,
              location: subAsset.location
            })),
            immovable: (asset.subAssets?.immovable || []).map(subAsset => ({
              assetName: subAsset.assetName,
              description: subAsset.description || '',
              brand: subAsset.brand,
              model: subAsset.model,
              capacity: subAsset.capacity,
              location: subAsset.location
            }))
          }
        });
        // setCoordinatesFound((asset.location?.latitude || '0') !== '0' && (asset.location?.longitude || '0') !== '0');
       
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
        // setCoordinatesFound(false);
        setAddressInput('');
      }
    }
  }, [isOpen, mode, asset, user, fetchUsers, fetchUsersForProject, fetchProjects]);

  const handleInputChange = (field: string, value: string | string[] | Record<string, string>) => {
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
            // setCoordinatesFound(true);
            // setGeocodingError(null);
           
            // Get address name from coordinates
            getAddressFromCoordinates(lat as string, lng as string);
          }
        }
      }
    } else if (field === 'customFields' && typeof value === 'object' && !Array.isArray(value)) {
      // Handle customFields object updates
      setFormData(prev => ({
        ...prev,
        customFields: { ...prev.customFields, ...value }
      }));
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
    // setGeocodingError(null);

    if (address.trim()) {
      setGeocodingLoading(true);
      try {
        const coordinates = await geocodeAddress(address);
        setFormData(prev => ({
          ...prev,
          location: { ...prev.location, latitude: coordinates.latitude.toString(), longitude: coordinates.longitude.toString() }
        }));
        // setCoordinatesFound(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to geocode address';
        // setGeocodingError(errorMessage);
        // setCoordinatesFound(false);
       
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
      // setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setLocationLoading(true);
    // setLocationError(null);

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
        // setCoordinatesFound(true);
      // setGeocodingError(null); // Clear any previous geocoding errors
     
      // Get address name from coordinates
      await getAddressFromCoordinates(latitude.toString(), longitude.toString());
    } catch (error) {
      // setLocationError(`Failed to get current location. Please check your browser permissions or try manual entry.`);
      // setCoordinatesFound(false);
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

  // Compliance handlers
  const handleCertificationAdd = () => {
    if (certificationInput.trim()) {
      setFormData(prev => ({
        ...prev,
        compliance: {
          ...prev.compliance,
          certifications: [...prev.compliance.certifications, certificationInput.trim()]
        }
      }));
      setCertificationInput('');
    }
  };

  const handleCertificationRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      compliance: {
        ...prev.compliance,
        certifications: prev.compliance.certifications.filter((_, i) => i !== index)
      }
    }));
  };

  const handleExpiryDateAdd = () => {
    if (expiryDateInput.trim()) {
      setFormData(prev => ({
        ...prev,
        compliance: {
          ...prev.compliance,
          expiryDates: [...prev.compliance.expiryDates, expiryDateInput.trim()]
        }
      }));
      setExpiryDateInput('');
    }
  };

  const handleExpiryDateRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      compliance: {
        ...prev.compliance,
        expiryDates: prev.compliance.expiryDates.filter((_, i) => i !== index)
      }
    }));
  };

  const handleRegulatoryRequirementAdd = () => {
    if (regulatoryRequirementInput.trim()) {
      setFormData(prev => ({
        ...prev,
        compliance: {
          ...prev.compliance,
          regulatoryRequirements: [...prev.compliance.regulatoryRequirements, regulatoryRequirementInput.trim()]
        }
      }));
      setRegulatoryRequirementInput('');
    }
  };

  const handleRegulatoryRequirementRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      compliance: {
        ...prev.compliance,
        regulatoryRequirements: prev.compliance.regulatoryRequirements.filter((_, i) => i !== index)
      }
    }));
  };

  // Sub-assets handlers
  // const handleMovableAssetAdd = () => {
  //   if (newMovableAsset.assetName.trim() && newMovableAsset.brand.trim()) {
  //     setFormData(prev => ({
  //       ...prev,
  //       subAssets: {
  //         ...prev.subAssets,
  //         movable: [...prev.subAssets.movable, { ...newMovableAsset }]
  //       }
  //     }));
  //     setNewMovableAsset({ assetName: '', description: '', brand: '', model: '', capacity: '', location: '' });
  //   }
  // };

  // const handleMovableAssetRemove = (index: number) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     subAssets: {
  //       ...prev.subAssets,
  //       movable: prev.subAssets.movable.filter((_, i) => i !== index)
  //     }
  //   }));
  // };

  // const handleImmovableAssetAdd = () => {
  //   if (newImmovableAsset.assetName.trim() && newImmovableAsset.brand.trim()) {
  //     setFormData(prev => ({
  //       ...prev,
  //       subAssets: {
  //         ...prev.subAssets,
  //         immovable: [...prev.subAssets.immovable, { ...newImmovableAsset }]
  //       }
  //     }));
  //     setNewImmovableAsset({ assetName: '', description: '', brand: '', model: '', capacity: '', location: '' });
  //   }
  // };

  // const handleImmovableAssetRemove = (index: number) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     subAssets: {
  //       ...prev.subAssets,
  //       immovable: prev.subAssets.immovable.filter((_, i) => i !== index)
  //     }
  //   }));
  // };

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

  const handleProjectChange = (projectName: string) => {
    const selectedProject = projects.find(p => p.name === projectName);
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
   
    if (!formData.mobilityCategory?.trim()) {
      alert('Please select a mobility category for this asset.');
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

          {/* Basic Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg flex items-center justify-center">
                <Info className="w-3 h-3 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
            </div>
           
            {/* Basic Information Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-visible border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full border-collapse font-sans text-base">
                  <thead>
                    <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Asset Type *
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Tag ID *
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Subcategory
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Mobility Category *
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <td className="border border-border px-4 py-3">
                        <Select
                          value={formData.assetType}
                          onValueChange={(value) => handleInputChange('assetType', value)}
                        >
                          <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                            <SelectValue placeholder="Select asset type" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg rounded-md">
                            {assetTypes.map(type => (
                              <SelectItem key={type._id} value={type.name} className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer py-1.5 px-3 text-sm">
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="border border-border px-4 py-3">
                        <div className="flex space-x-2">
                          <Input
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
                      </td>
                      <td className="border border-border px-4 py-3">
                        <Input
                          value={formData.subcategory}
                          onChange={(e) => handleInputChange('subcategory', e.target.value)}
                          placeholder="e.g., computer"
                          className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </td>
                      <td className="border border-border px-4 py-3">
                        <Select
                          value={formData.mobilityCategory}
                          onValueChange={(value) => handleInputChange('mobilityCategory', value)}
                        >
                          <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                            <div className="flex items-center space-x-2">
                              {formData.mobilityCategory === 'movable' && (
                                <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
                              )}
                              {formData.mobilityCategory === 'immovable' && (
                                <div className="w-3 h-3 bg-red-600 rounded-sm"></div>
                              )}
                              <span className={formData.mobilityCategory ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
                                {formData.mobilityCategory === 'movable' ? 'Movable' :
                                 formData.mobilityCategory === 'immovable' ? 'Immovable' :
                                 'Select mobility category'}
                              </span>
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg rounded-md">
                            <SelectItem value="movable" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer py-1.5 px-3 text-sm">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
                                <span>Movable</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="immovable" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer py-1.5 px-3 text-sm">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-600 rounded-sm"></div>
                                <span>Immovable</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Brand and Model Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-visible border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full border-collapse font-sans text-base">
                  <thead>
                    <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Brand *
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Model
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Serial Number
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Capacity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <td className="border border-border px-4 py-3">
                        <Input
                          value={formData.brand}
                          onChange={(e) => handleInputChange('brand', e.target.value)}
                          placeholder="e.g., Dell"
                          required
                          className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </td>
                      <td className="border border-border px-4 py-3">
                        <Input
                          value={formData.model}
                          onChange={(e) => handleInputChange('model', e.target.value)}
                          placeholder="e.g., OptiPlex 7090"
                          className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </td>
                      <td className="border border-border px-4 py-3">
                        <div className="flex space-x-2">
                          <Input
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
                      </td>
                      <td className="border border-border px-4 py-3">
                        <Input
                          value={formData.capacity}
                          onChange={(e) => handleInputChange('capacity', e.target.value)}
                          placeholder="e.g., 16GB RAM, 512GB SSD"
                          className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status and Priority Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-visible border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full border-collapse font-sans text-base">
                  <thead>
                    <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Year of Installation
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Priority
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Status
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Digital Tag Type
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <td className="border border-border px-4 py-3">
                        <Input
                          value={formData.yearOfInstallation}
                          onChange={(e) => handleInputChange('yearOfInstallation', e.target.value)}
                          placeholder="e.g., 2023"
                          className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </td>
                      <td className="border border-border px-4 py-3">
                        <Select
                          value={formData.priority}
                          onValueChange={(value) => handleInputChange('priority', value)}
                        >
                          <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg rounded-md">
                            <SelectItem value="low" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer py-1.5 px-3 text-sm">Low</SelectItem>
                            <SelectItem value="medium" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer py-1.5 px-3 text-sm">Medium</SelectItem>
                            <SelectItem value="high" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer py-1.5 px-3 text-sm">High</SelectItem>
                            <SelectItem value="critical" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer py-1.5 px-3 text-sm">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="border border-border px-4 py-3">
                        <Select
                          value={formData.status}
                          onValueChange={(value) => handleInputChange('status', value)}
                        >
                          <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg rounded-md">
                            <SelectItem value="active" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer py-1.5 px-3 text-sm">Active</SelectItem>
                            <SelectItem value="inactive" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer py-1.5 px-3 text-sm">Inactive</SelectItem>
                            <SelectItem value="maintenance" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer py-1.5 px-3 text-sm">Maintenance</SelectItem>
                            <SelectItem value="retired" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer py-1.5 px-3 text-sm">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="border border-border px-4 py-3">
                        <Select
                          value={formData.digitalTagType}
                          onValueChange={handleDigitalTagTypeChange}
                        >
                          <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                            <div className="flex items-center space-x-2">
                              {formData.digitalTagType === 'qr' && (
                                <QrCode className="w-4 h-4 text-emerald-600" />
                              )}
                              {formData.digitalTagType === 'barcode' && (
                                <Barcode className="w-4 h-4 text-orange-600" />
                              )}
                              {formData.digitalTagType === 'nfc' && (
                                <Wifi className="w-4 h-4 text-purple-600" />
                              )}
                              {formData.digitalTagType === 'rfid' && (
                                <div className="w-4 h-4 bg-blue-600 rounded-sm"></div>
                              )}
                              <span className={formData.digitalTagType ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
                                {formData.digitalTagType === 'qr' ? 'QR Code' :
                                 formData.digitalTagType === 'barcode' ? 'Barcode' :
                                 formData.digitalTagType === 'nfc' ? 'NFC' :
                                 formData.digitalTagType === 'rfid' ? 'RFID' : 'Select tag type'}
                              </span>
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg rounded-md">
                            <SelectItem value="qr" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer py-1.5 px-3 text-sm">
                              <div className="flex items-center space-x-2">
                                <QrCode className="w-4 h-4 text-emerald-600" />
                                <span>QR Code</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="barcode" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer py-1.5 px-3 text-sm">
                              <div className="flex items-center space-x-2">
                                <Barcode className="w-4 h-4 text-orange-600" />
                                <span>Barcode</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="nfc" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer py-1.5 px-3 text-sm">
                              <div className="flex items-center space-x-2">
                                <Wifi className="w-4 h-4 text-purple-600" />
                                <span>NFC</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="rfid" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer py-1.5 px-3 text-sm">
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-blue-600 rounded-sm"></div>
                                <span>RFID</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Project and Assignment Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-visible border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full border-collapse font-sans text-base">
                  <thead>
                    <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Project *
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Assigned To *
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <td className="border border-border px-4 py-3">
                        <Select
                          value={formData.project.projectName}
                          onValueChange={handleProjectChange}
                        >
                          <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                            <div className="flex items-center space-x-2">
                              {formData.project.projectName && (
                                <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                              )}
                              <span className={formData.project.projectName ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
                                {formData.project.projectName || 'Select project'}
                              </span>
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg rounded-md">
                            {loadingProjects ? (
                              <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">Loading projects...</div>
                            ) : projects.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">No projects available</div>
                            ) : (
                              projects
                                .filter(project => project.name === user?.projectName)
                                .map(project => (
                                  <SelectItem key={project._id} value={project.name} className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer py-1.5 px-3 text-sm">
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
                      </td>
                      <td className="border border-border px-4 py-3">
                        <Select
                          value={(() => {
                            const user = users.find(u => u._id === formData.assignedTo);
                            return user ? user.email : '';
                          })()}
                          onValueChange={(value) => {
                            // Find user by email and set the user ID
                            const selectedUser = users.find(u => u.email === value);
                            if (selectedUser) {
                              handleInputChange('assignedTo', selectedUser._id);
                            }
                          }}
                        >
                          <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                            <div className="flex items-center space-x-2">
                              {(() => {
                                const selectedUser = users.find(u => u._id === formData.assignedTo);
                                return selectedUser ? (
                                  <>
                                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    <span className="text-gray-900 dark:text-white">{selectedUser.email}</span>
                                  </>
                                ) : (
                                  <span className="text-gray-500 dark:text-gray-400">Select user to assign asset to</span>
                                );
                              })()}
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg rounded-md">
                            {loadingUsers ? (
                              <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">Loading users...</div>
                            ) : users.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                                No users found in project &quot;{formData.project.projectName || 'Select a project first'}&quot;. Contact your administrator to add users to this project.
                              </div>
                            ) : (
                              users.map(user => (
                                <SelectItem key={user._id} value={user.email} className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer py-2 px-3">
                                  <div className="flex items-center space-x-2">
                                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    <span className="font-medium">{user.email}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Location Information */}
          <div className="space-y-6">
           
            {/* Location Information Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-visible border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full border-collapse font-sans text-base">
                  <thead>
                    <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Building
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Floor
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Room
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Address
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <td className="border border-border px-4 py-3">
                        <Input
                          value={formData.location.building}
                          onChange={(e) => handleInputChange('location.building', e.target.value)}
                          placeholder="e.g., Main Building"
                          className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </td>
                      <td className="border border-border px-4 py-3">
                        <Input
                          value={formData.location.floor}
                          onChange={(e) => handleInputChange('location.floor', e.target.value)}
                          placeholder="e.g., 2nd Floor"
                          className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </td>
                      <td className="border border-border px-4 py-3">
                        <Input
                          value={formData.location.room}
                          onChange={(e) => handleInputChange('location.room', e.target.value)}
                          placeholder="e.g., IT Department"
                          className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </td>
                      <td className="border border-border px-4 py-3">
                        <div className="relative">
                          <Input
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
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Location Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="text-xs border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
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
            </div>


          </div>

          {/* Additional Information */}
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-lg flex items-center justify-center">
                  <Info className="w-3 h-3 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Information</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAdditionalInfoExpanded(!isAdditionalInfoExpanded)}
                className="h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-800 text-purple-600 dark:text-purple-400"
              >
                {isAdditionalInfoExpanded ? (
                  <Minus className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
           
            {isAdditionalInfoExpanded && (
              <>
                {/* Notes Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-3 bg-blue-50 dark:bg-slate-800 border-b border-border">
                <h4 className="text-base font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2.5">
                  <FileText className="w-4 h-4" />
                  Notes
                </h4>
              </div>
              <div className="p-4">
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="e.g., High-performance workstation for development"
                  rows={4}
                  className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>
           
            {/* Tags Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-3 bg-blue-50 dark:bg-slate-800 border-b border-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2.5">
                    <Tag className="w-4 h-4" />
                    Tags
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                    className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400"
                  >
                    {isTagsExpanded ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              {isTagsExpanded && (
                <div className="p-4">
                  <div className="flex space-x-2 mb-3">
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
                    <div className="flex flex-wrap gap-2">
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
              )}
            </div>

            {/* Compliance Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-3 bg-blue-50 dark:bg-slate-800 border-b border-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2.5">
                    <Shield className="w-4 h-4" />
                    Compliance Information
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsComplianceExpanded(!isComplianceExpanded)}
                    className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400"
                  >
                    {isComplianceExpanded ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              {isComplianceExpanded && (
                <div className="p-4">
                  {/* Certifications */}
                  <div className="mb-4">
                    <Label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">Certifications</Label>
                    <div className="flex space-x-2 mb-3">
                      <Input
                        value={certificationInput}
                        onChange={(e) => setCertificationInput(e.target.value)}
                        placeholder="e.g., ISO 9001"
                        className="flex-1 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCertificationAdd())}
                      />
                      <Button type="button" onClick={handleCertificationAdd} variant="outline" className="border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 text-sm">Add</Button>
                    </div>
                    {formData.compliance.certifications.length > 0 && (
                      <div className="space-y-2">
                        {formData.compliance.certifications.map((cert, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                            <span className="text-sm">{cert}</span>
                            <button type="button" onClick={() => handleCertificationRemove(index)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-2">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Expiry Dates */}
                  <div className="mb-4">
                    <Label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">Expiry Dates</Label>
                    <div className="flex space-x-2 mb-3">
                      <Input
                        value={expiryDateInput}
                        onChange={(e) => setExpiryDateInput(e.target.value)}
                        placeholder="e.g., 2024-12-31"
                        className="flex-1 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleExpiryDateAdd())}
                      />
                      <Button type="button" onClick={handleExpiryDateAdd} variant="outline" className="border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 text-sm">Add</Button>
                    </div>
                    {formData.compliance.expiryDates.length > 0 && (
                      <div className="space-y-2">
                        {formData.compliance.expiryDates.map((date, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                            <span className="text-sm">{date}</span>
                            <button type="button" onClick={() => handleExpiryDateRemove(index)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-2">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Regulatory Requirements */}
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">Regulatory Requirements</Label>
                    <div className="flex space-x-2 mb-3">
                      <Input
                        value={regulatoryRequirementInput}
                        onChange={(e) => setRegulatoryRequirementInput(e.target.value)}
                        placeholder="e.g., FDA Approval"
                        className="flex-1 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleRegulatoryRequirementAdd())}
                      />
                      <Button type="button" onClick={handleRegulatoryRequirementAdd} variant="outline" className="border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 text-sm">Add</Button>
                    </div>
                    {formData.compliance.regulatoryRequirements.length > 0 && (
                      <div className="space-y-2">
                        {formData.compliance.regulatoryRequirements.map((req, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                            <span className="text-sm">{req}</span>
                            <button type="button" onClick={() => handleRegulatoryRequirementRemove(index)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-2">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Custom Fields Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-3 bg-blue-50 dark:bg-slate-800 border-b border-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2.5">
                    <Package className="w-4 h-4" />
                    Custom Fields
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCustomFieldsExpanded(!isCustomFieldsExpanded)}
                    className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400"
                  >
                    {isCustomFieldsExpanded ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              {isCustomFieldsExpanded && (
                <div className="p-4">
                  {/* Predefined Custom Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="vendorName" className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Vendor Name</Label>
                      <Input
                        id="vendorName"
                        value={formData.customFields['Vendor Name'] || ''}
                        onChange={(e) => handleInputChange('customFields', { 'Vendor Name': e.target.value })}
                        placeholder="e.g., Kone"
                        className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      />
                    </div>
                   
                    <div>
                      <Label htmlFor="hsn" className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">HSN Code</Label>
                      <Input
                        id="hsn"
                        value={formData.customFields['HSN'] || ''}
                        onChange={(e) => handleInputChange('customFields', { 'HSN': e.target.value })}
                        placeholder="e.g., 998718"
                        className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      />
                    </div>
                   
                    <div>
                      <Label htmlFor="rateUOM" className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Rate/UOM</Label>
                      <Input
                        id="rateUOM"
                        value={formData.customFields['Rate//UOM'] || ''}
                        onChange={(e) => handleInputChange('customFields', { 'Rate//UOM': e.target.value })}
                        placeholder="e.g., 20967.45"
                        className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      />
                    </div>
                   
                    <div>
                      <Label htmlFor="baseValue" className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Base Value</Label>
                      <Input
                        id="baseValue"
                        value={formData.customFields['Base value'] || ''}
                        onChange={(e) => handleInputChange('customFields', { 'Base value': e.target.value })}
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
                        className="flex-1 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
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
              )}
            </div>

            {/* Sub Assets Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-3 bg-blue-50 dark:bg-slate-800 border-b border-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2.5">
                    <Package className="w-4 h-4" />
                    Sub Assets Management
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSubAssetsExpanded(!isSubAssetsExpanded)}
                    className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400"
                  >
                    {isSubAssetsExpanded ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              {isSubAssetsExpanded && (
                <div className="p-4">
                  {/* Movable Sub Assets */}
                  <div className="mb-8">
                    <div className="mb-4">
                      <h5 className="text-base font-semibold text-black dark:text-white mb-1">
                        Movable Sub Assets
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formData.subAssets.movable.length} items
                      </p>
                    </div>
                   
                    {/* Movable Assets Cards */}
                    {formData.subAssets.movable.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {formData.subAssets.movable.map((asset, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 p-4">
                            <div className="mb-4">
                              <h6 className="text-sm font-semibold text-black dark:text-white">Asset -{index + 1}</h6>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Movable Equipment</p>
                            </div>
                           
                            <div className="space-y-3">
                              {/* Asset Name */}
                              <div>
                                <label className="text-xs text-black dark:text-white font-medium mb-1 block">Asset Name</label>
                                <Input
                                  value={asset.assetName}
                                  onChange={(e) => {
                                    const updatedAssets = [...formData.subAssets.movable];
                                    updatedAssets[index] = { ...updatedAssets[index], assetName: e.target.value };
                                    setFormData(prev => ({
                                      ...prev,
                                      subAssets: { ...prev.subAssets, movable: updatedAssets }
                                    }));
                                  }}
                                  className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm h-8"
                                  placeholder="Enter asset name"
                                />
                              </div>

                              {/* Description */}
                              <div>
                                <label className="text-xs text-black dark:text-white font-medium mb-1 block">Description</label>
                                <Textarea
                                  value={asset.description}
                                  onChange={(e) => {
                                    const updatedAssets = [...formData.subAssets.movable];
                                    updatedAssets[index] = { ...updatedAssets[index], description: e.target.value };
                                    setFormData(prev => ({
                                      ...prev,
                                      subAssets: { ...prev.subAssets, movable: updatedAssets }
                                    }));
                                  }}
                                  rows={2}
                                  className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none text-sm"
                                  placeholder="Enter detailed description"
                                />
                              </div>

                              {/* Brand & Model Row */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-black dark:text-white font-medium mb-1 block">Brand</label>
                                  <Input
                                    value={asset.brand}
                                    onChange={(e) => {
                                      const updatedAssets = [...formData.subAssets.movable];
                                      updatedAssets[index] = { ...updatedAssets[index], brand: e.target.value };
                                      setFormData(prev => ({
                                        ...prev,
                                        subAssets: { ...prev.subAssets, movable: updatedAssets }
                                      }));
                                    }}
                                    className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm h-8"
                                    placeholder="Brand name"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-black dark:text-white font-medium mb-1 block">Model</label>
                                  <Input
                                    value={asset.model}
                                    onChange={(e) => {
                                      const updatedAssets = [...formData.subAssets.movable];
                                      updatedAssets[index] = { ...updatedAssets[index], model: e.target.value };
                                      setFormData(prev => ({
                                        ...prev,
                                        subAssets: { ...prev.subAssets, movable: updatedAssets }
                                      }));
                                    }}
                                    className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm h-8"
                                    placeholder="Model number"
                                  />
                                </div>
                              </div>

                              {/* Capacity & Location Row */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-black dark:text-white font-medium mb-1 block">Capacity</label>
                                  <Input
                                    value={asset.capacity}
                                    onChange={(e) => {
                                      const updatedAssets = [...formData.subAssets.movable];
                                      updatedAssets[index] = { ...updatedAssets[index], capacity: e.target.value };
                                      setFormData(prev => ({
                                        ...prev,
                                        subAssets: { ...prev.subAssets, movable: updatedAssets }
                                      }));
                                    }}
                                    className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm h-8"
                                    placeholder="Capacity specs"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-black dark:text-white font-medium mb-1 block">Location</label>
                                  <Input
                                    value={asset.location}
                                    onChange={(e) => {
                                      const updatedAssets = [...formData.subAssets.movable];
                                      updatedAssets[index] = { ...updatedAssets[index], location: e.target.value };
                                      setFormData(prev => ({
                                        ...prev,
                                        subAssets: { ...prev.subAssets, movable: updatedAssets }
                                      }));
                                    }}
                                    className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm h-8"
                                    placeholder="Current location"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">No Movable Sub-Assets</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-500">No movable sub-assets have been added to this asset yet.</p>
                      </div>
                    )}
                  </div>

                  {/* Immovable Sub Assets */}
                  <div>
                    <div className="mb-4">
                      <h5 className="text-base font-semibold text-black dark:text-white mb-1">
                        Immovable Sub Assets
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formData.subAssets.immovable.length} items
                      </p>
                    </div>
                   
                    {/* Immovable Assets Cards */}
                    {formData.subAssets.immovable.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {formData.subAssets.immovable.map((asset, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 p-4">
                            <div className="mb-4">
                              <h6 className="text-sm font-semibold text-black dark:text-white">Asset -{index + 1}</h6>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Immovable Equipment</p>
                            </div>
                           
                            <div className="space-y-3">
                              {/* Asset Name */}
                              <div>
                                <label className="text-xs text-black dark:text-white font-medium mb-1 block">Asset Name</label>
                                <Input
                                  value={asset.assetName}
                                  onChange={(e) => {
                                    const updatedAssets = [...formData.subAssets.immovable];
                                    updatedAssets[index] = { ...updatedAssets[index], assetName: e.target.value };
                                    setFormData(prev => ({
                                      ...prev,
                                      subAssets: { ...prev.subAssets, immovable: updatedAssets }
                                    }));
                                  }}
                                  className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm h-8"
                                  placeholder="Enter asset name"
                                />
                              </div>

                              {/* Description */}
                              <div>
                                <label className="text-xs text-black dark:text-white font-medium mb-1 block">Description</label>
                                <Textarea
                                  value={asset.description}
                                  onChange={(e) => {
                                    const updatedAssets = [...formData.subAssets.immovable];
                                    updatedAssets[index] = { ...updatedAssets[index], description: e.target.value };
                                    setFormData(prev => ({
                                      ...prev,
                                      subAssets: { ...prev.subAssets, immovable: updatedAssets }
                                    }));
                                  }}
                                  rows={2}
                                  className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none text-sm"
                                  placeholder="Enter detailed description"
                                />
                              </div>

                              {/* Brand & Model Row */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-black dark:text-white font-medium mb-1 block">Brand</label>
                                  <Input
                                    value={asset.brand}
                                    onChange={(e) => {
                                      const updatedAssets = [...formData.subAssets.immovable];
                                      updatedAssets[index] = { ...updatedAssets[index], brand: e.target.value };
                                      setFormData(prev => ({
                                        ...prev,
                                        subAssets: { ...prev.subAssets, immovable: updatedAssets }
                                      }));
                                    }}
                                    className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm h-8"
                                    placeholder="Brand name"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-black dark:text-white font-medium mb-1 block">Model</label>
                                  <Input
                                    value={asset.model}
                                    onChange={(e) => {
                                      const updatedAssets = [...formData.subAssets.immovable];
                                      updatedAssets[index] = { ...updatedAssets[index], model: e.target.value };
                                      setFormData(prev => ({
                                        ...prev,
                                        subAssets: { ...prev.subAssets, immovable: updatedAssets }
                                      }));
                                    }}
                                    className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm h-8"
                                    placeholder="Model number"
                                  />
                                </div>
                              </div>

                              {/* Capacity & Location Row */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-black dark:text-white font-medium mb-1 block">Capacity</label>
                                  <Input
                                    value={asset.capacity}
                                    onChange={(e) => {
                                      const updatedAssets = [...formData.subAssets.immovable];
                                      updatedAssets[index] = { ...updatedAssets[index], capacity: e.target.value };
                                      setFormData(prev => ({
                                        ...prev,
                                        subAssets: { ...prev.subAssets, immovable: updatedAssets }
                                      }));
                                    }}
                                    className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm h-8"
                                    placeholder="Capacity specs"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-black dark:text-white font-medium mb-1 block">Location</label>
                                  <Input
                                    value={asset.location}
                                    onChange={(e) => {
                                      const updatedAssets = [...formData.subAssets.immovable];
                                      updatedAssets[index] = { ...updatedAssets[index], location: e.target.value };
                                      setFormData(prev => ({
                                        ...prev,
                                        subAssets: { ...prev.subAssets, immovable: updatedAssets }
                                      }));
                                    }}
                                    className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm h-8"
                                    placeholder="Current location"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">No Immovable Sub-Assets</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-500">No immovable sub-assets have been added to this asset yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
              </>
            )}
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