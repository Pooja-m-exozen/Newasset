'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Badge } from './badge'
import { generateAllDigitalAssets, type BulkDigitalAssetsGenerationResponse } from '@/lib/DigitalAssets'
import { useDigitalAssets } from '@/contexts/DigitalAssetsContext'
import { cn } from '@/lib/utils'
import { SuccessToast } from './success-toast'
import { QrCode, Barcode, Wifi, Info, Hash, MapPin, Building, Settings, Package, CheckCircle, Search } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

// API Base URL constant
const API_BASE_URL = 'http://192.168.0.5:5021'

interface BulkDigitalAssetsGeneratorProps {
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

export function BulkDigitalAssetsGenerator({ className }: BulkDigitalAssetsGeneratorProps) {
  const { assets, fetchAssets, loading: assetsLoading } = useDigitalAssets()
  const [qrSize, setQrSize] = useState(300)
  const [barcodeFormat, setBarcodeFormat] = useState('code128')
  const [isGenerating, setIsGenerating] = useState(false)
  const [digitalAssets, setDigitalAssets] = useState<BulkDigitalAssetsGenerationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedAssetId, setSelectedAssetId] = useState<string>('')
  const [mappedAssetId, setMappedAssetId] = useState<string>('')
  const [selectedAssetFromDropdown, setSelectedAssetFromDropdown] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [qrImageLoading, setQrImageLoading] = useState(false)
  const [barcodeImageLoading, setBarcodeImageLoading] = useState(false)

  // Load assets on component mount
  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  // Handle asset selection from dropdown
  const handleAssetSelect = useCallback(async (assetTagId: string) => {
    setSelectedAssetFromDropdown(assetTagId)
    setSelectedAssetId(assetTagId)
    setError(null) // Clear any previous errors
    
    try {
      // Find the selected asset to get its _id
      const selectedAsset = assets.find(asset => asset.tagId === assetTagId)
      if (!selectedAsset) {
        throw new Error('Selected asset not found')
      }
      
      // Use the _id for digital assets generation
      const assetId = selectedAsset._id
      setMappedAssetId(assetId)
      
      // Don't auto-generate digital assets - user must click generate button
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process selected asset')
      console.error('Error processing selected asset:', err)
    }
  }, [assets])

  const handleGenerateAllDigitalAssets = useCallback(async (assetIdToUse?: string) => {
    const assetId = assetIdToUse || mappedAssetId
    
    if (!assetId) {
      setError('Please select an asset from the dropdown')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateAllDigitalAssets(assetId, {
        qrSize,
        barcodeFormat
      })
      setDigitalAssets(result)
      console.log('Digital assets generated:', result)
      console.log('QR Code URL:', `${API_BASE_URL}${result.digitalAssets.qrCode.url}`)
      console.log('Barcode URL:', `${API_BASE_URL}${result.digitalAssets.barcode.url}`)
      
      setQrImageLoading(true) // Start loading QR code image
      setBarcodeImageLoading(true) // Start loading barcode image
      setSuccessMessage('All digital assets generated successfully!')
      setShowSuccessToast(true)
      
      // Add timeout to prevent infinite loading
      setTimeout(() => {
        if (qrImageLoading) {
          console.warn('QR Code image loading timeout, forcing state update')
          setQrImageLoading(false)
        }
        if (barcodeImageLoading) {
          console.warn('Barcode image loading timeout, forcing state update')
          setBarcodeImageLoading(false)
        }
      }, 10000) // 10 second timeout
      // Refresh global assets so other views (e.g., AssetsViewer) reflect newly stored digital assets
      try {
        await fetchAssets()
      } catch (e) {
        console.warn('Failed to refresh assets after generation:', e)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate digital assets')
    } finally {
      setIsGenerating(false)
    }
  }, [mappedAssetId, qrSize, barcodeFormat, fetchAssets])

  const handleGenerate = useCallback(async () => {
    await handleGenerateAllDigitalAssets()
  }, [handleGenerateAllDigitalAssets])

  // Filter assets based on search term
  const filteredAssets = assets.filter(asset => {
    const term = (searchTerm || '').toLowerCase()
    const tagId = (asset.tagId || '').toLowerCase()
    const type = (asset.assetType || '').toLowerCase()
    const brand = (asset.brand || '').toLowerCase()
    const model = (asset.model || '').toLowerCase()
    return tagId.includes(term) || type.includes(term) || brand.includes(term) || model.includes(term)
  })

  const selectedFormat = BARCODE_FORMATS.find(f => f.value === barcodeFormat)

  return (
    <div className={cn("space-y-6", className)}>
      {showSuccessToast && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccessToast(false)}
        />
      )}
      
