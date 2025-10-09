'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckSquare, 
  Building, 
  MapPin,
  RefreshCw,
  Eye,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ChecklistFormModal from '@/components/ui/checklist-form-modal'
import ChecklistViewModal from '@/components/ui/checklist-view-modal'
import { useAuth } from '@/contexts/AuthContext'
import { useToast, ToastContainer } from '@/components/ui/toast'

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


export default function ChecklistPage() {
  const { isAuthenticated } = useAuth()
  const { toasts, addToast, removeToast } = useToast()
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null)
  const [viewingChecklist, setViewingChecklist] = useState<Checklist | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string>("title")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [filterPriority] = useState<string>("")
  const [filterStatus] = useState<string>("")
  const [filterType] = useState<string>("")



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





  const refreshChecklists = () => {
    const fetchChecklists = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem('authToken')
        if (!token) {
          console.log('No auth token found')
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





  // Filter checklists based on filters and search
  const filteredChecklists = checklists.filter(checklist => {
    const matchesPriority = !filterPriority || checklist.priority === filterPriority
    const matchesStatus = !filterStatus || checklist.status === filterStatus
    const matchesType = !filterType || checklist.type === filterType
    const matchesSearch = !searchTerm || 
      checklist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.type.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesPriority && matchesStatus && matchesType && matchesSearch
  })

  // Sort checklists
  const sortedChecklists = [...filteredChecklists].sort((a, b) => {
    const aValue = a[sortField as keyof Checklist] || ""
    const bValue = b[sortField as keyof Checklist] || ""
    
    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedChecklists = sortedChecklists.slice(startIndex, endIndex)

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleCreateChecklist = () => {
    // Add success notification
    addToast({
      type: 'success',
      title: 'Checklist Created',
      message: 'The checklist has been successfully created.'
    })
    
    // Refresh the list to get the latest data from the server
    refreshChecklists()
  }

  const handleEditChecklist = async () => {
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

      const response = await fetch(`https://digitalasset.zenapi.co.in/api/checklists/${id}`, {
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






  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Authentication Required
          </h1>
          <p className="text-muted-foreground">
            Please log in to access the checklist management system.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background transition-colors duration-200">
      <div className="flex-1 overflow-auto">
        {/* Main Content */}
        <main className="px-4 pb-1 sm:px-6 sm:pb-2 space-y-4 sm:space-y-6">
          {/* Simple Search and Actions */}
          <div className="flex items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search checklists..."
                className="pl-10 h-10 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              </div>
              
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                <span>Add Checklist</span>
                </Button>
            </div>
          </div>


              {/* Checklists Table */}
              <Card className="border-border">
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-muted-foreground">Loading checklists...</span>
                  </div>
                  </div>
                  ) : (
                    <div className="overflow-x-auto bg-background">
                      <table className="w-full border-collapse font-sans text-base">
                      <thead>
                          <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                            <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm">
                              #
                          </th>
                            <th 
                              className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                              onClick={() => handleSort("title")}
                            >
                              TITLE
                          </th>
                            <th 
                              className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                              onClick={() => handleSort("type")}
                            >
                              TYPE
                          </th>
                            <th 
                              className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                              onClick={() => handleSort("priority")}
                            >
                              PRIORITY
                          </th>
                            <th 
                              className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                              onClick={() => handleSort("status")}
                            >
                              STATUS
                          </th>
                            <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm">
                              LOCATION
                          </th>
                            <th className="border border-border px-4 py-3 text-center font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm">ACTIONS</th>
                        </tr>
                      </thead>
                        <tbody>
                          {paginatedChecklists.map((checklist, index) => (
                            <tr key={checklist._id} className="hover:bg-muted transition-colors">
                              <td className="border border-border px-4 py-3 text-sm font-medium text-blue-800">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full text-sm font-semibold text-blue-800">
                                  {startIndex + index + 1}
                                </div>
                              </td>
                              <td className="border border-border px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-muted rounded">
                                    <CheckSquare className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-primary cursor-pointer hover:underline">
                                      {checklist.title}
                                    </span>
                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-xs">
                                      {checklist.description}
                                    </div>
                                  </div>
                                </div>
                            </td>
                              <td className="border border-border px-4 py-3">
                                <span className="text-sm font-medium text-primary cursor-pointer hover:underline">
                                {checklist.type}
                                </span>
                            </td>
                              <td className="border border-border px-4 py-3">
                                <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-sm font-medium', PRIORITY_COLORS[checklist.priority])}>
                                {checklist.priority}
                                </span>
                            </td>
                              <td className="border border-border px-4 py-3">
                                <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-sm font-medium', STATUS_COLORS[checklist.status])}>
                                {checklist.status}
                                </span>
                            </td>
                              <td className="border border-border px-4 py-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2 mb-1">
                                  <Building className="w-4 h-4 text-primary" />
                                  <span>{checklist.location.building}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="w-4 h-4 text-green-500" />
                                  <span>{checklist.location.zone}</span>
                              </div>
                            </td>
                              <td className="border border-border px-4 py-3">
                                <div className="flex items-center gap-2 justify-center">
                                  <button 
                                    className="w-9 h-9 flex items-center justify-center text-green-600 border border-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors shadow-sm"
                                  onClick={() => handleView(checklist)}
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                  </button>
                                  <button 
                                    className="w-9 h-9 flex items-center justify-center text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors shadow-sm"
                                  onClick={() => handleEdit(checklist)}
                                  title="Edit Checklist"
                                >
                                  <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    className="w-9 h-9 flex items-center justify-center text-destructive border border-destructive rounded-lg hover:bg-destructive/10 transition-colors shadow-sm"
                                  onClick={() => handleDeleteChecklist(checklist._id)}
                                  disabled={isDeleting === checklist._id}
                                  title="Delete Checklist"
                                >
                                  {isDeleting === checklist._id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                  </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              )}
                </CardContent>
              </Card>

              {/* Empty State */}
              {!isLoading && paginatedChecklists.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <CheckSquare className="w-12 h-12 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-semibold text-foreground">No checklists found</p>
                      <p className="text-sm text-muted-foreground">
                        {filterPriority || filterStatus || filterType || searchTerm
                          ? 'Try adjusting your filters or search terms'
                      : 'Create your first checklist to get started'
                    }
                  </p>
                    </div>
                    {!filterPriority && !filterStatus && !filterType && !searchTerm && (
                    <Button 
                      onClick={() => setIsCreateModalOpen(true)}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Checklist
                    </Button>
                  )}
                  </div>
                </div>
              )}
            </main>
      </div>

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
