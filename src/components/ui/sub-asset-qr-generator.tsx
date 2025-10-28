'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// Alert component not available, using custom div-based alerts
import { QrCode, Download, Loader2, CheckCircle, XCircle, Package, Building } from 'lucide-react'
import { assetApi, Asset } from '@/lib/adminasset'
import { useAuth } from '@/contexts/AuthContext'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SubAssetQRGeneratorProps {
  // No props needed for this component
}

export function SubAssetQRGenerator({}: SubAssetQRGeneratorProps) {
  const { user } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  const [selectedSubAsset, setSelectedSubAsset] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<'movable' | 'immovable'>('movable')
  const [qrOptions, setQrOptions] = useState({
    size: 500,
    quality: 1.0,
    includeUrl: true
  })
  const [loading, setLoading] = useState(false)
  const [generatedQR, setGeneratedQR] = useState<{
    success: boolean
    message: string
    qrCode: {
      url: string
      shortUrl: string
      data: Record<string, unknown>
      optimizedFor: string
      scanSettings: Record<string, unknown>
    }
    subAsset: {
      tagId: string
      assetName: string
      category: string
      brand: string
    }
  } | null>(null)
  const [qrResponse, setQrResponse] = useState<{
    success: boolean
    message: string
    qrCode: {
      url: string
      shortUrl: string
      data: Record<string, unknown>
      optimizedFor: string
      scanSettings: Record<string, unknown>
    }
    subAsset: {
      tagId: string
      assetName: string
      category: string
      brand: string
    }
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [qrImageUrl, setQrImageUrl] = useState<string>('')
  const [qrImageLoading, setQrImageLoading] = useState(false)

  // Fetch assets on component mount or when user changes
  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  // Load QR image as blob when generatedQR changes
  useEffect(() => {
    if (generatedQR?.qrCode?.url) {
      loadQRImageAsBlob(generatedQR.qrCode.url)
    }
  }, [generatedQR])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (qrImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(qrImageUrl)
      }
    }
  }, [qrImageUrl])

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

  // Function to load QR code image as blob
  const loadQRImageAsBlob = async (imagePath: string) => {
    try {
      setQrImageLoading(true)
      
      // Construct the full URL
      const fullUrl = imagePath.startsWith('http') 
        ? imagePath 
        : imagePath.startsWith('/') 
          ? `https://digitalasset.zenapi.co.in${imagePath}`
          : `https://digitalasset.zenapi.co.in/${imagePath}`
      
      console.log('Loading QR image as blob:', fullUrl)
      
      // Fetch the image as blob
      const response = await fetch(fullUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch QR image: ${response.status}`)
      }
      
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      
      console.log('QR image loaded successfully as blob')
      setQrImageUrl(objectUrl)
      setQrImageLoading(false)
      
    } catch (error) {
      console.error('Failed to load QR image as blob:', error)
      setQrImageLoading(false)
    }
  }

  const selectedAssetData = assets.find(asset => asset.tagId === selectedAsset)
  const subAssets = selectedAssetData?.subAssets?.[selectedCategory] || []

  const handleGenerateQR = async () => {
    if (!selectedAsset || !selectedSubAsset) {
      setError('Please select an asset and sub-asset')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      setGeneratedQR(null)

      // Find the sub-asset index from the selected tagId
      const subAssetIndex = subAssets.findIndex(subAsset => subAsset.tagId === selectedSubAsset)
      if (subAssetIndex === -1) {
        setError('Selected sub-asset not found')
        return
      }

      const result = await assetApi.generateSubAssetQRCode(
        selectedAssetData?._id || selectedAsset,
        subAssetIndex,
        selectedCategory,
        qrOptions
      )

      if (result.success) {
        setGeneratedQR(result as unknown as {
          success: boolean
          message: string
          qrCode: {
            url: string
            shortUrl: string
            data: Record<string, unknown>
            optimizedFor: string
            scanSettings: Record<string, unknown>
          }
          subAsset: {
            tagId: string
            assetName: string
            category: string
            brand: string
          }
        })
        setQrResponse(result as unknown as {
          success: boolean
          message: string
          qrCode: {
            url: string
            shortUrl: string
            data: Record<string, unknown>
            optimizedFor: string
            scanSettings: Record<string, unknown>
          }
          subAsset: {
            tagId: string
            assetName: string
            category: string
            brand: string
          }
        })
        setSuccess('QR Code generated successfully!')
      } else {
        setError(`Failed to generate QR Code`)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate QR Code')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadQR = () => {
    if (generatedQR?.qrCode?.url) {
      const link = document.createElement('a')
      link.href = `https://digitalasset.zenapi.co.in${generatedQR.qrCode.url}`
      link.download = `qr_sub_${qrResponse?.subAsset?.tagId || 'unknown'}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Sub-Asset QR Code Generator
          </CardTitle>
          <CardDescription>
            Generate QR codes for individual sub-assets with customizable options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Asset Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category-select">Category</Label>
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as 'movable' | 'immovable')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="movable">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Movable
                    </div>
                  </SelectItem>
                  <SelectItem value="immovable">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Immovable
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sub-Asset Selection */}
          {selectedAsset && (
            <div>
              <Label htmlFor="sub-asset-select">Select Sub-Asset</Label>
              <Select value={selectedSubAsset} onValueChange={setSelectedSubAsset}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a sub-asset" />
                </SelectTrigger>
                <SelectContent>
                  {subAssets.map((subAsset, index) => (
                    <SelectItem key={subAsset.tagId || index} value={subAsset.tagId || index.toString()}>
                      {subAsset.assetName} {subAsset.tagId && `(${subAsset.tagId})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* QR Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="size">Size (px)</Label>
              <Input
                id="size"
                type="number"
                value={qrOptions.size}
                onChange={(e) => setQrOptions(prev => ({ ...prev, size: parseInt(e.target.value) || 500 }))}
                min="100"
                max="2000"
              />
            </div>
            <div>
              <Label htmlFor="quality">Quality</Label>
              <Input
                id="quality"
                type="number"
                step="0.1"
                value={qrOptions.quality}
                onChange={(e) => setQrOptions(prev => ({ ...prev, quality: parseFloat(e.target.value) || 1.0 }))}
                min="0.1"
                max="1.0"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeUrl"
                checked={qrOptions.includeUrl}
                onChange={(e) => setQrOptions(prev => ({ ...prev, includeUrl: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="includeUrl">Include URL</Label>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateQR}
            disabled={loading || !selectedAsset || !selectedSubAsset}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating QR Code...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4 mr-2" />
                Generate QR Code
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

      {/* Generated QR Code Display */}
      {generatedQR && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Generated QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {qrImageUrl ? (
                  <Image
                    src={qrImageUrl}
                    alt={`QR Code for ${qrResponse?.subAsset?.tagId || 'Unknown'}`}
                    width={300}
                    height={300}
                    className="w-full max-w-xs mx-auto border rounded"
                  />
                ) : qrImageLoading ? (
                  <div className="w-full max-w-xs mx-auto border rounded flex items-center justify-center h-64 bg-gray-100">
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Loading QR Code...</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-xs mx-auto border rounded flex items-center justify-center h-64 bg-gray-100">
                    <p className="text-sm text-gray-600">QR Code not available</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div>
                  <Label className="font-semibold">Tag ID:</Label>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded">{qrResponse?.subAsset?.tagId || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Short URL:</Label>
                  <p className="text-sm text-blue-600 break-all">{generatedQR?.qrCode?.shortUrl || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Asset Name:</Label>
                  <p className="text-sm">{qrResponse?.subAsset?.assetName || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Category:</Label>
                  <p className="text-sm">{qrResponse?.subAsset?.category || 'N/A'}</p>
                </div>
              </div>
            </div>
            <Button onClick={handleDownloadQR} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
