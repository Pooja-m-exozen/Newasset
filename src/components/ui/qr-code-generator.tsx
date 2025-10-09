'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Checkbox } from './checkbox'
import { Badge } from './badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { generateQRCode } from '@/lib/DigitalAssets'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { SuccessToast } from './success-toast'
import { QrCode, Hash, CheckCircle, Search, Scan, Download, Copy, Clock, Globe, Smartphone } from 'lucide-react'
import Image from 'next/image'

// API Base URL constant
const API_BASE_URL = 'https://digitalasset.zenapi.co.in'

interface QRCodeGeneratorProps {
  className?: string;
}

// Asset interface
interface Asset {
  _id: string;
  tagId: string;
  assetType: string;
  brand: string;
  model?: string;
  status?: string;
  project?: {
    projectName: string;
  };
  projectName?: string;
}

// Scanned data interface
interface ScannedData {
  t?: string;
  tagId?: string;
  a?: string;
  assetType?: string;
  b?: string;
  brand?: string;
  m?: string;
  model?: string;
  st?: string;
  status?: string;
  p?: string;
  priority?: string;
  l?: {
    building?: string;
    floor?: string;
    room?: string;
    latitude?: string;
    longitude?: string;
  };
  location?: {
    building?: string;
    floor?: string;
    room?: string;
  };
  pr?: string;
  projectName?: string;
  ts?: number;
  c?: string;
  u?: string;
  url?: string;
}

// QR code data interface
interface QRCodeData {
  qrCode: {
    data: ScannedData;
    url: string;
    shortUrl: string;
  };
}

