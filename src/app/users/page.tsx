"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Shield, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  Building2,
  Filter,
  Download,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown,
  Settings,
  ArrowRight,
  ArrowUp,
  Plus as PlusIcon,
  Minus,
  UserPlus,
  UserCheck,
  UserX,
  Activity
} from "lucide-react"

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [activeTab, setActiveTab] = useState("users")

  // Dummy data for users
  const users = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@company.com",
      role: "Admin",
      status: "Active",
      department: "IT",
      location: "New York",
      lastLogin: "2024-01-15 10:30 AM",
      phone: "+1 (555) 123-4567",
      avatar: "JD",
      permissions: ["read", "write", "delete", "admin"],
      joinDate: "2023-01-15"
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@company.com",
      role: "Manager",
      status: "Active",
      department: "Operations",
      location: "Los Angeles",
      lastLogin: "2024-01-15 09:15 AM",
      phone: "+1 (555) 234-5678",
      avatar: "JS",
      permissions: ["read", "write"],
      joinDate: "2023-03-20"
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike.johnson@company.com",
      role: "User",
      status: "Inactive",
      department: "Sales",
      location: "Chicago",
      lastLogin: "2024-01-10 02:45 PM",
      phone: "+1 (555) 345-6789",
      avatar: "MJ",
      permissions: ["read"],
      joinDate: "2023-06-10"
    },
    {
      id: 4,
      name: "Sarah Wilson",
      email: "sarah.wilson@company.com",
      role: "Manager",
      status: "Active",
      department: "Marketing",
      location: "Boston",
      lastLogin: "2024-01-15 11:20 AM",
      phone: "+1 (555) 456-7890",
      avatar: "SW",
      permissions: ["read", "write"],
      joinDate: "2023-02-28"
    },
    {
      id: 5,
      name: "David Brown",
      email: "david.brown@company.com",
      role: "User",
      status: "Active",
      department: "Engineering",
      location: "San Francisco",
      lastLogin: "2024-01-15 08:45 AM",
      phone: "+1 (555) 567-8901",
      avatar: "DB",
      permissions: ["read"],
      joinDate: "2023-08-15"
    }
  ]

  // Dummy data for roles
  const roles = [
    {
      id: 1,
      name: "Admin",
      description: "Full system access and control",
      permissions: ["read", "write", "delete", "admin"],
      userCount: 2,
      color: "bg-red-100 text-red-800",
      icon: Crown
    },
    {
      id: 2,
      name: "Manager",
      description: "Department-level access and control",
      permissions: ["read", "write"],
      userCount: 3,
      color: "bg-blue-100 text-blue-800",
      icon: Shield
    },
    {
      id: 3,
      name: "User",
      description: "Basic user access",
      permissions: ["read"],
      userCount: 8,
      color: "bg-green-100 text-green-800",
      icon: User
    },
    {
      id: 4,
      name: "Viewer",
      description: "Read-only access",
      permissions: ["read"],
      userCount: 5,
      color: "bg-gray-100 text-gray-800",
      icon: Eye
    }
  ]

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800'
      case 'Manager': return 'bg-blue-100 text-blue-800'
      case 'User': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleViewUser = (user: any) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "text-blue-600" },
    { label: "Active Users", value: users.filter(u => u.status === "Active").length, icon: UserCheck, color: "text-green-600" },
    { label: "Inactive Users", value: users.filter(u => u.status === "Inactive").length, icon: UserX, color: "text-red-600" },
    { label: "Total Roles", value: roles.length, icon: Shield, color: "text-purple-600" }
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage users, roles, and permissions across your organization</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm border">
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("users")}
              className="flex-1 rounded-lg"
            >
              <Users className="w-4 h-4 mr-2" />
              Users ({users.length})
            </Button>
            <Button
              variant={activeTab === "roles" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("roles")}
              className="flex-1 rounded-lg"
            >
              <Shield className="w-4 h-4 mr-2" />
              Roles ({roles.length})
            </Button>
          </div>

          {/* Users Tab */}
          {activeTab === "users" && (
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">All Users</CardTitle>
                    <CardDescription>Manage user accounts and permissions</CardDescription>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-80"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 hover:border-blue-200">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                          {user.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{user.name}</h3>
                            {user.status === "Active" && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className={getRoleColor(user.role)}>
                              {user.role}
                            </Badge>
                            <Badge className={getStatusColor(user.status)}>
                              {user.status}
                            </Badge>
                            <span className="text-xs text-gray-500">• {user.department}</span>
                            <span className="text-xs text-gray-500">• {user.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUser(user)}
                          className="hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-green-50 hover:text-green-700">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Roles Tab */}
          {activeTab === "roles" && (
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">User Roles</CardTitle>
                    <CardDescription>Manage roles and permissions</CardDescription>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roles.map((role) => (
                    <div key={role.id} className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 hover:border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${role.color} bg-opacity-20`}>
                            <role.icon className="w-5 h-5" />
                          </div>
                          <Badge className={role.color}>
                            {role.name}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Users</span>
                          <span className="font-semibold text-gray-900">{role.userCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Permissions</span>
                          <span className="font-semibold text-gray-900">{role.permissions.length}</span>
                        </div>
                        <div className="pt-2">
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.map((permission) => (
                              <Badge key={permission} variant="secondary" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserModal(false)}
                className="h-8 w-8 p-0"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl shadow-lg">
                  {selectedUser.avatar}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-3">
                    <Badge className={getRoleColor(selectedUser.role)}>
                      {selectedUser.role}
                    </Badge>
                    <Badge className={getStatusColor(selectedUser.status)}>
                      {selectedUser.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Personal Information</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium">{selectedUser.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium">{selectedUser.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Department</p>
                        <p className="text-sm font-medium">{selectedUser.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm font-medium">{selectedUser.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Last Login</p>
                        <p className="text-sm font-medium">{selectedUser.lastLogin}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Permissions</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedUser.permissions.map((permission: string) => (
                      <div key={permission} className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900 capitalize">{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                <Button variant="outline" onClick={() => setShowUserModal(false)}>
                  Close
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit User
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 