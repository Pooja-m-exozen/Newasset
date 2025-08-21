'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckSquare, 
  Building, 
  MapPin,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ChecklistFormModal from '@/components/ui/checklist-form-modal'
import ChecklistViewModal from '@/components/ui/checklist-view-modal'
import { useAuth } from '@/contexts/AuthContext'
import { useToast, ToastContainer } from '@/components/ui/toast'

// Import the interface type from the modal component
type ChecklistFormData = Parameters<React.ComponentProps<typeof ChecklistFormModal>['onSubmit']>[0]

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

interface AnalyticsSummary {
  summary: {
    totalChecklists: number
    activeChecklists: number
    totalResponses: number
    completedResponses: number
    failedResponses: number
    completionRate: number
  }
  checklistsByType: Array<{
    _id: string
    count: number
  }>
  recentActivity: string[]
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

const CHECKLIST_TYPES = [
  'Daily Checklist',
  'Weekly Checklist',
  'Monthly Checklist',
  'Quarterly Checklist',
  'Annual Checklist',
  'Maintenance Checklist',
  'Safety Checklist',
  'Quality Checklist',
  'Compliance Checklist',
  'Training Checklist',
  'Inspection Checklist',
  'Audit Checklist',
  'Custom Checklist'
]

export default function ChecklistPage() {
  const { user, isAuthenticated } = useAuth()
  const { toasts, addToast, removeToast } = useToast()
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null)
  const [viewingChecklist, setViewingChecklist] = useState<Checklist | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)

  // Form state moved to modal component

  // Fetch checklists from API
  useEffect(() => {
    const fetchChecklists = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem('authToken')
        if (!token) {
          console.log('No auth token found')
          return
        }

        const response = await fetch('http://192.168.0.5:5021/api/checklists', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            // Transform API data to match our interface
            const transformedChecklists = result.data.map((checklist: Checklist) => ({
              ...checklist,
              progress: calculateProgress(checklist.items || [])
            }))
            setChecklists(transformedChecklists)
          }
        } else {
          console.error('Failed to fetch checklists:', response.status)
        }
      } catch (error) {
        console.error('Error fetching checklists:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChecklists()
  }, [])

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoadingAnalytics(true)
        const token = localStorage.getItem('authToken')
        if (!token) {
          console.log('No auth token found')
          return
        }

        const response = await fetch('http://192.168.0.5:5021/api/checklists/analytics/summary', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setAnalytics(result.data as AnalyticsSummary)
          }
        } else {
          console.error('Failed to fetch analytics:', response.status)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setIsLoadingAnalytics(false)
      }
    }

    fetchAnalytics()
  }, [])

  const refreshChecklists = () => {
    const fetchChecklists = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem('authToken')
        if (!token) {
          console.log('No auth token found')
          return
        }

        const response = await fetch('http://192.168.0.5:5021/api/checklists', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            // Transform API data to match our interface
            const transformedChecklists = result.data.map((checklist: Checklist) => ({
              ...checklist,
              progress: calculateProgress(checklist.items || [])
            }))
            setChecklists(transformedChecklists)
          }
        } else {
          console.error('Failed to fetch checklists:', response.status)
        }
      } catch (error) {
        console.error('Error fetching checklists:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChecklists()
  }

  const refreshAnalytics = async () => {
    try {
      setIsLoadingAnalytics(true)
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.log('No auth token found')
        return
      }

      const response = await fetch('http://192.168.0.5:5021/api/checklists/analytics/summary', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

              if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setAnalytics(result.data as AnalyticsSummary)
          }
        } else {
          console.error('Failed to fetch analytics:', response.status)
        }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

  const refreshAll = () => {
    refreshChecklists()
    refreshAnalytics()
  }

  // Filter checklists based on search and filters
  const filteredChecklists = checklists.filter(checklist => {
    const matchesSearch = checklist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         checklist.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPriority = !filterPriority || checklist.priority === filterPriority
    const matchesStatus = !filterStatus || checklist.status === filterStatus
    const matchesType = !filterType || checklist.type === filterType

    return matchesSearch && matchesPriority && matchesStatus && matchesType
  })

  const handleCreateChecklist = (data: ChecklistFormData) => {
    // Add success notification
    addToast({
      type: 'success',
      title: 'Checklist Created',
      message: 'The checklist has been successfully created.'
    })
    
    // Refresh the list to get the latest data from the server
    refreshChecklists()
  }

  const handleEditChecklist = async (data: ChecklistFormData) => {
    if (!editingChecklist) return

    try {
      // The modal now handles the API call directly, so we just need to refresh the list
      addToast({
        type: 'success',
        title: 'Checklist Updated',
        message: 'The checklist has been successfully updated.'
      })
      
      // Refresh the list to get the latest data from the server
      refreshChecklists()
      setEditingChecklist(null)
      setIsEditModalOpen(false)
    } catch (error) {
      console.error('Error updating checklist:', error)
      addToast({
        type: 'error',
        title: 'Update Error',
        message: 'An error occurred while updating the checklist. Please try again.'
      })
    }
  }

  const handleDeleteChecklist = async (id: string) => {
    try {
      setIsDeleting(id)
      const token = localStorage.getItem('authToken')
      if (!token) {
        addToast({
          type: 'error',
          title: 'Authentication Error',
          message: 'Authentication token not found. Please login again.'
        })
        return
      }

      const response = await fetch(`http://192.168.0.5:5021/api/checklists/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          addToast({
            type: 'success',
            title: 'Checklist Deleted',
            message: 'The checklist has been successfully deleted.'
          })
          
          // Refresh the list to get the latest data from the server
          refreshChecklists()
        } else {
          addToast({
            type: 'error',
            title: 'Delete Failed',
            message: result.message || 'Failed to delete checklist. Please try again.'
          })
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        addToast({
          type: 'error',
          title: 'Delete Failed',
          message: errorData.message || `Failed to delete checklist. Status: ${response.status}`
        })
      }
    } catch (error) {
      console.error('Error deleting checklist:', error)
      addToast({
        type: 'error',
        title: 'Delete Error',
        message: 'An error occurred while deleting the checklist. Please try again.'
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleView = (checklist: Checklist) => {
    setViewingChecklist(checklist)
    setIsViewModalOpen(true)
  }

  const handleChecklistUpdated = (updatedChecklist: Checklist) => {
    // Update the checklist in the local state
    setChecklists(prev => prev.map(c => 
      c._id === updatedChecklist._id ? updatedChecklist : c
    ))
    
    // Update the viewing checklist if it's the same one
    if (viewingChecklist?._id === updatedChecklist._id) {
      setViewingChecklist(updatedChecklist)
    }
  }

  const handleEdit = (checklist: Checklist) => {
    setEditingChecklist(checklist)
    setIsEditModalOpen(true)
  }

  const resetForm = () => {
    // Form reset functionality moved to modal component
  }

  const calculateProgress = (items: ChecklistItem[]): number => {
    if (items.length === 0) return 0
    const completed = items.filter(item => item.status === 'completed').length
    return Math.round((completed / items.length) * 100)
  }

  const downloadToExcel = () => {
    // Create CSV content
    let csvContent = 'Title,Description,Type,Frequency,Priority,Status,Location,Progress,Items Count\n'
    
    filteredChecklists.forEach(checklist => {
      csvContent += `"${checklist.title}","${checklist.description}","${checklist.type}","${checklist.frequency}","${checklist.priority}","${checklist.status}","${checklist.location.building} - ${checklist.location.floor} - ${checklist.location.zone}","${checklist.progress}%","${checklist.items.length}"\n`
    })

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `checklists_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterPriority('')
    setFilterStatus('')
    setFilterType('')
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to access the checklist management system.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Checklist Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create, manage, and track task checklists for your organization
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="font-medium">Logged in as:</span> {user?.name || user?.email || 'Unknown'}
          </div>
          <Button
            variant="outline"
            onClick={refreshAll}
            disabled={isLoading || isLoadingAnalytics}
            className="flex items-center gap-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading || isLoadingAnalytics ? 'animate-spin' : ''}`} />
            {isLoading || isLoadingAnalytics ? 'Loading...' : 'Refresh'}
          </Button>
          <Button
            variant="outline"
            onClick={downloadToExcel}
            className="flex items-center gap-2 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Create Checklist
          </Button>
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Checklists */}
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Checklists</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.summary.totalChecklists}</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <CheckSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Checklists */}
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Checklists</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.summary.activeChecklists}</p>
                </div>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <CheckSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.summary.completionRate}%</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <CheckSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Responses */}
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Responses</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.summary.totalResponses}</p>
                </div>
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                  <CheckSquare className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Loading State */}
      {isLoadingAnalytics && (
        <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardContent className="p-8 text-center">
            <div className="relative">
              <RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-spin" />
            </div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
              Loading Analytics...
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Fetching checklist analytics data
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search checklists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="border-gray-200 dark:border-gray-700">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {CHECKLIST_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="border-gray-200 dark:border-gray-700">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="border-gray-200 dark:border-gray-700">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <RefreshCw className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardContent className="p-12 text-center">
            <div className="relative">
              <RefreshCw className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Loading Checklists...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we fetch your checklists from the server.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Checklists Table */}
      {!isLoading && (
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredChecklists.map((checklist) => (
                    <tr key={checklist._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {checklist.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 max-w-xs mt-1">
                            {checklist.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs">
                          {checklist.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={cn('text-xs font-medium', PRIORITY_COLORS[checklist.priority])}>
                          {checklist.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={cn('text-xs font-medium', STATUS_COLORS[checklist.status])}>
                          {checklist.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2 mb-1">
                            <Building className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">{checklist.location.building}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <MapPin className="w-4 h-4 text-green-500" />
                            <span>{checklist.location.zone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(checklist)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(checklist)}
                            className="h-8 w-8 p-0 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                            title="Edit Checklist"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteChecklist(checklist._id)}
                            disabled={isDeleting === checklist._id}
                            className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                            title="Delete Checklist"
                          >
                            {isDeleting === checklist._id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && filteredChecklists.length === 0 && (
        <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardContent className="p-12 text-center">
            <div className="relative">
              <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No checklists found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || filterPriority || filterStatus || filterType
                ? 'Try adjusting your filters'
                : 'Create your first checklist to get started'
              }
            </p>
            {!searchTerm && !filterPriority && !filterStatus && !filterType && (
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Checklist
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <ChecklistFormModal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setIsEditModalOpen(false)
          setEditingChecklist(null)
          resetForm()
        }}
        onSubmit={isCreateModalOpen ? handleCreateChecklist : handleEditChecklist}
        editingChecklist={editingChecklist}
        mode={isCreateModalOpen ? 'create' : 'edit'}
      />

      {/* View Modal */}
      <ChecklistViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setViewingChecklist(null)
        }}
        checklist={viewingChecklist}
        onChecklistUpdated={handleChecklistUpdated}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
