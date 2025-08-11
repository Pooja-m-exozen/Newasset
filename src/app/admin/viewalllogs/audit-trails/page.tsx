'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { LoadingSpinner } from '../../../../components/ui/loading-spinner';
import { ErrorDisplay } from '../../../../components/ui/error-display';

import { AuditTable } from '../../../../components/ui/audit-table';
import { PDFDownload, ExcelDownload } from '../../../../components/ui/pdf-download';
import { AuditProvider, useAuditContext } from '../../../../contexts/AuditContext';
import { filterAuditLogs, type AuditLog } from '../../../../lib/Report';
import { SuccessToast } from '../../../../components/ui/success-toast';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { 
  Shield,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Activity,
  BarChart3,
  TrendingUp,
  Plus,
  Clock,
  FileText,
  User,
  MapPin,
  Building,
  Edit
} from 'lucide-react';

function AuditTrailsContent() {
  const { logs, loading, error, successMessage, clearError, clearSuccess } = useAuditContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterResourceType, setFilterResourceType] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const filteredLogs = useMemo(() => {
    const filtered = filterAuditLogs(logs, searchTerm, filterAction, filterResourceType);
    
    // Sort logs
    filtered.sort((a, b) => {
      let aValue: unknown = a[sortBy as keyof typeof a];
      let bValue: unknown = b[sortBy as keyof typeof b];
      
      if (sortBy === 'timestamp') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      
      if (sortOrder === 'asc') {
        return (aValue as number) > (bValue as number) ? 1 : -1;
      } else {
        return (aValue as number) < (bValue as number) ? 1 : -1;
      }
    });
    
    return filtered;
  }, [logs, searchTerm, filterAction, filterResourceType, sortBy, sortOrder]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterAction('all');
    setFilterResourceType('all');
    setSortBy('timestamp');
    setSortOrder('desc');
  };



  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedLog(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-background to-muted">
        <div className="flex-1 overflow-auto">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-muted-foreground">Loading audit logs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-muted">
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 sm:px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Audit Trails</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Track system access, changes, and security events</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Error Display */}
          <ErrorDisplay 
            error={error} 
            onClearError={clearError} 
          />

          {/* Success Toast */}
          {successMessage && (
            <SuccessToast
              message={successMessage}
              onClose={clearSuccess}
              duration={4000}
            />
          )}

          {/* Search and Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="w-full max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users, resources, tags..."
                      className="pl-10 h-11 text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 lg:hidden"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-border mt-6">
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="create">Create</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                      <SelectItem value="view">View</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="logout">Logout</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterResourceType} onValueChange={setFilterResourceType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by resource" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Resources</SelectItem>
                      <SelectItem value="Asset">Asset</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="Location">Location</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="timestamp">Timestamp</SelectItem>
                      <SelectItem value="action">Action</SelectItem>
                      <SelectItem value="resourceType">Resource Type</SelectItem>
                      <SelectItem value="user.name">User Name</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-2"
                  >
                    {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats and Export Section */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 p-4 sm:p-6 bg-card/60 backdrop-blur-sm rounded-xl border border-border">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <PDFDownload
                logs={filteredLogs}
                filename="audit-trails-report.pdf"
                onDownload={() => console.log('PDF downloaded')}
              />
              <ExcelDownload
                logs={filteredLogs}
                filename="audit-trails-report.xlsx"
                onDownload={() => console.log('Excel downloaded')}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                {filteredLogs.length} of {logs.length} logs
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {Math.round((filteredLogs.length / logs.length) * 100)}% filtered
              </div>
            </div>
          </div>

          {/* Logs Display */}
          {filteredLogs.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">No audit logs found</h3>
                <p className="text-muted-foreground mb-6 text-lg max-w-md mx-auto">
                  No audit logs match your current filters. Try adjusting your search criteria or clearing the filters.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={handleClearFilters}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Clear Filters
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Log
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">System Audit Logs</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Detailed view of all system activities and security events
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-muted-foreground">
                      {filteredLogs.length} logs
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <AuditTable
                  logs={filteredLogs}
                  onViewDetails={handleViewDetails}
                />
              </CardContent>
            </Card>
          )}

          {/* Audit Log View Modal */}
          <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
            <DialogContent className="max-w-2xl bg-card border-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Audit Log Details
                </DialogTitle>
              </DialogHeader>
              
              {selectedLog && (
                <div className="space-y-6">
                  {/* Log Header */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-card/50 rounded-lg border border-border">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-lg font-bold text-foreground">{selectedLog.user.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedLog.user.email} • {selectedLog.action}
                      </p>
                    </div>
                  </div>

                  {/* Log Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User Information */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <User className="w-4 h-4" />
                        User Information
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg border border-border">
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Name</p>
                            <p className="text-sm text-foreground font-medium">{selectedLog.user.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm text-foreground font-medium">{selectedLog.user.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Information */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Activity className="w-4 h-4" />
                        Action Details
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg border border-border">
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Action</p>
                            <p className="text-sm text-foreground font-medium capitalize">{selectedLog.action}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Resource Type</p>
                            <p className="text-sm text-foreground font-medium">{selectedLog.resourceType}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Asset Details */}
                    {selectedLog.details.assetType && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Building className="w-4 h-4" />
                          Asset Information
                        </div>
                        <div className="p-3 bg-card/50 rounded-lg border border-border">
                          <div className="space-y-2">
                            {selectedLog.details.assetType && (
                              <div>
                                <p className="text-xs text-muted-foreground">Asset Type</p>
                                <p className="text-sm text-foreground font-medium">{selectedLog.details.assetType}</p>
                              </div>
                            )}
                            {selectedLog.details.brand && (
                              <div>
                                <p className="text-xs text-muted-foreground">Brand</p>
                                <p className="text-sm text-foreground font-medium">{selectedLog.details.brand}</p>
                              </div>
                            )}
                            {selectedLog.details.capacity && (
                              <div>
                                <p className="text-xs text-muted-foreground">Capacity</p>
                                <p className="text-sm text-foreground font-medium">{selectedLog.details.capacity}</p>
                              </div>
                            )}
                            {selectedLog.details.tagId && (
                              <div>
                                <p className="text-xs text-muted-foreground">Tag ID</p>
                                <p className="text-sm text-foreground font-medium font-mono">{selectedLog.details.tagId}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Location Information */}
                    {selectedLog.details.location && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          Location
                        </div>
                        <div className="p-3 bg-card/50 rounded-lg border border-border">
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Latitude</p>
                              <p className="text-sm text-foreground font-medium font-mono">{selectedLog.details.location.latitude}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Longitude</p>
                              <p className="text-sm text-foreground font-medium font-mono">{selectedLog.details.location.longitude}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Project Information */}
                    {selectedLog.details.projectName && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <FileText className="w-4 h-4" />
                          Project Details
                        </div>
                        <div className="p-3 bg-card/50 rounded-lg border border-border">
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Project Name</p>
                              <p className="text-sm text-foreground font-medium">{selectedLog.details.projectName}</p>
                            </div>
                            {selectedLog.details.yearOfInstallation && (
                              <div>
                                <p className="text-xs text-muted-foreground">Installation Year</p>
                                <p className="text-sm text-foreground font-medium">{selectedLog.details.yearOfInstallation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Timestamp
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg border border-border">
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Date & Time</p>
                            <p className="text-sm text-foreground font-medium">{formatDate(selectedLog.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={closeViewModal}
                      className="text-foreground border-border hover:bg-accent"
                    >
                      Close
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Log
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

export default function AuditTrailsPage() {
  return (
    <AuditProvider>
      <AuditTrailsContent />
    </AuditProvider>
  );
} 