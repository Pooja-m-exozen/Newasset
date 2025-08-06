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
import { Label } from '../../../../components/ui/label';
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
  ChevronUp,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  TrendingUp,
  BarChart3,
  Settings,
  FilterX,
  Mail,
  Shield,
  UserCheck,
  UserPlus,
  EyeOff,
  Eye as EyeIcon,
  Upload,
  Star,
  CheckCircle as CheckCircleIcon,
  AlertCircle,
  Trash2,
  Edit as EditIcon,
  FileDown,
  FileUp,
  Printer,
  Settings2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
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
  location: string | { building?: string; floor?: string; room?: string };
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
  const [showViewLogModal, setShowViewLogModal] = useState(false);
  const [viewingLog, setViewingLog] = useState<MaintenanceLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

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
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium border`}>
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
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium border`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "1 day ago";
    return `${Math.floor(diffInHours / 24)} days ago`;
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
          `"${log.cost ? '$' + log.cost : 'N/A'}"`,
          `"${formatLocation(log.location)}"`
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

  const downloadPDF = () => {
    try {
      // Create a simple HTML table for PDF generation
      const tableHTML = `
        <html>
          <head>
            <title>Maintenance Logs Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .status-scheduled { background-color: #dbeafe; color: #1e40af; }
              .status-in-progress { background-color: #fef3c7; color: #d97706; }
              .status-completed { background-color: #d1fae5; color: #059669; }
              .status-overdue { background-color: #fee2e2; color: #dc2626; }
              .status-cancelled { background-color: #f3f4f6; color: #374151; }
              .status-paused { background-color: #f3e8ff; color: #7c3aed; }
              .priority-low { background-color: #f3f4f6; color: #374151; }
              .priority-medium { background-color: #dbeafe; color: #1e40af; }
              .priority-high { background-color: #fed7aa; color: #ea580c; }
              .priority-critical { background-color: #fee2e2; color: #dc2626; }
            </style>
          </head>
          <body>
            <h1>Maintenance Logs Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Total Records: ${filteredLogs.length}</p>
            <table>
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Asset ID</th>
                  <th>Maintenance Type</th>
                  <th>Technician</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Scheduled Date</th>
                  <th>Cost</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                ${filteredLogs.map(log => `
                  <tr>
                    <td>${log.assetName || 'N/A'}</td>
                    <td>${log.assetId || 'N/A'}</td>
                    <td>${log.maintenanceType || 'N/A'}</td>
                    <td>${log.technicianName || 'N/A'}</td>
                    <td><span class="status-${log.status}">${log.status}</span></td>
                    <td><span class="priority-${log.priority}">${log.priority}</span></td>
                    <td>${formatDateTime(log.date)}</td>
                    <td>${log.cost ? '$' + log.cost : 'N/A'}</td>
                    <td>${formatLocation(log.location)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([tableHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `maintenance-logs-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF file. Please try again.');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterPriority('all');
    setSortBy('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const openViewLogModal = (log: MaintenanceLog) => {
    setViewingLog(log);
    setShowViewLogModal(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const formatLocation = (location: string | { building?: string; floor?: string; room?: string } | undefined) => {
    if (!location) return 'N/A';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      const parts = [
        location.building,
        location.floor,
        location.room
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(' ') : 'N/A';
    }
    return 'N/A';
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check for system preference or stored theme preference
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  if (loading) {
    return (
      <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto">
            <main className="p-6 space-y-6">
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading maintenance logs...</span>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto">
          <main className="p-6 space-y-6">
            {/* Error Display */}
            <ErrorDisplay 
              error={error} 
              onClearError={() => setError(null)} 
            />

            {/* Header Section */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Maintenance Logs</h1>
                <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Comprehensive maintenance tracking and management system</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
                <Button 
                  size="sm"
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Log</span>
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <Card className={`border-0 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 w-full lg:w-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search logs by asset, technician, or description..."
                        className={`pl-10 h-11 text-sm ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} focus:border-blue-500 focus:ring-blue-500`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center space-x-2"
                    >
                      <Filter className="w-4 h-4" />
                      <span>Filter</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={downloadExcel}
                      className="flex items-center space-x-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Excel</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={downloadPDF}
                      className="flex items-center space-x-2"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>PDF</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print</span>
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200 mt-6">
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

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
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
                      variant="outline" 
                      onClick={handleClearFilters}
                      className="flex items-center space-x-2"
                    >
                      <FilterX className="w-4 h-4" />
                      <span>Clear Filters</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Table Section */}
            <Card className={`border-0 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Maintenance Logs</CardTitle>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Showing {currentLogs.length} of {filteredLogs.length} logs (Page {currentPage} of {totalPages})
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={downloadExcel}>
                      <FileSpreadsheet className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadPDF}>
                      <FileDown className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Printer className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                                 {filteredLogs.length === 0 ? (
                   <div className="flex items-center justify-center py-12">
                     <div className="text-center">
                       <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                       <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                         {logs.length === 0 ? "No maintenance logs available" : "No logs found"}
                       </h3>
                       <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                         {logs.length === 0 ? "No maintenance logs are currently available" : "Try adjusting your search or filters"}
                       </p>
                      <Button
                        onClick={logs.length === 0 ? handleRefresh : handleClearFilters}
                        variant="outline"
                      >
                        {logs.length === 0 ? "Refresh" : "Clear Filters"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className={isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}>
                          <TableHead 
                            className={`cursor-pointer font-semibold ${isDarkMode ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
                            onClick={() => handleSort('assetName')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Asset</span>
                              {getSortIcon('assetName')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className={`cursor-pointer font-semibold ${isDarkMode ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
                            onClick={() => handleSort('maintenanceType')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Type</span>
                              {getSortIcon('maintenanceType')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className={`cursor-pointer font-semibold ${isDarkMode ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
                            onClick={() => handleSort('technicianName')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Technician</span>
                              {getSortIcon('technicianName')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className={`cursor-pointer font-semibold ${isDarkMode ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Status</span>
                              {getSortIcon('status')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className={`cursor-pointer font-semibold ${isDarkMode ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
                            onClick={() => handleSort('priority')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Priority</span>
                              {getSortIcon('priority')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className={`cursor-pointer font-semibold ${isDarkMode ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
                            onClick={() => handleSort('date')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Scheduled</span>
                              {getSortIcon('date')}
                            </div>
                          </TableHead>
                          <TableHead className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Progress</TableHead>
                          <TableHead className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Cost</TableHead>
                          <TableHead className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Location</TableHead>
                          <TableHead className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentLogs.map((log) => (
                          <TableRow key={log._id} className={`hover:transition-colors ${isDarkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-200'}`}>
                            <TableCell>
                              <div>
                                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{log.assetName || 'N/A'}</div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{log.assetId || 'N/A'}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-gray-100 text-gray-700'}`}>
                                {log.maintenanceType || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{log.technicianName || 'N/A'}</span>
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
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(log.date)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {log.workStartedAt ? (
                                  <>
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm text-blue-600">Started</span>
                                  </>
                                                                 ) : (
                                   <>
                                     <Clock className="w-4 h-4 text-gray-400" />
                                     <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Not started</span>
                                   </>
                                 )}
                                {log.workCompletedAt && (
                                  <>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-green-600">Completed</span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {log.cost ? (
                                <span className="font-semibold text-green-600">${log.cost}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                                                         <TableCell>
                               <div className="flex items-center gap-2">
                                 <MapPin className="w-4 h-4 text-gray-400" />
                                 <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatLocation(log.location)}</span>
                               </div>
                             </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 hover:bg-blue-50"
                                onClick={() => openViewLogModal(log)}
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                                 {/* Pagination */}
                 {filteredLogs.length > 0 && (
                   <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                     <div className="flex items-center justify-between">
                       <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                         Showing {startIndex + 1} to {Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} results
                       </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <Button 
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className={currentPage === page ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                            >
                              {page}
                            </Button>
                          );
                        })}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {/* View Log Modal */}
      {showViewLogModal && viewingLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Maintenance Log Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowViewLogModal(false);
                  setViewingLog(null);
                }}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-6">
              {/* Log Header */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-2xl">
                  {getInitials(viewingLog.assetName || 'Asset')}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{viewingLog.assetName || 'N/A'}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(viewingLog.status)}
                    {getPriorityBadge(viewingLog.priority)}
                  </div>
                </div>
              </div>

              {/* Log Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Asset ID</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{viewingLog.assetId || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Maintenance Type</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Wrench className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{viewingLog.maintenanceType || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Technician</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{viewingLog.technicianName || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Location</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{formatLocation(viewingLog.location)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusBadge(viewingLog.status)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Priority</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {getPriorityBadge(viewingLog.priority)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Scheduled Date</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{formatDateTime(viewingLog.date)}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Cost</Label>
                    <div className="mt-1">
                      <span className="text-gray-900">
                        {viewingLog.cost ? `$${viewingLog.cost}` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Information */}
              <div className="space-y-4">
                <h5 className="font-semibold text-gray-900">Progress Timeline</h5>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Created: {formatDateTime(viewingLog.createdAt)}</span>
                  </div>
                  {viewingLog.workStartedAt && (
                    <div className="flex items-center space-x-3">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-blue-600">Work Started: {formatDateTime(viewingLog.workStartedAt)}</span>
                    </div>
                  )}
                  {viewingLog.workPausedAt && (
                    <div className="flex items-center space-x-3">
                      <PauseCircle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600">Work Paused: {formatDateTime(viewingLog.workPausedAt)}</span>
                    </div>
                  )}
                  {viewingLog.workCompletedAt && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Work Completed: {formatDateTime(viewingLog.workCompletedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {viewingLog.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Description</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-gray-900">{viewingLog.description}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewLogModal(false);
                    setViewingLog(null);
                  }}
                  className="h-10"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 