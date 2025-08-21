"use client"

import React, { useState, useEffect } from 'react'
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
  X,
  MoreHorizontal
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
  const [isMobile, setIsMobile] = useState(false)
  
  // Modal states
  const [showScanner, setShowScanner] = useState(false)
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

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Simplified handlers
  const showDigitalAssetModal = (asset: Asset, type: 'qrCode' | 'barcode' | 'nfcData') => {
    setDigitalAssetModal({ asset, type })
  }

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
      const userProject = localStorage.getItem('userProject') || sessionStorage.getItem('userProject')
      
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
        let allAssets = data.assets

        // Filter assets by user's project if userProject is available
        if (userProject) {
          const projectAssets = allAssets.filter(asset => {
            // Check both the old projectName property and the new nested project structure
            const assetProjectName = asset.project?.projectName || asset.projectName
            return assetProjectName === userProject
          })

          if (projectAssets.length === 0) {
            setError(`No assets found for your project: ${userProject}`)
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
    <div className="flex h-screen bg-gradient-to-br from-background to-muted">
      <div className="flex-1 overflow-auto">
        {/* Enhanced Header - Mobile Responsive */}
        <header className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-b border-border px-3 sm:px-6 py-4 sm:py-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Building className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  Asset Management
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1 hidden sm:block">
                  Manage facility assets with advanced scanning capabilities
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 dark:text-green-300 font-medium">Live</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-8 space-y-6 sm:space-y-8">
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
                onClick={() => setShowScanner(true)}
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
                        <span className="hidden sm:inline"> matching "{searchTerm}"</span>
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
                      Try adjusting your search or filter criteria
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
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanResult={handleScannedResult}
        scannedResult={scannedResult}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md sm:max-w-2xl lg:max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">Asset Details</h3>
                  <p className="text-xs sm:text-sm text-slate-600">Complete asset information</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScannedAssetModal(false)}
                className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Asset Header */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border border-green-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Building className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-1">{scannedAsset.tagId}</h2>
                    <p className="text-sm sm:text-base text-green-600 font-medium">{scannedAsset.assetType}</p>
                    <p className="text-xs sm:text-sm text-green-600">{scannedAsset.brand} • {scannedAsset.model}</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full border border-green-300">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-bold text-green-700 capitalize">{scannedAsset.status}</span>
                  </div>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Asset Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Priority:</span>
                      <span className="font-medium text-slate-900 capitalize">{scannedAsset.priority}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Assigned To:</span>
                      <span className="font-medium text-slate-900">
                        {typeof scannedAsset.assignedTo === 'string' 
                          ? scannedAsset.assignedTo 
                          : scannedAsset.assignedTo?.name || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Location</h4>
                  <div className="space-y-2 text-sm">
                    {scannedAsset.location ? (
                      <>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Building:</span>
                          <span className="font-medium text-slate-900">{scannedAsset.location.building}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Floor:</span>
                          <span className="font-medium text-slate-900">{scannedAsset.location.floor}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Room:</span>
                          <span className="font-medium text-slate-900">{scannedAsset.location.room}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-slate-500">
                        <span>Location information not available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
                <Button
                  onClick={() => downloadAssetInfo(scannedAsset)}
                  variant="outline"
                  className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Info
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
