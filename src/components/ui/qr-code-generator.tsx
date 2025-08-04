'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Checkbox } from './checkbox'
import { Badge } from './badge'
import { Separator } from './separator'
import { generateQRCode, downloadQRCode, type QRCodeGenerationResponse } from '@/lib/DigitalAssets'
import { cn } from '@/lib/utils'
import { SuccessToast } from './success-toast'
import { QrCode, Download, Copy, Settings, Info, MapPin, Building, Calendar, Hash } from 'lucide-react'

interface QRCodeGeneratorProps {
  assetId?: string;
  className?: string;
}

export function QRCodeGenerator({ assetId, className }: QRCodeGeneratorProps) {
  const [inputAssetId, setInputAssetId] = useState(assetId || '')
  const [size, setSize] = useState(300)
  const [includeUrl, setIncludeUrl] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<QRCodeGenerationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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
            <Input
              id="assetId"
              placeholder="Enter Asset ID (e.g., ASSET555)"
              value={inputAssetId}
              onChange={(e) => setInputAssetId(e.target.value)}
            />
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

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
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