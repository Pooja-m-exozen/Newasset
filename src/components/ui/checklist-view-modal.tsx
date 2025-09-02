'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { 
  X, 
  Download, 
  MapPin, 
  User, 
  CheckSquare,
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

  const downloadScanner = () => {
    try {
      // Create a comprehensive scanner report
      const content = `Checklist Scanner Report
Generated: ${new Date().toLocaleString()}

Checklist Information:
- Title: ${checklist.title}
- Type: ${checklist.type}
- Priority: ${checklist.priority}
- Status: ${checklist.status}
- ID: ${checklist._id}

Location:
- Building: ${checklist.location.building}
- Floor: ${checklist.location.floor}
- Zone: ${checklist.location.zone}

QR Code Data: ${checklist.qrCode?.data || 'Not available'}
QR Code URL: ${checklist.qrCode?.url || 'Not available'}

Items Count: ${checklist.items.length}
Created By: ${checklist.createdBy?.name || 'Unknown'}
Created: ${formatDate(checklist.createdAt)}
Updated: ${formatDate(checklist.updatedAt)}

This report was generated from the FacilioTrack Checklist Management System.`
      
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `checklist-scanner-report-${checklist._id}-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading scanner report:', error)
      alert('Failed to download scanner report. Please try again.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        {/* Simple Header */}
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-gray-900 truncate mb-1">{checklist.title}</h2>
                <p className="text-sm text-gray-600 mb-2">{checklist.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {checklist.type}
                  </Badge>
                  <Badge className={cn('text-xs', PRIORITY_COLORS[checklist.priority])}>
                    {checklist.priority}
                  </Badge>
                  <Badge className={cn('text-xs', STATUS_COLORS[checklist.status])}>
                    {checklist.status}
                  </Badge>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose} 
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Simple Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Left Column - QR Code & Scanner */}
          <div className="space-y-4">
            {/* QR Code Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                <QrCodeIcon className="w-4 h-4 text-blue-600" />
                QR Code
              </h3>
              
              <div className="text-center">
                {hasQRCode ? (
                  <div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 mb-3 inline-block">
                      <Image 
                        src={checklist.qrCode!.url.startsWith('http') ? checklist.qrCode!.url : `${API_BASE_URL}${checklist.qrCode!.url}`}
                        alt="Checklist QR Code" 
                        width={100}
                        height={100}
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      Generated: {formatDate(checklist.qrCode!.generatedAt)}
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button onClick={downloadQRCode} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button onClick={() => handleCopyToClipboard(checklist._id)} variant="outline" size="sm">
                        <Copy className="w-4 h-4 mr-1" />
                        Copy ID
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-3 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                      {generatingQR ? (
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                      ) : (
                        <QrCodeIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    
                    {qrGenerationError && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {qrGenerationError}
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleGenerateQR}
                      disabled={generatingQR}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
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
            </div>

            {/* Scanner Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                <Scan className="w-4 h-4 text-green-600" />
                QR Scanner
              </h3>
              
              <div className="space-y-4">
                {/* Scanner Status & Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">Ready to Scan</p>
                      <p className="text-blue-600">Point your camera at a QR code to scan checklist information</p>
                    </div>
                  </div>
                </div>

                {/* Scanner Button */}
                <Button 
                  onClick={() => setScannerModalOpen(true)}
                  size="default"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Scan className="w-5 h-5 mr-2" />
                  Open QR Scanner
                </Button>

                {/* Scanner Features */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Real-time scanning</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Instant results</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span>Auto-focus</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span>High accuracy</span>
                  </div>
                </div>
                
                {/* Scan Result Status */}
                {scannedResult ? (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                          <span className="text-sm font-medium text-green-700">Scan Successful!</span>
                          <p className="text-xs text-green-600">QR code data captured</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="border-green-300 text-green-700 hover:bg-green-100 h-8 px-2"
                          onClick={() => setShowScanResultPopup(true)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="border-green-300 text-green-700 hover:bg-green-100 h-8 px-2"
                          onClick={downloadScanResult}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">No scan yet</span>
                        <p className="text-xs">Open scanner to begin</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                {scannedResult && (
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScannedResult(null)}
                        className="flex-1 text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear Result
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScannerModalOpen(true)}
                        className="flex-1 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Scan className="w-3 h-3 mr-1" />
                        Scan Again
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-gray-200 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-600 mb-1">Type</div>
                <div className="font-medium text-gray-900">{checklist.type}</div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-600 mb-1">Frequency</div>
                <div className="font-medium text-gray-900 capitalize">{checklist.frequency}</div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-600 mb-1">Items</div>
                <div className="font-medium text-gray-900">{checklist.items.length}</div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-600 mb-1">Location</div>
                <div className="font-medium text-gray-900">{checklist.location.building}</div>
              </div>
            </div>
          </div>

          {/* Right Column - Details & Items */}
          <div className="space-y-4">
            {/* Description */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Description
              </h3>
              <p className="text-sm text-gray-700">{checklist.description}</p>
            </div>

            {/* Location */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                Location
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Building:</span>
                  <span className="font-medium">{checklist.location.building}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Floor:</span>
                  <span className="font-medium">{checklist.location.floor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Zone:</span>
                  <span className="font-medium">{checklist.location.zone}</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600" />
                Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Created By:</span>
                  <span className="font-medium">{checklist.createdBy?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{formatDate(checklist.createdAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Updated:</span>
                  <span className="font-medium">{formatDate(checklist.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-green-600" />
                Items ({checklist.items.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {checklist.items.map((item) => (
                  <div key={item._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-medium text-white">
                        {item.serialNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">
                          {item.inspectionItem}
                        </h4>
                        {item.details && (
                          <p className="text-xs text-gray-600 mb-2">
                            {item.details}
                          </p>
                        )}
                        <Badge 
                          variant={item.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
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
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-orange-600" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {checklist.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Simple Footer */}
        <div className="pt-4 border-t border-gray-200 flex flex-col gap-3">
          <div className="text-xs text-gray-500">
            <span className="font-medium">ID:</span> {checklist._id} | 
            <span className="font-medium ml-2">Updated:</span> {formatDate(checklist.updatedAt)}
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadScanner} variant="outline" size="sm" className="flex-1">
              <Download className="w-4 h-4 mr-1" />
              Download Report
            </Button>
            <Button onClick={onClose} variant="outline" size="sm" className="flex-1">
              Close
            </Button>
          </div>
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

      {/* Enhanced Scan Result Popup */}
      {showScanResultPopup && scannedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            {/* Enhanced Popup Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-100 rounded-lg">
                  <Scan className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Scan Result</h3>
                  <p className="text-sm text-gray-600">QR Code scan details and information</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadScanResult}
                  className="border-green-300 text-green-700 hover:bg-green-50 px-4 py-2 text-sm rounded-lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Result
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowScanResultPopup(false)}
                  className="h-10 w-10 p-0 hover:bg-green-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Enhanced Popup Content */}
            <div className="p-6">
              {/* Scan Summary */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-700 uppercase tracking-wide">Scan Summary</span>
                </div>
                <div className="text-sm text-blue-800">
                  <p>QR code successfully scanned at <span className="font-medium">{new Date().toLocaleString()}</span></p>
                  <p className="mt-1">Data type: <span className="font-medium">Checklist Information</span></p>
                </div>
              </div>

              {/* Scan Result Content */}
              {renderScanResult(scannedResult)}
              
              {/* Enhanced Action Buttons */}
              <div className="mt-8 flex flex-col gap-3">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setScannedResult(null)}
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg text-sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Result
                  </Button>
                  <Button
                    onClick={() => setScannerModalOpen(true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm"
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    Scan Another
                  </Button>
                </div>
                <Button
                  onClick={() => setShowScanResultPopup(false)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-sm font-medium"
                >
                  Close & Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  )
}
