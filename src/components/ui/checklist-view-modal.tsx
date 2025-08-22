'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { 
  X, 
  Download, 
  Building, 
  MapPin, 
  User, 
  CheckSquare,
  Clock,
  Tag,
  FileText,
  Eye,
  Loader2,
  Copy,
  Scan,
  QrCode as QrCodeIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScannerModal } from './scanner-modal-component'
import Image from 'next/image'

interface ChecklistItem {
  _id: string
  serialNumber: number
  inspectionItem: string
  details: string
  status?: string
  remarks?: string
}

interface Checklist {
  _id: string
  title: string
  description: string
  type: string
  frequency: string
  priority: string
  status: 'active' | 'completed' | 'archived'
  assignedTo: string[]
  location: {
    building: string
    floor: string
    zone: string
  }
  items: ChecklistItem[]
  tags: string[]
  createdAt: string
  updatedAt: string
  createdBy?: {
    _id: string
    name: string
    email: string
  }
  qrCode?: {
    url: string
    data: string
    generatedAt: string
  }
  metadata?: {
    version: string
    compliance: string[]
  }
  progress?: number
}

interface ChecklistViewModalProps {
  isOpen: boolean
  onClose: () => void
  checklist: Checklist | null
  onChecklistUpdated?: (updatedChecklist: Checklist) => void
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
}

const STATUS_COLORS = {
  active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
}

