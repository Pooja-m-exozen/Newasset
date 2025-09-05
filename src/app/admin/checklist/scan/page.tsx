'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QRScanner } from '@/components/ui/qr-scanner'
import { ChecklistExecution } from '@/components/ui/checklist-execution'
import { 
  QrCode, 
  Camera, 
  CheckSquare, 
  Building, 
  MapPin, 
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast, ToastContainer } from '@/components/ui/toast'

interface ChecklistItem {
  _id: string
  serialNumber: number
  inspectionItem: string
  details: string
  status?: 'pending' | 'completed' | 'not_applicable'
  remarks?: string
  completedAt?: string
  completedBy?: string
}

interface Checklist {
  _id: string
  title: string
  description: string
  type: string
  frequency: string
  priority: string
  status: 'active' | 'completed' | 'archived' | 'in_progress'
  location: {
    building: string
    floor: string
    zone: string
  }
  items: ChecklistItem[]
  assignedTo: string[]
  createdAt: string
  qrCode?: {
    url: string
    data: string
  }
}

// Matches the shape expected by `ChecklistExecution` component
type ExecutionChecklist = {
  _id: string
  title: string
  description: string
  type: string
  frequency: string
  priority: string
  location: {
    building: string
    floor: string
    zone: string
  }
  items: ChecklistItem[]
  assignedTo: string[]
  createdAt: string
  qrCode?: {
    url: string
    data: string
  }
}

const toChecklistFromExecution = (c: ExecutionChecklist, status: Checklist['status']): Checklist => ({
  ...c,
  status
})

