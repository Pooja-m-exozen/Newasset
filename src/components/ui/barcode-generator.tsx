'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Badge } from './badge'
import { Separator } from './separator'
import { generateBarcode, type BarcodeGenerationResponse } from '@/lib/DigitalAssets'
import { useDigitalAssets } from '@/contexts/DigitalAssetsContext'
import { cn } from '@/lib/utils'
import { SuccessToast } from './success-toast'
import { Barcode, Settings, Info, Hash, CheckCircle, X, Search, MapPin, Building } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

// API Base URL constant
const API_BASE_URL = 'http://192.168.0.5:5021'

interface BarcodeGeneratorProps {
  assetId?: string;
  className?: string;
}

const BARCODE_FORMATS = [
  { value: 'code128', label: 'Code 128', description: 'Most common format, supports all ASCII characters' },
  { value: 'code39', label: 'Code 39', description: 'Industrial standard, supports numbers and uppercase letters' },
  { value: 'ean13', label: 'EAN-13', description: 'European Article Number, 13 digits' },
  { value: 'ean8', label: 'EAN-8', description: 'European Article Number, 8 digits' },
  { value: 'upca', label: 'UPC-A', description: 'Universal Product Code, 12 digits' },
  { value: 'upce', label: 'UPC-E', description: 'Universal Product Code, 8 digits' },
]

