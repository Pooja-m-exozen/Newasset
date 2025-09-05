"use client"

import React from 'react';
import { Button } from './button';
// import { Badge } from './badge';
import { StatusBadge } from './status-badge';
import { PriorityBadge } from './priority-badge';
import { useTheme } from '@/contexts/ThemeContext';
import { Edit, Trash2, Eye, Calendar, MapPin, Tag, QrCode } from 'lucide-react';
import { Asset } from '../../lib/adminasset';

interface AssetCardProps {
  asset: Asset;
  onView: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
  onGenerateQR?: (asset: Asset) => void;
  className?: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onView,
  onEdit,
  onDelete,
  onGenerateQR,
  className = ''
}) => {
  const { resolvedTheme } = useTheme();
  
  return (
    <div className={`p-4 border rounded-lg transition-colors ${className} ${
      resolvedTheme === 'dark'
        ? 'border-gray-700 hover:bg-gray-700 bg-gray-800'
        : 'border-gray-200 hover:bg-gray-50 bg-white'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className={`font-semibold ${
              resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>{asset.tagId}</h4>
            <StatusBadge status={asset.status || 'active'} />
            <PriorityBadge priority={asset.priority || 'medium'} />
            {asset.digitalAssets?.qrCode && (
              <div className="w-2 h-2 bg-green-500 rounded-full" title="Has QR Code"></div>
            )}
          </div>
          
          <div className={`space-y-1 text-sm ${
            resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4" />
              <span>{asset.assetType}</span>
            </div>
            {asset.mobilityCategory && (
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-sm ${asset.mobilityCategory === 'movable' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                <span className="capitalize">{asset.mobilityCategory}</span>
              </div>
            )}
            {asset.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{asset.location.building || asset.location.floor || 'Location'}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Created: {asset.createdAt ? formatDate(asset.createdAt) : 'N/A'}</span>
            </div>
          </div>
          
          {asset.notes && (
            <p className={`text-sm mt-2 line-clamp-2 ${
              resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {asset.notes}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-1 ml-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 w-8 p-0 ${
              resolvedTheme === 'dark'
                ? 'hover:bg-blue-900/20 text-blue-400'
                : 'hover:bg-blue-50 text-blue-600'
            }`}
            onClick={() => onView(asset)}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 w-8 p-0 ${
              resolvedTheme === 'dark'
                ? 'hover:bg-green-900/20 text-green-400'
                : 'hover:bg-green-50 text-green-600'
            }`}
            onClick={() => onEdit(asset)}
            title="Edit Asset"
          >
            <Edit className="w-4 h-4" />
          </Button>
          {onGenerateQR && (
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-8 w-8 p-0 ${
                resolvedTheme === 'dark'
                  ? 'hover:bg-purple-900/20 text-purple-400'
                  : 'hover:bg-purple-50 text-purple-600'
              }`}
              onClick={() => onGenerateQR(asset)}
              title="Generate QR Code"
            >
              <QrCode className="w-4 h-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-red-50"
            onClick={() => onDelete(asset._id || '')}
            title="Delete Asset"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 