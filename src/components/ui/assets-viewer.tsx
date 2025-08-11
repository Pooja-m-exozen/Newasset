'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Badge } from './badge'
import { Separator } from './separator'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog'
import { useDigitalAssets } from '@/contexts/DigitalAssetsContext'
import { generateAllDigitalAssets, type BulkDigitalAssetsGenerationResponse } from '@/lib/DigitalAssets'
import { cn } from '@/lib/utils'
import { Search, Building, MapPin, User, Calendar, Hash, AlertCircle, Package, Eye, EyeOff, QrCode, Barcode, Wifi, X, Download, Share2, Copy, Scan } from 'lucide-react'

// API Base URL constant
const API_BASE_URL = 'http://192.168.0.5:5021'

interface Asset {
  _id: string;
  tagId: string;
  assetType: string;
  subcategory?: string;
  brand: string;
  model?: string;
  serialNumber?: string;
  capacity?: string;
  status?: string;
  priority?: string;
  digitalTagType?: string;
  projectName?: string;
  yearOfInstallation?: string;
  notes?: string;
  location: {
    latitude: string;
    longitude: string;
    building?: string;
    floor?: string;
    room?: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface AssetsViewerProps {
  className?: string;
}

export function AssetsViewer({ className }: AssetsViewerProps) {
  const { 
    assets, 
    selectedAsset, 
    loading, 
    error, 
    fetchAssets, 
    fetchAssetByTagId, 
    searchAssets, 
    clearSelectedAsset,
    clearError,
    setSelectedAsset
  } = useDigitalAssets()

  const [searchTagId, setSearchTagId] = useState('')
  const [showAssetDetails, setShowAssetDetails] = useState(false)
  const [showDigitalAssetsModal, setShowDigitalAssetsModal] = useState(false)
  const [selectedAssetForDigitalAssets, setSelectedAssetForDigitalAssets] = useState<Asset | null>(null)
  const [digitalAssets, setDigitalAssets] = useState<BulkDigitalAssetsGenerationResponse | null>(null)
  const [isGeneratingDigitalAssets, setIsGeneratingDigitalAssets] = useState(false)
  const [digitalAssetsError, setDigitalAssetsError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'qr' | 'barcode' | 'nfc' | 'scanner'>('qr')
  const [scannedData, setScannedData] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)

  // Load assets on component mount
  const loadAssets = useCallback(() => {
    fetchAssets()
  }, [fetchAssets])

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  const handleSearchByTagId = async () => {
    if (!searchTagId.trim()) {
      await fetchAssets()
      return
    }

    try {
      // First try to get the specific asset
      await fetchAssetByTagId(searchTagId.trim())
      setShowAssetDetails(true)
    } catch {
      // If specific asset not found, search for similar assets
      await searchAssets(searchTagId.trim())
      setShowAssetDetails(false)
    }
  }

  const handleClearSearch = () => {
    setSearchTagId('')
    clearSelectedAsset()
    setShowAssetDetails(false)
    fetchAssets()
  }

  const handleViewDigitalAssets = async (asset: Asset) => {
    setSelectedAssetForDigitalAssets(asset)
    setShowDigitalAssetsModal(true)
    setDigitalAssets(null)
    setDigitalAssetsError(null)
  }

  const handleGenerateDigitalAssets = async () => {
    if (!selectedAssetForDigitalAssets) return

    setIsGeneratingDigitalAssets(true)
    setDigitalAssetsError(null)

    try {
      const result = await generateAllDigitalAssets(selectedAssetForDigitalAssets._id, {
        qrSize: 300,
        barcodeFormat: 'code128'
      })
      setDigitalAssets(result)
    } catch (err) {
      setDigitalAssetsError(err instanceof Error ? err.message : 'Failed to generate digital assets')
    } finally {
      setIsGeneratingDigitalAssets(false)
    }
  }

  const handleScan = () => {
    setIsScanning(true)
    // Simulate scanning - in real implementation, this would use camera API
    setTimeout(() => {
      setScannedData('Scanned QR Code Data: ASSET123')
      setIsScanning(false)
    }, 2000)
  }

  const handleDownload = (type: 'qr' | 'barcode' | 'nfc' | 'scanner') => {
    if (!digitalAssets) return
    
    const link = document.createElement('a')
    let url = ''
    let filename = ''
    
    switch (type) {
      case 'qr':
        url = `${API_BASE_URL}${digitalAssets.digitalAssets.qrCode.url}`
        filename = `qr-${digitalAssets.digitalAssets.qrCode.data.tagId}.png`
        break
      case 'barcode':
        url = `${API_BASE_URL}${digitalAssets.digitalAssets.barcode.url}`
        filename = `barcode-${digitalAssets.digitalAssets.barcode.data}.png`
        break
      case 'nfc':
        // For NFC, we'll create a text file with the data
        const nfcData = JSON.stringify(digitalAssets.digitalAssets.nfcData.data, null, 2)
        const blob = new Blob([nfcData], { type: 'application/json' })
        url = URL.createObjectURL(blob)
        filename = `nfc-${digitalAssets.digitalAssets.nfcData.data.id}.json`
        break
      case 'scanner':
        // For scanner, we'll create a text file with scanned data
        const scannedDataBlob = new Blob([scannedData || 'No scanned data available'], { type: 'text/plain' })
        url = URL.createObjectURL(scannedDataBlob)
        filename = `scanned-data-${selectedAssetForDigitalAssets?.tagId || 'unknown'}.txt`
        break
    }
    
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'maintenance':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            Search Assets
          </CardTitle>
          <CardDescription>
            Search assets by tag ID or view all assets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="searchTagId">Tag ID</Label>
              <Input
                id="searchTagId"
                placeholder="Enter Tag ID (e.g., ASSET555)"
                value={searchTagId}
                onChange={(e) => setSearchTagId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchByTagId()}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button 
                onClick={handleSearchByTagId}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
              <Button 
                onClick={handleClearSearch}
                variant="outline"
                disabled={loading}
              >
                Clear
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <Button 
                onClick={clearError}
                variant="ghost"
                size="sm"
                className="mt-2"
              >
                Dismiss
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Asset Details */}
      {selectedAsset && showAssetDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Asset Details
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{selectedAsset.tagId}</Badge>
                <Button
                  onClick={() => setShowAssetDetails(false)}
                  variant="ghost"
                  size="sm"
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Detailed information for asset {selectedAsset.tagId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <Hash className="h-4 w-4" />
                  Basic Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <Badge variant="outline">{selectedAsset.assetType}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Subcategory:</span>
                    <span>{selectedAsset.subcategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Brand:</span>
                    <span>{selectedAsset.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Model:</span>
                    <span>{selectedAsset.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Serial Number:</span>
                    <span>{selectedAsset.serialNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Capacity:</span>
                    <span>{selectedAsset.capacity}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  Status & Priority
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge variant={getStatusBadgeVariant(selectedAsset.status)}>
                      {selectedAsset.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Priority:</span>
                    <Badge variant={getPriorityBadgeVariant(selectedAsset.priority)}>
                      {selectedAsset.priority}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Digital Tag Type:</span>
                    <Badge variant="outline">{selectedAsset.digitalTagType}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Project:</span>
                    <span>{selectedAsset.projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Year of Installation:</span>
                    <span>{selectedAsset.yearOfInstallation}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location Information */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                Location Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Building:</span>
                  <span>{selectedAsset.location.building}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Floor:</span>
                  <span>{selectedAsset.location.floor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Room:</span>
                  <span>{selectedAsset.location.room}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Coordinates:</span>
                  <span className="text-xs">
                    {selectedAsset.location.latitude}, {selectedAsset.location.longitude}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  Created By
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{selectedAsset.createdBy.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span className="text-xs">{selectedAsset.createdBy.email}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  Timestamps
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Created:</span>
                    <span>{formatDate(selectedAsset.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Updated:</span>
                    <span>{formatDate(selectedAsset.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedAsset.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedAsset.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assets List */}
      {!showAssetDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Assets List
              <Badge variant="secondary">{assets.length} assets</Badge>
            </CardTitle>
            <CardDescription>
              {searchTagId ? `Search results for "${searchTagId}"` : 'All available assets'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  <span className="text-sm text-muted-foreground">Loading assets...</span>
                </div>
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No assets found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assets.map((asset) => (
                  <div
                    key={asset._id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedAsset(asset)
                      setShowAssetDetails(true)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{asset.tagId}</Badge>
                          <Badge variant={getStatusBadgeVariant(asset.status)}>
                            {asset.status}
                          </Badge>
                          <Badge variant={getPriorityBadgeVariant(asset.priority)}>
                            {asset.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleViewDigitalAssets(asset)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Building className="h-3 w-3" />
                        <span>{asset.location.building}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Hash className="h-3 w-3" />
                        <span>{asset.assetType}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{asset.createdBy.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Digital Assets Modal */}
      <Dialog open={showDigitalAssetsModal} onOpenChange={setShowDigitalAssetsModal}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <QrCode className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    Digital Assets for {selectedAssetForDigitalAssets?.tagId}
                  </DialogTitle>
                  <DialogDescription className="text-blue-100">
                    View, generate, and manage QR codes, barcodes, and NFC data
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDigitalAssetsModal(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex h-[calc(95vh-120px)]">
            {/* Sidebar */}
            <div className="w-80 border-r border-gray-200 bg-gray-50 p-6 space-y-4">
              {/* Generate Button */}
              {!digitalAssets && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Generate Digital Assets</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Create QR code, barcode, and NFC data for this asset
                    </p>
                    <Button 
                      onClick={handleGenerateDigitalAssets}
                      disabled={isGeneratingDigitalAssets}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isGeneratingDigitalAssets ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Generating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Package className="h-5 w-5" />
                          <span>Generate Assets</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {digitalAssetsError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-600">{digitalAssetsError}</p>
                  </div>
                </div>
              )}

              {digitalAssets && (
                <div className="space-y-4">
                  {/* Navigation Tabs */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 mb-3">Digital Assets</h4>
                    <button
                      onClick={() => setActiveTab('qr')}
                      className={cn(
                        "w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all",
                        activeTab === 'qr' 
                          ? "bg-blue-100 text-blue-900 border border-blue-200" 
                          : "hover:bg-gray-100 text-gray-700"
                      )}
                    >
                      <div className="p-2 rounded-md bg-green-100">
                        <QrCode className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">QR Code</p>
                        <p className="text-xs text-gray-500">Quick response code</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('barcode')}
                      className={cn(
                        "w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all",
                        activeTab === 'barcode' 
                          ? "bg-blue-100 text-blue-900 border border-blue-200" 
                          : "hover:bg-gray-100 text-gray-700"
                      )}
                    >
                      <div className="p-2 rounded-md bg-orange-100">
                        <Barcode className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">Barcode</p>
                        <p className="text-xs text-gray-500">Linear code format</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('nfc')}
                      className={cn(
                        "w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all",
                        activeTab === 'nfc' 
                          ? "bg-blue-100 text-blue-900 border border-blue-200" 
                          : "hover:bg-gray-100 text-gray-700"
                      )}
                    >
                      <div className="p-2 rounded-md bg-purple-100">
                        <Wifi className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">NFC Data</p>
                        <p className="text-xs text-gray-500">Contactless data</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('scanner')}
                      className={cn(
                        "w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all",
                        activeTab === 'scanner' 
                          ? "bg-blue-100 text-blue-900 border border-blue-200" 
                          : "hover:bg-gray-100 text-gray-700"
                      )}
                    >
                      <div className="p-2 rounded-md bg-yellow-100">
                        <Scan className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">Scanner</p>
                        <p className="text-xs text-gray-500">Scan QR codes</p>
                      </div>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Actions</h4>
                                         <Button
                       onClick={() => handleDownload(activeTab)}
                       variant="outline"
                       size="sm"
                       className="w-full"
                     >
                       <Download className="h-4 w-4 mr-2" />
                       Download {activeTab === 'qr' ? 'QR Code' : activeTab === 'barcode' ? 'Barcode' : activeTab === 'nfc' ? 'NFC Data' : 'Scanned Data'}
                     </Button>
                    <Button
                      onClick={() => handleCopyToClipboard('Asset data copied')}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Data
                    </Button>
                    <Button
                      onClick={() => {/* Share functionality */}}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {!digitalAssets ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <QrCode className="h-12 w-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Generate</h3>
                    <p className="text-gray-600 mb-6">
                      Click the generate button in the sidebar to create digital assets for this asset.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* QR Code Tab */}
                  {activeTab === 'qr' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">QR Code</h2>
                          <p className="text-gray-600">Scan this QR code to access asset information</p>
                        </div>
                        <Badge variant="secondary" className="text-sm">
                          {digitalAssets.digitalAssets.qrCode.data.tagId}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-center">
                        <div className="relative bg-white rounded-2xl shadow-2xl p-8 border-8 border-white">
                          <div className="w-64 h-64 bg-white rounded-xl overflow-hidden">
                            <Image
                              src={`${API_BASE_URL}${digitalAssets.digitalAssets.qrCode.url}`}
                              alt={`QR Code for ${digitalAssets.digitalAssets.qrCode.data.tagId}`}
                              width={256}
                              height={256}
                              className="w-full h-full object-contain p-4"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-0 shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-lg">Asset Information</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Type:</span>
                              <span className="font-medium">{digitalAssets.digitalAssets.qrCode.data.assetType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Brand:</span>
                              <span className="font-medium">{digitalAssets.digitalAssets.qrCode.data.brand}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Model:</span>
                              <span className="font-medium">{digitalAssets.digitalAssets.qrCode.data.model}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <Badge variant={digitalAssets.digitalAssets.qrCode.data.status === 'active' ? 'default' : 'secondary'}>
                                {digitalAssets.digitalAssets.qrCode.data.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-lg">Location Details</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Building:</span>
                              <span className="font-medium">{digitalAssets.digitalAssets.qrCode.data.location.building}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Floor:</span>
                              <span className="font-medium">{digitalAssets.digitalAssets.qrCode.data.location.floor}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Room:</span>
                              <span className="font-medium">{digitalAssets.digitalAssets.qrCode.data.location.room}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Project:</span>
                              <span className="font-medium">{digitalAssets.digitalAssets.qrCode.data.projectName}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Barcode Tab */}
                  {activeTab === 'barcode' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Barcode</h2>
                          <p className="text-gray-600">Industrial barcode for asset tracking</p>
                        </div>
                        <Badge variant="secondary" className="text-sm">
                          {digitalAssets.digitalAssets.barcode.data}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-center">
                        <div className="relative bg-white rounded-2xl shadow-2xl p-8 border-8 border-white">
                          <div className="w-80 h-40 bg-white rounded-xl overflow-hidden">
                            <Image
                              src={`${API_BASE_URL}${digitalAssets.digitalAssets.barcode.url}`}
                              alt={`Barcode for ${digitalAssets.digitalAssets.barcode.data}`}
                              width={320}
                              height={160}
                              className="w-full h-full object-contain p-4"
                            />
                          </div>
                        </div>
                      </div>

                      <Card className="border-0 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg">Barcode Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Format:</span>
                            <span className="font-medium">Code 128</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Data:</span>
                            <span className="font-medium font-mono">{digitalAssets.digitalAssets.barcode.data}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Asset ID:</span>
                            <span className="font-medium">{digitalAssets.digitalAssets.qrCode.data.tagId}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* NFC Tab */}
                  {activeTab === 'nfc' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">NFC Data</h2>
                          <p className="text-gray-600">Contactless asset identification</p>
                        </div>
                        <Badge variant="secondary" className="text-sm">
                          {digitalAssets.digitalAssets.nfcData.data.id}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-center">
                        <div className="relative bg-white rounded-2xl shadow-2xl p-8 border-8 border-white">
                          <div className="w-80 h-48 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-4 border-purple-200 p-6">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Wifi className="h-8 w-8 text-white" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">NFC Data Ready</h3>
                              <p className="text-sm text-gray-600 mb-4">Tap to read asset information</p>
                              <div className="space-y-2 text-sm text-gray-700">
                                <div className="flex justify-between">
                                  <span className="font-medium">Asset ID:</span>
                                  <span className="font-mono">{digitalAssets.digitalAssets.nfcData.data.id}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">Type:</span>
                                  <span>{digitalAssets.digitalAssets.nfcData.data.type}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">Format:</span>
                                  <span>NFC-A</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-0 shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-lg">NFC Information</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Type:</span>
                              <span className="font-medium">{digitalAssets.digitalAssets.nfcData.data.type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Brand:</span>
                              <span className="font-medium">{digitalAssets.digitalAssets.nfcData.data.brand}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Model:</span>
                              <span className="font-medium">{digitalAssets.digitalAssets.nfcData.data.model}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <Badge variant={digitalAssets.digitalAssets.nfcData.data.status === 'active' ? 'default' : 'secondary'}>
                                {digitalAssets.digitalAssets.nfcData.data.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-lg">Technical Details</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Timestamp:</span>
                              <span className="font-medium text-sm">
                                {new Date(digitalAssets.digitalAssets.nfcData.data.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Checksum:</span>
                              <span className="font-medium font-mono text-sm">
                                {digitalAssets.digitalAssets.nfcData.data.checksum.substring(0, 8)}...
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Assigned To:</span>
                              <span className="font-medium">{digitalAssets.digitalAssets.nfcData.data.assignedTo}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Project:</span>
                              <span className="font-medium">{digitalAssets.digitalAssets.nfcData.data.projectName}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Scanner Tab */}
                  {activeTab === 'scanner' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">QR Code Scanner</h2>
                          <p className="text-gray-600">Scan QR codes to access asset information</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-center">
                        <div className="relative bg-white rounded-2xl shadow-2xl p-8 border-8 border-white">
                          <div className="w-80 h-80 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-4 border-gray-200 flex items-center justify-center">
                            {isScanning ? (
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Scanning...</p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Scan className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 mb-4">Camera scanner</p>
                                <Button onClick={handleScan} className="bg-blue-600 hover:bg-blue-700">
                                  <Scan className="h-4 w-4 mr-2" />
                                  Start Scanning
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {scannedData && (
                        <Card className="border-0 shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-lg">Scanned Data</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <p className="font-mono text-sm">{scannedData}</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 