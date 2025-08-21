'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from './card'
import { Button } from './button'
import { LoadingSpinner } from './loading-spinner'
import { ErrorDisplay } from './error-display'
import { AssetTable } from './asset-table'
import { Asset } from '../../lib/Report'
import { useAuth } from '../../contexts/AuthContext'

import { ExportButtons } from './export-buttons'
import { Input } from './input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { 
  QrCode,
  Barcode,
  Smartphone,
  Search,
  RefreshCw,
  Package,
  Download,
  Copy,
  X
} from 'lucide-react'
import { StatusBadge } from './status-badge'
import NextImage from 'next/image'
 

// API Base URL constant
const API_BASE_URL = 'http://192.168.0.5:5021/api'

interface AssetsResponse {
  success?: boolean
  assets?: Asset[]
  data?: Asset[]
  items?: Asset[]
  results?: Asset[]
}

interface AssetsViewerProps {
  className?: string
}

export const AssetsViewer: React.FC<AssetsViewerProps> = ({ className = '' }) => {
  const { user } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [qrImgSrc, setQrImgSrc] = useState<string | null>(null)
  const [barcodeImgSrc, setBarcodeImgSrc] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [barcodeLoading, setBarcodeLoading] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    assetType: '',
    status: '',
    priority: '',
    location: ''
  })

  // Fetch assets from API and filter by user's project
  const fetchAssets = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (!user?.projectName) {
        throw new Error('User project not found. Please login again.')
      }

      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await fetch(`${API_BASE_URL}/assets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.')
        }
        throw new Error(`Failed to fetch assets: ${response.status}`)
      }

      const data: AssetsResponse = await response.json()
      
      let allAssets: Asset[] = []
      
      // Extract assets from response
      if (data.success && data.assets) {
        allAssets = data.assets
      } else if (data.assets) {
        allAssets = data.assets
      } else if (Array.isArray(data)) {
        allAssets = data
      } else {
        const possibleAssets = data.data || data.items || data.results || []
        if (Array.isArray(possibleAssets)) {
          allAssets = possibleAssets as Asset[]
        }
      }

      // Filter assets by user's project name
      const userAssets = allAssets.filter(asset => {
        // Check both the old projectName property and the new nested project structure
        const assetProjectName = asset.project?.projectName || asset.projectName
        return assetProjectName === user.projectName
      })

      if (userAssets.length === 0) {
        setError(`No assets found for project: ${user.projectName}`)
      } else {
        setAssets(userAssets)
        setFilteredAssets(userAssets)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching assets')
      console.error('Error fetching assets:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user?.projectName])

  // Helper to extract safely stored digital asset URLs for display
  const getQrUrl = (asset: Asset): string | null => {
    return asset?.digitalAssets?.qrCode?.url 
      ? `http://192.168.0.5:5021${asset.digitalAssets.qrCode.url}` 
      : null
  }

  const getBarcodeUrl = (asset: Asset): string | null => {
    return asset?.digitalAssets?.barcode?.url 
      ? `http://192.168.0.5:5021${asset.digitalAssets.barcode.url}` 
      : null
  }

  const getNfcUrl = (asset: Asset): string | null => {
    return asset?.digitalAssets?.nfcData?.url 
      ? `http://192.168.0.5:5021${asset.digitalAssets.nfcData.url}` 
      : null
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      console.warn('Copy failed')
    }
  }

  const downloadFile = async (url: string, filename: string) => {
    try {
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.warn('Download failed:', e)
      window.open(url, '_blank')
    }
  }

  // Prepare QR/Barcode images when modal opens
  useEffect(() => {
    if (!selectedAsset) {
      setQrImgSrc(null)
      setBarcodeImgSrc(null)
      setQrLoading(false)
      setBarcodeLoading(false)
      return
    }
    
    // Load QR Code
    const qrUrl = getQrUrl(selectedAsset)
    if (qrUrl) {
      setQrLoading(true)
      setQrImgSrc(qrUrl)
    }
    
    // Load Barcode
    const barcodeUrl = getBarcodeUrl(selectedAsset)
    if (barcodeUrl) {
      setBarcodeLoading(true)
      setBarcodeImgSrc(barcodeUrl)
    }
  }, [selectedAsset])

  const handleQrError = async () => {
    try {
      const url = selectedAsset ? getQrUrl(selectedAsset) : null
      if (!url) return
      const res = await fetch(url)
      if (!res.ok) throw new Error('fetch failed')
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      setQrImgSrc(objectUrl)
    } catch {
      setQrImgSrc(null)
    } finally {
      setQrLoading(false)
    }
  }

  const handleBarcodeError = async () => {
    try {
      const url = selectedAsset ? getBarcodeUrl(selectedAsset) : null
      if (!url) return
      const res = await fetch(url)
      if (!res.ok) throw new Error('fetch failed')
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      setBarcodeImgSrc(objectUrl)
    } catch {
      setBarcodeImgSrc(null)
    } finally {
      setBarcodeLoading(false)
    }
  }



  // Apply filters - handle new asset structure
  useEffect(() => {
    let filtered = [...assets]
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(asset => {
        const tagId = asset.tagId || ''
        const assetType = asset.assetType || ''
        const brand = asset.brand || ''
        const model = asset.model || ''
        const assignedTo = asset.assignedTo?.name || ''
        const location = asset.location?.building || ''
        
        return (
          tagId.toLowerCase().includes(searchLower) ||
          assetType.toLowerCase().includes(searchLower) ||
          brand.toLowerCase().includes(searchLower) ||
          model.toLowerCase().includes(searchLower) ||
          assignedTo.toLowerCase().includes(searchLower) ||
          location.toLowerCase().includes(searchLower)
        )
      })
    }
    
    if (filters.assetType) {
      filtered = filtered.filter(asset => 
        asset.assetType === filters.assetType
      )
    }
    
    if (filters.status) {
      filtered = filtered.filter(asset => 
        asset.status === filters.status
      )
    }
    
    if (filters.priority) {
      filtered = filtered.filter(asset => 
        asset.priority === filters.priority
      )
    }
    
    if (filters.location) {
      filtered = filtered.filter(asset => {
        const building = asset.location?.building || ''
        const floor = asset.location?.floor || ''
        const room = asset.location?.room || ''
        
        return (
          building.includes(filters.location) ||
          floor.includes(filters.location) ||
          room.includes(filters.location)
        )
      })
    }
    
    setFilteredAssets(filtered)
  }, [assets, filters])

  // Handle asset view
  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset)
    setIsViewModalOpen(true)
  }

  // Load assets on component mount
  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  // Get unique values for filter options
  const assetTypes = [...new Set(assets.map(asset => asset.assetType).filter(Boolean) as string[])]
  const statuses = [...new Set(assets.map(asset => asset.status).filter(Boolean) as string[])]
  const priorities = [...new Set(assets.map(asset => asset.priority).filter(Boolean) as string[])]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onClearError={() => setError(null)}
      />
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Assets</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.projectName ? `Managing assets for ${user.projectName}` : 'Loading project...'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <ExportButtons 
            onExportPDF={() => {
              // TODO: Implement PDF export
              console.log('Export PDF')
            }}
            onExportExcel={() => {
              // TODO: Implement Excel export
              console.log('Export Excel')
            }}
          />
        </div>
      </div>

      {/* Project Info Banner */}
      {user?.projectName && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Currently viewing assets for project: <span className="font-bold">{user.projectName}</span>
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col lg:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search assets, tags, locations..."
                  value={filters.search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                  }
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filters.assetType} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, assetType: value }))
                }>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Asset Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {assetTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, status: value }))
                }>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.priority} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, priority: value }))
                }>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Priorities</SelectItem>
                    {priorities.map(priority => (
                      <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setFilters({
                search: '',
                assetType: '',
                status: '',
                priority: '',
                location: ''
              })}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredAssets.length} of {assets.length} total assets
          {user?.projectName && (
            <span className="ml-2 text-blue-600 dark:text-blue-400">
              (filtered by project: {user.projectName})
            </span>
          )}
        </div>
      </div>

      {/* Assets Display - Table Only */}
      {filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No assets found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filters.search || filters.assetType || filters.status || filters.priority || filters.location
                ? 'Try adjusting your filters'
                : `No assets found for project: ${user?.projectName}`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <AssetTable
          assets={filteredAssets}
          sortBy="createdAt"
          sortOrder="desc"
          onSort={() => {}}
          onViewDetails={handleViewAsset}
        />
      )}

      {/* Simple Asset View Modal */}
      {isViewModalOpen && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Simple Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedAsset?.tagId}
                </h2>
                    {selectedAsset?.status && (
                      <StatusBadge status={selectedAsset.status} />
                    )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsViewModalOpen(false)
                  setSelectedAsset(null)
                }}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Body */}
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="p-4 space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Type:</span>
                      <span className="ml-2 font-medium">{selectedAsset?.assetType || 'N/A'}</span>
                      </div>
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Brand:</span>
                      <span className="ml-2 font-medium">{selectedAsset?.brand || 'N/A'}</span>
                      </div>
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Model:</span>
                      <span className="ml-2 font-medium">{selectedAsset?.model || 'N/A'}</span>
                      </div>
                    </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Status:</span>
                      <span className="ml-2 font-medium">{selectedAsset?.status || 'N/A'}</span>
                      </div>
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Priority:</span>
                      <span className="ml-2 font-medium">{selectedAsset?.priority || 'N/A'}</span>
                      </div>
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Assigned:</span>
                      <span className="ml-2 font-medium">{selectedAsset?.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Location</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedAsset?.location?.building || 'N/A'} • {selectedAsset?.location?.floor || 'N/A'} • {selectedAsset?.location?.room || 'N/A'}
                        </div>
                      </div>
                      
                {/* QR Code */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">QR Code</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={!getQrUrl(selectedAsset)} 
                        onClick={() => getQrUrl(selectedAsset) && copyToClipboard(getQrUrl(selectedAsset)!)}
                        className="h-7 px-2 text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={!getQrUrl(selectedAsset)} 
                        onClick={() => getQrUrl(selectedAsset) && downloadFile(getQrUrl(selectedAsset)!, `qr_${selectedAsset?.tagId || 'asset'}.png`)}
                        className="h-7 px-2 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    {qrImgSrc ? (
                      <div className="relative">
                        <NextImage
                          src={qrImgSrc}
                          alt="QR Code"
                          width={128}
                          height={128}
                          className="w-32 h-32 object-contain border border-gray-200 dark:border-gray-600 rounded-lg"
                          onLoad={() => setQrLoading(false)}
                          onError={handleQrError}
                        />
                        {qrLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded-lg">
                            <div className="text-xs text-gray-500">Loading...</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-32 h-32 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <div className="text-center">
                          <QrCode className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-500 dark:text-gray-400">No QR Code</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Barcode */}
                {selectedAsset?.digitalAssets?.barcode?.url && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Barcode</h3>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const url = getBarcodeUrl(selectedAsset)
                            if (url) {
                              copyToClipboard(url)
                            }
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const url = getBarcodeUrl(selectedAsset)
                            if (url) {
                              downloadFile(url, `barcode_${selectedAsset?.tagId || 'asset'}.png`)
                            }
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                </div>
              </div>
                    
                    <div className="flex justify-center">
                      {barcodeImgSrc ? (
                        <div className="relative">
                          <NextImage
                            src={barcodeImgSrc}
                            alt="Barcode"
                            width={192}
                            height={64}
                            className="w-48 h-16 object-contain border border-gray-200 dark:border-gray-600 rounded-lg"
                            onLoad={() => setBarcodeLoading(false)}
                            onError={handleBarcodeError}
                          />
                          {barcodeLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded-lg">
                              <div className="text-xs text-gray-500">Loading...</div>
                            </div>
                          )}
                </div>
                      ) : (
                        <div className="w-48 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                          <div className="text-center">
                            <Barcode className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">No Barcode</p>
                </div>
              </div>
                      )}
                    </div>
                    
                    {selectedAsset?.digitalAssets?.barcode?.data && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Barcode Data:</div>
                        <code className="text-xs font-mono text-gray-900 dark:text-white break-all">
                          {selectedAsset.digitalAssets.barcode.data}
                        </code>
                      </div>
                    )}
                  </div>
                )}

                {/* NFC Data */}
                {selectedAsset?.digitalAssets?.nfcData?.url && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">NFC Data</h3>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const url = getNfcUrl(selectedAsset)
                            if (url) {
                              copyToClipboard(url)
                            }
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy URL
                        </Button>
              <Button 
                          variant="outline" 
                          size="sm" 
                onClick={() => {
                            const url = getNfcUrl(selectedAsset)
                            if (url) {
                              downloadFile(url, `nfc_${selectedAsset?.tagId || 'asset'}.json`)
                            }
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download JSON
              </Button>
                      </div>
                    </div>
                    
                    {/* NFC Data Display */}
                    <div className="space-y-3">
                                             {/* NFC Status Card */}
                       <div className="flex justify-center">
                         <div className="w-full max-w-md p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg border border-purple-200 dark:border-purple-600">
                           <div className="flex items-center justify-center gap-3">
                             <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-800">
                               <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                             </div>
                             <div className="text-center">
                               <p className="text-sm font-medium text-purple-700 dark:text-purple-300">NFC Data Available</p>
                             </div>
                           </div>
                         </div>
                       </div>
                      
                       {/* NFC Data Content - Readable Format */}
                       {selectedAsset?.digitalAssets?.nfcData?.data && (
                         <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-600">
                           <div className="flex items-center justify-between mb-4">
                             <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300">Asset Information</h4>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => {
                                 const nfcData = selectedAsset.digitalAssets?.nfcData?.data
                                 if (nfcData) {
                                   copyToClipboard(JSON.stringify(nfcData, null, 2))
                                 }
                               }}
                               className="h-7 px-3 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-800"
                             >
                               <Copy className="w-3 h-3 mr-1" />
                               Copy All
                             </Button>
                           </div>
                           
                           {/* Structured Data Grid */}
                           <div className="grid grid-cols-2 gap-4">
                             {/* Left Column */}
                             <div className="space-y-3">
                               <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-600">
                                 <div className="flex items-center gap-2 mb-2">
                                   <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                   <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Basic Details</span>
                                 </div>
                                 <div className="space-y-2 text-xs">
                                   <div className="flex justify-between">
                                     <span className="text-gray-600 dark:text-gray-400">Type:</span>
                                     <span className="font-medium text-gray-900 dark:text-white capitalize">
                                       {selectedAsset.digitalAssets.nfcData.data.type || 'N/A'}
                                     </span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span className="text-gray-600 dark:text-gray-400">ID:</span>
                                     <span className="font-mono font-medium text-gray-900 dark:text-white">
                                       {selectedAsset.digitalAssets.nfcData.data.id || 'N/A'}
                                     </span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span className="text-gray-600 dark:text-gray-400">Asset Type:</span>
                                     <span className="font-medium text-gray-900 dark:text-white">
                                       {selectedAsset.digitalAssets.nfcData.data.assetType || 'N/A'}
                                     </span>
                                   </div>
                                 </div>
                               </div>
                               
                               <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-600">
                                 <div className="flex items-center gap-2 mb-2">
                                   <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                   <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Specifications</span>
                                 </div>
                                 <div className="space-y-2 text-xs">
                                   <div className="flex justify-between">
                                     <span className="text-gray-600 dark:text-gray-400">Brand:</span>
                                     <span className="font-medium text-gray-900 dark:text-white">
                                       {selectedAsset.digitalAssets.nfcData.data.brand || 'N/A'}
                                     </span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span className="text-gray-600 dark:text-gray-400">Model:</span>
                                     <span className="font-medium text-gray-900 dark:text-white">
                                       {selectedAsset.digitalAssets.nfcData.data.model || 'N/A'}
                                     </span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span className="text-gray-600 dark:text-gray-400">Subcategory:</span>
                                     <span className="font-medium text-gray-900 dark:text-white">
                                       {selectedAsset.digitalAssets.nfcData.data.subcategory || 'N/A'}
                                     </span>
                                   </div>
                                 </div>
                               </div>
                             </div>
                             
                             {/* Right Column */}
                             <div className="space-y-3">
                               <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-600">
                                 <div className="flex items-center gap-2 mb-2">
                                   <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                   <span className="text-xs font-medium text-green-700 dark:text-green-300">Status</span>
                                 </div>
                                 <div className="space-y-2 text-xs">
                                   <div className="flex justify-between">
                                     <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                       selectedAsset.digitalAssets.nfcData.data.status === 'active' 
                                         ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                         : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                     }`}>
                                       {selectedAsset.digitalAssets.nfcData.data.status || 'N/A'}
                                     </span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span className="text-gray-600 dark:text-gray-400">Priority:</span>
                                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                       selectedAsset.digitalAssets.nfcData.data.priority === 'high' 
                                         ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                         : selectedAsset.digitalAssets.nfcData.data.priority === 'medium'
                                         ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                         : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                     }`}>
                                       {selectedAsset.digitalAssets.nfcData.data.priority || 'N/A'}
                                     </span>
                                   </div>
                                 </div>
                               </div>
                               

                             </div>
                           </div>
                         </div>
                       )}
                    </div>
                  </div>
                )}

                {/* Project Info */}
                <div className="border-t pt-4">
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Project:</span>
                    <span className="ml-2 font-medium">
                      {selectedAsset?.project?.projectName || selectedAsset?.projectName || 'N/A'}
                    </span>
                  </div>
                  <div className="text-sm mt-1">
                    <span className="text-gray-500 dark:text-gray-400">Created:</span>
                    <span className="ml-2 font-medium">
                      {selectedAsset?.createdAt ? new Date(selectedAsset.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 