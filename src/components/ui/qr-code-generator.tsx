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
import { generateQRCode, type QRCodeGenerationResponse } from '@/lib/DigitalAssets'
import { useDigitalAssets } from '@/contexts/DigitalAssetsContext'
import { cn } from '@/lib/utils'
import { SuccessToast } from './success-toast'
import { QrCode, MapPin, Building, Hash, CheckCircle, X, Search } from 'lucide-react'

// API Base URL constant
const API_BASE_URL = 'http://192.168.0.5:5021'

interface QRCodeGeneratorProps {
  className?: string;
}

export function QRCodeGenerator({ className }: QRCodeGeneratorProps) {
  const { assets, fetchAssets, loading: assetsLoading } = useDigitalAssets()
  const [size, setSize] = useState(300)
  const [includeUrl, setIncludeUrl] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const [qrCodeData, setQrCodeData] = useState<QRCodeGenerationResponse | null>(null)
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
      
      // Use the _id for QR code generation
      const assetId = selectedAsset._id
      setMappedAssetId(assetId)
      
      // Don't auto-generate QR code - user must click generate button
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process selected asset')
      console.error('Error processing selected asset:', err)
    }
  }

  const handleClearAsset = () => {
    setSelectedAssetId('')
    setMappedAssetId('')
    setSelectedAssetFromDropdown('')
    setQrCodeData(null)
    setError(null)
  }

  const handleGenerateQRCode = async (assetIdToUse?: string) => {
    const assetId = assetIdToUse || mappedAssetId
    
    if (!assetId) {
      setError('Please select an asset from the dropdown')
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
      
      <Card className="shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500">
              <QrCode className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">
                QR Code Generator
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Select an asset and generate a professional QR code for digital asset tracking
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
                <span>Select an asset and click "Generate QR Code"</span>
              </div>
            </div>
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
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Asset Selection Feedback */}
          {selectedAssetId && !qrCodeData && (
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">
                    Asset Selected: <strong>{selectedAssetId}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ready to generate QR code. Click the button below to proceed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <Label className="text-sm font-semibold">Step 2: Generate QR Code</Label>
            </div>
            
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !selectedAssetId}
              className="w-full h-11 text-base font-semibold"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating QR Code...</span>
                </div>
              ) : selectedAssetId ? (
                <div className="flex items-center space-x-2">
                  <QrCode className="h-5 w-5" />
                  <span>Generate QR Code for {selectedAssetId}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <QrCode className="h-5 w-5" />
                  <span>Generate QR Code</span>
                </div>
              )}
            </Button>
          </div>

        </CardContent>
      </Card>

      {qrCodeData && (
        <Card className="shadow-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-500">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">
                    Generated QR Code
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    QR code generated successfully for asset {qrCodeData.qrCode.data.tagId}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {qrCodeData.qrCode.data.tagId}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="relative border-2 border-dashed border-border rounded-lg p-8 bg-muted/30">
                {/* QR Code Scanner Frame */}
                <div className="relative w-80 h-80 bg-white rounded-lg shadow-sm overflow-hidden border border-border">
                  {/* Scanner Corner Indicators */}
                  <div className="absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 border-green-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 border-green-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 border-green-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 border-green-500 rounded-br-lg"></div>
                  
                  {/* QR Code Image */}
                  <div className="flex items-center justify-center w-full h-full p-6">
                    {imageLoading && (
                      <div className="flex items-center justify-center w-64 h-64 bg-muted/50 rounded-lg">
                        <div className="text-center text-muted-foreground">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-sm font-medium">Loading QR Code...</p>
                        </div>
                      </div>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                              <div class="flex items-center justify-center w-64 h-64 bg-muted/50 rounded-lg">
                                <div class="text-center text-muted-foreground">
                                  <p class="text-sm font-medium">QR Code Image</p>
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
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 text-foreground rounded-full text-sm font-semibold shadow-sm">
                    <QrCode className="h-4 w-4" />
                    Tag ID: {qrCodeData.qrCode.data.tagId}
                  </div>
                </div>
              </div>
            </div>

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
                      <p className="text-sm font-medium">{qrCodeData.qrCode.data.assetType || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand</Label>
                      <p className="text-sm font-medium">{qrCodeData.qrCode.data.brand}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</Label>
                      <p className="text-sm font-medium">{qrCodeData.qrCode.data.model}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</Label>
                      <Badge 
                        variant={qrCodeData.qrCode.data.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs px-2 py-1"
                      >
                        {qrCodeData.qrCode.data.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</Label>
                      <Badge 
                        variant={qrCodeData.qrCode.data.priority === 'high' ? 'destructive' : 'secondary'}
                        className="text-xs px-2 py-1"
                      >
                        {qrCodeData.qrCode.data.priority}
                      </Badge>
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
                      <p className="text-sm font-medium">{qrCodeData.qrCode.data.location.building}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Floor</Label>
                      <p className="text-sm font-medium">{qrCodeData.qrCode.data.location.floor}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Room</Label>
                      <p className="text-sm font-medium">{qrCodeData.qrCode.data.location.room}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project</Label>
                      <p className="text-sm font-medium">{qrCodeData.qrCode.data.projectName}</p>
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
                    QR Code Generated Successfully!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The QR code is ready for use. You can scan it to access asset information.
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