import { Dispatch, SetStateAction } from 'react'
import { AssetData, InventoryItem, SubAsset, PurchaseOrder, ReplacementRecord, LifecycleStatus, FinancialData, CreateAssetRequest, validateAssetData, createAsset } from '@/lib/adminasset'
import { assetApi } from '@/lib/adminasset'
import { ApiSubAsset } from '../types'
import { generateAssetId, generateSubAssetTagId, generateInventoryItemTagId } from '../utils/tag-id-generator'
import { Location } from '@/lib/location'

interface UseAssetHandlersProps {
  user: { projectName?: string; name?: string; projectId?: string } | null
  assets: AssetData[]
  newAsset: Partial<AssetData>
  setNewAsset: Dispatch<SetStateAction<Partial<AssetData>>>
  locationType: string
  setLocationType: Dispatch<SetStateAction<string>>
  assetTypeCode: string
  setAssetTypeCode: Dispatch<SetStateAction<string>>
  mainAssetInventory: {
    consumables: InventoryItem[]
    spareParts: InventoryItem[]
    tools: InventoryItem[]
    operationalSupply: InventoryItem[]
  }
  setMainAssetInventory: Dispatch<SetStateAction<{
    consumables: InventoryItem[]
    spareParts: InventoryItem[]
    tools: InventoryItem[]
    operationalSupply: InventoryItem[]
  }>>
  expandedRow: string | null
  setExpandedRow: Dispatch<SetStateAction<string | null>>
  expandedClassificationType: 'movable' | 'immovable' | null
  setExpandedClassificationType: Dispatch<SetStateAction<'movable' | 'immovable' | null>>
  selectedInventoryType: {[key: string]: 'consumables' | 'spareParts' | 'tools' | null}
  setSelectedInventoryType: Dispatch<SetStateAction<{[key: string]: 'consumables' | 'spareParts' | 'tools' | null}>>
  selectedMobility: 'all' | 'movable' | 'immovable' | 'inventory' | 'far'
  setSelectedMobility: Dispatch<SetStateAction<'all' | 'movable' | 'immovable' | 'inventory' | 'far'>>
  setCurrentStep: Dispatch<SetStateAction<'main' | 'subassets' | 'inventory'>>
  setShowAddAssetModal: Dispatch<SetStateAction<boolean>>
  setShowFlowchartModal: Dispatch<SetStateAction<boolean>>
  setSelectedAssetForFlowchart: Dispatch<SetStateAction<AssetData | null>>
  setShowSubAssetDetailsModal: Dispatch<SetStateAction<boolean>>
  setSelectedSubAssetForDetails: Dispatch<SetStateAction<ApiSubAsset | null>>
  setShowPOModal: Dispatch<SetStateAction<boolean>>
  setShowReplacementModal: Dispatch<SetStateAction<boolean>>
  setShowLifecycleModal: Dispatch<SetStateAction<boolean>>
  setShowFinancialModal: Dispatch<SetStateAction<boolean>>
  setShowQRModal: Dispatch<SetStateAction<boolean>>
  setSelectedAssetForManagement: Dispatch<SetStateAction<AssetData | null>>
  setSelectedSubAssetForManagement: Dispatch<SetStateAction<{
    asset: AssetData
    subAssetIndex: number
    category: 'movable' | 'immovable'
  } | null>>
  setSelectedQRData: Dispatch<SetStateAction<{
    url: string
    data: Record<string, unknown>
    generatedAt: string
  } | null>>
  setShowSuccess: Dispatch<SetStateAction<boolean>>
  setSuccessMessage: Dispatch<SetStateAction<string>>
  setLoading: Dispatch<SetStateAction<boolean>>
  fetchAssets: () => Promise<void>
  locations: Location[]
  loadingLocations: boolean
  setSelectedLocationId: Dispatch<SetStateAction<string>>
  setSelectedLocationName: Dispatch<SetStateAction<string>>
  setPOData: Dispatch<SetStateAction<Partial<PurchaseOrder>>>
  setReplacementData: Dispatch<SetStateAction<Partial<ReplacementRecord>>>
  setLifecycleData: Dispatch<SetStateAction<Partial<LifecycleStatus>>>
  setFinancialData: Dispatch<SetStateAction<Partial<FinancialData>>>
  selectedAssetForManagement: AssetData | null
  selectedSubAssetForManagement: {
    asset: AssetData
    subAssetIndex: number
    category: 'movable' | 'immovable'
  } | null
  poData: Partial<PurchaseOrder>
  replacementData: Partial<ReplacementRecord>
  lifecycleData: Partial<LifecycleStatus>
  financialData: Partial<FinancialData>
}

