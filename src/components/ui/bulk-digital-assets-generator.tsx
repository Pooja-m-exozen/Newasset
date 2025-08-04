'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Badge } from './badge'
import { Separator } from './separator'
import { generateAllDigitalAssets, type BulkDigitalAssetsGenerationResponse } from '@/lib/DigitalAssets'
import { useDigitalAssets } from '@/contexts/DigitalAssetsContext'
import { cn } from '@/lib/utils'
import { SuccessToast } from './success-toast'
import { QrCode, Barcode, Wifi, Info, Hash, MapPin, Building, Calendar, User, Settings, Shield, Activity, Package, CheckCircle, X, Search } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

// API Base URL constant
const API_BASE_URL = 'http://192.168.0.5:5021'

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
  const { assets, fetchAssets, fetchAssetByTagId, getAssetIdFromTagId, loading: assetsLoading } = useDigitalAssets()
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
      
      // Use the _id for digital assets generation
      const assetId = selectedAsset._id
      setMappedAssetId(assetId)
      
      // Don't auto-generate digital assets - user must click generate button
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process selected asset')
      console.error('Error processing selected asset:', err)
    }
  }

  const handleClearAsset = () => {
    setSelectedAssetId('')
    setMappedAssetId('')
    setSelectedAssetFromDropdown('')
    setDigitalAssets(null)
    setError(null)
  }

  const handleGenerateAllDigitalAssets = async (assetIdToUse?: string) => {
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
      setImageLoading(true) // Start loading the images
      setSuccessMessage('All digital assets generated successfully!')
      setShowSuccessToast(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate digital assets')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerate = async () => {
    await handleGenerateAllDigitalAssets()
  }

  // Filter assets based on search term
  const filteredAssets = assets.filter(asset => 
    asset.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.assetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.model.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedFormat = BARCODE_FORMATS.find(f => f.value === barcodeFormat)

  return (
    <div className={cn("space-y-6", className)}>
      {showSuccessToast && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccessToast(false)}
        />
      )}
      
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Bulk Digital Assets Generator
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
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
              <Label className="text-sm font-semibold text-gray-700">Step 1: Select Asset</Label>
            </div>
            
            {assetsLoading && (
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium text-blue-700">Loading assets from API...</span>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="🔍 Search assets by tag ID, type, brand, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  disabled={assetsLoading}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Select value={selectedAssetFromDropdown} onValueChange={handleAssetSelect}>
                <SelectTrigger className="h-12 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder={assetsLoading ? "⏳ Loading assets..." : "📋 Choose an asset from the list"} />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {assetsLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm">Loading assets...</p>
                    </div>
                  ) : filteredAssets.length > 0 ? (
                    filteredAssets.map((asset) => (
                      <SelectItem key={asset._id} value={asset.tagId} className="py-3">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{asset.tagId}</span>
                            <Badge 
                              variant={asset.status === 'active' ? 'default' : 'secondary'} 
                              className="text-xs px-2 py-1"
                            >
                              {asset.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p className="font-medium">{asset.assetType} - {asset.brand} {asset.model}</p>
                            <p className="flex items-center space-x-1">
                              <Building className="h-3 w-3" />
                              <span>{asset.location.building}, {asset.location.floor}</span>
                            </p>
                            <p className="text-blue-600 font-mono text-xs">ID: {asset._id}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">
                        {searchTerm ? '🔍 No assets found matching your search.' : '📭 No assets available.'}
                      </p>
                    </div>
                  )}
                </SelectContent>
              </Select>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {assetsLoading ? 'Loading...' : `${filteredAssets.length} of ${assets.length} assets shown`}
                </span>
                <span>Select an asset and click "Generate All Digital Assets"</span>
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
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Asset Selection Feedback */}
          {selectedAssetId && !digitalAssets && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Asset Selected: <strong>{selectedAssetId}</strong>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
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
              <Label className="text-sm font-semibold text-gray-700">Step 2: Generate All Digital Assets</Label>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !selectedAssetId}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
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
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">QR Code</p>
                    <p className="text-sm text-green-700">Generated successfully</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Barcode</p>
                    <p className="text-sm text-blue-700">Generated successfully</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
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
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">QR Code</CardTitle>
                  <CardDescription className="text-gray-600 mt-1">
                    QR code for asset {digitalAssets.digitalAssets.qrCode.data.tagId}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gradient-to-br from-gray-50 to-white shadow-inner">
                  <div className="relative w-64 h-64 bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-white">
                    <img
                      src={`${API_BASE_URL}${digitalAssets.digitalAssets.qrCode.url}`}
                      alt={`QR Code for ${digitalAssets.digitalAssets.qrCode.data.tagId}`}
                      className="w-full h-full object-contain p-4"
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Barcode Preview */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600">
                  <Barcode className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">Barcode</CardTitle>
                  <CardDescription className="text-gray-600 mt-1">
                    Barcode for asset {digitalAssets.digitalAssets.barcode.data}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gradient-to-br from-gray-50 to-white shadow-inner">
                  <div className="relative w-80 h-40 bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-white">
                    <img
                      src={`${API_BASE_URL}${digitalAssets.digitalAssets.barcode.url}`}
                      alt={`Barcode for ${digitalAssets.digitalAssets.barcode.data}`}
                      className="w-full h-full object-contain p-4"
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NFC Data Preview */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
                  <Wifi className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">NFC Data</CardTitle>
                  <CardDescription className="text-gray-600 mt-1">
                    NFC data for asset {digitalAssets.digitalAssets.nfcData.data.id}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gradient-to-br from-gray-50 to-white shadow-inner">
                  <div className="relative w-80 h-48 bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-white">
                    <div className="flex items-center justify-center w-full h-full p-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Wifi className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">NFC Data Ready</h3>
                        <p className="text-sm text-gray-600 mb-4">Tap to read asset information</p>
                        <div className="space-y-2 text-xs text-gray-500">
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
                <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-md bg-purple-100">
                        <Wifi className="h-4 w-4 text-purple-600" />
                      </div>
                      <CardTitle className="text-lg font-semibold text-gray-900">NFC Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</Label>
                        <p className="text-sm font-medium text-gray-900">{digitalAssets.digitalAssets.nfcData.data.type}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Asset ID</Label>
                        <p className="text-sm font-medium text-gray-900 font-mono">{digitalAssets.digitalAssets.nfcData.data.id}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Brand</Label>
                        <p className="text-sm font-medium text-gray-900">{digitalAssets.digitalAssets.nfcData.data.brand}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Model</Label>
                        <p className="text-sm font-medium text-gray-900">{digitalAssets.digitalAssets.nfcData.data.model}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</Label>
                        <Badge 
                          variant={digitalAssets.digitalAssets.nfcData.data.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs px-2 py-1"
                        >
                          {digitalAssets.digitalAssets.nfcData.data.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</Label>
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
                <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-blue-50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-md bg-indigo-100">
                        <Settings className="h-4 w-4 text-indigo-600" />
                      </div>
                      <CardTitle className="text-lg font-semibold text-gray-900">Technical Details</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Timestamp</Label>
                        <p className="text-sm font-medium text-gray-900 font-mono">
                          {new Date(digitalAssets.digitalAssets.nfcData.data.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Checksum</Label>
                        <p className="text-sm font-medium text-gray-900 font-mono">
                          {digitalAssets.digitalAssets.nfcData.data.checksum.substring(0, 8)}...
                        </p>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Signature</Label>
                        <p className="text-sm font-medium text-gray-900 font-mono">
                          {digitalAssets.digitalAssets.nfcData.data.signature.substring(0, 16)}...
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned To</Label>
                        <p className="text-sm font-medium text-gray-900">{digitalAssets.digitalAssets.nfcData.data.assignedTo}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Project</Label>
                        <p className="text-sm font-medium text-gray-900">{digitalAssets.digitalAssets.nfcData.data.projectName}</p>
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
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-md bg-blue-100">
                    <Hash className="h-4 w-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Asset Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</Label>
                    <p className="text-sm font-medium text-gray-900">{digitalAssets.digitalAssets.qrCode.data.assetType}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Brand</Label>
                    <p className="text-sm font-medium text-gray-900">{digitalAssets.digitalAssets.qrCode.data.brand}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Model</Label>
                    <p className="text-sm font-medium text-gray-900">{digitalAssets.digitalAssets.qrCode.data.model}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</Label>
                    <Badge 
                      variant={digitalAssets.digitalAssets.qrCode.data.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs px-2 py-1"
                    >
                      {digitalAssets.digitalAssets.qrCode.data.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</Label>
                    <Badge 
                      variant={digitalAssets.digitalAssets.qrCode.data.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs px-2 py-1"
                    >
                      {digitalAssets.digitalAssets.qrCode.data.priority}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned To</Label>
                    <p className="text-sm font-medium text-gray-900">{digitalAssets.digitalAssets.qrCode.data.assignedTo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Information Card */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-md bg-green-100">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Location Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Building</Label>
                    <p className="text-sm font-medium text-gray-900">{digitalAssets.digitalAssets.qrCode.data.location.building}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Floor</Label>
                    <p className="text-sm font-medium text-gray-900">{digitalAssets.digitalAssets.qrCode.data.location.floor}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Room</Label>
                    <p className="text-sm font-medium text-gray-900">{digitalAssets.digitalAssets.qrCode.data.location.room}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Project</Label>
                    <p className="text-sm font-medium text-gray-900">{digitalAssets.digitalAssets.qrCode.data.projectName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Success Message */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  All Digital Assets Generated Successfully!
                </p>
                <p className="text-xs text-green-600 mt-1">
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