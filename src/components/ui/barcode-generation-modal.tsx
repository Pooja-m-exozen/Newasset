'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Button } from './button'
import { Label } from './label'
import { Input } from './input'
import { Badge } from './badge'
import Image from 'next/image'
import { Barcode, Download, Copy, Hash, Clock, CheckCircle, Settings } from 'lucide-react'
import { type Asset, assetApi } from '../../lib/adminasset'
import { generateBarcode, type BarcodeGenerationResponse } from '@/lib/DigitalAssets'

interface BarcodeGenerationModalProps {
  isOpen: boolean
  asset: Asset
  onClose: () => void
  onGenerated: (updatedAsset: Asset) => void
}

const API_BASE_URL = 'http://192.168.0.5:5021'

const BARCODE_FORMATS = [
  { value: 'code128', label: 'Code 128', description: 'Most common format, supports all ASCII characters' },
  { value: 'code39', label: 'Code 39', description: 'Industrial standard, supports numbers and uppercase letters' },
  { value: 'ean13', label: 'EAN-13', description: 'European Article Number, 13 digits' },
  { value: 'ean8', label: 'EAN-8', description: 'European Article Number, 8 digits' },
  { value: 'upca', label: 'UPC-A', description: 'Universal Product Code, 12 digits' },
  { value: 'upce', label: 'UPC-E', description: 'Universal Product Code, 8 digits' },
]