export function QRCodeGenerator({ className }: QRCodeGeneratorProps) {
  const { user } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [size, setSize] = useState(300)
  const [includeUrl, setIncludeUrl] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<ScannedData | null>(null)

  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedAssetId, setSelectedAssetId] = useState<string>('')
  const [mappedAssetId, setMappedAssetId] = useState<string>('')
  const [selectedAssetFromDropdown, setSelectedAssetFromDropdown] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [imageLoading, setImageLoading] = useState(false)

  // Fetch assets from API and filter by user's project
  const fetchAssets = useCallback(async () => {
    try {
      setAssetsLoading(true)
      
      if (!user?.projectName) {
        console.warn('User project not found')
        return
      }

      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
      if (!token) {
        console.warn('Authentication token not found')
        return
      }

      const response = await fetch('https://digitalasset.zenapi.co.in/api/assets', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.status}`)
      }

      const data = await response.json()
      
      let allAssets: Asset[] = []
      
      // Extract assets from response
      if (data.success && data.assets) {
        allAssets = data.assets
      } else if (data.assets) {
        allAssets = data.assets
      } else if (Array.isArray(data)) {
        allAssets = data
      } else {
        const possibleAssets = data.data || data.items || data.results || []
        if (Array.isArray(possibleAssets)) {
          allAssets = possibleAssets
        }
      }

      // Filter assets by user's project name
      const userAssets = allAssets.filter((asset: Asset) => {
        // Check both the old projectName property and the new nested project structure
        const assetProjectName = asset.project?.projectName || asset.projectName
        return assetProjectName === user.projectName
      })

      console.log(`Found ${userAssets.length} assets for project: ${user.projectName}`)
      setAssets(userAssets)
    } catch (err) {
      console.error('Error fetching assets:', err)
    } finally {
      setAssetsLoading(false)
    }
  }, [user?.projectName])

  // Load assets on component mount
  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  // Memoized filtered assets for better performance
  const filteredAssets = useMemo(() => 
    assets.filter(asset => 
      asset.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.model && asset.model.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [assets, searchTerm]
  )

  // Handle asset selection from dropdown - optimized with useCallback
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
      
      // Use the _id for QR code generation
      const assetId = selectedAsset._id
      setMappedAssetId(assetId)
      
      // Don't auto-generate QR code - user must click generate button
    } catch {
      setError('Failed to process selected asset')
      console.error('Error processing selected asset')
    }
  }, [assets])

  const handleGenerateQRCode = useCallback(async (assetIdToUse?: string) => {
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
    } catch {
      setError('Failed to generate QR code')
    } finally {
      setIsGenerating(false)
    }
  }, [mappedAssetId, size, includeUrl])

  const handleGenerate = useCallback(async () => {
    await handleGenerateQRCode()
  }, [handleGenerateQRCode])

  // Fast Scanner Simulation
  const handleFastScan = useCallback(() => {
    if (!qrCodeData) return
    
    setIsScanning(true)
    
    // Simulate fast scanning with the generated QR data
    setTimeout(() => {
      setScannedData(qrCodeData.qrCode.data)
      setIsScanning(false)
      setSuccessMessage('QR Code scanned successfully! Asset details loaded.')
      setShowSuccessToast(true)
    }, 800) // Fast scan simulation
  }, [qrCodeData])

  // Copy to clipboard functionality
  const handleCopyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccessMessage(`${label} copied to clipboard!`)
      setShowSuccessToast(true)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }, [])

  // Download QR Code
  const handleDownloadQR = useCallback(async () => {
    if (!qrCodeData) return
    
    try {
      const response = await fetch(`${API_BASE_URL}${qrCodeData.qrCode.url}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `QR_${qrCodeData.qrCode.data.t || 'ASSET'}_${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setSuccessMessage('QR Code downloaded successfully!')
      setShowSuccessToast(true)
    } catch {
      setError('Failed to download QR Code')
    }
  }, [qrCodeData])

  // Optimized image error handling
  const handleImageError = useCallback(() => {
    console.error('Failed to load QR code image')
    setImageLoading(false)
    // Fallback to a placeholder
    const parentElement = document.querySelector('.qr-code-image-container')
    if (parentElement) {
      parentElement.innerHTML = `
        <div class="flex items-center justify-center w-64 h-64 bg-muted/50 rounded-lg">
          <div class="text-center text-muted-foreground">
            <p class="text-sm font-medium">QR Code Image</p>
            <p class="text-xs">Failed to load</p>
            <p class="text-xs mt-2">URL: ${API_BASE_URL}${qrCodeData?.qrCode.url}</p>
          </div>
        </div>
      `
    }
  }, [qrCodeData?.qrCode.url])

  // Optimized image load handling
  const handleImageLoad = useCallback(() => {
    setImageLoading(false)
  }, [])

  // Format timestamp to readable date
  const formatTimestamp = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }, [])

  return (
    <div className={cn("space-y-4", className)}>
      {showSuccessToast && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccessToast(false)}
        />
      )}
      

      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">QR Code Generator & Scanner</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Select an asset, generate a professional QR code, and scan it for instant asset details
            </p>
            </div>
          <div className="p-4 space-y-4">
          {/* Asset Selection Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Select Asset</Label>
            
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
                  <SelectTrigger className="h-11 text-sm">
                    <SelectValue placeholder={assetsLoading ? '⏳ Loading assets...' : '📋 Choose an asset from the list'} />
                  </SelectTrigger>
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {assetsLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm">Loading assets...</p>
                    </div>
                  ) : filteredAssets.length > 0 ? (
                    filteredAssets.map((asset) => (
                      <SelectItem key={asset._id} value={asset.tagId} className="py-2">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{asset.tagId}</span>
                          <Badge 
                            variant={asset.status === 'active' ? 'default' : 'secondary'} 
                            className="text-xs px-2 py-0.5"
                          >
                            {asset.status}
                          </Badge>
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
              
              <div className="text-center text-xs text-gray-500">
                {assetsLoading ? 'Loading...' : (
                  assets.length === 0 ? (
                    <span className="text-red-500">No assets found</span>
                  ) : (
                    <span>{filteredAssets.length} assets available</span>
                  )
                )}
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
            <div className="space-y-3">
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !selectedAssetId}
                className="w-full h-10 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isGenerating ? (
                  <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating QR Code...</span>
                </div>
              ) : selectedAssetId ? (
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                  <span>Generate QR Code for {selectedAssetId}</span>
                </div>
              ) : (
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                  <span>Generate QR Code</span>
                </div>
              )}
            </Button>
          </div>
          </div>
        </CardContent>
      </Card>

      {qrCodeData && (
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Generated QR Code
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    QR code generated successfully for asset {qrCodeData.qrCode.data.t || qrCodeData.qrCode.data.tagId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {qrCodeData.qrCode.data.t || qrCodeData.qrCode.data.tagId}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFastScan}
                  disabled={isScanning}
                    className="flex items-center gap-2"
                >
                  <Scan className="h-4 w-4" />
                  <span>{isScanning ? 'Scanning...' : 'Fast Scan'}</span>
                </Button>
              </div>
            </div>
            </div>
          </CardContent>
          <CardContent className="space-y-6">
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
                  <div className="flex items-center justify-center w-full h-full p-6 qr-code-image-container">
                    {imageLoading && (
                      <div className="flex items-center justify-center w-64 h-64 bg-muted/50 rounded-lg">
                        <div className="text-center text-muted-foreground">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-sm font-medium">Loading QR Code...</p>
                        </div>
                      </div>
                    )}
                    <Image
                      src={`${API_BASE_URL}${qrCodeData.qrCode.url}`}
                      alt={`QR Code Scanner for ${qrCodeData.qrCode.data.t || qrCodeData.qrCode.data.tagId}`}
                      width={256}
                      height={256}
                      className={`object-contain ${imageLoading ? 'hidden' : ''}`}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      priority={true}
                      loading="eager"
                    />
                  </div>
                  
                  {/* Scanning Animation */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
                </div>
                
                {/* Tag ID Display */}
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 text-foreground rounded-full text-sm font-semibold shadow-sm">
                    <QrCode className="h-4 w-4" />
                    Tag ID: {qrCodeData.qrCode.data.t || qrCodeData.qrCode.data.tagId}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={handleDownloadQR}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download QR</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCopyToClipboard(qrCodeData.qrCode.shortUrl, 'Asset URL')}
                className="flex items-center space-x-2"
              >
                <Copy className="h-4 w-4" />
                <span>Copy URL</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const tagId = qrCodeData.qrCode.data.t || qrCodeData.qrCode.data.tagId
                  if (tagId) handleCopyToClipboard(tagId, 'Tag ID')
                }}
                className="flex items-center space-x-2"
              >
                <Copy className="h-4 w-4" />
                <span>Copy Tag ID</span>
              </Button>
            </div>

            {/* Enhanced Asset Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Asset Information Card */}
              <Card className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Asset Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tag ID</Label>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium font-mono">{qrCodeData.qrCode.data.t || qrCodeData.qrCode.data.tagId}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const tagId = qrCodeData.qrCode.data.t || qrCodeData.qrCode.data.tagId
                            if (tagId) handleCopyToClipboard(tagId, 'Tag ID')
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</Label>
                      <p className="text-sm font-medium">{qrCodeData.qrCode.data.a || qrCodeData.qrCode.data.assetType || 'N/A'}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand</Label>
                      <p className="text-sm font-medium">{qrCodeData.qrCode.data.b || qrCodeData.qrCode.data.brand}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</Label>
                      <p className="text-sm font-medium">{qrCodeData.qrCode.data.m || qrCodeData.qrCode.data.model}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</Label>
                      <Badge 
                        variant={qrCodeData.qrCode.data.st === 'active' ? 'default' : 'secondary'}
                        className="text-xs px-2 py-1"
                      >
                        {qrCodeData.qrCode.data.st || qrCodeData.qrCode.data.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</Label>
                      <Badge 
                        variant={qrCodeData.qrCode.data.p === 'high' ? 'destructive' : 'secondary'}
                        className="text-xs px-2 py-1"
                      >
                        {qrCodeData.qrCode.data.p || qrCodeData.qrCode.data.priority}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Information Card */}
              <Card className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Location & Project</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Building</Label>
                      <p className="text-sm font-medium">{qrCodeData.qrCode.data.l?.building || qrCodeData.qrCode.data.location?.building || 'N/A'}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Floor</Label>
                      <p className="text-sm font-medium">{qrCodeData.qrCode.data.l?.floor || qrCodeData.qrCode.data.location?.floor || 'N/A'}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Room</Label>
                      <p className="text-sm font-medium">{qrCodeData.qrCode.data.l?.room || qrCodeData.qrCode.data.location?.room || 'N/A'}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Coordinates</Label>
                      <div className="text-right">
                        <p className="text-xs font-mono">
                          {qrCodeData.qrCode.data.l?.latitude && qrCodeData.qrCode.data.l?.longitude 
                            ? `${qrCodeData.qrCode.data.l.latitude}, ${qrCodeData.qrCode.data.l.longitude}`
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Details Card */}
              <Card className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Technical Info</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Generated</Label>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs font-mono">
                          {qrCodeData.qrCode.data.ts ? formatTimestamp(qrCodeData.qrCode.data.ts) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Checksum</Label>
                      <div className="flex items-center space-x-1">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs font-mono">
                          {qrCodeData.qrCode.data.c || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">URL</Label>
                      <div className="flex items-center space-x-1">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const url = qrCodeData.qrCode.data.url || qrCodeData.qrCode.data.u
                            if (url) handleCopyToClipboard(url, 'Asset URL')
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Short URL</Label>
                      <div className="flex items-center space-x-1">
                        <Smartphone className="h-3 w-3 text-muted-foreground" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(qrCodeData.qrCode.shortUrl, 'Short URL')}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
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
                    The QR code is ready for use. You can scan it to access asset information or use the Fast Scan button above.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanned Data Display */}
      {scannedData && (
        <Card className="border border-gray-200 dark:border-gray-700 bg-green-50/30">
          <CardContent className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-green-800">QR Code Scanned Successfully!</h3>
              <p className="text-sm text-green-700 mt-1">
                  Asset details loaded from scanned QR code
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-green-800">Asset Information</Label>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Tag ID:</span> {scannedData.t || scannedData.tagId}</p>
                    <p><span className="font-medium">Type:</span> {scannedData.a || scannedData.assetType}</p>
                    <p><span className="font-medium">Brand:</span> {scannedData.b || scannedData.brand}</p>
                    <p><span className="font-medium">Model:</span> {scannedData.m || scannedData.model}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-green-800">Status & Location</Label>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Status:</span> {scannedData.st || scannedData.status}</p>
                    <p><span className="font-medium">Priority:</span> {scannedData.p || scannedData.priority}</p>
                    <p><span className="font-medium">Building:</span> {scannedData.l?.building || scannedData.location?.building || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 