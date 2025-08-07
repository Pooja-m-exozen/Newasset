import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Badge } from './badge';
import { Button } from './button';
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
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';

interface AuditTableProps {
  logs: AuditLog[];
  onViewDetails?: (log: AuditLog) => void;
}

export const AuditTable: React.FC<AuditTableProps> = ({
  logs,
  onViewDetails
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'logout':
        return <Unlock className="w-4 h-4 text-muted-foreground" />;
      case 'create':
        return <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'update':
        return <Edit className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'view':
        return <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <Shield className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = logs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-accent/50">
              <TableHead className="w-64 text-foreground font-semibold">User & Action</TableHead>
              <TableHead className="w-48 text-foreground font-semibold">Resource</TableHead>
              <TableHead className="w-64 text-foreground font-semibold">Asset Details</TableHead>
              <TableHead className="w-48 text-foreground font-semibold">Location</TableHead>
              <TableHead className="w-40 text-foreground font-semibold">Timestamp</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentLogs.map((log) => {
              const actionBadge = getActionBadge(log.action);
              
              return (
                <TableRow key={log._id} className="hover:bg-accent/50 transition-colors">
                  <TableCell>
                    <div className="space-y-2">
                      {/* User Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">{log.user.name}</div>
                          <div className="text-sm text-muted-foreground">{log.user.email}</div>
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
                      <div className="font-medium text-foreground">{log.resourceType}</div>
                      <div className="text-sm text-muted-foreground font-mono">ID: {log.resourceId}</div>
                      {log.details.tagId && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-foreground">{log.details.assetType}</div>
                            {log.details.subcategory && (
                              <div className="text-xs text-muted-foreground">{log.details.subcategory}</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {log.details.brand && (
                        <div className="text-sm text-muted-foreground">
                          Brand: <span className="font-medium text-foreground">{log.details.brand}</span>
                        </div>
                      )}
                      
                      {log.details.capacity && (
                        <div className="text-sm text-muted-foreground">
                          Capacity: <span className="font-medium text-foreground">{log.details.capacity}</span>
                        </div>
                      )}
                      
                      {log.details.projectName && (
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          {log.details.projectName}
                        </div>
                      )}
                      
                      {log.details.yearOfInstallation && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>Installed: {log.details.yearOfInstallation}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {log.details.location ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div className="font-mono text-muted-foreground">
                            {log.details.location.latitude}
                          </div>
                          <div className="font-mono text-muted-foreground">
                            {log.details.location.longitude}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No location</div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div className="text-sm">
                        <div className="font-medium text-foreground">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <button
                      onClick={() => onViewDetails?.(log)}
                      className="p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors group"
                      title="View Full Details"
                    >
                      <Eye className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {currentLogs.map((log) => {
          const actionBadge = getActionBadge(log.action);
          
          return (
            <div key={log._id} className="bg-card border border-border rounded-lg p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{log.user.name}</div>
                    <div className="text-sm text-muted-foreground">{log.user.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => onViewDetails?.(log)}
                  className="p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Action Badge */}
              <div className="flex items-center gap-2">
                {getActionIcon(log.action)}
                <Badge className={actionBadge.className}>
                  {actionBadge.label}
                </Badge>
              </div>

              {/* Resource Info */}
              <div className="space-y-2">
                <div className="font-medium text-foreground">{log.resourceType}</div>
                <div className="text-sm text-muted-foreground font-mono">ID: {log.resourceId}</div>
                {log.details.tagId && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Tag className="w-3 h-3" />
                    <span className="font-mono">{log.details.tagId}</span>
                  </div>
                )}
              </div>

              {/* Asset Details */}
              {log.details.assetType && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-foreground">{log.details.assetType}</div>
                      {log.details.subcategory && (
                        <div className="text-xs text-muted-foreground">{log.details.subcategory}</div>
                      )}
                    </div>
                  </div>
                  
                  {log.details.brand && (
                    <div className="text-sm text-muted-foreground">
                      Brand: <span className="font-medium text-foreground">{log.details.brand}</span>
                    </div>
                  )}
                  
                  {log.details.capacity && (
                    <div className="text-sm text-muted-foreground">
                      Capacity: <span className="font-medium text-foreground">{log.details.capacity}</span>
                    </div>
                  )}
                  
                  {log.details.projectName && (
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      {log.details.projectName}
                    </div>
                  )}
                </div>
              )}

              {/* Location */}
              {log.details.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm">
                    <div className="font-mono text-muted-foreground">
                      {log.details.location.latitude}
                    </div>
                    <div className="font-mono text-muted-foreground">
                      {log.details.location.longitude}
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div className="text-sm">
                  <div className="font-medium text-foreground">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {startIndex + 1} to {Math.min(endIndex, logs.length)} of {logs.length} logs
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(totalPages - 2, currentPage - 1)) + i;
                if (page > totalPages) return null;
                
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};