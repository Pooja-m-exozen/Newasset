"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  Calendar, 
  Building2, 
  MapPin,
  Clock,
  User,
  Save,
  CheckSquare
} from 'lucide-react'

import { Checklist } from '@/types/checklist'

// Override the status type for calendar modal to include in_progress
interface CalendarChecklist extends Omit<Checklist, 'status'> {
  status: 'active' | 'completed' | 'archived' | 'in_progress'
}

interface CalendarActionPayload {
  checklist: CalendarChecklist | null
  dayData: DayData[]
  inspectorName: string
  inspectorId: string
  frequency: 'daily' | 'weekly' | 'monthly'
}

interface CalendarChecklistModalProps {
  isOpen: boolean
  onCloseAction: () => void
  checklist: CalendarChecklist | null
  onSave?: (data: CalendarActionPayload) => void
  onComplete?: (data: CalendarActionPayload) => void
}

interface DayStatus {
  [itemId: string]: 'completed' | 'failed' | 'not_applicable' | 'pending'
}

interface DayData {
  date: string
  status: DayStatus
  remarks?: string
  completedBy?: string
  completedAt?: string
}

export default function CalendarChecklistModal({ 
  isOpen, 
  onCloseAction, 
  checklist, 
  onSave, 
  onComplete 
}: CalendarChecklistModalProps) {
  const [selectedFrequency, setSelectedFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [currentMonth] = useState<Date>(new Date())
  const [dayData, setDayData] = useState<DayData[]>([])
  const [inspectorName, setInspectorName] = useState('')
  const [inspectorId, setInspectorId] = useState('')

  // Generate dates based on frequency
  const generateDates = () => {
    const dates: string[] = []
    const today = new Date()
    
    if (selectedFrequency === 'daily') {
      // Show current date
      dates.push(today.toISOString().split('T')[0])
    } else if (selectedFrequency === 'weekly') {
      // Show 7 days from today
      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        dates.push(date.toISOString().split('T')[0])
      }
    } else if (selectedFrequency === 'monthly') {
      // Show all days of current month
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        dates.push(date.toISOString().split('T')[0])
      }
    }
    
    return dates
  }

  const dates = generateDates()

  // Initialize day data
  useEffect(() => {
    if (checklist && dates.length > 0) {
      const initialDayData: DayData[] = dates.map(date => ({
        date,
        status: checklist.items.reduce((acc, item) => {
          acc[item._id] = 'pending'
          return acc
        }, {} as DayStatus),
        remarks: '',
        completedBy: inspectorName,
        completedAt: new Date().toISOString()
      }))
      setDayData(initialDayData)
    }
  }, [checklist, dates, selectedFrequency, currentMonth, inspectorName])

  const handleItemStatusChange = (date: string, itemId: string, status: 'completed' | 'failed' | 'not_applicable' | 'pending') => {
    setDayData(prev => prev.map(day => 
      day.date === date 
        ? {
            ...day,
            status: {
              ...day.status,
              [itemId]: status
            },
            completedBy: inspectorName,
            completedAt: new Date().toISOString()
          }
        : day
    ))
  }

  const handleRemarksChange = (date: string, remarks: string) => {
    setDayData(prev => prev.map(day => 
      day.date === date 
        ? { ...day, remarks }
        : day
    ))
  }

  const getCompletionStats = (date: string) => {
    const day = dayData.find(d => d.date === date)
    if (!day || !checklist) return { completed: 0, failed: 0, pending: 0, total: 0 }
    
    const total = checklist.items.length
    const completed = Object.values(day.status).filter(status => status === 'completed').length
    const failed = Object.values(day.status).filter(status => status === 'failed').length
    const pending = total - completed - failed
    
    return { completed, failed, pending, total }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const handleSave = () => {
    if (onSave) {
      onSave({
        checklist,
        dayData,
        inspectorName,
        inspectorId,
        frequency: selectedFrequency
      })
    }
  }

  const handleComplete = () => {
    if (onComplete) {
      onComplete({
        checklist,
        dayData,
        inspectorName,
        inspectorId,
        frequency: selectedFrequency
      })
    }
  }

  if (!checklist) return null

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  {checklist.title}
                </DialogTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {checklist.description}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onCloseAction}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          {/* Header Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">Building</p>
                    <p className="text-sm font-medium">{checklist.location.building}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium">{checklist.location.floor} - {checklist.location.zone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-xs text-gray-500">Frequency</p>
                    <p className="text-sm font-medium capitalize">{checklist.frequency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${
                    checklist.priority === 'high' ? 'bg-red-100 text-red-800' :
                    checklist.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {checklist.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Frequency Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Select Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={selectedFrequency === 'daily' ? 'default' : 'outline'}
                  onClick={() => setSelectedFrequency('daily')}
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Daily
                </Button>
                <Button
                  variant={selectedFrequency === 'weekly' ? 'default' : 'outline'}
                  onClick={() => setSelectedFrequency('weekly')}
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Weekly (7 days)
                </Button>
                <Button
                  variant={selectedFrequency === 'monthly' ? 'default' : 'outline'}
                  onClick={() => setSelectedFrequency('monthly')}
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Monthly
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Inspector Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Inspector Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inspectorName">Inspector Name</Label>
                  <Input
                    id="inspectorName"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    placeholder="Enter inspector name"
                  />
                </div>
                <div>
                  <Label htmlFor="inspectorId">Inspector ID</Label>
                  <Input
                    id="inspectorId"
                    value={inspectorId}
                    onChange={(e) => setInspectorId(e.target.value)}
                    placeholder="Enter inspector ID"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Checklist Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Checklist Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-semibold">
                        S. No.
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-semibold">
                        Activities
                      </th>
                      {dates.map((date, index) => (
                        <th key={date} className="border border-gray-300 dark:border-gray-600 p-2 text-center text-xs font-semibold min-w-[80px]">
                          <div className="flex flex-col items-center">
                            <span className="font-bold">{index + 1}</span>
                            <span className="text-xs text-gray-500">{formatDate(date)}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {checklist.items.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="border border-gray-300 dark:border-gray-600 p-2 text-center text-sm font-medium">
                          {item.serialNumber}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {item.inspectionItem}
                            </div>
                            {item.details && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {item.details}
                              </div>
                            )}
                          </div>
                        </td>
                        {dates.map((date) => {
                          const day = dayData.find(d => d.date === date)
                          const status = day?.status[item._id] || 'pending'
                          
                          return (
                            <td key={date} className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                              <div className="flex flex-col gap-1">
                                <div className="flex justify-center gap-1">
                                  <Button
                                    size="sm"
                                    variant={status === 'completed' ? 'default' : 'outline'}
                                    onClick={() => handleItemStatusChange(date, item._id, 'completed')}
                                    className={`h-6 w-6 p-0 ${
                                      status === 'completed' 
                                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                                        : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-300'
                                    }`}
                                    title="Mark as Complete"
                                  >
                                    ✓
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={status === 'failed' ? 'default' : 'outline'}
                                    onClick={() => handleItemStatusChange(date, item._id, 'failed')}
                                    className={`h-6 w-6 p-0 ${
                                      status === 'failed' 
                                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                                        : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300'
                                    }`}
                                    title="Mark as Failed"
                                  >
                                    ✗
                                  </Button>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {status === 'completed' ? '✓' : status === 'failed' ? '✗' : '○'}
                                </div>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Daily Remarks */}
          {selectedFrequency === 'daily' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Daily Remarks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dates.map((date) => {
                    const day = dayData.find(d => d.date === date)
                    const stats = getCompletionStats(date)
                    
                    return (
                      <div key={date} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {formatDate(date)}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">
                              ✓ {stats.completed}
                            </Badge>
                            <Badge className="bg-red-100 text-red-800">
                              ✗ {stats.failed}
                            </Badge>
                            <Badge className="bg-gray-100 text-gray-800">
                              ○ {stats.pending}
                            </Badge>
                          </div>
                        </div>
                        <textarea
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none"
                          rows={3}
                          placeholder="Add remarks for this day..."
                          value={day?.remarks || ''}
                          onChange={(e) => handleRemarksChange(date, e.target.value)}
                        />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {dates.length} {selectedFrequency === 'daily' ? 'day' : selectedFrequency === 'weekly' ? 'days' : 'days'} selected
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCloseAction}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Progress
            </Button>
            <Button onClick={handleComplete} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
              <CheckSquare className="w-4 h-4" />
              Complete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
