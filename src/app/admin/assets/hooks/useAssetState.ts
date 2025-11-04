import { useState, useEffect } from 'react'
import { AssetData, InventoryItem, PurchaseOrder, ReplacementRecord, LifecycleStatus, FinancialData } from '@/lib/adminasset'
import { Location } from '@/lib/location'
import { ApiSubAsset } from '../types'

interface User {
  projectName?: string
  name?: string
  projectId?: string
}

export const useAssetState = (user: User | null) => {
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMobility, setSelectedMobility] = useState<'all' | 'movable' | 'immovable' | 'inventory' | 'far'>('all')
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

  // Main asset inventory state
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

  // Current step in the creation process
  const [currentStep, setCurrentStep] = useState<'main' | 'subassets' | 'inventory'>('main')

  // Asset ID generation states
  const [locationType, setLocationType] = useState('')
  const [assetTypeCode, setAssetTypeCode] = useState('')

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

  return {
    // Search and filter
    searchTerm,
    setSearchTerm,
    selectedMobility,
    setSelectedMobility,
    loading,
    setLoading,

    // Classification
    expandedRow,
    setExpandedRow,
    expandedClassificationType,
    setExpandedClassificationType,
    selectedInventoryType,
    setSelectedInventoryType,
    showSuccess,
    setShowSuccess,
    successMessage,
    setSuccessMessage,

    // Modals
    showFlowchartModal,
    setShowFlowchartModal,
    selectedAssetForFlowchart,
    setSelectedAssetForFlowchart,
    showAddAssetModal,
    setShowAddAssetModal,
    showPOModal,
    setShowPOModal,
    showReplacementModal,
    setShowReplacementModal,
    showLifecycleModal,
    setShowLifecycleModal,
    showSubAssetDetailsModal,
    setShowSubAssetDetailsModal,
    selectedSubAssetForDetails,
    setSelectedSubAssetForDetails,
    expandedInventorySection,
    setExpandedInventorySection,
    showFinancialModal,
    setShowFinancialModal,
    selectedAssetForManagement,
    setSelectedAssetForManagement,
    selectedSubAssetForManagement,
    setSelectedSubAssetForManagement,
    showQRModal,
    setShowQRModal,
    selectedQRData,
    setSelectedQRData,

    // Locations
    locations,
    setLocations,
    loadingLocations,
    setLoadingLocations,
    selectedLocationId,
    setSelectedLocationId,
    selectedLocationName,
    setSelectedLocationName,

    // Asset form
    newAsset,
    setNewAsset,
    mainAssetInventory,
    setMainAssetInventory,
    currentStep,
    setCurrentStep,
    locationType,
    setLocationType,
    assetTypeCode,
    setAssetTypeCode,

    // Management forms
    poData,
    setPOData,
    replacementData,
    setReplacementData,
    lifecycleData,
    setLifecycleData,
    financialData,
    setFinancialData
  }
}

