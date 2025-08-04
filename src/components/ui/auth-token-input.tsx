'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Badge } from './badge'
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthTokenInputProps {
  onTokenSet: (token: string) => void;
  className?: string;
}

export function AuthTokenInput({ onTokenSet, className }: AuthTokenInputProps) {
  const [token, setToken] = useState('')
  const [isSet, setIsSet] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    // Check if token already exists
    const existingToken = localStorage.getItem('authToken')
    if (existingToken) {
      setToken(existingToken)
      setIsSet(true)
      onTokenSet(existingToken)
    }
  }, [onTokenSet])

  const handleSetToken = async () => {
    if (!token.trim()) return

    setIsValidating(true)
    
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    localStorage.setItem('authToken', token.trim())
    onTokenSet(token.trim())
    setIsSet(true)
    setIsValidating(false)
  }

  const handleClearToken = () => {
    localStorage.removeItem('authToken')
    setToken('')
    setIsSet(false)
    onTokenSet('')
  }

  const handleToggleVisibility = () => {
    setShowToken(!showToken)
  }

  const isTokenValid = token.trim().length > 0

  return (
    <Card className={cn("border-2", isSet ? "border-green-200 bg-green-50/30" : "border-gray-200", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "p-2 rounded-full",
            isSet ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
          )}>
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center space-x-2">
              Authentication Token
              {isSet && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Set your authentication token to access the QR code generation API
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="authToken" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>Auth Token</span>
          </Label>
          <div className="relative">
            <Input
              id="authToken"
              type={showToken ? "text" : "password"}
              placeholder="Enter your authentication token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className={cn(
                "pr-10",
                isSet && "border-green-300 bg-green-50"
              )}
              disabled={isValidating}
            />
            <button
              type="button"
              onClick={handleToggleVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {token && (
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <AlertCircle className="h-3 w-3" />
              <span>Token will be stored securely in your browser</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={handleSetToken} 
            disabled={!isTokenValid || isValidating}
            className="flex-1"
          >
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Validating...
              </>
            ) : isSet ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Update Token
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Set Token
              </>
            )}
          </Button>
          {isSet && (
            <Button 
              variant="outline" 
              onClick={handleClearToken}
              className="flex-1 sm:flex-none"
            >
              Clear Token
            </Button>
          )}
        </div>
        
        {isSet && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  Authentication token is set and ready to use
                </p>
                <p className="text-xs text-green-600 mt-1">
                  You can now generate QR codes for your digital assets
                </p>
              </div>
            </div>
          </div>
        )}

        {!isSet && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">
                  Authentication Required
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Please set your authentication token to access the QR code generation features
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 