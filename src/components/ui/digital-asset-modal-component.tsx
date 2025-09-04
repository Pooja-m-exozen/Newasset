"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  QrCode, 
  Barcode, 
  Smartphone,
  Download,
  Eye,
  X
} from 'lucide-react'

interface Asset {
  _id: string
  tagId: string
  assetType: string
  subcategory: string
  brand: string
  model: string
  status: string
  priority: string
  location: {
    latitude: string
    longitude: string
    floor: string
    room: string
    building: string
  } | null
  project?: {
    projectId: string
    projectName: string
  } | null
  compliance: {
    certifications: string[]
    expiryDates: string[]
    regulatoryRequirements: string[]
  }
  digitalAssets: {
    qrCode: {
      url: string
      data: {
        t?: string
        a?: string
        s?: string
        b?: string
        m?: string
        st?: string
        p?: string
        l?: {
          latitude: string
          longitude: string
          floor: string
          room: string
          building: string
        }
        u?: string
        pr?: string | null
        lm?: string | null
        nm?: string | null
        url?: string
        ts?: number
        c?: string
      } | null
      generatedAt: string
    }
    barcode: {
      url: string
      data: string
      generatedAt: string
    }
    nfcData: {
      url: string
      data: {
        type?: string
        id?: string
        assetType?: string
        subcategory?: string
        brand?: string
        model?: string
        status?: string
        priority?: string
        location?: {
          latitude: string
          longitude: string
          floor: string
          room: string
          building: string
        }
        assignedTo?: string
        timestamp?: string
        checksum?: string
        signature?: string
      } | null
      generatedAt: string
    }
  }
  assignedTo: {
    _id: string
    name: string
    email: string
  } | string
  createdAt: string
  updatedAt: string
}

interface DigitalAssetModalProps {
  asset: Asset
  type: 'qrCode' | 'barcode' | 'nfcData'
  onClose: () => void
  onShowAssetDetails: (asset: Asset) => void
  onDownloadAssetInfo: (asset: Asset) => void
}

