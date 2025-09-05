'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Checkbox } from './checkbox'
import { Textarea } from './textarea'
import { Input } from './input'
import { Label } from './label'
import { 
  CheckSquare, 
  Building, 
  Calendar, 
  Save, 
  Clock,
  CheckCircle2,
  
} from 'lucide-react'

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

interface ChecklistExecution {
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

interface ChecklistExecutionProps {
  checklist: ChecklistExecution
  onSave: (updatedChecklist: ChecklistExecution) => void
  onComplete: (completedChecklist: ChecklistExecution) => void
  onClose: () => void
}

export function ChecklistExecution({ 
  checklist, 
  onSave, 
  onComplete, 
  onClose 
}: ChecklistExecutionProps) {
  const [items, setItems] = useState<ChecklistItem[]>(checklist.items)
  const [isSaving, setIsSaving] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [signature, setSignature] = useState('')
  const [inspectorName, setInspectorName] = useState('')
  const [currentTime] = useState(new Date().toLocaleString())

  const handleItemStatusChange = (itemId: string, status: 'pending' | 'completed' | 'not_applicable') => {
    setItems(prev => prev.map(item => 
      item._id === itemId 
        ? { 
            ...item, 
            status, 
            completedAt: status === 'completed' ? new Date().toISOString() : undefined,
            completedBy: status === 'completed' ? inspectorName : undefined
          }
        : item
    ))
  }

  const handleRemarksChange = (itemId: string, remarks: string) => {
    setItems(prev => prev.map(item => 
      item._id === itemId ? { ...item, remarks } : item
    ))
  }

  const getCompletionStats = () => {
    const total = items.length
    const completed = items.filter(item => item.status === 'completed').length
    const notApplicable = items.filter(item => item.status === 'not_applicable').length
    const pending = total - completed - notApplicable
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, notApplicable, pending, percentage }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updatedChecklist = {
        ...checklist,
        items
      }
      await onSave(updatedChecklist)
    } finally {
      setIsSaving(false)
    }
  }

  const handleComplete = async () => {
    if (!inspectorName.trim()) {
      alert('Please enter inspector name before completing')
      return
    }

    setIsCompleting(true)
    try {
      const completedChecklist = {
        ...checklist,
        items,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
        completedBy: inspectorName
      }
      await onComplete(completedChecklist)
    } finally {
      setIsCompleting(false)
    }
  }

  const stats = getCompletionStats()

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-white dark:bg-gray-900 border-b z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">{checklist.title}</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">{checklist.description}</p>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {stats.completed}/{stats.total} completed ({stats.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Checklist Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Building className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                <p className="text-sm font-medium">{checklist.location.building} - {checklist.location.zone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Calendar className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Frequency</p>
                <p className="text-sm font-medium">{checklist.frequency}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Clock className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Started</p>
                <p className="text-sm font-medium">{currentTime}</p>
              </div>
            </div>
          </div>

          {/* Excel-like Checklist Table */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-12 gap-4 p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">
                <div className="col-span-1">#</div>
                <div className="col-span-6">Description</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Remarks</div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item) => (
                <div key={item._id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {/* Serial Number */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.serialNumber}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="col-span-6">
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {item.inspectionItem}
                    </div>
                    {item.details && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.details}
                      </div>
                    )}
                  </div>

                  {/* Status Checkboxes */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`completed-${item._id}`}
                          checked={item.status === 'completed'}
                          onCheckedChange={(checked) => 
                            handleItemStatusChange(item._id, checked ? 'completed' : 'pending')
                          }
                        />
                        <Label htmlFor={`completed-${item._id}`} className="text-xs">
                          ✓
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`na-${item._id}`}
                          checked={item.status === 'not_applicable'}
                          onCheckedChange={(checked) => 
                            handleItemStatusChange(item._id, checked ? 'not_applicable' : 'pending')
                          }
                        />
                        <Label htmlFor={`na-${item._id}`} className="text-xs">
                          N/A
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="col-span-3">
                    <Textarea
                      placeholder="Add remarks..."
                      value={item.remarks || ''}
                      onChange={(e) => handleRemarksChange(item._id, e.target.value)}
                      className="min-h-[60px] text-xs"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inspector Info */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inspector-name" className="text-sm font-medium">
                  Inspector Name *
                </Label>
                <Input
                  id="inspector-name"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="signature" className="text-sm font-medium">
                  Digital Signature
                </Label>
                <Input
                  id="signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Your signature"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Progress'}
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stats.completed} of {stats.total} completed
              </div>
              <Button
                onClick={handleComplete}
                disabled={isCompleting || !inspectorName.trim()}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isCompleting ? 'Completing...' : 'Complete Checklist'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
