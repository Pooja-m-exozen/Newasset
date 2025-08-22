"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle,
  Tag,
  MapPin,
  Eye
} from 'lucide-react'

interface Asset {
  _id: string
  tagId: string
  assetType: string
  subcategory: string
  brand: string
  model: string
  status: string
  priority: string
  location: {
    latitude: string
    longitude: string
    floor: string
    room: string
    building: string
  } | null
  project?: {
    projectId: string
    projectName: string
  } | null
  compliance: {
    certifications: string[]
    expiryDates: string[]
    regulatoryRequirements: string[]
  }
  digitalAssets: {
    qrCode: {
      url: string
      data: {
        t?: string
        a?: string
        s?: string
        b?: string
        m?: string
        st?: string
        p?: string
        l?: {
          latitude: string
          longitude: string
          floor: string
          room: string
          building: string
        }
        u?: string
        pr?: string | null
        lm?: string | null
        nm?: string | null
        url?: string
        ts?: number
        c?: string
      } | null
      generatedAt: string
    }
    barcode: {
      url: string
      data: string
      generatedAt: string
    }
    nfcData: {
      url: string
      data: {
        type?: string
        id?: string
        assetType?: string
        subcategory?: string
        brand?: string
        model?: string
        status?: string
        priority?: string
        location?: {
          latitude: string
          longitude: string
          floor: string
          room: string
          building: string
        }
        assignedTo?: string
        timestamp?: string
        checksum?: string
        signature?: string
      } | null
      generatedAt: string
    }
  }
  assignedTo: {
    _id: string
    name: string
    email: string
  } | string
  createdAt: string
  updatedAt: string
}

interface SuccessModalProps {
  isOpen: boolean
  asset: Asset | null
  onClose: () => void
  onViewDetails: (asset: Asset) => void
}

export function SuccessModal({ 
  isOpen, 
  asset, 
  onClose, 
  onViewDetails 
}: SuccessModalProps) {
  if (!isOpen || !asset) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-t-2xl px-6 py-4 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Asset Found! 🎉</h2>
          <p className="text-green-100 font-medium">Scanner successfully identified asset</p>
        </div>

        {/* Asset Details */}
        <div className="p-6 space-y-4">
          {/* Asset ID Badge */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
              <Tag className="w-4 h-4 text-blue-600" />
              <span className="text-lg font-bold text-blue-800">{asset.tagId}</span>
            </div>
          </div>

          {/* Asset Information Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Type</div>
              <div className="text-sm font-semibold text-slate-900">{asset.assetType}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Brand</div>
              <div className="text-sm font-semibold text-slate-900">{asset.brand}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Model</div>
              <div className="text-sm font-semibold text-slate-900">{asset.model}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Status</div>
              <div className="text-sm font-semibold text-slate-900 capitalize">{asset.status}</div>
            </div>
          </div>

          {/* Location Info */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-600 uppercase tracking-wide font-medium">Location</span>
            </div>
            {asset.location ? (
              <div className="text-sm text-blue-800">
                <div className="font-medium">{asset.location.building}</div>
                <div className="text-blue-600">{asset.location.floor} • {asset.location.room}</div>
              </div>
            ) : (
              <div className="text-sm text-blue-800 text-center">
                <div className="text-blue-600">Location information not available</div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 space-y-3">
          <Button
            onClick={() => {
              onClose()
              onViewDetails(asset)
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Full Details
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 py-3 rounded-xl font-medium"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
