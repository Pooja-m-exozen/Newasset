import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Button } from './button';
import { Badge } from './badge';
import { Asset, getStatusBadge, getPriorityBadge, formatDate, formatDateTime } from '../../lib/Report';
import { 
  Calendar,
  Building2,
  User,
  Clock,
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AssetTableProps {
  assets: Asset[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  onViewDetails?: (asset: Asset) => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  sortBy,
  sortOrder,
  onSort,
  onViewDetails
}) => {
  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-gray-50">
            <TableHead 
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('tagId')}
            >
              <div className="flex items-center gap-1">
                Asset
                {getSortIcon('tagId')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('assetType')}
            >
              <div className="flex items-center gap-1">
                Type
                {getSortIcon('assetType')}
              </div>
            </TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('createdAt')}
            >
              <div className="flex items-center gap-1">
                Created
                {getSortIcon('createdAt')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('updatedAt')}
            >
              <div className="flex items-center gap-1">
                Last Updated
                {getSortIcon('updatedAt')}
              </div>
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => {
            const statusBadge = getStatusBadge(asset.status || 'active');
            const priorityBadge = getPriorityBadge(asset.priority || 'medium');
            
            return (
              <TableRow key={asset._id} className="hover:bg-gray-50 transition-colors">
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">{asset.brand} {asset.model}</div>
                    <div className="text-sm text-gray-500 font-mono">{asset.tagId}</div>
                    {asset.serialNumber && (
                      <div className="text-xs text-gray-400">SN: {asset.serialNumber}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">{asset.assetType}</div>
                    {asset.subcategory && (
                      <div className="text-sm text-gray-500">{asset.subcategory}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {asset.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{asset.assignedTo.name}</div>
                        <div className="text-sm text-gray-500">{asset.assignedTo.email}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <div className="text-sm">
                      {asset.location.building && `${asset.location.building}`}
                      {asset.location.floor && ` - ${asset.location.floor}`}
                      {asset.location.room && ` - ${asset.location.room}`}
                      {!asset.location.building && !asset.location.floor && !asset.location.room && 'Location not specified'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${statusBadge.className} transition-colors`}>
                    {statusBadge.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`${priorityBadge.className} transition-colors`}>
                    {priorityBadge.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{formatDate(asset.createdAt)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{formatDateTime(asset.updatedAt)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onViewDetails?.(asset)}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}; 