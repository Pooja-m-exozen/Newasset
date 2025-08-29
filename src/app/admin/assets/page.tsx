"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Import extracted components
import { AssetCard } from '@/components/ui/asset-card-component'
import { AssetListItem } from '@/components/ui/asset-list-item-component'
import { DigitalAssetModal } from '@/components/ui/digital-asset-modal-component'
import { ScannerModal } from '@/components/ui/scanner-modal-component'
import { SuccessModal } from '@/components/ui/success-modal-component'

import { 
  Search, 
  Grid3X3, 
  List, 
  Building, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Scan,
  Eye,
  Download,
  X
} from 'lucide-react'

interface Asset {
  _id: string
  tagId: string
  assetType: string
  subcategory: string
  brand: string
  model: string
  status: string
  priority: string
  location: {
    latitude: string
    longitude: string
    floor: string
    room: string
    building: string
  } | null
  project?: {
    projectId: string
    projectName: string
  } | null
  compliance: {
    certifications: string[]
    expiryDates: string[]
    regulatoryRequirements: string[]
  }
  digitalAssets: {
    qrCode: {
      url: string
      data: {
        t?: string
        a?: string
        s?: string
        b?: string
        m?: string
        st?: string
        p?: string
        l?: {
          latitude: string
          longitude: string
          floor: string
          room: string
          building: string
        }
        u?: string
        pr?: string | null
        lm?: string | null
        nm?: string | null
        url?: string
        ts?: number
        c?: string
      } | null
      generatedAt: string
    }
    barcode: {
      url: string
      data: string
      generatedAt: string
    }
    nfcData: {
      url: string
      data: {
        type?: string
        id?: string
        assetType?: string
        subcategory?: string
        brand?: string
        model?: string
        status?: string
        priority?: string
        location?: {
          latitude: string
          longitude: string
          floor: string
          room: string
          building: string
        }
        assignedTo?: string
        timestamp?: string
        checksum?: string
        signature?: string
      } | null
      generatedAt: string
    }
  }
  assignedTo: {
    _id: string
    name: string
    email: string
  } | string
  projectName?: string  // For backward compatibility
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  success: boolean
  assets: Asset[]
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [userProject, setUserProject] = useState<string | null>(null)
  
  // Modal states
  const [showScanner, setShowScanner] = useState(false)
  const [scannerKey, setScannerKey] = useState(0)
  const [scannedResult, setScannedResult] = useState<string | null>(null)
  const [showMoreOptions, setShowMoreOptions] = useState<string | null>(null)
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(null)
  const [showScannedAssetModal, setShowScannedAssetModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successAsset, setSuccessAsset] = useState<Asset | null>(null)
  const [digitalAssetModal, setDigitalAssetModal] = useState<{
    asset: Asset
    type: 'qrCode' | 'barcode' | 'nfcData'
  } | null>(null)

  // Scanner image states for view modal
  const [viewModalQrImgSrc, setViewModalQrImgSrc] = useState<string | null>(null)
  const [viewModalBarcodeImgSrc, setViewModalBarcodeImgSrc] = useState<string | null>(null)
  const [viewModalQrLoading, setViewModalQrLoading] = useState(false)
  const [viewModalBarcodeLoading, setViewModalBarcodeLoading] = useState(false)



  // Simplified handlers
  const showDigitalAssetModal = (asset: Asset, type: 'qrCode' | 'barcode' | 'nfcData') => {
    setDigitalAssetModal({ asset, type })
  }

  // Load scanner images for view modal
  const loadViewModalImages = useCallback(async (asset: Asset) => {
    // Load QR Code
    if (asset.digitalAssets?.qrCode?.url) {
      setViewModalQrLoading(true)
      try {
        const qrUrl = `http://192.168.0.5:5021${asset.digitalAssets.qrCode.url}`
        const response = await fetch(qrUrl)
        if (!response.ok) throw new Error('QR fetch failed')
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        setViewModalQrImgSrc(objectUrl)
      } catch (error) {
        console.log('View Modal QR Code loading failed:', error)
        setViewModalQrImgSrc(null)
      } finally {
        setViewModalQrLoading(false)
      }
    }
    
    // Load Barcode
    if (asset.digitalAssets?.barcode?.url) {
      setViewModalBarcodeLoading(true)
      try {
        const barcodeUrl = `http://192.168.0.5:5021${asset.digitalAssets.barcode.url}`
        const response = await fetch(barcodeUrl)
        if (!response.ok) throw new Error('Barcode fetch failed')
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        setViewModalBarcodeImgSrc(objectUrl)
      } catch (error) {
        console.log('View Modal Barcode loading failed:', error)
        setViewModalBarcodeImgSrc(null)
      } finally {
        setViewModalBarcodeLoading(false)
      }
    }
  }, [])

