'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'
import { LoadingSpinner } from './loading-spinner'
import { ErrorDisplay } from './error-display'
import { AssetTable } from './asset-table'

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
  Copy
} from 'lucide-react'

// API Base URL constant
const API_BASE_URL = 'http://192.168.0.5:5021/api'

// Use any type to accept whatever response comes from the API
type Asset = any
type AssetsResponse = any

interface AssetsViewerProps {
  className?: string
}

export const AssetsViewer: React.FC<AssetsViewerProps> = ({ className = '' }) => {
  const [assets, setAssets] = useState<Asset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [nfcViewData, setNfcViewData] = useState<any | null>(null)
  const [nfcLoading, setNfcLoading] = useState(false)
  const [nfcError, setNfcError] = useState<string | null>(null)
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

  // Fetch assets from API
  const fetchAssets = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const token = localStorage.getItem('authToken')
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
        throw new Error(`Failed to fetch assets: ${response.status}`)
      }

      const data: AssetsResponse = await response.json()
      
      // Just set whatever response comes from the API
      if (data.success && data.assets) {
        setAssets(data.assets)
        setFilteredAssets(data.assets)
      } else if (data.assets) {
        // If no success flag but assets exist, use them anyway
        setAssets(data.assets)
        setFilteredAssets(data.assets)
      } else if (Array.isArray(data)) {
        // If response is directly an array
        setAssets(data)
        setFilteredAssets(data)
      } else {
        // If response has different structure, try to extract assets
        const possibleAssets = data.data || data.items || data.results || []
        if (Array.isArray(possibleAssets)) {
          setAssets(possibleAssets)
          setFilteredAssets(possibleAssets)
        } else {
          // Just set the entire response as assets
          setAssets([data])
          setFilteredAssets([data])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching assets')
      console.error('Error fetching assets:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Helper to extract safely stored digital asset URLs for display
  const getQrUrl = (asset: Asset): string | null => asset?.digitalAssets?.qrCode?.url ? `http://192.168.0.5:5021${asset.digitalAssets.qrCode.url}` : null
  const getBarcodeUrl = (asset: Asset): string | null => asset?.digitalAssets?.barcode?.url ? `http://192.168.0.5:5021${asset.digitalAssets.barcode.url}` : null
  const getNfcUrl = (asset: Asset): string | null => asset?.digitalAssets?.nfcData?.url ? `http://192.168.0.5:5021${asset.digitalAssets.nfcData.url}` : null

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (e) {
      console.warn('Copy failed:', e)
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

  // Load NFC JSON (pretty view) when modal opens
  useEffect(() => {
    const url = selectedAsset ? getNfcUrl(selectedAsset) : null
    if (!isViewModalOpen || !url) {
      setNfcViewData(null)
      setNfcLoading(false)
      setNfcError(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        setNfcLoading(true)
        setNfcError(null)
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled) {
          // Some files may wrap data under "data"
          setNfcViewData(json?.data ?? json)
        }
      } catch (e) {
        if (!cancelled) setNfcError('Failed to load NFC data')
      } finally {
        if (!cancelled) setNfcLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isViewModalOpen, selectedAsset])

  // Prepare QR/Barcode images when modal opens
  useEffect(() => {
    if (!selectedAsset) {
      setQrImgSrc(null)
      setBarcodeImgSrc(null)
      setQrLoading(false)
      setBarcodeLoading(false)
      return
    }
    const qrUrl = getQrUrl(selectedAsset)
    const barcodeUrl = getBarcodeUrl(selectedAsset)
    if (qrUrl) {
      setQrLoading(true)
      setQrImgSrc(qrUrl)
    }
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

  // Apply filters - handle any property structure
  useEffect(() => {
    let filtered = [...assets]
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(asset => {
        // Try to search in common properties, handle undefined safely
        const tagId = asset?.tagId || asset?.id || asset?.tag || ''
        const assetType = asset?.assetType || asset?.type || ''
        const brand = asset?.brand || ''
        const model = asset?.model || ''
        const assignedTo = asset?.assignedTo?.name || asset?.assignedTo || ''
        const location = asset?.location?.building || asset?.location || asset?.building || ''
        
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
        (asset?.assetType || asset?.type) === filters.assetType
      )
    }
    
    if (filters.status) {
      filtered = filtered.filter(asset => 
        (asset?.status || asset?.state) === filters.status
      )
    }
    
    if (filters.priority) {
      filtered = filtered.filter(asset => 
        (asset?.priority || asset?.importance) === filters.priority
      )
    }
    
    if (filters.location) {
      filtered = filtered.filter(asset => {
        const building = asset?.location?.building || asset?.location || asset?.building || ''
        const floor = asset?.location?.floor || ''
        const room = asset?.location?.room || ''
        
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

  // Handle asset edit
  const handleEditAsset = (asset: Asset) => {
    // TODO: Implement edit functionality
    console.log('Edit asset:', asset)
  }

  // Handle asset delete
  const handleDeleteAsset = (assetId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete asset:', assetId)
  }

  // Handle QR generation
  const handleGenerateQR = (asset: Asset) => {
    // TODO: Implement QR generation
    console.log('Generate QR for asset:', asset)
  }

  // Load assets on component mount
  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  // Get unique values for filter options - handle any property structure
  const assetTypes = [...new Set(assets.map(asset => asset?.assetType || asset?.type || '').filter(Boolean))]
  const statuses = [...new Set(assets.map(asset => asset?.status || asset?.state || '').filter(Boolean))]
  const priorities = [...new Set(assets.map(asset => asset?.priority || asset?.importance || '').filter(Boolean))]
  const locations = [...new Set(assets.map(asset => 
    asset?.location?.building || asset?.location || asset?.building || ''
  ).filter(Boolean))]

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assets</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and view all your digital assets
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

      {/* Removed generator cards for a focused viewer */}
      {/*
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <QrCode className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">QR Code Generator</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Generate QR codes for assets</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                // TODO: Open QR code generator modal
                console.log('Open QR Code Generator')
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Generate QR Code
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-500 rounded-lg">
                <Barcode className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Barcode Generator</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Generate barcodes for assets</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                // TODO: Open barcode generator modal
                console.log('Open Barcode Generator')
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Generate Barcode
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">NFC Generator</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Generate NFC data for assets</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                // TODO: Open NFC generator modal
                console.log('Open NFC Generator')
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Generate NFC
            </Button>
          </CardContent>
        </Card>
      </div>
      */}

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
                      <SelectItem key={status || ''} value={status || ''}>{status || ''}</SelectItem>
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
                      <SelectItem key={priority || ''} value={priority || ''}>{priority || ''}</SelectItem>
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
                : 'No assets have been created yet'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <AssetTable
          assets={filteredAssets.map(a => ({
            ...a,
            previewImages: {
              qr: getQrUrl(a),
              barcode: getBarcodeUrl(a)
            },
            nfcUrl: getNfcUrl(a)
          }))}
          sortBy="createdAt"
          sortOrder="desc"
          onSort={() => {}}
          onViewDetails={handleViewAsset}
        />
      )}

      {/* Simple Asset View Modal */}
      {isViewModalOpen && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Asset Details - {selectedAsset?.tagId || selectedAsset?.id || 'Asset'}
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false)
                  setSelectedAsset(null)
                }}
              >
                Close
              </Button>
            </div>
            
            <div className="space-y-5">
              {/* Simple key info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-xs text-gray-600 dark:text-gray-300">Tag ID</div>
                  <div className="text-sm font-semibold">{selectedAsset?.tagId || selectedAsset?.id || 'N/A'}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-xs text-gray-600 dark:text-gray-300">Type</div>
                  <div className="text-sm font-semibold">{selectedAsset?.assetType || selectedAsset?.type || 'N/A'}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-xs text-gray-600 dark:text-gray-300">Brand</div>
                  <div className="text-sm font-semibold">{selectedAsset?.brand || 'N/A'}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-xs text-gray-600 dark:text-gray-300">Model</div>
                  <div className="text-sm font-semibold">{selectedAsset?.model || 'N/A'}</div>
                </div>
              </div>

              {/* Three cards: QR, Barcode, NFC */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* QR */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded bg-blue-100 text-blue-700"><QrCode className="w-4 h-4" /></div>
                      <div className="text-sm font-semibold">QR Code</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled={!getQrUrl(selectedAsset)} onClick={() => getQrUrl(selectedAsset) && window.open(getQrUrl(selectedAsset)!, '_blank')}><span>Open</span></Button>
                      <Button variant="outline" size="sm" disabled={!getQrUrl(selectedAsset)} onClick={() => getQrUrl(selectedAsset) && copyToClipboard(getQrUrl(selectedAsset)!)}><Copy className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" disabled={!getQrUrl(selectedAsset)} onClick={() => getQrUrl(selectedAsset) && downloadFile(getQrUrl(selectedAsset)!, `qr_${selectedAsset?.tagId || 'asset'}.png`)}><Download className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="relative flex items-center justify-center min-h-[180px] bg-gray-50 dark:bg-gray-700 rounded">
                    {qrImgSrc ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrImgSrc}
                          alt="QR"
                          className="w-40 h-40 object-contain"
                          onLoad={() => setQrLoading(false)}
                          onError={handleQrError}
                        />
                        {qrLoading && (
                          <div className="absolute text-xs text-gray-500">Loading...</div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-gray-500">No QR available</div>
                    )}
                  </div>
                </div>

                {/* Barcode */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded bg-green-100 text-green-700"><Barcode className="w-4 h-4" /></div>
                      <div className="text-sm font-semibold">Barcode</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled={!getBarcodeUrl(selectedAsset)} onClick={() => getBarcodeUrl(selectedAsset) && window.open(getBarcodeUrl(selectedAsset)!, '_blank')}><span>Open</span></Button>
                      <Button variant="outline" size="sm" disabled={!getBarcodeUrl(selectedAsset)} onClick={() => getBarcodeUrl(selectedAsset) && copyToClipboard(getBarcodeUrl(selectedAsset)!)}><Copy className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" disabled={!getBarcodeUrl(selectedAsset)} onClick={() => getBarcodeUrl(selectedAsset) && downloadFile(getBarcodeUrl(selectedAsset)!, `barcode_${selectedAsset?.tagId || 'asset'}.png`)}><Download className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="relative flex items-center justify-center min-h-[180px] bg-gray-50 dark:bg-gray-700 rounded">
                    {barcodeImgSrc ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={barcodeImgSrc}
                          alt="Barcode"
                          className="w-56 h-24 object-contain"
                          onLoad={() => setBarcodeLoading(false)}
                          onError={handleBarcodeError}
                        />
                        {barcodeLoading && (
                          <div className="absolute text-xs text-gray-500">Loading...</div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-gray-500">No Barcode available</div>
                    )}
                  </div>
                </div>

                {/* NFC */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded bg-purple-100 text-purple-700"><Smartphone className="w-4 h-4" /></div>
                      <div className="text-sm font-semibold">NFC Data</div>
                    </div>
                    {getNfcUrl(selectedAsset) && (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.open(getNfcUrl(selectedAsset)!, '_blank')}><span>Open</span></Button>
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(getNfcUrl(selectedAsset)!)}><Copy className="w-4 h-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => downloadFile(getNfcUrl(selectedAsset)!, `nfc_${selectedAsset?.tagId || 'asset'}.json`)}><Download className="w-4 h-4" /></Button>
                      </div>
                    )}
                  </div>
                  <div className="text-xs p-3 bg-gray-50 dark:bg-gray-700 rounded min-h-[180px]">
                    {!getNfcUrl(selectedAsset) && <div className="text-gray-500">No NFC data</div>}
                    {getNfcUrl(selectedAsset) && (
                      nfcLoading ? (
                        <div className="text-gray-500">Loading NFC data...</div>
                      ) : nfcError ? (
                        <div className="text-red-600">{nfcError}</div>
                      ) : nfcViewData ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-[10px] text-gray-500">Type</div>
                              <div className="text-xs font-semibold">{nfcViewData.type}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500">ID</div>
                              <div className="text-xs font-mono">{nfcViewData.id}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500">Asset Type</div>
                              <div className="text-xs font-semibold">{nfcViewData.assetType}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500">Brand</div>
                              <div className="text-xs">{nfcViewData.brand}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500">Model</div>
                              <div className="text-xs">{nfcViewData.model}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500">Priority</div>
                              <div className="text-xs">{nfcViewData.priority}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <div className="text-[10px] text-gray-500">Building</div>
                              <div className="text-xs">{nfcViewData.location?.building}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500">Floor</div>
                              <div className="text-xs">{nfcViewData.location?.floor}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500">Room</div>
                              <div className="text-xs">{nfcViewData.location?.room}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-[10px] text-gray-500">Timestamp</div>
                              <div className="text-xs">{nfcViewData.timestamp ? new Date(nfcViewData.timestamp).toLocaleString() : ''}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500">Checksum</div>
                              <div className="text-[10px] font-mono">{nfcViewData.checksum}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500">NFC data not available</div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Raw Data Toggle */}
            <div className="mt-6 pt-4 border-t">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Show Raw JSON Data
                </summary>
                <div className="mt-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <pre className="text-xs overflow-x-auto text-gray-700 dark:text-gray-300">
                    {JSON.stringify(selectedAsset, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 