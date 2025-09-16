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
        const qrUrl = `https://digitalasset.zenapi.co.in${asset.digitalAssets.qrCode.url}`
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
        const barcodeUrl = `https://digitalasset.zenapi.co.in${asset.digitalAssets.barcode.url}`
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
      console.log('Processing scanned result:', assetId)
      
      // Try to find a real asset from the current list
      const foundAsset = assets.find(asset => {
        // Check multiple possible matches
        const matches = [
          asset.tagId === assetId,
          asset._id === assetId,
          asset.digitalAssets?.qrCode?.data?.t === assetId,
          asset.digitalAssets?.qrCode?.data?.a === assetId,
          asset.digitalAssets?.nfcData?.data?.id === assetId,
          // Check if QR code data contains the scanned ID
          asset.digitalAssets?.qrCode?.data ? 
            JSON.stringify(asset.digitalAssets.qrCode.data).includes(assetId) : false,
          // Check if scanned ID contains asset tag
          typeof assetId === 'string' && assetId.includes(asset.tagId),
          // Check if asset tag contains scanned ID
          asset.tagId.includes(assetId)
        ]
        
        console.log(`Checking asset ${asset.tagId}:`, matches)
        return matches.some(match => match)
      })
      
      if (foundAsset) {
        console.log('Asset found:', foundAsset.tagId)
        setScannedResult(`✅ Asset found: ${foundAsset.tagId}`)
        setSuccessAsset(foundAsset)
        setShowSuccessModal(true)
        setShowScanner(false)
      } else {
        console.log('No asset found for scanned ID:', assetId)
        // Create a simulated asset with the actual scanned data
        const simulatedAsset: Asset = {
          _id: `SCANNED_${Date.now()}`,
          tagId: assetId,
          assetType: 'Scanned Asset',
          subcategory: 'QR Code',
          brand: 'Unknown',
          model: 'Scanned',
          status: 'active',
          priority: 'medium',
          location: null,
          project: null,
          compliance: {
            certifications: [],
            expiryDates: [],
            regulatoryRequirements: []
          },
          digitalAssets: {
            qrCode: {
              url: '',
              data: { t: assetId, c: 'scanned' },
              generatedAt: new Date().toISOString()
            },
            barcode: {
              url: '',
              data: assetId,
              generatedAt: new Date().toISOString()
            },
            nfcData: {
              url: '',
              data: { id: assetId, timestamp: new Date().toISOString() },
              generatedAt: new Date().toISOString()
            }
          },
          assignedTo: 'Scanner',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        setScannedResult(`ℹ️ Scanned QR Code: ${assetId}`)
        setSuccessAsset(simulatedAsset)
        setShowSuccessModal(true)
        setShowScanner(false)
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
- QR Code: ${asset.digitalAssets?.qrCode?.url ? `https://digitalasset.zenapi.co.in${asset.digitalAssets.qrCode.url}` : 'N/A'}
- Barcode: ${asset.digitalAssets?.barcode?.url ? `https://digitalasset.zenapi.co.in${asset.digitalAssets.barcode.url}` : 'N/A'}
- NFC Data: ${asset.digitalAssets?.nfcData?.url ? `https://digitalasset.zenapi.co.in${asset.digitalAssets.nfcData.url}` : 'N/A'}

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

      const qrUrl = `https://digitalasset.zenapi.co.in${asset.digitalAssets.qrCode.url}`
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

      const barcodeUrl = `https://digitalasset.zenapi.co.in${asset.digitalAssets.barcode.url}`
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
      
      const response = await fetch('https://digitalasset.zenapi.co.in/api/assets', {
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
    return () => {
      if (viewModalQrImgSrc && viewModalQrImgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(viewModalQrImgSrc)
      }
      if (viewModalBarcodeImgSrc && viewModalBarcodeImgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(viewModalBarcodeImgSrc)
      }
    }
  }, [viewModalQrImgSrc, viewModalBarcodeImgSrc])

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
    <div className="flex h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="flex-1 overflow-auto">
        {/* ERP Style Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 shadow-sm transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-lg shadow-sm">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  Asset Management
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
                  Manage facility assets with advanced scanning capabilities
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-800 dark:text-green-300 font-medium">Live</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Project Info Banner */}
         
          {/* Enhanced Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              <p className="text-sm text-muted-foreground">
                Manage your facility assets with scanning capabilities
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchAssets}
                disabled={isLoading}
                className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-xs sm:text-sm"
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Refresh</span>
              </Button>
              
              {/* View Mode Toggle - Mobile Responsive */}
              <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
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
                className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Scan className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Scan QR</span>
                <span className="sm:hidden">Scan</span>
              </Button>
            </div>
          </div>

          {/* Enhanced Search Container - Mobile Responsive */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {/* Search Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4">
                  <div className="w-full">
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

                {/* Search Results Info - Mobile Responsive */}
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
            <Card className="shadow-lg bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-slate-100 to-blue-100 rounded-full flex items-center justify-center">
                    <Search className="h-10 w-10 text-slate-400" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-slate-900">
                      No assets found
                    </h3>
                    <p className="text-slate-600 text-base max-w-md">
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
                      className="border-slate-300 text-slate-700 hover:bg-slate-50 font-medium px-6 py-2 rounded-lg"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6'
              : 'space-y-3 sm:space-y-4'
            }>
              {filteredAssets.map((asset) => (
                viewMode === 'grid' 
                  ? <AssetCard 
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
                  : <AssetListItem 
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
          )}
        </main>
      </div>

      {/* Modals */}
      <ScannerModal
        key={scannerKey}
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanResult={(result) => {
          if (typeof result === 'string') {
            handleScannedResult(result)
          } else {
            console.warn('Unexpected scan result type', result)
          }
        }}
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
          <div className="bg-white rounded-lg shadow-lg max-w-lg sm:max-w-xl w-full max-h-[90vh] overflow-hidden">
            {/* Simple Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Asset Details</h3>
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
                <h2 className="text-xl font-bold text-gray-900 mb-1">{scannedAsset.tagId}</h2>
                <p className="text-sm text-gray-600">{scannedAsset.assetType}</p>
                <p className="text-sm text-gray-600">{scannedAsset.brand} • {scannedAsset.model}</p>
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
                      <span className="text-gray-500">Priority:</span>
                      <span className="font-medium text-gray-900 capitalize">{scannedAsset.priority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Assigned To:</span>
                      <span className="font-medium text-gray-900 max-w-[120px] truncate">
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
                        <span className="text-gray-500">Building:</span>
                        <span className="font-medium text-gray-900">{scannedAsset.location.building}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Floor:</span>
                        <span className="font-medium text-gray-900">{scannedAsset.location.floor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Room:</span>
                        <span className="font-medium text-gray-900">{scannedAsset.location.room}</span>
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
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">More Options</h3>
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
                className="w-full justify-start h-10 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
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
                className="w-full justify-start h-10 text-slate-700 hover:bg-green-50 hover:text-green-600"
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
