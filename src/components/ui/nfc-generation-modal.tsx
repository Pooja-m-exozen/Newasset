'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Button } from './button'
import { Label } from './label'
import { Badge } from './badge'
import { Wifi, Download, Copy, Hash, Clock, CheckCircle, Shield, MapPin, User } from 'lucide-react'
import { type Asset, assetApi } from '../../lib/adminasset'
import { generateNFCData, type NFCGenerationResponse } from '@/lib/DigitalAssets'

interface NFCGenerationModalProps {
  isOpen: boolean
  asset: Asset
  onClose: () => void
  onGenerated: (updatedAsset: Asset) => void
}

export const NFCGenerationModal: React.FC<NFCGenerationModalProps> = ({ isOpen, asset, onClose, onGenerated }) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [nfcResponse, setNfcResponse] = useState<NFCGenerationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)

  const title = useMemo(() => `Generate NFC Data for ${asset.tagId}`, [asset.tagId])

  const handleGenerate = useCallback(async () => {
    try {
      setIsGenerating(true)
      setError(null)
      setIsSuccess(false)
      
      console.log('🚀 Generating NFC data for asset:', asset._id || asset.tagId)
      const result = await generateNFCData(asset._id || asset.tagId)
      setNfcResponse(result)
      setIsSuccess(true)

      // Wait a moment for the backend to process, then fetch updated asset
      setTimeout(async () => {
        try {
          console.log('🔄 Fetching updated asset after NFC generation...')
          const refreshed = await assetApi.getAssetById(asset._id || asset.tagId)
          if (refreshed.success) {
            console.log('✅ Asset refreshed with NFC data:', refreshed.asset)
            onGenerated(refreshed.asset)
          } else {
            console.error('❌ Failed to refresh asset after NFC generation')
          }
        } catch (refreshError) {
          console.error('❌ Error refreshing asset:', refreshError)
        }
      }, 2000) // Wait 2 seconds for backend processing

    } catch (e) {
      console.error('❌ NFC generation error:', e)
      setError(e instanceof Error ? e.message : 'Failed to generate NFC data')
      setIsSuccess(false)
    } finally {
      setIsGenerating(false)
    }
  }, [asset._id, asset.tagId, onGenerated])

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // noop
    }
  }, [])

  const handleClose = useCallback(() => {
    if (isSuccess && nfcResponse) {
      // If NFC data was generated successfully, close and proceed
      onClose()
    } else {
      // If no NFC data was generated, just close
      onClose()
    }
  }, [isSuccess, nfcResponse, onClose])

  const handleContinue = useCallback(async () => {
    if (isSuccess && nfcResponse) {
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
  }, [isSuccess, nfcResponse, asset._id, asset.tagId, onGenerated, onClose])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <Wifi className="w-5 h-5 text-purple-600" />
              <span>{title}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Message */}
          {isSuccess && nfcResponse && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    NFC Data Generated Successfully!
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    The NFC data has been generated and saved. You can now view it in the asset details.
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
                <Label className="text-sm font-medium">NFC Data Generation</Label>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-md">
                  <div className="flex items-start space-x-2">
                    <Wifi className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">NFC Data Generation</p>
                      <p className="text-muted-foreground">
                        NFC data includes comprehensive asset information including location, 
                        maintenance schedule, performance metrics, and digital signatures for security.
                      </p>
                    </div>
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
                className="w-full h-11 bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating NFC Data...</span>
                  </div>
                ) : (
                  `Generate NFC Data for ${asset.tagId}`
                )}
              </Button>
            </div>

            {/* Right Column - NFC Display */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Generated NFC Data</Label>
              
              {nfcResponse ? (
                <div className="space-y-4">
                  {/* NFC Data Preview */}
                  <div className="relative w-full h-48 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg flex items-center justify-center overflow-hidden bg-white">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wifi className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">NFC Data Ready</h3>
                      <p className="text-sm text-muted-foreground mb-4">Tap to read asset information</p>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <p><span className="font-medium">Asset ID:</span> {nfcResponse.nfcData.data.id}</p>
                        <p><span className="font-medium">Type:</span> {nfcResponse.nfcData.data.type}</p>
                        <p><span className="font-medium">Format:</span> NFC-A</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopy(nfcResponse.nfcData.data.id)} className="flex-1">
                      <Copy className="w-4 h-4 mr-1" /> Copy Asset ID
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleCopy(nfcResponse.nfcData.data.checksum)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* NFC Details */}
                  <div className="space-y-2 text-xs bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Asset ID:</span>
                      <span className="font-mono">{nfcResponse.nfcData.data.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        {nfcResponse.nfcData.data.type}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Checksum:</span>
                      <span className="font-mono flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {nfcResponse.nfcData.data.checksum.substring(0, 8)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Generated:</span>
                      <span className="font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(nfcResponse.nfcData.data.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <Wifi className="w-8 h-8" />
                    <span>No NFC Data Generated Yet</span>
                    <span className="text-xs">Click Generate to create NFC data</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Asset Information Cards */}
          {nfcResponse && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Asset Information Card */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Asset Information</Label>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs uppercase tracking-wide">Type</span>
                      <p className="font-medium">{nfcResponse.nfcData.data.assetType}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs uppercase tracking-wide">Brand</span>
                      <p className="font-medium">{nfcResponse.nfcData.data.brand}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs uppercase tracking-wide">Model</span>
                      <p className="font-medium">{nfcResponse.nfcData.data.model}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs uppercase tracking-wide">Status</span>
                      <Badge 
                        variant={nfcResponse.nfcData.data.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs px-2 py-1"
                      >
                        {nfcResponse.nfcData.data.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs uppercase tracking-wide">Priority</span>
                      <Badge 
                        variant={nfcResponse.nfcData.data.priority === 'high' ? 'destructive' : 'secondary'}
                        className="text-xs px-2 py-1"
                      >
                        {nfcResponse.nfcData.data.priority}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs uppercase tracking-wide">Assigned To</span>
                      <p className="font-medium">{nfcResponse.nfcData.data.assignedTo}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Information Card */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Location Details</Label>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs uppercase tracking-wide">Building</span>
                      <p className="font-medium">{nfcResponse.nfcData.data.location.building}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs uppercase tracking-wide">Floor</span>
                      <p className="font-medium">{nfcResponse.nfcData.data.location.floor}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs uppercase tracking-wide">Room</span>
                      <p className="font-medium">{nfcResponse.nfcData.data.location.room}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs uppercase tracking-wide">Project</span>
                      <p className="font-medium">{nfcResponse.nfcData.data.projectName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={handleClose}>
              {isSuccess ? 'Cancel' : 'Close'}
            </Button>
            {isSuccess && nfcResponse && (
              <Button onClick={handleContinue} className="bg-purple-600 hover:bg-purple-700">
                Continue to Asset View
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NFCGenerationModal