export function BarcodeGenerator({ assetId, className }: BarcodeGeneratorProps) {
  const { assets, fetchAssets, fetchAssetByTagId, getAssetIdFromTagId, loading: assetsLoading } = useDigitalAssets()
  const [format, setFormat] = useState('code128')
  const [height, setHeight] = useState(10)
  const [scale, setScale] = useState(3)
  const [isGenerating, setIsGenerating] = useState(false)
  const [barcodeData, setBarcodeData] = useState<BarcodeGenerationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedAssetId, setSelectedAssetId] = useState<string>('')
  const [mappedAssetId, setMappedAssetId] = useState<string>('')
  const [selectedAssetFromDropdown, setSelectedAssetFromDropdown] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [imageLoading, setImageLoading] = useState(false)

  // Load assets on component mount
  useEffect(() => {
    fetchAssets()
  }, []) // Remove fetchAssets from dependencies to prevent infinite loop

  // Handle asset selection from dropdown
  const handleAssetSelect = async (assetTagId: string) => {
    setSelectedAssetFromDropdown(assetTagId)
    setSelectedAssetId(assetTagId)
    setError(null) // Clear any previous errors
    
    try {
      // Find the selected asset to get its _id
      const selectedAsset = assets.find(asset => asset.tagId === assetTagId)
      if (!selectedAsset) {
        throw new Error('Selected asset not found')
      }
      
      // Use the _id for barcode generation
      const assetId = selectedAsset._id
      setMappedAssetId(assetId)
      
      // Don't auto-generate barcode - user must click generate button
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process selected asset')
      console.error('Error processing selected asset:', err)
    }
  }

  const handleClearAsset = () => {
    setSelectedAssetId('')
    setMappedAssetId('')
    setSelectedAssetFromDropdown('')
    setBarcodeData(null)
    setError(null)
  }

  const handleGenerateBarcode = async (assetIdToUse?: string) => {
    const assetId = assetIdToUse || mappedAssetId
    
    if (!assetId) {
      setError('Please select an asset from the dropdown')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateBarcode(assetId, {
        format,
        height,
        scale
      })
      setBarcodeData(result)
      setImageLoading(true) // Start loading the image
      setSuccessMessage('Barcode generated successfully!')
      setShowSuccessToast(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate barcode')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerate = async () => {
    await handleGenerateBarcode()
  }

  // Filter assets based on search term
  const filteredAssets = assets.filter(asset => 
    asset.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.assetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.model.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedFormat = BARCODE_FORMATS.find(f => f.value === format)

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
            <div className="p-2 rounded-lg bg-orange-500">
              <Barcode className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">
                Barcode Generator
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Select an asset and generate a professional barcode for digital asset tracking
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
                <SelectTrigger className="h-11 text-sm">
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
                              <span>{asset.location.building}, {asset.location.floor}</span>
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
                <span>Select an asset and click "Generate Barcode"</span>
              </div>
            </div>
          </div>

          {/* Barcode Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">Barcode Format</Label>
              <Select value={format} onValueChange={setFormat}>
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
            
            <div className="space-y-2">
              <Label htmlFor="height">Height (mm)</Label>
              <Input
                id="height"
                type="number"
                min="1"
                max="100"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scale">Scale</Label>
              <Input
                id="scale"
                type="number"
                min="1"
                max="10"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
              />
            </div>
          </div>

          {selectedFormat && (
            <div className="p-3 bg-muted/50 border border-border rounded-md">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">{selectedFormat.label}</p>
                  <p className="text-muted-foreground">{selectedFormat.description}</p>
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
          {selectedAssetId && !barcodeData && (
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">
                    Asset Selected: <strong>{selectedAssetId}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ready to generate barcode. Click the button below to proceed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <Label className="text-sm font-semibold">Step 2: Generate Barcode</Label>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !selectedAssetId}
              className="w-full h-11 text-base font-semibold"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating Barcode...</span>
                </div>
              ) : selectedAssetId ? (
                <div className="flex items-center space-x-2">
                  <Barcode className="h-5 w-5" />
                  <span>Generate Barcode for {selectedAssetId}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Barcode className="h-5 w-5" />
                  <span>Generate Barcode</span>
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {barcodeData && (
        <Card className="shadow-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-orange-500">
                  <Barcode className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">
                    Generated Barcode
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    Barcode generated successfully for asset {barcodeData.barcode.data}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {barcodeData.barcode.data}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="relative border-2 border-dashed border-border rounded-lg p-8 bg-muted/30">
                {/* Barcode Display */}
                <div className="relative w-80 h-40 bg-white rounded-lg shadow-sm overflow-hidden border border-border">
                  {/* Barcode Image */}
                  <div className="flex items-center justify-center w-full h-full p-6">
                    {imageLoading && (
                      <div className="flex items-center justify-center w-64 h-32 bg-muted/50 rounded-lg">
                        <div className="text-center text-muted-foreground">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-sm font-medium">Loading Barcode...</p>
                        </div>
                      </div>
                    )}
                    <img
                      src={`${API_BASE_URL}${barcodeData.barcode.url}`}
                      alt={`Barcode for ${barcodeData.barcode.data}`}
                      className={`w-64 h-32 object-contain ${imageLoading ? 'hidden' : ''}`}
                      crossOrigin="anonymous"
                      onLoad={() => setImageLoading(false)}
                      onError={(e) => {
                        console.error('Failed to load barcode image:', e.currentTarget.src)
                        setImageLoading(false)
                        // Try alternative approach - fetch the image as blob
                        fetch(`${API_BASE_URL}${barcodeData.barcode.url}`, {
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
                          console.error('Failed to fetch barcode image:', err)
                          setImageLoading(false)
                          // Fallback to a placeholder
                          e.currentTarget.style.display = 'none'
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.innerHTML = `
                              <div class="flex items-center justify-center w-64 h-32 bg-muted/50 rounded-lg">
                                <div class="text-center text-muted-foreground">
                                  <p class="text-sm font-medium">Barcode Image</p>
                                  <p class="text-xs">Failed to load</p>
                                  <p class="text-xs mt-2">URL: ${API_BASE_URL}${barcodeData.barcode.url}</p>
                                </div>
                              </div>
                            `
                          }
                        })
                      }}
                    />
                  </div>
                </div>
                
                {/* Tag ID Display */}
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 text-foreground rounded-full text-sm font-semibold shadow-sm">
                    <Barcode className="h-4 w-4" />
                    Tag ID: {barcodeData.barcode.data}
                  </div>
                </div>
              </div>
            </div>

            {/* Barcode Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Barcode Information Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-md bg-blue-100">
                      <Hash className="h-4 w-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg font-semibold">Barcode Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data</Label>
                      <p className="text-sm font-medium font-mono">{barcodeData.barcode.data}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Format</Label>
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        {barcodeData.barcode.format}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Height</Label>
                      <p className="text-sm font-medium">{height}mm</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Scale</Label>
                      <p className="text-sm font-medium">{scale}x</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Format Details Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-md bg-green-100">
                      <Settings className="h-4 w-4 text-green-600" />
                    </div>
                    <CardTitle className="text-lg font-semibold">Format Details</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</Label>
                      <p className="text-sm font-medium">{selectedFormat?.label}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Asset ID</Label>
                      <p className="text-sm font-medium font-mono">{selectedAssetId}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</Label>
                      <p className="text-sm text-muted-foreground">{selectedFormat?.description}</p>
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
                    Barcode Generated Successfully!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The barcode is ready for use. You can scan it to access asset information.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 