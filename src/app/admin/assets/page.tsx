"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building, Package, Search, Eye, X, ArrowDown, Download, Plus, Trash2, QrCode, Wifi, Receipt, RotateCcw, Activity, Archive, MapPin } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { createAsset, validateAssetData, CreateAssetRequest, SubAsset, AssetData, getAssets, searchAssets, InventoryItem, Asset, assetApi, PurchaseOrder, ReplacementRecord, LifecycleStatus, FinancialData } from '@/lib/adminasset'
import { Location, getLocations } from '@/lib/location'

// API Response interfaces
interface ApiSubAsset {
  _id?: string
  id?: string
  tagId?: string  // Sub-asset tag ID
  assetName: string
  description?: string  // Made optional to match actual data
  category: string  // Made flexible to accept any string
  brand: string
  model: string
  capacity: string
  location: string
  parentAsset?: AssetData  // Added parentAsset property
  digitalTagType?: string  // Digital tag type
  digitalAssets?: {
    qrCode?: {
      url: string
      data: Record<string, unknown>
      generatedAt: string
    }
    barcode?: {
      url: string
      data: {
        t: string
        a: string
        s: string
        b: string
        m: string
        st: string
        p: string
        l: Record<string, unknown>
        u: string
        pr: string
        lm: string | null
        nm: string | null
        url: string
        ts: number
        c: string
      }
      generatedAt: string
    }
    nfcData?: {
      url: string
      data: Record<string, unknown>
      generatedAt: string
    }
  }
  hasDigitalAssets?: boolean  // Digital assets flag
  purchaseOrder?: PurchaseOrder  // Added purchaseOrder property
  inventory: {
    consumables: InventoryItem[]
    spareParts: InventoryItem[]
    tools: InventoryItem[]
    operationalSupply: InventoryItem[]
  }
}

// @ts-expect-error - Complex type compatibility issue between ApiSubAsset and SubAsset interfaces
interface ApiAsset extends Asset {
  subAssets?: {
    movable: ApiSubAsset[]
    immovable: ApiSubAsset[]
  }
}

interface ApiAssetsResponse {
  success: boolean
  assets: ApiAsset[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  message?: string
}

// Use AssetData from adminasset.ts

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      startY?: number
      head?: string[][]
      body?: string[][]
      styles?: Record<string, unknown>
      headStyles?: Record<string, unknown>
      bodyStyles?: Record<string, unknown>
      margin?: { left: number; right: number }
      columnStyles?: Record<string, Record<string, unknown>>
    }) => jsPDF
    lastAutoTable: {
      finalY: number
    }
  }
}

// Updated interface to include all sub-asset properties
interface AssetClassificationItem {
  assetName: string
  description: string
  category: 'Movable' | 'Immovable'
  brand: string
  model: string
  capacity: string
  location: string
  reason: string
  tagId?: string  // NEW: Sub-asset tag ID
  digitalTagType?: string  // NEW: Digital tag type
  digitalAssets?: {
    qrCode?: {
      url: string
      data: Record<string, unknown>
      generatedAt: string
    }
    barcode?: {
      url: string
      data: {
        t: string
        a: string
        s: string
        b: string
        m: string
        st: string
        p: string
        l: Record<string, unknown>
        u: string
        pr: string
        lm: string | null
        nm: string | null
        url: string
        ts: number
        c: string
      }
      generatedAt: string
    }
    nfcData?: {
      url: string
      data: Record<string, unknown>
      generatedAt: string
    }
  }
  hasDigitalAssets?: boolean  // NEW: Quick check flag
  inventory: {
    consumables: InventoryItem[]
    spareParts: InventoryItem[]
    tools: InventoryItem[]
    operationalSupply: InventoryItem[]
  }
}

interface AssetClassification {
  movable: AssetClassificationItem[]
  immovable: AssetClassificationItem[]
}


