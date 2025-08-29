"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/contexts/ThemeContext'
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
  const { resolvedTheme } = useTheme()
  const statusInfo = getStatusInfo(asset.status)
  const priorityInfo = getPriorityInfo(asset.priority)
  const StatusIcon = statusInfo.icon

  return (
    <div className={`group relative overflow-hidden border rounded-lg hover:shadow-lg transition-all duration-300 ${
      resolvedTheme === 'dark' 
        ? 'border-gray-700 hover:border-gray-600 bg-gray-800 hover:bg-gray-700' 
        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
    }`}>
      {/* Status Indicator */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        resolvedTheme === 'dark' 
          ? statusInfo.bgColor.replace('bg-', 'bg-').replace('100', '800').replace('50', '700')
          : statusInfo.bgColor
      }`} />
      
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
            <h3 className={`text-lg font-bold group-hover:text-blue-600 transition-colors ${
              resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {asset.tagId}
            </h3>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
              resolvedTheme === 'dark' 
                ? statusInfo.bgColor.replace('bg-', 'bg-').replace('100', '800').replace('50', '700')
                : statusInfo.bgColor
            } ${statusInfo.color}`}>
              <StatusIcon className="w-3 h-3" />
              <span className="text-xs font-bold capitalize tracking-wide">{asset.status}</span>
            </div>
          </div>
          <p className={`text-sm mb-2 font-medium ${
            resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {asset.assetType} • {asset.brand} {asset.model}
          </p>
          <div className={`flex items-center gap-4 text-xs ${
            resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {asset.location && (
              <>
                <div className="flex items-center gap-1">
                  <Building className={`w-3 h-3 ${
                    resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`} />
                  <span className="font-medium">{asset.location.building}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers className={`w-3 h-3 ${
                    resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`} />
                  <span className="font-medium">{asset.location.floor} • {asset.location.room}</span>
                </div>
              </>
            )}
            {asset.project && (
              <div className="flex items-center gap-1">
                <Users className={`w-3 h-3 ${
                  resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                }`} />
                <span className="font-medium">{asset.project.projectName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Priority and Actions */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Badge variant={priorityInfo.variant} className={`${
            resolvedTheme === 'dark' 
              ? priorityInfo.bgColor.replace('bg-', 'bg-').replace('100', '800').replace('50', '700')
              : priorityInfo.bgColor
          } ${
            resolvedTheme === 'dark' 
              ? priorityInfo.color.replace('text-', 'text-').replace('600', '300').replace('500', '300')
              : priorityInfo.color
          } border-0 font-bold px-3 py-1 text-xs`}>
            {asset.priority}
          </Badge>
          
          {/* Digital Assets Icons - Clickable */}
          <div className="flex items-center gap-2">
            {asset.digitalAssets?.qrCode && (
              <button 
                onClick={() => onShowDigitalAsset(asset, 'qrCode')}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border cursor-pointer transition-colors duration-200 hover:scale-110 ${
                  resolvedTheme === 'dark'
                    ? 'bg-blue-900 hover:bg-blue-800 border-blue-700'
                    : 'bg-blue-100 hover:bg-blue-200 border-blue-200'
                }`}
                title="Click to view QR Code"
              >
                <QrCode className={`w-4 h-4 ${
                  resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </button>
            )}
            {asset.digitalAssets?.barcode && (
              <button 
                onClick={() => onShowDigitalAsset(asset, 'barcode')}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border cursor-pointer transition-colors duration-200 hover:scale-110 ${
                  resolvedTheme === 'dark'
                    ? 'bg-green-900 hover:bg-green-800 border-green-700'
                    : 'bg-green-100 hover:bg-green-200 border-green-200'
                }`}
                title="Click to view Barcode"
              >
                <Barcode className={`w-4 h-4 ${
                  resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`} />
              </button>
            )}
            {asset.digitalAssets?.nfcData && (
              <button 
                onClick={() => onShowDigitalAsset(asset, 'nfcData')}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border cursor-pointer transition-colors duration-200 hover:scale-110 ${
                  resolvedTheme === 'dark'
                    ? 'bg-purple-900 hover:bg-purple-800 border-purple-700'
                    : 'bg-purple-100 hover:bg-purple-200 border-purple-200'
                }`}
                title="Click to view NFC Data"
              >
                <Smartphone className={`w-4 h-4 ${
                  resolvedTheme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                }`} />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onShowDetails(asset)}
              className={`h-8 w-8 p-0 rounded-lg ${
                resolvedTheme === 'dark'
                  ? 'hover:bg-blue-900/20 hover:text-blue-400 text-blue-400'
                  : 'hover:bg-blue-50 hover:text-blue-600 text-blue-600'
              }`}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDownload(asset)}
              className={`h-8 w-8 p-0 rounded-lg ${
                resolvedTheme === 'dark'
                  ? 'hover:bg-green-900/20 hover:text-green-400 text-green-400'
                  : 'hover:bg-green-50 hover:text-green-600 text-green-600'
              }`}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onShowMoreOptions(asset._id)}
              className={`h-8 w-8 p-0 rounded-lg ${
                resolvedTheme === 'dark'
                  ? 'hover:bg-purple-900/20 hover:text-purple-400 text-purple-400'
                  : 'hover:bg-purple-50 hover:text-purple-600 text-purple-600'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
