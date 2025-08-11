import React from 'react';
import { Button } from './button';
// import { Badge } from './badge';
import { StatusBadge } from './status-badge';
import { PriorityBadge } from './priority-badge';
import { Edit, Trash2, Eye, Calendar, MapPin, Tag } from 'lucide-react';
import { Asset } from '../../lib/adminasset';

interface AssetCardProps {
  asset: Asset;
  onView: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
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
  className = ''
}) => {
  return (
    <div className={`p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-semibold text-gray-900">{asset.tagId}</h4>
            <StatusBadge status={asset.status || 'active'} />
            <PriorityBadge priority={asset.priority || 'medium'} />
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4" />
              <span>{asset.assetType}</span>
            </div>
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
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {asset.notes}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-1 ml-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-blue-50"
            onClick={() => onView(asset)}
          >
            <Eye className="w-4 h-4 text-blue-600" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-green-50"
            onClick={() => onEdit(asset)}
          >
            <Edit className="w-4 h-4 text-green-600" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-red-50"
            onClick={() => onDelete(asset._id || '')}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 