export const useAssetHandlers = (props: UseAssetHandlersProps) => {
  const {
    user,
    assets,
    newAsset,
    setNewAsset,
    locationType,
    setLocationType,
    assetTypeCode,
    setAssetTypeCode,
    mainAssetInventory,
    setMainAssetInventory,
    expandedRow,
    setExpandedRow,
    expandedClassificationType,
    setExpandedClassificationType,
    selectedInventoryType,
    setSelectedInventoryType,
    selectedMobility,
    setSelectedMobility,
    setCurrentStep,
    setShowAddAssetModal,
    setShowFlowchartModal,
    setSelectedAssetForFlowchart,
    setShowSubAssetDetailsModal,
    setSelectedSubAssetForDetails,
    setShowPOModal,
    setShowReplacementModal,
    setShowLifecycleModal,
    setShowFinancialModal,
    setShowQRModal,
    setSelectedAssetForManagement,
    setSelectedSubAssetForManagement,
    setSelectedQRData,
    setShowSuccess,
    setSuccessMessage,
    setLoading,
    fetchAssets,
    locations,
    loadingLocations,
    setSelectedLocationId,
    setSelectedLocationName,
    setPOData,
    setReplacementData,
    setLifecycleData,
    setFinancialData,
    selectedAssetForManagement,
    selectedSubAssetForManagement,
    poData,
    replacementData,
    lifecycleData,
    financialData
  } = props

  const handleMovableClick = (asset: AssetData) => {
    if (expandedRow === asset._id && expandedClassificationType === 'movable') {
      setExpandedRow(null)
      setExpandedClassificationType(null)
      const newInventoryState = { ...selectedInventoryType }
      Object.keys(newInventoryState).forEach(key => {
        if (key.startsWith(asset._id)) {
          delete newInventoryState[key]
        }
      })
      setSelectedInventoryType(newInventoryState)
    } else {
      setExpandedRow(asset._id)
      setExpandedClassificationType('movable')
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
      setExpandedRow(null)
      setExpandedClassificationType(null)
      const newInventoryState = { ...selectedInventoryType }
      Object.keys(newInventoryState).forEach(key => {
        if (key.startsWith(asset._id)) {
          delete newInventoryState[key]
        }
      })
      setSelectedInventoryType(newInventoryState)
    } else {
      setExpandedRow(asset._id)
      setExpandedClassificationType('immovable')
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
    setSelectedMobility(value as 'all' | 'movable' | 'immovable' | 'inventory' | 'far')
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
    setCurrentStep('main')
    setShowAddAssetModal(true)
    setLocationType('')
    setAssetTypeCode('')
    
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

    const generatedId = generateAssetId(user, locationType, assetTypeCode)
    if (assets.some(asset => asset.tagId === generatedId)) {
      alert('Asset ID already exists. Please use a different combination.')
      return
    }

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
      digitalTagType: 'qr',
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
      
      let updatedSubAsset = { ...currentSubAssets[index], [field]: value }
      
      if (field === 'assetName' && value.trim()) {
        const mainAssetId = prev.tagId || generateAssetId(user, locationType, assetTypeCode)
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

  const handleAddMainAssetInventoryItem = (inventoryType: 'consumables' | 'spareParts' | 'tools' | 'operationalSupply') => {
    const currentInventory = mainAssetInventory[inventoryType] || []
    const itemIndex = currentInventory.length
    
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
      
      const currentInventory = subAsset.inventory[inventoryType] || []
      const itemIndex = currentInventory.length
      
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

      const validation = validateAssetData(assetData)
      if (!validation.isValid) {
        alert(`Please fix the following errors:\n${validation.errors.join('\n')}`)
        return
      }

      const saveButton = document.querySelector('[data-testid="save-button"]') as HTMLButtonElement
      if (saveButton) {
        saveButton.disabled = true
        saveButton.textContent = 'Saving...'
      }

      const response = await createAsset(assetData)
     
      if (response.success) {
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

  const handleLocationSelect = (locationId: string) => {
    if (loadingLocations) return
    setSelectedLocationId(locationId)
    const selectedLocation = locations.find(loc => loc._id === locationId)
    if (selectedLocation) {
      const displayName = `${selectedLocation.name}${selectedLocation.type ? ` (${selectedLocation.type})` : ''}`
      setSelectedLocationName(displayName)
      
      const address = selectedLocation.address || ''
      const name = selectedLocation.name || ''
      
      let building = ''
      let floor = ''
      let room = ''
      
      const addressLower = address.toLowerCase()
      const nameLower = name.toLowerCase()
      
      const floorMatch = addressLower.match(/(\d+(?:st|nd|rd|th)?\s*floor|ground\s*floor|basement)/i)
      if (floorMatch) {
        floor = floorMatch[1]
      }
      
      const buildingMatch = addressLower.match(/(building\s*[a-z0-9]+|[^,]+building)/i)
      if (buildingMatch) {
        building = buildingMatch[1]
      } else if (nameLower.includes('building')) {
        building = name.split(' ')[0] + ' Building'
      }
      
      const roomMatch = addressLower.match(/(room\s*[a-z0-9]+|office|hall|lab)/i)
      if (roomMatch) {
        room = roomMatch[1]
      }
      
      if (!building && name) {
        building = name
      }
      
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
        response = await assetApi.linkSubAssetToPO(
          selectedAssetForManagement._id,
          selectedSubAssetForManagement.subAssetIndex,
          selectedSubAssetForManagement.category,
          poData as PurchaseOrder
        )
      } else {
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
        response = await assetApi.recordSubAssetReplacement(
          selectedAssetForManagement._id,
          selectedSubAssetForManagement.subAssetIndex,
          selectedSubAssetForManagement.category,
          replacementData as ReplacementRecord
        )
      } else {
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
        response = await assetApi.updateSubAssetLifecycleStatus(
          selectedAssetForManagement._id,
          selectedSubAssetForManagement.subAssetIndex,
          selectedSubAssetForManagement.category,
          lifecycleData as LifecycleStatus
        )
      } else {
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

  const handleUpdateTagId = async (assetId: string, subAssetIndex: number, category: 'movable' | 'immovable', currentTagId: string) => {
    try {
      const newTagId = prompt('Enter Tag ID:', currentTagId || '');
      if (newTagId !== null && newTagId.trim() !== '') {
        setLoading(true);
        
        const result = await assetApi.updateSubAssetTagId(assetId, subAssetIndex, category, newTagId.trim());
        
        if (result.success) {
          await fetchAssets();
          setSuccessMessage('Tag ID updated successfully!');
        } else {
          setSuccessMessage(`Failed to update tag ID: ${result.message}`);
        }
      }
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
        
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
  }

  return {
    handleMovableClick,
    handleImmovableClick,
    handleInventoryClick,
    handleRadioChange,
    handleViewFlowchart,
    handleViewSubAssetDetails,
    handleCloseFlowchartModal,
    handleAddAsset,
    handleCloseAddAssetModal,
    handleMainAssetSave,
    handleAddSubAsset,
    handleSubAssetChange,
    handleRemoveSubAsset,
    handleAddMainAssetInventoryItem,
    handleMainAssetInventoryItemChange,
    handleRemoveMainAssetInventoryItem,
    handleAddInventoryItem,
    handleInventoryItemChange,
    handleRemoveInventoryItem,
    handleFinalSave,
    handleInputChange,
    handleLocationSelect,
    handleOpenPOModal,
    handleOpenReplacementModal,
    handleOpenLifecycleModal,
    handleQRCodeClick,
    handleSavePO,
    handleSaveReplacement,
    handleSaveLifecycle,
    handleSaveFinancial,
    handleUpdateTagId
  }
}

