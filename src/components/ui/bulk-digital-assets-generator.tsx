'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Badge } from './badge'
import { Separator } from './separator'
import { generateAllDigitalAssets, downloadAllDigitalAssets, downloadAllDigitalAssetsIndividually, type BulkDigitalAssetsGenerationResponse } from '@/lib/DigitalAssets'
import { useDigitalAssets } from '@/contexts/DigitalAssetsContext'
import { cn } from '@/lib/utils'
import { SuccessToast } from './success-toast'
import { QrCode, Barcode, Wifi, Download, Copy, Info, Hash, MapPin, Building, Calendar, User, Settings, Shield, Activity, Package, CheckCircle, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

interface BulkDigitalAssetsGeneratorProps {
  assetId?: string;
  className?: string;
}

const BARCODE_FORMATS = [
  { value: 'code128', label: 'Code 128', description: 'Most common format, supports all ASCII characters' },
  { value: 'code39', label: 'Code 39', description: 'Industrial standard, numbers and uppercase letters' },
  { value: 'ean13', label: 'EAN-13', description: 'European Article Number, 13 digits' },
  { value: 'ean8', label: 'EAN-8', description: 'European Article Number, 8 digits' },
  { value: 'upca', label: 'UPC-A', description: 'Universal Product Code, 12 digits' },
  { value: 'upce', label: 'UPC-E', description: 'Universal Product Code, 8 digits' },
]

export function BulkDigitalAssetsGenerator({ assetId, className }: BulkDigitalAssetsGeneratorProps) {
  const { assets, fetchAssets, fetchAssetByTagId, getAssetIdFromTagId } = useDigitalAssets()
  const [inputAssetId, setInputAssetId] = useState(assetId || '')
  const [qrSize, setQrSize] = useState(300)
  const [barcodeFormat, setBarcodeFormat] = useState('code128')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [digitalAssets, setDigitalAssets] = useState<BulkDigitalAssetsGenerationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedAssetId, setSelectedAssetId] = useState<string>('')
  const [isSearchingAsset, setIsSearchingAsset] = useState(false)
  const [mappedAssetId, setMappedAssetId] = useState<string>('')

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

  const handleAssetSelect = (assetId: string) => {
    setSelectedAssetId(assetId)
    setInputAssetId(assetId)
  }

  const handleClearAsset = () => {
    setSelectedAssetId('')
    setInputAssetId('')
    setMappedAssetId('')
  }

  // Search for asset by tag ID when user types
  const handleAssetIdChange = async (value: string) => {
    setInputAssetId(value)
    setMappedAssetId('') // Reset mapped asset ID when input changes
    
    if (value.trim() && value.length >= 3) {
      setIsSearchingAsset(true)
      try {
        // Try to find the asset in the existing assets list first
        const existingAsset = assets.find(asset => 
          asset.tagId.toLowerCase().includes(value.toLowerCase())
        )
        
        if (existingAsset) {
          setSelectedAssetId(existingAsset.tagId)
          // Map tag ID to asset ID
          const assetId = await getAssetIdFromTagId(existingAsset.tagId)
          setMappedAssetId(assetId)
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
      } finally {
        setIsSearchingAsset(false)
      }
    } else {
      setSelectedAssetId('')
      setMappedAssetId('')
    }
  }

  const handleGenerate = async () => {
    if (!inputAssetId.trim()) {
      setError('Please enter an Asset ID')
      return
    }

    if (!mappedAssetId) {
      setError('Please enter a valid Asset ID to generate digital assets')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Use the mapped asset ID (actual _id from API) instead of the tag ID
      const result = await generateAllDigitalAssets(mappedAssetId, {
        qrSize,
        barcodeFormat
      })
      setDigitalAssets(result)
      setSuccessMessage('All digital assets generated successfully!')
      setShowSuccessToast(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate digital assets')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadAll = async () => {
    if (!digitalAssets) return

    setIsDownloading(true)
    try {
      // Try ZIP download first, fallback to individual downloads
      try {
        await downloadAllDigitalAssets(digitalAssets.digitalAssets, mappedAssetId)
        setSuccessMessage('All digital assets downloaded successfully as ZIP!')
      } catch (zipError) {
        console.warn('ZIP download failed, trying individual downloads:', zipError)
        await downloadAllDigitalAssetsIndividually(digitalAssets.digitalAssets, mappedAssetId)
        setSuccessMessage('All digital assets downloaded individually!')
      }
      setShowSuccessToast(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download digital assets')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyUrl = async (type: 'qr' | 'barcode' | 'nfc') => {
    if (!digitalAssets) return
    
    let url = ''
    switch (type) {
      case 'qr':
        url = `${window.location.origin}${digitalAssets.digitalAssets.qrCode.shortUrl}`
        break
      case 'barcode':
        url = `${window.location.origin}${digitalAssets.digitalAssets.barcode.shortUrl}`
        break
      case 'nfc':
        url = `${window.location.origin}${digitalAssets.digitalAssets.nfcData.shortUrl}`
        break
    }
    
    await navigator.clipboard.writeText(url)
    setSuccessMessage(`${type.toUpperCase()} URL copied to clipboard!`)
    setShowSuccessToast(true)
  }

  const selectedFormat = BARCODE_FORMATS.find(f => f.value === barcodeFormat)

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
            <Package className="h-5 w-5" />
            Generate All Digital Assets
          </CardTitle>
          <CardDescription>
            Generate QR code, barcode, and NFC data for your digital asset in one operation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assetId">Asset ID</Label>
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
                  <p className="text-xs text-blue-600">🔗 Mapped to Asset ID: {mappedAssetId}</p>
                )}
              </div>
            )}
          </div>

          {/* Asset Selection */}
          {assets.length > 0 && (
            <div className="space-y-2">
              <Label>Or select from existing assets:</Label>
              <Select value={selectedAssetId} onValueChange={handleAssetSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an existing asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
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
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {assets.length} assets available. You can also type a tag ID above to search.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qrSize">QR Code Size (px)</Label>
              <Input
                id="qrSize"
                type="number"
                min="100"
                max="1000"
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="barcodeFormat">Barcode Format</Label>
              <Select value={barcodeFormat} onValueChange={setBarcodeFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {BARCODE_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{format.label}</span>
                        <span className="text-xs text-muted-foreground">{format.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Bulk Generation</p>
                <p className="text-blue-700">
                  This will generate QR code, barcode, and NFC data simultaneously. 
                  All assets will be created with consistent asset information.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !inputAssetId.trim()}
            className="w-full"
          >
            {isGenerating ? 'Generating All Assets...' : 'Generate All Digital Assets'}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {digitalAssets && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Generated Digital Assets
                <Badge variant="secondary">{digitalAssets.digitalAssets.qrCode.data.tagId}</Badge>
              </CardTitle>
              <CardDescription>
                All digital assets generated successfully for asset {digitalAssets.digitalAssets.qrCode.data.tagId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">QR Code</p>
                    <p className="text-sm text-green-700">Generated successfully</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Barcode</p>
                    <p className="text-sm text-blue-700">Generated successfully</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 border border-purple-200 rounded-md">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-900">NFC Data</p>
                    <p className="text-sm text-purple-700">Generated successfully</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="h-5 w-5" />
                QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  <img
                    src={`${window.location.origin}${digitalAssets.digitalAssets.qrCode.url}`}
                    alt={`QR Code for ${digitalAssets.digitalAssets.qrCode.data.tagId}`}
                    className="w-48 h-48 object-contain"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleCopyUrl('qr')} 
                  variant="outline"
                  size="sm"
                >
                  Copy QR URL
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Barcode Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Barcode className="h-5 w-5" />
                Barcode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  <img
                    src={`${window.location.origin}${digitalAssets.digitalAssets.barcode.url}`}
                    alt={`Barcode for ${digitalAssets.digitalAssets.barcode.data}`}
                    className="max-w-full h-auto object-contain"
                    style={{ minHeight: '100px' }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleCopyUrl('barcode')} 
                  variant="outline"
                  size="sm"
                >
                  Copy Barcode URL
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* NFC Data Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wifi className="h-5 w-5" />
                NFC Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {JSON.stringify(digitalAssets.digitalAssets.nfcData.data, null, 2)}
                </pre>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleCopyUrl('nfc')} 
                  variant="outline"
                  size="sm"
                >
                  Copy NFC URL
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Asset Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hash className="h-5 w-5" />
                Asset Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Type:</span>
                      <Badge variant="outline">{digitalAssets.digitalAssets.qrCode.data.assetType}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Brand:</span>
                      <span>{digitalAssets.digitalAssets.qrCode.data.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Model:</span>
                      <span>{digitalAssets.digitalAssets.qrCode.data.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge variant={digitalAssets.digitalAssets.qrCode.data.status === 'active' ? 'default' : 'secondary'}>
                        {digitalAssets.digitalAssets.qrCode.data.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Location & Assignment</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Building:</span>
                      <span>{digitalAssets.digitalAssets.qrCode.data.location.building}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Floor:</span>
                      <span>{digitalAssets.digitalAssets.qrCode.data.location.floor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Room:</span>
                      <span>{digitalAssets.digitalAssets.qrCode.data.location.room}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Assigned To:</span>
                      <span>{digitalAssets.digitalAssets.qrCode.data.assignedTo}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download All Button */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleDownloadAll} 
                disabled={isDownloading}
                className="w-full"
                size="lg"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download All Assets'}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Downloads QR code, barcode, and NFC data (ZIP or individual files)
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 