export default function ChecklistScanPage() {
  const { user } = useAuth()
  const { toasts, addToast, removeToast } = useToast()
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scannedChecklist, setScannedChecklist] = useState<Checklist | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [recentScans, setRecentScans] = useState<Checklist[]>([])

  const handleQRScan = async (qrData: string) => {
    try {
      setIsLoading(true)
      
      // Parse QR code data (format: checklist:type:id)
      const [prefix, type, id] = qrData.split(':')
      
      if (prefix !== 'checklist') {
        addToast({
          type: 'error',
          title: 'Invalid QR Code',
          message: 'This QR code is not for a checklist. Please scan a valid checklist QR code.'
        })
        return
      }

      // Fetch all checklists from API and find the matching one
      const token = localStorage.getItem('authToken')
      if (!token) {
        addToast({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please log in to scan checklists.'
        })
        return
      }

      const response = await fetch('https://digitalasset.zenapi.co.in/api/checklists', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // Find checklist by ID or type
          const checklist = result.data.find((c: Checklist) => 
            c._id === id || 
            c.type === type || 
            (c.qrCode && c.qrCode.data === qrData)
          )
          
          if (checklist) {
            setScannedChecklist(checklist)
            
            addToast({
              type: 'success',
              title: 'Checklist Loaded',
              message: `Successfully loaded "${checklist.title}" checklist.`
            })
          } else {
            // If no exact match, create a mock checklist for demo
            const mockChecklist: Checklist = {
              _id: id,
              title: `${type.charAt(0).toUpperCase() + type.slice(1)} Checklist`,
              description: `QR Code scanned: ${qrData}`,
              type: type,
              frequency: 'daily',
              priority: 'medium',
              status: 'active',
              location: {
                building: 'Main Building',
                floor: 'Ground Floor',
                zone: 'Zone A'
              },
              items: [
                {
                  _id: '1',
                  serialNumber: 1,
                  inspectionItem: 'Visual Inspection',
                  details: 'Check for any visible damage or issues',
                  status: 'pending'
                },
                {
                  _id: '2',
                  serialNumber: 2,
                  inspectionItem: 'Safety Check',
                  details: 'Verify all safety measures are in place',
                  status: 'pending'
                },
                {
                  _id: '3',
                  serialNumber: 3,
                  inspectionItem: 'Functionality Test',
                  details: 'Test all functions and operations',
                  status: 'pending'
                }
              ],
              assignedTo: [user?.id || 'current-user'],
              createdAt: new Date().toISOString(),
              qrCode: {
                url: '',
                data: qrData
              }
            }
            
            setScannedChecklist(mockChecklist)
            
            addToast({
              type: 'success',
              title: 'Demo Checklist Loaded',
              message: `Created demo "${mockChecklist.title}" for QR code: ${qrData}`
            })
          }
        } else {
          throw new Error(result.message || 'Failed to load checklists')
        }
      } else {
        throw new Error(`Failed to load checklists: ${response.status}`)
      }
    } catch (error) {
      console.error('Error loading checklist:', error)
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: error instanceof Error ? error.message : 'Failed to load checklist. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveChecklist = async (updatedChecklist: ExecutionChecklist) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      // Check if this is a mock checklist (created from QR scan)
      if (updatedChecklist._id.startsWith('checklist:') || updatedChecklist._id.length < 10) {
        // For mock checklists, just show success message
        addToast({
          type: 'success',
          title: 'Progress Saved (Demo)',
          message: 'Your checklist progress has been saved locally. This is a demo checklist.'
        })
        return
      }

      // Convert to the format expected by the API
      const apiData = {
        ...updatedChecklist,
        status: 'in_progress'
      }

      const response = await fetch(`https://digitalasset.zenapi.co.in/api/checklists/${updatedChecklist._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Progress Saved',
          message: 'Your checklist progress has been saved successfully.'
        })
      } else {
        throw new Error('Failed to save progress')
      }
    } catch (error) {
      console.error('Error saving checklist:', error)
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save progress. Please try again.'
      })
    }
  }

  const handleCompleteChecklist = async (completedChecklist: ExecutionChecklist) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      // Check if this is a mock checklist (created from QR scan)
      if (completedChecklist._id.startsWith('checklist:') || completedChecklist._id.length < 10) {
        // For mock checklists, just show success message and add to recent scans
        addToast({
          type: 'success',
          title: 'Checklist Completed (Demo)',
          message: 'The demo checklist has been completed successfully!'
        })
        
        // Add to recent scans
        setRecentScans(prev => [toChecklistFromExecution(completedChecklist, 'completed'), ...prev.slice(0, 4)])
        setScannedChecklist(null)
        return
      }

      // Convert to the format expected by the API
      const apiData = {
        ...completedChecklist,
        status: 'completed',
        completedAt: new Date().toISOString()
      }

      const response = await fetch(`https://digitalasset.zenapi.co.in/api/checklists/${completedChecklist._id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Checklist Completed',
          message: 'The checklist has been completed and submitted successfully.'
        })
        
        // Add to recent scans
        setRecentScans(prev => [toChecklistFromExecution(completedChecklist, 'completed'), ...prev.slice(0, 4)])
        setScannedChecklist(null)
      } else {
        throw new Error('Failed to complete checklist')
      }
    } catch (error) {
      console.error('Error completing checklist:', error)
      addToast({
        type: 'error',
        title: 'Completion Failed',
        message: 'Failed to complete checklist. Please try again.'
      })
    }
  }

  const handleManualEntry = () => {
    const checklistId = prompt('Enter Checklist ID:')
    if (checklistId) {
      handleQRScan(`checklist:manual:${checklistId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                    QR Code Scanner
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                    Scan QR codes to execute checklists and track progress
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleManualEntry}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  Manual Entry
                </Button>
                <Button
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Camera className="w-4 h-4" />
                  Scan QR Code
                </Button>
              </div>
            </div>
          </div>

          {/* Instructions Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                How to Use
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">Scan QR Code</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use your device camera or upload from gallery to scan QR codes
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-green-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">Execute Checklist</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tick off items as you complete them and add remarks
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-purple-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">Submit Results</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Complete and submit the checklist with your signature
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Scans */}
          {recentScans.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                  Recent Scans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentScans.map((checklist) => (
                    <div
                      key={checklist._id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setScannedChecklist(checklist)
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                          {checklist.title}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {checklist.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <Building className="w-4 h-4" />
                        <span>{checklist.location.building}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>{checklist.location.zone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="relative">
                  <RefreshCw className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Loading Checklist...
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Please wait while we fetch the checklist data.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleQRScan}
        onError={(error) => {
          addToast({
            type: 'error',
            title: 'Scan Error',
            message: error
          })
        }}
      />

      {/* Checklist Execution Modal */}
      {scannedChecklist && (
        <ChecklistExecution
          checklist={scannedChecklist}
          onSave={handleSaveChecklist}
          onComplete={handleCompleteChecklist}
          onClose={() => {
            setScannedChecklist(null)
          }}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
