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
  FileSpreadsheet
} from 'lucide-react';

interface MaintenanceLog {
  id: string;
  assetId: string;
  assetName: string;
  maintenanceType: string;
  description: string;
  technicianId: string;
  technicianName: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  cost?: number;
}

export default function MaintenanceLogsPage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Mock data for demonstration
  useEffect(() => {
    const mockLogs: MaintenanceLog[] = [
      {
        id: '1',
        assetId: 'ASSET001',
        assetName: 'Dell OptiPlex 7090',
        maintenanceType: 'Preventive',
        description: 'Regular system maintenance and cleaning',
        technicianId: 'tech1',
        technicianName: 'John Smith',
        scheduledDate: '2024-01-15T10:00:00Z',
        completedDate: '2024-01-15T12:30:00Z',
        status: 'completed',
        priority: 'medium',
        location: 'IT Department - 2nd Floor',
        cost: 150
      },
      {
        id: '2',
        assetId: 'ASSET002',
        assetName: 'HP LaserJet Pro',
        maintenanceType: 'Corrective',
        description: 'Paper jam resolved and printer cleaned',
        technicianId: 'tech2',
        technicianName: 'Sarah Johnson',
        scheduledDate: '2024-01-16T14:00:00Z',
        status: 'in-progress',
        priority: 'high',
        location: 'Admin Office',
        cost: 75
      },
      {
        id: '3',
        assetId: 'ASSET003',
        assetName: 'Cisco Switch',
        maintenanceType: 'Preventive',
        description: 'Network equipment inspection and firmware update',
        technicianId: 'tech3',
        technicianName: 'Mike Wilson',
        scheduledDate: '2024-01-20T09:00:00Z',
        status: 'scheduled',
        priority: 'low',
        location: 'Server Room',
        cost: 200
      },
      {
        id: '4',
        assetId: 'ASSET004',
        assetName: 'Security Camera',
        maintenanceType: 'Emergency',
        description: 'Camera malfunction - lens replacement required',
        technicianId: 'tech1',
        technicianName: 'John Smith',
        scheduledDate: '2024-01-14T16:00:00Z',
        status: 'overdue',
        priority: 'critical',
        location: 'Parking Lot',
        cost: 300
      }
    ];

    setTimeout(() => {
      setLogs(mockLogs);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.technicianName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || log.priority === filterPriority;
    const matchesType = filterType === 'all' || log.maintenanceType === filterType;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      'in-progress': { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      overdue: { color: 'bg-red-100 text-red-800', label: 'Overdue' },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' }
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
      default:
        return <Calendar className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const downloadPDF = () => {
    console.log('Downloading maintenance logs PDF...');
    alert('PDF export functionality will be implemented with jsPDF library');
  };

  const downloadExcel = () => {
    console.log('Downloading maintenance logs Excel...');
    alert('Excel export functionality will be implemented with xlsx library');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterType('all');
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
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Error Display */}
          <ErrorDisplay 
            error={error} 
            onClearError={() => setError(null)} 
          />

          {/* Header */}
          <PageHeader
            title="Maintenance Logs"
            description="Track maintenance activities, schedules, and technician assignments"
            actionText="Export Logs"
            onAction={() => console.log('Export logs')}
            icon={<Wrench className="w-6 h-6" />}
            actionIcon={<Download className="w-4 h-4" />}
          />

          {/* Download Buttons */}
          <div className="mb-6 flex gap-3">
            <Button 
              onClick={downloadPDF}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Download PDF
            </Button>
            <Button 
              onClick={downloadExcel}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Excel
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search assets, technicians..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
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

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
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

                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={handleClearFilters}
                >
                  <Filter className="w-4 h-4" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          {filteredLogs.length === 0 ? (
            <EmptyState
              title="No maintenance logs found"
              description="No maintenance logs match your current filters"
              actionText="Clear Filters"
              onAction={handleClearFilters}
              icon={<Wrench className="w-12 h-12 text-gray-400" />}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Maintenance Activities</span>
                  <span className="text-sm font-normal text-gray-500">
                    {filteredLogs.length} of {logs.length} logs
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Maintenance Type</TableHead>
                        <TableHead>Technician</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Scheduled Date</TableHead>
                        <TableHead>Completed Date</TableHead>
                        <TableHead>Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.assetName}</div>
                              <div className="text-sm text-gray-500">{log.assetId}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.maintenanceType}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>{log.technicianName}</span>
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
                              <span className="text-sm">{formatDateTime(log.scheduledDate)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.completedDate ? (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{formatDateTime(log.completedDate)}</span>
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