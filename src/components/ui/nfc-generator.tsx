'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Badge } from './badge'
import { Separator } from './separator'
import { generateNFCData, downloadNFCData, type NFCGenerationResponse } from '@/lib/DigitalAssets'
import { useDigitalAssets } from '@/contexts/DigitalAssetsContext'
import { cn } from '@/lib/utils'
import { SuccessToast } from './success-toast'
import { Wifi, Download, Copy, Info, Hash, MapPin, Building, Calendar, User, Settings, Shield, Activity, CheckCircle, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

interface NFCGeneratorProps {
  assetId?: string;
  className?: string;
}

export function NFCGenerator({ assetId, className }: NFCGeneratorProps) {
  const { assets, fetchAssets, fetchAssetByTagId, getAssetIdFromTagId } = useDigitalAssets()
  const [inputAssetId, setInputAssetId] = useState(assetId || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [nfcData, setNfcData] = useState<NFCGenerationResponse | null>(null)
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
      setError('Please enter a valid Asset ID to generate NFC data')
      return
    }

    console.log('🚀 Starting NFC data generation...')
    console.log('📝 Input Asset ID (tagId):', inputAssetId)
    console.log('🆔 Mapped Asset ID (_id):', mappedAssetId)

    setIsGenerating(true)
    setError(null)

    try {
      // Use the mapped asset ID (actual _id from API) instead of the tag ID
      console.log('🔄 Calling generateNFCData with assetId:', mappedAssetId)
      const result = await generateNFCData(mappedAssetId)
      console.log('✅ NFC data generated successfully:', result)
      setNfcData(result)
      setSuccessMessage('NFC data generated successfully!')
      setShowSuccessToast(true)
    } catch (err) {
      console.error('❌ Error generating NFC data:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate NFC data')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!nfcData) return

    setIsDownloading(true)
    try {
      const filename = `nfc_${nfcData.nfcData.data.id}_${Date.now()}.json`
      await downloadNFCData(nfcData.nfcData.url, filename)
      setSuccessMessage('NFC data downloaded successfully!')
      setShowSuccessToast(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download NFC data')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyUrl = async () => {
    if (!nfcData) return
    
    const fullUrl = `${window.location.origin}${nfcData.nfcData.shortUrl}`
    await navigator.clipboard.writeText(fullUrl)
    setSuccessMessage('NFC data URL copied to clipboard!')
    setShowSuccessToast(true)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

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
            <Wifi className="h-5 w-5" />
            Generate NFC Data
          </CardTitle>
          <CardDescription>
            Generate NFC data for your digital asset
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

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">NFC Data Generation</p>
                <p className="text-blue-700">
                  NFC data includes comprehensive asset information including location, 
                  maintenance schedule, performance metrics, and digital signatures for security.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !inputAssetId.trim()}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate NFC Data'}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {nfcData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated NFC Data
              <Badge variant="secondary">{nfcData.nfcData.data.id}</Badge>
            </CardTitle>
            <CardDescription>
              NFC data generated successfully for asset {nfcData.nfcData.data.id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Asset Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <Hash className="h-4 w-4" />
                  Asset Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <Badge variant="outline">{nfcData.nfcData.data.assetType}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Subcategory:</span>
                    <span>{nfcData.nfcData.data.subcategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Brand:</span>
                    <span>{nfcData.nfcData.data.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Model:</span>
                    <span>{nfcData.nfcData.data.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge variant={nfcData.nfcData.data.status === 'active' ? 'default' : 'secondary'}>
                      {nfcData.nfcData.data.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Priority:</span>
                    <Badge variant={nfcData.nfcData.data.priority === 'high' ? 'destructive' : 'secondary'}>
                      {nfcData.nfcData.data.priority}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  Location Details
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Building:</span>
                    <span>{nfcData.nfcData.data.location.building}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Floor:</span>
                    <span>{nfcData.nfcData.data.location.floor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Room:</span>
                    <span>{nfcData.nfcData.data.location.room}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Coordinates:</span>
                    <span className="text-xs">
                      {nfcData.nfcData.data.location.latitude}, {nfcData.nfcData.data.location.longitude}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Assignment and Project */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  Assignment
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Assigned To:</span>
                    <span>{nfcData.nfcData.data.assignedTo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Project:</span>
                    <span>{nfcData.nfcData.data.projectName}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  Timestamp
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Generated:</span>
                    <span>{formatTimestamp(nfcData.nfcData.data.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Security Information */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                Security & Validation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Checksum:</span>
                    <span className="font-mono text-xs">{nfcData.nfcData.data.checksum}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Signature:</span>
                    <span className="font-mono text-xs truncate max-w-32">
                      {nfcData.nfcData.data.signature.substring(0, 16)}...
                    </span>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Data Type:</span>
                    <Badge variant="outline">{nfcData.nfcData.data.type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Asset ID:</span>
                    <span className="font-mono">{nfcData.nfcData.data.id}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={handleDownload} 
                disabled={isDownloading}
                variant="outline"
                className="flex-1"
              >
                {isDownloading ? 'Downloading...' : 'Download NFC Data'}
              </Button>
              <Button 
                onClick={handleCopyUrl} 
                variant="outline"
                className="flex-1"
              >
                Copy NFC URL
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">NFC Data URL</Label>
              <Input
                value={`${window.location.origin}${nfcData.nfcData.shortUrl}`}
                readOnly
                className="text-xs"
              />
            </div>

            {/* Data Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Data Preview</Label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {JSON.stringify(nfcData.nfcData.data, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 