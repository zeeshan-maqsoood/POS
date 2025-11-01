'use client';

import { useState, useEffect } from 'react';
import { Printer, FileText, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import printerApi, { PrintJob as PrintJobType } from '@/lib/printer-api';

// Extend the PrintJob type from the API to match our UI needs
interface PrintJob extends Omit<PrintJobType, 'printerId' | 'type' | 'metadata'> {
  jobType: string; // Alias for type
  referenceId?: string; // For displaying order/reference IDs
  printer: {
    id: string;
    name: string;
    branch: {
      name: string;
    };
  };
  // Add any additional fields needed for the UI
  errorMessage?: string;
}

export default function PrintJobsPage() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    jobType: '',
    branchId: '',
  });

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      const params = {
        status: filters.status || undefined,
        type: filters.jobType || undefined,
        branchId: filters.branchId || undefined
      };

      const response = await printerApi.getPrintQueue(params);
      if (response.success) {
        // Map the API response to match our UI needs
        const mappedJobs = response.data.map(job => ({
          ...job,
          jobType: job.type,
          referenceId: job.metadata?.orderId || job.metadata?.referenceId,
          errorMessage: job.errorMessage,
          printer: {
            id: job.printerId,
            name: 'Printer ' + job.printerId.slice(0, 6),
            branch: {
              name: 'Main Branch' // This would come from the API in a real app
            }
          }
        } as PrintJob));
        setJobs(mappedJobs);
      }
    } catch (error) {
      console.error('Error fetching print jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      // Find the job to get its printer ID
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;

      // Retry failed jobs for this printer
      const response = await printerApi.retryFailedJobs(job.printer.id);
      if (response.success) {
        // Refresh the jobs list after a short delay to allow for processing
        setTimeout(fetchJobs, 1000);
      }
    } catch (error) {
      console.error('Error retrying job:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'PROCESSING':
      case 'PRINTING': 
        return 'bg-blue-100 text-blue-800';
      case 'RETRY':
        return 'bg-purple-100 text-purple-800';
      default: 
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': 
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDING': 
        return <Clock className="h-4 w-4" />;
      case 'FAILED': 
        return <XCircle className="h-4 w-4" />;
      case 'PROCESSING':
      case 'PRINTING':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'RETRY':
        return <RefreshCw className="h-4 w-4 text-purple-600" />;
      default: 
        return <Clock className="h-4 w-4" />;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Print Jobs</h1>
        <p className="text-gray-600 mt-2">Monitor and manage print jobs</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PRINTING">Printing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
            <select
              value={filters.jobType}
              onChange={(e) => setFilters(prev => ({ ...prev, jobType: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="RECEIPT">Receipt</option>
              <option value="KITCHEN">Kitchen</option>
              <option value="REPORT">Report</option>
              <option value="TEST">Test</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <select
              value={filters.branchId}
              onChange={(e) => setFilters(prev => ({ ...prev, branchId: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Branches</option>
              <option value="branch1">Main Branch</option>
              <option value="branch2">Downtown Branch</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Printer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {job.jobType}
                      </div>
                      {job.referenceId && (
                        <div className="text-sm text-gray-500">
                          Ref: {job.referenceId}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{job.printer.name}</div>
                  <div className="text-sm text-gray-500">{job.printer.branch.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(job.status)}
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  {job.errorMessage && (
                    <div className="text-sm text-red-600 mt-1">
                      {job.errorMessage}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(job.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {job.status === 'FAILED' && (
                    <button
                      onClick={() => handleRetryJob(job.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No print jobs</h3>
            <p className="mt-1 text-sm text-gray-500">Print jobs will appear here when created.</p>
          </div>
        )}
      </div>
    </div>
  );
}