      <Card className="shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">
                Bulk Digital Assets Generator
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Select an asset and generate QR code, barcode, and NFC data simultaneously
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Asset Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <Label className="text-sm font-semibold">Step 1: Select Asset</Label>
            </div>
            
            {assetsLoading && (
              <div className="flex items-center space-x-3 p-4 bg-muted/50 border border-border rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <span className="text-sm font-medium">Loading assets from API...</span>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="🔍 Search assets by tag ID, type, brand, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 text-sm"
                  disabled={assetsLoading}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Select value={selectedAssetFromDropdown} onValueChange={handleAssetSelect}>
                <SelectTrigger className="h-11 text-sm w-full items-center justify-between">
                  <SelectValue placeholder={assetsLoading ? "⏳ Loading assets..." : "📋 Choose an asset from the list"} />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {assetsLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm">Loading assets...</p>
                    </div>
                  ) : filteredAssets.length > 0 ? (
                    filteredAssets.map((asset) => (
                      <SelectItem key={asset._id} value={asset.tagId} className="py-3">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{asset.tagId}</span>
                            <Badge 
                              variant={asset.status === 'active' ? 'default' : 'secondary'} 
                              className="text-xs px-2 py-1"
                            >
                              {asset.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p className="font-medium">{asset.assetType} - {asset.brand} {asset.model}</p>
                            <p className="flex items-center space-x-1">
                              <Building className="h-3 w-3" />
                              <span>{asset.location?.building || 'N/A'}, {asset.location?.floor || 'N/A'}</span>
                            </p>
                            <p className="text-primary font-mono text-xs">ID: {asset._id}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      <p className="text-sm">
                        {searchTerm ? '🔍 No assets found matching your search.' : '📭 No assets available.'}
                      </p>
                    </div>
                  )}
                </SelectContent>
              </Select>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {assetsLoading ? 'Loading...' : `${filteredAssets.length} of ${assets.length} assets shown`}
                </span>
                <span>Select an asset and click &quot;Generate All Digital Assets&quot;</span>
              </div>
            </div>
          </div>

          {/* Configuration Section */}
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

          {selectedFormat && (
            <div className="p-3 bg-muted/50 border border-border rounded-md">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Bulk Generation</p>
                  <p className="text-muted-foreground">
                    This will generate QR code, barcode, and NFC data simultaneously. 
                    All assets will be created with consistent asset information.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Asset Selection Feedback */}
          {selectedAssetId && !digitalAssets && (
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">
                    Asset Selected: <strong>{selectedAssetId}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ready to generate all digital assets. Click the button below to proceed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <Label className="text-sm font-semibold">Step 2: Generate All Digital Assets</Label>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !selectedAssetId}
              className="w-full h-11 text-base font-semibold"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating All Digital Assets...</span>
                </div>
              ) : selectedAssetId ? (
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Generate All Digital Assets for {selectedAssetId}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Generate All Digital Assets</span>
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {digitalAssets && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-500">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold">
                      Generated Digital Assets
                    </CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">
                      All digital assets generated successfully for asset {digitalAssets.digitalAssets.qrCode.data.tagId}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {digitalAssets.digitalAssets.qrCode.data.tagId}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-muted/50 border border-border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">QR Code</p>
                    <p className="text-sm text-muted-foreground">Generated successfully</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-muted/50 border border-border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Barcode</p>
                    <p className="text-sm text-muted-foreground">Generated successfully</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-muted/50 border border-border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">NFC Data</p>
                    <p className="text-sm text-muted-foreground">Generated successfully</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Preview */}
          <Card className="shadow-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-500">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">QR Code</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    QR code for asset {digitalAssets.digitalAssets.qrCode.data.tagId}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('Manually refreshing QR code image...')
                    setQrImageLoading(true)
                    // Force a re-render by updating the src with a timestamp
                    const imgElement = document.querySelector('.qr-code-container img') as HTMLImageElement
                    if (imgElement) {
                      const currentSrc = imgElement.src
                      const separator = currentSrc.includes('?') ? '&' : '?'
                      imgElement.src = `${currentSrc}${separator}t=${Date.now()}`
                    }
                  }}
                  className="flex items-center space-x-2"
                >
                  <Search className="h-4 w-4" />
                  <span>Refresh QR Code</span>
                </Button>
              </div>
              <div className="flex justify-center">
                <div className="relative border-2 border-dashed border-border rounded-lg p-8 bg-muted/30">
                  <div className="relative w-64 h-64 bg-white rounded-lg shadow-sm overflow-hidden border border-border">
                    {/* QR Code Image with Loading State */}
                    <div className="flex items-center justify-center w-full h-full p-4 qr-code-container">
                      {qrImageLoading && (
                        <div className="flex items-center justify-center w-56 h-56 bg-muted/50 rounded-lg">
                          <div className="text-center text-muted-foreground">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                            <p className="text-sm font-medium">Loading QR Code...</p>
                          </div>
                        </div>
                      )}
                      <Image
                        src={`${API_BASE_URL}${digitalAssets.digitalAssets.qrCode.url}`}
                        alt={`QR Code for ${digitalAssets.digitalAssets.qrCode.data.tagId}`}
                        width={224}
                        height={224}
                        className={`object-contain ${qrImageLoading ? 'hidden' : ''}`}
                        onLoad={() => {
                          console.log('QR Code image loaded successfully')
                          setQrImageLoading(false)
                        }}
                        onError={(e) => {
                          console.error('Failed to load QR code image:', e)
                          setQrImageLoading(false)
                          // Fallback to a placeholder
                          const parentElement = document.querySelector('.qr-code-container')
                          if (parentElement) {
                            parentElement.innerHTML = `
                              <div class="flex items-center justify-center w-56 h-56 bg-muted/50 rounded-lg">
                                <div class="text-center text-muted-foreground">
                                  <p class="text-sm font-medium">QR Code Image</p>
                                  <p class="text-xs">Failed to load</p>
                                  <p class="text-xs mt-2">URL: ${API_BASE_URL}${digitalAssets.digitalAssets.qrCode.url}</p>
                                </div>
                              </div>
                            `
                          }
                        }}
                        priority={true}
                        loading="eager"
                      />
                    </div>
                  </div>
                  
                  {/* Tag ID Display */}
                  <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 text-foreground rounded-full text-sm font-semibold shadow-sm">
                      <QrCode className="h-4 w-4" />
                      Tag ID: {digitalAssets.digitalAssets.qrCode.data.tagId}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Barcode Preview */}
          <Card className="shadow-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-orange-500">
                  <Barcode className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Barcode</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    Barcode for asset {digitalAssets.digitalAssets.barcode.data}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('Manually refreshing barcode image...')
                    setBarcodeImageLoading(true)
                    // Force a re-render by updating the src with a timestamp
                    const imgElement = document.querySelector('.barcode-image-container img') as HTMLImageElement
                    if (imgElement) {
                      const currentSrc = imgElement.src
                      const separator = currentSrc.includes('?') ? '&' : '?'
                      imgElement.src = `${currentSrc}${separator}t=${Date.now()}`
                    }
                  }}
                  className="flex items-center space-x-2"
                >
                  <Search className="h-4 w-4" />
                  <span>Refresh Barcode</span>
                </Button>
              </div>
              <div className="flex justify-center">
                <div className="relative border-2 border-dashed border-border rounded-lg p-8 bg-muted/30">
                  <div className="relative w-80 h-40 bg-white rounded-lg shadow-sm overflow-hidden border border-border">
                    {/* Barcode Image with Loading State */}
                    <div className="flex items-center justify-center w-full h-full p-6 barcode-image-container">
                      {barcodeImageLoading && (
                        <div className="flex items-center justify-center w-64 h-32 bg-muted/50 rounded-lg">
                          <div className="text-center text-muted-foreground">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                            <p className="text-sm font-medium">Loading Barcode...</p>
                          </div>
                        </div>
                      )}
                      <Image
                        src={`${API_BASE_URL}${digitalAssets.digitalAssets.barcode.url}`}
                        alt={`Barcode for ${digitalAssets.digitalAssets.barcode.data}`}
                        width={256}
                        height={128}
                        className={`object-contain ${barcodeImageLoading ? 'hidden' : ''}`}
                        onLoad={() => {
                          console.log('Barcode image loaded successfully')
                          setBarcodeImageLoading(false)
                        }}
                        onError={(e) => {
                          console.error('Failed to load barcode image:', e)
                          setBarcodeImageLoading(false)
                          // Fallback to a placeholder
                          const parentElement = document.querySelector('.barcode-image-container')
                          if (parentElement) {
                            parentElement.innerHTML = `
                              <div class="flex items-center justify-center w-64 h-32 bg-muted/50 rounded-lg">
                                <div class="text-center text-muted-foreground">
                                <p class="text-sm font-medium">Barcode Image</p>
                                <p class="text-xs">Failed to load</p>
                                <p class="text-xs mt-2">URL: ${API_BASE_URL}${digitalAssets.digitalAssets.barcode.url}</p>
                              </div>
                            </div>
                          `
                          }
                        }}
                        priority={true}
                        loading="eager"
                      />
                    </div>
                  </div>
                  
                  {/* Tag ID Display */}
                  <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 text-foreground rounded-full text-sm font-semibold shadow-sm">
                      <Barcode className="h-4 w-4" />
                      Tag ID: {digitalAssets.digitalAssets.barcode.data}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NFC Data Preview */}
          <Card className="shadow-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-500">
                  <Wifi className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">NFC Data</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    NFC data for asset {digitalAssets.digitalAssets.nfcData.data.id}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <div className="relative border-2 border-dashed border-border rounded-lg p-8 bg-muted/30">
                  <div className="relative w-80 h-48 bg-white rounded-lg shadow-sm overflow-hidden border border-border">
                    <div className="flex items-center justify-center w-full h-full p-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Wifi className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">NFC Data Ready</h3>
                        <p className="text-sm text-muted-foreground mb-4">Tap to read asset information</p>
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <p><span className="font-medium">Asset ID:</span> {digitalAssets.digitalAssets.nfcData.data.id}</p>
                          <p><span className="font-medium">Type:</span> {digitalAssets.digitalAssets.nfcData.data.type}</p>
                          <p><span className="font-medium">Format:</span> NFC-A</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* NFC Data Information Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* NFC Basic Info Card */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-md bg-purple-100">
                        <Wifi className="h-4 w-4 text-purple-600" />
                      </div>
                      <CardTitle className="text-lg font-semibold">NFC Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</Label>
                        <p className="text-sm font-medium">{digitalAssets.digitalAssets.nfcData.data.type}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Asset ID</Label>
                        <p className="text-sm font-medium font-mono">{digitalAssets.digitalAssets.nfcData.data.id}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand</Label>
                        <p className="text-sm font-medium">{digitalAssets.digitalAssets.nfcData.data.brand}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</Label>
                        <p className="text-sm font-medium">{digitalAssets.digitalAssets.nfcData.data.model}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</Label>
                        <Badge 
                          variant={digitalAssets.digitalAssets.nfcData.data.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs px-2 py-1"
                        >
                          {digitalAssets.digitalAssets.nfcData.data.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</Label>
                        <Badge 
                          variant={digitalAssets.digitalAssets.nfcData.data.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs px-2 py-1"
                        >
                          {digitalAssets.digitalAssets.nfcData.data.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* NFC Technical Details Card */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-md bg-blue-100">
                        <Settings className="h-4 w-4 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg font-semibold">Technical Details</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Timestamp</Label>
                        <p className="text-sm font-medium font-mono">
                          {new Date(digitalAssets.digitalAssets.nfcData.data.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Checksum</Label>
                        <p className="text-sm font-medium font-mono">
                          {digitalAssets.digitalAssets.nfcData.data.checksum.substring(0, 8)}...
                        </p>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Signature</Label>
                        <p className="text-sm font-medium font-mono">
                          {digitalAssets.digitalAssets.nfcData.data.signature.substring(0, 16)}...
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigned To</Label>
                        <p className="text-sm font-medium">{digitalAssets.digitalAssets.nfcData.data.assignedTo}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project</Label>
                        <p className="text-sm font-medium">{digitalAssets.digitalAssets.nfcData.data.projectName}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Asset Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Information Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-md bg-blue-100">
                    <Hash className="h-4 w-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Asset Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</Label>
                    <p className="text-sm font-medium">{digitalAssets.digitalAssets.qrCode.data.assetType}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand</Label>
                    <p className="text-sm font-medium">{digitalAssets.digitalAssets.qrCode.data.brand}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</Label>
                    <p className="text-sm font-medium">{digitalAssets.digitalAssets.qrCode.data.model}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</Label>
                    <Badge 
                      variant={digitalAssets.digitalAssets.qrCode.data.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs px-2 py-1"
                    >
                      {digitalAssets.digitalAssets.qrCode.data.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</Label>
                    <Badge 
                      variant={digitalAssets.digitalAssets.qrCode.data.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs px-2 py-1"
                    >
                      {digitalAssets.digitalAssets.qrCode.data.priority}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigned To</Label>
                    <p className="text-sm font-medium">{digitalAssets.digitalAssets.qrCode.data.assignedTo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Information Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-md bg-green-100">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Location Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Building</Label>
                    <p className="text-sm font-medium">{digitalAssets.digitalAssets.qrCode.data.location?.building || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Floor</Label>
                    <p className="text-sm font-medium">{digitalAssets.digitalAssets.qrCode.data.location?.floor || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Room</Label>
                    <p className="text-sm font-medium">{digitalAssets.digitalAssets.qrCode.data.location?.room || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project</Label>
                      <p className="text-sm font-medium">{digitalAssets.digitalAssets.qrCode.data.projectName || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Success Message */}
          <div className="p-4 bg-muted/50 border border-border rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">
                  All Digital Assets Generated Successfully!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  QR code, barcode, and NFC data are ready for use. You can scan them to access asset information.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 