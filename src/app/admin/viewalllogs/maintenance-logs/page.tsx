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
  MapPin,
  X,
  ChevronDown,
  ChevronUp
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
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  const handleAuthError = (errorMessage: string) => {
    setError(errorMessage);
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    setTimeout(() => {
      window.location.href = '/login';
    }, 3000);
  };

  const fetchMaintenanceLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
    
    return matchesSearch && matchesStatus && matchesPriority;
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
      scheduled: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Scheduled' },
      'in-progress': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
      overdue: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Overdue' },
      cancelled: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Cancelled' },
      paused: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Paused' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    
    return (
      <Badge className={`${config.color} border font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Low' },
      medium: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Medium' },
      high: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'High' },
      critical: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Critical' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    
    return (
      <Badge className={`${config.color} border font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const downloadExcel = () => {
    try {
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

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `maintenance-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterPriority('all');
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
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Error Display */}
          <ErrorDisplay 
            error={error} 
            onClearError={() => setError(null)} 
          />

          {/* Simple Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Maintenance Logs</h1>
                <p className="text-gray-600">Track and manage maintenance activities</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={downloadExcel}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Simple Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search assets, technicians, or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters Toggle */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                    {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  
                  {(searchTerm || filterStatus !== 'all' || filterPriority !== 'all') && (
                    <Button
                      variant="ghost"
                      onClick={handleClearFilters}
                      size="sm"
                      className="text-gray-500"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredLogs.length} of {logs.length} maintenance logs
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Scheduled Date</SelectItem>
                  <SelectItem value="assetName">Asset Name</SelectItem>
                  <SelectItem value="technicianName">Technician</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Logs Table */}
          {filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {logs.length === 0 ? "No maintenance logs available" : "No logs found"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {logs.length === 0 ? "No maintenance logs are currently available" : "Try adjusting your search or filters"}
                </p>
                <Button
                  onClick={logs.length === 0 ? handleRefresh : handleClearFilters}
                  variant="outline"
                >
                  {logs.length === 0 ? "Refresh" : "Clear Filters"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('assetName')}
                        >
                          Asset
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('maintenanceType')}
                        >
                          Type
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('technicianName')}
                        >
                          Technician
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('status')}
                        >
                          Status
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('priority')}
                        >
                          Priority
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('date')}
                        >
                          Scheduled
                        </TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log._id} className="hover:bg-gray-50">
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
                            {getStatusBadge(log.status)}
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(log.priority)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{formatDate(log.date)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {log.workStartedAt ? (
                                <>
                                  <Clock className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm">Started</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-500">Not started</span>
                                </>
                              )}
                              {log.workCompletedAt && (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <span className="text-sm">Completed</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.cost ? (
                              <span className="font-medium">${log.cost}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
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