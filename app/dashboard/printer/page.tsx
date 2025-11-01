'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Printer, Plus, Edit, Trash2, Play, Pause, Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import printerApi, { Printer as PrinterType, CreatePrinterRequest, UpdatePrinterRequest } from '@/lib/printer-api';
import api from '@/utils/api';

// Reusing Printer type from printer-api

// Extend the Printer type from the API to match our UI needs
interface Printer extends Omit<PrinterType, 'status' | 'branchId' | 'branchName'> {
  status: 'ONLINE' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE';
  branch: {
    id: string;
    name: string;
  };
  description?: string; // Add description to the interface
  printJobs?: Array<{
    id: string;
    status: string;
    jobType: string;
    createdAt: string;
  }>;
}

export default function PrintersPage() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  const { toast } = useToast();
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    error: 0
  });

  useEffect(() => {
    fetchPrinters();
    fetchStats();
  }, []);

  const fetchPrinters = async () => {
    try {
      const response = await printerApi.list();
      if (response.success) {
        // Map the API response to match our extended Printer interface
        const mappedPrinters = response.data.map(printer => ({
          ...printer,
          branch: {
            id: printer.branchId || '',
            name: printer.branchName || 'N/A'
          },
          status: (printer.isActive ? 'ONLINE' : 'OFFLINE') as 'ONLINE' | 'OFFLINE',
          description: printer.description || ''
        } as Printer));
        setPrinters(mappedPrinters);
      }
    } catch (error) {
      console.error('Error fetching printers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await printerApi.getStats();
      if (response.success) {
        setStats({
          total: response.data.totalPrinters,
          online: response.data.activePrinters,
          offline: response.data.totalPrinters - response.data.activePrinters,
          error: response.data.jobs.failed
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreatePrinter = async (printerData: Omit<Printer, 'id' | 'createdAt' | 'updatedAt' | 'branchId' | 'branchName' | 'restaurantId'> & { branchId: string }) => {
    try {
      if (!printerData.branchId) {
        toast({
          title: 'Error',
          description: 'Branch is required',
          variant: 'destructive',
        });
        return;
      }

      // Prepare the request data
      const requestData: CreatePrinterRequest = {
        body: {
          name: printerData.name,
          description: printerData.description || '',
          type: printerData.type,
          connectionType: printerData.connectionType,
          ipAddress: printerData.ipAddress,
          port: printerData.port ? parseInt(printerData.port.toString()) : undefined,
          branchId: printerData.branchId,
          // Set default values for optional fields
          paperSize: 'TWO_INCH',
          characterPerLine: 42,
          autoCut: true,
          openCashDrawer: false,
          printLogo: true
        }
      };
      
      console.log('Sending printer create request:', requestData);
      
      const response = await printerApi.create(requestData);
      if (response.success) {
        setShowCreateModal(false);
        fetchPrinters();
        fetchStats();
        toast({
          title: 'Success',
          description: 'Printer created successfully',
        });
      }
    } catch (error) {
      console.error('Error creating printer:', error);
      toast({
        title: 'Error',
        description: 'Failed to create printer',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (printerId: string, currentStatus: string) => {
    try {
      const isActive = currentStatus === 'ONLINE' || currentStatus === 'MAINTENANCE';
      const response = await printerApi.update(printerId, {
        body: {
          isActive: !isActive,
          status: !isActive ? 'ONLINE' : 'OFFLINE'
        }
      });
      
      if (response.success) {
        fetchPrinters();
        fetchStats();
        toast({
          title: 'Success',
          description: `Printer ${!isActive ? 'enabled' : 'disabled'} successfully`,
        });
      }
    } catch (error) {
      console.error('Error updating printer status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update printer status',
        variant: 'destructive',
      });
    }
  };

  const handleTestPrint = async (printerId: string) => {
    try {
      const response = await fetch(`/api/printers/${printerId}/test`, {
        method: 'POST',
      });
      
      if (response.ok) {
        alert('Test print job sent successfully!');
      }
    } catch (error) {
      console.error('Error sending test print:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-100 text-green-800';
      case 'OFFLINE': return 'bg-gray-100 text-gray-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'KITCHEN': return 'bg-blue-100 text-blue-800';
      case 'RECEIPT': return 'bg-purple-100 text-purple-800';
      case 'BAR': return 'bg-orange-100 text-orange-800';
      case 'LABEL': return 'bg-indigo-100 text-indigo-800';
      case 'REPORT': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Printer Management</h1>
        <p className="text-gray-600 mt-2">Manage all printers across your branches</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Printer className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Printers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Wifi className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Online</p>
              <p className="text-2xl font-bold text-gray-900">{stats.online}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg">
              <WifiOff className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Offline</p>
              <p className="text-2xl font-bold text-gray-900">{stats.offline}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.error}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Printer</span>
          </button>
        </div>

        <div className="flex space-x-2">
          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Branches</option>
            <option value="branch1">Main Branch</option>
            <option value="branch2">Downtown Branch</option>
          </select>
          
          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Types</option>
            <option value="KITCHEN">Kitchen</option>
            <option value="RECEIPT">Receipt</option>
            <option value="BAR">Bar</option>
            <option value="LABEL">Label</option>
            <option value="REPORT">Report</option>
          </select>

          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Status</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
            <option value="ERROR">Error</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Printers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Printer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Branch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Connection
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {printers.map((printer) => (
              <tr key={printer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {printer.name}
                    </div>
                    {printer.description && printer.description.trim() !== '' ? (
                      <div className="text-sm text-gray-500">
                        {printer.description}
                      </div>
                    ) : null}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(printer.type)}`}>
                    {printer.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {printer.branch.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(printer.status)}`}>
                    {printer.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {printer.connectionType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleTestPrint(printer.id)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Test Print"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedPrinter(printer)}
                    className="text-gray-600 hover:text-gray-900"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(printer.id, printer.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE')}
                    className={printer.status === 'ONLINE' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                    title={printer.status === 'ONLINE' ? 'Disable' : 'Enable'}
                  >
                    {printer.status === 'ONLINE' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {printers.length === 0 && (
          <div className="text-center py-12">
            <Printer className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No printers</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new printer.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Printer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreatePrinterModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePrinter}
        />
      )}

      {selectedPrinter && (
        <EditPrinterModal
          printer={selectedPrinter}
          onClose={() => setSelectedPrinter(null)}
          onUpdate={fetchPrinters}
        />
      )}
    </div>
  );
}

// Create Printer Modal Component
function CreatePrinterModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');

  // Fetch branches and restaurants
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch restaurants
        const restaurantsRes = await api.get('/restaurants');
        if (restaurantsRes.data?.data) {
          setRestaurants(restaurantsRes.data.data);
          
          // If there's only one restaurant, select it by default
          if (restaurantsRes.data.data.length === 1) {
            setSelectedRestaurant(restaurantsRes.data.data[0].id);
          }
        }
        
        // Fetch branches
        const branchesRes = await api.get('/branches');
        if (branchesRes.data?.data) {
          setBranches(branchesRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load branches and restaurants',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Filter branches based on selected restaurant
  const filteredBranches = selectedRestaurant 
    ? branches.filter(branch => branch.restaurantId === selectedRestaurant)
    : [];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'RECEIPT' as const,
    connectionType: 'USB' as const,
    branchId: '',
    ipAddress: '',
    port: '',
    devicePath: '',
    paperSize: 'TWO_INCH' as const,
    characterPerLine: 42,
    autoCut: true,
    printLogo: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert port to number if it exists
    const dataToSubmit = {
      ...formData,
      port: formData.port ? parseInt(formData.port) : undefined,
    };
    
    console.log('Submitting printer data:', dataToSubmit);
    onSubmit(dataToSubmit);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Add New Printer</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Restaurant Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Restaurant</label>
                <select
                  value={selectedRestaurant}
                  onChange={(e) => setSelectedRestaurant(e.target.value)}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                >
                  <option value="">Select a restaurant</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Branch</label>
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    <span className="ml-2 text-sm text-gray-500">Loading branches...</span>
                  </div>
                ) : (
                  <select
                    name="branchId"
                    value={formData.branchId}
                    onChange={handleChange}
                    required
                    disabled={!selectedRestaurant || filteredBranches.length === 0}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
                  >
                    <option value="">Select a branch</option>
                    {filteredBranches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                    {filteredBranches.length === 0 && selectedRestaurant && (
                      <option value="" disabled>No branches available for this restaurant</option>
                    )}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="KITCHEN">Kitchen</option>
                  <option value="RECEIPT">Receipt</option>
                  <option value="BAR">Bar</option>
                  <option value="LABEL">Label</option>
                  <option value="REPORT">Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Connection</label>
                <select
                  name="connectionType"
                  value={formData.connectionType}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USB">USB</option>
                  <option value="NETWORK">Network</option>
                  <option value="BLUETOOTH">Bluetooth</option>
                  <option value="SERIAL">Serial</option>
                </select>
              </div>
            </div>

            {formData.connectionType === 'NETWORK' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">IP Address</label>
                  <input
                    type="text"
                    name="ipAddress"
                    value={formData.ipAddress}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Port</label>
                  <input
                    type="number"
                    name="port"
                    value={formData.port}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {formData.connectionType === 'USB' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Device Path</label>
                <input
                  type="text"
                  name="devicePath"
                  value={formData.devicePath}
                  onChange={handleChange}
                  placeholder="/dev/usb/lp0"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Paper Size</label>
                <select
                  name="paperSize"
                  value={formData.paperSize}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="TWO_INCH">2 Inch</option>
                  <option value="THREE_INCH">3 Inch</option>
                  <option value="FOUR_INCH">4 Inch</option>
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Characters per Line</label>
                <input
                  type="number"
                  name="characterPerLine"
                  value={formData.characterPerLine}
                  onChange={handleChange}
                  min="20"
                  max="100"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="autoCut"
                  checked={formData.autoCut}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Auto Cut</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="printLogo"
                  checked={formData.printLogo}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Print Logo</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create Printer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Edit Printer Modal Component
function EditPrinterModal({ printer, onClose, onUpdate }: { printer: Printer; onClose: () => void; onUpdate: () => void }) {
  const [formData, setFormData] = useState({
    name: printer.name,
    description: printer.description || '',
    type: printer.type,
    connectionType: printer.connectionType,
    status: printer.status,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/printers/${printer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error updating printer:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Edit Printer</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="KITCHEN">Kitchen</option>
                  <option value="RECEIPT">Receipt</option>
                  <option value="BAR">Bar</option>
                  <option value="LABEL">Label</option>
                  <option value="REPORT">Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                  <option value="ERROR">Error</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Update Printer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}