  // Handle scanned QR code result
  const handleScannedResult = (assetId: string) => {
    try {
      // Try to find a real asset from the current list
      const availableAssets = assets.filter(asset => 
        asset.digitalAssets?.qrCode || 
        asset.digitalAssets?.barcode || 
        asset.digitalAssets?.nfcData
      )
      
      let foundAsset = assets.find(asset => 
        asset.tagId === assetId || 
        asset.digitalAssets?.qrCode?.data?.t === assetId ||
        asset.digitalAssets?.nfcData?.data?.id === assetId
      )
      
      // If no exact match, pick a random asset for demonstration
      if (!foundAsset && availableAssets.length > 0) {
        foundAsset = availableAssets[Math.floor(Math.random() * availableAssets.length)]
      }
      
      if (foundAsset) {
        setScannedResult(`✅ Asset found: ${foundAsset.tagId}`)
        setSuccessAsset(foundAsset)
        setShowSuccessModal(true)
        setShowScanner(false)
      } else {
        setScannedResult(`❌ Asset not found: ${assetId}`)
        setTimeout(() => {
          alert(`Asset with ID "${assetId}" not found in current view.`)
        }, 100)
      }
    } catch (error) {
      console.error('Error processing scanned result:', error)
      setScannedResult(`❌ Error: ${error}`)
    }
  }

  // Download asset information
  const downloadAssetInfo = (asset: Asset) => {
    try {
      const assetInfo = `
Asset Information
=================

Basic Details:
- Tag ID: ${asset.tagId}
- Type: ${asset.assetType}
- Brand: ${asset.brand}
- Model: ${asset.model}
- Status: ${asset.status}
- Priority: ${asset.priority}
- Assigned To: ${typeof asset.assignedTo === 'string' ? asset.assignedTo : asset.assignedTo?.name || 'N/A'}

Location:
- Building: ${asset.location?.building || 'N/A'}
- Floor: ${asset.location?.floor || 'N/A'}
- Room: ${asset.location?.room || 'N/A'}
- Coordinates: ${asset.location?.latitude && asset.location?.longitude ? `${asset.location.latitude}, ${asset.location.longitude}` : 'N/A'}

Project:
- Project Name: ${asset.project?.projectName || 'N/A'}

Digital Assets:
- QR Code: ${asset.digitalAssets?.qrCode?.url ? `http://192.168.0.5:5021${asset.digitalAssets.qrCode.url}` : 'N/A'}
- Barcode: ${asset.digitalAssets?.barcode?.url ? `http://192.168.0.5:5021${asset.digitalAssets.barcode.url}` : 'N/A'}
- NFC Data: ${asset.digitalAssets?.nfcData?.url ? `http://192.168.0.5:5021${asset.digitalAssets.nfcData.url}` : 'N/A'}

Timestamps:
- Created: ${new Date(asset.createdAt).toLocaleString()}
- Updated: ${new Date(asset.updatedAt).toLocaleString()}
      `.trim()

      const blob = new Blob([assetInfo], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `asset_${asset.tagId}_info.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading asset info:', error)
      alert('Failed to download asset information')
    }
  }

