import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Badge } from './badge';
import { StatusBadge } from './status-badge';
import { PriorityBadge } from './priority-badge';
import { Calendar, MapPin, Tag, Package, AlertCircle, X } from 'lucide-react';
import { Asset } from '../../lib/adminasset';
import { Button } from './button';

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
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Asset Details</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header with status and priority */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{asset.tagId}</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{asset.notes}</p>
            </div>
            <div className="flex items-center space-x-2">
              <StatusBadge status={asset.status || 'active'} />
              <PriorityBadge priority={asset.priority || 'medium'} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Basic Information</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Tag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</p>
                    <p className="text-sm text-gray-900 dark:text-white">{asset.assetType}</p>
                  </div>
                </div>
                
                {asset.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {asset.location.building || asset.location.floor || asset.location.room || 'Location'}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Created</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {asset.createdAt ? formatDate(asset.createdAt) : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {asset.updatedAt && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</p>
                      <p className="text-sm text-gray-900 dark:text-white">{formatDate(asset.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Additional Details</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Asset ID</p>
                  <p className="text-sm text-gray-900 dark:text-white font-mono">{asset._id}</p>
                </div>
                
                {asset.tags && asset.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {asset.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {asset.brand && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Brand</p>
                    <p className="text-sm text-gray-900 dark:text-white">{asset.brand}</p>
                  </div>
                )}
                {asset.model && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model</p>
                    <p className="text-sm text-gray-900 dark:text-white">{asset.model}</p>
                  </div>
                )}
                {asset.serialNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Serial Number</p>
                    <p className="text-sm text-gray-900 dark:text-white">{asset.serialNumber}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Information */}
          {asset.status === 'maintenance' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Maintenance Mode</p>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                This asset is currently under maintenance and may not be fully operational.
              </p>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={onClose}
              className="bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-800 text-white px-6"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 