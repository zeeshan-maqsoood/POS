


'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { ManagerForm } from '@/components/admin/managers/new-manager-form';
import managerApi, { Manager } from '@/lib/manager-api';

export default function ManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);

  // Load managers on component mount
  useEffect(() => {
    loadManagers();
  }, []);

  const loadManagers = async () => {
    try {
      setLoading(true);
      const response = await managerApi.getManagers();
      setManagers(response.data || []);
    } catch (error: any) {
      console.error('Error loading managers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load managers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManager = async (managerData: any) => {
    try {
      await managerApi.createManager(managerData);
      toast({
        title: 'Success',
        description: 'Manager created successfully with dashboard access',
      });
      setIsCreateDialogOpen(false);
      loadManagers();
    } catch (error: any) {
      console.error('Error creating manager:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create manager',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateManager = async (id: string, managerData: any) => {
    try {
      await managerApi.updateManager(id, managerData);
      toast({
        title: 'Success',
        description: 'Manager updated successfully',
      });
      setEditingManager(null);
      loadManagers();
    } catch (error: any) {
      console.error('Error updating manager:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update manager',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteManager = async (id: string) => {
    if (!confirm('Are you sure you want to delete this manager?')) {
      return;
    }

    try {
      await managerApi.deleteManager(id);
      toast({
        title: 'Success',
        description: 'Manager deleted successfully',
      });
      loadManagers();
    } catch (error: any) {
      console.error('Error deleting manager:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete manager',
        variant: 'destructive',
      });
    }
  };

  const hasDashboardAccess = (permissions: any) => {
    if (Array.isArray(permissions)) {
      // Handle array of permission strings
      if (typeof permissions[0] === 'string') {
        return permissions.includes('DASHBOARD_READ');
      }
      // Handle array of permission objects
      return permissions.some((p: any) => p.permission === 'DASHBOARD_READ');
    }
    if (typeof permissions === 'object' && permissions !== null) {
      return permissions.some((p: any) => p.permission === 'DASHBOARD_READ');
    }
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Managers</h1>
          <p className="text-muted-foreground">
            Manage restaurant managers and their permissions
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Manager
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Manager</DialogTitle>
              <DialogDescription>
                Create a new manager with dashboard access and other permissions
              </DialogDescription>
            </DialogHeader>
            <ManagerForm
              onSubmit={handleCreateManager}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {managers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No managers found</h3>
              <p className="text-gray-500 text-center mb-6">
                Get started by creating your first manager with dashboard access
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Manager
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {managers.map((manager) => (
              <Card key={manager.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {manager.name}
                          </h3>
                          {hasDashboardAccess(manager.permissions) && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Dashboard Access
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{manager.email}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant={manager.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {manager.status}
                          </Badge>
                          <Badge variant="outline">{manager.role}</Badge>
                          {manager.branch && (
                            <span className="text-sm text-gray-500">
                              Branch: {manager.branch.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingManager(manager)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteManager(manager.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Manager Dialog */}
      <Dialog open={!!editingManager} onOpenChange={() => setEditingManager(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Manager</DialogTitle>
            <DialogDescription>
              Update manager information and permissions
            </DialogDescription>
          </DialogHeader>
          {editingManager && (
            <ManagerForm
              initialData={{
                ...editingManager,
                branch: editingManager.branch?.id || '',
                restaurantId: editingManager.branch?.restaurant?.id || '',
                permissions: Array.isArray(editingManager.permissions)
                  ? editingManager.permissions
                  : editingManager.permissions?.map((p: any) => p.permission) || []
              }}
              isEditing={true}
              onSubmit={(data) => handleUpdateManager(editingManager.id, data)}
              onCancel={() => setEditingManager(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

