import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Badge } from './badge';
import { AuditLog, getActionBadge, formatDateTime } from '../../lib/Report';
import { 
  User,
  Clock,
  Eye,
  Edit,
  Trash2,
  Plus,
  Lock,
  Unlock,
  Shield,
  MapPin,
  Tag,
  Building,
  Calendar
} from 'lucide-react';

interface AuditTableProps {
  logs: AuditLog[];
  onViewDetails?: (log: AuditLog) => void;
}

export const AuditTable: React.FC<AuditTableProps> = ({
  logs,
  onViewDetails
}) => {
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return <Lock className="w-4 h-4 text-blue-500" />;
      case 'logout':
        return <Unlock className="w-4 h-4 text-gray-500" />;
      case 'create':
        return <Plus className="w-4 h-4 text-green-500" />;
      case 'update':
        return <Edit className="w-4 h-4 text-yellow-500" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'view':
        return <Eye className="w-4 h-4 text-blue-500" />;
      default:
        return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-gray-50">
            <TableHead className="w-64">User & Action</TableHead>
            <TableHead className="w-48">Resource</TableHead>
            <TableHead className="w-64">Asset Details</TableHead>
            <TableHead className="w-48">Location</TableHead>
            <TableHead className="w-40">Timestamp</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const actionBadge = getActionBadge(log.action);
            
            return (
              <TableRow key={log._id} className="hover:bg-gray-50 transition-colors">
                <TableCell>
                  <div className="space-y-2">
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{log.user.name}</div>
                        <div className="text-sm text-gray-500">{log.user.email}</div>
                      </div>
                    </div>
                    
                    {/* Action Info */}
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <Badge className={actionBadge.className}>
                        {actionBadge.label}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{log.resourceType}</div>
                    <div className="text-sm text-gray-500 font-mono">ID: {log.resourceId}</div>
                    {log.details.tagId && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Tag className="w-3 h-3" />
                        <span className="font-mono">{log.details.tagId}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-2">
                    {log.details.assetType && (
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{log.details.assetType}</div>
                          {log.details.subcategory && (
                            <div className="text-xs text-gray-500">{log.details.subcategory}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {log.details.brand && (
                      <div className="text-sm text-gray-600">
                        Brand: <span className="font-medium">{log.details.brand}</span>
                      </div>
                    )}
                    
                    {log.details.capacity && (
                      <div className="text-sm text-gray-600">
                        Capacity: <span className="font-medium">{log.details.capacity}</span>
                      </div>
                    )}
                    
                    {log.details.projectName && (
                      <div className="text-sm text-blue-600 font-medium">
                        {log.details.projectName}
                      </div>
                    )}
                    
                    {log.details.yearOfInstallation && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>Installed: {log.details.yearOfInstallation}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  {log.details.location ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div className="text-sm">
                        <div className="font-mono text-gray-600">
                          {log.details.location.latitude}
                        </div>
                        <div className="font-mono text-gray-600">
                          {log.details.location.longitude}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">No location</div>
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <button
                    onClick={() => onViewDetails?.(log)}
                    className="p-2 hover:bg-purple-100 rounded-lg transition-colors group"
                    title="View Full Details"
                  >
                    <Eye className="w-4 h-4 text-gray-500 group-hover:text-purple-600" />
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};