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
      <DialogContent className="min-w-[320px] sm:min-w-[600px] md:min-w-[800px] min-h-[500px] sm:min-h-[600px] max-w-5xl max-h-[90vh] w-[95vw] sm:w-[90vw] h-[90vh] sm:h-[85vh] overflow-y-auto border-0 shadow-2xl bg-white dark:bg-slate-900">
        {/* Enhanced Header */}
        <DialogHeader className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-blue-900/20 dark:to-indigo-900/20 border-b border-slate-200/60 dark:border-slate-700/60">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 shadow-lg ring-4 ring-blue-100 dark:ring-blue-900/30">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  {checklist.title}
                </h2>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-sm px-3 py-1 border-slate-200/60 dark:border-slate-600/60 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                    {checklist.type}
                  </Badge>
                  <Badge className={cn('text-sm px-3 py-1 font-semibold shadow-sm', PRIORITY_COLORS[checklist.priority])}>
                    {checklist.priority}
                  </Badge>
                  <Badge className={cn('text-sm px-3 py-1 font-semibold shadow-sm', STATUS_COLORS[checklist.status])}>
                    {checklist.status}
                  </Badge>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose} 
              className="h-10 w-10 p-0 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-full transition-all duration-200 hover:scale-110"
            >
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 min-h-[500px]">
          {/* Enhanced QR Code Scanner Section */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl p-6 border border-amber-200/60 dark:border-amber-700/60 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg">
                <QrCodeIcon className="w-5 h-5 text-white" />
              </div>
              QR Code & Scanner
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Enhanced QR Code Display */}
              <div className="text-center">
                {hasQRCode ? (
                  <div>
                    <div className="bg-white p-4 rounded-xl inline-block border border-amber-200/60 dark:border-amber-600/60 shadow-lg">
                      <Image 
                        src={checklist.qrCode!.url.startsWith('http') ? checklist.qrCode!.url : `${API_BASE_URL}${checklist.qrCode!.url}`}
                        alt="Checklist QR Code" 
                        width={140}
                        height={140}
                        className="w-35 h-35 object-contain"
                      />
                    </div>
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-800/60 px-3 py-2 rounded-lg">
                        Generated: {formatDate(checklist.qrCode!.generatedAt)}
                      </p>
                      <div className="flex justify-center gap-3">
                        <Button onClick={downloadQRCode} variant="outline" size="sm" className="text-sm h-9 px-4 border-amber-200 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button onClick={() => handleCopyToClipboard(checklist._id)} variant="outline" size="sm" className="text-sm h-9 px-4 border-amber-200 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                          <Copy className="w-4 h-4 mr-2" />
                          Copy ID
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-3 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-600 flex items-center justify-center bg-white/60 dark:bg-slate-800/60">
                      {generatingQR ? (
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                      ) : (
                        <QrCode className="w-8 h-8 text-amber-400" />
                      )}
                    </div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                      {generatingQR ? 'Generating...' : 'No QR Code'}
                    </h4>
                    
                    {qrGenerationError && (
                      <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
                        {qrGenerationError}
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleGenerateQR}
                      disabled={generatingQR}
                      size="sm"
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm h-9 px-6 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {generatingQR ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4 mr-2" />
                          Generate QR
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Enhanced QR Scanner */}
              <div className="text-center">
                <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center justify-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                    <Scan className="w-4 h-4 text-white" />
                  </div>
                  Scanner
                </h4>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowScanner(!showScanner)}
                  className="mb-4 border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 text-sm h-9 px-6 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                >
                  {showScanner ? 'Hide Scanner' : 'Show Scanner'}
                </Button>
                
                {showScanner && (
                  <div className="border border-blue-200/60 dark:border-blue-600/60 rounded-xl p-4 bg-white/80 dark:bg-slate-800/80 shadow-lg">
                    <QRCodeScanner />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Key Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-200/60 dark:border-blue-600/60 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto mb-3 w-fit shadow-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Type</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{checklist.type}</p>
            </div>
            
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl border border-green-200/60 dark:border-green-600/60 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
              <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 mx-auto mb-3 w-fit shadow-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Frequency</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{checklist.frequency}</p>
            </div>
            
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10 rounded-xl border border-purple-200/60 dark:border-purple-600/60 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 mx-auto mb-3 w-fit shadow-lg">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Items</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{checklist.items.length}</p>
            </div>
            
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-xl border border-orange-200/60 dark:border-orange-600/60 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
              <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 mx-auto mb-3 w-fit shadow-lg">
                <Building className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Location</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{checklist.location.building}</p>
            </div>
          </div>

          {/* Enhanced Progress Section */}
          <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-blue-900/10 dark:to-indigo-900/10 rounded-xl p-6 border border-slate-200/60 dark:border-slate-600/60 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              Progress Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center group">
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2 group-hover:scale-110 transition-transform duration-200">
                  {checklist.progress || 0}%
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Overall Progress</div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mt-2 overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                    style={{ width: `${checklist.progress || 0}%` }}
                  />
                </div>
              </div>
              
              <div className="text-center group">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2 group-hover:scale-110 transition-transform duration-200">
                  {checklist.items.filter(item => item.status === 'completed').length}
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Completed Items</div>
                <div className="w-16 h-16 mx-auto mt-3 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              
              <div className="text-center group">
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform duration-200">
                  {checklist.items.filter(item => item.status !== 'completed').length}
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending Items</div>
                <div className="w-16 h-16 mx-auto mt-3 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-full">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Enhanced Description */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/10 rounded-xl p-5 border border-slate-200/60 dark:border-slate-600/60 shadow-sm hover:shadow-md transition-all duration-200">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-slate-500 to-blue-600 shadow-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  Description
                </h3>
                <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                  {checklist.description}
                </p>
              </div>

              {/* Enhanced Location Details */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl p-5 border border-blue-200/60 dark:border-blue-600/60 shadow-sm hover:shadow-md transition-all duration-200">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  Location Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-600/60">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Building</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{checklist.location.building}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-600/60">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                      <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Floor</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{checklist.location.floor}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-600/60">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                      <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Zone</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{checklist.location.zone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Details */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/10 rounded-xl p-5 border border-slate-200/60 dark:border-slate-600/60 shadow-sm hover:shadow-md transition-all duration-200">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-slate-500 to-blue-600 shadow-lg">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-600/60">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Created By</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {checklist.createdBy?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {checklist.createdBy?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-600/60">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                      <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Created</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {formatDate(checklist.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-600/60">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                      <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Last Updated</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {formatDate(checklist.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Enhanced Checklist Items */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-5 border border-green-200/60 dark:border-green-600/60 shadow-sm hover:shadow-md transition-all duration-200">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                    <CheckSquare className="w-5 h-5 text-white" />
                  </div>
                  Checklist Items ({checklist.items.length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {checklist.items.map((item, index) => (
                    <div key={item._id} className="group flex items-start gap-3 p-4 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-600/60 hover:shadow-md hover:border-green-300 dark:hover:border-green-600 transition-all duration-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg">
                        {item.serialNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors duration-200">
                          {item.inspectionItem}
                        </h4>
                        {item.details && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                            {item.details}
                          </p>
                        )}
                        <Badge 
                          variant={item.status === 'completed' ? 'default' : 'secondary'}
                          className={cn(
                            'text-xs px-3 py-1 font-medium',
                            item.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-700'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          )}
                        >
                          {item.status || 'pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced Tags */}
              {checklist.tags && checklist.tags.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl p-5 border border-blue-200/60 dark:border-blue-600/60 shadow-sm hover:shadow-md transition-all duration-200">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                      <Tag className="w-5 h-5 text-white" />
                    </div>
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {checklist.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-sm px-4 py-2 bg-white/80 dark:bg-slate-800/80 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-700/60 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-105 shadow-sm"
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

        {/* Enhanced Footer */}
        <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-blue-900/20 dark:to-indigo-900/20 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-600/60">
              <span className="font-medium">ID:</span>
              <span className="font-mono text-xs">{checklist._id}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-600/60">
              <span className="font-medium">Updated:</span>
              <span>{formatDate(checklist.updatedAt)}</span>
            </div>
          </div>
          <Button 
            onClick={onClose} 
            variant="outline" 
            size="sm" 
            className="border-slate-200/60 dark:border-slate-600/60 text-sm h-10 px-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
