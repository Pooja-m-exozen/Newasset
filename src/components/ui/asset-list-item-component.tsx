"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  QrCode, 
  Barcode, 
  Smartphone,
  Download,
  Eye,
  Tag,
  Building,
  Layers,
  Users,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  AlertCircle
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
      data: any
      generatedAt: string
    }
    barcode: {
      url: string
      data: string
      generatedAt: string
    }
    nfcData: {
      url: string
      data: any
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

interface AssetListItemProps {
  asset: Asset
  onShowDetails: (asset: Asset) => void
  onDownload: (asset: Asset) => void
  onShowMoreOptions: (assetId: string) => void
  onShowDigitalAsset: (asset: Asset, type: 'qrCode' | 'barcode' | 'nfcData') => void
}

// Get status badge variant and icon
const getStatusInfo = (status: string) => {
  switch (status) {
    case 'active':
      return { variant: 'default', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' }
    case 'inactive':
      return { variant: 'secondary', icon: XCircle, color: 'text-gray-600', bgColor: 'bg-gray-100' }
    case 'maintenance':
      return { variant: 'destructive', icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-100' }
    case 'retired':
      return { variant: 'outline', icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-50' }
    default:
      return { variant: 'secondary', icon: AlertCircle, color: 'text-gray-600', bgColor: 'bg-gray-100' }
  }
}

// Get priority badge variant and color
const getPriorityInfo = (priority: string) => {
  switch (priority) {
    case 'high':
      return { variant: 'destructive' as const, color: 'text-red-600', bgColor: 'bg-red-100' }
    case 'medium':
      return { variant: 'default' as const, color: 'text-blue-600', bgColor: 'bg-blue-100' }
    case 'low':
      return { variant: 'secondary' as const, color: 'text-gray-600', bgColor: 'bg-gray-100' }
    default:
      return { variant: 'secondary' as const, color: 'text-gray-600', bgColor: 'bg-gray-100' }
  }
}

export function AssetListItem({ 
  asset, 
  onShowDetails, 
  onDownload, 
  onShowMoreOptions, 
  onShowDigitalAsset 
}: AssetListItemProps) {
  const statusInfo = getStatusInfo(asset.status)
  const priorityInfo = getPriorityInfo(asset.priority)
  const StatusIcon = statusInfo.icon

  return (
    <div className="group relative overflow-hidden border border-slate-200 rounded-lg hover:shadow-lg transition-all duration-300 hover:border-slate-300 bg-gradient-to-r from-white via-slate-50 to-blue-50">
      {/* Status Indicator */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusInfo.bgColor}`} />
      
      <div className="flex items-center p-4">
        {/* Asset Icon */}
        <div className="flex-shrink-0 mr-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <Tag className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* Asset Info */}
        <div className="flex-1 min-w-0 mr-6">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {asset.tagId}
            </h3>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
              <StatusIcon className="w-3 h-3" />
              <span className="text-xs font-bold capitalize tracking-wide">{asset.status}</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-2 font-medium">
            {asset.assetType} • {asset.brand} {asset.model}
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            {asset.location && (
              <>
                <div className="flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-500" />
                  <span className="font-medium">{asset.location.building}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-slate-500" />
                  <span className="font-medium">{asset.location.floor} • {asset.location.room}</span>
                </div>
              </>
            )}
            {asset.project && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-500" />
                <span className="font-medium">{asset.project.projectName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Priority and Actions */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Badge variant={priorityInfo.variant} className={`${priorityInfo.color} ${priorityInfo.bgColor} border-0 font-bold px-3 py-1 text-xs`}>
            {asset.priority}
          </Badge>
          
          {/* Digital Assets Icons - Clickable */}
          <div className="flex items-center gap-2">
            {asset.digitalAssets?.qrCode && (
              <button 
                onClick={() => onShowDigitalAsset(asset, 'qrCode')}
                className="w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center border border-blue-200 cursor-pointer transition-colors duration-200 hover:scale-110"
                title="Click to view QR Code"
              >
                <QrCode className="w-4 h-4 text-blue-600" />
              </button>
            )}
            {asset.digitalAssets?.barcode && (
              <button 
                onClick={() => onShowDigitalAsset(asset, 'barcode')}
                className="w-8 h-8 bg-green-100 hover:bg-green-200 rounded-lg flex items-center justify-center border border-green-200 cursor-pointer transition-colors duration-200 hover:scale-110"
                title="Click to view Barcode"
              >
                <Barcode className="w-4 h-4 text-green-600" />
              </button>
            )}
            {asset.digitalAssets?.nfcData && (
              <button 
                onClick={() => onShowDigitalAsset(asset, 'nfcData')}
                className="w-8 h-8 bg-purple-100 hover:bg-purple-200 rounded-lg flex items-center justify-center border border-purple-200 cursor-pointer transition-colors duration-200 hover:scale-110"
                title="Click to view NFC Data"
              >
                <Smartphone className="w-4 h-4 text-purple-600" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onShowDetails(asset)}
              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
            >
              <Eye className="w-4 h-4 text-blue-600" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDownload(asset)}
              className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 rounded-lg"
            >
              <Download className="w-4 h-4 text-green-600" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onShowMoreOptions(asset._id)}
              className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
            >
              <MoreHorizontal className="w-4 h-4 text-purple-600" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
