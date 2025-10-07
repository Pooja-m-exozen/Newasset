export interface LoginHistoryEntry {
  timestamp: string
  ipAddress: string
  userAgent: string
  success: boolean
}

export interface ActivityLogEntry {
  timestamp: string
  action: string
  description: string
  ipAddress?: string
  userAgent?: string
}

const API_BASE_URL = 'https://digitalasset.zenapi.co.in/api'

export interface User {
  _id: string
  name: string
  email: string
  role: string
  projectName: string
  isVerified: boolean
  verificationToken: string | null
  status: string
  resetPasswordExpires: string
  createdAt: string
  updatedAt: string
  __v: number
  resetPasswordToken?: string
  contactInfo?: {
    phone?: string
    emergencyContact?: {
      name: string
      phone: string
      relationship: string
    }
    address?: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
  }
  workSchedule?: {
    shift: string
    workingDays: string[]
    startTime: string
    endTime: string
    timezone: string
  }
  loginHistory?: LoginHistoryEntry[]
  activityLog?: ActivityLogEntry[]
}

export interface Role {
  _id: string
  name: string
  createdBy?: string
  createdAt: string
  updatedAt: string
  __v: number
}

export interface CreateUserData {
  name: string
  email: string
  password: string
  role: string
  projectName: string
}

export interface UsersResponse {
  success: boolean
  users: User[]
}

export interface RoleResponse {
  success: boolean
  message: string
  role: Role
}

export interface RolesResponse {
  success: boolean
  roles: Role[]
}

export interface CreateUserResponse {
  success: boolean
  message: string
  user?: User
}

export interface UpdateRoleResponse {
  success: boolean
  message: string
  role?: Role
}

export interface UpdateUserRoleResponse {
  success: boolean
  message: string
  user?: User
}

export interface DeleteUserResponse {
  success: boolean
  message: string
}

export const manageUserService = {
  async getUsers(): Promise<UsersResponse> {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_BASE_URL}/admin`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },

  async createUser(userData: CreateUserData): Promise<CreateUserResponse> {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  },

  async updateUser(userId: string, userData: Partial<User>): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  },

  async deleteUser(userId: string): Promise<DeleteUserResponse> {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_BASE_URL}/admin/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  },

  // Role Management APIs
  async createRole(roleData: { name: string }): Promise<RoleResponse> {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_BASE_URL}/roles/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roleData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error creating role:', error)
      throw error
    }
  },

  async getRoles(): Promise<RolesResponse> {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_BASE_URL}/roles`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching roles:', error)
      throw error
    }
  },

  async deleteRole(roleId: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error deleting role:', error)
      throw error
    }
  },

  async updateRole(roleId: string, roleData: { role: string }): Promise<UpdateRoleResponse> {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roleData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error updating role:', error)
      throw error
    }
  },

  async updateUserRole(userId: string, roleData: { role: string }): Promise<UpdateUserRoleResponse> {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_BASE_URL}/admin/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roleData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error updating user role:', error)
      throw error
    }
  }
}