export const BarcodeGenerationModal: React.FC<BarcodeGenerationModalProps> = ({ isOpen, asset, onClose, onGenerated }) => {
  const [format, setFormat] = useState<string>('code128')
  const [height, setHeight] = useState<number>(10)
  const [scale, setScale] = useState<number>(3)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [barcodeResponse, setBarcodeResponse] = useState<BarcodeGenerationResponse | null>(null)
  const [imageLoading, setImageLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)

  const title = useMemo(() => `Generate Barcode for ${asset.tagId}`, [asset.tagId])

  const handleGenerate = useCallback(async () => {
    try {
      setIsGenerating(true)
      setError(null)
      setIsSuccess(false)
      
      console.log('🚀 Generating Barcode for asset:', asset._id || asset.tagId)
      const result = await generateBarcode(asset._id || asset.tagId, { format, height, scale })
      setBarcodeResponse(result)
      setImageLoading(true)
      setIsSuccess(true)

      // Wait a moment for the backend to process, then fetch updated asset
      setTimeout(async () => {
        try {
          console.log('🔄 Fetching updated asset after barcode generation...')
          const refreshed = await assetApi.getAssetById(asset._id || asset.tagId)
          if (refreshed.success) {
            console.log('✅ Asset refreshed with barcode data:', refreshed.asset)
            onGenerated(refreshed.asset)
          } else {
            console.error('❌ Failed to refresh asset after barcode generation')
          }
        } catch (refreshError) {
          console.error('❌ Error refreshing asset:', refreshError)
        }
      }, 2000) // Wait 2 seconds for backend processing

    } catch (e) {
      console.error('❌ Barcode generation error:', e)
      setError(e instanceof Error ? e.message : 'Failed to generate barcode')
      setIsSuccess(false)
    } finally {
      setIsGenerating(false)
    }
  }, [asset._id, asset.tagId, format, height, scale, onGenerated])

  const handleDownload = useCallback(async () => {
    if (!barcodeResponse) return
    try {
      const res = await fetch(`${API_BASE_URL}${barcodeResponse.barcode.url}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Barcode_${barcodeResponse.barcode.data}_${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      // noop
    }
  }, [barcodeResponse])

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // noop
    }
  }, [])

  const handleImageLoad = useCallback(() => setImageLoading(false), [])
  const handleImageError = useCallback(() => setImageLoading(false), [])

  const handleClose = useCallback(() => {
    if (isSuccess && barcodeResponse) {
      // If barcode was generated successfully, close and proceed
      onClose()
    } else {
      // If no barcode was generated, just close
      onClose()
    }
  }, [isSuccess, barcodeResponse, onClose])

  const handleContinue = useCallback(async () => {
    if (isSuccess && barcodeResponse) {
      try {
        // Fetch the updated asset to get the latest digital assets
        console.log('🔄 Fetching updated asset to continue...')
        const refreshed = await assetApi.getAssetById(asset._id || asset.tagId)
        if (refreshed.success) {
          console.log('✅ Asset refreshed, continuing to view...')
          onGenerated(refreshed.asset)
        } else {
          console.error('❌ Failed to refresh asset, closing modal')
          onClose()
        }
      } catch (refreshError) {
        console.error('❌ Error refreshing asset:', refreshError)
        onClose()
      }
    } else {
      onClose()
    }
  }, [isSuccess, barcodeResponse, asset._id, asset.tagId, onGenerated, onClose])

  const selectedFormat = useMemo(() => 
    BARCODE_FORMATS.find(f => f.value === format), [format]
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <Barcode className="w-5 h-5 text-orange-600" />
              <span>{title}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Message */}
          {isSuccess && barcodeResponse && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Barcode Generated Successfully!
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    The barcode has been generated and saved. You can now view it in the asset details.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Controls */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Asset Information</Label>
                <div className="p-3 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Tag ID:</span>
                      <span className="font-mono font-medium">{asset.tagId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium">{asset.assetType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Status:</span>
                      <Badge variant="secondary" className="text-xs">{asset.status || 'active'}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Barcode Settings</Label>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="barcode-format" className="text-sm">Format</Label>
                    <select
                      id="barcode-format"
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {BARCODE_FORMATS.map((format) => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="barcode-height" className="text-sm">Height (mm)</Label>
                    <Input 
                      id="barcode-height" 
                      type="number" 
                      min={1} 
                      max={100} 
                      value={height} 
                      onChange={e => setHeight(Number(e.target.value))} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="barcode-scale" className="text-sm">Scale</Label>
                    <Input 
                      id="barcode-scale" 
                      type="number" 
                      min={1} 
                      max={10} 
                      value={scale} 
                      onChange={e => setScale(Number(e.target.value))} 
                    />
                  </div>
                </div>
              </div>

              {selectedFormat && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
                  <div className="flex items-start space-x-2">
                    <Settings className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">{selectedFormat.label}</p>
                      <p className="text-muted-foreground">{selectedFormat.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating} 
                className="w-full h-11 bg-orange-600 hover:bg-orange-700"
              >
                {isGenerating ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating Barcode...</span>
                  </div>
                ) : (
                  `Generate Barcode for ${asset.tagId}`
                )}
              </Button>
            </div>

            {/* Right Column - Barcode Display */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Generated Barcode</Label>
              
              {barcodeResponse ? (
                <div className="space-y-4">
                  {/* Barcode Image */}
                  <div className="relative w-full h-48 border-2 border-dashed border-orange-300 dark:border-orange-600 rounded-lg flex items-center justify-center overflow-hidden bg-white">
                    {imageLoading && (
                      <div className="text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                        <p className="text-sm">Loading Barcode...</p>
                      </div>
                    )}
                    <Image
                      src={`${API_BASE_URL}${barcodeResponse.barcode.url}`}
                      alt={`Barcode for ${asset.tagId}`}
                      width={300}
                      height={150}
                      className={`object-contain ${imageLoading ? 'hidden' : ''}`}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      priority
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownload} className="flex-1">
                      <Download className="w-4 h-4 mr-1" /> Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleCopy(barcodeResponse.barcode.data)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Barcode Details */}
                  <div className="space-y-2 text-xs bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Data:</span>
                      <span className="font-mono">{barcodeResponse.barcode.data}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Format:</span>
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        {barcodeResponse.barcode.format}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Height:</span>
                      <span className="font-mono">{height}mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Scale:</span>
                      <span className="font-mono">{scale}x</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <Barcode className="w-8 h-8" />
                    <span>No Barcode Generated Yet</span>
                    <span className="text-xs">Click Generate to create a barcode</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={handleClose}>
              {isSuccess ? 'Cancel' : 'Close'}
            </Button>
            {isSuccess && barcodeResponse && (
              <Button onClick={handleContinue} className="bg-orange-600 hover:bg-orange-700">
                Continue to Asset View
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BarcodeGenerationModal
