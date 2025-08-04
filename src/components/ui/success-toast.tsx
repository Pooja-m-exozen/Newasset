'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SuccessToastProps {
  message: string
  duration?: number
  onClose?: () => void
  className?: string
}

export function SuccessToast({ 
  message, 
  duration = 3000, 
  onClose, 
  className 
}: SuccessToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 shadow-lg",
      className
    )}>
      <CheckCircle className="h-5 w-5 text-green-600" />
      <span className="text-sm font-medium text-green-800">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false)
          onClose?.()
        }}
        className="ml-2 text-green-600 hover:text-green-800"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
} 