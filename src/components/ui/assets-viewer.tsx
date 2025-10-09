'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from './button'
import { LoadingSpinner } from './loading-spinner'
import { ErrorDisplay } from './error-display'
import { AssetTable } from './asset-table'
import { Asset } from '../../lib/Report'
import { useAuth } from '../../contexts/AuthContext'

import { Input } from './input'
import { 
  QrCode,
  Barcode,
  Smartphone,
  Search,
  Package,
  Download,
  Copy,
  X,
  Eye
} from 'lucide-react'
import { StatusBadge } from './status-badge'
import NextImage from 'next/image'
 

// API Base URL constant
const API_BASE_URL = 'https://digitalasset.zenapi.co.in/api'

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
  const [showNfcModal, setShowNfcModal] = useState(false)
  const [nfcData, setNfcData] = useState<Asset | null>(null)
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

      const response = await fetch(`${API_BASE_URL}/assets?limit=1000&page=1`, {
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
      ? `https://digitalasset.zenapi.co.in${asset.digitalAssets.qrCode.url}` 
      : null
  }

  const getBarcodeUrl = (asset: Asset): string | null => {
    return asset?.digitalAssets?.barcode?.url 
      ? `https://digitalasset.zenapi.co.in${asset.digitalAssets.barcode.url}` 
      : null
  }

  const getNfcUrl = (asset: Asset): string | null => {
    return asset?.digitalAssets?.nfcData?.url 
      ? `https://digitalasset.zenapi.co.in${asset.digitalAssets.nfcData.url}` 
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

  // Handle NFC data view
  const handleViewNfcData = async (asset: Asset) => {
    const url = getNfcUrl(asset)
    if (!url) return

    try {
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setNfcData(data)
        setShowNfcModal(true)
      } else {
        console.error('Failed to fetch NFC data')
      }
    } catch (error) {
      console.error('Error fetching NFC data:', error)
    }
  }

  // Handle asset view
  const handleViewAsset = (asset: Asset) => {
    if (selectedAsset && selectedAsset._id === asset._id) {
      // If clicking the same asset, close it
      setSelectedAsset(null)
    } else {
      // Open the selected asset
      setSelectedAsset(asset)
    }
  }

  // Load assets on component mount
  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])


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
    <div className={`space-y-4 ${className}`}>
      {/* Search Container */}
      <div className="bg-white shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="p-4">
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
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredAssets.length} of {assets.length} total assets
        </div>
      </div>

      {/* Assets Display - Table Only */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No assets found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filters.search || filters.assetType || filters.status || filters.priority || filters.location
                ? 'Try adjusting your filters'
                : 'No assets available'
              }
            </p>
          </div>
        </div>
      ) : (
        <AssetTable
          assets={filteredAssets}
          sortBy="createdAt"
          sortOrder="desc"
          onSort={() => {}}
          onViewDetails={handleViewAsset}
          selectedAsset={selectedAsset}
        />
      )}

      {/* Asset Details Display */}
      {selectedAsset && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-4">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedAsset.tagId}
                </h2>
                {selectedAsset.status && (
                  <StatusBadge status={selectedAsset.status} />
                )}
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close Asset Details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
            
          
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
                      
                {/* Digital Assets Table */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Digital Assets</h3>
                  
         <div className="overflow-x-auto">
           <table className="w-full border-collapse">
             <thead>
               <tr className="bg-blue-50 border-b-2 border-blue-200">
                 <th className="px-4 py-3 text-left font-bold text-sm text-blue-900">#</th>
                 <th className="px-4 py-3 text-left font-bold text-sm text-blue-900">ASSET TYPE</th>
                 <th className="px-4 py-3 text-left font-bold text-sm text-blue-900">STATUS</th>
                 <th className="px-4 py-3 text-left font-bold text-sm text-blue-900">PREVIEW</th>
                 <th className="px-4 py-3 text-center font-bold text-sm text-blue-900">ACTIONS</th>
               </tr>
             </thead>
                      <tbody>
                        {/* QR Code Row */}
                        <tr className="hover:bg-blue-50 transition-colors border-b border-gray-200">
                          <td className="px-4 py-3 text-sm font-medium text-blue-900">
                            <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full text-xs font-semibold text-blue-800 dark:text-blue-200">
                              1
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded border border-blue-200">
                                <QrCode className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-blue-900">QR Code</div>
                                <div className="text-sm text-blue-600">Scan to access asset info</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              getQrUrl(selectedAsset) 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {getQrUrl(selectedAsset) ? 'Available' : 'Not Generated'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              {qrImgSrc ? (
                                <div className="relative">
                                  <NextImage
                                    src={qrImgSrc}
                                    alt="QR Code"
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 object-contain border border-blue-200 rounded"
                                    onLoad={() => setQrLoading(false)}
                                    onError={handleQrError}
                                  />
                                  {qrLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded">
                                      <div className="text-xs text-gray-500">...</div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded border border-gray-200">
                                  <QrCode className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-center">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={!getQrUrl(selectedAsset)} 
                                onClick={() => getQrUrl(selectedAsset) && copyToClipboard(getQrUrl(selectedAsset)!)}
                                className="h-8 px-3 rounded-full bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
                                title="Copy QR Code URL"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={!getQrUrl(selectedAsset)} 
                                onClick={() => getQrUrl(selectedAsset) && downloadFile(getQrUrl(selectedAsset)!, `qr_${selectedAsset.tagId || 'asset'}.png`)}
                                className="h-8 px-3 rounded-full bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                                title="Download QR Code"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </td>
                        </tr>

                        {/* Barcode Row */}
                        <tr className="hover:bg-blue-50 transition-colors border-b border-gray-200">
                          <td className="px-4 py-3 text-sm font-medium text-blue-900">
                            <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full text-xs font-semibold text-blue-800">
                              2
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 flex items-center justify-center bg-orange-100 rounded border border-orange-200">
                                <Barcode className="w-5 h-4 text-orange-600" />
                              </div>
                              <div>
                                <div className="font-medium text-blue-900">Barcode</div>
                                <div className="text-sm text-blue-600">Machine-readable code</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              getBarcodeUrl(selectedAsset) 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {getBarcodeUrl(selectedAsset) ? 'Available' : 'Not Generated'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              {barcodeImgSrc ? (
                                <div className="relative">
                                  <NextImage
                                    src={barcodeImgSrc}
                                    alt="Barcode"
                                    width={72}
                                    height={24}
                                    className="w-18 h-6 object-contain border border-orange-200 rounded"
                                    onLoad={() => setBarcodeLoading(false)}
                                    onError={handleBarcodeError}
                                  />
                                  {barcodeLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded">
                                      <div className="text-xs text-gray-500">...</div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="w-18 h-6 flex items-center justify-center bg-gray-100 rounded border border-gray-200">
                                  <Barcode className="w-6 h-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-center">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  const url = getBarcodeUrl(selectedAsset)
                                  if (url) {
                                    copyToClipboard(url)
                                  }
                                }}
                                className="h-8 px-3 rounded-full bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                                title="Copy Barcode URL"
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
                                    downloadFile(url, `barcode_${selectedAsset.tagId || 'asset'}.png`)
                                  }
                                }}
                                className="h-8 px-3 rounded-full bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                                title="Download Barcode"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </td>
                        </tr>

                        {/* NFC Data Row */}
                        <tr className="hover:bg-blue-50 transition-colors border-b border-gray-200">
                          <td className="px-4 py-3 text-sm font-medium text-blue-900">
                            <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full text-xs font-semibold text-blue-800">
                              3
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 flex items-center justify-center bg-purple-100 rounded border border-purple-200">
                                <Smartphone className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <div className="font-medium text-blue-900">NFC Data</div>
                                <div className="text-sm text-blue-600">Tap to read asset info</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              getNfcUrl(selectedAsset) 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {getNfcUrl(selectedAsset) ? 'Available' : 'Not Generated'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <div className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded border border-purple-200">
                                <Smartphone className="w-6 h-6 text-purple-600" />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-center">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  const url = getNfcUrl(selectedAsset)
                                  if (url) {
                                    copyToClipboard(url)
                                  }
                                }}
                                className="h-8 px-3 rounded-full bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200"
                                title="Copy NFC URL"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewNfcData(selectedAsset)}
                                className="h-8 px-3 rounded-full bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
                                title="View NFC Data"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>


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
      )}

      {/* NFC Data Viewer Modal */}
      {showNfcModal && nfcData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  NFC Data - {nfcData.digitalAssets?.nfcData?.data?.id || 'Asset'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowNfcModal(false)
                  setNfcData(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close NFC Data Viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-4">
              <div className="space-y-4">
                {/* Basic Asset Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-500 font-medium">Asset ID:</span>
                      <span className="ml-2 font-semibold text-blue-600">{nfcData.digitalAssets?.nfcData?.data?.id || 'N/A'}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500 font-medium">Type:</span>
                      <span className="ml-2">{nfcData.digitalAssets?.nfcData?.data?.type || 'N/A'}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500 font-medium">Asset Type:</span>
                      <span className="ml-2">{nfcData.digitalAssets?.nfcData?.data?.assetType || 'N/A'}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500 font-medium">Subcategory:</span>
                      <span className="ml-2">{nfcData.digitalAssets?.nfcData?.data?.subcategory || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-500 font-medium">Brand:</span>
                      <span className="ml-2">{nfcData.digitalAssets?.nfcData?.data?.brand || 'N/A'}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500 font-medium">Model:</span>
                      <span className="ml-2">{nfcData.digitalAssets?.nfcData?.data?.model || 'N/A'}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500 font-medium">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        nfcData.digitalAssets?.nfcData?.data?.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {nfcData.digitalAssets?.nfcData?.data?.status || 'N/A'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500 font-medium">Priority:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        nfcData.digitalAssets?.nfcData?.data?.priority === 'high' 
                          ? 'bg-red-100 text-red-800'
                          : nfcData.digitalAssets?.nfcData?.data?.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {nfcData.digitalAssets?.nfcData?.data?.priority || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location Info */}
                {nfcData.digitalAssets?.nfcData?.data?.location && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Location Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-gray-500 font-medium">Building:</span>
                          <span className="ml-2">{nfcData.digitalAssets?.nfcData?.data?.location?.building || 'N/A'}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500 font-medium">Floor:</span>
                          <span className="ml-2">{nfcData.digitalAssets?.nfcData?.data?.location?.floor || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-gray-500 font-medium">Room:</span>
                          <span className="ml-2">{nfcData.digitalAssets?.nfcData?.data?.location?.room || 'N/A'}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500 font-medium">Coordinates:</span>
                          <span className="ml-2 text-xs">
                            {nfcData.digitalAssets?.nfcData?.data?.location?.latitude !== "0" && nfcData.digitalAssets?.nfcData?.data?.location?.longitude !== "0"
                              ? `${nfcData.digitalAssets?.nfcData?.data?.location?.latitude}, ${nfcData.digitalAssets?.nfcData?.data?.location?.longitude}`
                              : 'Not specified'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assignment Info */}
                {nfcData.assignedTo && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Assignment</h3>
                    <div className="text-sm">
                      <span className="text-gray-500 font-medium">Assigned To:</span>
                      <span className="ml-2 font-semibold text-green-600">{nfcData.assignedTo?.name}</span>
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="border-t pt-4">
                  <div className="text-sm">
                    <span className="text-gray-500 font-medium">Last Updated:</span>
                    <span className="ml-2">
                      {nfcData.digitalAssets?.nfcData?.data?.timestamp ? new Date(nfcData.digitalAssets.nfcData.data.timestamp).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Raw Data Toggle */}
                <div className="border-t pt-4">
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      <span className="group-open:hidden">Show Raw Data</span>
                      <span className="hidden group-open:inline">Hide Raw Data</span>
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <pre className="text-xs text-gray-600 overflow-x-auto">
                        {JSON.stringify(nfcData, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 