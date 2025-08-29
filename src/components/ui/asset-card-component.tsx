"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  QrCode, 
  Barcode, 
  Smartphone,
  Download,
  Eye,
  Calendar,
  Tag,
  MapPin,
  Building,
  Layers,
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

interface AssetCardProps {
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

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function AssetCard({ 
  asset, 
  onShowDetails, 
  onDownload, 
  onShowMoreOptions, 
  onShowDigitalAsset 
}: AssetCardProps) {
  const { resolvedTheme } = useTheme()
  const statusInfo = getStatusInfo(asset.status)
  const priorityInfo = getPriorityInfo(asset.priority)
  const StatusIcon = statusInfo.icon

  return (
    <Card className={`group relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border rounded-lg ${
      resolvedTheme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Status Indicator Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${statusInfo.bgColor}`} />
      
      <CardContent className="p-4">
        {/* Header with Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <Tag className="w-5 h-5 text-white" />
              </div>
                             <div>
                 <h3 className={`font-bold text-lg transition-colors ${
                   resolvedTheme === 'dark' 
                     ? 'text-white group-hover:text-blue-400' 
                     : 'text-gray-900 group-hover:text-blue-600'
                 }`}>
                   {asset.tagId}
                 </h3>
                 <p className={`text-xs font-medium uppercase tracking-wide ${
                   resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                 }`}>
                   {asset.assetType}
                 </p>
               </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color} shadow-sm`}>
            <StatusIcon className="w-3 h-3" />
            <span className="text-xs font-bold capitalize tracking-wide">{asset.status}</span>
          </div>
        </div>

        {/* Asset Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Brand</span>
            <span className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{asset.brand}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Model</span>
            <span className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{asset.model}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Priority</span>
            <Badge variant={priorityInfo.variant} className={`${priorityInfo.color} ${priorityInfo.bgColor} border-0 font-bold px-2 py-0.5 text-xs`}>
              {asset.priority}
            </Badge>
          </div>
        </div>

        {/* Location Info */}
        <div className={`rounded-lg p-3 mb-3 border ${
          resolvedTheme === 'dark' 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <MapPin className="w-3 h-3 text-white" />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wide ${
              resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>Location</span>
          </div>
          <div className={`space-y-1 text-xs ${
            resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {asset.location ? (
              <>
                <div className="flex items-center gap-2">
                  <Building className={`w-3 h-3 ${
                    resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <span className="font-semibold">{asset.location.building}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className={`w-3 h-3 ${
                    resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <span className="font-semibold">{asset.location.floor} • {asset.location.room}</span>
                </div>
              </>
            ) : (
              <div className={`text-center py-2 ${
                resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <span className="text-xs">Location not available</span>
              </div>
            )}
          </div>
        </div>

        {/* Digital Assets Summary - Clickable Icons */}
        <div className="flex items-center gap-2 mb-3">
          {asset.digitalAssets?.qrCode && (
            <button 
              onClick={() => onShowDigitalAsset(asset, 'qrCode')}
              className={`w-6 h-6 rounded-lg flex items-center justify-center border cursor-pointer transition-colors duration-200 hover:scale-110 ${
                resolvedTheme === 'dark'
                  ? 'bg-blue-900 hover:bg-blue-800 border-blue-700'
                  : 'bg-blue-100 hover:bg-blue-200 border-blue-200'
              }`}
              title="Click to view QR Code"
            >
              <QrCode className={`w-3 h-3 ${
                resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </button>
          )}
          {asset.digitalAssets?.barcode && (
            <button 
              onClick={() => onShowDigitalAsset(asset, 'barcode')}
              className={`w-6 h-6 rounded-lg flex items-center justify-center border cursor-pointer transition-colors duration-200 hover:scale-110 ${
                resolvedTheme === 'dark'
                  ? 'bg-green-900 hover:bg-green-800 border-green-700'
                  : 'bg-green-100 hover:bg-green-200 border-green-200'
              }`}
              title="Click to view Barcode"
            >
              <Barcode className={`w-3 h-3 ${
                resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`} />
            </button>
          )}
          {asset.digitalAssets?.nfcData && (
            <button 
              onClick={() => onShowDigitalAsset(asset, 'nfcData')}
              className={`w-6 h-6 rounded-lg flex items-center justify-center border cursor-pointer transition-colors duration-200 hover:scale-110 ${
                resolvedTheme === 'dark'
                  ? 'bg-purple-900 hover:bg-purple-800 border-purple-700'
                  : 'bg-purple-100 hover:bg-purple-200 border-purple-200'
              }`}
              title="Click to view NFC Data"
            >
              <Smartphone className={`w-3 h-3 ${
                resolvedTheme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </button>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between pt-3 border-t ${
          resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'
        }`}>
          <div className={`text-xs ${
            resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Calendar className={`w-3 h-3 ${
                  resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`} />
              </div>
              <span className="font-semibold">{formatDate(asset.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onShowDetails(asset)}
              className={`h-7 w-7 p-0 rounded-lg ${
                resolvedTheme === 'dark'
                  ? 'hover:bg-blue-900/20 hover:text-blue-400 text-blue-400'
                  : 'hover:bg-blue-50 hover:text-blue-600 text-blue-600'
              }`}
            >
              <Eye className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDownload(asset)}
              className={`h-7 w-7 p-0 rounded-lg ${
                resolvedTheme === 'dark'
                  ? 'hover:bg-green-900/20 hover:text-green-400 text-green-400'
                  : 'hover:bg-green-50 hover:text-green-600 text-green-600'
              }`}
            >
              <Download className="w-3 h-3" />
            </Button>
                         <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => onShowMoreOptions(asset._id)}
               className={`h-7 w-7 p-0 rounded-lg ${
                 resolvedTheme === 'dark'
                   ? 'hover:bg-purple-900/20 hover:text-purple-400 text-purple-400'
                   : 'hover:bg-purple-50 hover:text-purple-600 text-purple-600'
               }`}
             >
               <MoreHorizontal className="w-3 h-3" />
             </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
