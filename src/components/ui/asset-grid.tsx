import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Asset, getStatusBadge, getPriorityBadge, formatDate } from '../../lib/Report';
import { 
  Building2,
  User,
  MoreHorizontal
} from 'lucide-react';

interface AssetGridProps {
  assets: Asset[];
  onViewDetails?: (asset: Asset) => void;
}

export const AssetGrid: React.FC<AssetGridProps> = ({
  assets,
  onViewDetails
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {assets.map((asset) => {
        const statusBadge = getStatusBadge(asset.status || 'active');
        const priorityBadge = getPriorityBadge(asset.priority || 'medium');
        
        return (
          <Card key={asset._id} className="bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{asset.brand} {asset.model}</CardTitle>
                  <p className="text-sm text-gray-500 font-mono">{asset.tagId}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onViewDetails?.(asset)}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">{asset.assetType}</span>
                {asset.subcategory && (
                  <span className="text-xs text-gray-500">({asset.subcategory})</span>
                )}
              </div>
              
              {asset.assignedTo && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-blue-600" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{asset.assignedTo.name}</div>
                    <div className="text-gray-500">{asset.assignedTo.email}</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {asset.location.building || 'Location not specified'}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Badge className={statusBadge.className}>
                  {statusBadge.label}
                </Badge>
                <Badge className={priorityBadge.className}>
                  {priorityBadge.label}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Created: {formatDate(asset.createdAt)}</span>
                <span>Updated: {formatDate(asset.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}; 