export default function AdminAssetsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMobility, setSelectedMobility] = useState<'all' | 'movable' | 'immovable' | 'inventory' | 'far'>('all')
  const [assets, setAssets] = useState<AssetData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Asset classification states
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [expandedClassificationType, setExpandedClassificationType] = useState<'movable' | 'immovable' | null>(null)
  const [selectedInventoryType, setSelectedInventoryType] = useState<{[key: string]: 'consumables' | 'spareParts' | 'tools' | null}>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
 
  // Modal states
  const [showFlowchartModal, setShowFlowchartModal] = useState(false)
  const [selectedAssetForFlowchart, setSelectedAssetForFlowchart] = useState<AssetData | null>(null)
  const [showAddAssetModal, setShowAddAssetModal] = useState(false)
  
  // Enhanced Asset Management Modal States
  const [showPOModal, setShowPOModal] = useState(false)
  const [showReplacementModal, setShowReplacementModal] = useState(false)
  const [showLifecycleModal, setShowLifecycleModal] = useState(false)
  const [showSubAssetDetailsModal, setShowSubAssetDetailsModal] = useState(false)
  const [selectedSubAssetForDetails, setSelectedSubAssetForDetails] = useState<ApiSubAsset | null>(null)
  const [expandedInventorySection, setExpandedInventorySection] = useState<'consumables' | 'spareParts' | 'tools' | null>(null)
  const [showFinancialModal, setShowFinancialModal] = useState(false)
  const [selectedAssetForManagement, setSelectedAssetForManagement] = useState<AssetData | null>(null)
  const [selectedSubAssetForManagement, setSelectedSubAssetForManagement] = useState<{
    asset: AssetData
    subAssetIndex: number
    category: 'movable' | 'immovable'
  } | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedQRData, setSelectedQRData] = useState<{
    url: string
    data: Record<string, unknown>
    generatedAt: string
  } | null>(null)

  // Location states for dropdown
  const [locations, setLocations] = useState<Location[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [selectedLocationName, setSelectedLocationName] = useState<string>('')

  // Add Asset form states
  const [newAsset, setNewAsset] = useState<Partial<AssetData>>({
    tagId: '',
    assetType: '',
    subcategory: '',
    mobilityCategory: 'Movable',
    brand: '',
    model: '',
    serialNumber: '',
    capacity: '',
    yearOfInstallation: '',
    status: 'Active',
    priority: 'Medium',
    project: {
      projectId: user?.projectId || localStorage.getItem('projectId') || '',
      projectName: user?.projectName || localStorage.getItem('userProject') || localStorage.getItem('projectName') || localStorage.getItem('project') || 'Default Project'
    },
    location: {
      building: '',
      floor: '',
      room: ''
    },
    subAssets: {
      movable: [],
      immovable: []
    }
  })

  // Main asset inventory state (inventory directly attached to main asset, not sub-assets)
  const [mainAssetInventory, setMainAssetInventory] = useState<{
    consumables: InventoryItem[]
    spareParts: InventoryItem[]
    tools: InventoryItem[]
    operationalSupply: InventoryItem[]
  }>({
    consumables: [],
    spareParts: [],
    tools: [],
    operationalSupply: []
  })

  // Update project when user data changes
  useEffect(() => {
    const userProject = 
      user?.projectName || 
      localStorage.getItem('userProject') || 
      localStorage.getItem('projectName') ||
      localStorage.getItem('project') ||
      'Default Project'
    
    const userProjectId = user?.projectId || localStorage.getItem('projectId') || ''
    
    if (userProject !== 'Default Project' || userProjectId) {
      setNewAsset(prev => ({
        ...prev,
        project: {
          projectId: userProjectId,
          projectName: userProject
        }
      }))
    }
  }, [user])

  // Fetch locations when modal opens - only sub-locations for the project
  useEffect(() => {
    if (showAddAssetModal) {
      const fetchLocationsData = async () => {
        setLoadingLocations(true)
        try {
          const allLocations = await getLocations()
          const userProjectName = user?.projectName?.trim().toLowerCase()
          
          // Filter to only show sub-locations (locations with parentId) for the user's project
          // Also remove duplicates based on _id
          const uniqueIds = new Set<string>()
          const filteredLocations = allLocations.filter((location) => {
            // Only include sub-locations (those with a parentId)
            if (!location.parentId) return false
            
            // Filter by project if user has a project
            if (userProjectName) {
              const locProjectName = location.projectName?.trim().toLowerCase()
              const locName = location.name?.trim().toLowerCase()
              
              // Check if location belongs to the user's project
              if (locProjectName !== userProjectName && locName !== userProjectName) {
                // Check if parent belongs to project
                const parent = allLocations.find(l => l._id === location.parentId)
                if (parent) {
                  const parentProjectName = parent.projectName?.trim().toLowerCase()
                  const parentName = parent.name?.trim().toLowerCase()
                  if (parentProjectName !== userProjectName && parentName !== userProjectName) {
                    return false
                  }
                } else {
                  return false
                }
              }
            }
            
            // Remove duplicates
            if (uniqueIds.has(location._id)) {
              return false
            }
            uniqueIds.add(location._id)
            return true
          })
          
          setLocations(filteredLocations)
        } catch (error) {
          console.error('Error fetching locations:', error)
        } finally {
          setLoadingLocations(false)
        }
      }
      fetchLocationsData()
    } else {
      // Reset selected location when modal closes
      setSelectedLocationId('')
      setSelectedLocationName('')
    }
  }, [showAddAssetModal, user])

  // Current step in the creation process
  const [currentStep, setCurrentStep] = useState<'main' | 'subassets' | 'inventory'>('main')

  // Asset ID generation states
  const [locationType, setLocationType] = useState('')
  const [assetTypeCode, setAssetTypeCode] = useState('')

  // Asset ID generation function
  const generateAssetId = (locationType: string, assetTypeCode: string) => {
    if (!user?.projectName || !locationType || !assetTypeCode) return ''
    
    // Extract city code from project address (assuming Bangalore for now)
    const cityCode = 'BLR' // Can be made dynamic based on project address
    
    // Extract project abbreviation (first 4 characters)
    const projectAbbr = user.projectName.substring(0, 4).toUpperCase()
    
    // Extract user name abbreviation (first 2 characters)
    const userAbbr = user.name ? user.name.substring(0, 2).toUpperCase() : 'US'
    
    // Location type abbreviation - handle spaces and take meaningful parts
    const locationWords = locationType.trim().split(' ')
    const locationAbbr = locationWords.length > 1 
      ? locationWords.map(word => word.charAt(0)).join('').toUpperCase()
      : locationType.substring(0, 2).toUpperCase()
    
    // Asset type code - handle spaces and take meaningful parts
    const assetWords = assetTypeCode.trim().split(' ')
    const assetAbbr = assetWords.length > 1 
      ? assetWords.map(word => word.charAt(0)).join('').toUpperCase()
      : assetTypeCode.substring(0, 2).toUpperCase()
    
    return `${cityCode}/${projectAbbr}/${userAbbr}/${locationAbbr}/${assetAbbr}`
  }

  // Sub-asset tag ID generation function
  const generateSubAssetTagId = (mainAssetId: string, subAssetName: string, category: 'Movable' | 'Immovable', index: number) => {
    if (!mainAssetId || !subAssetName) return ''
    
    // Generate abbreviation from sub-asset name
    const subAssetWords = subAssetName.trim().split(' ')
    const subAssetAbbr = subAssetWords.length > 1 
      ? subAssetWords.map(word => word.charAt(0)).join('').toUpperCase()
      : subAssetName.substring(0, 2).toUpperCase()
    
    // Generate sequential number (01, 02, 03, etc.)
    const sequentialNumber = String(index + 1).padStart(2, '0')
    
    return `${mainAssetId}-${subAssetAbbr}${sequentialNumber}`
  }

  // Inventory item tag ID generation function
  const generateInventoryItemTagId = (mainAssetId: string, inventoryType: string, itemName: string, itemIndex: number) => {
    if (!mainAssetId) return ''
    
    // Generate abbreviation from inventory type
    const typeWords = inventoryType.trim().split(/(?=[A-Z])/)
    const typeAbbr = typeWords.length > 1 
      ? typeWords.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 3)
      : inventoryType.substring(0, 3).toUpperCase()
    
    // Generate abbreviation from item name if available
    let itemNameAbbr = ''
    if (itemName && itemName.trim()) {
      const nameWords = itemName.trim().split(' ')
      if (nameWords.length > 1) {
        itemNameAbbr = nameWords.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 4)
      } else {
        itemNameAbbr = itemName.trim().substring(0, 4).toUpperCase()
      }
    } else {
      // Fallback to sequential number if no name provided
      itemNameAbbr = String(itemIndex + 1).padStart(3, '0')
    }
    
    return `${mainAssetId}-INV-${typeAbbr}-${itemNameAbbr}`
  }

  // Enhanced Asset Management Form States
  const [poData, setPOData] = useState<Partial<PurchaseOrder>>({
    poNumber: '',
    poDate: '',
    vendor: '',
    vendorContact: '',
    purchaseCost: 0,
    currency: 'INR',
    paymentTerms: '',
    deliveryDate: '',
    invoiceNumber: '',
    invoiceDate: '',
    notes: ''
  })

  const [replacementData, setReplacementData] = useState<Partial<ReplacementRecord>>({
    replacedAssetTagId: '',
    replacementDate: '',
    replacementReason: '',
    costOfReplacement: 0,
    replacedBy: '',
    notes: ''
  })

  const [lifecycleData, setLifecycleData] = useState<Partial<LifecycleStatus>>({
    status: 'operational',
    date: '',
    notes: '',
    updatedBy: ''
  })

  const [financialData, setFinancialData] = useState<Partial<FinancialData>>({
    totalCost: 0,
    depreciationRate: 0,
    currentValue: 0
  })

  // Fetch assets from API
  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
     
      let response
      if (searchTerm.trim()) {
        response = await searchAssets(searchTerm)
      } else if (selectedMobility === 'movable' || selectedMobility === 'immovable' || selectedMobility === 'all' || selectedMobility === 'inventory') {
        // For 'movable', 'immovable', 'all' and 'inventory' - get all assets with sub-assets
        // Set high limit to fetch all assets (1000 should be enough for most use cases)
        response = await assetApi.getAssetsWithSubAssets(true, 1, 10000)
      } else {
        // For 'far' - get all assets
        response = await getAssets(1, 10000)
      }
     
      if (response.success) {
        // Transform backend data to frontend format
        const apiResponse = response as ApiAssetsResponse
        
        // Filter assets by user's project
        const userProjectName = user?.projectName?.trim().toLowerCase()
        const assetsToProcess = apiResponse.assets.filter((asset: ApiAsset) => {
          if (!userProjectName) return true
          const assetProjectName = (asset.project?.projectName || '').trim().toLowerCase()
          return assetProjectName === userProjectName
        })
        
        const transformedAssets = assetsToProcess.map((asset: ApiAsset) => ({
          ...asset,
          subAssets: asset.subAssets ? {
            movable: asset.subAssets.movable.map((subAsset: ApiSubAsset) => ({
              id: subAsset._id || subAsset.id,
              _id: subAsset._id,
              tagId: subAsset.tagId, // Include tag ID
              assetName: subAsset.assetName,
              description: subAsset.description,
              category: subAsset.category,
              brand: subAsset.brand,
              model: subAsset.model,
              capacity: subAsset.capacity,
              location: subAsset.location,
              digitalTagType: subAsset.digitalTagType, // Include digital tag type
              digitalAssets: subAsset.digitalAssets as AssetClassificationItem['digitalAssets'], // Include digital assets
              hasDigitalAssets: subAsset.hasDigitalAssets, // Include digital assets flag
              inventory: subAsset.inventory
            })),
            immovable: asset.subAssets.immovable.map((subAsset: ApiSubAsset) => ({
              id: subAsset._id || subAsset.id,
              _id: subAsset._id,
              tagId: subAsset.tagId, // Include tag ID
              assetName: subAsset.assetName,
              description: subAsset.description,
              category: subAsset.category,
              brand: subAsset.brand,
              model: subAsset.model,
              capacity: subAsset.capacity,
              location: subAsset.location,
              digitalTagType: subAsset.digitalTagType, // Include digital tag type
              digitalAssets: subAsset.digitalAssets as AssetClassificationItem['digitalAssets'], // Include digital assets
              hasDigitalAssets: subAsset.hasDigitalAssets, // Include digital assets flag
              inventory: subAsset.inventory
            }))
          } : undefined
        }))
        setAssets(transformedAssets as AssetData[])
      } else {
        setError(response.message || 'Failed to fetch assets')
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch assets')
      // Fallback to sample data if API fails
    } finally {
      setLoading(false)
    }
  }, [searchTerm, selectedMobility, user?.projectName])

  // Search functionality with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        fetchAssets()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, fetchAssets])

  const getFilteredAssets = () => {
    if (selectedMobility === 'movable') {
      // Filter assets that have movable sub-assets
      return assets.filter(asset => 
        asset.subAssets?.movable && asset.subAssets.movable.length > 0
      )
    } else if (selectedMobility === 'immovable') {
      // Filter assets that have immovable sub-assets
      return assets.filter(asset => 
        asset.subAssets?.immovable && asset.subAssets.immovable.length > 0
      )
    } else if (selectedMobility === 'inventory') {
      // For inventory, filter assets that have inventory items (consumables, spare parts, tools)
      return assets.filter(asset => {
        // Check if asset has any inventory items in movable or immovable sub-assets
        const hasMovableInventory = asset.subAssets?.movable?.some(subAsset => 
          subAsset.inventory && (
            subAsset.inventory.consumables?.length > 0 ||
            subAsset.inventory.spareParts?.length > 0 ||
            subAsset.inventory.tools?.length > 0
          )
        )
        const hasImmovableInventory = asset.subAssets?.immovable?.some(subAsset => 
          subAsset.inventory && (
            subAsset.inventory.consumables?.length > 0 ||
            subAsset.inventory.spareParts?.length > 0 ||
            subAsset.inventory.tools?.length > 0
          )
        )
        return hasMovableInventory || hasImmovableInventory
      })
    } else if (selectedMobility === 'all') {
      // For all, return all assets (will show classification table)
      return assets
    } else if (selectedMobility === 'far') {
      // For FAR, return all assets (will show hierarchical view)
      return assets
    } else {
      // For other cases, return all assets
      return assets
    }
  }
  // Load assets on component mount and when user/project changes
  useEffect(() => {
    fetchAssets()
  }, [fetchAssets, user?.projectName])

  // Generate PDF function

  // Handle tag ID update
  const handleUpdateTagId = async (assetId: string, subAssetIndex: number, category: 'movable' | 'immovable', currentTagId: string) => {
    try {
      const newTagId = prompt('Enter Tag ID:', currentTagId || '');
      if (newTagId !== null && newTagId.trim() !== '') {
        // Show loading state
        setLoading(true);
        
        
        // Call API to update tag ID
        const result = await assetApi.updateSubAssetTagId(assetId, subAssetIndex, category, newTagId.trim());
        
        if (result.success) {
          // Refresh the assets list to show updated tag ID
          await fetchAssets();
          
          // Show success message
          setSuccessMessage('Tag ID updated successfully!');
        } else {
          setSuccessMessage(`Failed to update tag ID: ${result.message}`);
        }
      }
    } catch (error) {
      // Parse error message for better user feedback
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific validation errors
        if (errorMessage.includes('Validation error')) {
          errorMessage = 'Backend validation error. Please check the tag ID format.';
        } else if (errorMessage.includes('Authentication')) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (errorMessage.includes('404')) {
          errorMessage = 'Asset or sub-asset not found.';
        } else if (errorMessage.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        }
      }
      
      setSuccessMessage(`Failed to update tag ID: ${errorMessage}`);
      setShowSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Asset Classification based on actual API sub-assets data
  const getAssetClassification = (asset: AssetData): AssetClassification => {
    // Use actual sub-assets from API response and transform them to include reason
    const movableAssets = (asset.subAssets?.movable || []).map(subAsset => {
      return {
        assetName: subAsset.assetName,
        description: subAsset.description || '',
        category: subAsset.category,
        brand: subAsset.brand,
        model: subAsset.model,
        capacity: subAsset.capacity,
        location: subAsset.location,
        inventory: subAsset.inventory,
        tagId: subAsset.tagId, // Include tag ID
        digitalTagType: subAsset.digitalTagType, // Include digital tag type
        digitalAssets: subAsset.digitalAssets as AssetClassificationItem['digitalAssets'], // Include digital assets
        hasDigitalAssets: subAsset.hasDigitalAssets, // Include digital assets flag
        reason: subAsset.category === 'Movable'
          ? 'Portable equipment that can be relocated as needed.'
          : 'Fixed installations that require specialized removal procedures.'
      };
    });
   
    const immovableAssets = (asset.subAssets?.immovable || []).map(subAsset => {
      return {
        assetName: subAsset.assetName,
        description: subAsset.description || '',
        category: subAsset.category,
        brand: subAsset.brand,
        model: subAsset.model,
        capacity: subAsset.capacity,
        location: subAsset.location,
        inventory: subAsset.inventory,
        tagId: subAsset.tagId, // Include tag ID
        digitalTagType: subAsset.digitalTagType, // Include digital tag type
        digitalAssets: subAsset.digitalAssets as AssetClassificationItem['digitalAssets'], // Include digital assets
        hasDigitalAssets: subAsset.hasDigitalAssets, // Include digital assets flag
        reason: subAsset.category === 'Immovable'
          ? 'Permanently installed infrastructure that cannot be moved without demolition.'
          : 'Fixed installations requiring specialized removal procedures.'
      };
    });

    return {
      movable: movableAssets,
      immovable: immovableAssets
    }
  }

  // Fetch assets on component mount and when filters change
  useEffect(() => {
    fetchAssets()
  }, [selectedMobility, fetchAssets])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        fetchAssets()
      } else if (selectedMobility !== 'all') {
        fetchAssets()
      } else {
        fetchAssets()
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedMobility, fetchAssets])


  const handleMovableClick = (asset: AssetData) => {
    if (expandedRow === asset._id && expandedClassificationType === 'movable') {
      // If already expanded with movable, close it
      setExpandedRow(null)
      setExpandedClassificationType(null)
      // Clear inventory selections for this asset
      const newInventoryState = { ...selectedInventoryType }
      Object.keys(newInventoryState).forEach(key => {
        if (key.startsWith(asset._id)) {
          delete newInventoryState[key]
        }
      })
      setSelectedInventoryType(newInventoryState)
    } else {
      // Expand with movable classification
      setExpandedRow(asset._id)
      setExpandedClassificationType('movable')
      // Clear inventory selections for this asset
      const newInventoryState = { ...selectedInventoryType }
      Object.keys(newInventoryState).forEach(key => {
        if (key.startsWith(asset._id)) {
          delete newInventoryState[key]
        }
      })
      setSelectedInventoryType(newInventoryState)
    }
  }

  const handleImmovableClick = (asset: AssetData) => {
    if (expandedRow === asset._id && expandedClassificationType === 'immovable') {
      // If already expanded with immovable, close it
      setExpandedRow(null)
      setExpandedClassificationType(null)
      // Clear inventory selections for this asset
      const newInventoryState = { ...selectedInventoryType }
      Object.keys(newInventoryState).forEach(key => {
        if (key.startsWith(asset._id)) {
          delete newInventoryState[key]
        }
      })
      setSelectedInventoryType(newInventoryState)
    } else {
      // Expand with immovable classification
      setExpandedRow(asset._id)
      setExpandedClassificationType('immovable')
      // Clear inventory selections for this asset
      const newInventoryState = { ...selectedInventoryType }
      Object.keys(newInventoryState).forEach(key => {
        if (key.startsWith(asset._id)) {
          delete newInventoryState[key]
        }
      })
      setSelectedInventoryType(newInventoryState)
    }
  }

  const handleInventoryClick = (assetId: string, classificationIndex: number, inventoryType: 'consumables' | 'spareParts' | 'tools') => {
    const key = `${assetId}-${classificationIndex}`
    const currentSelection = selectedInventoryType[key]
   
    setSelectedInventoryType(prev => ({
      ...prev,
      [key]: currentSelection === inventoryType ? null : inventoryType
    }))
  }

  const handleRadioChange = (value: string) => {
    console.log('Radio button clicked:', value)
    setSelectedMobility(value as 'all' | 'movable' | 'immovable' | 'inventory' | 'far')
    // Trigger re-fetch when radio button changes
    fetchAssets()
  }

  const handleViewFlowchart = (asset: AssetData) => {
    setSelectedAssetForFlowchart(asset)
    setShowFlowchartModal(true)
  }

  const handleViewSubAssetDetails = (subAsset: ApiSubAsset) => {
    setSelectedSubAssetForDetails(subAsset)
    setShowSubAssetDetailsModal(true)
  }

  const handleCloseFlowchartModal = () => {
    setShowFlowchartModal(false)
    setSelectedAssetForFlowchart(null)
  }

  const handleAddAsset = () => {
    setCurrentStep('main') // Set step first
    setShowAddAssetModal(true)
    setLocationType('')
    setAssetTypeCode('')
    
    // Get project from user context or localStorage fallback
    const userProject = 
      user?.projectName || 
      localStorage.getItem('userProject') || 
      localStorage.getItem('projectName') ||
      localStorage.getItem('project') ||
      'Default Project'
    
    const userProjectId = user?.projectId || localStorage.getItem('projectId') || ''
    
    setNewAsset({
      tagId: '',
      assetType: '',
      subcategory: '',
      mobilityCategory: 'Movable',
      brand: '',
      model: '',
      serialNumber: '',
      capacity: '',
      yearOfInstallation: '',
      status: 'Active',
      priority: 'Medium',
      project: {
        projectId: userProjectId,
        projectName: userProject
      },
      location: {
        building: '',
        floor: '',
        room: ''
      },
      subAssets: {
        movable: [],
        immovable: []
      }
    })
  }

  const handleCloseAddAssetModal = () => {
    setShowAddAssetModal(false)
    setCurrentStep('main')
    // Reset main asset inventory
    setMainAssetInventory({
      consumables: [],
      spareParts: [],
      tools: [],
      operationalSupply: []
    })
  }

  const handleMainAssetSave = () => {
    if (!locationType || !assetTypeCode || !newAsset.brand) {
      alert('Please fill in all required fields (Location Type, Asset Type, Brand)')
      return
    }

    const generatedId = generateAssetId(locationType, assetTypeCode)
    if (assets.some(asset => asset.tagId === generatedId)) {
      alert('Asset ID already exists. Please use a different combination.')
      return
    }

    // Update the asset with the generated ID
    setNewAsset(prev => ({ ...prev, tagId: generatedId }))
    setCurrentStep('subassets')
  }

  const handleAddSubAsset = (category: 'Movable' | 'Immovable') => {
    const newSubAsset: SubAsset = {
      id: Date.now().toString(),
      assetName: '',
      description: '',
      category,
      brand: '',
      model: '',
      capacity: '',
      location: '',
      digitalTagType: 'qr', // Default digital tag type
      inventory: {
        consumables: [],
        spareParts: [],
        tools: [],
        operationalSupply: []
      }
    }

    setNewAsset(prev => {
      if (!prev.subAssets) return prev
     
      const categoryKey = category.toLowerCase() as 'movable' | 'immovable'
      const currentSubAssets = prev.subAssets[categoryKey] || []
     
      return {
        ...prev,
        subAssets: {
          ...prev.subAssets,
          [categoryKey]: [...currentSubAssets, newSubAsset]
        }
      }
    })
  }

  const handleSubAssetChange = (category: 'Movable' | 'Immovable', index: number, field: string, value: string) => {
    setNewAsset(prev => {
      if (!prev.subAssets) return prev
     
      const categoryKey = category.toLowerCase() as 'movable' | 'immovable'
      const currentSubAssets = prev.subAssets[categoryKey] || []
      
      // Auto-generate tag ID when asset name changes
      let updatedSubAsset = { ...currentSubAssets[index], [field]: value }
      
      if (field === 'assetName' && value.trim()) {
        const mainAssetId = prev.tagId || generateAssetId(locationType, assetTypeCode)
        const generatedTagId = generateSubAssetTagId(mainAssetId, value, category, index)
        updatedSubAsset = { ...updatedSubAsset, tagId: generatedTagId }
      }
     
      return {
        ...prev,
        subAssets: {
          ...prev.subAssets,
          [categoryKey]: currentSubAssets.map((subAsset, i) =>
            i === index ? updatedSubAsset : subAsset
          )
        }
      }
    })
  }

  const handleRemoveSubAsset = (category: 'Movable' | 'Immovable', index: number) => {
    setNewAsset(prev => {
      if (!prev.subAssets) return prev
     
      const categoryKey = category.toLowerCase() as 'movable' | 'immovable'
      const currentSubAssets = prev.subAssets[categoryKey] || []
     
      return {
        ...prev,
        subAssets: {
          ...prev.subAssets,
          [categoryKey]: currentSubAssets.filter((_, i) => i !== index)
        }
      }
    })
  }

  // Handler for main asset inventory items (not tied to sub-assets)
  const handleAddMainAssetInventoryItem = (inventoryType: 'consumables' | 'spareParts' | 'tools' | 'operationalSupply') => {
    const currentInventory = mainAssetInventory[inventoryType] || []
    const itemIndex = currentInventory.length
    
    // Generate tag ID for the new inventory item
    const mainAssetId = newAsset.tagId || ''
    const generatedTagId = mainAssetId ? generateInventoryItemTagId(mainAssetId, inventoryType, '', itemIndex) : ''
    
    const newItem: InventoryItem = {
      itemName: '',
      quantity: 0,
      status: 'Available',
      lastUpdated: new Date().toISOString().split('T')[0],
      tagId: generatedTagId
    }
    
    setMainAssetInventory(prev => ({
      ...prev,
      [inventoryType]: [...prev[inventoryType], newItem]
    }))
  }

  const handleMainAssetInventoryItemChange = (inventoryType: 'consumables' | 'spareParts' | 'tools' | 'operationalSupply', itemIndex: number, field: string, value: string | number) => {
    setMainAssetInventory(prev => ({
      ...prev,
      [inventoryType]: prev[inventoryType].map((item, j) => {
        if (j === itemIndex) {
          const updatedItem = { ...item, [field]: value }
          
          // Auto-regenerate tag ID when item name changes
          if (field === 'itemName' && newAsset.tagId) {
            const newTagId = generateInventoryItemTagId(
              newAsset.tagId,
              inventoryType,
              value as string,
              itemIndex
            )
            updatedItem.tagId = newTagId
          }
          
          return updatedItem
        }
        return item
      })
    }))
  }

  const handleRemoveMainAssetInventoryItem = (inventoryType: 'consumables' | 'spareParts' | 'tools' | 'operationalSupply', itemIndex: number) => {
    setMainAssetInventory(prev => ({
      ...prev,
      [inventoryType]: prev[inventoryType].filter((_, i) => i !== itemIndex)
    }))
  }

  const handleAddInventoryItem = (category: 'Movable' | 'Immovable', subAssetIndex: number, inventoryType: 'consumables' | 'spareParts' | 'tools' | 'operationalSupply') => {
    setNewAsset(prev => {
      if (!prev.subAssets) return prev
     
      const categoryKey = category.toLowerCase() as 'movable' | 'immovable'
      const currentSubAssets = prev.subAssets[categoryKey] || []
      const subAsset = currentSubAssets[subAssetIndex]
      
      if (!subAsset) return prev
      
      // Get current inventory items count for tag ID generation
      const currentInventory = subAsset.inventory[inventoryType] || []
      const itemIndex = currentInventory.length
      
      // Generate initial tag ID (will be regenerated when item name is entered)
      const mainAssetId = prev.tagId || ''
      const generatedTagId = mainAssetId ? generateInventoryItemTagId(mainAssetId, inventoryType, '', itemIndex) : ''
      
      const newItem: InventoryItem = {
        itemName: '',
        quantity: 0,
        status: 'Available',
        lastUpdated: new Date().toISOString().split('T')[0],
        tagId: generatedTagId
      }
     
      return {
        ...prev,
        subAssets: {
          ...prev.subAssets,
          [categoryKey]: currentSubAssets.map((subAssetItem, i) =>
            i === subAssetIndex ? {
              ...subAssetItem,
              inventory: {
                ...subAssetItem.inventory,
                [inventoryType]: [...subAssetItem.inventory[inventoryType], newItem]
              }
            } : subAssetItem
          )
        }
      }
    })
  }

  const handleInventoryItemChange = (category: 'Movable' | 'Immovable', subAssetIndex: number, inventoryType: 'consumables' | 'spareParts' | 'tools' | 'operationalSupply', itemIndex: number, field: string, value: string | number) => {
    setNewAsset(prev => {
      if (!prev.subAssets) return prev
     
      const categoryKey = category.toLowerCase() as 'movable' | 'immovable'
      const currentSubAssets = prev.subAssets[categoryKey] || []
     
      return {
        ...prev,
        subAssets: {
          ...prev.subAssets,
          [categoryKey]: currentSubAssets.map((subAsset, i) =>
            i === subAssetIndex ? {
              ...subAsset,
              inventory: {
                ...subAsset.inventory,
                [inventoryType]: subAsset.inventory[inventoryType].map((item, j) => {
                  if (j === itemIndex) {
                    const updatedItem = { ...item, [field]: value }
                    
                    // Auto-regenerate tag ID when item name changes
                    if (field === 'itemName' && prev.tagId) {
                      const newTagId = generateInventoryItemTagId(
                        prev.tagId,
                        inventoryType,
                        value as string,
                        itemIndex
                      )
                      updatedItem.tagId = newTagId
                    }
                    
                    return updatedItem
                  }
                  return item
                })
              }
            } : subAsset
          )
        }
      }
    })
  }

  const handleRemoveInventoryItem = (category: 'Movable' | 'Immovable', subAssetIndex: number, inventoryType: 'consumables' | 'spareParts' | 'tools' | 'operationalSupply', itemIndex: number) => {
    setNewAsset(prev => {
      if (!prev.subAssets) return prev
     
      const categoryKey = category.toLowerCase() as 'movable' | 'immovable'
      const currentSubAssets = prev.subAssets[categoryKey] || []
     
      return {
        ...prev,
        subAssets: {
          ...prev.subAssets,
          [categoryKey]: currentSubAssets.map((subAsset, i) =>
            i === subAssetIndex ? {
              ...subAsset,
              inventory: {
                ...subAsset.inventory,
                [inventoryType]: subAsset.inventory[inventoryType].filter((_, j) => j !== itemIndex)
              }
            } : subAsset
          )
        }
      }
    })
  }

  const handleFinalSave = async () => {
    try {
      // Prepare the asset data for API
      const assetData: CreateAssetRequest = {
        tagId: newAsset.tagId!,
        assetType: newAsset.assetType!,
        subcategory: newAsset.subcategory,
        mobilityCategory: newAsset.mobilityCategory as 'Movable' | 'Immovable',
        brand: newAsset.brand!,
        model: newAsset.model,
        serialNumber: newAsset.serialNumber,
        capacity: newAsset.capacity,
        yearOfInstallation: newAsset.yearOfInstallation,
        status: newAsset.status as 'Active' | 'Inactive' | 'Maintenance' | 'Retired',
        priority: newAsset.priority as 'High' | 'Medium' | 'Low',
        project: newAsset.project,
        location: newAsset.location!,
        subAssets: newAsset.subAssets
      }

      // Debug: Log the data being sent
      console.log('Asset data being sent to backend:', JSON.stringify(assetData, null, 2))
      console.log('Project data:', assetData.project)

      // Validate the data before sending
      const validation = validateAssetData(assetData)
      if (!validation.isValid) {
        alert(`Please fix the following errors:\n${validation.errors.join('\n')}`)
        return
      }

      // Show loading state
      const saveButton = document.querySelector('[data-testid="save-button"]') as HTMLButtonElement
      if (saveButton) {
        saveButton.disabled = true
        saveButton.textContent = 'Saving...'
      }

      // Call the API
      const response = await createAsset(assetData)
     
      if (response.success) {
        // Refresh the assets list instead of manually adding
        await fetchAssets()
        handleCloseAddAssetModal()
        alert(`Asset "${response.data.tagId}" created successfully!`)
      } else {
        throw new Error(response.message || 'Failed to create asset')
      }
    } catch (error) {
      console.error('Error creating asset:', error)
      alert(`Error creating asset: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      // Reset button state
      const saveButton = document.querySelector('[data-testid="save-button"]') as HTMLButtonElement
      if (saveButton) {
        saveButton.disabled = false
        saveButton.textContent = 'Save Complete Asset'
      }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('location.')) {
      const locationField = field.split('.')[1]
      setNewAsset(prev => ({
        ...prev,
        location: {
          ...prev.location!,
          [locationField]: value
        }
      }))
    } else {
      setNewAsset(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  // Handle location selection from dropdown
  const handleLocationSelect = (locationId: string) => {
    if (loadingLocations) return // Prevent selection while loading
    setSelectedLocationId(locationId)
    const selectedLocation = locations.find(loc => loc._id === locationId)
    if (selectedLocation) {
      // Store the display name
      const displayName = `${selectedLocation.name}${selectedLocation.type ? ` (${selectedLocation.type})` : ''}`
      setSelectedLocationName(displayName)
      
      // Auto-populate location fields based on selected location's address
      // Try to extract building, floor, room from address or name
      const address = selectedLocation.address || ''
      const name = selectedLocation.name || ''
      
      // Simple parsing: try to extract building/floor/room from address or name
      // This is a basic implementation - you may want to enhance this logic
      let building = ''
      let floor = ''
      let room = ''
      
      // Try to extract from address (common patterns)
      const addressLower = address.toLowerCase()
      const nameLower = name.toLowerCase()
      
      // Look for floor indicators
      const floorMatch = addressLower.match(/(\d+(?:st|nd|rd|th)?\s*floor|ground\s*floor|basement)/i)
      if (floorMatch) {
        floor = floorMatch[1]
      }
      
      // Look for building indicators
      const buildingMatch = addressLower.match(/(building\s*[a-z0-9]+|[^,]+building)/i)
      if (buildingMatch) {
        building = buildingMatch[1]
      } else if (nameLower.includes('building')) {
        building = name.split(' ')[0] + ' Building'
      }
      
      // Look for room indicators
      const roomMatch = addressLower.match(/(room\s*[a-z0-9]+|office|hall|lab)/i)
      if (roomMatch) {
        room = roomMatch[1]
      }
      
      // If no specific fields found, use location name as building
      if (!building && name) {
        building = name
      }
      
      // Update the asset location fields
      setNewAsset(prev => ({
        ...prev,
        location: {
          ...prev.location!,
          building: building || prev.location?.building || '',
          floor: floor || prev.location?.floor || '',
          room: room || prev.location?.room || ''
        }
      }))
    }
  }

  // Enhanced Asset Management Handlers
  const handleOpenPOModal = (asset: AssetData, subAsset?: { subAssetIndex: number; category: 'movable' | 'immovable' }) => {
    setSelectedAssetForManagement(asset)
    if (subAsset) {
      setSelectedSubAssetForManagement({
        asset,
        subAssetIndex: subAsset.subAssetIndex,
        category: subAsset.category
      })
    } else {
      setSelectedSubAssetForManagement(null)
    }
    setShowPOModal(true)
    // Reset form
    setPOData({
      poNumber: '',
      poDate: '',
      vendor: '',
      vendorContact: '',
      purchaseCost: 0,
      currency: 'INR',
      paymentTerms: '',
      deliveryDate: '',
      invoiceNumber: '',
      invoiceDate: '',
      notes: ''
    })
  }

  const handleOpenReplacementModal = (asset: AssetData, subAsset?: { subAssetIndex: number; category: 'movable' | 'immovable' }) => {
    setSelectedAssetForManagement(asset)
    if (subAsset) {
      setSelectedSubAssetForManagement({
        asset,
        subAssetIndex: subAsset.subAssetIndex,
        category: subAsset.category
      })
    } else {
      setSelectedSubAssetForManagement(null)
    }
    setShowReplacementModal(true)
    // Reset form
    setReplacementData({
      replacedAssetTagId: '',
      replacementDate: '',
      replacementReason: '',
      costOfReplacement: 0,
      replacedBy: '',
      notes: ''
    })
  }

  const handleOpenLifecycleModal = (asset: AssetData, subAsset?: { subAssetIndex: number; category: 'movable' | 'immovable' }) => {
    setSelectedAssetForManagement(asset)
    if (subAsset) {
      setSelectedSubAssetForManagement({
        asset,
        subAssetIndex: subAsset.subAssetIndex,
        category: subAsset.category
      })
    } else {
      setSelectedSubAssetForManagement(null)
    }
    setShowLifecycleModal(true)
    // Reset form
    setLifecycleData({
      status: 'operational',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      updatedBy: ''
    })
  }

  const handleQRCodeClick = (qrData: {
    url: string
    data: Record<string, unknown>
    generatedAt: string
  }) => {
    setSelectedQRData(qrData)
    setShowQRModal(true)
  }

  const handleSavePO = async () => {
    if (!selectedAssetForManagement || !poData.poNumber || !poData.vendor) {
      alert('Please fill in all required fields (PO Number, Vendor)')
      return
    }

    try {
      setLoading(true)
      
      let response
      if (selectedSubAssetForManagement) {
        // Link sub-asset to PO
        response = await assetApi.linkSubAssetToPO(
          selectedAssetForManagement._id,
          selectedSubAssetForManagement.subAssetIndex,
          selectedSubAssetForManagement.category,
          poData as PurchaseOrder
        )
      } else {
        // Link main asset to PO
        response = await assetApi.linkAssetToPO(selectedAssetForManagement._id, poData as PurchaseOrder)
      }

      if (response.success) {
        await fetchAssets()
        setShowPOModal(false)
        setSuccessMessage('Purchase Order linked successfully!')
        setShowSuccess(true)
      } else {
        throw new Error(response.message || 'Failed to link Purchase Order')
      }
    } catch (error) {
      console.error('Error linking PO:', error)
      alert(`Error linking PO: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveReplacement = async () => {
    if (!selectedAssetForManagement || !replacementData.replacedAssetTagId || !replacementData.replacementReason) {
      alert('Please fill in all required fields (Replaced Asset Tag ID, Replacement Reason)')
      return
    }

    try {
      setLoading(true)
      
      let response
      if (selectedSubAssetForManagement) {
        // Record sub-asset replacement
        response = await assetApi.recordSubAssetReplacement(
          selectedAssetForManagement._id,
          selectedSubAssetForManagement.subAssetIndex,
          selectedSubAssetForManagement.category,
          replacementData as ReplacementRecord
        )
      } else {
        // Record main asset replacement
        response = await assetApi.recordAssetReplacement(selectedAssetForManagement._id, replacementData as ReplacementRecord)
      }

      if (response.success) {
        await fetchAssets()
        setShowReplacementModal(false)
        setSuccessMessage('Replacement recorded successfully!')
        setShowSuccess(true)
      } else {
        throw new Error(response.message || 'Failed to record replacement')
      }
    } catch (error) {
      console.error('Error recording replacement:', error)
      alert(`Error recording replacement: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLifecycle = async () => {
    if (!selectedAssetForManagement || !lifecycleData.status || !lifecycleData.date) {
      alert('Please fill in all required fields (Status, Date)')
      return
    }

    try {
      setLoading(true)
      
      let response
      if (selectedSubAssetForManagement) {
        // Update sub-asset lifecycle status
        response = await assetApi.updateSubAssetLifecycleStatus(
          selectedAssetForManagement._id,
          selectedSubAssetForManagement.subAssetIndex,
          selectedSubAssetForManagement.category,
          lifecycleData as LifecycleStatus
        )
      } else {
        // Update main asset lifecycle status
        response = await assetApi.updateAssetLifecycleStatus(selectedAssetForManagement._id, lifecycleData as LifecycleStatus)
      }

      if (response.success) {
        await fetchAssets()
        setShowLifecycleModal(false)
        setSuccessMessage('Lifecycle status updated successfully!')
        setShowSuccess(true)
      } else {
        throw new Error(response.message || 'Failed to update lifecycle status')
      }
    } catch (error) {
      console.error('Error updating lifecycle:', error)
      alert(`Error updating lifecycle: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFinancial = async () => {
    if (!selectedAssetForManagement) {
      alert('No asset selected')
      return
    }

    try {
      setLoading(true)
      
      const response = await assetApi.updateAssetFinancialData(selectedAssetForManagement._id, financialData)

      if (response.success) {
        await fetchAssets()
        setShowFinancialModal(false)
        setSuccessMessage('Financial data updated successfully!')
        setShowSuccess(true)
      } else {
        throw new Error(response.message || 'Failed to update financial data')
      }
    } catch (error) {
      console.error('Error updating financial data:', error)
      alert(`Error updating financial data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }


  const generatePDF = async (asset: AssetData) => {
    const doc = new jsPDF()
    const assetClassification = getAssetClassification(asset)
   
    let yPosition = 15
   
    // Clean Header Design
    try {
      // Add EXOZEN logo image
      const logoUrl = '/exozen_logo1.png'
      doc.addImage(logoUrl, 'PNG', 15, 8, 30, 12)
    } catch {
      // Fallback to text if image fails to load
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('EXOZEN', 15, 18)
    }
   
    // Report Title and Asset Info
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Asset Classification Report', 50, 12)
   
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Asset ID: ${asset.tagId}`, 50, 18)
   
    // Date and Brand Info
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 12)
    doc.text(`Type: ${asset.assetType}`, 150, 16)
    doc.text(`Brand: ${asset.brand}`, 150, 20)
   
    // Header separator line
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(15, 25, 195, 25)
   
    yPosition = 35
   
    // Two Column Layout
    const leftColumnX = 15
    const rightColumnX = 110
    const columnWidth = 85
   
    // Left Column - Asset Overview Table
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Asset Overview', leftColumnX, yPosition)
    yPosition += 8
   
    const overviewData = [
      ['Asset ID', asset.tagId],
      ['Asset Type', asset.assetType],
      ['Subcategory', asset.subcategory || 'N/A'],
      ['Brand', asset.brand],
      ['Model', asset.model || 'N/A'],
      ['Capacity', asset.capacity || 'N/A'],
      ['Status', asset.status || 'Active'],
      ['Priority', asset.priority || 'Medium'],
      ['Location', asset.location ? `${asset.location.building}, ${asset.location.floor}, ${asset.location.room}` : 'Not Set']
    ]
   
    autoTable(doc, {
      startY: yPosition,
      head: [['Property', 'Value']],
      body: overviewData,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue header background
        textColor: [255, 255, 255], // White text
        fontStyle: 'bold',
        lineColor: [37, 99, 235], // Darker blue border
        lineWidth: 0.5
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [220, 220, 220],
        lineWidth: 0.3
      },
      margin: { left: leftColumnX, right: 15 },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 45 }
      },
    })
   
    const leftTableEndY = doc.lastAutoTable.finalY
   
    // Right Column - Flowchart
    let rightY = 35
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Asset Classification Flowchart', rightColumnX, rightY)
    rightY += 15
   
    // Main Asset Box
    const centerX = rightColumnX + columnWidth / 2
    const boxWidth = 50
    const boxHeight = 15
   
    doc.setFillColor(245, 245, 245)
    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.5)
    doc.rect(centerX - boxWidth/2, rightY, boxWidth, boxHeight, 'FD')
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(asset.assetType, centerX - boxWidth/2 + 3, rightY + 8)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text('Main Asset', centerX - boxWidth/2 + 3, rightY + 12)
   
    rightY += boxHeight + 8
   
    // Arrow Indicator (using a simple line-based arrow)
    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(1)
    // Draw a simple arrow using lines
    doc.line(centerX - 3, rightY, centerX + 3, rightY) // horizontal line
    doc.line(centerX, rightY, centerX - 2, rightY + 3) // left diagonal
    doc.line(centerX, rightY, centerX + 2, rightY + 3) // right diagonal
    rightY += 8
   
    // Two Branches
    const leftX = rightColumnX + 10
    const rightX = rightColumnX + 50
    const branchWidth = 30
    const branchHeight = 12
   
    // Movable branch
    doc.setFillColor(240, 248, 255)
    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.5)
    doc.rect(leftX, rightY, branchWidth, branchHeight, 'FD')
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('Movable', leftX + 2, rightY + 6)
    doc.setFontSize(5)
    doc.setFont('helvetica', 'normal')
    doc.text(`${assetClassification.movable.length} items`, leftX + 2, rightY + 10)
   
    // Immovable branch
    doc.setFillColor(248, 255, 248)
    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.5)
    doc.rect(rightX, rightY, branchWidth, branchHeight, 'FD')
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('Immovable', rightX + 2, rightY + 6)
    doc.setFontSize(5)
    doc.setFont('helvetica', 'normal')
    doc.text(`${assetClassification.immovable.length} items`, rightX + 2, rightY + 10)
   
    rightY += branchHeight + 15
   
    // Components Table (Right Column)
    const allComponents = [
      ...assetClassification.movable.map(item => ({ ...item, type: 'Movable' })),
      ...assetClassification.immovable.map(item => ({ ...item, type: 'Immovable' }))
    ]
   
    const componentsTableData = allComponents.map((item, index) => [
      index + 1,
      `${item.type === 'Movable' ? '[M]' : '[I]'} ${item.assetName}`,
      item.tagId || 'No Tag ID',
      item.brand || 'N/A',
      item.model || 'N/A',
      item.capacity || 'N/A',
      item.location || 'N/A'
    ])
   
    autoTable(doc, {
      startY: rightY,
      head: [['#', 'Component Name', 'Tag ID', 'Brand', 'Model', 'Capacity', 'Location']],
      body: componentsTableData,
      styles: {
        fontSize: 6,
        cellPadding: 1.5,
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue header background
        textColor: [255, 255, 255], // White text
        fontStyle: 'bold',
        lineColor: [37, 99, 235], // Darker blue border
        lineWidth: 0.5
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [220, 220, 220],
        lineWidth: 0.3
      },
      margin: { left: rightColumnX, right: 15 },
      columnStyles: {
        0: { cellWidth: 6 },
        1: { cellWidth: 20, fontStyle: 'bold' },
        2: { cellWidth: 20, fontStyle: 'bold' },
        3: { cellWidth: 12 },
        4: { cellWidth: 12 },
        5: { cellWidth: 8 },
        6: { cellWidth: 12 }
      },
    })
   
    // Summary Section (Left Column - below Asset Overview)
    const summaryY = leftTableEndY + 15
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary', leftColumnX, summaryY)
   
    const summaryData = [
      ['Movable', assetClassification.movable.length.toString()],
      ['Immovable', assetClassification.immovable.length.toString()],
      ['Total', (assetClassification.movable.length + assetClassification.immovable.length).toString()],
      ['Report Generated', new Date().toLocaleString()]
    ]
   
    autoTable(doc, {
      startY: summaryY + 8,
      head: [['Metric', 'Value']],
      body: summaryData,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue header background
        textColor: [255, 255, 255], // White text
        fontStyle: 'bold',
        lineColor: [37, 99, 235], // Darker blue border
        lineWidth: 0.5
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [220, 220, 220],
        lineWidth: 0.3
      },
      margin: { left: leftColumnX, right: 15 },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 40 }
      },
    })
   
    // Simple Footer
    const pageHeight = doc.internal.pageSize.height
    const footerY = pageHeight - 10
   
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text('EXOZEN Digital Asset Management System', 15, footerY)
    doc.text(`Report ID: ${asset.tagId}-${Date.now()}`, 150, footerY)
   
    // Save the PDF
    doc.save(`${asset.tagId}_${asset.assetType}_Classification_Report.pdf`)
  }


  const filteredAssets = getFilteredAssets()


  // Show main assets view
  return (
    <ProtectedRoute>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0px); }
        }
      `}</style>
      <div className="min-h-screen bg-background transition-colors duration-200">
        <div className="p-0">
          <div className="w-full">

            {/* Search and Filters */}
            <div className="mb-4 px-4 py-2">
              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search assets by ID, brand, model, or subcategory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
                  />
                </div>

                {/* Mobile Layout for Filters */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {/* Mobility Filter */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <Label className="text-sm font-medium text-blue-800 dark:text-blue-200 whitespace-nowrap">Mobility:</Label>
                    <RadioGroup
                      value={selectedMobility}
                      onValueChange={handleRadioChange}
                      className="flex flex-col sm:flex-row gap-2 sm:gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all" className="cursor-pointer text-sm">All</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="movable" id="movable" />
                        <Label htmlFor="movable" className="cursor-pointer flex items-center space-x-1 text-sm">
                          <Package className="w-4 h-4" />
                          <span>Movable</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="immovable" id="immovable" />
                        <Label htmlFor="immovable" className="cursor-pointer flex items-center space-x-1 text-sm">
                          <Building className="w-4 h-4" />
                          <span>Immovable</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="inventory" id="inventory" />
                        <Label htmlFor="inventory" className="cursor-pointer flex items-center space-x-1 text-sm">
                          <Archive className="w-4 h-4" />
                          <span>Inventory</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="far" id="far" />
                        <Label htmlFor="far" className="cursor-pointer flex items-center space-x-1 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>FAR</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                   
                  {/* Add Asset Button */}
                  <Button
                    onClick={handleAddAsset}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Add Asset
                  </Button>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {showSuccess && (
              <div className="mb-4 px-4">
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
                  <span>{successMessage}</span>
                  <button
                    onClick={() => setShowSuccess(false)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

        {/* Loading State */}
        {loading && (
          <div className="bg-background rounded-lg shadow-sm border border-border p-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-muted-foreground">Loading assets...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-background rounded-lg shadow-sm border border-border p-8">
            <div className="text-center">
              <div className="text-red-600 mb-2">⚠️ Error loading assets</div>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchAssets} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Assets Classification Table - Show when Inventory, All, Movable, or Immovable radio button is selected */}
        {(selectedMobility === 'inventory' || selectedMobility === 'all' || selectedMobility === 'movable' || selectedMobility === 'immovable') && (
          <div className="mt-6 bg-background rounded-lg shadow-lg overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                    <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                      SI Number
                    </th>
                    <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                      Tag ID
                    </th>
                    <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                      Asset Name / Type
                    </th>
                    <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                      Parent Asset
                    </th>
                    <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                      Parent Asset Tag ID
                    </th>
                    <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                      Location
                    </th>
                    <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                      QR Code
                    </th>
                    <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Debug: Log the structure of filteredAssets
                    console.log('Debug - filteredAssets:', filteredAssets)
                    console.log('Debug - first asset subAssets:', filteredAssets[0]?.subAssets)
                    
                    // Get all sub-assets directly from the API response
                    const allSubAssets = filteredAssets.flatMap((asset) => {
                      console.log('Debug - processing asset:', asset.assetType, 'subAssets:', asset.subAssets)
                      
                      const subAssets = []
                      
                      // Only include movable sub-assets if mobility filter is 'movable', 'all', or 'inventory'
                      if (selectedMobility === 'movable' || selectedMobility === 'all' || selectedMobility === 'inventory') {
                        const movableSubAssets = (asset.subAssets?.movable || []).map(subAsset => ({
                          ...subAsset,
                          parentAsset: asset,
                          category: 'Movable'
                        }))
                        subAssets.push(...movableSubAssets)
                      }
                      
                      // Only include immovable sub-assets if mobility filter is 'immovable', 'all', or 'inventory'
                      if (selectedMobility === 'immovable' || selectedMobility === 'all' || selectedMobility === 'inventory') {
                        const immovableSubAssets = (asset.subAssets?.immovable || []).map(subAsset => ({
                          ...subAsset,
                          parentAsset: asset,
                          category: 'Immovable'
                        }))
                        subAssets.push(...immovableSubAssets)
                      }
                      
                      return subAssets
                    })
                    
                    // Apply search filter on sub-assets
                    const searchTermLower = searchTerm.toLowerCase().trim()
                    const filteredSubAssets = allSubAssets.filter(subAsset => {
                      if (!searchTermLower) return true
                      
                      // Search in multiple fields
                      const assetName = (subAsset.assetName || '').toLowerCase()
                      const brand = (subAsset.brand || '').toLowerCase()
                      const model = (subAsset.model || '').toLowerCase()
                      const location = (subAsset.location || '').toLowerCase()
                      const tagId = (subAsset.tagId || '').toLowerCase()
                      const category = (subAsset.category || '').toLowerCase()
                      
                      return assetName.includes(searchTermLower) ||
                             brand.includes(searchTermLower) ||
                             model.includes(searchTermLower) ||
                             location.includes(searchTermLower) ||
                             tagId.includes(searchTermLower) ||
                             category.includes(searchTermLower)
                    })
                    
                    console.log('Debug - allSubAssets found:', allSubAssets.length, 'filtered:', filteredSubAssets.length)
                    
                    if (filteredSubAssets.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="border border-border px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            <div className="flex flex-col items-center gap-2">
                              <Package className="w-8 h-8 text-gray-400" />
                              <p>{searchTerm ? 'No matching sub-assets found' : 'No sub-assets found'}</p>
                              <p className="text-sm">Debug: Found {filteredAssets.length} main assets, {allSubAssets.length} total sub-assets</p>
                              {searchTerm && (
                                <p className="text-xs text-blue-600">
                                  Try adjusting your search term: &quot;{searchTerm}&quot;
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    }
                    
                    return filteredSubAssets.map((subAsset, index) => (
                      <tr key={`${subAsset.parentAsset._id}-${index}`} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <td className="border border-border px-4 py-3">
                          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                            {index + 1}
                          </span>
                        </td>
                        <td className="border border-border px-4 py-3">
                          <span className="text-sm font-mono text-blue-700 dark:text-blue-300">
                            {subAsset.tagId || 'N/A'}
                          </span>
                        </td>
                        <td className="border border-border px-4 py-3">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              {subAsset.category === 'Movable' ? (
                                <Package className="w-4 h-4 text-green-600" />
                              ) : (
                                <Building className="w-4 h-4 text-blue-600" />
                              )}
                              <span className="font-medium text-blue-800 dark:text-blue-200">
                                {subAsset.assetName}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="border border-border px-4 py-3">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {subAsset.parentAsset?.assetType || 'N/A'}
                          </span>
                        </td>
                        <td className="border border-border px-4 py-3">
                          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                            {subAsset.parentAsset?.tagId || 'N/A'}
                          </span>
                        </td>
                        <td className="border border-border px-4 py-3">
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {subAsset.location}
                          </div>
                        </td>
                        <td className="border border-border px-4 py-3">
                          {subAsset.digitalAssets?.qrCode ? (
                            <button
                              onClick={() => handleQRCodeClick(subAsset.digitalAssets!.qrCode!)}
                              className="flex items-center justify-center p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer group"
                              title="Click to view QR Code"
                            >
                              <Image
                                src={subAsset.digitalAssets.qrCode.url.startsWith('http') ? subAsset.digitalAssets.qrCode.url : `https://digitalasset.zenapi.co.in${subAsset.digitalAssets.qrCode.url}`}
                                alt="QR Code"
                                width={50}
                                height={50}
                                className="border border-gray-200 dark:border-gray-600 rounded-md shadow-sm group-hover:shadow-md transition-shadow"
                                style={{ objectFit: 'contain' }}
                                onError={(e) => {
                                  console.error('QR Code image failed to load:', subAsset.digitalAssets?.qrCode?.url)
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="border border-border px-4 py-3">
                          <button
                            onClick={() => handleViewSubAssetDetails(subAsset as ApiSubAsset)}
                            className="group relative px-4 py-2.5 text-sm font-medium rounded-lg bg-purple-50 dark:bg-purple-900/10 border-2 border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                          >
                            <div className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
                            <Eye className="w-4 h-4 relative z-10" />
                            <span className="relative z-10">View Details</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FAR Table View - Show when FAR radio button is selected */}
        {selectedMobility === 'far' && (
          <div className="mt-6 bg-background rounded-lg shadow-lg overflow-hidden border border-border">
            <div className="p-4 border-b border-border bg-blue-50 dark:bg-slate-800">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                FAR - Fixed Asset Register
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-sans text-base table-fixed min-w-[1200px] xl:min-w-[1400px]" style={{width: '100%', tableLayout: 'fixed'}}>
                <thead>
                  <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '10%'}}>
                      ASSET ID
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '18%'}}>
                      TYPE & SUBCATEGORY
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '12%'}}>
                      BRAND & MODEL
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '8%'}}>
                      CAPACITY
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '8%'}}>
                      STATUS
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '20%'}}>
                      LOCATION
                    </th>
                    <th className="border border-border px-2 py-3 text-center font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '12%'}}>
                      <div className="flex flex-col items-center gap-1">
                        <span>PURCHASE DETAILS</span>
                        <div className="text-xs font-normal text-blue-600 dark:text-blue-300">
                          PO, Replace, Lifecycle
                        </div>
                      </div>
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '12%'}}>
                      <div className="flex flex-col items-center gap-1">
                        <span>ACTIONS</span>
                        <div className="text-xs font-normal text-blue-600 dark:text-blue-300">
                          Classification & View
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Apply search filter on main assets for FAR view
                    const searchTermLower = searchTerm.toLowerCase().trim()
                    const farFilteredAssets = searchTermLower 
                      ? filteredAssets.filter(asset => {
                          const tagId = (asset.tagId || '').toLowerCase()
                          const assetType = (asset.assetType || '').toLowerCase()
                          const subcategory = (asset.subcategory || '').toLowerCase()
                          const brand = (asset.brand || '').toLowerCase()
                          const model = (asset.model || '').toLowerCase()
                          
                          return tagId.includes(searchTermLower) ||
                                 assetType.includes(searchTermLower) ||
                                 subcategory.includes(searchTermLower) ||
                                 brand.includes(searchTermLower) ||
                                 model.includes(searchTermLower)
                        })
                      : filteredAssets
                    
                    if (farFilteredAssets.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="border border-border px-4 py-8 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Package className="w-8 h-8 text-gray-400" />
                              <p>{searchTerm ? 'No matching assets found' : 'No assets found'}</p>
                              {searchTerm && (
                                <p className="text-xs text-blue-600">
                                  Try adjusting your search term: &quot;{searchTerm}&quot;
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    }
                    
                    return farFilteredAssets.map((asset) => {
                      const isExpanded = expandedRow === asset._id
                      const assetClassification = isExpanded ? getAssetClassification(asset) : null
                     
                      return (
                        <React.Fragment key={asset._id}>
                          {/* Main Asset Row */}
                          <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '10%'}}>
                              <span className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200">
                                {asset.tagId}
                              </span>
                            </td>
                            <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '18%'}}>
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1 sm:p-2 bg-blue-50 rounded-lg">
                                  {asset.mobilityCategory === 'Movable' ? (
                                    <Package className="w-3 h-3 sm:w-5 sm:h-5 text-blue-800" />
                                  ) : (
                                    <Building className="w-3 h-3 sm:w-5 sm:h-5 text-blue-800" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs sm:text-sm font-medium text-blue-800 truncate">
                                    {asset.assetType}
                                  </div>
                                  <div className="text-xs text-blue-600 truncate">
                                    {asset.subcategory || 'No subcategory'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '12%'}}>
                              <div className="text-xs sm:text-sm text-blue-800 break-words leading-tight">
                                <div className="font-medium">{asset.brand || 'N/A'}</div>
                                <div className="text-blue-600">{asset.model || 'No model'}</div>
                              </div>
                            </td>
                            <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '8%'}}>
                              <span className="text-xs sm:text-sm text-blue-800">
                                {asset.capacity || 'N/A'}
                              </span>
                            </td>
                            <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '8%'}}>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                asset.status === 'Active' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                  : asset.status === 'Inactive'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                              }`}>
                                {asset.status || 'Active'}
                              </span>
                            </td>
                            <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '20%'}}>
                              <div className="text-xs sm:text-sm text-blue-800 break-words leading-tight">
                                {asset.location?.building && asset.location?.floor && asset.location?.room
                                  ? `${asset.location.building}, ${asset.location.floor}, ${asset.location.room}`
                                  : 'Location not set'
                                }
                              </div>
                            </td>
                            <td className="border border-border px-2 py-3" style={{width: '12%'}}>
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  onClick={() => handleOpenPOModal(asset)}
                                  className="px-1.5 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:shadow-sm whitespace-nowrap w-full justify-center"
                                  title="Link Purchase Order"
                                >
                                  <Receipt className="w-3 h-3" />
                                  PO
                                </button>
                                <button
                                  onClick={() => handleOpenReplacementModal(asset)}
                                  className="px-1.5 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 hover:shadow-sm whitespace-nowrap w-full justify-center"
                                  title="Record Replacement"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Replace
                                </button>
                                <button
                                  onClick={() => handleOpenLifecycleModal(asset)}
                                  className="px-1.5 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 hover:shadow-sm whitespace-nowrap w-full justify-center"
                                  title="Update Lifecycle Status"
                                >
                                  <Activity className="w-3 h-3" />
                                  Lifecycle
                                </button>
                              </div>
                            </td>
                            <td className="border border-border px-2 py-3" style={{width: '12%'}}>
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  onClick={() => handleMovableClick(asset)}
                                  className={`px-1.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                                    isExpanded && expandedClassificationType === 'movable'
                                      ? 'text-white bg-green-600 hover:bg-green-700 shadow-md transform scale-105'
                                      : 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 hover:shadow-sm'
                                  } whitespace-nowrap w-full justify-center`}
                                  title="View Movable Assets"
                                >
                                  <Package className="w-3 h-3" />
                                  Movable
                                </button>
                                <button
                                  onClick={() => handleImmovableClick(asset)}
                                  className={`px-1.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                                    isExpanded && expandedClassificationType === 'immovable'
                                      ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-md transform scale-105'
                                      : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:shadow-sm'
                                  } whitespace-nowrap w-full justify-center`}
                                  title="View Immovable Assets"
                                >
                                  <Building className="w-3 h-3" />
                                  Immovable
                                </button>
                                <button
                                  onClick={() => handleViewFlowchart(asset)}
                                  className="px-1.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:shadow-sm whitespace-nowrap w-full justify-center"
                                  title="View Asset Classification Flowchart"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Expanded Classification Row */}
                          {isExpanded && assetClassification && (
                            <tr>
                              <td colSpan={8} className="border border-border p-0 bg-gray-50 dark:bg-gray-800">
                                <div className="p-4">
                                  <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
                                    {expandedClassificationType === 'movable' ? 'Movable' : 'Immovable'} Assets Classification
                                  </h4>
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                      <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                          <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Asset Name
                                          </th>
                                          <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Tag ID
                                          </th>
                                          <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Brand
                                          </th>
                                          <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Model
                                          </th>
                                          <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Capacity
                                          </th>
                                          <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Location
                                          </th>
                                          <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Actions
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(expandedClassificationType === 'movable' ? assetClassification.movable : assetClassification.immovable).map((classificationAsset, index) => (
                                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                                              <div className="flex items-center gap-2">
                                                {expandedClassificationType === 'movable' ? (
                                                  <Package className="w-4 h-4 text-green-600" />
                                                ) : (
                                                  <Building className="w-4 h-4 text-blue-600" />
                                                )}
                                                <span className="font-medium text-blue-800 dark:text-blue-200">
                                                  {classificationAsset.assetName}
                                                </span>
                                              </div>
                                            </td>
                                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                                              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                                                {classificationAsset.tagId || 'No Tag ID'}
                                              </span>
                                            </td>
                                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                              {classificationAsset.brand || 'N/A'}
                                            </td>
                                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                              {classificationAsset.model || 'N/A'}
                                            </td>
                                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                              {classificationAsset.capacity || 'N/A'}
                                            </td>
                                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                              {classificationAsset.location || 'N/A'}
                                            </td>
                                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                                              <div className="flex gap-1">
                                                <button
                                                  onClick={() => asset._id && handleInventoryClick(asset._id, index, 'consumables')}
                                                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                                    selectedInventoryType[`${asset._id}-${index}`] === 'consumables'
                                                      ? 'text-white bg-orange-600 hover:bg-orange-700 shadow-sm'
                                                      : 'text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200'
                                                  } whitespace-nowrap`}
                                                  title="View Consumables"
                                                >
                                                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                                  Consumables
                                                </button>
                                                <button
                                                  onClick={() => asset._id && handleInventoryClick(asset._id, index, 'spareParts')}
                                                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                                    selectedInventoryType[`${asset._id}-${index}`] === 'spareParts'
                                                      ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-sm'
                                                      : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                                                  } whitespace-nowrap`}
                                                  title="View Spare Parts"
                                                >
                                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                  Spare Parts
                                                </button>
                                                <button
                                                  onClick={() => asset._id && handleInventoryClick(asset._id, index, 'tools')}
                                                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                                    selectedInventoryType[`${asset._id}-${index}`] === 'tools'
                                                      ? 'text-white bg-green-600 hover:bg-green-700 shadow-sm'
                                                      : 'text-green-600 bg-green-50 hover:bg-green-100 border border-green-200'
                                                  } whitespace-nowrap`}
                                                  title="View Tools"
                                                >
                                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                  Tools
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assets Table - Desktop View */}
        {!loading && !error && selectedMobility !== 'inventory' && selectedMobility !== 'all' && selectedMobility !== 'movable' && selectedMobility !== 'immovable' && selectedMobility !== 'far' && (
          <div className="bg-background rounded-lg shadow-lg overflow-hidden border border-border w-full">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto w-full">
              <table className="w-full border-collapse font-sans text-base table-fixed min-w-[1200px] xl:min-w-[1400px]" style={{width: '100%', tableLayout: 'fixed'}}>
                <thead>
                  <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '10%'}}>
                      ASSET ID
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '18%'}}>
                      TYPE & SUBCATEGORY
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '12%'}}>
                      BRAND & MODEL
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '8%'}}>
                      CAPACITY
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '8%'}}>
                      STATUS
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '20%'}}>
                      LOCATION
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '12%'}}>
                      <div className="flex flex-col items-center gap-1">
                        <span>PURCHASE DETAILS</span>
                        <div className="text-xs font-normal text-blue-600 dark:text-blue-300">
                          PO, Replace, Lifecycle
                        </div>
                      </div>
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '12%'}}>
                      <div className="flex flex-col items-center gap-1">
                        <span>ACTIONS</span>
                        <div className="text-xs font-normal text-blue-600 dark:text-blue-300">
                          Classification & View
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => {
                    const isExpanded = expandedRow === asset._id
                    const assetClassification = isExpanded ? getAssetClassification(asset) : null
                   
                    return (
                      <React.Fragment key={asset._id}>
                        {/* Main Asset Row */}
                        <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '10%'}}>
                            <span className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200">
                              {asset.tagId}
                            </span>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '18%'}}>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="p-1 sm:p-2 bg-blue-50 rounded-lg">
                                {asset.mobilityCategory === 'Movable' ? (
                                  <Package className="w-3 h-3 sm:w-5 sm:h-5 text-blue-800" />
                                ) : (
                                  <Building className="w-3 h-3 sm:w-5 sm:h-5 text-blue-800" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs sm:text-sm font-medium text-blue-800 truncate">
                                  {asset.assetType}
                                </div>
                                <div className="text-xs text-blue-600 truncate">
                                  {asset.subcategory || 'No subcategory'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '12%'}}>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-medium text-blue-800 truncate">
                                {asset.brand}
                              </div>
                              <div className="text-xs text-blue-600 truncate">
                                {asset.model || 'No model'}
                              </div>
                            </div>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '8%'}}>
                            <span className="text-xs sm:text-sm text-blue-800">
                              {asset.capacity || 'N/A'}
                            </span>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '8%'}}>
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                              {asset.status || 'Active'}
                            </span>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '20%'}}>
                            <div className="text-xs sm:text-sm text-blue-800 break-words leading-tight">
                              {asset.location?.building && asset.location?.floor && asset.location?.room
                                ? `${asset.location.building}, ${asset.location.floor}, ${asset.location.room}`
                                : 'Location not set'
                              }
                            </div>
                          </td>
                          <td className="border border-border px-2 py-3" style={{width: '12%'}}>
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => handleOpenPOModal(asset)}
                                className="px-1.5 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:shadow-sm whitespace-nowrap w-full justify-center"
                                title="Link Purchase Order"
                              >
                                <Receipt className="w-3 h-3" />
                                PO
                              </button>
                              <button
                                onClick={() => handleOpenReplacementModal(asset)}
                                className="px-1.5 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 hover:shadow-sm whitespace-nowrap w-full justify-center"
                                title="Record Replacement"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Replace
                              </button>
                              <button
                                onClick={() => handleOpenLifecycleModal(asset)}
                                className="px-1.5 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 hover:shadow-sm whitespace-nowrap w-full justify-center"
                                title="Update Lifecycle Status"
                              >
                                <Activity className="w-3 h-3" />
                                Lifecycle
                              </button>
                            </div>
                          </td>
                          <td className="border border-border px-2 py-3" style={{width: '12%'}}>
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => handleMovableClick(asset)}
                                className={`px-1.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                                  isExpanded && expandedClassificationType === 'movable'
                                    ? 'text-white bg-green-600 hover:bg-green-700 shadow-md transform scale-105'
                                    : 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 hover:shadow-sm'
                                } whitespace-nowrap w-full justify-center`}
                                title="View Movable Assets"
                              >
                                <Package className="w-3 h-3" />
                                Movable
                              </button>
                              <button
                                onClick={() => handleImmovableClick(asset)}
                                className={`px-1.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                                  isExpanded && expandedClassificationType === 'immovable'
                                    ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-md transform scale-105'
                                    : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:shadow-sm'
                                } whitespace-nowrap w-full justify-center`}
                                title="View Immovable Assets"
                              >
                                <Building className="w-3 h-3" />
                                Immovable
                              </button>
                              <button
                                onClick={() => handleViewFlowchart(asset)}
                                className="px-1.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:shadow-sm whitespace-nowrap w-full justify-center"
                                title="View Asset Classification Flowchart"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                       
                        {/* Expanded Classification Row */}
                        {isExpanded && assetClassification && (
                          <tr>
                            <td colSpan={8} className="border border-border p-0 bg-gray-50 dark:bg-gray-800">
                              <div className="p-4">
                                <div className="mb-3">
                                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-1">
                                    {asset.tagId} - {asset.brand} {asset.model}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {expandedClassificationType === 'movable' ? 'Movable' : 'Immovable'} Assets Classification for {asset.assetType} ({asset.subcategory})
                                  </p>
                                </div>
                               
                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                                          Asset Name / Type
                                        </th>
                                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                                          Brand
                                        </th>
                                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                                          Model
                                        </th>
                                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                                          Capacity
                                        </th>
                                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                                          Location
                                        </th>
                                        <th className="border border-border px-4 py-3 text-center font-semibold text-blue-800 dark:text-blue-200 text-sm">
                                          <div className="flex flex-col gap-1">
                                            <span>Purchase Details</span>
                                            <div className="text-xs font-normal text-blue-600 dark:text-blue-300">
                                              PO, Replace, Lifecycle
                                            </div>
                                          </div>
                                        </th>
                                        <th className="border border-border px-4 py-3 text-center font-semibold text-blue-800 dark:text-blue-200 text-sm">
                                          <div className="flex flex-col gap-1">
                                            <span>Actions</span>
                                            <div className="text-xs font-normal text-blue-600 dark:text-blue-300">
                                              Digital Assets & Inventory
                                            </div>
                                          </div>
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {assetClassification[expandedClassificationType!].map((classificationAsset: AssetClassificationItem, index: number) => {
                                        // Use actual sub-asset data from the API response
                                        const subAssetData = {
                                          brand: classificationAsset.brand || 'Unknown',
                                          model: classificationAsset.model || 'Unknown',
                                          capacity: classificationAsset.capacity || 'Unknown',
                                          location: classificationAsset.location || 'Unknown'
                                        }
                                       
                                        return (
                                          <React.Fragment key={index}>
                                            <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                              <td className="border border-border px-4 py-3">
                                                <div className="space-y-2">
                                                  <div className="flex items-center space-x-2">
                                                    {expandedClassificationType === 'movable' ? (
                                                      <Package className="w-4 h-4 text-green-600" />
                                                    ) : (
                                                      <Building className="w-4 h-4 text-blue-600" />
                                                    )}
                                                    <span className="font-medium text-blue-800 dark:text-blue-200">
                                                      {classificationAsset.assetName}
                                                    </span>
                                                  </div>
                                                  {/* Tag ID Display */}
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">Tag ID:</span>
                                                    {(() => {
                                                      return classificationAsset.tagId ? (
                                                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                                                          {classificationAsset.tagId}
                                                        </span>
                                                      ) : (
                                                        <span className="text-xs text-gray-400 italic">No tag ID</span>
                                                      );
                                                    })()}
                                                    <button
                                                      onClick={() => handleUpdateTagId(asset._id, index, expandedClassificationType!, classificationAsset.tagId || '')}
                                                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                      title="Edit Tag ID"
                                                      disabled={loading}
                                                    >
                                                      {classificationAsset.tagId ? 'Edit' : 'Add'}
                                                    </button>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="border border-border px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {subAssetData.brand}
                                              </td>
                                              <td className="border border-border px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {subAssetData.model}
                                              </td>
                                              <td className="border border-border px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {subAssetData.capacity}
                                              </td>
                                              <td className="border border-border px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {subAssetData.location}
                                              </td>
                                              <td className="border border-border px-4 py-3">
                                                <div className="flex items-center gap-1 justify-center">
                                                  <button
                                                    onClick={() => handleOpenPOModal(asset, { subAssetIndex: index, category: expandedClassificationType! })}
                                                    className="px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:shadow-sm whitespace-nowrap"
                                                    title="Link Purchase Order"
                                                  >
                                                    <Receipt className="w-3 h-3" />
                                                    PO
                                                  </button>
                                                  <button
                                                    onClick={() => handleOpenReplacementModal(asset, { subAssetIndex: index, category: expandedClassificationType! })}
                                                    className="px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 hover:shadow-sm whitespace-nowrap"
                                                    title="Record Replacement"
                                                  >
                                                    <RotateCcw className="w-3 h-3" />
                                                    Replace
                                                  </button>
                                                  <button
                                                    onClick={() => handleOpenLifecycleModal(asset, { subAssetIndex: index, category: expandedClassificationType! })}
                                                    className="px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 hover:shadow-sm whitespace-nowrap"
                                                    title="Update Lifecycle Status"
                                                  >
                                                    <Activity className="w-3 h-3" />
                                                    Lifecycle
                                                  </button>
                                                </div>
                                              </td>
                                              <td className="border border-border px-4 py-3">
                                                <div className="flex items-center gap-1 justify-center">
                                                  {classificationAsset.hasDigitalAssets && classificationAsset.digitalAssets?.qrCode && (
                                                    <button
                                                      onClick={() => handleQRCodeClick(classificationAsset.digitalAssets!.qrCode!)}
                                                      className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-md border border-green-200 hover:bg-green-100 transition-colors cursor-pointer whitespace-nowrap"
                                                      title="Click to view QR Code"
                                                    >
                                                      <QrCode className="w-3 h-3 text-green-600" />
                                                      <span className="text-xs text-green-700">QR</span>
                                                    </button>
                                                  )}
                                                  {classificationAsset.digitalAssets?.nfcData && (
                                                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-md border border-purple-200 whitespace-nowrap">
                                                      <Wifi className="w-3 h-3 text-purple-600" />
                                                      <span className="text-xs text-purple-700">NFC</span>
                                                    </div>
                                                  )}
                                                  <button
                                                    onClick={() => handleInventoryClick(asset._id, index, 'consumables')}
                                                    className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                                      selectedInventoryType[`${asset._id}-${index}`] === 'consumables'
                                                        ? 'text-white bg-orange-600 hover:bg-orange-700 shadow-sm'
                                                        : 'text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200'
                                                    } whitespace-nowrap`}
                                                    title="View Consumables"
                                                  >
                                                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                                    Consumables
                                                  </button>
                                                  <button
                                                    onClick={() => handleInventoryClick(asset._id, index, 'spareParts')}
                                                    className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                                      selectedInventoryType[`${asset._id}-${index}`] === 'spareParts'
                                                        ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-sm'
                                                        : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                                                    } whitespace-nowrap`}
                                                    title="View Spare Parts"
                                                  >
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                    Spare Parts
                                                  </button>
                                                  <button
                                                    onClick={() => handleInventoryClick(asset._id, index, 'tools')}
                                                    className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                                      selectedInventoryType[`${asset._id}-${index}`] === 'tools'
                                                        ? 'text-white bg-green-600 hover:bg-green-700 shadow-sm'
                                                        : 'text-green-600 bg-green-50 hover:bg-green-100 border border-green-200'
                                                    } whitespace-nowrap`}
                                                    title="View Tools"
                                                  >
                                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                    Tools
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                           
                                            {/* Inventory Details Row */}
                                            {selectedInventoryType[`${asset._id}-${index}`] && (
                                              <tr>
                                                <td colSpan={7} className="border border-border p-0 bg-gray-50 dark:bg-gray-800">
                                                  <div className="p-4">
                                                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
                                                      {selectedInventoryType[`${asset._id}-${index}`] === 'consumables' ? 'Consumables' :
                                                       selectedInventoryType[`${asset._id}-${index}`] === 'spareParts' ? 'Spare Parts' : 'Tools'} - {classificationAsset.assetName}
                                                    </h4>
                                                    <div className="overflow-x-auto">
                                                      <table className="w-full border-collapse">
                                                        <thead>
                                                          <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 text-sm">
                                                              Item Name
                                                            </th>
                                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 text-sm">
                                                              Quantity
                                                            </th>
                                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 text-sm">
                                                              Status
                                                            </th>
                                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 text-sm">
                                                              Last Updated
                                                            </th>
                                                          </tr>
                                                        </thead>
                                                        <tbody>
                                                          {classificationAsset.inventory?.[selectedInventoryType[`${asset._id}-${index}`]!]?.map((item, itemIndex) => (
                                                            <tr key={itemIndex} className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                                              <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                                {item.itemName}
                                                              </td>
                                                              <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                                {item.quantity}
                                                              </td>
                                                              <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm">
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                  item.status === 'Available'
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                                                                    : item.status === 'Low Stock'
                                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
                                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                                                                }`}>
                                                                  {item.status}
                                                                </span>
                                                              </td>
                                                              <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                                {item.lastUpdated}
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </tbody>
                                                      </table>
                                                    </div>
                                                  </div>
                                                </td>
                                              </tr>
                                            )}
                                          </React.Fragment>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>


            {/* Mobile Card View */}
            <div className="lg:hidden">
              <div className="p-4 space-y-4">
                {filteredAssets.map((asset) => {
                  const isExpanded = expandedRow === asset._id
                  const assetClassification = isExpanded ? getAssetClassification(asset) : null
                  
                  return (
                    <div key={asset._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      {/* Card Header */}
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              {asset.mobilityCategory === 'Movable' ? (
                                <Package className="w-5 h-5 text-blue-800" />
                              ) : (
                                <Building className="w-5 h-5 text-blue-800" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-blue-800 dark:text-blue-200 text-lg">
                                {asset.tagId}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {asset.assetType} • {asset.subcategory || 'No subcategory'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                              {asset.status || 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3">
                        {/* Brand & Model */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Brand & Model:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {asset.brand} {asset.model || 'No model'}
                          </span>
                        </div>

                        {/* Capacity */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Capacity:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {asset.capacity || 'N/A'}
                          </span>
                        </div>

                        {/* Location */}
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Location:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white text-right">
                            {asset.location?.building && asset.location?.floor && asset.location?.room
                              ? `${asset.location.building}, ${asset.location.floor}, ${asset.location.room}`
                              : 'Location not set'
                            }
                          </span>
                        </div>

                        {/* Purchase Details */}
                        <div className="pt-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Purchase Details:</span>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleOpenPOModal(asset)}
                              className="px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:shadow-sm"
                              title="Link Purchase Order"
                            >
                              <Receipt className="w-3 h-3" />
                              PO
                            </button>
                            <button
                              onClick={() => handleOpenReplacementModal(asset)}
                              className="px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 hover:shadow-sm"
                              title="Record Replacement"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Replace
                            </button>
                            <button
                              onClick={() => handleOpenLifecycleModal(asset)}
                              className="px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 hover:shadow-sm"
                              title="Update Lifecycle Status"
                            >
                              <Activity className="w-3 h-3" />
                              Lifecycle
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Actions:</span>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleMovableClick(asset)}
                              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                                isExpanded && expandedClassificationType === 'movable'
                                  ? 'text-white bg-green-600 hover:bg-green-700 shadow-md'
                                  : 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 hover:shadow-sm'
                              }`}
                              title="View Movable Assets"
                            >
                              <Package className="w-3 h-3" />
                              Movable
                            </button>
                            <button
                              onClick={() => handleImmovableClick(asset)}
                              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                                isExpanded && expandedClassificationType === 'immovable'
                                  ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-md'
                                  : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:shadow-sm'
                              }`}
                              title="View Immovable Assets"
                            >
                              <Building className="w-3 h-3" />
                              Immovable
                            </button>
                            <button
                              onClick={() => handleViewFlowchart(asset)}
                              className="px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:shadow-sm"
                              title="View Asset Classification Flowchart"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Classification for Mobile */}
                      {isExpanded && assetClassification && (
                        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                          <div className="mb-3">
                            <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-1">
                              {asset.tagId} - {asset.brand} {asset.model}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {expandedClassificationType === 'movable' ? 'Movable' : 'Immovable'} Assets Classification for {asset.assetType} ({asset.subcategory})
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            {assetClassification[expandedClassificationType!].map((classificationAsset: AssetClassificationItem, index: number) => {
                              const subAssetData = {
                                brand: classificationAsset.brand || 'Unknown',
                                model: classificationAsset.model || 'Unknown',
                                capacity: classificationAsset.capacity || 'Unknown',
                                location: classificationAsset.location || 'Unknown'
                              }
                              
                              return (
                                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      {expandedClassificationType === 'movable' ? (
                                        <Package className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <Building className="w-4 h-4 text-blue-600" />
                                      )}
                                      <span className="font-medium text-blue-800 dark:text-blue-200">
                                        {classificationAsset.assetName}
                                      </span>
                                    </div>
                                    {classificationAsset.tagId && (
                                      <span className="text-xs font-mono bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                                        {classificationAsset.tagId}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-gray-600 dark:text-gray-400">Brand:</span>
                                      <span className="ml-1 font-medium">{subAssetData.brand}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600 dark:text-gray-400">Model:</span>
                                      <span className="ml-1 font-medium">{subAssetData.model}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
                                      <span className="ml-1 font-medium">{subAssetData.capacity}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600 dark:text-gray-400">Location:</span>
                                      <span className="ml-1 font-medium">{subAssetData.location}</span>
                                    </div>
                                  </div>

                                  {/* Mobile Purchase Details */}
                                  <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                                    <span className="text-xs text-gray-600 dark:text-gray-400 block mb-2">Purchase Details:</span>
                                    <div className="flex flex-wrap gap-1">
                                      <button
                                        onClick={() => handleOpenPOModal(asset, { subAssetIndex: index, category: expandedClassificationType! })}
                                        className="px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                                        title="Link Purchase Order"
                                      >
                                        <Receipt className="w-3 h-3" />
                                        PO
                                      </button>
                                      <button
                                        onClick={() => handleOpenReplacementModal(asset, { subAssetIndex: index, category: expandedClassificationType! })}
                                        className="px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200"
                                        title="Record Replacement"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                        Replace
                                      </button>
                                      <button
                                        onClick={() => handleOpenLifecycleModal(asset, { subAssetIndex: index, category: expandedClassificationType! })}
                                        className="px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-green-600 bg-green-50 hover:bg-green-100 border border-green-200"
                                        title="Update Lifecycle Status"
                                      >
                                        <Activity className="w-3 h-3" />
                                        Lifecycle
                                      </button>
                                    </div>
                                  </div>

                                  {/* Mobile Actions */}
                                  <div className="mt-2">
                                    <span className="text-xs text-gray-600 dark:text-gray-400 block mb-2">Actions:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {classificationAsset.hasDigitalAssets && classificationAsset.digitalAssets?.qrCode && (
                                        <button
                                          onClick={() => handleQRCodeClick(classificationAsset.digitalAssets!.qrCode!)}
                                          className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-md border border-green-200 hover:bg-green-100 transition-colors"
                                          title="Click to view QR Code"
                                        >
                                          <QrCode className="w-3 h-3 text-green-600" />
                                          <span className="text-xs text-green-700">QR</span>
                                        </button>
                                      )}
                                      {classificationAsset.digitalAssets?.nfcData && (
                                        <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-md border border-purple-200">
                                          <Wifi className="w-3 h-3 text-purple-600" />
                                          <span className="text-xs text-purple-700">NFC</span>
                                        </div>
                                      )}
                                      <button
                                        onClick={() => handleInventoryClick(asset._id, index, 'consumables')}
                                        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                          selectedInventoryType[`${asset._id}-${index}`] === 'consumables'
                                            ? 'text-white bg-orange-600 hover:bg-orange-700 shadow-sm'
                                            : 'text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200'
                                        }`}
                                        title="View Consumables"
                                      >
                                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                        <span>Consumables</span>
                                      </button>
                                      <button
                                        onClick={() => handleInventoryClick(asset._id, index, 'spareParts')}
                                        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                          selectedInventoryType[`${asset._id}-${index}`] === 'spareParts'
                                            ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-sm'
                                            : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                                        }`}
                                        title="View Spare Parts"
                                      >
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        <span>Spare Parts</span>
                                      </button>
                                      <button
                                        onClick={() => handleInventoryClick(asset._id, index, 'tools')}
                                        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                          selectedInventoryType[`${asset._id}-${index}`] === 'tools'
                                            ? 'text-white bg-green-600 hover:bg-green-700 shadow-sm'
                                            : 'text-green-600 bg-green-50 hover:bg-green-100 border border-green-200'
                                        }`}
                                        title="View Tools"
                                      >
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        <span>Tools</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
             
            {filteredAssets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No assets found matching your criteria.
              </div>
            )}
            </div>
        )}

        {/* Sub-Asset Details Modal */}
        {showSubAssetDetailsModal && selectedSubAssetForDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-3 sm:p-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm flex-shrink-0">
                      {selectedSubAssetForDetails.category === 'Movable' ? (
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      ) : (
                        <Building className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                          {selectedSubAssetForDetails.assetName}
                        </h2>
                        {selectedSubAssetForDetails.tagId && (
                          <span className="px-2 py-1 rounded text-xs font-mono font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
                            #{selectedSubAssetForDetails.tagId}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          selectedSubAssetForDetails.category === 'Movable' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                        }`}>
                          {selectedSubAssetForDetails.category}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Asset Details
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowSubAssetDetailsModal(false);
                      setExpandedInventorySection(null);
                    }}
                    className="group p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 border border-gray-200 dark:border-gray-600"
                  >
                    <X className="w-5 h-5 text-gray-600 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-200" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                {/* Parent Asset Information - First */}
                {selectedSubAssetForDetails.parentAsset && (() => {
                  const parentFields = [
                    { label: 'Parent Asset ID', value: selectedSubAssetForDetails.parentAsset.tagId },
                    { label: 'Asset Type', value: selectedSubAssetForDetails.parentAsset.assetType },
                    { label: 'Brand', value: selectedSubAssetForDetails.parentAsset.brand },
                    { label: 'Model', value: selectedSubAssetForDetails.parentAsset.model }
                  ].filter(field => {
                    if (!field.value) return false;
                    const value = String(field.value).toUpperCase().trim();
                    return value !== 'NA' && value !== 'N/A' && value !== '';
                  });
                  
                  if (parentFields.length === 0) return null;
                  
                  return (
                    <div className="mb-6">
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                            <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Parent Asset Details
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {parentFields.map((field, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">{field.label}</label>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{field.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Basic Information - Second */}
                <div className="mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Basic Information
                      </h3>
                    </div>
                    {(() => {
                      const basicFields = [
                        { label: 'Asset Name', value: selectedSubAssetForDetails.assetName },
                        { label: 'Tag ID', value: selectedSubAssetForDetails.tagId },
                        { label: 'Brand', value: selectedSubAssetForDetails.brand },
                        { label: 'Model', value: selectedSubAssetForDetails.model },
                        { label: 'Location', value: selectedSubAssetForDetails.location },
                        { label: 'Category', value: selectedSubAssetForDetails.category }
                      ].filter(field => {
                        if (!field.value) return false;
                        const value = String(field.value).toUpperCase().trim();
                        return value !== 'NA' && value !== 'N/A' && value !== '';
                      });
                      
                      return (
                        <div className="space-y-3">
                          {basicFields.map((field, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">{field.label}</label>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{field.value}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Quick Actions & Inventory - Third */}
                <div className="mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Quick Actions & Inventory
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left Column - Radio Buttons */}
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            if (!selectedSubAssetForDetails.parentAsset) return;
                            
                            // Find the sub-asset index in the parent asset
                            const parentAsset = selectedSubAssetForDetails.parentAsset as AssetData;
                            const category = selectedSubAssetForDetails.category === 'Movable' ? 'movable' : 'immovable';
                            const subAssetsArray = category === 'movable' ? parentAsset.subAssets?.movable : parentAsset.subAssets?.immovable;
                            
                            const index = subAssetsArray?.findIndex(subAsset => {
                              return subAsset.assetName === selectedSubAssetForDetails.assetName &&
                                     subAsset.brand === selectedSubAssetForDetails.brand &&
                                     subAsset.model === selectedSubAssetForDetails.model;
                            }) ?? -1;
                            
                            if (index >= 0) {
                              handleOpenPOModal(parentAsset, { subAssetIndex: index, category });
                            } else {
                              handleOpenPOModal(parentAsset);
                            }
                          }}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
                          disabled={!selectedSubAssetForDetails.parentAsset}
                        >
                          <div className="w-4 h-4 border-2 border-blue-600 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Purchase Order
                          </span>
                        </button>
                        
                        <button
                          onClick={() => {
                            if (!selectedSubAssetForDetails.parentAsset) return;
                            
                            // Find the sub-asset index in the parent asset
                            const parentAsset = selectedSubAssetForDetails.parentAsset as AssetData;
                            const category = selectedSubAssetForDetails.category === 'Movable' ? 'movable' : 'immovable';
                            const subAssetsArray = category === 'movable' ? parentAsset.subAssets?.movable : parentAsset.subAssets?.immovable;
                            
                            const index = subAssetsArray?.findIndex(subAsset => {
                              return subAsset.assetName === selectedSubAssetForDetails.assetName &&
                                     subAsset.brand === selectedSubAssetForDetails.brand &&
                                     subAsset.model === selectedSubAssetForDetails.model;
                            }) ?? -1;
                            
                            if (index >= 0) {
                              handleOpenReplacementModal(parentAsset, { subAssetIndex: index, category });
                            } else {
                              handleOpenReplacementModal(parentAsset);
                            }
                          }}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20"
                          disabled={!selectedSubAssetForDetails.parentAsset}
                        >
                          <div className="w-4 h-4 border-2 border-orange-600 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Replacement
                          </span>
                        </button>
                        
                        <button
                          onClick={() => {
                            if (!selectedSubAssetForDetails.parentAsset) return;
                            
                            // Find the sub-asset index in the parent asset
                            const parentAsset = selectedSubAssetForDetails.parentAsset as AssetData;
                            const category = selectedSubAssetForDetails.category === 'Movable' ? 'movable' : 'immovable';
                            const subAssetsArray = category === 'movable' ? parentAsset.subAssets?.movable : parentAsset.subAssets?.immovable;
                            
                            const index = subAssetsArray?.findIndex(subAsset => {
                              return subAsset.assetName === selectedSubAssetForDetails.assetName &&
                                     subAsset.brand === selectedSubAssetForDetails.brand &&
                                     subAsset.model === selectedSubAssetForDetails.model;
                            }) ?? -1;
                            
                            if (index >= 0) {
                              handleOpenLifecycleModal(parentAsset, { subAssetIndex: index, category });
                            } else {
                              handleOpenLifecycleModal(parentAsset);
                            }
                          }}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                          disabled={!selectedSubAssetForDetails.parentAsset}
                        >
                          <div className="w-4 h-4 border-2 border-green-600 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Lifecycle
                          </span>
                        </button>
                        
                        {selectedSubAssetForDetails.digitalAssets?.qrCode && (
                          <button
                            onClick={() => handleQRCodeClick(selectedSubAssetForDetails.digitalAssets!.qrCode!)}
                            className="w-full text-left px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                          >
                            View QR Code
                          </button>
                        )}
                      </div>
                      
                      {/* Right Column - Inventory Management */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-600 p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                            <Package className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          </div>
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                            Inventory
                          </h4>
                        </div>
                        <div className="space-y-3">
                          <button
                            onClick={() => {
                              setExpandedInventorySection(expandedInventorySection === 'consumables' ? null : 'consumables');
                              if (selectedSubAssetForDetails.parentAsset?._id) {
                                handleInventoryClick(selectedSubAssetForDetails.parentAsset._id, 0, 'consumables');
                              }
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              expandedInventorySection === 'consumables'
                                ? 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-orange-200 dark:border-orange-800'
                            }`}
                          >
                            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                              Consumables
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              setExpandedInventorySection(expandedInventorySection === 'spareParts' ? null : 'spareParts');
                              if (selectedSubAssetForDetails.parentAsset?._id) {
                                handleInventoryClick(selectedSubAssetForDetails.parentAsset._id, 0, 'spareParts');
                              }
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              expandedInventorySection === 'spareParts'
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              Spare Parts
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              setExpandedInventorySection(expandedInventorySection === 'tools' ? null : 'tools');
                              if (selectedSubAssetForDetails.parentAsset?._id) {
                                handleInventoryClick(selectedSubAssetForDetails.parentAsset._id, 0, 'tools');
                              }
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              expandedInventorySection === 'tools'
                                ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-green-200 dark:border-green-800'
                            }`}
                          >
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              Tools
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowSubAssetDetailsModal(false);
                    setExpandedInventorySection(null);
                  }}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

          </div>
        </div>

        {/* Flowchart Modal */}
        {showFlowchartModal && selectedAssetForFlowchart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Asset Classification Flowchart
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedAssetForFlowchart.tagId} - {selectedAssetForFlowchart.brand} {selectedAssetForFlowchart.model}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => await generatePDF(selectedAssetForFlowchart)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Download PDF Report"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={handleCloseFlowchartModal}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {(() => {
                  const assetClassification = getAssetClassification(selectedAssetForFlowchart)
                 
                  return (
                    <div className="space-y-6">
                      {/* Simple Header */}
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {selectedAssetForFlowchart.assetType} Asset Flow
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedAssetForFlowchart.tagId} - {selectedAssetForFlowchart.brand} {selectedAssetForFlowchart.model}
                        </p>
                      </div>

                      {/* Simple Flow Diagram */}
                      <div className="max-w-4xl mx-auto">
                        {/* Main Asset */}
                        <div className="text-center mb-6">
                          <div className="bg-blue-500 text-white rounded-lg p-4 inline-block shadow-lg">
                            <Building className="w-6 h-6 mx-auto mb-2" />
                            <h4 className="text-lg font-bold">{selectedAssetForFlowchart.assetType}</h4>
                            <p className="text-sm opacity-90">Main Asset</p>
                          </div>
                        </div>

                        {/* Flow Arrow */}
                        <div className="text-center mb-6">
                          <ArrowDown className="w-6 h-6 text-gray-400 mx-auto" />
                        </div>

                        {/* Two Branches */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Movable Branch */}
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                            <div className="text-center mb-4">
                              <div className="bg-green-500 text-white rounded-lg p-3 inline-block">
                                <Package className="w-5 h-5 mx-auto mb-1" />
                                <h4 className="font-bold">Movable</h4>
                                <p className="text-xs">{assetClassification.movable.length} items</p>
                              </div>
                            </div>
                           
                            {/* Simple List */}
                            <div className="space-y-2">
                              {assetClassification.movable.map((item, index) => (
                                <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-green-200 dark:border-green-700">
                                  <h5 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                                    {index + 1}. {item.assetName}
                                  </h5>
                                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-mono">
                                    Tag ID: {item.tagId || 'No Tag ID'}
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
                                 
                                  {/* Simple Inventory Display */}
                                  <div className="space-y-1">
                                    {item.inventory.consumables.length > 0 && (
                                      <div className="text-xs">
                                        <span className="font-medium text-orange-600">Consumables:</span>
                                        <span className="ml-1 text-gray-600 dark:text-gray-400">
                                          {item.inventory.consumables.map(consumable =>
                                            typeof consumable === 'string' ? consumable : consumable.itemName
                                          ).join(', ')}
                                        </span>
                                      </div>
                                    )}
                                    {item.inventory.spareParts.length > 0 && (
                                      <div className="text-xs">
                                        <span className="font-medium text-blue-600">Spare Parts:</span>
                                        <span className="ml-1 text-gray-600 dark:text-gray-400">
                                          {item.inventory.spareParts.map(part =>
                                            typeof part === 'string' ? part : part.itemName
                                          ).join(', ')}
                                        </span>
                                      </div>
                                    )}
                                    {item.inventory.tools.length > 0 && (
                                      <div className="text-xs">
                                        <span className="font-medium text-green-600">Tools:</span>
                                        <span className="ml-1 text-gray-600 dark:text-gray-400">
                                          {item.inventory.tools.map(tool =>
                                            typeof tool === 'string' ? tool : tool.itemName
                                          ).join(', ')}
                                        </span>
                                      </div>
                                    )}
                                    {item.inventory.operationalSupply.length > 0 && (
                                      <div className="text-xs">
                                        <span className="font-medium text-purple-600">Operational Supply:</span>
                                        <span className="ml-1 text-gray-600 dark:text-gray-400">
                                          {item.inventory.operationalSupply.map(supply =>
                                            typeof supply === 'string' ? supply : supply.itemName
                                          ).join(', ')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Immovable Branch */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                            <div className="text-center mb-4">
                              <div className="bg-blue-500 text-white rounded-lg p-3 inline-block">
                                <Building className="w-5 h-5 mx-auto mb-1" />
                                <h4 className="font-bold">Immovable</h4>
                                <p className="text-xs">{assetClassification.immovable.length} items</p>
                              </div>
                            </div>
                           
                            {/* Simple List */}
                            <div className="space-y-2">
                              {assetClassification.immovable.map((item, index) => (
                                <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                                  <h5 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                                    {index + 1}. {item.assetName}
                                  </h5>
                                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-mono">
                                    Tag ID: {item.tagId || 'No Tag ID'}
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
                                 
                                  {/* Simple Inventory Display */}
                                  <div className="space-y-1">
                                    {item.inventory.consumables.length > 0 && (
                                      <div className="text-xs">
                                        <span className="font-medium text-orange-600">Consumables:</span>
                                        <span className="ml-1 text-gray-600 dark:text-gray-400">
                                          {item.inventory.consumables.map(consumable =>
                                            typeof consumable === 'string' ? consumable : consumable.itemName
                                          ).join(', ')}
                                        </span>
                                      </div>
                                    )}
                                    {item.inventory.spareParts.length > 0 && (
                                      <div className="text-xs">
                                        <span className="font-medium text-blue-600">Spare Parts:</span>
                                        <span className="ml-1 text-gray-600 dark:text-gray-400">
                                          {item.inventory.spareParts.map(part =>
                                            typeof part === 'string' ? part : part.itemName
                                          ).join(', ')}
                                        </span>
                                      </div>
                                    )}
                                    {item.inventory.tools.length > 0 && (
                                      <div className="text-xs">
                                        <span className="font-medium text-green-600">Tools:</span>
                                        <span className="ml-1 text-gray-600 dark:text-gray-400">
                                          {item.inventory.tools.map(tool =>
                                            typeof tool === 'string' ? tool : tool.itemName
                                          ).join(', ')}
                                        </span>
                                      </div>
                                    )}
                                    {item.inventory.operationalSupply.length > 0 && (
                                      <div className="text-xs">
                                        <span className="font-medium text-purple-600">Operational Supply:</span>
                                        <span className="ml-1 text-gray-600 dark:text-gray-400">
                                          {item.inventory.operationalSupply.map(supply =>
                                            typeof supply === 'string' ? supply : supply.itemName
                                          ).join(', ')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Simple Summary */}
                        <div className="text-center mt-6">
                          <div className="bg-gray-600 text-white rounded-lg p-4 inline-block">
                            <h3 className="text-lg font-bold">
                              Total: {assetClassification.movable.length + assetClassification.immovable.length} Components
                            </h3>
                            <div className="flex gap-4 text-sm mt-2">
                              <span>🟢 Movable: {assetClassification.movable.length}</span>
                              <span>🔵 Immovable: {assetClassification.immovable.length}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCloseFlowchartModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hierarchical Add Asset Modal */}
        {showAddAssetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currentStep === 'main' && 'Add New Asset'}
                    {currentStep === 'subassets' && 'Add Sub-Assets'}
                    {currentStep === 'inventory' && 'Add Inventory Items'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {currentStep === 'main' && 'Step 1: Fill in the main asset details'}
                    {currentStep === 'subassets' && 'Step 2: Add movable and immovable components'}
                    {currentStep === 'inventory' && 'Step 3: Add inventory items for each component'}
                  </p>
                </div>
                <button
                  onClick={handleCloseAddAssetModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Step Navigation Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 px-4">
                <button
                  onClick={() => setCurrentStep('main')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    currentStep === 'main'
                      ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Main Asset
                </button>
                <button
                  onClick={() => setCurrentStep('subassets')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    currentStep === 'subassets'
                      ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Sub-Assets
                </button>
                <button
                  onClick={() => {
                    // Generate tag ID if it doesn't exist when navigating to inventory
                    if (!newAsset.tagId && locationType && assetTypeCode) {
                      const generatedId = generateAssetId(locationType, assetTypeCode)
                      if (generatedId && !assets.some(asset => asset.tagId === generatedId)) {
                        setNewAsset(prev => ({ ...prev, tagId: generatedId }))
                      }
                    }
                    setCurrentStep('inventory')
                  }}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    currentStep === 'inventory'
                      ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Inventory
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 overflow-y-auto flex-1 min-h-0">
                {currentStep === 'main' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left Column */}
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="tagId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Asset ID <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="tagId"
                          value={newAsset.tagId || generateAssetId(locationType, assetTypeCode)}
                          onChange={(e) => handleInputChange('tagId', e.target.value)}
                          placeholder="Auto-generated based on project info"
                          className="mt-1"
                          readOnly
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Auto-generated: {generateAssetId(locationType, assetTypeCode) || 'Select location and asset type'}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="project" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Project
                        </Label>
                        <Input
                          id="project"
                          value={newAsset.project?.projectName || ''}
                          className="mt-1 bg-gray-50 dark:bg-gray-700"
                          readOnly
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Project assigned from your login
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="locationType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Location Type <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-1 mt-1">
                          <Select value={locationType} onValueChange={(value) => {
                            setLocationType(value)
                            const generatedId = generateAssetId(value, assetTypeCode)
                            handleInputChange('tagId', generatedId)
                          }}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select or enter location type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Common Area">Common Area</SelectItem>
                              <SelectItem value="Office">Office</SelectItem>
                              <SelectItem value="Workshop">Workshop</SelectItem>
                              <SelectItem value="Storage">Storage</SelectItem>
                              <SelectItem value="Maintenance">Maintenance</SelectItem>
                              <SelectItem value="Utility">Utility</SelectItem>
                              <SelectItem value="Security">Security</SelectItem>
                              <SelectItem value="Parking">Parking</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Or enter custom location"
                            value={locationType}
                            onChange={(e) => {
                              setLocationType(e.target.value)
                              const generatedId = generateAssetId(e.target.value, assetTypeCode)
                              handleInputChange('tagId', generatedId)
                            }}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="assetTypeCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Asset Type <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-1 mt-1">
                          <Select value={assetTypeCode} onValueChange={(value) => {
                            setAssetTypeCode(value)
                            const generatedId = generateAssetId(locationType, value)
                            handleInputChange('tagId', generatedId)
                            handleInputChange('assetType', value)
                          }}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select or enter asset type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Borewell Pump">Borewell Pump (BP)</SelectItem>
                              <SelectItem value="Water Treatment Plant">Water Treatment Plant (WTP)</SelectItem>
                              <SelectItem value="Computer">Computer (CP)</SelectItem>
                              <SelectItem value="Printer">Printer (PR)</SelectItem>
                              <SelectItem value="Generator">Generator (GN)</SelectItem>
                              <SelectItem value="Air Conditioner">Air Conditioner (AC)</SelectItem>
                              <SelectItem value="Elevator">Elevator (EL)</SelectItem>
                              <SelectItem value="Security Camera">Security Camera (SC)</SelectItem>
                              <SelectItem value="Fire Extinguisher">Fire Extinguisher (FE)</SelectItem>
                              <SelectItem value="Water Tank">Water Tank (WT)</SelectItem>
                              <SelectItem value="Pump">Pump (PM)</SelectItem>
                              <SelectItem value="Motor">Motor (MT)</SelectItem>
                              <SelectItem value="Transformer">Transformer (TR)</SelectItem>
                              <SelectItem value="Switchboard">Switchboard (SB)</SelectItem>
                              <SelectItem value="Lighting">Lighting (LT)</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Or enter custom asset type"
                            value={assetTypeCode}
                            onChange={(e) => {
                              setAssetTypeCode(e.target.value)
                              const generatedId = generateAssetId(locationType, e.target.value)
                              handleInputChange('tagId', generatedId)
                              handleInputChange('assetType', e.target.value)
                            }}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Subcategory
                        </Label>
                        <Input
                          id="subcategory"
                          value={newAsset.subcategory || ''}
                          onChange={(e) => handleInputChange('subcategory', e.target.value)}
                          placeholder="e.g., Water Treatment Plant, Desktop Computer"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="mobilityCategory" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Mobility Category
                        </Label>
                        <Select value={newAsset.mobilityCategory || 'Movable'} onValueChange={(value) => handleInputChange('mobilityCategory', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Movable">Movable</SelectItem>
                            <SelectItem value="Immovable">Immovable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="brand" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Brand <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="brand"
                          value={newAsset.brand || ''}
                          onChange={(e) => handleInputChange('brand', e.target.value)}
                          placeholder="e.g., AquaTech, Dell"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="model" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Model
                        </Label>
                        <Input
                          id="model"
                          value={newAsset.model || ''}
                          onChange={(e) => handleInputChange('model', e.target.value)}
                          placeholder="e.g., WTP-5000, OptiPlex 7090"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="serialNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Serial Number
                        </Label>
                        <Input
                          id="serialNumber"
                          value={newAsset.serialNumber || ''}
                          onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                          placeholder="e.g., AT123456"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="capacity" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Capacity
                        </Label>
                        <Input
                          id="capacity"
                          value={newAsset.capacity || ''}
                          onChange={(e) => handleInputChange('capacity', e.target.value)}
                          placeholder="e.g., 5000 LPH, 16GB RAM"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="yearOfInstallation" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Year of Installation
                        </Label>
                        <Input
                          id="yearOfInstallation"
                          value={newAsset.yearOfInstallation || ''}
                          onChange={(e) => handleInputChange('yearOfInstallation', e.target.value)}
                          placeholder="e.g., 2022"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Status
                        </Label>
                        <Select value={newAsset.status || 'Active'} onValueChange={(value) => handleInputChange('status', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                            <SelectItem value="Retired">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="priority" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Priority
                        </Label>
                        <Select value={newAsset.priority || 'Medium'} onValueChange={(value) => handleInputChange('priority', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Location Fields */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Location Details</h4>
                       
                        <div>
                          <Label htmlFor="location" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Select Location
                          </Label>
                          <Select 
                            value={selectedLocationId} 
                            onValueChange={handleLocationSelect}
                          >
                            <SelectTrigger className={`mt-1 ${loadingLocations ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              {selectedLocationName ? (
                                <span className="block truncate">{selectedLocationName}</span>
                              ) : (
                                <SelectValue placeholder={loadingLocations ? "Loading locations..." : "Select a location"} />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {loadingLocations ? (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                  Loading locations...
                                </div>
                              ) : locations.length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                  No locations available
                                </div>
                              ) : (
                                locations.map((location) => (
                                  <SelectItem key={location._id} value={location._id}>
                                    {location.name} {location.type ? `(${location.type})` : ''}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="building" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Building
                          </Label>
                          <Input
                            id="building"
                            value={newAsset.location?.building || ''}
                            onChange={(e) => handleInputChange('location.building', e.target.value)}
                            placeholder="e.g., Main Building"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="floor" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Floor
                          </Label>
                          <Input
                            id="floor"
                            value={newAsset.location?.floor || ''}
                            onChange={(e) => handleInputChange('location.floor', e.target.value)}
                            placeholder="e.g., Ground, 2nd Floor"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="room" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Room
                          </Label>
                          <Input
                            id="room"
                            value={newAsset.location?.room || ''}
                            onChange={(e) => handleInputChange('location.room', e.target.value)}
                            placeholder="e.g., Utility Room, IT Office"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 'subassets' && (
                  <div className="space-y-6">
                    {/* Movable Assets Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-green-600" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Movable Assets</h3>
                        </div>
                        <Button
                          onClick={() => handleAddSubAsset('Movable')}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Plus className="w-4 h-4" />
                          Add Movable Asset
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {newAsset.subAssets?.movable.map((subAsset, index) => (
                          <div key={subAsset.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900 dark:text-white">Movable Asset #{index + 1}</h4>
                              <Button
                                onClick={() => handleRemoveSubAsset('Movable', index)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                           
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Asset Name</Label>
                                <Input
                                  value={subAsset.assetName}
                                  onChange={(e) => handleSubAssetChange('Movable', index, 'assetName', e.target.value)}
                                  placeholder="e.g., Water Pumps"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tag ID</Label>
                                <Input
                                  value={subAsset.tagId || generateSubAssetTagId(newAsset.tagId || generateAssetId(locationType, assetTypeCode), subAsset.assetName, 'Movable', index)}
                                  onChange={(e) => handleSubAssetChange('Movable', index, 'tagId', e.target.value)}
                                  placeholder="Auto-generated based on asset name"
                                  className="mt-1"
                                  readOnly
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Auto-generated: {generateSubAssetTagId(newAsset.tagId || generateAssetId(locationType, assetTypeCode), subAsset.assetName, 'Movable', index) || 'Enter asset name'}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand</Label>
                                <Input
                                  value={subAsset.brand}
                                  onChange={(e) => handleSubAssetChange('Movable', index, 'brand', e.target.value)}
                                  placeholder="e.g., AquaTech"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Model</Label>
                                <Input
                                  value={subAsset.model}
                                  onChange={(e) => handleSubAssetChange('Movable', index, 'model', e.target.value)}
                                  placeholder="e.g., AP-5000"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Capacity</Label>
                                <Input
                                  value={subAsset.capacity}
                                  onChange={(e) => handleSubAssetChange('Movable', index, 'capacity', e.target.value)}
                                  placeholder="e.g., 5000 LPH"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</Label>
                                <Input
                                  value={subAsset.location}
                                  onChange={(e) => handleSubAssetChange('Movable', index, 'location', e.target.value)}
                                  placeholder="e.g., Inside WTP"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</Label>
                                <Input
                                  value={subAsset.description}
                                  onChange={(e) => handleSubAssetChange('Movable', index, 'description', e.target.value)}
                                  placeholder="Brief description"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Digital Tag Type</Label>
                                <Select 
                                  value={subAsset.digitalTagType || 'qr'} 
                                  onValueChange={(value) => handleSubAssetChange('Movable', index, 'digitalTagType', value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="qr">QR Code</SelectItem>
                                    <SelectItem value="barcode">Barcode</SelectItem>
                                    <SelectItem value="nfc">NFC</SelectItem>
                                    <SelectItem value="none">None</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Immovable Assets Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Immovable Assets</h3>
                        </div>
                        <Button
                          onClick={() => handleAddSubAsset('Immovable')}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="w-4 h-4" />
                          Add Immovable Asset
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {newAsset.subAssets?.immovable.map((subAsset, index) => (
                          <div key={subAsset.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900 dark:text-white">Immovable Asset #{index + 1}</h4>
                              <Button
                                onClick={() => handleRemoveSubAsset('Immovable', index)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                           
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Asset Name</Label>
                                <Input
                                  value={subAsset.assetName}
                                  onChange={(e) => handleSubAssetChange('Immovable', index, 'assetName', e.target.value)}
                                  placeholder="e.g., WTP Structure"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tag ID</Label>
                                <Input
                                  value={subAsset.tagId || generateSubAssetTagId(newAsset.tagId || generateAssetId(locationType, assetTypeCode), subAsset.assetName, 'Immovable', index)}
                                  onChange={(e) => handleSubAssetChange('Immovable', index, 'tagId', e.target.value)}
                                  placeholder="Auto-generated based on asset name"
                                  className="mt-1"
                                  readOnly
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Auto-generated: {generateSubAssetTagId(newAsset.tagId || generateAssetId(locationType, assetTypeCode), subAsset.assetName, 'Immovable', index) || 'Enter asset name'}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand</Label>
                                <Input
                                  value={subAsset.brand}
                                  onChange={(e) => handleSubAssetChange('Immovable', index, 'brand', e.target.value)}
                                  placeholder="e.g., AquaTech"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Model</Label>
                                <Input
                                  value={subAsset.model}
                                  onChange={(e) => handleSubAssetChange('Immovable', index, 'model', e.target.value)}
                                  placeholder="e.g., WTP-5000"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Capacity</Label>
                                <Input
                                  value={subAsset.capacity}
                                  onChange={(e) => handleSubAssetChange('Immovable', index, 'capacity', e.target.value)}
                                  placeholder="e.g., 5000 LPH"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</Label>
                                <Input
                                  value={subAsset.location}
                                  onChange={(e) => handleSubAssetChange('Immovable', index, 'location', e.target.value)}
                                  placeholder="e.g., Main Building"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</Label>
                                <Input
                                  value={subAsset.description}
                                  onChange={(e) => handleSubAssetChange('Immovable', index, 'description', e.target.value)}
                                  placeholder="Brief description"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Digital Tag Type</Label>
                                <Select 
                                  value={subAsset.digitalTagType || 'qr'} 
                                  onValueChange={(value) => handleSubAssetChange('Immovable', index, 'digitalTagType', value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="qr">QR Code</SelectItem>
                                    <SelectItem value="barcode">Barcode</SelectItem>
                                    <SelectItem value="nfc">NFC</SelectItem>
                                    <SelectItem value="none">None</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 'inventory' && (
                  <div className="space-y-6">
                    {/* Tag ID Display for Inventory */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                            Asset Tag ID
                          </Label>
                          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            {newAsset.tagId || generateAssetId(locationType, assetTypeCode) || 'Generate by filling Location Type and Asset Type'}
                          </p>
                        </div>
                        {!newAsset.tagId && locationType && assetTypeCode && (
                          <Button
                            onClick={() => {
                              const generatedId = generateAssetId(locationType, assetTypeCode)
                              if (generatedId && !assets.some(asset => asset.tagId === generatedId)) {
                                setNewAsset(prev => ({ ...prev, tagId: generatedId }))
                              } else if (generatedId) {
                                alert('This Asset ID already exists. Please use a different combination.')
                              }
                            }}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Generate Tag ID
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Main Asset Inventory (Direct inventory not tied to sub-assets) */}
                    <div className="border border-blue-300 dark:border-blue-700 rounded-lg p-4 bg-blue-50/30 dark:bg-blue-900/10 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        Main Asset Inventory
                      </h3>

                      {/* Consumables */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            Consumables
                          </h4>
                          <Button
                            onClick={() => handleAddMainAssetInventoryItem('consumables')}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {mainAssetInventory.consumables.map((item, itemIndex) => (
                            <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                              <Input
                                value={item.tagId || ''}
                                onChange={(e) => handleMainAssetInventoryItemChange('consumables', itemIndex, 'tagId', e.target.value)}
                                placeholder="Tag ID"
                                className="text-sm font-mono"
                              />
                              <Input
                                value={item.itemName}
                                onChange={(e) => handleMainAssetInventoryItemChange('consumables', itemIndex, 'itemName', e.target.value)}
                                placeholder="Item Name"
                              />
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleMainAssetInventoryItemChange('consumables', itemIndex, 'quantity', parseInt(e.target.value) || 0)}
                                placeholder="Quantity"
                              />
                              <Select value={item.status} onValueChange={(value) => handleMainAssetInventoryItemChange('consumables', itemIndex, 'status', value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Available">Available</SelectItem>
                                  <SelectItem value="Low Stock">Low Stock</SelectItem>
                                  <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type="date"
                                value={item.lastUpdated}
                                onChange={(e) => handleMainAssetInventoryItemChange('consumables', itemIndex, 'lastUpdated', e.target.value)}
                              />
                              <Button
                                onClick={() => handleRemoveMainAssetInventoryItem('consumables', itemIndex)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Spare Parts */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            Spare Parts
                          </h4>
                          <Button
                            onClick={() => handleAddMainAssetInventoryItem('spareParts')}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {mainAssetInventory.spareParts.map((item, itemIndex) => (
                            <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                              <Input
                                value={item.tagId || ''}
                                onChange={(e) => handleMainAssetInventoryItemChange('spareParts', itemIndex, 'tagId', e.target.value)}
                                placeholder="Tag ID"
                                className="text-sm font-mono"
                              />
                              <Input
                                value={item.itemName}
                                onChange={(e) => handleMainAssetInventoryItemChange('spareParts', itemIndex, 'itemName', e.target.value)}
                                placeholder="Item Name"
                              />
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleMainAssetInventoryItemChange('spareParts', itemIndex, 'quantity', parseInt(e.target.value) || 0)}
                                placeholder="Quantity"
                              />
                              <Select value={item.status} onValueChange={(value) => handleMainAssetInventoryItemChange('spareParts', itemIndex, 'status', value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Available">Available</SelectItem>
                                  <SelectItem value="Low Stock">Low Stock</SelectItem>
                                  <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type="date"
                                value={item.lastUpdated}
                                onChange={(e) => handleMainAssetInventoryItemChange('spareParts', itemIndex, 'lastUpdated', e.target.value)}
                              />
                              <Button
                                onClick={() => handleRemoveMainAssetInventoryItem('spareParts', itemIndex)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tools */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            Tools
                          </h4>
                          <Button
                            onClick={() => handleAddMainAssetInventoryItem('tools')}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {mainAssetInventory.tools.map((item, itemIndex) => (
                            <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                              <Input
                                value={item.tagId || ''}
                                onChange={(e) => handleMainAssetInventoryItemChange('tools', itemIndex, 'tagId', e.target.value)}
                                placeholder="Tag ID"
                                className="text-sm font-mono"
                              />
                              <Input
                                value={item.itemName}
                                onChange={(e) => handleMainAssetInventoryItemChange('tools', itemIndex, 'itemName', e.target.value)}
                                placeholder="Item Name"
                              />
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleMainAssetInventoryItemChange('tools', itemIndex, 'quantity', parseInt(e.target.value) || 0)}
                                placeholder="Quantity"
                              />
                              <Select value={item.status} onValueChange={(value) => handleMainAssetInventoryItemChange('tools', itemIndex, 'status', value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Available">Available</SelectItem>
                                  <SelectItem value="Low Stock">Low Stock</SelectItem>
                                  <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type="date"
                                value={item.lastUpdated}
                                onChange={(e) => handleMainAssetInventoryItemChange('tools', itemIndex, 'lastUpdated', e.target.value)}
                              />
                              <Button
                                onClick={() => handleRemoveMainAssetInventoryItem('tools', itemIndex)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Movable Assets Inventory */}
                    {newAsset.subAssets?.movable && newAsset.subAssets.movable.length > 0 && (
                      newAsset.subAssets.movable.map((subAsset, subAssetIndex) => (
                        <div key={subAsset.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-green-600" />
                            {subAsset.assetName || `Movable Asset #${subAssetIndex + 1}`}
                          </h3>

                        {/* Consumables */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                              Consumables
                            </h4>
                            <Button
                              onClick={() => handleAddInventoryItem('Movable', subAssetIndex, 'consumables')}
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {subAsset.inventory.consumables.map((item, itemIndex) => (
                              <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                <Input
                                  value={item.tagId || ''}
                                  onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'consumables', itemIndex, 'tagId', e.target.value)}
                                  placeholder="Tag ID"
                                  className="text-sm font-mono"
                                />
                                <Input
                                  value={item.itemName}
                                  onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'consumables', itemIndex, 'itemName', e.target.value)}
                                  placeholder="Item Name"
                                />
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'consumables', itemIndex, 'quantity', parseInt(e.target.value) || 0)}
                                  placeholder="Quantity"
                                />
                                <Select value={item.status} onValueChange={(value) => handleInventoryItemChange('Movable', subAssetIndex, 'consumables', itemIndex, 'status', value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Available">Available</SelectItem>
                                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="date"
                                  value={item.lastUpdated}
                                  onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'consumables', itemIndex, 'lastUpdated', e.target.value)}
                                />
                                <Button
                                  onClick={() => handleRemoveInventoryItem('Movable', subAssetIndex, 'consumables', itemIndex)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Spare Parts */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              Spare Parts
                            </h4>
                            <Button
                              onClick={() => handleAddInventoryItem('Movable', subAssetIndex, 'spareParts')}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {subAsset.inventory.spareParts.map((item, itemIndex) => (
                              <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                <Input
                                  value={item.tagId || ''}
                                  onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'spareParts', itemIndex, 'tagId', e.target.value)}
                                  placeholder="Tag ID"
                                  className="text-sm font-mono"
                                />
                                <Input
                                  value={item.itemName}
                                  onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'spareParts', itemIndex, 'itemName', e.target.value)}
                                  placeholder="Item Name"
                                />
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'spareParts', itemIndex, 'quantity', parseInt(e.target.value) || 0)}
                                  placeholder="Quantity"
                                />
                                <Select value={item.status} onValueChange={(value) => handleInventoryItemChange('Movable', subAssetIndex, 'spareParts', itemIndex, 'status', value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Available">Available</SelectItem>
                                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="date"
                                  value={item.lastUpdated}
                                  onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'spareParts', itemIndex, 'lastUpdated', e.target.value)}
                                />
                                <Button
                                  onClick={() => handleRemoveInventoryItem('Movable', subAssetIndex, 'spareParts', itemIndex)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tools */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              Tools
                            </h4>
                            <Button
                              onClick={() => handleAddInventoryItem('Movable', subAssetIndex, 'tools')}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {subAsset.inventory.tools.map((item, itemIndex) => (
                              <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                <Input
                                  value={item.tagId || ''}
                                  onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'tools', itemIndex, 'tagId', e.target.value)}
                                  placeholder="Tag ID"
                                  className="text-sm font-mono"
                                />
                                <Input
                                  value={item.itemName}
                                  onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'tools', itemIndex, 'itemName', e.target.value)}
                                  placeholder="Item Name"
                                />
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'tools', itemIndex, 'quantity', parseInt(e.target.value) || 0)}
                                  placeholder="Quantity"
                                />
                                <Select value={item.status} onValueChange={(value) => handleInventoryItemChange('Movable', subAssetIndex, 'tools', itemIndex, 'status', value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Available">Available</SelectItem>
                                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="date"
                                  value={item.lastUpdated}
                                  onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'tools', itemIndex, 'lastUpdated', e.target.value)}
                                />
                                <Button
                                  onClick={() => handleRemoveInventoryItem('Movable', subAssetIndex, 'tools', itemIndex)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      ))
                    )}

                    {/* Immovable Assets Inventory */}
                    {newAsset.subAssets?.immovable && newAsset.subAssets.immovable.length > 0 && (
                      newAsset.subAssets.immovable.map((subAsset, subAssetIndex) => (
                        <div key={subAsset.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Building className="w-5 h-5 text-blue-600" />
                          {subAsset.assetName || `Immovable Asset #${subAssetIndex + 1}`}
                        </h3>

                        {/* Consumables */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                              Consumables
                            </h4>
                            <Button
                              onClick={() => handleAddInventoryItem('Immovable', subAssetIndex, 'consumables')}
                              variant="outline"
                              size="sm"
                              className="bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {subAsset.inventory.consumables.map((item, itemIndex) => (
                              <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                <Input
                                  value={item.tagId || ''}
                                  onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'consumables', itemIndex, 'tagId', e.target.value)}
                                  placeholder="Tag ID"
                                  className="text-sm font-mono"
                                />
                                <Input
                                  value={item.itemName}
                                  onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'consumables', itemIndex, 'itemName', e.target.value)}
                                  placeholder="Item Name"
                                />
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'consumables', itemIndex, 'quantity', parseInt(e.target.value))}
                                  placeholder="Quantity"
                                />
                                <Select
                                  value={item.status}
                                  onValueChange={(value) => handleInventoryItemChange('Immovable', subAssetIndex, 'consumables', itemIndex, 'status', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Available">Available</SelectItem>
                                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="date"
                                  value={item.lastUpdated}
                                  onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'consumables', itemIndex, 'lastUpdated', e.target.value)}
                                />
                                <Button
                                  onClick={() => handleRemoveInventoryItem('Immovable', subAssetIndex, 'consumables', itemIndex)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Spare Parts */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              Spare Parts
                            </h4>
                            <Button
                              onClick={() => handleAddInventoryItem('Immovable', subAssetIndex, 'spareParts')}
                              variant="outline"
                              size="sm"
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {subAsset.inventory.spareParts.map((item, itemIndex) => (
                              <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                <Input
                                  value={item.tagId || ''}
                                  onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'spareParts', itemIndex, 'tagId', e.target.value)}
                                  placeholder="Tag ID"
                                  className="text-sm font-mono"
                                />
                                <Input
                                  value={item.itemName}
                                  onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'spareParts', itemIndex, 'itemName', e.target.value)}
                                  placeholder="Item Name"
                                />
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'spareParts', itemIndex, 'quantity', parseInt(e.target.value))}
                                  placeholder="Quantity"
                                />
                                <Select
                                  value={item.status}
                                  onValueChange={(value) => handleInventoryItemChange('Immovable', subAssetIndex, 'spareParts', itemIndex, 'status', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Available">Available</SelectItem>
                                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="date"
                                  value={item.lastUpdated}
                                  onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'spareParts', itemIndex, 'lastUpdated', e.target.value)}
                                />
                                <Button
                                  onClick={() => handleRemoveInventoryItem('Immovable', subAssetIndex, 'spareParts', itemIndex)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tools */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              Tools
                            </h4>
                            <Button
                              onClick={() => handleAddInventoryItem('Immovable', subAssetIndex, 'tools')}
                              variant="outline"
                              size="sm"
                              className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {subAsset.inventory.tools.map((item, itemIndex) => (
                              <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                <Input
                                  value={item.tagId || ''}
                                  onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'tools', itemIndex, 'tagId', e.target.value)}
                                  placeholder="Tag ID"
                                  className="text-sm font-mono"
                                />
                                <Input
                                  value={item.itemName}
                                  onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'tools', itemIndex, 'itemName', e.target.value)}
                                  placeholder="Item Name"
                                />
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'tools', itemIndex, 'quantity', parseInt(e.target.value))}
                                  placeholder="Quantity"
                                />
                                <Select
                                  value={item.status}
                                  onValueChange={(value) => handleInventoryItemChange('Immovable', subAssetIndex, 'tools', itemIndex, 'status', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Available">Available</SelectItem>
                                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="date"
                                  value={item.lastUpdated}
                                  onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'tools', itemIndex, 'lastUpdated', e.target.value)}
                                />
                                <Button
                                  onClick={() => handleRemoveInventoryItem('Immovable', subAssetIndex, 'tools', itemIndex)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-between p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div>
                  {currentStep !== 'main' && (
                    <Button
                      onClick={() => setCurrentStep(currentStep === 'subassets' ? 'main' : 'subassets')}
                      variant="outline"
                      className="px-4 py-2"
                    >
                      Previous
                    </Button>
                  )}
                </div>
               
                <div className="flex gap-3">
                  <Button
                    onClick={handleCloseAddAssetModal}
                    variant="outline"
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                 
                  {currentStep === 'main' ? (
                    <Button
                      onClick={handleMainAssetSave}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Next: Add Sub-Assets
                    </Button>
                  ) : null}
                 
                  {currentStep === 'subassets' && (
                    <Button
                      onClick={() => setCurrentStep('inventory')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Next: Add Inventory
                    </Button>
                  )}
                 
                  {currentStep === 'inventory' && (
                    <Button
                      onClick={handleFinalSave}
                      data-testid="save-button"
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Save Complete Asset
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Asset Management Modals */}
        
        {/* Purchase Order Modal */}
        {showPOModal && selectedAssetForManagement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Link Purchase Order
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedSubAssetForManagement 
                      ? `Sub-Asset: ${selectedAssetForManagement.tagId} - ${selectedSubAssetForManagement.category}`
                      : `Main Asset: ${selectedAssetForManagement.tagId}`
                    }
                  </p>
                </div>
                <button
                  onClick={() => setShowPOModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      PO Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={poData.poNumber || ''}
                      onChange={(e) => setPOData(prev => ({ ...prev, poNumber: e.target.value }))}
                      placeholder="e.g., PO-2024-001"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      PO Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={poData.poDate || ''}
                      onChange={(e) => setPOData(prev => ({ ...prev, poDate: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Vendor <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={poData.vendor || ''}
                      onChange={(e) => setPOData(prev => ({ ...prev, vendor: e.target.value }))}
                      placeholder="e.g., Kirloskar Brothers Ltd"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Vendor Contact
                    </Label>
                    <Input
                      value={poData.vendorContact || ''}
                      onChange={(e) => setPOData(prev => ({ ...prev, vendorContact: e.target.value }))}
                      placeholder="e.g., sales@kirloskar.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Purchase Cost
                    </Label>
                    <Input
                      type="number"
                      value={poData.purchaseCost || ''}
                      onChange={(e) => setPOData(prev => ({ ...prev, purchaseCost: parseFloat(e.target.value) || 0 }))}
                      placeholder="e.g., 150000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Currency
                    </Label>
                    <Select value={poData.currency || 'INR'} onValueChange={(value) => setPOData(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Payment Terms
                    </Label>
                    <Input
                      value={poData.paymentTerms || ''}
                      onChange={(e) => setPOData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                      placeholder="e.g., Net 30"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Delivery Date
                    </Label>
                    <Input
                      type="date"
                      value={poData.deliveryDate || ''}
                      onChange={(e) => setPOData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Invoice Number
                    </Label>
                    <Input
                      value={poData.invoiceNumber || ''}
                      onChange={(e) => setPOData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      placeholder="e.g., INV-2024-001"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Invoice Date
                    </Label>
                    <Input
                      type="date"
                      value={poData.invoiceDate || ''}
                      onChange={(e) => setPOData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notes
                    </Label>
                    <Input
                      value={poData.notes || ''}
                      onChange={(e) => setPOData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowPOModal(false)}
                    variant="outline"
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSavePO}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Link Purchase Order'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Replacement Modal */}
        {showReplacementModal && selectedAssetForManagement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Record Asset Replacement
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedSubAssetForManagement 
                      ? `Sub-Asset: ${selectedAssetForManagement.tagId} - ${selectedSubAssetForManagement.category}`
                      : `Main Asset: ${selectedAssetForManagement.tagId}`
                    }
                  </p>
                </div>
                <button
                  onClick={() => setShowReplacementModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Replaced Asset Tag ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={replacementData.replacedAssetTagId || ''}
                      onChange={(e) => setReplacementData(prev => ({ ...prev, replacedAssetTagId: e.target.value }))}
                      placeholder="e.g., OLD-SSWTP001"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Replacement Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={replacementData.replacementDate || ''}
                      onChange={(e) => setReplacementData(prev => ({ ...prev, replacementDate: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Replacement Reason <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={replacementData.replacementReason || ''}
                      onChange={(e) => setReplacementData(prev => ({ ...prev, replacementReason: e.target.value }))}
                      placeholder="e.g., Equipment failure - motor burnt out"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cost of Replacement
                    </Label>
                    <Input
                      type="number"
                      value={replacementData.costOfReplacement || ''}
                      onChange={(e) => setReplacementData(prev => ({ ...prev, costOfReplacement: parseFloat(e.target.value) || 0 }))}
                      placeholder="e.g., 75000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Replaced By
                    </Label>
                    <Input
                      value={replacementData.replacedBy || ''}
                      onChange={(e) => setReplacementData(prev => ({ ...prev, replacedBy: e.target.value }))}
                      placeholder="e.g., John Doe"
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notes
                    </Label>
                    <Input
                      value={replacementData.notes || ''}
                      onChange={(e) => setReplacementData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowReplacementModal(false)}
                    variant="outline"
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveReplacement}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Record Replacement'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lifecycle Modal */}
        {showLifecycleModal && selectedAssetForManagement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Update Lifecycle Status
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedSubAssetForManagement 
                      ? `Sub-Asset: ${selectedAssetForManagement.tagId} - ${selectedSubAssetForManagement.category}`
                      : `Main Asset: ${selectedAssetForManagement.tagId}`
                    }
                  </p>
                </div>
                <button
                  onClick={() => setShowLifecycleModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status <span className="text-red-500">*</span>
                    </Label>
                    <Select value={lifecycleData.status || 'operational'} onValueChange={(value) => setLifecycleData(prev => ({ ...prev, status: value as 'procured' | 'received' | 'installed' | 'commissioned' | 'operational' | 'under_maintenance' | 'retired' | 'disposed' }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="procured">Procured</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="installed">Installed</SelectItem>
                        <SelectItem value="commissioned">Commissioned</SelectItem>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                        <SelectItem value="disposed">Disposed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={lifecycleData.date || ''}
                      onChange={(e) => setLifecycleData(prev => ({ ...prev, date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Updated By
                    </Label>
                    <Input
                      value={lifecycleData.updatedBy || ''}
                      onChange={(e) => setLifecycleData(prev => ({ ...prev, updatedBy: e.target.value }))}
                      placeholder="e.g., John Doe"
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notes
                    </Label>
                    <Input
                      value={lifecycleData.notes || ''}
                      onChange={(e) => setLifecycleData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowLifecycleModal(false)}
                    variant="outline"
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveLifecycle}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Update Status'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Modal */}
        {showFinancialModal && selectedAssetForManagement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Manage Financial Data
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Main Asset: {selectedAssetForManagement.tagId}
                  </p>
                </div>
                <button
                  onClick={() => setShowFinancialModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total Cost
                    </Label>
                    <Input
                      type="number"
                      value={financialData.totalCost || ''}
                      onChange={(e) => setFinancialData(prev => ({ ...prev, totalCost: parseFloat(e.target.value) || 0 }))}
                      placeholder="e.g., 150000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Depreciation Rate (%)
                    </Label>
                    <Input
                      type="number"
                      value={financialData.depreciationRate || ''}
                      onChange={(e) => setFinancialData(prev => ({ ...prev, depreciationRate: parseFloat(e.target.value) || 0 }))}
                      placeholder="e.g., 10"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Current Value
                    </Label>
                    <Input
                      type="number"
                      value={financialData.currentValue || ''}
                      onChange={(e) => setFinancialData(prev => ({ ...prev, currentValue: parseFloat(e.target.value) || 0 }))}
                      placeholder="e.g., 120000"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowFinancialModal(false)}
                    variant="outline"
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveFinancial}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Update Financial Data'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQRModal && selectedQRData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    QR Code
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Generated on {new Date(selectedQRData.generatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4 sm:p-6 text-center">
                <div className="mb-4 sm:mb-6">
                  <Image
                    src={selectedQRData.url.startsWith('http') ? selectedQRData.url : `https://digitalasset.zenapi.co.in${selectedQRData.url}`}
                    alt="QR Code"
                    width={250}
                    height={250}
                    className="mx-auto border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm"
                    style={{ objectFit: 'contain' }}
                    onError={(e) => {
                      console.error('QR Code image failed to load:', selectedQRData.url)
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => {
                      const link = document.createElement('a')
                      const fullUrl = selectedQRData.url.startsWith('http') ? selectedQRData.url : `https://digitalasset.zenapi.co.in${selectedQRData.url}`
                      link.href = fullUrl
                      link.download = `qr-code-${Date.now()}.png`
                      link.click()
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                  >
                    Download QR Code
                  </Button>
                  <Button
                    onClick={() => setShowQRModal(false)}
                    variant="outline"
                    className="px-4 py-2 w-full sm:w-auto"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  )

}