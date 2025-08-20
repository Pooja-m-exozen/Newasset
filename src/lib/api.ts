// API service for authentication
const API_BASE_URL = 'http://192.168.0.5:5021/api'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: string
  projectName: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface UpdateProfileRequest {
  name?: string
  email?: string
}

export interface UpdatePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface AuthResponse {
  success: boolean
  message: string
  token?: string
  user?: {
    id: string
    name: string
    email: string
    role: string
    projectName?: string
    projectId?: string
    status?: string
  }
}

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  // POST Register API
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Registration failed')
      }

      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed')
    }
  }

  // POST Login API
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Login failed')
      }

      // Store token in localStorage if login is successful
      if (result.success && result.token) {
        localStorage.setItem('authToken', result.token)
      }

      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed')
    }
  }

  // POST Forgot Password Reset Link
  async forgotPassword(data: ForgotPasswordRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send reset link')
      }

      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to send reset link')
    }
  }

  // POST Reset Password
  async resetPassword(data: ResetPasswordRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Password reset failed')
      }

      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Password reset failed')
    }
  }

  // GET Get Me
  async getProfile(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get profile')
      }

      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get profile')
    }
  }

  // PUT Update Profile
  async updateProfile(data: UpdateProfileRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Profile update failed')
      }

      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Profile update failed')
    }
  }

  // PUT Update Password
  async updatePassword(data: UpdatePasswordRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/update-password`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Password update failed')
      }

      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Password update failed')
    }
  }

  // Logout
  logout() {
    localStorage.removeItem('authToken')
    window.location.href = '/login'
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken')
  }
}

export const apiService = new ApiService() 