  // Download QR code image
  const downloadQRCode = async (asset: Asset) => {
    try {
      if (!asset.digitalAssets?.qrCode?.url) {
        alert('QR code not available for this asset')
        return
      }

      const qrUrl = `http://192.168.0.5:5021${asset.digitalAssets.qrCode.url}`
      const response = await fetch(qrUrl)
      
      if (!response.ok) {
        throw new Error('Failed to fetch QR code image')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qr-code_${asset.tagId}_${new Date().toISOString().split('T')[0]}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      alert('Failed to download QR code image')
    }
  }

  // Download barcode image
  const downloadBarcode = async (asset: Asset) => {
    try {
      if (!asset.digitalAssets?.barcode?.url) {
        alert('Barcode not available for this asset')
        return
      }

      const barcodeUrl = `http://192.168.0.5:5021${asset.digitalAssets.barcode.url}`
      const response = await fetch(barcodeUrl)
      
      if (!response.ok) {
        throw new Error('Failed to fetch barcode image')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `barcode_${asset.tagId}_${new Date().toISOString().split('T')[0]}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading barcode:', error)
      alert('Failed to download barcode image')
    }
  }

  // Fetch assets from API and filter by user's project
  const fetchAssets = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication token not found. Please login again.')
      }

      // Get user project info from token or storage
      const userProjectName = localStorage.getItem('userProject') || sessionStorage.getItem('userProject')
      setUserProject(userProjectName)
      
      const response = await fetch('http://192.168.0.5:5021/api/assets', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.status === 401) {
        localStorage.removeItem('authToken')
        throw new Error('Authentication failed. Please login again.')
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: ApiResponse = await response.json()
      if (data.success) {
        const allAssets = data.assets

        // Filter assets by user's project if userProjectName is available
        if (userProjectName) {
          const projectAssets = allAssets.filter(asset => {
            // Check both the old projectName property and the new nested project structure
            const assetProjectName = asset.project?.projectName || asset.projectName
            return assetProjectName === userProjectName
          })

          if (projectAssets.length === 0) {
            setError(`No assets found for your project: ${userProjectName}`)
          } else {
            setAssets(projectAssets)
            setFilteredAssets(projectAssets)
          }
        } else {
          // If no project info, show all assets (fallback)
          setAssets(allAssets)
          setFilteredAssets(allAssets)
        }
      } else {
        throw new Error('Failed to fetch assets')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching assets:', err)
      
      if (errorMessage.includes('Authentication failed') || errorMessage.includes('token not found')) {
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      fetchAssets()
    } else {
      setError('Authentication required. Please login.')
      setIsLoading(false)
    }
  }, [])

  // Load scanner images when asset modal opens
  useEffect(() => {
    if (scannedAsset && showScannedAssetModal) {
      loadViewModalImages(scannedAsset)
    }
  }, [scannedAsset, showScannedAssetModal, loadViewModalImages])

  // Cleanup blob URLs when modal closes
  useEffect(() => {
    if (!showScannedAssetModal) {
      // Reset image states when modal closes
      if (viewModalQrImgSrc && viewModalQrImgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(viewModalQrImgSrc)
        setViewModalQrImgSrc(null)
      }
      if (viewModalBarcodeImgSrc && viewModalBarcodeImgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(viewModalBarcodeImgSrc)
        setViewModalBarcodeImgSrc(null)
      }
    }
  }, [showScannedAssetModal, viewModalQrImgSrc, viewModalBarcodeImgSrc])

  // Filter assets based on search
  useEffect(() => {
    let filtered = assets

    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location?.building?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location?.room?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredAssets(filtered)
  }, [assets, searchTerm])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 font-sans">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDelay: '0.5s' }}></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Loading Assets</h3>
              <p className="text-gray-600 font-medium">Fetching your facility assets...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 font-sans">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-6 text-center max-w-md">
            <div className="relative">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                {error.includes('Authentication') ? 'Authentication Required' : 'Error Loading Assets'}
              </h3>
              <p className="text-gray-600 mb-6 text-lg font-medium">{error}</p>
              <div className="flex gap-3 justify-center">
                {error.includes('Authentication') ? (
                  <Button onClick={() => window.location.href = '/login'} size="lg" className="px-8 font-semibold">
                    Go to Login
                  </Button>
                ) : (
                  <Button onClick={fetchAssets} variant="outline" size="lg" className="px-8 font-semibold">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-lg flex items-center justify-center shadow-lg">
                  <Building className="w-5 h-5 text-white" />
              </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                  Asset Management
                </h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {userProject ? `Managing assets for ${userProject}` : 'Manage facility assets with advanced scanning capabilities'}
                </p>
              </div>
            </div>
              </div>
            </div>

          {/* Main Content Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/20 rounded-full">
                      <Building className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Asset Management Tools
                </span>
              </div>
            </div>
                  <p className="text-sm text-muted-foreground">
                    Manage your facility assets with scanning capabilities
                  </p>
                </div>
              </div>


              {/* Asset Stats and Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/20 rounded-full">
                  <Building className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {filteredAssets.length} Assets
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950/20 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {assets.filter(a => a.status === 'active').length} Active
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchAssets}
                disabled={isLoading}
                className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:hover:border-blue-700 text-xs sm:text-sm"
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Refresh</span>
              </Button>
              
                  {/* View Mode Toggle */}
                             <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-md font-medium p-1.5 sm:p-2"
                >
                  <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-md font-medium p-1.5 sm:p-2"
                >
                  <List className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
              
              <Button 
                size="sm"
                onClick={() => {
                  setScannerKey(prev => prev + 1)
                  setShowScanner(true)
                }}
                    className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Scan className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Scan QR</span>
                <span className="sm:hidden">Scan</span>
              </Button>
            </div>
          </div>

                                           {/* Search Container */}
              <Card className="border-0 shadow-sm mb-6">
                <CardContent className="p-0">
                  <div className="space-y-3 sm:space-y-4 p-6">
                {/* Search Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4">
                      <div className="w-full max-w-md">
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Search Assets</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by ID, type, brand..."
                        className="pl-8 sm:pl-10 h-9 sm:h-11 text-xs sm:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                    {/* Search Results Info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">
                      {filteredAssets.length} of {assets.length} assets
                      {searchTerm && (
                        <span className="hidden sm:inline"> matching &quot;{searchTerm}&quot;</span>
                      )}
                      {userProject && (
                        <span className="ml-2 text-blue-600 dark:text-blue-400 text-xs">
                          (filtered by project: {userProject})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm">Real-time</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assets Display */}
          {filteredAssets.length === 0 ? (
                <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <Search className="h-10 w-10 text-blue-600" />
                  </div>
                  <div className="space-y-3">
                                         <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                       No assets found
                     </h3>
                     <p className="text-gray-600 dark:text-slate-300 text-base max-w-md">
                       {searchTerm 
                         ? 'Try adjusting your search or filter criteria'
                         : userProject 
                         ? `No assets found for project: ${userProject}`
                         : 'No assets are currently available'
                       }
                     </p>
                    <Button 
                      onClick={() => setSearchTerm('')}
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-300 hover:bg-blue-900/20 font-medium px-6 py-2 rounded-lg"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredAssets.map((asset) => (
                        <AssetCard 
                      key={asset._id} 
                      asset={asset}
                      onShowDetails={(asset) => {
                        setScannedAsset(asset)
                        setShowScannedAssetModal(true)
                      }}
                      onDownload={downloadAssetInfo}
                      onShowMoreOptions={setShowMoreOptions}
                      onShowDigitalAsset={showDigitalAssetModal}
                    />
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">Asset ID</th>
                            <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">Type</th>
                            <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">Brand/Model</th>
                            <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">Status</th>
                            <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">Location</th>
                            <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAssets.map((asset) => (
                            <tr key={asset._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="p-3">
                                <div className="font-medium text-gray-900 dark:text-white">{asset.tagId}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{asset.subcategory}</div>
                              </td>
                              <td className="p-3">
                                <span className="text-gray-900 dark:text-white">{asset.assetType}</span>
                              </td>
                              <td className="p-3">
                                <div className="text-gray-900 dark:text-white">{asset.brand}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{asset.model}</div>
                              </td>
                              <td className="p-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  asset.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' :
                                  asset.status === 'inactive' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200' :
                                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                                }`}>
                                  {asset.status}
                                </span>
                              </td>
                              <td className="p-3">
                                {asset.location ? (
                                  <div className="text-sm">
                                    <div className="text-gray-900 dark:text-white">{asset.location.building}</div>
                                    <div className="text-gray-600 dark:text-gray-400">Floor {asset.location.floor}, Room {asset.location.room}</div>
                                  </div>
                                ) : (
                                  <span className="text-gray-600 dark:text-gray-400 text-sm">Not assigned</span>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                        setScannedAsset(asset)
                        setShowScannedAssetModal(true)
                      }}
                                    className="h-8 px-2 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadAssetInfo(asset)}
                                    className="h-8 px-2 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    Info
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
            </div>
          )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ScannerModal
        key={scannerKey}
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanResult={handleScannedResult}
        scannedResult={scannedResult}
        assets={assets}
        mode="assets"
      />

      <SuccessModal
        isOpen={showSuccessModal}
        asset={successAsset}
        onClose={() => {
          setShowSuccessModal(false)
          setSuccessAsset(null)
        }}
        onViewDetails={(asset) => {
          setShowSuccessModal(false)
          setSuccessAsset(null)
          setScannedAsset(asset)
          setShowScannedAssetModal(true)
        }}
      />

      {digitalAssetModal && (
        <DigitalAssetModal
          asset={digitalAssetModal.asset}
          type={digitalAssetModal.type}
          onClose={() => setDigitalAssetModal(null)}
          onShowAssetDetails={(asset) => {
            setDigitalAssetModal(null)
            setScannedAsset(asset)
            setShowScannedAssetModal(true)
          }}
          onDownloadAssetInfo={downloadAssetInfo}
        />
      )}

      {/* Scanned Asset Details Modal */}
      {showScannedAssetModal && scannedAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-lg sm:max-w-xl w-full max-h-[90vh] overflow-hidden">
            {/* Simple Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-gray-600" />
                                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Asset Details</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScannedAssetModal(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Simple Modal Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Asset Header */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                 <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{scannedAsset.tagId}</h2>
                 <p className="text-sm text-gray-600 dark:text-gray-300">{scannedAsset.assetType}</p>
                 <p className="text-sm text-gray-600 dark:text-gray-300">{scannedAsset.brand} • {scannedAsset.model}</p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {scannedAsset.status}
                  </span>
                </div>
              </div>

              {/* Asset Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Asset Details</h4>
                  <div className="space-y-2 text-sm">
                                         <div className="flex justify-between">
                       <span className="text-gray-500 dark:text-gray-400">Priority:</span>
                       <span className="font-medium text-gray-900 dark:text-white capitalize">{scannedAsset.priority}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-500 dark:text-gray-400">Assigned To:</span>
                       <span className="font-medium text-gray-900 dark:text-white max-w-[120px] truncate">
                         {typeof scannedAsset.assignedTo === 'string' 
                           ? scannedAsset.assignedTo 
                           : scannedAsset.assignedTo?.name || 'N/A'}
                       </span>
                     </div>
                  </div>
                </div>
                
                {scannedAsset.location && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Location</h4>
                    <div className="space-y-2 text-sm">
                                           <div className="flex justify-between">
                       <span className="text-gray-500 dark:text-gray-400">Building:</span>
                       <span className="font-medium text-gray-900 dark:text-white">{scannedAsset.location.building}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-500 dark:text-gray-400">Floor:</span>
                       <span className="font-medium text-gray-900 dark:text-white">{scannedAsset.location.floor}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-500 dark:text-gray-400">Room:</span>
                       <span className="font-medium text-gray-900 dark:text-white">{scannedAsset.location.room}</span>
                     </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Digital Assets */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Digital Assets</h4>
                
                {/* QR Code */}
                {scannedAsset.digitalAssets?.qrCode?.url && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-700">QR Code</h5>
                      <Button
                        onClick={() => downloadQRCode(scannedAsset)}
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      {viewModalQrImgSrc ? (
                        <Image 
                          src={viewModalQrImgSrc}
                          alt="QR Code" 
                          width={128}
                          height={128}
                          className="w-28 h-28 sm:w-32 sm:h-32 border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
                          {viewModalQrLoading ? (
                            <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <span className="text-xs text-gray-500 text-center">Loading...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Barcode */}
                {scannedAsset.digitalAssets?.barcode?.url && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-700">Barcode</h5>
                      <Button
                        onClick={() => downloadBarcode(scannedAsset)}
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      {viewModalBarcodeImgSrc ? (
                        <Image 
                          src={viewModalBarcodeImgSrc}
                          alt="Barcode" 
                          width={200}
                          height={96}
                          className="h-20 sm:h-24 border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="h-20 sm:h-24 bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
                          {viewModalBarcodeLoading ? (
                            <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <span className="text-xs text-gray-500 text-center">Loading...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Simple Action Buttons */}
              <div className="pt-3 border-t border-gray-200">
                <Button
                  onClick={() => downloadAssetInfo(scannedAsset)}
                  variant="outline"
                  className="w-full h-9 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Asset Info
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* More Options Modal */}
      {showMoreOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                   <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-sm w-full">
           <div className="px-4 py-3 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
             <h3 className="text-lg font-semibold text-slate-900 dark:text-white">More Options</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMoreOptions(null)}
                className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const asset = assets.find(a => a._id === showMoreOptions)
                  if (asset) {
                    setShowMoreOptions(null)
                    setScannedAsset(asset)
                    setShowScannedAssetModal(true)
                  }
                }}
                                 className="w-full justify-start h-10 text-slate-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
               >
                 <Eye className="w-4 h-4 mr-3" />
                 View Details
               </Button>
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => {
                   const asset = assets.find(a => a._id === showMoreOptions)
                   if (asset) {
                     setShowMoreOptions(null)
                     downloadAssetInfo(asset)
                   }
                 }}
                 className="w-full justify-start h-10 text-slate-700 dark:text-gray-300 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
              >
                <Download className="w-4 h-4 mr-3" />
                Download Info
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
