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
import { QRCodeScanner } from './qr-code-scanner'
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
  const [showScanner, setShowScanner] = useState(false)
  const [generatingQR, setGeneratingQR] = useState(false)
  const [qrGenerationError, setQrGenerationError] = useState<string | null>(null)

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

  if (!checklist) return null

  const downloadQRCode = () => {
    if (checklist.qrCode?.url) {
      const link = document.createElement('a')
      link.href = checklist.qrCode.url
      link.download = `checklist-${checklist._id}-qr.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Simple Header */}
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{checklist.title}</h2>
                <div className="flex items-center gap-2 mt-1">
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

        {/* Content */}
        <div className="space-y-4 py-4">
          {/* Enhanced QR Code & Scanner Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-800">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                <QrCodeIcon className="w-5 h-5 text-white" />
              </div>
              QR Code & Scanner
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* QR Code Display */}
              <div className="text-center">
                {hasQRCode ? (
                  <div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-2xl inline-block border-2 border-gray-200 shadow-lg">
                      <Image 
                        src={checklist.qrCode!.url.startsWith('http') ? checklist.qrCode!.url : `${API_BASE_URL}${checklist.qrCode!.url}`}
                        alt="Checklist QR Code" 
                        width={140}
                        height={140}
                        className="w-35 h-35 object-contain"
                      />
                    </div>
                    <div className="mt-6 space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                        <p className="text-sm text-blue-700 font-medium">
                          Generated: {formatDate(checklist.qrCode!.generatedAt)}
                        </p>
                      </div>
                      <div className="flex justify-center gap-4">
                        <Button onClick={downloadQRCode} variant="outline" size="sm" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 px-6 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button onClick={() => handleCopyToClipboard(checklist._id)} variant="outline" size="sm" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 px-6 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                          <Copy className="w-4 h-4 mr-2" />
                          Copy ID
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-28 h-28 mx-auto mb-6 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      {generatingQR ? (
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                      ) : (
                        <QrCodeIcon className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">
                      {generatingQR ? 'Generating QR Code...' : 'No QR Code Generated'}
                    </h4>
                    
                    {qrGenerationError && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        {qrGenerationError}
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleGenerateQR}
                      disabled={generatingQR}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {generatingQR ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <QrCodeIcon className="w-5 h-5 mr-2" />
                          Generate QR Code
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Enhanced Scanner Section */}
              <div className="space-y-6">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">Scan QR Code</h4>
                  
                  {/* Scanner Controls */}
                  <div className="space-y-4">
                    <Button 
                      onClick={() => setShowScanner(!showScanner)}
                      variant="outline"
                      size="lg"
                      className={`w-full rounded-xl border-2 ${
                        showScanner 
                          ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100' 
                          : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      <Scan className="w-5 h-5 mr-2" />
                      {showScanner ? 'Stop Scanner' : 'Start Scanner'}
                    </Button>
                    
                    {showScanner && (
                      <div className="space-y-3">
                        <Button 
                          variant="outline"
                          size="lg"
                          className="w-full bg-green-50 border-green-300 text-green-700 hover:bg-green-100 rounded-xl"
                          onClick={() => {/* Capture functionality */}}
                        >
                          <QrCodeIcon className="w-5 h-5 mr-2" />
                          Capture QR Code
                        </Button>
                        
                        <Button 
                          variant="outline"
                          size="lg"
                          className="w-full bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100 rounded-xl"
                          onClick={() => {/* Gallery upload functionality */}}
                        >
                          <FileText className="w-5 h-5 mr-2" />
                          Upload from Gallery
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Scanner Display */}
                {showScanner && (
                  <div className="border-2 border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
                    <div className="text-center mb-4">
                      <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mb-3 animate-pulse shadow-lg"></div>
                      <p className="text-sm text-gray-600 font-medium">Scanner Active</p>
                    </div>
                    <QRCodeScanner />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4 text-center hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 bg-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm text-blue-600 mb-1">Type</div>
              <div className="font-semibold text-blue-900">{checklist.type}</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-4 text-center hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 bg-green-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm text-green-600 mb-1">Frequency</div>
              <div className="font-semibold text-green-900">{checklist.frequency}</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-4 text-center hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 bg-purple-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm text-purple-600 mb-1">Items</div>
              <div className="font-semibold text-purple-900">{checklist.items.length}</div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 p-4 text-center hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 bg-orange-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <Building className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm text-orange-600 mb-1">Location</div>
              <div className="font-semibold text-orange-900">{checklist.location.building}</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              {/* Description */}
              <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed">{checklist.description}</p>
              </div>

              {/* Location */}
              <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Location Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Building:</span>
                    <span className="font-semibold text-gray-900">{checklist.location.building}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Floor:</span>
                    <span className="font-semibold text-gray-900">{checklist.location.floor}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Zone:</span>
                    <span className="font-semibold text-gray-900">{checklist.location.zone}</span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Additional Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Created By:</span>
                    <span className="font-semibold text-gray-900">{checklist.createdBy?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Created:</span>
                    <span className="font-semibold text-gray-900">{formatDate(checklist.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Updated:</span>
                    <span className="font-semibold text-gray-900">{formatDate(checklist.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {/* Checklist Items */}
              <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-green-600" />
                  Checklist Items ({checklist.items.length})
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {checklist.items.map((item) => (
                    <div key={item._id} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-sm transition-all duration-200">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
                          {item.serialNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm mb-2">
                            {item.inspectionItem}
                          </h4>
                          {item.details && (
                            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                              {item.details}
                            </p>
                          )}
                          <Badge 
                            variant={item.status === 'completed' ? 'default' : 'secondary'}
                            className={cn(
                              'text-xs px-3 py-1',
                              item.status === 'completed' 
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            )}
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
                <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-orange-600" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {checklist.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 transition-colors duration-200"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Simple Footer */}
        <div className="pt-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-500">
            ID: {checklist._id} • Updated: {formatDate(checklist.updatedAt)}
          </div>
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
