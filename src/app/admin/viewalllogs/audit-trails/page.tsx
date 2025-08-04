'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { LoadingSpinner } from '../../../../components/ui/loading-spinner';
import { ErrorDisplay } from '../../../../components/ui/error-display';
import { EmptyState } from '../../../../components/ui/empty-state';
import { PageHeader } from '../../../../components/ui/page-header';
import { AuditTable } from '../../../../components/ui/audit-table';
import { PDFDownload, ExcelDownload } from '../../../../components/ui/pdf-download';
import { AuditProvider, useAuditContext } from '../../../../contexts/AuditContext';
import { filterAuditLogs } from '../../../../lib/Report';
import { SuccessToast } from '../../../../components/ui/success-toast';
import { 
  Shield,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Download,
  Calendar
} from 'lucide-react';

function AuditTrailsContent() {
  const { logs, loading, error, successMessage, clearError, clearSuccess, exportToPDF, exportToExcel } = useAuditContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterResourceType, setFilterResourceType] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredLogs = useMemo(() => {
    let filtered = filterAuditLogs(logs, searchTerm, filterAction, filterResourceType);
    
    // Sort logs
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a];
      let bValue: any = b[sortBy as keyof typeof b];
      
      if (sortBy === 'timestamp') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
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

  const handleViewDetails = (log: any) => {
    console.log('View details for log:', log);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" text="Loading audit logs..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Error Display */}
          <ErrorDisplay 
            error={error} 
            onClearError={clearError} 
          />

          {/* Success Toast */}
          <SuccessToast
            message={successMessage || ''}
            isVisible={!!successMessage}
            onClose={clearSuccess}
            duration={4000}
          />

          {/* Enhanced Header */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Audit Trails</h1>
                    <p className="text-gray-600 mt-1">Track system access, changes, and security events</p>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Enhanced Filter Bar */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <Search className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <input
                      placeholder="Search users, resources, tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <select 
                      value={filterAction} 
                      onChange={(e) => setFilterAction(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    >
                      <option value="all">All Actions</option>
                      <option value="create">Create</option>
                      <option value="update">Update</option>
                      <option value="delete">Delete</option>
                      <option value="view">View</option>
                      <option value="login">Login</option>
                      <option value="logout">Logout</option>
                    </select>

                    <select 
                      value={filterResourceType} 
                      onChange={(e) => setFilterResourceType(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    >
                      <option value="all">All Resources</option>
                      <option value="Asset">Asset</option>
                      <option value="User">User</option>
                      <option value="Location">Location</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>

              {/* Sort Options */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-4 items-center">
                  <span className="text-sm font-medium text-gray-600">Sort by:</span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  >
                    <option value="timestamp">Timestamp</option>
                    <option value="action">Action</option>
                    <option value="resourceType">Resource Type</option>
                    <option value="user.name">User Name</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 flex items-center gap-2"
                  >
                    {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
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
            
            <div className="text-sm text-gray-500">
              Showing {filteredLogs.length} of {logs.length} logs
            </div>
          </div>

          {/* Logs Display */}
          {filteredLogs.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No audit logs found</h3>
                <p className="text-gray-600 mb-4">No audit logs match your current filters</p>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-200"
                >
                  Clear Filters
                </button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <span className="text-xl font-bold">System Audit Logs</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    {filteredLogs.length} of {logs.length} logs
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
        </div>
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