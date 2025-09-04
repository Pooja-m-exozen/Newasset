'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Button } from './button'
import { Label } from './label'
import { Input } from './input'
import { Badge } from './badge'
import Image from 'next/image'
import { QrCode, Scan, Download, Copy, Hash, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { type Asset } from '../../lib/adminasset'

interface QRGenerationModalProps {
  isOpen: boolean
  asset: Asset
  onClose: () => void
  onGenerated: (updatedAsset: Asset) => void
}

const API_BASE_URL = 'https://digitalasset.zenapi.co.in'

// Interface for the API response
interface QRCodeResponse {
  success: boolean
  message: string
  qrCode: {
    url: string
    shortUrl: string
    data: {
      t: string
      a: string
      s: string
      b: string
      m: string
      st: string
      p: string
      l: {
        latitude: string
        longitude: string
        floor: string
        room: string
        building: string
      }
      u: string
      pr: string
      url: string
      ts: number
      c: string
    }
    optimizedFor: string
    scanSettings: {
      errorCorrectionLevel: string
      type: string
      quality: number
      margin: number
      color: {
        dark: string
        light: string
      }
      width: number
      scale: number
      size: number
    }
  }
}

export const QRGenerationModal: React.FC<QRGenerationModalProps> = ({ isOpen, asset, onClose, onGenerated }) => {
  const [size, setSize] = useState<number>(300)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [qrResponse, setQrResponse] = useState<QRCodeResponse | null>(null)
  const [imageLoading, setImageLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)

  const title = useMemo(() => `Generate QR for ${asset.tagId}`, [asset.tagId])

  const handleGenerate = useCallback(async () => {
    if (!asset._id) {
      setError('Asset ID is required to generate QR code')
      return
    }

    try {
      setIsGenerating(true)
      setError(null)
      setIsSuccess(false)
      
      console.log('🚀 Generating QR for asset:', asset._id)
      
      // Use the correct API endpoint
      const response = await fetch(`${API_BASE_URL}/api/digital-assets/qr/${asset._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          size: size,
          // Add any other parameters needed by your API
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result: QRCodeResponse = await response.json()
      
      if (result.success) {
        setQrResponse(result)
        setImageLoading(true)
        setIsSuccess(true)
        console.log('✅ QR Code generated successfully:', result)
      } else {
        throw new Error(result.message || 'Failed to generate QR code')
      }

    } catch (e) {
      console.error('❌ QR generation error:', e)
      setError(e instanceof Error ? e.message : 'Failed to generate QR code')
      setIsSuccess(false)
    } finally {
      setIsGenerating(false)
    }
  }, [asset._id, size])

  const handleDownload = useCallback(async () => {
    if (!qrResponse) return
    try {
      const res = await fetch(`${API_BASE_URL}${qrResponse.qrCode.url}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `QR_${qrResponse.qrCode.data.t || asset.tagId}_${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      // noop
    }
  }, [asset.tagId, qrResponse])

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
    if (isSuccess && qrResponse) {
      // If QR was generated successfully, close and proceed
      onClose()
    } else {
      // If no QR was generated, just close
      onClose()
    }
  }, [isSuccess, qrResponse, onClose])

  const handleContinue = useCallback(async () => {
    if (isSuccess && qrResponse) {
      try {
        // Build an updated asset with the new qrCode from the API response
        const updatedAsset: Asset = {
          ...asset,
          digitalAssets: {
            ...asset.digitalAssets,
            qrCode: {
              url: qrResponse.qrCode.url,
              data: {
                ...qrResponse.qrCode.data,
                lm: null, // Add missing location metadata
                nm: null  // Add missing notes metadata
              },
              generatedAt: new Date().toISOString() // Add the required generatedAt field
            }
          }
        }
        onGenerated(updatedAsset)
      } catch (refreshError) {
        console.error('❌ Error continuing:', refreshError)
        onClose()
      }
    } else {
      onClose()
    }
  }, [isSuccess, qrResponse, asset, onGenerated, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <QrCode className="w-5 h-5 text-emerald-600" />
              <span>{title}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Message */}
          {isSuccess && qrResponse && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    QR Code Generated Successfully!
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    The QR code has been generated and saved. You can now view it in the asset details.
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
                <Label className="text-sm font-medium">QR Code Settings</Label>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="qr-size" className="text-sm">Size (px)</Label>
                    <Input 
                      id="qr-size" 
                      type="number" 
                      min={100} 
                      max={1000} 
                      value={size} 
                      onChange={e => setSize(Number(e.target.value))} 
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating} 
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700"
              >
                {isGenerating ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="animate-spin" />
                    <span>Generating QR...</span>
                  </div>
                ) : (
                  `Generate QR for ${asset.tagId}`
                )}
              </Button>
            </div>

            {/* Right Column - QR Display */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Generated QR Code</Label>
              
              {qrResponse ? (
                <div className="space-y-4">
                  {/* QR Code Image */}
                  <div className="relative w-full aspect-square border-2 border-dashed border-emerald-300 dark:border-emerald-600 rounded-lg flex items-center justify-center overflow-hidden bg-white">
                    {imageLoading && (
                      <div className="text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                        <p className="text-sm">Loading QR Code...</p>
                      </div>
                    )}
                    <Image
                      src={`${API_BASE_URL}${qrResponse.qrCode.url}`}
                      alt={`QR for ${asset.tagId}`}
                      width={300}
                      height={300}
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
                    <Button variant="outline" size="sm" onClick={() => handleCopy(qrResponse.qrCode.shortUrl)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* QR Details */}
                  <div className="space-y-2 text-xs bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tag ID:</span>
                      <span className="font-mono">{qrResponse.qrCode.data.t || asset.tagId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Checksum:</span>
                      <span className="font-mono flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {qrResponse.qrCode.data.c || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Generated:</span>
                      <span className="font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {qrResponse.qrCode.data.ts ? new Date(qrResponse.qrCode.data.ts).toLocaleString() : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <Scan className="w-8 h-8" />
                    <span>No QR Code Generated Yet</span>
                    <span className="text-xs">Click Generate to create a QR code</span>
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
            {isSuccess && qrResponse && (
              <Button onClick={handleContinue} className="bg-emerald-600 hover:bg-emerald-700">
                Continue to Asset View
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default QRGenerationModal


