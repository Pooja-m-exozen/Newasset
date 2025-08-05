'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { LoadingSpinner } from '../../../../components/ui/loading-spinner';
import { ErrorDisplay } from '../../../../components/ui/error-display';
import { EmptyState } from '../../../../components/ui/empty-state';
import { PageHeader } from '../../../../components/ui/page-header';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  Building2,
  User,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  FileSpreadsheet,
  PauseCircle,
  RefreshCw,
  Activity,
  MapPin
} from 'lucide-react';

interface MaintenanceLog {
  _id: string;
  assetId: string;
  assetName: string;
  maintenanceType: string;
  description: string;
  technicianId: string;
  technicianName: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  workStartedAt?: string;
  workStartedBy?: string;
  workPausedAt?: string;
  workCompletedAt?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue' | 'cancelled' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  cost?: number;
  partsUsed: any[];
  attachments: any[];
  __v: number;
}

const API_BASE_URL = 'http://192.168.0.5:5021/api';

export default function MaintenanceLogsPage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleAuthError = (errorMessage: string) => {
    setError(errorMessage);
    // Clear invalid token
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    
    // Redirect to login after a delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 3000);
  };

  const fetchMaintenanceLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get token from localStorage or sessionStorage
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        handleAuthError('Authentication token not found. Please login again.');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/maintenance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError('Authentication failed. Please login again.');
          return;
        } else if (response.status === 403) {
          setError('Access denied. You do not have permission to view maintenance logs.');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      
      // Handle different response structures
      const maintenanceLogs = data.data || data.maintenanceLogs || data.logs || data || [];
      
      if (Array.isArray(maintenanceLogs)) {
        setLogs(maintenanceLogs);
      } else {
        console.error('Unexpected API response structure:', data);
        setError('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching maintenance logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch maintenance logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMaintenanceLogs();
  };

  useEffect(() => {
    // Check for valid authentication token
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      setError('Authentication required. Please login to view maintenance logs.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
    
    fetchMaintenanceLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.assetId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.technicianName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || log.priority === filterPriority;
    const matchesType = filterType === 'all' || log.maintenanceType === filterType;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  }).sort((a, b) => {
    let aValue: any = a[sortBy as keyof typeof a];
    let bValue: any = b[sortBy as keyof typeof b];
    
    if (sortBy === 'date' || sortBy === 'createdAt' || sortBy === 'updatedAt' || 
        sortBy === 'workStartedAt' || sortBy === 'workCompletedAt') {
      aValue = new Date(aValue || 0).getTime();
      bValue = new Date(bValue || 0).getTime();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      'in-progress': { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      overdue: { color: 'bg-red-100 text-red-800', label: 'Overdue' },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' },
      paused: { color: 'bg-purple-100 text-purple-800', label: 'Paused' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800', label: 'Low' },
      medium: { color: 'bg-blue-100 text-blue-800', label: 'Medium' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
      critical: { color: 'bg-red-100 text-red-800', label: 'Critical' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'paused':
        return <PauseCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Calendar className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const downloadPDF = () => {
    try {
      // Create PDF content
      const pdfContent = {
        title: 'Maintenance Logs Report',
        data: filteredLogs.map(log => ({
          'Asset Name': log.assetName || 'N/A',
          'Asset ID': log.assetId || 'N/A',
          'Maintenance Type': log.maintenanceType || 'N/A',
          'Technician': log.technicianName || 'N/A',
          'Status': log.status || 'N/A',
          'Priority': log.priority || 'N/A',
          'Scheduled Date': formatDateTime(log.date),
          'Work Started': log.workStartedAt ? formatDateTime(log.workStartedAt) : 'Not started',
          'Work Completed': log.workCompletedAt ? formatDateTime(log.workCompletedAt) : 'Not completed',
          'Cost': log.cost ? `$${log.cost}` : 'N/A',
          'Location': log.location || 'N/A'
        }))
      };

      // Create and download PDF
      const blob = new Blob([JSON.stringify(pdfContent, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `maintenance-logs-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('PDF download completed');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const downloadExcel = () => {
    try {
      // Create CSV content
      const headers = [
        'Asset Name', 'Asset ID', 'Maintenance Type', 'Technician', 'Status', 
        'Priority', 'Scheduled Date', 'Work Started', 'Work Completed', 'Cost', 'Location'
      ];
      
      const csvContent = [
        headers.join(','),
        ...filteredLogs.map(log => [
          `"${log.assetName || 'N/A'}"`,
          `"${log.assetId || 'N/A'}"`,
          `"${log.maintenanceType || 'N/A'}"`,
          `"${log.technicianName || 'N/A'}"`,
          `"${log.status || 'N/A'}"`,
          `"${log.priority || 'N/A'}"`,
          `"${formatDateTime(log.date)}"`,
          `"${log.workStartedAt ? formatDateTime(log.workStartedAt) : 'Not started'}"`,
          `"${log.workCompletedAt ? formatDateTime(log.workCompletedAt) : 'Not completed'}"`,
          `"${log.cost ? `$${log.cost}` : 'N/A'}"`,
          `"${log.location || 'N/A'}"`
        ].join(','))
      ].join('\n');

      // Create and download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `maintenance-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Excel download completed');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterType('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" text="Loading maintenance logs..." />
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
            onClearError={() => setError(null)} 
          />

          {/* Enhanced Header */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                    <Wrench className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Maintenance Logs</h1>
                    <p className="text-gray-600 mt-1">Track maintenance activities, schedules, and technician assignments</p>
                  </div>
                </div>
                <Button 
                  onClick={handleRefresh}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Download Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <Button 
                onClick={downloadPDF}
                variant="outline"
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:bg-white/90"
              >
                <FileText className="w-4 h-4" />
                Download PDF
              </Button>
              <Button 
                onClick={downloadExcel}
                variant="outline"
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:bg-white/90"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Download Excel
              </Button>
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {filteredLogs.length} of {logs.length} logs
            </div>
          </div>

          {/* Enhanced Filters */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <Search className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <Input
                      placeholder="Search assets, technicians..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                      className="pl-12 bg-white/50 backdrop-blur-sm border-gray-200 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="bg-white/50 backdrop-blur-sm border-gray-200 focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger className="bg-white/50 backdrop-blur-sm border-gray-200 focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Filter by priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="bg-white/50 backdrop-blur-sm border-gray-200 focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Preventive">Preventive</SelectItem>
                        <SelectItem value="Corrective">Corrective</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                        <SelectItem value="Predictive">Predictive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:bg-white/90"
                    onClick={handleClearFilters}
                  >
                    <Filter className="w-4 h-4" />
                    Clear Filters
                  </Button>
                </div>
              </div>

              {/* Sort Options */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-4 items-center">
                  <span className="text-sm font-medium text-gray-600">Sort by:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-white/50 backdrop-blur-sm border-gray-200 focus:ring-2 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Scheduled Date</SelectItem>
                      <SelectItem value="createdAt">Created Date</SelectItem>
                      <SelectItem value="updatedAt">Last Updated</SelectItem>
                      <SelectItem value="workStartedAt">Work Started</SelectItem>
                      <SelectItem value="workCompletedAt">Work Completed</SelectItem>
                      <SelectItem value="assetName">Asset Name</SelectItem>
                      <SelectItem value="technicianName">Technician</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    variant="outline"
                    className="bg-white/50 backdrop-blur-sm border-0 shadow-lg hover:bg-white/90"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                    {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          {filteredLogs.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {logs.length === 0 ? "No maintenance logs available" : "No maintenance logs found"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {logs.length === 0 ? "No maintenance logs are currently available in the system" : "No maintenance logs match your current filters"}
                </p>
                <Button
                  onClick={logs.length === 0 ? handleRefresh : handleClearFilters}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {logs.length === 0 ? "Refresh" : "Clear Filters"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <span className="text-xl font-bold">Maintenance Activities</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {filteredLogs.length} of {logs.length} logs
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100/50"
                          onClick={() => handleSort('assetName')}
                        >
                          Asset
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100/50"
                          onClick={() => handleSort('maintenanceType')}
                        >
                          Maintenance Type
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100/50"
                          onClick={() => handleSort('technicianName')}
                        >
                          Technician
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100/50"
                          onClick={() => handleSort('status')}
                        >
                          Status
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100/50"
                          onClick={() => handleSort('priority')}
                        >
                          Priority
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100/50"
                          onClick={() => handleSort('date')}
                        >
                          Scheduled Date
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100/50"
                          onClick={() => handleSort('workStartedAt')}
                        >
                          Work Started
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100/50"
                          onClick={() => handleSort('workCompletedAt')}
                        >
                          Work Completed
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100/50"
                          onClick={() => handleSort('cost')}
                        >
                          Cost
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log._id} className="hover:bg-gray-50/30">
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.assetName || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{log.assetId || 'N/A'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.maintenanceType || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>{log.technicianName || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(log.status)}
                              {getStatusBadge(log.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(log.priority)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{formatDateTime(log.date)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.workStartedAt ? (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{formatDateTime(log.workStartedAt)}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">Not started</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.workCompletedAt ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-sm">{formatDateTime(log.workCompletedAt)}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">Not completed</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.cost ? (
                              <span className="font-medium">${log.cost}</span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 