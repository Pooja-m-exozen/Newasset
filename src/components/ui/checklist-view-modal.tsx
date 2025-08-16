'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  Download, 
  QrCode, 
  Building, 
  MapPin, 
  User, 
  Calendar,
  CheckSquare,
  Clock,
  Tag,
  FileText,
  Eye,
  Loader2,
  CheckCircle,
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
    compliance: any[]
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
  const [qrGenerationSuccess, setQrGenerationSuccess] = useState(false)

  const API_BASE_URL = 'http://192.168.0.5:5021'
  const hasQRCode = checklist?.qrCode?.url

  // Auto-refresh checklist data when modal opens to show latest information
  useEffect(() => {
    if (isOpen && checklist?._id) {
      // Reset any previous states
      setQrGenerationSuccess(false)
      setQrGenerationError(null)
      setGeneratingQR(false)
      
      // Check if checklist has a QR code and show success state briefly
      if (checklist?.qrCode) {
        setQrGenerationSuccess(true)
        // Hide success message after 2 seconds
        setTimeout(() => {
          setQrGenerationSuccess(false)
        }, 2000)
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
          
          setQrGenerationSuccess(true)
          
          // Show success message briefly
          setTimeout(() => {
            setQrGenerationSuccess(false)
          }, 2000)
          
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
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto border-0 shadow-2xl bg-white dark:bg-slate-900">
        {/* Header */}
        <DialogHeader className="px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 border-b border-slate-200/60 dark:border-slate-700/60">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {checklist.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs border-slate-200/60 dark:border-slate-600/60">
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
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 hover:bg-white/80 dark:hover:bg-slate-800/80">
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Top Row - Key Information */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="border-slate-200/60 dark:border-slate-600/60">
              <CardContent className="p-3 text-center">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/20 mx-auto mb-1.5 w-fit">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Type</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{checklist.type}</p>
              </CardContent>
            </Card>
            
            <Card className="border-slate-200/60 dark:border-slate-600/60">
              <CardContent className="p-3 text-center">
                <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/20 mx-auto mb-1.5 w-fit">
                  <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Frequency</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{checklist.frequency}</p>
              </CardContent>
            </Card>
            
            <Card className="border-slate-200/60 dark:border-slate-600/60">
              <CardContent className="p-3 text-center">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/20 mx-auto mb-1.5 w-fit">
                  <CheckSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Items</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{checklist.items.length}</p>
              </CardContent>
            </Card>
            
            <Card className="border-slate-200/60 dark:border-slate-600/60">
              <CardContent className="p-3 text-center">
                <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/20 mx-auto mb-1.5 w-fit">
                  <Building className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Location</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{checklist.location.building}</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Section */}
          <Card className="border-slate-200/60 dark:border-slate-600/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{checklist.progress || 0}%</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Overall Progress</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${checklist.progress || 0}%` }}
                    />
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {checklist.items.filter(item => item.status === 'completed').length}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Completed Items</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                    {checklist.items.filter(item => item.status !== 'completed').length}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Pending Items</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Description */}
              <Card className="border-slate-200/60 dark:border-slate-600/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {checklist.description}
                  </p>
                </CardContent>
              </Card>

              {/* Location Details */}
              <Card className="border-slate-200/60 dark:border-slate-600/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Building</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{checklist.location.building}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Floor</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{checklist.location.floor}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Zone</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{checklist.location.zone}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Created By & Dates */}
              <Card className="border-slate-200/60 dark:border-slate-600/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Created By</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {checklist.createdBy?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {checklist.createdBy?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Created</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {formatDate(checklist.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Last Updated</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {formatDate(checklist.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Checklist Items */}
              <Card className="border-slate-200/60 dark:border-slate-600/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                    Checklist Items ({checklist.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {checklist.items.map((item, index) => (
                      <div key={item._id} className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/60 dark:border-slate-600/60">
                        <div className="flex-shrink-0 w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {item.serialNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 dark:text-white text-xs mb-1">
                            {item.inspectionItem}
                          </h4>
                          {item.details && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                              {item.details}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={item.status === 'completed' ? 'default' : 'secondary'}
                              className={cn(
                                'text-xs',
                                item.status === 'completed' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400'
                              )}
                            >
                              {item.status || 'pending'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              {checklist.tags && checklist.tags.length > 0 && (
                <Card className="border-slate-200/60 dark:border-slate-600/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Tag className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {checklist.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-700/60">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* QR Code Section */}
          <Card className="border-slate-200/60 dark:border-slate-600/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <QrCodeIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                QR Code & Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* QR Code Display */}
                <div className="text-center">
                  {hasQRCode ? (
                    <div>
                      <div className="bg-white p-3 rounded-lg inline-block shadow-lg border border-slate-200/60 dark:border-slate-600/60">
                        <Image 
                          src={checklist.qrCode!.url.startsWith('http') ? checklist.qrCode!.url : `${API_BASE_URL}${checklist.qrCode!.url}`}
                          alt="Checklist QR Code" 
                          width={160}
                          height={160}
                          className="w-40 h-40 object-contain"
                        />
                      </div>
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Generated: {formatDate(checklist.qrCode!.generatedAt)}
                        </p>
                        <div className="flex justify-center gap-2">
                          <Button onClick={downloadQRCode} variant="outline" size="sm" className="gap-1 text-xs h-8">
                            <Download className="w-3 h-3" />
                            Download
                          </Button>
                          <Button onClick={() => handleCopyToClipboard(checklist._id)} variant="outline" size="sm" className="gap-1 text-xs h-8">
                            <Copy className="w-3 h-3" />
                            Copy ID
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-3 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
                        {generatingQR ? (
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        ) : (
                          <QrCode className="w-8 h-8 text-slate-400" />
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                        {generatingQR ? 'Generating QR Code...' : 'No QR Code Available'}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        Generate a QR code to enable quick access and digital checklist management.
                      </p>
                      
                      {qrGenerationError && (
                        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                          <p className="text-xs text-red-700 dark:text-red-300">{qrGenerationError}</p>
                        </div>
                      )}
                      
                      <Button 
                        onClick={handleGenerateQR}
                        disabled={generatingQR}
                        size="sm"
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs h-8"
                      >
                        {generatingQR ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <QrCode className="w-3 h-3 mr-1" />
                            Generate QR Code
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* QR Scanner */}
                <div className="text-center">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center justify-center gap-2">
                    <Scan className="w-4 h-4 text-blue-500" />
                    QR Code Scanner
                  </h4>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowScanner(!showScanner)}
                    className="mb-3 border-blue-200/60 dark:border-blue-600/60 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs h-8"
                  >
                    {showScanner ? 'Hide Scanner' : 'Show Scanner'}
                  </Button>
                  
                  {showScanner && (
                    <div className="border border-slate-200/60 dark:border-slate-600/60 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/50">
                      <QRCodeScanner />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span>ID: {checklist._id}</span>
            <span>•</span>
            <span>Last updated: {formatDate(checklist.updatedAt)}</span>
          </div>
          <Button onClick={onClose} variant="outline" size="sm" className="border-slate-200/60 dark:border-slate-600/60 text-xs h-8">
            Close
          </Button>
    </div>
      </DialogContent>
    </Dialog>
  )
}