export function DigitalAssetModal({
  asset,
  type,
  onClose,
  onShowAssetDetails,
  onDownloadAssetInfo
}: DigitalAssetModalProps) {
  const [modalQrImgSrc, setModalQrImgSrc] = useState<string | null>(null)
  const [modalBarcodeImgSrc, setModalBarcodeImgSrc] = useState<string | null>(null)
  const [modalQrLoading, setModalQrLoading] = useState(false)
  const [modalBarcodeLoading, setModalBarcodeLoading] = useState(false)

  // Download QR code image
  const downloadQRCode = async () => {
    try {
      if (!asset.digitalAssets?.qrCode?.url) {
        alert('QR code not available for this asset')
        return
      }

      const qrUrl = `https://digitalasset.zenapi.co.in${asset.digitalAssets.qrCode.url}`
      const response = await fetch(qrUrl)
      
      if (!response.ok) {
        throw new Error('Failed to fetch QR code image')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qr-code_${asset.tagId}_${new Date().toISOString().split('T')[0]}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      alert('Failed to download QR code image')
    }
  }

  // Download barcode image
  const downloadBarcode = async () => {
    try {
      if (!asset.digitalAssets?.barcode?.url) {
        alert('Barcode not available for this asset')
        return
      }

      const barcodeUrl = `https://digitalasset.zenapi.co.in${asset.digitalAssets.barcode.url}`
      const response = await fetch(barcodeUrl)
      
      if (!response.ok) {
        throw new Error('Failed to fetch barcode image')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `barcode_${asset.tagId}_${new Date().toISOString().split('T')[0]}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading barcode:', error)
      alert('Failed to download barcode image')
    }
  }

  // Load digital asset modal images with blob URLs (robust loading)
  const loadModalImages = useCallback(async () => {
    // Load QR Code
    if (asset.digitalAssets?.qrCode?.url) {
      setModalQrLoading(true)
      try {
        const qrUrl = `https://digitalasset.zenapi.co.in${asset.digitalAssets.qrCode.url}`
        console.log('Loading modal QR Code:', qrUrl)
        const response = await fetch(qrUrl)
        if (!response.ok) throw new Error('QR fetch failed')
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        console.log('Modal QR Code blob URL created:', objectUrl)
        setModalQrImgSrc(objectUrl)
      } catch (error) {
        console.log('Modal QR Code loading failed:', error)
        setModalQrImgSrc(null)
      } finally {
        setModalQrLoading(false)
      }
    }
    
    // Load Barcode
    if (asset.digitalAssets?.barcode?.url) {
      setModalBarcodeLoading(true)
      try {
        const barcodeUrl = `https://digitalasset.zenapi.co.in${asset.digitalAssets.barcode.url}`
        console.log('Loading modal Barcode:', barcodeUrl)
        const response = await fetch(barcodeUrl)
        if (!response.ok) throw new Error('Barcode fetch failed')
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        console.log('Modal Barcode blob URL created:', objectUrl)
        setModalBarcodeImgSrc(objectUrl)
      } catch (error) {
        console.log('Modal Barcode loading failed:', error)
        setModalBarcodeImgSrc(null)
      } finally {
        setModalBarcodeLoading(false)
      }
    }
  }, [asset.digitalAssets?.qrCode?.url, asset.digitalAssets?.barcode?.url])

  useEffect(() => {
    loadModalImages()
  }, [loadModalImages])

  // Separate useEffect for cleanup
  useEffect(() => {
    return () => {
      if (modalQrImgSrc && modalQrImgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(modalQrImgSrc)
      }
      if (modalBarcodeImgSrc && modalBarcodeImgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(modalBarcodeImgSrc)
      }
    }
  }, [modalQrImgSrc, modalBarcodeImgSrc])

  const handleClose = () => {
    // Cleanup blob URLs before closing
    if (modalQrImgSrc && modalQrImgSrc.startsWith('blob:')) {
      URL.revokeObjectURL(modalQrImgSrc)
    }
    if (modalBarcodeImgSrc && modalBarcodeImgSrc.startsWith('blob:')) {
      URL.revokeObjectURL(modalBarcodeImgSrc)
    }
    setModalQrImgSrc(null)
    setModalBarcodeImgSrc(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md sm:max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between ${
          type === 'qrCode' ? 'bg-gradient-to-r from-blue-50 to-indigo-50' :
          type === 'barcode' ? 'bg-gradient-to-r from-green-50 to-emerald-50' :
          'bg-gradient-to-r from-purple-50 to-pink-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
              type === 'qrCode' ? 'bg-gradient-to-br from-blue-500 to-indigo-500' :
              type === 'barcode' ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
              'bg-gradient-to-br from-purple-500 to-pink-500'
            }`}>
              {type === 'qrCode' && <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
              {type === 'barcode' && <Barcode className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
              {type === 'nfcData' && <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                {type === 'qrCode' ? 'QR Code' :
                 type === 'barcode' ? 'Barcode' : 'NFC Data'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                {asset.tagId} • {asset.assetType}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Asset Info */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Asset ID:</span>
                <span className="ml-2 font-medium">{asset.tagId}</span>
              </div>
              <div>
                <span className="text-slate-500">Type:</span>
                <span className="ml-2 font-medium">{asset.assetType}</span>
              </div>
              <div>
                <span className="text-slate-500">Brand:</span>
                <span className="ml-2 font-medium">{asset.brand}</span>
              </div>
              <div>
                <span className="text-slate-500">Model:</span>
                <span className="ml-2 font-medium">{asset.model}</span>
              </div>
            </div>
          </div>

          {/* Digital Asset Display */}
          {type === 'qrCode' && asset.digitalAssets?.qrCode && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-semibold text-slate-900 text-lg">QR Code</h4>
                <Button
                  onClick={downloadQRCode}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
              <div className="flex justify-center">
                <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-lg">
                  {modalQrImgSrc ? (
                    <div className="relative">
                      <Image 
                        src={modalQrImgSrc}
                        alt="QR Code" 
                        width={256}
                        height={256}
                        className="w-48 h-48 sm:w-64 sm:h-64 object-contain rounded-lg"
                        onLoad={() => console.log('Modal QR Code loaded successfully')}
                        onError={() => {
                          console.log('Modal QR Code failed to display')
                          setModalQrImgSrc(null)
                        }}
                      />
                      {modalQrLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                          <div className="text-center">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <div className="text-sm text-blue-600">Loading QR Code...</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                      <div className="text-center">
                        {modalQrLoading ? (
                          <>
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-sm text-blue-600">Loading QR Code...</p>
                          </>
                        ) : (
                          <>
                            <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">QR Code not available</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {asset.digitalAssets.qrCode.data && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-xs text-blue-600 mb-2 font-medium">QR Code Information:</div>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded px-3 py-2 border border-blue-200">
                        <span className="text-blue-600 font-medium">Asset ID:</span>
                        <span className="ml-2 font-semibold">{asset.digitalAssets.qrCode.data.t || 'N/A'}</span>
                      </div>
                      <div className="bg-white rounded px-3 py-2 border border-blue-200">
                        <span className="text-blue-600 font-medium">Type:</span>
                        <span className="ml-2 font-semibold">{asset.digitalAssets.qrCode.data.a || 'N/A'}</span>
                      </div>
                      <div className="bg-white rounded px-3 py-2 border border-blue-200">
                        <span className="text-blue-600 font-medium">Subcategory:</span>
                        <span className="ml-2 font-semibold">{asset.digitalAssets.qrCode.data.s || 'N/A'}</span>
                      </div>
                      <div className="bg-white rounded px-3 py-2 border border-blue-200">
                        <span className="text-blue-600 font-medium">Brand:</span>
                        <span className="ml-2 font-semibold">{asset.digitalAssets.qrCode.data.b || 'N/A'}</span>
                      </div>
                      <div className="bg-white rounded px-3 py-2 border border-blue-200">
                        <span className="text-blue-600 font-medium">Model:</span>
                        <span className="ml-2 font-semibold">{asset.digitalAssets.qrCode.data.m || 'N/A'}</span>
                      </div>
                      <div className="bg-white rounded px-3 py-2 border border-blue-200">
                        <span className="text-blue-600 font-medium">Status:</span>
                        <span className="ml-2 font-semibold capitalize">{asset.digitalAssets.qrCode.data.st || 'N/A'}</span>
                      </div>
                      <div className="bg-white rounded px-3 py-2 border border-blue-200">
                        <span className="text-blue-600 font-medium">Priority:</span>
                        <span className="ml-2 font-semibold capitalize">{asset.digitalAssets.qrCode.data.p || 'N/A'}</span>
                      </div>
                      <div className="bg-white rounded px-3 py-2 border border-blue-200">
                        <span className="text-blue-600 font-medium">Assigned To:</span>
                        <span className="ml-2 font-semibold">{asset.digitalAssets.qrCode.data.u || 'N/A'}</span>
                      </div>
                    </div>
                    
                    {/* Location Information */}
                    {asset.digitalAssets.qrCode.data.l && (
                      <div className="bg-white rounded px-3 py-2 border border-blue-200">
                        <div className="text-blue-600 font-medium mb-2">Location:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Building:</span>
                            <span className="ml-2 font-medium">{asset.digitalAssets.qrCode.data.l.building || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Floor:</span>
                            <span className="ml-2 font-medium">{asset.digitalAssets.qrCode.data.l.floor || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Room:</span>
                            <span className="ml-2 font-medium">{asset.digitalAssets.qrCode.data.l.room || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Coordinates:</span>
                            <span className="ml-2 font-medium">
                              {asset.digitalAssets.qrCode.data.l.latitude}, {asset.digitalAssets.qrCode.data.l.longitude}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {type === 'barcode' && asset.digitalAssets?.barcode && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-semibold text-slate-900 text-lg">Barcode</h4>
                <Button
                  onClick={downloadBarcode}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs border-green-200 text-green-700 hover:bg-green-50"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
              <div className="flex justify-center">
                <div className="bg-white rounded-xl p-4 border border-green-200 shadow-lg">
                  {modalBarcodeImgSrc ? (
                    <div className="relative">
                      <Image 
                        src={modalBarcodeImgSrc}
                        alt="Barcode" 
                        width={320}
                        height={128}
                        className="w-64 h-24 sm:w-80 sm:h-32 object-contain rounded-lg"
                        onLoad={() => console.log('Modal Barcode loaded successfully')}
                        onError={() => {
                          console.log('Modal Barcode failed to display')
                          setModalBarcodeImgSrc(null)
                        }}
                      />
                      {modalBarcodeLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                          <div className="text-center">
                            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <div className="text-sm text-green-600">Loading Barcode...</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-64 h-24 sm:w-80 sm:h-32 flex items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                      <div className="text-center">
                        {modalBarcodeLoading ? (
                          <>
                            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-sm text-green-600">Loading Barcode...</p>
                          </>
                        ) : (
                          <>
                            <Barcode className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Barcode not available</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {asset.digitalAssets.barcode.data && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="text-xs text-green-600 mb-2 font-medium">Barcode Information:</div>
                  <div className="bg-white rounded px-3 py-2 border border-green-200">
                    <div className="text-sm font-semibold text-green-800 text-center">
                      {asset.digitalAssets.barcode.data}
                    </div>
                    <div className="text-xs text-green-600 text-center mt-1">
                      Scan this barcode to access asset information
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {type === 'nfcData' && asset.digitalAssets?.nfcData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-semibold text-slate-900 text-lg">NFC Data</h4>
                <Button
                  onClick={() => onDownloadAssetInfo(asset)}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download Info
                </Button>
              </div>
              <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-lg">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Smartphone className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-purple-700">NFC Data Available</p>
                </div>
                {asset.digitalAssets.nfcData.data && (
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <div className="text-xs text-purple-600 mb-3 font-medium">NFC Information:</div>
                    <div className="space-y-3">
                      {/* Basic Details */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded px-3 py-2 border border-purple-200">
                          <span className="text-purple-600 font-medium text-xs">Type:</span>
                          <span className="ml-2 font-semibold text-sm capitalize">{asset.digitalAssets.nfcData.data.type || 'N/A'}</span>
                        </div>
                        <div className="bg-white rounded px-3 py-2 border border-purple-200">
                          <span className="text-purple-600 font-medium text-xs">ID:</span>
                          <span className="ml-2 font-semibold text-sm">{asset.digitalAssets.nfcData.data.id || 'N/A'}</span>
                        </div>
                        <div className="bg-white rounded px-3 py-2 border border-purple-200">
                          <span className="text-purple-600 font-medium text-xs">Asset Type:</span>
                          <span className="ml-2 font-semibold text-sm">{asset.digitalAssets.nfcData.data.assetType || 'N/A'}</span>
                        </div>
                        <div className="bg-white rounded px-3 py-2 border border-purple-200">
                          <span className="text-purple-600 font-medium text-xs">Subcategory:</span>
                          <span className="ml-2 font-semibold text-sm">{asset.digitalAssets.nfcData.data.subcategory || 'N/A'}</span>
                        </div>
                        <div className="bg-white rounded px-3 py-2 border border-purple-200">
                          <span className="text-purple-600 font-medium text-xs">Brand:</span>
                          <span className="ml-2 font-semibold text-sm">{asset.digitalAssets.nfcData.data.brand || 'N/A'}</span>
                        </div>
                        <div className="bg-white rounded px-3 py-2 border border-purple-200">
                          <span className="text-purple-600 font-medium text-xs">Model:</span>
                          <span className="ml-2 font-semibold text-sm">{asset.digitalAssets.nfcData.data.model || 'N/A'}</span>
                        </div>
                        <div className="bg-white rounded px-3 py-2 border border-purple-200">
                          <span className="text-purple-600 font-medium text-xs">Status:</span>
                          <span className="ml-2 font-semibold text-sm capitalize">{asset.digitalAssets.nfcData.data.status || 'N/A'}</span>
                        </div>
                        <div className="bg-white rounded px-3 py-2 border border-purple-200">
                          <span className="text-purple-600 font-medium text-xs">Priority:</span>
                          <span className="ml-2 font-semibold text-sm capitalize">{asset.digitalAssets.nfcData.data.priority || 'N/A'}</span>
                        </div>
                      </div>
                      
                      {/* Location Information */}
                      {asset.digitalAssets.nfcData.data.location && (
                        <div className="bg-white rounded px-3 py-2 border border-purple-200">
                          <div className="text-purple-600 font-medium text-xs mb-2">Location:</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-slate-500">Building:</span>
                              <span className="ml-2 font-medium">{asset.digitalAssets.nfcData.data.location.building || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Floor:</span>
                              <span className="ml-2 font-medium">{asset.digitalAssets.nfcData.data.location.floor || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Room:</span>
                              <span className="ml-2 font-medium">{asset.digitalAssets.nfcData.data.location.room || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Coordinates:</span>
                              <span className="ml-2 font-medium">
                                {asset.digitalAssets.nfcData.data.location.latitude}, {asset.digitalAssets.nfcData.data.location.longitude}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Additional Info */}
                      <div className="bg-white rounded px-3 py-2 border border-purple-200">
                        <div className="text-purple-600 font-medium text-xs mb-2">Additional Information:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Assigned To:</span>
                            <span className="ml-2 font-medium">{asset.digitalAssets.nfcData.data.assignedTo || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-purple-600 font-medium">Timestamp:</span>
                            <span className="ml-2 font-medium">
                              {asset.digitalAssets.nfcData.data.timestamp ? 
                                new Date(asset.digitalAssets.nfcData.data.timestamp).toLocaleString() : 'N/A'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
            <Button
              onClick={() => {
                onClose()
                onShowAssetDetails(asset)
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Full Asset Details
            </Button>
            <Button
              variant="outline"
              onClick={() => onDownloadAssetInfo(asset)}
              className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Asset Info
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