export default function ChecklistViewModal({ isOpen, onClose, checklist, onChecklistUpdated }: ChecklistViewModalProps) {
  const [generatingQR, setGeneratingQR] = useState(false)
  const [qrGenerationError, setQrGenerationError] = useState<string | null>(null)
  const [scannerModalOpen, setScannerModalOpen] = useState(false)
  const [scannedResult, setScannedResult] = useState<string | null>(null)
  const [showScanResultPopup, setShowScanResultPopup] = useState(false)

  const API_BASE_URL = 'http://192.168.0.5:5021'
  const hasQRCode = checklist?.qrCode?.url

  // Auto-refresh checklist data when modal opens to show latest information
  useEffect(() => {
    if (isOpen && checklist?._id) {
      // Reset any previous states
      setQrGenerationError(null)
      setGeneratingQR(false)
      
      // Check if checklist has a QR code
      if (checklist?.qrCode) {
        // QR code exists, no need to show success state
      }
    }
  }, [isOpen, checklist?._id, checklist?.qrCode])

  // Show scan result popup when result is received
  useEffect(() => {
    if (scannedResult) {
      setShowScanResultPopup(true)
    }
  }, [scannedResult])

  if (!checklist) return null

  const downloadQRCode = () => {
    if (checklist.qrCode?.url) {
      try {
        const qrUrl = checklist.qrCode.url.startsWith('http') 
          ? checklist.qrCode.url 
          : `${API_BASE_URL}${checklist.qrCode.url}`
        
        // Fetch the image as blob and download
        fetch(qrUrl)
          .then(response => response.blob())
          .then(blob => {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `checklist-${checklist._id}-qr.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          })
          .catch(error => {
            console.error('Error downloading QR code:', error)
            alert('Failed to download QR code. Please try again.')
          })
      } catch (error) {
        console.error('Error downloading QR code:', error)
        alert('Failed to download QR code. Please try again.')
      }
    } else {
      alert('QR code not available for download')
    }
  }

  const downloadScanResult = () => {
    if (scannedResult) {
      try {
        const parsed = parseScanResult(scannedResult)
        let content = ''
        let filename = 'scan-result'
        
        if (parsed) {
          // Create a formatted text file
          content = `Scan Result Report
Generated: ${new Date().toLocaleString()}

Title: ${parsed.title || 'N/A'}
Type: ${parsed.type || 'N/A'}
Checklist ID: ${parsed.checklistId || 'N/A'}

Location:
- Building: ${parsed.location?.building || 'N/A'}
- Floor: ${parsed.location?.floor || 'N/A'}
- Zone: ${parsed.location?.zone || 'N/A'}

URL: ${parsed.url || 'N/A'}

Raw Data: ${scannedResult}`
          filename = `scan-result-${parsed.checklistId || 'unknown'}.txt`
        } else {
          content = `Scan Result
Generated: ${new Date().toLocaleString()}

Result: ${scannedResult}`
          filename = 'scan-result.txt'
        }
        
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error downloading scan result:', error)
        alert('Failed to download scan result. Please try again.')
      }
    }
  }

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleGenerateQR = async () => {
    if (!checklist?._id) return
    
    setGeneratingQR(true)
    setQrGenerationError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/checklists/${checklist._id}/qr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          checklistId: checklist._id,
          title: checklist.title,
          type: checklist.type,
          location: checklist.location,
          createdBy: checklist.createdBy
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.qrCode) {
          const updatedChecklist: Checklist = {
            ...checklist,
            qrCode: {
              url: data.qrCode.url,
              data: data.qrCode.data,
              generatedAt: data.qrCode.generatedAt || new Date().toISOString()
            }
          }
          
          // Update the checklist in the parent component if callback exists
          if (onChecklistUpdated) {
            onChecklistUpdated(updatedChecklist)
          }
          
        } else {
          setQrGenerationError(data.message || 'Failed to generate QR code')
        }
      } else {
        setQrGenerationError('Failed to generate QR code')
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      setQrGenerationError('Network error while generating QR code')
    } finally {
      setGeneratingQR(false)
    }
  }

  const handleScanResult = (result: string) => {
    setScannedResult(result)
    // You can add additional logic here to handle the scan result
    console.log('Scan result received:', result)
  }

  // Function to parse JSON scan results and display them in readable format
  const parseScanResult = (result: string) => {
    try {
      const parsed = JSON.parse(result)
      return parsed
    } catch {
      return null
    }
  }

  // Function to render scan result in readable format
  const renderScanResult = (result: string) => {
    const parsed = parseScanResult(result)
    
    if (!parsed) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700 font-medium">Scan Result:</p>
          <p className="text-sm text-blue-800 break-all">{result}</p>
        </div>
      )
    }

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <p className="text-sm text-green-700 font-medium">Scan Result</p>
        </div>
        
        <div className="space-y-3">
          {/* Title */}
          {parsed.title && (
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium uppercase">Title</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{parsed.title}</p>
            </div>
          )}

          {/* Type */}
          {parsed.type && (
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium uppercase">Type</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 capitalize">{parsed.title}</p>
            </div>
          )}

          {/* Location */}
          {parsed.location && (
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium uppercase">Location</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                {parsed.location.building && (
                  <div>
                    <span className="text-gray-500">Building:</span>
                    <span className="ml-2 font-medium text-gray-900">{parsed.location.building}</span>
                  </div>
                )}
                {parsed.location.floor && (
                  <div>
                    <span className="text-gray-500">Floor:</span>
                    <span className="ml-2 font-medium text-gray-900">{parsed.location.floor}</span>
                  </div>
                )}
                {parsed.location.zone && (
                  <div>
                    <span className="text-gray-500">Zone:</span>
                    <span className="ml-2 font-medium text-gray-900">{parsed.location.zone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* URL */}
          {parsed.url && (
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium uppercase">URL</span>
              </div>
              <a 
                href={parsed.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
              >
                {parsed.url}
              </a>
            </div>
          )}

          {/* Checklist ID */}
          {parsed.checklistId && (
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium uppercase">Checklist ID</span>
              </div>
              <p className="text-sm font-mono text-gray-900 break-all">{parsed.checklistId}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl w-full max-h-[90vh] overflow-y-auto p-4">
        {/* Compact Header */}
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-sm flex-shrink-0">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-gray-900 truncate">{checklist.title}</h2>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{checklist.description}</p>
                <div className="flex flex-wrap items-center gap-1 mt-2">
                  <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 px-2 py-0.5">
                    {checklist.type}
                  </Badge>
                  <Badge className={cn('text-xs font-medium px-2 py-0.5', PRIORITY_COLORS[checklist.priority])}>
                    {checklist.priority}
                  </Badge>
                  <Badge className={cn('text-xs font-medium px-2 py-0.5', STATUS_COLORS[checklist.status])}>
                    {checklist.status}
                  </Badge>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose} 
              className="h-8 w-8 p-0 flex-shrink-0 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Compact Content */}
        <div className="space-y-4 py-4">
          {/* Compact QR Code & Scanner Section */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-800">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                <QrCodeIcon className="w-4 h-4 text-white" />
              </div>
              QR Code & Scanner
            </h3>
            
            <div className="space-y-4">
              {/* QR Code Display */}
              <div className="text-center">
                {hasQRCode ? (
                  <div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <Image 
                        src={checklist.qrCode!.url.startsWith('http') ? checklist.qrCode!.url : `${API_BASE_URL}${checklist.qrCode!.url}`}
                        alt="Checklist QR Code" 
                        width={120}
                        height={120}
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-blue-700 font-medium">
                          Generated: {formatDate(checklist.qrCode!.generatedAt)}
                        </p>
                      </div>
                      <div className="flex justify-center gap-2">
                        <Button onClick={downloadQRCode} variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50 px-3 py-1 text-xs rounded-lg">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                        <Button onClick={() => handleCopyToClipboard(checklist._id)} variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1 text-xs rounded-lg">
                          <Copy className="w-3 h-3 mr-1" />
                          Copy ID
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-3 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-white shadow-sm">
                      {generatingQR ? (
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      ) : (
                        <QrCodeIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      {generatingQR ? 'Generating QR Code...' : 'No QR Code Generated'}
                    </h4>
                    
                    {qrGenerationError && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                        {qrGenerationError}
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleGenerateQR}
                      disabled={generatingQR}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm"
                    >
                      {generatingQR ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <QrCodeIcon className="w-4 h-4 mr-1" />
                          Generate QR Code
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Compact Scanner Section */}
                <div className="text-center">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Scan QR Code</h4>
                  
                <div className="space-y-3">
                    <Button 
                      onClick={() => setScannerModalOpen(true)}
                    size="sm"
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm"
                    >
                    <Scan className="w-4 h-4 mr-1" />
                      Open Scanner
                    </Button>
                    
                    {/* Scan Result Notification */}
                    {scannedResult && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-green-700">Scan Result Available</span>
                          </div>
                          <Button 
                            variant="outline"
                            size="sm"
                          className="border-green-300 text-green-700 hover:bg-green-100 rounded-lg px-2 py-1 text-xs"
                            onClick={() => setShowScanResultPopup(true)}
                          >
                          View
                          </Button>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Compact Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-3 text-center shadow-sm">
              <div className="w-8 h-8 bg-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center shadow-sm">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="text-xs text-blue-600 mb-1 font-medium">Type</div>
              <div className="font-bold text-blue-900 text-sm">{checklist.type}</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-3 text-center shadow-sm">
              <div className="w-8 h-8 bg-green-500 rounded-lg mx-auto mb-2 flex items-center justify-center shadow-sm">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div className="text-xs text-green-600 mb-1 font-medium">Frequency</div>
              <div className="font-bold text-green-900 text-sm capitalize">{checklist.frequency}</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-3 text-center shadow-sm">
              <div className="w-8 h-8 bg-purple-500 rounded-lg mx-auto mb-2 flex items-center justify-center shadow-sm">
                <CheckSquare className="w-4 h-4 text-white" />
              </div>
              <div className="text-xs text-purple-600 mb-1 font-medium">Items</div>
              <div className="font-bold text-purple-900 text-sm">{checklist.items.length}</div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 p-3 text-center shadow-sm">
              <div className="w-8 h-8 bg-orange-500 rounded-lg mx-auto mb-2 flex items-center justify-center shadow-sm">
                <Building className="w-4 h-4 text-white" />
              </div>
              <div className="text-xs text-orange-600 mb-1 font-medium">Location</div>
              <div className="font-bold text-orange-900 text-sm">{checklist.location.building}</div>
            </div>
          </div>

          {/* Main Content - Single Column Layout */}
          <div className="space-y-4">
              {/* Description */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  Description
                </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{checklist.description}</p>
              </div>

              {/* Location */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  Location Details
                </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-600 font-medium">Building:</span>
                  <span className="text-sm font-semibold text-gray-900">{checklist.location.building}</span>
                  </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-600 font-medium">Floor:</span>
                  <span className="text-sm font-semibold text-gray-900">{checklist.location.floor}</span>
                  </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-600 font-medium">Zone:</span>
                  <span className="text-sm font-semibold text-gray-900">{checklist.location.zone}</span>
                </div>
                </div>
              </div>

              {/* Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <User className="w-4 h-4 text-purple-600" />
                  </div>
                  Additional Details
                </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-600 font-medium">Created By:</span>
                  <span className="text-sm font-semibold text-gray-900">{checklist.createdBy?.name || 'Unknown'}</span>
                  </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-600 font-medium">Created:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatDate(checklist.createdAt)}</span>
                  </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-600 font-medium">Updated:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatDate(checklist.updatedAt)}</span>
                </div>
              </div>
            </div>

              {/* Checklist Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <CheckSquare className="w-4 h-4 text-green-600" />
                  </div>
                  Checklist Items ({checklist.items.length})
                </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {checklist.items.map((item) => (
                  <div key={item._id} className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
                          {item.serialNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-xs mb-1">
                            {item.inspectionItem}
                          </h4>
                          {item.details && (
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed line-clamp-2">
                              {item.details}
                            </p>
                          )}
                          <Badge 
                            variant={item.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs px-2 py-0.5 rounded-full"
                          >
                            {item.status || 'pending'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {checklist.tags && checklist.tags.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <div className="p-1.5 bg-orange-100 rounded-lg">
                    <Tag className="w-4 h-4 text-orange-600" />
                    </div>
                    Tags
                  </h3>
                <div className="flex flex-wrap gap-1">
                    {checklist.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                      className="text-xs bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 transition-colors duration-200 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Compact Footer */}
        <div className="pt-4 border-t border-gray-200 flex flex-col items-start gap-3">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-2">
              <Tag className="w-3 h-3" />
              <span className="font-medium">ID:</span>
              <span className="font-mono text-gray-700 text-xs">{checklist._id}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span className="font-medium">Updated:</span>
              <span className="text-gray-700 text-xs">{formatDate(checklist.updatedAt)}</span>
            </div>
          </div>
          <Button onClick={onClose} variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm w-full">
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Scanner Modal */}
      <ScannerModal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
        onScanResult={handleScanResult}
        scannedResult={scannedResult}
        checklists={[{
          _id: checklist._id,
          title: checklist.title,
          qrCode: {
            data: checklist.qrCode?.data || '',
            url: checklist.qrCode?.url || ''
          },
          location: {
            building: checklist.location.building,
            floor: checklist.location.floor,
            zone: checklist.location.zone
          },
          type: checklist.type,
          status: checklist.status,
          priority: checklist.priority
        }]}
        mode="checklists"
      />

      {/* Compact Scan Result Popup Modal */}
      {showScanResultPopup && scannedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            {/* Popup Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <Scan className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Scan Result</h3>
                  <p className="text-xs text-gray-600">QR Code scan details</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadScanResult}
                  className="border-green-300 text-green-700 hover:bg-green-50 px-3 py-1 text-xs rounded-lg"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowScanResultPopup(false)}
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Popup Content */}
            <div className="p-4">
              {renderScanResult(scannedResult)}
              
              {/* Action Buttons */}
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => setScannedResult(null)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm"
                >
                  Clear Result
                </Button>
                <Button
                  onClick={() => setShowScanResultPopup(false)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  )
}
