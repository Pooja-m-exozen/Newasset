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
  ChevronUp,
  Eye
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
          <TableRow className="hover:bg-accent/50">
            <TableHead 
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onSort('tagId')}
            >
              <div className="flex items-center gap-1">
                Asset
                {getSortIcon('tagId')}
              </div>
            </TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => {
            const statusBadge = getStatusBadge(asset.status || 'active');
            const priorityBadge = getPriorityBadge(asset.priority || 'medium');
            
            return (
              <TableRow key={asset._id} className="hover:bg-accent/50 transition-colors">
                <TableCell>
                  <div>
                    <div className="font-medium text-foreground">{asset.brand} {asset.model}</div>
                    <div className="text-sm text-muted-foreground font-mono">{asset.tagId}</div>
                    {asset.serialNumber && (
                      <div className="text-xs text-muted-foreground/70">SN: {asset.serialNumber}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <div className="text-sm text-foreground">
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
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onViewDetails?.(asset)}
                    className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4 text-muted-foreground hover:text-accent-foreground" />
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