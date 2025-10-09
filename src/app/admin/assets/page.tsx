"use client"

import React, { useState, useEffect, useCallback } from 'react'
import ProtectedRoute from "@/components/ProtectedRoute"
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building, Package, Search, Eye, X, ArrowDown, Download, Plus, Trash2 } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { createAsset, validateAssetData, CreateAssetRequest, SubAsset, AssetData, getAssets, getAssetsByMobility, searchAssets, InventoryItem, Asset } from '@/lib/adminasset'

// API Response interfaces
interface ApiSubAsset {
  _id?: string
  id?: string
  assetName: string
  description: string
  category: 'Movable' | 'Immovable'
  brand: string
  model: string
  capacity: string
  location: string
  inventory: {
    consumables: InventoryItem[]
    spareParts: InventoryItem[]
    tools: InventoryItem[]
    operationalSupply: InventoryItem[]
  }
}

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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMobility, setSelectedMobility] = useState<'all' | 'movable' | 'immovable'>('all')
  const [assets, setAssets] = useState<AssetData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Asset classification states
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [expandedClassificationType, setExpandedClassificationType] = useState<'movable' | 'immovable' | null>(null)
  const [selectedInventoryType, setSelectedInventoryType] = useState<{[key: string]: 'consumables' | 'spareParts' | 'tools' | null}>({})
 
  // Modal states
  const [showFlowchartModal, setShowFlowchartModal] = useState(false)
  const [selectedAssetForFlowchart, setSelectedAssetForFlowchart] = useState<AssetData | null>(null)
  const [showAddAssetModal, setShowAddAssetModal] = useState(false)

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

  // Current step in the creation process
  const [currentStep, setCurrentStep] = useState<'main' | 'subassets' | 'inventory'>('main')

  // Fetch assets from API
  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
     
      let response
      if (searchTerm.trim()) {
        response = await searchAssets(searchTerm)
      } else if (selectedMobility !== 'all') {
        response = await getAssetsByMobility(selectedMobility)
      } else {
        response = await getAssets()
      }
     
      if (response.success) {
        // Transform backend data to frontend format
        const apiResponse = response as ApiAssetsResponse
        const transformedAssets = apiResponse.assets.map((asset: ApiAsset) => ({
          ...asset,
          subAssets: asset.subAssets ? {
            movable: asset.subAssets.movable.map((subAsset: ApiSubAsset) => ({
              id: subAsset._id || subAsset.id,
              assetName: subAsset.assetName,
              description: subAsset.description,
              category: subAsset.category,
              brand: subAsset.brand,
              model: subAsset.model,
              capacity: subAsset.capacity,
              location: subAsset.location,
              inventory: subAsset.inventory
            })),
            immovable: asset.subAssets.immovable.map((subAsset: ApiSubAsset) => ({
              id: subAsset._id || subAsset.id,
              assetName: subAsset.assetName,
              description: subAsset.description,
              category: subAsset.category,
              brand: subAsset.brand,
              model: subAsset.model,
              capacity: subAsset.capacity,
              location: subAsset.location,
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
  }, [searchTerm, selectedMobility])

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
    // Since we're fetching filtered data from API, we can return assets directly
    // Client-side filtering is now handled by the API calls
    return assets
  }
  // Load assets on component mount
  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  // Generate PDF function

  // Dynamic Asset Classification based on actual API sub-assets data
  const getAssetClassification = (asset: AssetData): AssetClassification => {
    // Use actual sub-assets from API response and transform them to include reason
    const movableAssets = (asset.subAssets?.movable || []).map(subAsset => ({
      assetName: subAsset.assetName,
      description: subAsset.description || '',
      category: subAsset.category,
      brand: subAsset.brand,
      model: subAsset.model,
      capacity: subAsset.capacity,
      location: subAsset.location,
      inventory: subAsset.inventory,
      reason: subAsset.category === 'Movable'
        ? 'Portable equipment that can be relocated as needed.'
        : 'Fixed installations that require specialized removal procedures.'
    }))
   
    const immovableAssets = (asset.subAssets?.immovable || []).map(subAsset => ({
      assetName: subAsset.assetName,
      description: subAsset.description || '',
      category: subAsset.category,
      brand: subAsset.brand,
      model: subAsset.model,
      capacity: subAsset.capacity,
      location: subAsset.location,
      inventory: subAsset.inventory,
      reason: subAsset.category === 'Immovable'
        ? 'Permanently installed infrastructure that cannot be moved without demolition.'
        : 'Fixed installations requiring specialized removal procedures.'
    }))

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
    setSelectedMobility(value as 'all' | 'movable' | 'immovable')
    // Don't show classification table on radio button selection
    // Only show when clicking action buttons
  }

  const handleViewFlowchart = (asset: AssetData) => {
    setSelectedAssetForFlowchart(asset)
    setShowFlowchartModal(true)
  }

  const handleCloseFlowchartModal = () => {
    setShowFlowchartModal(false)
    setSelectedAssetForFlowchart(null)
  }

  const handleAddAsset = () => {
    setCurrentStep('main') // Set step first
    setShowAddAssetModal(true)
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
  }

  const handleMainAssetSave = () => {
    if (!newAsset.tagId || !newAsset.assetType || !newAsset.brand) {
      alert('Please fill in all required fields (Asset ID, Asset Type, Brand)')
      return
    }

    if (assets.some(asset => asset.tagId === newAsset.tagId)) {
      alert('Asset ID already exists. Please use a different ID.')
      return
    }

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
     
      return {
        ...prev,
        subAssets: {
          ...prev.subAssets,
          [categoryKey]: currentSubAssets.map((subAsset, i) =>
            i === index ? { ...subAsset, [field]: value } : subAsset
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

  const handleAddInventoryItem = (category: 'Movable' | 'Immovable', subAssetIndex: number, inventoryType: 'consumables' | 'spareParts' | 'tools' | 'operationalSupply') => {
    const newItem: InventoryItem = {
      itemName: '',
      quantity: 0,
      status: 'Available',
      lastUpdated: new Date().toISOString().split('T')[0]
    }

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
                [inventoryType]: [...subAsset.inventory[inventoryType], newItem]
              }
            } : subAsset
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
                [inventoryType]: subAsset.inventory[inventoryType].map((item, j) =>
                  j === itemIndex ? { ...item, [field]: value } : item
                )
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
        location: newAsset.location!,
        subAssets: newAsset.subAssets
      }

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
      item.brand || 'N/A',
      item.model || 'N/A',
      item.capacity || 'N/A',
      item.location || 'N/A'
    ])
   
    autoTable(doc, {
      startY: rightY,
      head: [['#', 'Component Name', 'Brand', 'Model', 'Capacity', 'Location']],
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
        1: { cellWidth: 28, fontStyle: 'bold' },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 10 },
        5: { cellWidth: 16 }
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
          <div className="max-w-7xl mx-auto">

            {/* Search and Filters */}
            <div className="mb-4 px-4 py-2 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              {/* Search Input */}
              <div className="flex-1 max-w-md">
            <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                    placeholder="Search assets by ID, brand, model, or subcategory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
              />
          </div>
        </div>

          {/* Mobility Filter and Add Asset Button */}
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">Mobility:</Label>
                <RadioGroup
                  value={selectedMobility}
                  onValueChange={handleRadioChange}
                  className="flex gap-4"
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
                </RadioGroup>
               
                {/* Add Asset Button */}
                <Button
                  onClick={handleAddAsset}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  Add Asset
                </Button>
              </div>
              </div>


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

        {/* Assets Table */}
        {!loading && !error && (
            <div className="bg-background rounded-lg shadow-sm overflow-hidden border border-border">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse font-sans text-base min-w-[800px]">
                <thead>
                    <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        ASSET ID
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        TYPE & SUBCATEGORY
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        BRAND & MODEL
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        CAPACITY
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        STATUS
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        PRIORITY
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        LOCATION
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">ACTIONS</th>
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
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                            <span className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200">
                              {asset.tagId}
                            </span>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="p-1 sm:p-2 bg-blue-50 rounded-lg">
                                {asset.mobilityCategory === 'Movable' ? (
                                  <Package className="w-3 h-3 sm:w-5 sm:h-5 text-blue-800" />
                                ) : (
                                  <Building className="w-3 h-3 sm:w-5 sm:h-5 text-blue-800" />
                                )}
                              </div>
                              <div>
                                <div className="text-xs sm:text-sm font-medium text-blue-800">
                                  {asset.assetType}
                                </div>
                                <div className="text-xs text-blue-600">
                                  {asset.subcategory || 'No subcategory'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                            <div>
                              <div className="text-xs sm:text-sm font-medium text-blue-800">
                                {asset.brand}
                              </div>
                              <div className="text-xs text-blue-600">
                                {asset.model || 'No model'}
                              </div>
                            </div>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                            <span className="text-xs sm:text-sm text-blue-800">
                              {asset.capacity || 'N/A'}
                            </span>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                              {asset.status || 'Active'}
                            </span>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
                              {asset.priority || 'Medium'}
                            </span>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                            <div className="text-xs sm:text-sm text-blue-800">
                              {asset.location?.building && asset.location?.floor && asset.location?.room
                                ? `${asset.location.building}, ${asset.location.floor}, ${asset.location.room}`
                                : 'Location not set'
                              }
                            </div>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center gap-1 sm:gap-2 justify-center">
                              <button
                                onClick={() => handleMovableClick(asset)}
                                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                  isExpanded && expandedClassificationType === 'movable'
                                    ? 'text-white bg-green-600 hover:bg-green-700'
                                    : 'text-green-700 bg-green-100 hover:bg-green-200'
                                }`}
                                title="View Movable Assets"
                              >
                                <Package className="w-3 h-3" />
                                Movable
                              </button>
                              <button
                                onClick={() => handleImmovableClick(asset)}
                                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                  isExpanded && expandedClassificationType === 'immovable'
                                    ? 'text-white bg-blue-600 hover:bg-blue-700'
                                    : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                                }`}
                                title="View Immovable Assets"
                              >
                                <Building className="w-3 h-3" />
                                Immovable
                              </button>
                              <button
                                onClick={() => handleViewFlowchart(asset)}
                                className="px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 text-purple-700 bg-purple-100 hover:bg-purple-200"
                                title="View Asset Classification Flowchart"
                              >
                                <Eye className="w-3 h-3" />
                                View
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
                                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                                          Actions
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
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    onClick={() => handleInventoryClick(asset._id, index, 'consumables')}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                                      selectedInventoryType[`${asset._id}-${index}`] === 'consumables'
                                                        ? 'text-white bg-orange-600 hover:bg-orange-700'
                                                        : 'text-orange-700 bg-orange-100 hover:bg-orange-200'
                                                    }`}
                                                  >
                                                    Consumables
                                                  </button>
                                                  <button
                                                    onClick={() => handleInventoryClick(asset._id, index, 'spareParts')}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                                      selectedInventoryType[`${asset._id}-${index}`] === 'spareParts'
                                                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                                                        : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                                                    }`}
                                                  >
                                                    Spare Parts
                                                  </button>
                                                  <button
                                                    onClick={() => handleInventoryClick(asset._id, index, 'tools')}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                                      selectedInventoryType[`${asset._id}-${index}`] === 'tools'
                                                        ? 'text-white bg-green-600 hover:bg-green-700'
                                                        : 'text-green-700 bg-green-100 hover:bg-green-200'
                                                    }`}
                                                  >
                                                    Tools
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                           
                                            {/* Inventory Details Row */}
                                            {selectedInventoryType[`${asset._id}-${index}`] && (
                                              <tr>
                                                <td colSpan={6} className="border border-border p-0 bg-gray-50 dark:bg-gray-800">
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
             
            {filteredAssets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No assets found matching your criteria.
              </div>
            )}
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
                <div>
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
                          value={newAsset.tagId || ''}
                          onChange={(e) => handleInputChange('tagId', e.target.value)}
                          placeholder="e.g., WTP001, COMP001"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="assetType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Asset Type <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="assetType"
                          value={newAsset.assetType || ''}
                          onChange={(e) => handleInputChange('assetType', e.target.value)}
                          placeholder="e.g., WTP, Computer, Printer"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Subcategory
                        </Label>
                        <Input
                          id="subcategory"
                          value={newAsset.subcategory || ''}
                          onChange={(e) => handleInputChange('subcategory', e.target.value)}
                          placeholder="e.g., Water Treatment Plant, Desktop"
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
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 'inventory' && (
                  <div className="space-y-6">
                    {/* Movable Assets Inventory */}
                    {newAsset.subAssets?.movable.map((subAsset, subAssetIndex) => (
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
                              <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
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
                              <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
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
                              <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
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
                    ))}

                    {/* Immovable Assets Inventory */}
                    {newAsset.subAssets?.immovable.map((subAsset, subAssetIndex) => (
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
                              <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
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
                              <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
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
                              <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
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
                    ))}
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

      </div>
    </ProtectedRoute>
  )

}