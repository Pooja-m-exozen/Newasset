'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAssetContext } from '../../../../../../contexts/AdminAssetContext';

interface PermissionsUIProps {
  permissions: any | null;
  loading: boolean;
  error: string | null;
  onUpdatePermissions: (permissions: any) => Promise<void>;
  onClearError: () => void;
}

// Simple permission structure
const PERMISSION_STRUCTURE = {
  view: { label: 'View', description: 'Can view data' },
  create: { label: 'Create', description: 'Can create items' },
  edit: { label: 'Edit', description: 'Can modify items' },
  delete: { label: 'Delete', description: 'Can remove items' },
  export: { label: 'Export', description: 'Can export data' },
  sync: { label: 'Sync', description: 'Can sync data' }
};

export const PermissionsUI: React.FC<PermissionsUIProps> = ({
  permissions,
  loading,
  error,
  onUpdatePermissions,
  onClearError
}) => {
  const { setPermissions, getCurrentPermissions, state } = useAssetContext();
  const [localPermissions, setLocalPermissions] = useState<any>({
    view: false,
    create: false,
    edit: false,
    delete: false,
    export: false,
    sync: false
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load current permissions only once when component mounts
  const loadCurrentPermissions = useCallback(async () => {
    if (isInitialized) return;
    
    try {
      setIsInitialized(true);
      await getCurrentPermissions('admin');
    } catch (error) {
      console.error('Error loading current permissions:', error);
    }
  }, [getCurrentPermissions, isInitialized]);

  // Initialize permissions on mount
  useEffect(() => {
    loadCurrentPermissions();
  }, [loadCurrentPermissions]);

  // Update local permissions when context state changes
  useEffect(() => {
    if (state.adminPermissions && !isSaving) {
      // Extract basic permissions from the complex structure
      const extractedPermissions = {
        view: state.adminPermissions.view || false,
        create: state.adminPermissions.create || false,
        edit: state.adminPermissions.edit || false,
        delete: state.adminPermissions.delete || false,
        export: state.adminPermissions.export || false,
        sync: state.adminPermissions.sync || false
      };
      
      setLocalPermissions(extractedPermissions);
      setLastUpdated(new Date());
      setHasChanges(false);
    }
  }, [state.adminPermissions, isSaving]);

  // Debug logging to see what's happening
  useEffect(() => {
    console.log('State adminPermissions:', state.adminPermissions);
    console.log('State loading:', state.loading);
    console.log('State error:', state.error);
    console.log('Local permissions:', localPermissions);
  }, [state.adminPermissions, state.loading, state.error, localPermissions]);

  const handlePermissionChange = useCallback((permissionKey: string, value: boolean) => {
    setLocalPermissions((prev: any) => ({
      ...prev,
      [permissionKey]: value
    }));
    setHasChanges(true);
  }, []);

  const handleSelectAll = useCallback((value: boolean) => {
    const allPermissions = Object.keys(PERMISSION_STRUCTURE).reduce((acc, key) => {
      acc[key] = value;
      return acc;
    }, {} as any);
    
    setLocalPermissions(allPermissions);
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await setPermissions('admin', localPermissions);
      setHasChanges(false);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setIsSaving(false);
    }
  }, [setPermissions, localPermissions]);

  const handleReset = useCallback(() => {
    if (state.adminPermissions) {
      const extractedPermissions = {
        view: state.adminPermissions.view || false,
        create: state.adminPermissions.create || false,
        edit: state.adminPermissions.edit || false,
        delete: state.adminPermissions.delete || false,
        export: state.adminPermissions.export || false,
        sync: state.adminPermissions.sync || false
      };
      setLocalPermissions(extractedPermissions);
    }
    setHasChanges(false);
  }, [state.adminPermissions]);

  const getPermissionValue = useCallback((permissionKey: string): boolean => {
    return localPermissions?.[permissionKey] || false;
  }, [localPermissions]);

  const getTotalPermissionsStatus = useCallback(() => {
    if (!localPermissions) return { granted: 0, total: 0 };
    
    const total = Object.keys(PERMISSION_STRUCTURE).length;
    const granted = Object.values(localPermissions).filter(Boolean).length;
    
    return { granted, total };
  }, [localPermissions]);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">🔄 Fetching real-time data from API: /admin/permissions/assets/admin</p>
          <p className="text-sm text-gray-500">Loading permissions...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600">Connection Error</CardTitle>
          <CardDescription>{state.error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={onClearError} variant="outline">
              Retry Connection
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!state.adminPermissions && !state.loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>Unable to load permissions data from the server.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onClearError} variant="outline">
            Refresh Data
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalStatus = getTotalPermissionsStatus();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Simple Header */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Permission Management</h1>
            <p className="text-gray-600 mt-1">Configure system access for admin role</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-gray-600">
                {totalStatus.granted}/{totalStatus.total} Permissions Active
              </span>
              {lastUpdated && (
                <span className="text-gray-500">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button onClick={handleReset} variant="outline" size="sm">
                Reset Changes
              </Button>
            )}
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isSaving}
              size="sm"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Permissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(PERMISSION_STRUCTURE).map(([key, permission]) => (
          <Card 
            key={key} 
            className={`border-2 ${
              getPermissionValue(key)
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`permission-${key}`}
                    checked={getPermissionValue(key)}
                    onCheckedChange={(checked) => 
                      handlePermissionChange(key, checked as boolean)
                    }
                  />
                  <div>
                    <label 
                      htmlFor={`permission-${key}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {permission.label}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      {permission.description}
                    </p>
                  </div>
                </div>
                {getPermissionValue(key) && (
                  <div className="text-green-600 text-sm">✓</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common permission presets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={() => handleSelectAll(true)}
              variant="outline"
              size="sm"
            >
              Select All
            </Button>
            <Button
              onClick={() => handleSelectAll(false)}
              variant="outline"
              size="sm"
            >
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Changes Notification */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="shadow-lg border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-blue-700">
                  You have unsaved changes
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleReset} variant="outline" size="sm">
                    Reset
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} size="sm">
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}; 