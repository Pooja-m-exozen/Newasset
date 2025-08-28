"use client"

import { useState, useEffect, useCallback, useRef } from "react"

import ProtectedRoute from "@/components/ProtectedRoute"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useUserManagement } from "@/contexts/UserManagementContext"
import { useToast, ToastContainer } from "@/components/ui/toast"
import { User } from "@/lib/manageuser"
import { 
  Users, 
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Mail,
  Shield,
  UserCheck,
  UserPlus,
  RefreshCw,
  X,
  EyeOff,
  Eye as EyeIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react"


export default function AdminManageUsersPage() {
  const { users, roles, fetchUsers, fetchRoles, createRole, createUser, updateRole, updateUserRole, deleteUser } = useUserManagement()
  const { addToast, toasts, removeToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const hasMounted = useRef(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showRolesModal, setShowRolesModal] = useState(false)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [showEditRoleModal, setShowEditRoleModal] = useState(false)
  const [showEditUserRoleModal, setShowEditUserRoleModal] = useState(false)
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
  const [showViewUserModal, setShowViewUserModal] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [isCreatingRole, setIsCreatingRole] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)
  const [isUpdatingUserRole, setIsUpdatingUserRole] = useState(false)
  const [isDeletingUser, setIsDeletingUser] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [editingRole, setEditingRole] = useState<{ id: string; name: string } | null>(null)
  const [editingUser, setEditingUser] = useState<{ id: string; name: string; currentRole: string } | null>(null)
  const [deletingUser, setDeletingUser] = useState<{ id: string; name: string } | null>(null)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [sortField, setSortField] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    projectName: ""
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await Promise.all([fetchUsers(), fetchRoles()])
      addToast({
        type: "success",
        title: "Data Loaded",
        message: "Data loaded successfully",
        duration: 3000
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load data"
      setError(errorMessage)
      addToast({
        type: "error",
        title: "Error Loading Data",
        message: errorMessage,
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }, [fetchUsers, fetchRoles, addToast])

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      loadData()
    }
  }, [loadData])

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      addToast({
        type: "error",
        title: "Validation Error",
        message: "Role name is required",
        duration: 3000
      })
      return
    }

    setIsCreatingRole(true)
    try {
      await createRole({ name: newRoleName.trim() })
      addToast({
        type: "success",
        title: "Role Created",
        message: `Role &quot;${newRoleName}&quot; created successfully`,
        duration: 3000
      })
      setNewRoleName("")
      setShowRoleModal(false)
      // Refresh data after successful creation
      Promise.all([fetchUsers(), fetchRoles()])
    } catch (error) {
      addToast({
        type: "error",
        title: "Error Creating Role",
        message: error instanceof Error ? error.message : "Failed to create role",
        duration: 5000
      })
    } finally {
      setIsCreatingRole(false)
    }
  }

  const handleEditRole = async () => {
    console.log('Handling edit role:', editingRole)
    if (!editingRole || !editingRole.name.trim()) {
      addToast({
        type: "error",
        title: "Validation Error",
        message: "Role name is required",
        duration: 3000
      })
      return
    }

    setIsUpdatingRole(true)
    try {
      console.log('Calling updateRole with:', editingRole.id, { role: editingRole.name.trim() })
      await updateRole(editingRole.id, { role: editingRole.name.trim() })
      addToast({
        type: "success",
        title: "Role Updated",
        message: `Role updated to &quot;${editingRole.name}&quot; successfully`,
        duration: 3000
      })
      setEditingRole(null)
      setShowEditRoleModal(false)
      // Refresh data after successful update
      Promise.all([fetchUsers(), fetchRoles()])
    } catch (error) {
      console.error('Error updating role:', error)
      addToast({
        type: "error",
        title: "Error Updating Role",
        message: error instanceof Error ? error.message : "Failed to update role",
        duration: 5000
      })
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const openEditRoleModal = (role: { _id: string; name: string }) => {
    console.log('Opening edit modal for role:', role)
    setEditingRole({ id: role._id, name: role.name })
    setShowEditRoleModal(true)
  }

  const openEditUserRoleModal = (user: { _id: string; name: string; role: string }) => {
    console.log('Opening edit user role modal for user:', user)
    setEditingUser({ id: user._id, name: user.name, currentRole: user.role })
    setShowEditUserRoleModal(true)
  }

  const handleEditUserRole = async () => {
    console.log('Handling edit user role:', editingUser)
    if (!editingUser || !editingUser.currentRole.trim()) {
      addToast({
        type: "error",
        title: "Validation Error",
        message: "Role is required",
        duration: 3000
      })
      return
    }

    setIsUpdatingUserRole(true)
    try {
      console.log('Calling updateUserRole with:', editingUser.id, { role: editingUser.currentRole.trim() })
      await updateUserRole(editingUser.id, { role: editingUser.currentRole.trim() })
      addToast({
        type: "success",
        title: "User Role Updated",
        message: `Role for &quot;${editingUser.name}&quot; updated to &quot;${editingUser.currentRole}&quot; successfully`,
        duration: 3000
      })
      setEditingUser(null)
      setShowEditUserRoleModal(false)
      // Refresh data after successful update
      Promise.all([fetchUsers(), fetchRoles()])
    } catch (error) {
      console.error('Error updating user role:', error)
      addToast({
        type: "error",
        title: "Error Updating User Role",
        message: error instanceof Error ? error.message : "Failed to update user role",
        duration: 5000
      })
    } finally {
      setIsUpdatingUserRole(false)
    }
  }

  const openDeleteUserModal = (user: { _id: string; name: string }) => {
    console.log('Opening delete user modal for user:', user)
    setDeletingUser({ id: user._id, name: user.name })
    setShowDeleteUserModal(true)
  }

  const openViewUserModal = (user: User) => {
    console.log('Opening view user modal for user:', user)
    setViewingUser(user)
    setShowViewUserModal(true)
  }

  const handleDeleteUser = async () => {
    console.log('Handling delete user:', deletingUser)
    if (!deletingUser) {
      addToast({
        type: "error",
        title: "Error",
        message: "No user selected for deletion",
        duration: 3000
      })
      return
    }

    setIsDeletingUser(true)
    try {
      console.log('Calling deleteUser with:', deletingUser.id)
      await deleteUser(deletingUser.id)
      addToast({
        type: "success",
        title: "User Deleted",
        message: `User &quot;${deletingUser.name}&quot; deleted successfully`,
        duration: 3000
      })
      setDeletingUser(null)
      setShowDeleteUserModal(false)
      // Refresh data after successful deletion
      Promise.all([fetchUsers(), fetchRoles()])
    } catch (error) {
      console.error('Error deleting user:', error)
      addToast({
        type: "error",
        title: "Error Deleting User",
        message: error instanceof Error ? error.message : "Failed to delete user",
        duration: 5000
      })
    } finally {
      setIsDeletingUser(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUserData.name.trim() || !newUserData.email.trim() || !newUserData.password.trim() || !newUserData.role || !newUserData.projectName.trim()) {
      addToast({
        type: "error",
        title: "Validation Error",
        message: "All fields are required",
        duration: 3000
      })
      return
    }

    if (newUserData.password.length < 6) {
      addToast({
        type: "error",
        title: "Validation Error",
        message: "Password must be at least 6 characters",
        duration: 3000
      })
      return
    }

    setIsCreatingUser(true)
    try {
      await createUser({
        name: newUserData.name.trim(),
        email: newUserData.email.trim(),
        password: newUserData.password,
        role: newUserData.role,
        projectName: newUserData.projectName.trim()
      })
      addToast({
        type: "success",
        title: "User Created",
        message: `User &quot;${newUserData.name}&quot; created successfully`,
        duration: 3000
      })
      setNewUserData({
        name: "",
        email: "",
        password: "",
        role: "",
        projectName: ""
      })
      setShowCreateUserModal(false)
      // Refresh data after successful creation
      Promise.all([fetchUsers(), fetchRoles()])
    } catch (error) {
      addToast({
        type: "error",
        title: "Error Creating User",
        message: error instanceof Error ? error.message : "Failed to create user",
        duration: 5000
      })
    } finally {
      setIsCreatingUser(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'technician': return 'bg-green-100 text-green-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      case 'user': return 'bg-blue-100 text-blue-800'
      case 'engineer': return 'bg-orange-100 text-orange-800'
      case 'supervisor': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return "1 day ago"
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sortField as keyof User] || ""
    const bValue = b[sortField as keyof User] || ""
    
    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex)

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase()
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="flex-1 overflow-auto">
          {/* ERP Style Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 shadow-sm transition-colors duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-lg shadow-sm">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                    User Management
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
                    Manage users, roles, and permissions with advanced controls
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-800 dark:text-green-300 font-medium">Live</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {isLoading && users.length === 0 && roles.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4 text-center">
                                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-white" />
                </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Loading User Management</h2>
                    <p className="text-sm text-muted-foreground">Please wait while we fetch your data...</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Enhanced Header Section */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <Users className="w-4 h-4 text-blue-800 dark:text-blue-300" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          {sortedUsers.length} Users
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full">
                        <UserCheck className="w-4 h-4 text-green-800 dark:text-green-300" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-300">
                          {users.filter(u => u.status === 'active').length} Active
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Manage your team members, roles, and access permissions
                    </p>
                  </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsLoading(true)
                    Promise.all([fetchUsers(), fetchRoles()]).finally(() => setIsLoading(false))
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-900 dark:hover:text-blue-300 dark:hover:border-blue-600"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setShowCreateUserModal(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add User</span>
                </Button>
              </div>
            </div>

            {/* Enhanced Search and Filter Container */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Search Section */}
                  <div className="flex items-end gap-4">
                    <div className="w-full max-w-md">
                      <Label className="text-sm font-medium text-muted-foreground mb-2">Search Users</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, email, role, or project..."
                          className="pl-10 h-11 text-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowRoleModal(true)}
                        className="flex items-center gap-2 h-11 px-4 bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-800 hover:text-purple-900 dark:bg-purple-900 dark:hover:bg-purple-800 dark:border-purple-600 dark:text-purple-300 dark:hover:text-purple-200"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Role</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowRolesModal(true)}
                        className="flex items-center gap-2 h-11 px-4 bg-indigo-100 hover:bg-indigo-200 border-indigo-300 text-indigo-800 hover:text-indigo-900 dark:bg-indigo-900 dark:hover:bg-indigo-800 dark:border-indigo-600 dark:text-indigo-300 dark:hover:text-indigo-200"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Manage Roles</span>
                        <Badge variant="secondary" className="ml-1 bg-indigo-200 text-indigo-800 dark:bg-indigo-300 dark:text-indigo-900">
                          {roles.length}
                        </Badge>
                      </Button>
                    </div>
                  </div>

                  {/* Search Results Info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        Showing {paginatedUsers.length} of {sortedUsers.length} users
                        {searchTerm && ` matching &quot;${searchTerm}&quot;`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                      <span>Real-time search</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

              {/* Users Table */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-600 rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">User Management</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Manage users, roles, and permissions in a structured table format
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {sortedUsers.length} users
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-0">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                          <span className="text-gray-600 dark:text-gray-400">Loading users...</span>
                        </div>
                      </div>
                    ) : error ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <AlertCircle className="w-12 h-12 text-red-500" />
                          <div>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">Failed to load data</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
                            <Button 
                              onClick={loadData}
                              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Try Again
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-100 dark:bg-gray-800">
                            <TableHead className="w-12">
                              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                                <Users className="w-4 h-4" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              onClick={() => handleSort("name")}
                            >
                              <div className="flex items-center gap-2">
                                <span>Name</span>
                                <ArrowUpDown className="w-4 h-4" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              onClick={() => handleSort("email")}
                            >
                              <div className="flex items-center gap-2">
                                <span>Email</span>
                                <ArrowUpDown className="w-4 h-4" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              onClick={() => handleSort("role")}
                            >
                              <div className="flex items-center gap-2">
                                <span>Role</span>
                                <ArrowUpDown className="w-4 h-4" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              onClick={() => handleSort("projectName")}
                            >
                              <div className="flex items-center gap-2">
                                <span>Project</span>
                                <ArrowUpDown className="w-4 h-4" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              onClick={() => handleSort("status")}
                            >
                              <div className="flex items-center gap-2">
                                <span>Status</span>
                                <ArrowUpDown className="w-4 h-4" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              onClick={() => handleSort("createdAt")}
                            >
                              <div className="flex items-center gap-2">
                                <span>Created</span>
                                <ArrowUpDown className="w-4 h-4" />
                              </div>
                            </TableHead>
                            <TableHead className="w-32 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedUsers.map((user) => (
                            <TableRow key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <TableCell>
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                                {getInitials(user.name)}
                              </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{user.name}</span>
                                  {user.isVerified && (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm">{user.email}</span>
                                  </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${getRoleColor(user.role)} px-2 py-1 text-xs`}>
                                      {user.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">{user.projectName}</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge className={`${getStatusColor(user.status)} px-2 py-1 text-xs`}>
                                    {user.status}
                                    </Badge>
                                  </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatDate(user.createdAt)}</span>
                                  </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 justify-end">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                    className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                                    onClick={() => openViewUserModal(user)}
                                  >
                                    <Eye className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                    className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700"
                                    onClick={() => openEditUserRoleModal(user)}
                                  >
                                    <Edit className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700"
                                    onClick={() => openDeleteUserModal(user)}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                          </div>
                    )}
                </CardContent>
              </Card>

              {/* Enhanced Pagination */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {startIndex + 1} to {Math.min(endIndex, sortedUsers.length)} of {sortedUsers.length} results
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          )
                        })}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            </main>
        </div>

        {/* Create User Modal */}
        {showCreateUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Create New User</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateUserModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userName" className="text-sm font-medium text-foreground">Full Name</Label>
                  <Input
                    id="userName"
                    placeholder="Enter full name"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="userEmail" className="text-sm font-medium text-foreground">Email Address</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="Enter email address"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="userPassword" className="text-sm font-medium text-foreground">Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="userPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password (min 6 characters)"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="userRole" className="text-sm font-medium text-gray-700">Role</Label>
                  <select
                    id="userRole"
                    value={newUserData.role}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role.name}>
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="userProject" className="text-sm font-medium text-gray-700">Project Name</Label>
                  <Input
                    id="userProject"
                    placeholder="Enter project name"
                    value={newUserData.projectName}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, projectName: e.target.value }))}
                    className="mt-1 h-10"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleCreateUser}
                    disabled={isCreatingUser}
                  >
                    {isCreatingUser ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2 text-white" />
                        Create User
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateUserModal(false)}
                    disabled={isCreatingUser}
                    className="h-10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Role Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-purple-600 rounded-lg">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Create New Role</h3>
                    <p className="text-sm text-muted-foreground">Add a new role with permissions</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowRoleModal(false)
                    setNewRoleName("")
                  }}
                  className="h-8 w-8 p-0 hover:bg-accent"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="roleName" className="text-sm font-medium text-muted-foreground">Role Name</Label>
                  <Input
                    id="roleName"
                    placeholder="Enter role name (e.g., manager, technician)"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1 h-11 bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={handleCreateRole}
                    disabled={isCreatingRole}
                  >
                    {isCreatingRole ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2 text-white" />
                        Create Role
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRoleModal(false)
                      setNewRoleName("")
                    }}
                    disabled={isCreatingRole}
                    className="h-11 px-6"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Role Modal */}
        {showEditRoleModal && editingRole && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Edit className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Edit Role</h3>
                    <p className="text-sm text-muted-foreground">Update role information</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEditRoleModal(false)
                    setEditingRole(null)
                  }}
                  className="h-8 w-8 p-0 hover:bg-accent"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="editRoleName" className="text-sm font-medium text-muted-foreground">Role Name</Label>
                      <Input
                        id="editRoleName"
                        placeholder="Enter new role name"
                        value={editingRole?.name || ''}
                        onChange={(e) => setEditingRole(prev => prev ? { id: prev.id, name: e.target.value } : null)}
                    className="h-11"
                      />
                    </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleEditRole}
                    disabled={isUpdatingRole}
                  >
                    {isUpdatingRole ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2 text-white" />
                        Update Role
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditRoleModal(false)
                      setEditingRole(null)
                    }}
                    disabled={isUpdatingRole}
                    className="h-11 px-6"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Role Modal */}
        {showEditUserRoleModal && editingUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Edit className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Edit User Role</h3>
                    <p className="text-sm text-muted-foreground">Update user&apos;s role assignment</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEditUserRoleModal(false)
                    setEditingUser(null)
                  }}
                  className="h-8 w-8 p-0 hover:bg-accent"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="editUserRole" className="text-sm font-medium text-muted-foreground">Role</Label>
                  <select
                    id="editUserRole"
                    value={editingUser?.currentRole || ''}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, currentRole: e.target.value } : null)}
                    className="w-full h-11 px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role.name}>
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleEditUserRole}
                    disabled={isUpdatingUserRole}
                  >
                    {isUpdatingUserRole ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2 text-white" />
                        Update Role
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditUserRoleModal(false)
                      setEditingUser(null)
                    }}
                    disabled={isUpdatingUserRole}
                    className="h-11 px-6"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Confirmation Modal */}
        {showDeleteUserModal && deletingUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-red-600 rounded-lg">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Confirm Deletion</h3>
                    <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDeleteUserModal(false)
                    setDeletingUser(null)
                  }}
                  className="h-8 w-8 p-0 hover:bg-accent"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-6">
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Are you sure you want to delete user &quot;{deletingUser?.name || 'Unknown'}&quot;?
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        This action cannot be undone and will permanently remove the user from the system.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteUserModal(false)
                      setDeletingUser(null)
                    }}
                    disabled={isDeletingUser}
                    className="h-11 px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDeleteUser}
                    disabled={isDeletingUser}
                  >
                    {isDeletingUser ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2 text-white" />
                        Delete User
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View User Modal */}
        {showViewUserModal && viewingUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-600 rounded-lg">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">User Details</h3>
                    <p className="text-sm text-muted-foreground">View complete user information</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowViewUserModal(false)
                    setViewingUser(null)
                  }}
                  className="h-8 w-8 p-0 hover:bg-accent"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* User Header */}
                <Card className="border-0 bg-blue-50 dark:bg-blue-100">
                  <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-2xl shadow-sm">
                    {getInitials(viewingUser?.name || 'Unknown')}
                  </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-foreground">{viewingUser?.name || 'Unknown User'}</h4>
                        <div className="flex items-center gap-3 mt-2">
                      {viewingUser?.isVerified && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Verified</span>
                            </div>
                      )}
                          <Badge className={`${getStatusColor(viewingUser?.status || 'inactive')} px-3 py-1`}>
                        {viewingUser?.status || 'Unknown'}
                      </Badge>
                          <Badge className={`${getRoleColor(viewingUser?.role || 'user')} px-3 py-1`}>
                        {viewingUser?.role || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                </div>
                  </CardContent>
                </Card>

                {/* User Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-foreground">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span className="text-foreground font-medium">{viewingUser?.email || 'No email'}</span>
                      </div>
                    </div>
                    
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Shield className="w-4 h-4 text-purple-600" />
                          <Badge className={`${getRoleColor(viewingUser?.role || 'user')} px-3 py-1`}>
                          {viewingUser?.role || 'Unknown'}
                        </Badge>
                      </div>
                    </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Project</Label>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <span className="text-foreground font-medium">{viewingUser?.projectName || 'No project'}</span>
                      </div>
                    </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-foreground">Account Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Badge className={`${getStatusColor(viewingUser?.status || 'inactive')} px-3 py-1`}>
                          {viewingUser?.status || 'Unknown'}
                        </Badge>
                        {viewingUser?.isVerified && (
                            <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                              <span className="text-xs font-medium">Verified</span>
                          </div>
                        )}
                      </div>
                    </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span className="text-foreground font-medium">{formatDate(viewingUser?.createdAt || new Date().toISOString())}</span>
                      </div>
                    </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="text-foreground font-medium">{formatDate(viewingUser?.updatedAt || new Date().toISOString())}</span>
                      </div>
                    </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowViewUserModal(false)
                      setViewingUser(null)
                    }}
                    className="h-10 px-6"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setShowViewUserModal(false)
                      setViewingUser(null)
                      if (viewingUser) {
                        openEditUserRoleModal(viewingUser)
                      }
                    }}
                    className="h-10 px-6 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Edit className="w-4 h-4 mr-2 text-white" />
                    Edit Role
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Roles Management Modal */}
        {showRolesModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-indigo-600 rounded-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Role Management</h3>
                    <p className="text-sm text-muted-foreground">Manage all roles and permissions</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRolesModal(false)}
                  className="h-8 w-8 p-0 hover:bg-accent"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Roles: {roles.length}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowRolesModal(false)
                      setShowRoleModal(true)
                    }}
                    className="flex items-center gap-2 h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Role</span>
                  </Button>
                </div>
                <div className="space-y-3">
                  {roles.map((role) => (
                    <Card key={role._id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                              <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <Badge className={`${getRoleColor(role.name)} px-3 py-1 text-sm font-medium`}>
                                {role.name}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                Created: {formatDate(role.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600" 
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setShowRolesModal(false)
                                openEditRoleModal(role)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('Delete button clicked for role:', role)
                                // Add delete role functionality here
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </ProtectedRoute>
  )
} 