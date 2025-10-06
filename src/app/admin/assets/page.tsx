"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Import extracted components
import { DigitalAssetModal } from '@/components/ui/digital-asset-modal-component'
import { ScannerModal } from '@/components/ui/scanner-modal-component'
import { SuccessModal } from '@/components/ui/success-modal-component'

import { 
  Search, 
  Building, 
  AlertCircle,
  RefreshCw,
  Scan,
  Eye,
  Download,
  X,
  ArrowUpDown,
  MoreVertical
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
  const [userProject, setUserProject] = useState<string | null>(null)
  
  // Table sorting states
  const [sortField, setSortField] = useState<keyof Asset>('tagId')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
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




  // Table sorting function
  const handleSort = (field: keyof Asset) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }


  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
      case 'inactive': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
      case 'maintenance': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700'
      case 'retired': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
      default: return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700'
    }
  }

  // Get priority badge color
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700'
      case 'low': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
    }
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
      
      // Try to fetch all assets with pagination
      let allAssets: Asset[] = [];
      let page = 1;
      const limit = 1000; // High limit to get all records
      let hasMoreData = true;

      while (hasMoreData) {
        const response = await fetch(`https://digitalasset.zenapi.co.in/api/assets?limit=${limit}&page=${page}`, {
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
          const pageAssets = data.assets || [];
          
          // If we got fewer assets than the limit, we've reached the end
          if (pageAssets.length < limit) {
            hasMoreData = false;
          }

          allAssets = [...allAssets, ...pageAssets];
          page++;

          // Safety check to prevent infinite loops
          if (page > 100) {
            console.warn('Reached maximum page limit (100), stopping pagination');
            break;
          }
        } else {
          throw new Error('Failed to fetch assets')
        }
      }

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

  // Filter and sort assets
  useEffect(() => {
    let filtered = assets

    // Apply search filter
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

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      // Handle nested objects
      if (sortField === 'assignedTo') {
        aValue = typeof a.assignedTo === 'string' ? a.assignedTo : a.assignedTo?.name || ''
        bValue = typeof b.assignedTo === 'string' ? b.assignedTo : b.assignedTo?.name || ''
      } else if (sortField === 'location') {
        aValue = a.location?.building || ''
        bValue = b.location?.building || ''
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
        return sortDirection === 'asc' ? comparison : -comparison
      }

      return 0
    })

    setFilteredAssets(filtered)
  }, [assets, searchTerm, sortField, sortDirection])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/60 rounded-full animate-spin" style={{ animationDelay: '0.5s' }}></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">Loading Assets</h3>
              <p className="text-muted-foreground font-medium">Fetching your facility assets...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-6 text-center max-w-md">
            <div className="relative">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
                {error.includes('Authentication') ? 'Authentication Required' : 'Error Loading Assets'}
              </h3>
              <p className="text-muted-foreground mb-6 text-lg font-medium">{error}</p>
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
    <div className="flex h-screen bg-background transition-colors duration-200">
      <div className="flex-1 overflow-auto">
        {/* Main Content */}
        <main className="px-4 pt-1 pb-1 sm:px-6 sm:pt-2 sm:pb-2 space-y-2 sm:space-y-3">
          {/* Simple Search and Actions */}
          <div className="flex items-center justify-between gap-4">
                {/* Search Input */}
            <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                placeholder="Search assets..."
                className="pl-10 h-10 text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
            {/* Action Buttons */}
                  <div className="flex items-center gap-2">
              <Button 
                onClick={() => {
                  setScannerKey(prev => prev + 1)
                  setShowScanner(true)
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Scan className="w-4 h-4" />
                <span>Scan QR</span>
              </Button>
                  </div>
                  </div>

          {/* Assets Table */}
          <Card className="border-border">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-muted-foreground">Loading assets...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                    <div>
                      <p className="text-lg font-semibold text-foreground">Failed to load data</p>
                      <p className="text-sm text-muted-foreground">{error}</p>
                    <Button 
                        onClick={fetchAssets}
                        className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                  </div>
                </div>
                </div>
              ) : (
                <div className="overflow-x-auto bg-background">
                  <table className="w-full border-collapse font-sans text-base">
                    <thead>
                      <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm">
                          #
                        </th>
                        <th 
                          className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                            onClick={() => handleSort('tagId')}
                        >
                          ASSET ID
                        </th>
                        <th 
                          className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                            onClick={() => handleSort('assetType')}
                        >
                          TYPE
                        </th>
                        <th 
                          className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                            onClick={() => handleSort('brand')}
                        >
                          BRAND
                        </th>
                        <th 
                          className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                            onClick={() => handleSort('status')}
                        >
                          STATUS
                        </th>
                        <th 
                          className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                            onClick={() => handleSort('priority')}
                        >
                          PRIORITY
                        </th>
                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm">
                          LOCATION
                        </th>
                        <th className="border border-border px-4 py-3 text-center font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.map((asset, index) => (
                        <tr key={asset._id} className="hover:bg-muted transition-colors">
                          <td className="border border-border px-4 py-3 text-sm font-medium text-blue-800">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full text-sm font-semibold text-blue-800">
                              {index + 1}
                            </div>
                          </td>
                          <td className="border border-border px-4 py-3">
                            <span className="text-sm font-medium text-primary cursor-pointer hover:underline">
                                  {asset.tagId}
                            </span>
                          </td>
                          <td className="border border-border px-4 py-3">
                            <span className="text-sm font-medium text-primary cursor-pointer hover:underline">
                              {asset.assetType}
                            </span>
                          </td>
                          <td className="border border-border px-4 py-3 text-sm text-muted-foreground">
                            {asset.brand}
                          </td>
                          <td className="border border-border px-4 py-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(asset.status)}`}>
                              {asset.status}
                            </span>
                          </td>
                          <td className="border border-border px-4 py-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadgeColor(asset.priority)}`}>
                              {asset.priority}
                            </span>
                          </td>
                          <td className="border border-border px-4 py-3 text-sm text-muted-foreground">
                              {asset.location ? (
                                <div>
                                  <div className="font-medium">{asset.location.building}</div>
                                <div className="text-muted-foreground">{asset.location.floor} • {asset.location.room}</div>
                                </div>
                              ) : (
                              <span className="text-muted-foreground">Not assigned</span>
                              )}
                          </td>
                          <td className="border border-border px-4 py-3">
                            <div className="flex items-center gap-2 justify-center">
                              <button 
                                className="w-9 h-9 flex items-center justify-center text-green-600 border border-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors shadow-sm"
                                onClick={() => {
                                  setScannedAsset(asset)
                                  setShowScannedAssetModal(true)
                                }}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                className="w-9 h-9 flex items-center justify-center text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors shadow-sm"
                                onClick={() => downloadAssetInfo(asset)}
                                title="Download Info"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button 
                                className="w-9 h-9 flex items-center justify-center text-destructive border border-destructive rounded-lg hover:bg-destructive/10 transition-colors shadow-sm"
                                onClick={() => setShowMoreOptions(asset._id)}
                                title="More Options"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </CardContent>
            </Card>

          {/* Empty State */}
          {!isLoading && !error && filteredAssets.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <Building className="w-12 h-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-semibold text-foreground">No assets found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm 
                      ? 'Try adjusting your search terms'
                      : userProject 
                      ? `No assets found for project: ${userProject}`
                      : 'No assets are currently available'
                    }
                  </p>
                </div>
                {searchTerm && (
                  <Button 
                    onClick={() => setSearchTerm('')}
                    className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <ScannerModal
        key={scannerKey}
        isOpen={showScanner}
        onCloseAction={() => setShowScanner(false)}
        onScanResultAction={(result) => {
          if (typeof result === 'string') {
            handleScannedResult(result)
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
          <div className="bg-card rounded-lg shadow-lg max-w-lg sm:max-w-xl w-full max-h-[90vh] overflow-hidden">
            {/* Simple Modal Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">Asset Details</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScannedAssetModal(false)}
                className="h-8 w-8 p-0 hover:bg-muted rounded"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Simple Modal Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Asset Header */}
              <div className="bg-muted rounded-lg p-3 border border-border">
                <h2 className="text-xl font-bold text-foreground mb-1">{scannedAsset.tagId}</h2>
                <p className="text-sm text-muted-foreground">{scannedAsset.assetType}</p>
                <p className="text-sm text-muted-foreground">{scannedAsset.brand} • {scannedAsset.model}</p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                    {scannedAsset.status}
                  </span>
                </div>
              </div>

              {/* Asset Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3 border border-border">
                  <h4 className="text-sm font-medium text-foreground mb-2">Asset Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priority:</span>
                      <span className="font-medium text-foreground capitalize">{scannedAsset.priority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assigned To:</span>
                      <span className="font-medium text-foreground max-w-[120px] truncate">
                        {typeof scannedAsset.assignedTo === 'string' 
                          ? scannedAsset.assignedTo 
                          : scannedAsset.assignedTo?.name || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {scannedAsset.location && (
                  <div className="bg-muted rounded-lg p-3 border border-border">
                    <h4 className="text-sm font-medium text-foreground mb-2">Location</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Building:</span>
                        <span className="font-medium text-foreground">{scannedAsset.location.building}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Floor:</span>
                        <span className="font-medium text-foreground">{scannedAsset.location.floor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Room:</span>
                        <span className="font-medium text-foreground">{scannedAsset.location.room}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Digital Assets */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Digital Assets</h4>
                
                {/* QR Code */}
                {scannedAsset.digitalAssets?.qrCode?.url && (
                  <div className="bg-muted rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-foreground">QR Code</h5>
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
                          className="w-28 h-28 sm:w-32 sm:h-32 border border-border rounded"
                        />
                      ) : (
                        <div className="w-28 h-28 sm:w-32 sm:h-32 bg-muted border border-border rounded flex items-center justify-center">
                          {viewModalQrLoading ? (
                            <div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <span className="text-xs text-muted-foreground text-center">Loading...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Barcode */}
                {scannedAsset.digitalAssets?.barcode?.url && (
                  <div className="bg-muted rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-foreground">Barcode</h5>
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
                          className="h-20 sm:h-24 border border-border rounded"
                        />
                      ) : (
                        <div className="h-20 sm:h-24 bg-muted border border-border rounded flex items-center justify-center">
                          {viewModalBarcodeLoading ? (
                            <div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <span className="text-xs text-muted-foreground text-center">Loading...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Simple Action Buttons */}
              <div className="pt-3 border-t border-border">
                <Button
                  onClick={() => downloadAssetInfo(scannedAsset)}
                  variant="outline"
                  className="w-full h-9 border-border text-foreground hover:bg-muted"
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
          <div className="bg-card rounded-lg shadow-xl max-w-sm w-full">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">More Options</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMoreOptions(null)}
                className="h-8 w-8 p-0 hover:bg-muted rounded-lg"
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
                className="w-full justify-start h-10 text-foreground hover:bg-primary/10 hover:text-primary"
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
                className="w-full justify-start h-10 text-foreground hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600"
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
