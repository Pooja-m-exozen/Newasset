'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Button } from './button'

import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Progress } from './progress'
import { 
  QrCode, 
  Barcode, 
  Wifi, 
  Download, 
  Copy, 
  CheckCircle, 
  Loader2, 
  X, 
  RefreshCw,
  FileText,
  Smartphone,

} from 'lucide-react'
import { type Asset } from '../../lib/adminasset'
import { SuccessToast } from './success-toast'

interface BulkDigitalAssetsModalProps {
  isOpen: boolean
  asset: Asset
  onClose: () => void
  onGenerated: (updatedAsset: Asset) => void
}

const API_BASE_URL = 'https://digitalasset.zenapi.co.in'

interface DigitalAssetResult {
  type: 'qr' | 'barcode' | 'nfc'
  success: boolean
  data?: {
    tagId?: string
    url?: string
    shortUrl?: string
    format?: string
    id?: string
    type?: string
    brand?: string
    model?: string
    status?: string
    priority?: string
    timestamp?: string
    checksum?: string
    signature?: string
    assignedTo?: string
    projectName?: string
  }
  error?: string
  url?: string
  shortUrl?: string
}

interface GenerationProgress {
  qr: boolean
  barcode: boolean
  nfc: boolean
}

export const BulkDigitalAssetsModal: React.FC<BulkDigitalAssetsModalProps> = ({
  isOpen,
  asset,
  onClose,
  onGenerated
}) => {
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['qr', 'barcode', 'nfc']))
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    qr: false,
    barcode: false,
    nfc: false
  })
  const [results, setResults] = useState<DigitalAssetResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const title = useMemo(() => `Generate Digital Assets for ${asset.tagId}`, [asset.tagId])

  const handleTypeToggle = useCallback((type: string) => {
    const newSelected = new Set(selectedTypes)
    if (newSelected.has(type)) {
      newSelected.delete(type)
    } else {
      newSelected.add(type)
    }
    setSelectedTypes(newSelected)
  }, [selectedTypes])







  const handleBulkGenerate = useCallback(async () => {
    if (selectedTypes.size === 0) {
      setError('Please select at least one digital asset type to generate')
      return
    }

    setIsGenerating(true)
    setError(null)
    setResults([])
    setGenerationProgress({ qr: false, barcode: false, nfc: false })

    try {
      // Use the bulk generation API endpoint
      const response = await fetch(`${API_BASE_URL}/digital-assets/all/${asset._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          types: Array.from(selectedTypes),
          options: {
            qr: { size: 300, includeUrl: true },
            barcode: { format: 'code128', height: 10, scale: 3 },
            nfc: { includeUrl: true }
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to generate digital assets')
      }

      const data = await response.json()
      
      // Process the response and create results
      const newResults: DigitalAssetResult[] = []
      
      if (data.qrCode && selectedTypes.has('qr')) {
        newResults.push({
          type: 'qr',
          success: true,
          data: data.qrCode,
          url: data.qrCode.url,
          shortUrl: data.qrCode.shortUrl
        })
      }
      
      if (data.barcode && selectedTypes.has('barcode')) {
        newResults.push({
          type: 'barcode',
          success: true,
          data: data.barcode,
          url: data.barcode.url
        })
      }
      
      if (data.nfc && selectedTypes.has('nfc')) {
        newResults.push({
          type: 'nfc',
          success: true,
          data: data.nfc,
          url: data.nfc.url
        })
      }

      setResults(newResults)

      const successCount = newResults.length
      if (successCount > 0) {
        setSuccessMessage(`Successfully generated ${successCount} digital asset(s)!`)
        setShowSuccessToast(true)
        
        // Update the asset with the generated digital assets
        const updatedAsset = {
          ...asset,
          digitalAssets: {
            ...asset.digitalAssets,
            qrCode: data.qrCode || asset.digitalAssets?.qrCode,
            barcode: data.barcode || asset.digitalAssets?.barcode,
            nfcData: data.nfcData || asset.digitalAssets?.nfcData
          }
        }
        
        onGenerated(updatedAsset)
      }
    } catch (err) {
      console.error('Bulk generation error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsGenerating(false)
      setGenerationProgress({ qr: false, barcode: false, nfc: false })
    }
  }, [selectedTypes, asset, onGenerated])

  const handleDownload = useCallback((result: DigitalAssetResult) => {
    if (!result.url) return

    const link = document.createElement('a')
    link.href = result.url
    link.download = `${asset.tagId}_${result.type}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [asset.tagId])

  const handleCopy = useCallback(async (result: DigitalAssetResult) => {
    if (!result.url) return

    try {
      await navigator.clipboard.writeText(result.url)
      setSuccessMessage(`${result.type.toUpperCase()} URL copied to clipboard!`)
      setShowSuccessToast(true)
    } catch  {
      setError('Failed to copy to clipboard')
    }
  }, [])

  const getProgressPercentage = useMemo(() => {
    const total = selectedTypes.size
    const completed = results.length
    return total > 0 ? (completed / total) * 100 : 0
  }, [selectedTypes.size, results.length])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'qr': return <QrCode className="w-5 h-5" />
      case 'barcode': return <Barcode className="w-5 h-5" />
      case 'nfc': return <Wifi className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'qr': return 'QR Code'
      case 'barcode': return 'Barcode'
      case 'nfc': return 'NFC Tag'
      default: return type
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <span>{title}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Asset Info */}
            <Card className="bg-gray-50 dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Asset Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Tag ID:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{asset.tagId}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{asset.assetType}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Brand:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{asset.brand}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Model:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{asset.model}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Digital Asset Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Digital Asset Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { type: 'qr', label: 'QR Code', description: 'Quick response code for easy scanning' },
                    { type: 'barcode', label: 'Barcode', description: 'Traditional barcode for inventory systems' },
                    { type: 'nfc', label: 'NFC Tag', description: 'Near field communication for mobile devices' }
                  ].map(({ type, label, description }) => (
                    <div
                      key={type}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedTypes.has(type)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      onClick={() => handleTypeToggle(type)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          selectedTypes.has(type)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                        }`}>
                          {getTypeIcon(type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{label}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Generation Progress */}
            {isGenerating && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generation Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={getProgressPercentage} className="w-full" />
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { type: 'qr', label: 'QR Code' },
                        { type: 'barcode', label: 'Barcode' },
                        { type: 'nfc', label: 'NFC Tag' }
                      ].map(({ type, label }) => (
                        <div key={type} className="flex items-center space-x-2">
                          {generationProgress[type as keyof GenerationProgress] ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          ) : results.find(r => r.type === type) ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          )}
                          <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generated Digital Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg ${
                          result.success
                            ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                            : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getTypeIcon(result.type)}
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {getTypeLabel(result.type)}
                              </h4>
                              {result.success ? (
                                <p className="text-sm text-green-600 dark:text-green-400">
                                  Generated successfully
                                </p>
                              ) : (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                  {result.error}
                                </p>
                              )}
                            </div>
                          </div>
                          {result.success && result.url && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(result)}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(result)}
                                className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Copy URL
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <X className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isGenerating}
                className="border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
              >
                Close
              </Button>
              <Button
                onClick={handleBulkGenerate}
                disabled={isGenerating || selectedTypes.size === 0}
                className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate {selectedTypes.size} Digital Asset{selectedTypes.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showSuccessToast && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </>
  )
}
