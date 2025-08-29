'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Badge } from './badge'
import { generateAllDigitalAssets, type BulkDigitalAssetsGenerationResponse } from '@/lib/DigitalAssets'

import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { SuccessToast } from './success-toast'
import { QrCode, Barcode, Wifi, Info, Hash, MapPin, Settings, Package, CheckCircle, Search } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

// API Base URL constant
const API_BASE_URL = 'http://192.168.0.5:5021'

interface BulkDigitalAssetsGeneratorProps {
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

const BARCODE_FORMATS = [
  { value: 'code128', label: 'Code 128', description: 'Most common format, supports all ASCII characters' },
  { value: 'code39', label: 'Code 39', description: 'Industrial standard, numbers and uppercase letters' },
  { value: 'ean13', label: 'EAN-13', description: 'European Article Number, 13 digits' },
  { value: 'ean8', label: 'EAN-8', description: 'European Article Number, 8 digits' },
  { value: 'upca', label: 'UPC-A', description: 'Universal Product Code, 12 digits' },
  { value: 'upce', label: 'UPC-E', description: 'Universal Product Code, 8 digits' },
]

export function BulkDigitalAssetsGenerator({ className }: BulkDigitalAssetsGeneratorProps) {
  const { user } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [assetsLoading, setAssetsLoading] = useState(false)
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

      const response = await fetch('http://192.168.0.5:5021/api/assets', {
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
        console.log(`Asset ${asset.tagId}: projectName=${asset.projectName}, project.projectName=${asset.project?.projectName}, userProject=${user.projectName}`)
        return assetProjectName === user.projectName
      })

      console.log(`Found ${userAssets.length} assets for project: ${user.projectName}`)
      console.log('All assets before filtering:', allAssets.map(a => ({ tagId: a.tagId, projectName: a.projectName, project: a.project })))
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
      // Refresh assets to reflect newly stored digital assets
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
  }, [mappedAssetId, qrSize, barcodeFormat, fetchAssets, qrImageLoading, barcodeImageLoading])

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
      
      {/* Project Info Banner */}
      {user?.projectName && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-blue-700">
              Currently working with project: <span className="font-bold">{user.projectName}</span>
            </span>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                Bulk Digital Assets Generator
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                Select an asset from your project and generate QR code, barcode, and NFC data simultaneously
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Asset Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <Label className="text-sm font-medium text-gray-700">Step 1: Select Asset</Label>
            </div>
            
            {assetsLoading && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-600">Loading assets...</span>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="Search assets by tag ID, type, brand, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 text-sm"
                  disabled={assetsLoading}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Select value={selectedAssetFromDropdown} onValueChange={handleAssetSelect}>
                <SelectTrigger className="h-10 text-sm w-full">
                  <SelectValue placeholder={assetsLoading ? "Loading assets..." : "Choose an asset from the list"} />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {assetsLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto mb-2"></div>
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
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">
                        {searchTerm ? 'No assets found matching your search.' : 'No assets available.'}
                      </p>
                    </div>
                  )}
                </SelectContent>
              </Select>
              
              <div className="text-center text-xs text-gray-500">
                {assetsLoading ? 'Loading...' : (
                  assets.length === 0 ? (
                    <span className="text-red-500">No assets found for project: {user?.projectName}</span>
                  ) : (
                    <span>{filteredAssets.length} assets available</span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Configuration Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qrSize" className="text-sm font-medium text-gray-700">QR Code Size (px)</Label>
              <Input
                id="qrSize"
                type="number"
                min="100"
                max="1000"
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
                className="h-9"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="barcodeFormat" className="text-sm font-medium text-gray-700">Barcode Format</Label>
              <Select value={barcodeFormat} onValueChange={setBarcodeFormat}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {BARCODE_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{format.label}</span>
                        <span className="text-xs text-gray-500">{format.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedFormat && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Bulk Generation</p>
                  <p className="text-blue-700">
                    This will generate QR code, barcode, and NFC data simultaneously. 
                    All assets will be created with consistent asset information.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Asset Selection Feedback */}
          {selectedAssetId && !digitalAssets && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Asset Selected: <strong>{selectedAssetId}</strong>
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Ready to generate all digital assets. Click the button below to proceed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <Label className="text-sm font-medium text-gray-700">Step 2: Generate All Digital Assets</Label>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !selectedAssetId}
              className="w-full h-10 text-sm font-medium"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </div>
              ) : selectedAssetId ? (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>Generate for {selectedAssetId}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
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
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Generated Digital Assets
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-1">
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
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">QR Code</p>
                    <p className="text-xs text-gray-600">Generated successfully</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Barcode</p>
                    <p className="text-xs text-gray-600">Generated successfully</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="font-medium text-sm">NFC Data</p>
                    <p className="text-xs text-gray-600">Generated successfully</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Preview */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <QrCode className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">QR Code</CardTitle>
                  <CardDescription className="text-gray-600 mt-1">
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
                  className="flex items-center gap-2 h-8 text-xs"
                >
                  <Search className="h-3 w-3" />
                  <span>Refresh</span>
                </Button>
              </div>
              <div className="flex justify-center">
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                  <div className="relative w-56 h-56 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                    {/* QR Code Image with Loading State */}
                    <div className="flex items-center justify-center w-full h-full p-4 qr-code-container">
                      {qrImageLoading && (
                        <div className="flex items-center justify-center w-48 h-48 bg-gray-100 rounded-lg">
                          <div className="text-center text-gray-600">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                            <p className="text-sm font-medium">Loading QR Code...</p>
                          </div>
                        </div>
                      )}
                      <Image
                        src={`${API_BASE_URL}${digitalAssets.digitalAssets.qrCode.url}`}
                        alt={`QR Code for ${digitalAssets.digitalAssets.qrCode.data.tagId}`}
                        width={192}
                        height={192}
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
                              <div class="flex items-center justify-center w-48 h-48 bg-gray-100 rounded-lg">
                                <div class="text-center text-gray-600">
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
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      <QrCode className="h-3 w-3" />
                      Tag ID: {digitalAssets.digitalAssets.qrCode.data.tagId}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Barcode Preview */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Barcode className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Barcode</CardTitle>
                  <CardDescription className="text-gray-600 mt-1">
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
                  className="flex items-center gap-2 h-8 text-xs"
                >
                  <Search className="h-3 w-3" />
                  <span>Refresh</span>
                </Button>
              </div>
              <div className="flex justify-center">
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                  <div className="relative w-72 h-36 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                    {/* Barcode Image with Loading State */}
                    <div className="flex items-center justify-center w-full h-full p-4 barcode-image-container">
                      {barcodeImageLoading && (
                        <div className="flex items-center justify-center w-56 h-28 bg-gray-100 rounded-lg">
                          <div className="text-center text-gray-600">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                            <p className="text-sm font-medium">Loading Barcode...</p>
                          </div>
                        </div>
                      )}
                      <Image
                        src={`${API_BASE_URL}${digitalAssets.digitalAssets.barcode.url}`}
                        alt={`Barcode for ${digitalAssets.digitalAssets.barcode.data}`}
                        width={224}
                        height={112}
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
                              <div class="flex items-center justify-center w-56 h-28 bg-gray-100 rounded-lg">
                                <div class="text-center text-gray-600">
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
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      <Barcode className="h-3 w-3" />
                      Tag ID: {digitalAssets.digitalAssets.barcode.data}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NFC Data Preview */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Wifi className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">NFC Data</CardTitle>
                  <CardDescription className="text-gray-600 mt-1">
                    NFC data for asset {digitalAssets.digitalAssets.nfcData.data.id}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                  <div className="relative w-72 h-40 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                    <div className="flex items-center justify-center w-full h-full p-4">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Wifi className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-base font-semibold mb-2">NFC Data Ready</h3>
                        <p className="text-sm text-gray-600 mb-3">Tap to read asset information</p>
                        <div className="space-y-1 text-xs text-gray-600">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* NFC Basic Info Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-purple-100">
                        <Wifi className="h-4 w-4 text-purple-600" />
                      </div>
                      <CardTitle className="text-base font-semibold">NFC Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Type</Label>
                        <p className="text-sm font-medium">{digitalAssets.digitalAssets.nfcData.data.type}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Asset ID</Label>
                        <p className="text-sm font-medium font-mono">{digitalAssets.digitalAssets.nfcData.data.id}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Brand</Label>
                        <p className="text-sm font-medium">{digitalAssets.digitalAssets.nfcData.data.brand}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Model</Label>
                        <p className="text-sm font-medium">{digitalAssets.digitalAssets.nfcData.data.model}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Status</Label>
                        <Badge 
                          variant={digitalAssets.digitalAssets.nfcData.data.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs px-2 py-1"
                        >
                          {digitalAssets.digitalAssets.nfcData.data.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Priority</Label>
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
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-blue-100">
                        <Settings className="h-4 w-4 text-blue-600" />
                      </div>
                      <CardTitle className="text-base font-semibold">Technical Details</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Timestamp</Label>
                        <p className="text-sm font-medium font-mono">
                          {new Date(digitalAssets.digitalAssets.nfcData.data.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Checksum</Label>
                        <p className="text-sm font-medium font-mono">
                          {digitalAssets.digitalAssets.nfcData.data.checksum.substring(0, 8)}...
                        </p>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Signature</Label>
                        <p className="text-sm font-medium font-mono">
                          {digitalAssets.digitalAssets.nfcData.data.signature.substring(0, 16)}...
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Assigned To</Label>
                        <p className="text-sm font-medium">{digitalAssets.digitalAssets.nfcData.data.assignedTo}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Project</Label>
                        <p className="text-sm font-medium">{digitalAssets.digitalAssets.nfcData.data.projectName}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Asset Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Asset Information Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-100">
                    <Hash className="h-4 w-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Asset Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Type</Label>
                    <p className="text-sm font-medium">{digitalAssets.digitalAssets.qrCode.data.assetType}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Brand</Label>
                    <p className="text-sm font-medium">{digitalAssets.digitalAssets.qrCode.data.brand}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Model</Label>
                    <p className="text-sm font-medium">{digitalAssets.digitalAssets.qrCode.data.model}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Status</Label>
                    <Badge 
                      variant={digitalAssets.digitalAssets.qrCode.data.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs px-2 py-1"
                    >
                      {digitalAssets.digitalAssets.qrCode.data.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Priority</Label>
                    <Badge 
                      variant={digitalAssets.digitalAssets.qrCode.data.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs px-2 py-1"
                    >
                      {digitalAssets.digitalAssets.qrCode.data.priority}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Assigned To</Label>
                    <p className="text-sm font-medium">{digitalAssets.digitalAssets.qrCode.data.assignedTo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Information Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-green-100">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Location Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Building</Label>
                    <p className="text-sm font-medium">{digitalAssets.digitalAssets.qrCode.data.location?.building || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Floor</Label>
                    <p className="text-sm font-medium">{digitalAssets.digitalAssets.qrCode.data.location?.floor || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Room</Label>
                    <p className="text-sm font-medium">{digitalAssets.digitalAssets.qrCode.data.location?.room || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Project</Label>
                      <p className="text-sm font-medium">{digitalAssets.digitalAssets.qrCode.data.projectName || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Success Message */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  All Digital Assets Generated Successfully!
                </p>
                <p className="text-xs text-green-700 mt-1">
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