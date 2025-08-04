'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Badge } from './badge'
import { Separator } from './separator'
import { generateBarcode, downloadBarcode, type BarcodeGenerationResponse } from '@/lib/DigitalAssets'
import { useDigitalAssets } from '@/contexts/DigitalAssetsContext'
import { cn } from '@/lib/utils'
import { SuccessToast } from './success-toast'
import { Barcode, Download, Copy, Settings, Info, Hash, CheckCircle, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

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
  const { assets, fetchAssets, fetchAssetByTagId, getAssetIdFromTagId } = useDigitalAssets()
  const [inputAssetId, setInputAssetId] = useState(assetId || '')
  const [format, setFormat] = useState('code128')
  const [height, setHeight] = useState(10)
  const [scale, setScale] = useState(3)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [barcodeData, setBarcodeData] = useState<BarcodeGenerationResponse | null>(null)
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
        console.log('🔍 Searching for asset with tag ID:', value.trim())
        
        // Try to find the asset in the existing assets list first
        const existingAsset = assets.find(asset => 
          asset.tagId.toLowerCase().includes(value.toLowerCase())
        )
        
        if (existingAsset) {
          console.log('✅ Found asset in existing list:', existingAsset)
          setSelectedAssetId(existingAsset.tagId)
          // Map tag ID to asset ID
          console.log('🔄 Mapping tag ID to asset ID for:', existingAsset.tagId)
          const assetId = await getAssetIdFromTagId(existingAsset.tagId)
          console.log('✅ Mapped asset ID:', assetId)
          setMappedAssetId(assetId)
        } else {
          // If not found in existing assets, try to fetch from API
          console.log('🔍 Asset not found in existing list, fetching from API...')
          try {
            await fetchAssetByTagId(value.trim())
            setSelectedAssetId(value.trim())
            // Map tag ID to asset ID
            console.log('🔄 Mapping tag ID to asset ID for:', value.trim())
            const assetId = await getAssetIdFromTagId(value.trim())
            console.log('✅ Mapped asset ID:', assetId)
            setMappedAssetId(assetId)
          } catch (err) {
            console.error('❌ Error fetching asset from API:', err)
            // Asset not found, clear selection
            setSelectedAssetId('')
            setMappedAssetId('')
          }
        }
      } catch (err) {
        console.error('❌ Error in asset search:', err)
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
      setError('Please enter a valid Asset ID to generate barcode')
      return
    }

    console.log('🚀 Starting barcode generation...')
    console.log('📝 Input Asset ID (tagId):', inputAssetId)
    console.log('🆔 Mapped Asset ID (_id):', mappedAssetId)
    console.log('⚙️ Generation options:', { format, height, scale })

    setIsGenerating(true)
    setError(null)

    try {
      // Use the mapped asset ID (actual _id from API) instead of the tag ID
      console.log('🔄 Calling generateBarcode with assetId:', mappedAssetId)
      const result = await generateBarcode(mappedAssetId, {
        format,
        height,
        scale
      })
      console.log('✅ Barcode generated successfully:', result)
      setBarcodeData(result)
      setSuccessMessage('Barcode generated successfully!')
      setShowSuccessToast(true)
    } catch (err) {
      console.error('❌ Error generating barcode:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate barcode')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!barcodeData) return

    setIsDownloading(true)
    try {
      const filename = `barcode_${barcodeData.barcode.data}_${Date.now()}.png`
      await downloadBarcode(barcodeData.barcode.url, filename)
      setSuccessMessage('Barcode downloaded successfully!')
      setShowSuccessToast(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download barcode')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyUrl = async () => {
    if (!barcodeData) return
    
    const fullUrl = `${window.location.origin}${barcodeData.barcode.shortUrl}`
    await navigator.clipboard.writeText(fullUrl)
    setSuccessMessage('Barcode URL copied to clipboard!')
    setShowSuccessToast(true)
  }

  const selectedFormat = BARCODE_FORMATS.find(f => f.value === format)

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
            <Barcode className="h-5 w-5" />
            Generate Barcode
          </CardTitle>
          <CardDescription>
            Generate a barcode for your digital asset
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
            {/* Debug information */}
            {inputAssetId && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                <div className="font-medium text-gray-700 mb-2">Debug Info:</div>
                <div className="space-y-1 text-xs">
                  <div><span className="font-medium">Input Tag ID:</span> {inputAssetId}</div>
                  <div><span className="font-medium">Mapped Asset ID:</span> {mappedAssetId || 'Not mapped'}</div>
                  <div><span className="font-medium">Selected Asset:</span> {selectedAssetId || 'None'}</div>
                  <div><span className="font-medium">Assets in Context:</span> {assets.length}</div>
                </div>
              </div>
            )}
          </div>

          {/* Asset Selection */}
          {assets.length > 0 && (
            <div className="space-y-2">
              <Label>Or select from existing assets:</Label>
              <Select value={selectedAssetId} onValueChange={(value) => {
                setSelectedAssetId(value)
                setInputAssetId(value)
              }}>
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
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">{selectedFormat.label}</p>
                  <p className="text-blue-700">{selectedFormat.description}</p>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !inputAssetId.trim()}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Barcode'}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {barcodeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Barcode
              <Badge variant="secondary">{barcodeData.barcode.data}</Badge>
            </CardTitle>
            <CardDescription>
              Barcode generated successfully for asset {barcodeData.barcode.data}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <img
                  src={`${window.location.origin}${barcodeData.barcode.url}`}
                  alt={`Barcode for ${barcodeData.barcode.data}`}
                  className="max-w-full h-auto object-contain"
                  style={{ minHeight: '100px' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center space-x-2">
                  <Hash className="h-4 w-4" />
                  Barcode Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Data:</span>
                    <span className="font-mono">{barcodeData.barcode.data}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Format:</span>
                    <Badge variant="outline">{barcodeData.barcode.format}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Height:</span>
                    <span>{height}mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Scale:</span>
                    <span>{scale}x</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  Format Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span>{selectedFormat?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Description:</span>
                    <span className="text-right">{selectedFormat?.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Asset ID:</span>
                    <span className="font-mono">{inputAssetId}</span>
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
                {isDownloading ? 'Downloading...' : 'Download Barcode'}
              </Button>
              <Button 
                onClick={handleCopyUrl} 
                variant="outline"
                className="flex-1"
              >
                Copy Barcode URL
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Barcode URL</Label>
              <Input
                value={`${window.location.origin}${barcodeData.barcode.shortUrl}`}
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