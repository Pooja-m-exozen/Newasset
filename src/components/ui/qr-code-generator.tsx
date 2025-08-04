'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Checkbox } from './checkbox'
import { Badge } from './badge'
import { Separator } from './separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { generateQRCode, downloadQRCode, type QRCodeGenerationResponse } from '@/lib/DigitalAssets'
import { useDigitalAssets } from '@/contexts/DigitalAssetsContext'
import { cn } from '@/lib/utils'
import { SuccessToast } from './success-toast'
import { QrCode, Download, Copy, Settings, Info, MapPin, Building, Calendar, Hash, CheckCircle, X, Search } from 'lucide-react'

// API Base URL constant
const API_BASE_URL = 'http://192.168.0.5:5021'

interface QRCodeGeneratorProps {
  assetId?: string;
  className?: string;
}

export function QRCodeGenerator({ assetId, className }: QRCodeGeneratorProps) {
  const { assets, fetchAssets, fetchAssetByTagId, getAssetIdFromTagId, loading: assetsLoading } = useDigitalAssets()
  const [inputAssetId, setInputAssetId] = useState(assetId || '')
  const [size, setSize] = useState(300)
  const [includeUrl, setIncludeUrl] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<QRCodeGenerationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedAssetId, setSelectedAssetId] = useState<string>('')
  const [isSearchingAsset, setIsSearchingAsset] = useState(false)
  const [mappedAssetId, setMappedAssetId] = useState<string>('')
  const [selectedAssetFromDropdown, setSelectedAssetFromDropdown] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [imageLoading, setImageLoading] = useState(false)

  // Load assets on component mount
  useEffect(() => {
    fetchAssets()
  }, []) // Remove fetchAssets from dependencies to prevent infinite loop

  // Update input when asset is selected
  useEffect(() => {
    if (selectedAssetId) {
      setInputAssetId(selectedAssetId)
    }
  }, [selectedAssetId])

  // Handle asset selection from dropdown
  const handleAssetSelect = async (assetTagId: string) => {
    setSelectedAssetFromDropdown(assetTagId)
    setInputAssetId(assetTagId)
    setSelectedAssetId(assetTagId)
    setError(null) // Clear any previous errors
    
    try {
      // Find the selected asset to get its _id
      const selectedAsset = assets.find(asset => asset.tagId === assetTagId)
      if (!selectedAsset) {
        throw new Error('Selected asset not found')
      }
      
      // Use the _id for QR code generation
      const assetId = selectedAsset._id
      setMappedAssetId(assetId)
      
      // Auto-generate QR code using the _id
      await handleGenerateQRCode(assetId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process selected asset')
      console.error('Error processing selected asset:', err)
    }
  }

  const handleClearAsset = () => {
    setSelectedAssetId('')
    setInputAssetId('')
    setMappedAssetId('')
    setSelectedAssetFromDropdown('')
    setQrCodeData(null)
    setError(null)
  }

  // Search for asset by tag ID when user types
  const handleAssetIdChange = async (value: string) => {
    setInputAssetId(value)
    setMappedAssetId('') // Reset mapped asset ID when input changes
    
    if (value.trim()) {
      setIsSearchingAsset(true)
      try {
        // First check if this is a valid ObjectId (24 hex characters)
        if (/^[a-fA-F0-9]{24}$/.test(value)) {
          // It's an asset ID, use it directly
          setSelectedAssetId(value)
          setMappedAssetId(value)
        } else {
          // Treat as tag ID
          try {
            // Try to find the asset in the existing assets list first
            const existingAsset = assets.find(asset => 
              asset.tagId.toLowerCase() === value.toLowerCase()
            )
            
            if (existingAsset) {
              setSelectedAssetId(existingAsset.tagId)
              // Use the _id directly from the found asset
              setMappedAssetId(existingAsset._id)
            } else {
              // If not found in existing assets, try to fetch from API
              try {
                await fetchAssetByTagId(value.trim())
                setSelectedAssetId(value.trim())
                // Map tag ID to asset ID
                const assetId = await getAssetIdFromTagId(value.trim())
                setMappedAssetId(assetId)
              } catch (err) {
                // Asset not found, clear selection
                setSelectedAssetId('')
                setMappedAssetId('')
              }
            }
          } catch (err) {
            setSelectedAssetId('')
            setMappedAssetId('')
          }
        }
      } catch (err) {
        setSelectedAssetId('')
        setMappedAssetId('')
      } finally {
        setIsSearchingAsset(false)
      }
    } else {
      setSelectedAssetId('')
      setMappedAssetId('')
    }
  }

  const handleGenerateQRCode = async (assetIdToUse?: string) => {
    const assetId = assetIdToUse || inputAssetId
    
    if (!assetId.trim()) {
      setError('Please enter an Asset ID or select an asset from the dropdown')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateQRCode(assetId, {
        size,
        includeUrl
      })
      setQrCodeData(result)
      setImageLoading(true) // Start loading the image
      setSuccessMessage('QR code generated successfully!')
      setShowSuccessToast(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerate = async () => {
    await handleGenerateQRCode()
  }

  const handleDownload = async () => {
    if (!qrCodeData) return

    setIsDownloading(true)
    try {
      const filename = `qr_${qrCodeData.qrCode.data.tagId}_${Date.now()}.png`
      await downloadQRCode(qrCodeData.qrCode.url, filename)
      setSuccessMessage('QR code downloaded successfully!')
      setShowSuccessToast(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download QR code')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyUrl = async () => {
    if (!qrCodeData) return
    
    const fullUrl = `${API_BASE_URL}${qrCodeData.qrCode.url}`
    await navigator.clipboard.writeText(fullUrl)
    setSuccessMessage('QR code URL copied to clipboard!')
    setShowSuccessToast(true)
  }

  // Filter assets based on search term
  const filteredAssets = assets.filter(asset => 
    asset.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.assetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.model.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={cn("space-y-6", className)}>
      {showSuccessToast && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccessToast(false)}
        />
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            Generate QR Code
          </CardTitle>
          <CardDescription>
            Generate a QR code for your digital asset by selecting from existing assets or entering an Asset ID
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Asset Selection Dropdown */}
          <div className="space-y-2">
            <Label>Select Asset</Label>
            <div className="space-y-2">
              {assetsLoading && (
                <div className="flex items-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-600">Loading assets from API...</span>
                </div>
              )}
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
                disabled={assetsLoading}
              />
              <Select value={selectedAssetFromDropdown} onValueChange={handleAssetSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={assetsLoading ? "Loading assets..." : "Choose an asset from the list"} />
                </SelectTrigger>
                <SelectContent>
                  {assetsLoading ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Loading assets...
                    </div>
                  ) : filteredAssets.length > 0 ? (
                    filteredAssets.map((asset) => (
                      <SelectItem key={asset._id} value={asset.tagId}>
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{asset.tagId}</span>
                            <Badge variant={asset.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                              {asset.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {asset.assetType} - {asset.brand} {asset.model}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {asset.location.building}, {asset.location.floor}
                          </span>
                          <span className="text-xs text-blue-600">
                            ID: {asset._id}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      {searchTerm ? 'No assets found matching your search.' : 'No assets available.'}
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {assetsLoading ? 'Loading assets...' : `${filteredAssets.length} of ${assets.length} assets shown. Selecting an asset will auto-generate the QR code using the asset's ID.`}
              </p>
            </div>
          </div>

          <Separator />

          {/* Manual Asset ID Input */}
          <div className="space-y-2">
            <Label htmlFor="assetId">Or Enter Asset ID Manually</Label>
            <div className="relative">
              <Input
                id="assetId"
                placeholder="Enter Asset ID (e.g., ASSET555)"
                value={inputAssetId}
                onChange={(e) => handleAssetIdChange(e.target.value)}
                onBlur={() => setIsSearchingAsset(false)}
                className={selectedAssetId ? 'border-green-500 bg-green-50' : ''}
              />
              {isSearchingAsset && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                </div>
              )}
              {selectedAssetId && !isSearchingAsset && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              )}
              {inputAssetId && !isSearchingAsset && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={handleClearAsset}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            {isSearchingAsset && (
              <p className="text-xs text-muted-foreground">Searching for asset...</p>
            )}
            {selectedAssetId && !isSearchingAsset && (
              <div className="space-y-1">
                <p className="text-xs text-green-600">✓ Asset found: {selectedAssetId}</p>
                {mappedAssetId && (
                  <p className="text-xs text-blue-600">🔗 Using Asset ID for QR generation: {mappedAssetId}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">QR Code Size (px)</Label>
              <Input
                id="size"
                type="number"
                min="100"
                max="1000"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeUrl"
                checked={includeUrl}
                onCheckedChange={(checked) => setIncludeUrl(checked as boolean)}
              />
              <Label htmlFor="includeUrl">Include URL in QR Code</Label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !inputAssetId.trim()}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate QR Code'}
          </Button>

        </CardContent>
      </Card>

      {qrCodeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated QR Code
              <Badge variant="secondary">{qrCodeData.qrCode.data.tagId}</Badge>
            </CardTitle>
            <CardDescription>
              QR code generated successfully for asset {qrCodeData.qrCode.data.tagId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                {/* QR Code Scanner Frame */}
                <div className="relative w-80 h-80 bg-white rounded-lg shadow-lg overflow-hidden">
                  {/* Scanner Corner Indicators */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-green-500"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-green-500"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-green-500"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-green-500"></div>
                  
                  {/* QR Code Image */}
                  <div className="flex items-center justify-center w-full h-full p-4">
                    {imageLoading && (
                      <div className="flex items-center justify-center w-64 h-64 bg-gray-100 rounded-lg">
                        <div className="text-center text-gray-500">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm">Loading QR Code...</p>
                        </div>
                      </div>
                    )}
                    <img
                      src={`${API_BASE_URL}${qrCodeData.qrCode.url}`}
                      alt={`QR Code Scanner for ${qrCodeData.qrCode.data.tagId}`}
                      className={`w-64 h-64 object-contain ${imageLoading ? 'hidden' : ''}`}
                      crossOrigin="anonymous"
                      onLoad={() => setImageLoading(false)}
                      onError={(e) => {
                        console.error('Failed to load QR code image:', e.currentTarget.src)
                        setImageLoading(false)
                        // Try alternative approach - fetch the image as blob
                        fetch(`${API_BASE_URL}${qrCodeData.qrCode.url}`, {
                          method: 'GET',
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                          },
                        })
                        .then(response => {
                          if (response.ok) {
                            return response.blob()
                          }
                          throw new Error('Failed to fetch image')
                        })
                        .then(blob => {
                          const url = URL.createObjectURL(blob)
                          e.currentTarget.src = url
                          e.currentTarget.style.display = 'block'
                          setImageLoading(false)
                        })
                        .catch(err => {
                          console.error('Failed to fetch QR code image:', err)
                          setImageLoading(false)
                          // Fallback to a placeholder
                          e.currentTarget.style.display = 'none'
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.innerHTML = `
                              <div class="flex items-center justify-center w-64 h-64 bg-gray-100 rounded-lg">
                                <div class="text-center text-gray-500">
                                  <p class="text-sm">QR Code Image</p>
                                  <p class="text-xs">Failed to load</p>
                                  <p class="text-xs mt-2">URL: ${API_BASE_URL}${qrCodeData.qrCode.url}</p>
                                </div>
                              </div>
                            `
                          }
                        })
                      }}
                    />
                  </div>
                  
                  {/* Scanning Animation */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
                </div>
                
                {/* Tag ID Display */}
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    <QrCode className="h-4 w-4" />
                    Tag ID: {qrCodeData.qrCode.data.tagId}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Asset Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span>{qrCodeData.qrCode.data.assetType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Brand:</span>
                    <span>{qrCodeData.qrCode.data.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Model:</span>
                    <span>{qrCodeData.qrCode.data.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge variant={qrCodeData.qrCode.data.status === 'active' ? 'default' : 'secondary'}>
                      {qrCodeData.qrCode.data.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Priority:</span>
                    <Badge variant={qrCodeData.qrCode.data.priority === 'high' ? 'destructive' : 'secondary'}>
                      {qrCodeData.qrCode.data.priority}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Location</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Building:</span>
                    <span>{qrCodeData.qrCode.data.location.building}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Floor:</span>
                    <span>{qrCodeData.qrCode.data.location.floor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Room:</span>
                    <span>{qrCodeData.qrCode.data.location.room}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Project:</span>
                    <span>{qrCodeData.qrCode.data.projectName}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={handleDownload} 
                disabled={isDownloading}
                variant="outline"
                className="flex-1"
              >
                {isDownloading ? 'Downloading...' : 'Download QR Code'}
              </Button>
              <Button 
                onClick={handleCopyUrl} 
                variant="outline"
                className="flex-1"
              >
                Copy QR URL
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">QR Code URL</Label>
              <Input
                value={`${API_BASE_URL}${qrCodeData.qrCode.shortUrl}`}
                readOnly
                className="text-xs"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Image URL (Debug)</Label>
              <Input
                value={`${API_BASE_URL}${qrCodeData.qrCode.url}`}
                readOnly
                className="text-xs"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 