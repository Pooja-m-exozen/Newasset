'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload,
  FileSpreadsheet,
  RefreshCw,
  CheckSquare
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'


interface ChecklistItem {
  _id?: string
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
  location: {
    building: string
    floor: string
    zone: string
  }
  items: ChecklistItem[]
  tags: string[]
  createdAt: string
  updatedAt: string
  progress?: number
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
}

interface ChecklistFormData {
  title: string
  description: string
  type: string
  frequency: string
  priority: string
  status: string
  location: {
    building: string
    floor: string
    zone: string
  }
  items: Omit<ChecklistItem, '_id'>[]
  tags: string[]
}







interface ChecklistFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ChecklistFormData) => void
  editingChecklist?: Checklist | null
  mode: 'create' | 'edit'
}

export default function ChecklistFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingChecklist,
  mode
}: ChecklistFormModalProps) {
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual')
  const [formData, setFormData] = useState<ChecklistFormData>({
    title: '',
    description: '',
    type: '',
    frequency: '',
    priority: '',
    status: 'active', // Default status
    location: {
      building: '',
      floor: '',
      zone: ''
    },
    items: [],
    tags: []
  })

  // Excel import state
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<Record<string, string>[]>([])
  const [isImporting, setIsImporting] = useState(false)
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (editingChecklist && mode === 'edit') {
      setFormData({
        title: editingChecklist.title,
        description: editingChecklist.description,
        type: editingChecklist.type,
        frequency: editingChecklist.frequency,
        priority: editingChecklist.priority,
        status: editingChecklist.status, // Set status for editing
        location: editingChecklist.location,
        items: editingChecklist.items.map(item => ({
          serialNumber: item.serialNumber,
          inspectionItem: item.inspectionItem,
          details: item.details
        })),
        tags: editingChecklist.tags
      })
    } else if (mode === 'create') {
      resetForm()
    }
  }, [editingChecklist, mode])

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: '',
      frequency: '',
      priority: '',
      status: 'active', // Reset status
      location: {
        building: '',
        floor: '',
        zone: ''
      },
      items: [],
      tags: []
    })
    setExcelFile(null)
    setImportPreview([])
    setActiveTab('manual')
  }

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsSubmitting(true)
      
      try {
        // Get bearer token from localStorage
        const token = localStorage.getItem('authToken')
        if (!token) {
          alert('Authentication token not found. Please login again.')
          setIsSubmitting(false)
          return
        }

        // Prepare the data for API
        const apiData = {
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        console.log('Sending data to API:', JSON.stringify(apiData, null, 2))

        let response
        let responseData

        if (mode === 'edit' && editingChecklist) {
          // EDIT MODE: Use PUT method to update existing checklist
          console.log('Updating existing checklist:', editingChecklist._id)
          
          // For edit, only send the specific fields that should be updated
          const updateData = {
            title: formData.title,
            description: formData.description,
            status: formData.status,
            priority: formData.priority
          }

          response = await fetch(`http://192.168.0.5:5021/api/checklists/${editingChecklist._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
            body: JSON.stringify(updateData)
          })
        } else {
          // CREATE MODE: Use POST method to create new checklist
          console.log('Creating new checklist')
          
          response = await fetch('http://192.168.0.5:5021/api/checklists', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
            body: JSON.stringify(apiData)
          })
        }

        console.log('Response status:', response.status)

        // Try to get response data
        try {
          responseData = await response.json()
          console.log('Response data:', responseData)
        } catch {
          console.log('Could not parse response as JSON')
          responseData = null
        }

        // Check if response indicates success
        if (responseData && (responseData.success || responseData.checklist || responseData._id || responseData.id)) {
          const action = mode === 'edit' ? 'updated' : 'created'
          console.log(`Checklist ${action} successfully!`)
          
          // Show success message
          alert(`Checklist ${action} successfully!`)
          
          // Call the onSubmit callback with the result
          onSubmit(formData)
          
          // Close the modal after successful operation
          onClose()
        } else if (response.ok) {
          // Standard success response
          const action = mode === 'edit' ? 'updated' : 'created'
          console.log(`Checklist ${action} successfully!`)
          
          // Show success message
          alert(`Checklist ${action} successfully!`)
          
          // Call the onSubmit callback with the result
          onSubmit(formData)
          
          // Close the modal after successful operation
          onClose()
        } else {
          // Handle error
          const errorMessage = responseData?.message || responseData?.error || `HTTP ${response.status}: ${response.statusText}`
          console.error('API Error:', errorMessage)
          alert(`Failed to ${mode === 'edit' ? 'update' : 'create'} checklist: ${errorMessage}`)
        }
        
      } catch (error) {
        console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} checklist:`, error)
        alert('Network error: Unable to connect to the server. Please check your internet connection.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      alert('Please enter a checklist title')
      return false
    }
    
    // For edit mode, only validate the fields that are being updated
    if (mode === 'edit') {
      if (!formData.status) {
        alert('Please select a status')
        return false
      }
      if (!formData.priority) {
        alert('Please enter a priority')
        return false
      }
      return true
    }
    
    // For create mode, validate all required fields
    if (!formData.type) {
      alert('Please enter a checklist type')
      return false
    }
    if (!formData.frequency) {
      alert('Please enter a frequency')
      return false
    }
    if (!formData.priority) {
      alert('Please enter a priority')
      return false
    }
    if (!formData.status) {
      alert('Please select a status')
      return false
    }

    if (!formData.location.building || !formData.location.floor || !formData.location.zone) {
      alert('Please fill in all location fields')
      return false
    }
    return true
  }



  const addChecklistItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        serialNumber: prev.items.length + 1,
        inspectionItem: '',
        details: ''
      }]
    }))
  }

  const removeChecklistItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateChecklistItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setExcelFile(file)
      parseCSVFile(file)
    } else {
      alert('Please upload a valid CSV file')
    }
  }

  const parseCSVFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim())
        const row: Record<string, string> = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        return row
      })
      setImportPreview(data)
    }
    reader.readAsText(file)
  }

  const importFromExcel = async () => {
    if (!excelFile || importPreview.length === 0) return

    setIsImporting(true)
    
    try {
      // Get bearer token from localStorage
      const token = localStorage.getItem('authToken')
      if (!token) {
        alert('Authentication token not found. Please login again.')
        setIsImporting(false)
        return
      }

      // Create checklists from imported data
      const newChecklists: ChecklistFormData[] = importPreview.map((row) => ({
        title: row.Title || 'Imported Checklist',
        description: row.Description || 'Imported from Excel',
        type: row.Type || 'Daily Checklist',
        frequency: row.Frequency || 'daily',
        priority: row.Priority || 'medium',
        status: 'active', // Default status for imported checklists
        location: {
          building: row.Building || 'Building A',
          floor: row.Floor || '1st Floor',
          zone: row.Zone || 'Production Area'
        },
        items: [],
        tags: row.Tags ? row.Tags.split(',').map((tag: string) => tag.trim()) : []
      }))

      // Create all checklists from imported data
      let successCount = 0
      let errorCount = 0

      for (const checklistData of newChecklists) {
        try {
          const apiData = {
            ...checklistData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          const response = await fetch('http://192.168.0.5:5021/api/checklists', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
            body: JSON.stringify(apiData)
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
            console.error(`Failed to create checklist: ${checklistData.title}`)
          }
        } catch (error) {
          errorCount++
          console.error(`Error creating checklist: ${checklistData.title}`, error)
        }
      }

      // Show results
      if (successCount > 0) {
        alert(`Successfully created ${successCount} checklist(s) from Excel import!${errorCount > 0 ? ` Failed to create ${errorCount} checklist(s).` : ''}`)
        
        // Call the onSubmit callback to refresh the parent component
        onSubmit(newChecklists[0])
        
        // Close the modal after successful import
        onClose()
      } else {
        alert(`Failed to create any checklists. Please check your data and try again.`)
      }

    } catch (error) {
      console.error('Error during Excel import:', error)
      alert('Network error: Unable to connect to the server. Please check your internet connection.')
    } finally {
      setIsImporting(false)
      setExcelFile(null)
      setImportPreview([])
    }
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              Authentication Required
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">
              You need to be logged in to create or edit checklists.
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <Plus className="w-5 h-5" />
                Create New Checklist
              </>
            ) : (
              <>
                <Edit className="w-5 h-5" />
                Edit Checklist
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'manual' | 'import')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Manual Creation
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import from Excel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-6 mt-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>Enter the main details for your checklist</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-2">
                      Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter checklist title"
                      className="w-full"
                    />
                  </div>
                  
                  {mode === 'create' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="type" className="flex items-center gap-2">
                          Checklist Type <span className="text-red-500">*</span>
                        </Label>
                        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select checklist type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Daily">Daily</SelectItem>
                            <SelectItem value="Weekly">Weekly</SelectItem>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="frequency" className="flex items-center gap-2">
                          Frequency <span className="text-red-500">*</span>
                        </Label>
                        <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
                            <SelectItem value="on-demand">On Demand</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="priority" className="flex items-center gap-2">
                      Priority <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="flex items-center gap-2">
                        Status <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>


                  

                   {mode === 'create' && (
                     <>
                       <div className="space-y-2">
                         <Label htmlFor="building" className="flex items-center gap-2">
                           Building <span className="text-red-500">*</span>
                         </Label>
                         <Input
                           id="building"
                           value={formData.location.building}
                           onChange={(e) => setFormData(prev => ({ 
                             ...prev, 
                             location: { ...prev.location, building: e.target.value }
                           }))}
                           placeholder="Enter building name"
                           className="w-full"
                         />
                       </div>

                       <div className="space-y-2">
                         <Label htmlFor="floor" className="flex items-center gap-2">
                           Floor <span className="text-red-500">*</span>
                         </Label>
                         <Input
                           id="floor"
                           value={formData.location.floor}
                           onChange={(e) => setFormData(prev => ({ 
                             ...prev, 
                             location: { ...prev.location, floor: e.target.value }
                           }))}
                           placeholder="Enter floor (e.g., 1st Floor)"
                           className="w-full"
                         />
                       </div>

                       <div className="space-y-2">
                         <Label htmlFor="zone" className="flex items-center gap-2">
                           Zone <span className="text-red-500">*</span>
                         </Label>
                         <Input
                           id="zone"
                           value={formData.location.zone}
                           onChange={(e) => setFormData(prev => ({ 
                             ...prev, 
                             location: { ...prev.location, zone: e.target.value }
                           }))}
                           placeholder="Enter zone (e.g., Production Area)"
                           className="w-full"
                         />
                       </div>
                     </>
                   )}
                </div>

                                 <div className="space-y-2">
                   <Label htmlFor="description">Description</Label>
                   <Textarea
                     id="description"
                     value={formData.description}
                     onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                     placeholder="Enter checklist description"
                     rows={3}
                     className="w-full"
                   />
                 </div>

                 {mode === 'create' && (
                   <div className="space-y-2">
                     <Label htmlFor="tags">Tags</Label>
                     <Input
                       id="tags"
                       value={formData.tags.join(', ')}
                       onChange={(e) => setFormData(prev => ({ 
                         ...prev, 
                         tags: e.target.value.split(',').map((tag: string) => tag.trim()).filter(Boolean)
                       }))}
                       placeholder="Enter tags (comma separated)"
                       className="w-full"
                     />
                   </div>
                 )}
              </CardContent>
            </Card>

            {/* Checklist Items - Only show in create mode */}
            {mode === 'create' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Checklist Items</CardTitle>
                      <CardDescription>Add individual tasks and items to your checklist</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addChecklistItem}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No checklist items added yet</p>
                      <p className="text-sm">Click &quot;Add Item&quot; to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.items.map((item, index) => (
                        <Card key={index} className="p-4 border-2 border-dashed border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Serial Number</Label>
                              <Input
                                value={item.serialNumber}
                                onChange={(e) => updateChecklistItem(index, 'serialNumber', parseInt(e.target.value) || 1)}
                                placeholder="Enter serial number"
                                type="number"
                                className="w-full"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Inspection Item <span className="text-red-500">*</span></Label>
                              <Input
                                value={item.inspectionItem}
                                onChange={(e) => updateChecklistItem(index, 'inspectionItem', e.target.value)}
                                placeholder="Enter inspection item"
                                className="w-full"
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label>Details</Label>
                              <Textarea
                                value={item.details}
                                onChange={(e) => updateChecklistItem(index, 'details', e.target.value)}
                                placeholder="Enter inspection details"
                                rows={2}
                                className="w-full"
                              />
                            </div>

                            <div className="flex items-center space-x-2 md:col-span-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeChecklistItem(index)}
                                className="ml-auto text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

                         {/* Actions */}
             <div className="flex items-center justify-end pt-6 border-t">
               <div className="flex items-center gap-3">
                 <Button
                   variant="outline"
                   onClick={onClose}
                 >
                   Cancel
                 </Button>
                                   <Button
                    onClick={handleSubmit}
                    disabled={
                      !formData.title || 
                      (mode === 'create' && (!formData.type || !formData.frequency || !formData.location.building || !formData.location.floor || !formData.location.zone)) ||
                      !formData.priority || 
                      !formData.status || 
                      isSubmitting
                    }
                    className="flex items-center gap-2"
                  >
                   {isSubmitting ? (
                     <>
                       <RefreshCw className="w-4 h-4 animate-spin" />
                       {mode === 'create' ? 'Creating...' : 'Updating...'}
                     </>
                   ) : mode === 'create' ? (
                     <>
                       <Plus className="w-4 h-4" />
                       Create Checklist
                     </>
                   ) : (
                     <>
                       <Edit className="w-4 h-4" />
                       Update Checklist
                     </>
                   )}
                 </Button>
               </div>
             </div>
          

           </TabsContent>

          <TabsContent value="import" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import from Excel/CSV</CardTitle>
                                 <CardDescription>
                   Upload a CSV file to automatically create checklists. The file should have columns for Title, Description, Type, Frequency, Priority, Building, Floor, Zone, and Tags. All imported checklists will be created immediately.
                 </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h3>
                  <p className="text-gray-600 mb-4">
                    Supported format: CSV with headers for Title, Description, Type, Frequency, Priority, Building, Floor, Zone, and Tags
                  </p>
                  
                  <div className="flex items-center justify-center gap-4">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="max-w-xs"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                        fileInput?.click()
                      }}
                    >
                      Choose File
                    </Button>
                  </div>
                </div>

                {excelFile && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                      <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-800 font-medium">File: {excelFile.name}</span>
                    </div>

                    {importPreview.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-medium">Preview ({importPreview.length} checklists)</h4>
                        <div className="max-h-64 overflow-y-auto space-y-2">
                                                     {importPreview.slice(0, 5).map((row, index) => (
                             <Card key={index} className="p-3">
                               <div className="grid grid-cols-2 gap-2 text-sm">
                                 <div><strong>Title:</strong> {row.Title || 'N/A'}</div>
                                 <div><strong>Type:</strong> {row.Type || 'N/A'}</div>
                                 <div><strong>Frequency:</strong> {row.Frequency || 'N/A'}</div>
                                 <div><strong>Priority:</strong> {row.Priority || 'N/A'}</div>
                                 <div><strong>Building:</strong> {row.Building || 'N/A'}</div>
                                 <div><strong>Zone:</strong> {row.Zone || 'N/A'}</div>
                               </div>
                             </Card>
                           ))}
                          {importPreview.length > 5 && (
                            <div className="text-center text-gray-500 text-sm">
                              ... and {importPreview.length - 5} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setExcelFile(null)
                          setImportPreview([])
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={importFromExcel}
                        disabled={importPreview.length === 0 || isImporting}
                        className="flex items-center gap-2"
                      >
                        {isImporting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Creating {importPreview.length} Checklists...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Create {importPreview.length} Checklists
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
