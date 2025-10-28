'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// Alert component not available, using custom div-based alerts
import { Checkbox } from '@/components/ui/checkbox'
import { Database, Download, Loader2, CheckCircle, XCircle, Package, Building } from 'lucide-react'
import { assetApi, Asset } from '@/lib/adminasset'
import { useAuth } from '@/contexts/AuthContext'

// API Base URL constant
const API_BASE_URL = 'https://digitalasset.zenapi.co.in'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SubAssetBulkGeneratorProps {
  // No props needed for this component
}

export function SubAssetBulkGenerator({}: SubAssetBulkGeneratorProps) {
  const { user } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  const [digitalTypes, setDigitalTypes] = useState<string[]>(['qr', 'barcode'])
  const [qrOptions, setQrOptions] = useState({ size: 400 })
  const [barcodeOptions, setBarcodeOptions] = useState({ scale: 3 })
  const [loading, setLoading] = useState(false)
  const [generatedAssets, setGeneratedAssets] = useState<Array<{
    success: boolean
    message: string
    generated?: {
      qrCode?: {
        url: string
        shortUrl: string
        data: Record<string, unknown>
        optimizedFor: string
        scanSettings: Record<string, unknown>
      }
      barcode?: {
        url: string
        data: string
        generatedAt: string
      }
    }
    tagId: string
    category: string
    subAssetIndex: number
  }>>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({})
  const [imageUrls, setImageUrls] = useState<{[key: string]: string}>({})

  // Fetch assets on component mount or when user changes
  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  // Load images as blobs when generatedAssets changes
  useEffect(() => {
    if (generatedAssets.length > 0) {
      generatedAssets.forEach((asset) => {
        if (asset.generated?.qrCode) {
          loadImageAsBlob(asset.generated.qrCode.url, `qr-${asset.tagId}`)
        }
        if (asset.generated?.barcode) {
          loadImageAsBlob(asset.generated.barcode.url, `barcode-${asset.tagId}`)
        }
      })
    }
  }, [generatedAssets])

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [imageUrls])

  const fetchAssets = useCallback(async () => {
    try {
      const response = await assetApi.getAllAssets()
      if (response.success && response.assets) {
        // Filter assets by user's project
        const userProjectName = user?.projectName?.trim().toLowerCase()
        const filteredAssets = userProjectName
          ? response.assets.filter((asset: Asset) => {
              const assetProjectName = (asset.project?.projectName || '').trim().toLowerCase()
              return assetProjectName === userProjectName
            })
          : response.assets
        
        setAssets(filteredAssets)
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  }, [user?.projectName])

  // Function to load image as blob and create object URL
  const loadImageAsBlob = async (imagePath: string, key: string) => {
    try {
      setImageLoadingStates(prev => ({ ...prev, [key]: true }))
      
      // Construct the full URL
      const fullUrl = imagePath.startsWith('http') 
        ? imagePath 
        : imagePath.startsWith('/') 
          ? `${API_BASE_URL}${imagePath}`
          : `${API_BASE_URL}/${imagePath}`
      
      console.log('Loading image as blob:', fullUrl)
      
      // Fetch the image as blob
      const response = await fetch(fullUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }
      
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      
      console.log('Image loaded successfully as blob:', key)
      setImageUrls(prev => ({ ...prev, [key]: objectUrl }))
      setImageLoadingStates(prev => ({ ...prev, [key]: false }))
      
    } catch (error) {
      console.error('Failed to load image as blob:', key, error)
      setImageLoadingStates(prev => ({ ...prev, [key]: false }))
    }
  }

  const selectedAssetData = assets.find(asset => asset.tagId === selectedAsset)
  const totalSubAssets = (selectedAssetData?.subAssets?.movable?.length || 0) + 
                        (selectedAssetData?.subAssets?.immovable?.length || 0)

  const handleDigitalTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setDigitalTypes(prev => [...prev, type])
    } else {
      setDigitalTypes(prev => prev.filter(t => t !== type))
    }
  }

  const handleBulkGenerate = async () => {
    if (!selectedAsset) {
      setError('Please select an asset')
      return
    }

    if (digitalTypes.length === 0) {
      setError('Please select at least one digital asset type')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      setGeneratedAssets([])

      const result = await assetApi.bulkGenerateSubAssetDigitalAssets(selectedAssetData?._id || selectedAsset, {
        digitalTypes,
        qr: qrOptions,
        barcode: barcodeOptions
      })

      if (result.success) {
        console.log('Bulk generation result:', result)
        console.log('Results array:', result.results)
        console.log('First result item structure:', result.results?.[0])
        console.log('First result generated structure:', result.results?.[0]?.generated)
        
        // Add a delay before showing assets to give server time to process images
        setTimeout(() => {
          setGeneratedAssets(result.results as Array<{
            success: boolean
            message: string
            generated?: {
              qrCode?: {
                url: string
                shortUrl: string
                data: Record<string, unknown>
                optimizedFor: string
                scanSettings: Record<string, unknown>
              }
              barcode?: {
                url: string
                data: string
                generatedAt: string
              }
            }
            tagId: string
            category: string
            subAssetIndex: number
          }> || [])
          setSuccess(`Successfully generated ${result.results?.length || 0} digital assets!`)
        }, 3000) // Wait 3 seconds for images to be processed and saved
        
        // Show immediate success message
        setSuccess('Digital assets generated! Processing images...')
      } else {
        setError(`Failed to generate digital assets: ${result.message}`)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate digital assets')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadAll = () => {
    generatedAssets.forEach(asset => {
      if (asset.generated?.qrCode) {
        const link = document.createElement('a')
        link.href = asset.generated.qrCode.url.startsWith('http') 
          ? asset.generated.qrCode.url 
          : asset.generated.qrCode.url.startsWith('/') 
            ? `${API_BASE_URL}${asset.generated.qrCode.url}`
            : `${API_BASE_URL}/${asset.generated.qrCode.url}`
        link.download = `qr_sub_${asset.tagId}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      if (asset.generated?.barcode) {
        const link = document.createElement('a')
        link.href = asset.generated.barcode.url.startsWith('http') 
          ? asset.generated.barcode.url 
          : asset.generated.barcode.url.startsWith('/') 
            ? `${API_BASE_URL}${asset.generated.barcode.url}`
            : `${API_BASE_URL}/${asset.generated.barcode.url}`
        link.download = `barcode_sub_${asset.tagId}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Sub-Asset Bulk Digital Assets Generator
          </CardTitle>
          <CardDescription>
            Generate digital assets for all sub-assets of a selected asset at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Asset Selection */}
          <div>
            <Label htmlFor="asset-select">Select Asset</Label>
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an asset" />
              </SelectTrigger>
              <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset._id || asset.tagId} value={asset.tagId}>
                      {asset.tagId} - {asset.assetType} 
                      ({asset.subAssets?.movable?.length || 0} movable, {asset.subAssets?.immovable?.length || 0} immovable)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedAssetData && (
              <p className="text-sm text-gray-600 mt-1">
                Total sub-assets: {totalSubAssets} 
                ({selectedAssetData.subAssets?.movable?.length || 0} movable, {selectedAssetData.subAssets?.immovable?.length || 0} immovable)
              </p>
            )}
          </div>

          {/* Digital Asset Types */}
          <div>
            <Label className="text-base font-semibold">Digital Asset Types</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="qr"
                  checked={digitalTypes.includes('qr')}
                  onCheckedChange={(checked) => handleDigitalTypeChange('qr', checked as boolean)}
                />
                <Label htmlFor="qr">QR Codes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="barcode"
                  checked={digitalTypes.includes('barcode')}
                  onCheckedChange={(checked) => handleDigitalTypeChange('barcode', checked as boolean)}
                />
                <Label htmlFor="barcode">Barcodes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="nfc"
                  checked={digitalTypes.includes('nfc')}
                  onCheckedChange={(checked) => handleDigitalTypeChange('nfc', checked as boolean)}
                />
                <Label htmlFor="nfc">NFC Data</Label>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {digitalTypes.includes('qr') && (
              <div>
                <Label htmlFor="qr-size">QR Code Size (px)</Label>
                <Input
                  id="qr-size"
                  type="number"
                  value={qrOptions.size}
                  onChange={(e) => setQrOptions({ size: parseInt(e.target.value) || 400 })}
                  min="100"
                  max="2000"
                />
              </div>
            )}
            {digitalTypes.includes('barcode') && (
              <div>
                <Label htmlFor="barcode-scale">Barcode Scale</Label>
                <Input
                  id="barcode-scale"
                  type="number"
                  value={barcodeOptions.scale}
                  onChange={(e) => setBarcodeOptions({ scale: parseInt(e.target.value) || 3 })}
                  min="1"
                  max="10"
                />
              </div>
            )}
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleBulkGenerate}
            disabled={loading || !selectedAsset || digitalTypes.length === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Digital Assets...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Generate All Digital Assets
              </>
            )}
          </Button>

          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              <XCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Assets Display */}
      {generatedAssets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Generated Digital Assets ({generatedAssets.length})
              </div>
              <Button onClick={handleDownloadAll} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedAssets.map((asset, index) => {
                console.log('Rendering asset:', asset)
                return (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {asset.category === 'Movable' ? (
                      <Package className="w-4 h-4 text-green-600" />
                    ) : (
                      <Building className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="font-semibold">Sub-Asset #{asset.subAssetIndex + 1}</span>
                  </div>
                  <p className="text-sm font-mono bg-gray-100 p-1 rounded">{asset.tagId}</p>
                  
                  <div className="space-y-1">
                    {asset.generated?.qrCode && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-16 border rounded flex items-center justify-center bg-gray-50">
                          {imageLoadingStates[`qr-${asset.tagId}`] && (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          )}
                          {imageUrls[`qr-${asset.tagId}`] ? (
                            <Image
                              src={imageUrls[`qr-${asset.tagId}`]}
                              alt={`QR Code for ${asset.tagId}`}
                              width={64}
                              height={64}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="text-xs">Loading...</span>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = asset.generated?.qrCode?.url?.startsWith('http') 
                              ? asset.generated.qrCode.url 
                              : asset.generated?.qrCode?.url?.startsWith('/') 
                                ? `${API_BASE_URL}${asset.generated.qrCode.url}`
                                : `${API_BASE_URL}/${asset.generated?.qrCode?.url || ''}`
                            link.download = `qr_sub_${asset.tagId}.png`
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {asset.generated?.barcode && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-8 border rounded flex items-center justify-center bg-gray-50">
                          {imageLoadingStates[`barcode-${asset.tagId}`] && (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          )}
                          {imageUrls[`barcode-${asset.tagId}`] ? (
                            <Image
                              src={imageUrls[`barcode-${asset.tagId}`]}
                              alt={`Barcode for ${asset.tagId}`}
                              width={64}
                              height={32}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="text-xs">Loading...</span>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = asset.generated?.barcode?.url?.startsWith('http') 
                              ? asset.generated.barcode.url 
                              : asset.generated?.barcode?.url?.startsWith('/') 
                                ? `${API_BASE_URL}${asset.generated.barcode.url}`
                                : `${API_BASE_URL}/${asset.generated?.barcode?.url || ''}`
                            link.download = `barcode_sub_${asset.tagId}.png`
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
