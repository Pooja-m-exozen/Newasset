import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Badge } from './badge';
import { StatusBadge } from './status-badge';
import { PriorityBadge } from './priority-badge';
import { Calendar, MapPin, Tag, Package, AlertCircle } from 'lucide-react';
import { Asset } from '../../lib/adminasset';

interface AssetViewModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const AssetViewModal: React.FC<AssetViewModalProps> = ({
  asset,
  isOpen,
  onClose
}) => {
  if (!asset) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Asset Details</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header with status and priority */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{asset.tagId}</h3>
              <p className="text-gray-600 mt-1">{asset.notes}</p>
            </div>
            <div className="flex items-center space-x-2">
              <StatusBadge status={asset.status || 'active'} />
              <PriorityBadge priority={asset.priority || 'medium'} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Basic Information</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Type</p>
                    <p className="text-sm text-gray-900">{asset.assetType}</p>
                  </div>
                </div>
                
                {asset.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Location</p>
                      <p className="text-sm text-gray-900">
                        {asset.location.building || asset.location.floor || asset.location.room || 'Location'}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Created</p>
                    <p className="text-sm text-gray-900">
                      {asset.createdAt ? formatDate(asset.createdAt) : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {asset.updatedAt && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Last Updated</p>
                      <p className="text-sm text-gray-900">{formatDate(asset.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Additional Details</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Asset ID</p>
                  <p className="text-sm text-gray-900 font-mono">{asset._id}</p>
                </div>
                
                {asset.tags && asset.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {asset.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {asset.brand && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Brand</p>
                    <p className="text-sm text-gray-900">{asset.brand}</p>
                  </div>
                )}
                {asset.model && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Model</p>
                    <p className="text-sm text-gray-900">{asset.model}</p>
                  </div>
                )}
                {asset.serialNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Serial Number</p>
                    <p className="text-sm text-gray-900">{asset.serialNumber}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Information */}
          {asset.status === 'maintenance' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800">Maintenance Mode</p>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                This asset is currently under maintenance and may not be fully operational.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 