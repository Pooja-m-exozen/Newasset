"use client"

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  qrData: {
    url: string
    data: Record<string, unknown>
    generatedAt: string
  } | null
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, qrData }) => {
  if (!isOpen || !qrData) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              QR Code
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Generated on {new Date(qrData.generatedAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 text-center">
          <div className="mb-4 sm:mb-6">
            <Image
              src={qrData.url.startsWith('http') ? qrData.url : `https://digitalasset.zenapi.co.in${qrData.url}`}
              alt="QR Code"
              width={250}
              height={250}
              className="mx-auto border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm"
              style={{ objectFit: 'contain' }}
              onError={(e) => {
                console.error('QR Code image failed to load:', qrData.url)
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => {
                const link = document.createElement('a')
                const fullUrl = qrData.url.startsWith('http') ? qrData.url : `https://digitalasset.zenapi.co.in${qrData.url}`
                link.href = fullUrl
                link.download = `qr-code-${Date.now()}.png`
                link.click()
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
            >
              Download QR Code
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="px-4 py-2 w-full sm:w-auto"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

