'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Checkbox } from './checkbox'
import { Badge } from './badge'
import { Separator } from './separator'
import { generateQRCode, downloadQRCode, type QRCodeGenerationResponse } from '@/lib/DigitalAssets'
import { useDigitalAssets } from '@/contexts/DigitalAssetsContext'
import { cn } from '@/lib/utils'
import { SuccessToast } from './success-toast'
import { QrCode, Download, Copy, Settings, Info, MapPin, Building, Calendar, Hash, CheckCircle, X } from 'lucide-react'

interface QRCodeGeneratorProps {
  assetId?: string;
  className?: string;
}

export function QRCodeGenerator({ assetId, className }: QRCodeGeneratorProps) {
  const { assets, fetchAssets, fetchAssetByTagId, getAssetIdFromTagId } = useDigitalAssets()
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

    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateQRCode(inputAssetId, {
        size,
        includeUrl
      })
      setQrCodeData(result)
      setSuccessMessage('QR code generated successfully!')
      setShowSuccessToast(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code')
    } finally {
      setIsGenerating(false)
    }
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
    
    const fullUrl = `${window.location.origin}${qrCodeData.qrCode.shortUrl}`
    await navigator.clipboard.writeText(fullUrl)
    setSuccessMessage('QR code URL copied to clipboard!')
    setShowSuccessToast(true)
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
            <QrCode className="h-5 w-5" />
            Generate QR Code
          </CardTitle>
          <CardDescription>
            Generate a QR code for your digital asset
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <img
                  src={`${window.location.origin}${qrCodeData.qrCode.url}`}
                  alt={`QR Code for ${qrCodeData.qrCode.data.tagId}`}
                  className="w-64 h-64 object-contain"
                />
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
                value={`${window.location.origin}${qrCodeData.qrCode.shortUrl}`}
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