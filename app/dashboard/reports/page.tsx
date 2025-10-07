// components/reports/PeakHoursReport.tsx
'use client';

import { useState, useMemo } from 'react';
import { 
  Clock, 
  TrendingUp, 
  Download, 
  Filter,
  Calendar,
  Users,
  Zap,
  Coffee,
  UtensilsCrossed,
  BarChart3,
  PieChart
} from 'lucide-react';

interface HourlyData {
  hour: number;
  hourDisplay: string;
  orders: number;
  revenue: number;
  avgOrderValue: number;
  customers: number;
  efficiency: number; // Orders per staff member
  previousPeriodOrders: number;
  growth: number;
}

interface PeakHourInsight {
  type: 'peak' | 'slow' | 'growing' | 'declining';
  hour: string;
  metric: string;
  value: number;
  description: string;
}

export default function PeakHoursReport() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'quarter'>('week');
  const [viewType, setViewType] = useState<'orders' | 'revenue' | 'customers' | 'efficiency'>('orders');
  const [branch, setBranch] = useState('all');
  const [compareWithPrevious, setCompareWithPrevious] = useState(true);

  // Mock data - replace with actual API calls
  const hourlyData: HourlyData[] = useMemo(() => [
    { hour: 6, hourDisplay: '6 AM', orders: 12, revenue: 420, avgOrderValue: 35.00, customers: 15, efficiency: 2.4, previousPeriodOrders: 8, growth: 50 },
    { hour: 7, hourDisplay: '7 AM', orders: 45, revenue: 1575, avgOrderValue: 35.00, customers: 52, efficiency: 9.0, previousPeriodOrders: 38, growth: 18.4 },
    { hour: 8, hourDisplay: '8 AM', orders: 78, revenue: 2730, avgOrderValue: 35.00, customers: 85, efficiency: 15.6, previousPeriodOrders: 65, growth: 20.0 },
    { hour: 9, hourDisplay: '9 AM', orders: 65, revenue: 2275, avgOrderValue: 35.00, customers: 72, efficiency: 13.0, previousPeriodOrders: 58, growth: 12.1 },
    { hour: 10, hourDisplay: '10 AM', orders: 42, revenue: 1470, avgOrderValue: 35.00, customers: 48, efficiency: 8.4, previousPeriodOrders: 45, growth: -6.7 },
    { hour: 11, hourDisplay: '11 AM', orders: 88, revenue: 3520, avgOrderValue: 40.00, customers: 95, efficiency: 17.6, previousPeriodOrders: 72, growth: 22.2 },
    { hour: 12, hourDisplay: '12 PM', orders: 156, revenue: 7020, avgOrderValue: 45.00, customers: 168, efficiency: 31.2, previousPeriodOrders: 142, growth: 9.9 },
    { hour: 13, hourDisplay: '1 PM', orders: 142, revenue: 6390, avgOrderValue: 45.00, customers: 155, efficiency: 28.4, previousPeriodOrders: 135, growth: 5.2 },
    { hour: 14, hourDisplay: '2 PM', orders: 68, revenue: 2720, avgOrderValue: 40.00, customers: 75, efficiency: 13.6, previousPeriodOrders: 72, growth: -5.6 },
    { hour: 15, hourDisplay: '3 PM', orders: 45, revenue: 1575, avgOrderValue: 35.00, customers: 52, efficiency: 9.0, previousPeriodOrders: 48, growth: -6.3 },
    { hour: 16, hourDisplay: '4 PM', orders: 58, revenue: 2320, avgOrderValue: 40.00, customers: 65, efficiency: 11.6, previousPeriodOrders: 52, growth: 11.5 },
    { hour: 17, hourDisplay: '5 PM', orders: 124, revenue: 5580, avgOrderValue: 45.00, customers: 135, efficiency: 24.8, previousPeriodOrders: 115, growth: 7.8 },
    { hour: 18, hourDisplay: '6 PM', orders: 168, revenue: 8400, avgOrderValue: 50.00, customers: 185, efficiency: 33.6, previousPeriodOrders: 155, growth: 8.4 },
    { hour: 19, hourDisplay: '7 PM', orders: 145, revenue: 7250, avgOrderValue: 50.00, customers: 162, efficiency: 29.0, previousPeriodOrders: 138, growth: 5.1 },
    { hour: 20, hourDisplay: '8 PM', orders: 92, revenue: 4600, avgOrderValue: 50.00, customers: 105, efficiency: 18.4, previousPeriodOrders: 98, growth: -6.1 },
    { hour: 21, hourDisplay: '9 PM', orders: 48, revenue: 2160, avgOrderValue: 45.00, customers: 58, efficiency: 9.6, previousPeriodOrders: 52, growth: -7.7 },
    { hour: 22, hourDisplay: '10 PM', orders: 25, revenue: 875, avgOrderValue: 35.00, customers: 32, efficiency: 5.0, previousPeriodOrders: 28, growth: -10.7 },
  ], []);

  // Calculate peak hours and insights
  const { peakHours, insights, summary } = useMemo(() => {
    const maxOrders = Math.max(...hourlyData.map(h => h.orders));
    const maxRevenue = Math.max(...hourlyData.map(h => h.revenue));
    const totalOrders = hourlyData.reduce((sum, h) => sum + h.orders, 0);
    const totalRevenue = hourlyData.reduce((sum, h) => sum + h.revenue, 0);
    
    const peakHours = hourlyData
      .filter(h => h.orders >= maxOrders * 0.8) // Top 20% of hours
      .map(h => ({
        hour: h.hourDisplay,
        orders: h.orders,
        revenue: h.revenue,
        type: h.orders === maxOrders ? 'peak' : 'high'
      }));

    const insights: PeakHourInsight[] = [
      {
        type: 'peak',
        hour: hourlyData.find(h => h.orders === maxOrders)?.hourDisplay || '',
        metric: 'Peak Order Hour',
        value: maxOrders,
        description: `Highest order volume with ${maxOrders} orders`
      },
      {
        type: 'peak',
        hour: hourlyData.find(h => h.revenue === maxRevenue)?.hourDisplay || '',
        metric: 'Peak Revenue Hour',
        value: maxRevenue,
        description: `Highest revenue generation with $${maxRevenue}`
      },
      {
        type: 'growing',
        hour: hourlyData.reduce((prev, current) => 
          (prev.growth > current.growth) ? prev : current
        ).hourDisplay,
        metric: 'Fastest Growth',
        value: Math.max(...hourlyData.map(h => h.growth)),
        description: 'Highest growth compared to previous period'
      },
      {
        type: 'slow',
        hour: hourlyData.find(h => h.orders === Math.min(...hourlyData.map(h => h.orders)))?.hourDisplay || '',
        metric: 'Slowest Hour',
        value: Math.min(...hourlyData.map(h => h.orders)),
        description: 'Lowest order volume period'
      }
    ];

    // Add efficiency insights
    const maxEfficiency = Math.max(...hourlyData.map(h => h.efficiency));
    insights.push({
      type: 'peak',
      hour: hourlyData.find(h => h.efficiency === maxEfficiency)?.hourDisplay || '',
      metric: 'Most Efficient',
      value: maxEfficiency,
      description: 'Highest orders per staff member'
    });

    return {
      peakHours,
      insights,
      summary: {
        totalOrders,
        totalRevenue,
        avgOrdersPerHour: Math.round(totalOrders / hourlyData.length),
        busiestHour: hourlyData.find(h => h.orders === maxOrders)?.hourDisplay || '',
        peakRevenueHour: hourlyData.find(h => h.revenue === maxRevenue)?.hourDisplay || ''
      }
    };
  }, [hourlyData]);

  const getDisplayValue = (hour: HourlyData) => {
    switch (viewType) {
      case 'orders': return hour.orders;
      case 'revenue': return hour.revenue;
      case 'customers': return hour.customers;
      case 'efficiency': return hour.efficiency;
      default: return hour.orders;
    }
  };

  const getDisplayLabel = () => {
    switch (viewType) {
      case 'orders': return 'Orders';
      case 'revenue': return 'Revenue';
      case 'customers': return 'Customers';
      case 'efficiency': return 'Efficiency';
      default: return 'Orders';
    }
  };

  const formatValue = (value: number) => {
    switch (viewType) {
      case 'orders': return value.toString();
      case 'revenue': return `$${value.toLocaleString()}`;
      case 'customers': return value.toString();
      case 'efficiency': return value.toFixed(1);
      default: return value.toString();
    }
  };

  const exportReport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting peak hours report as ${format}`);
    // Implement export logic
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Peak Hours Analysis</h1>
          <p className="text-gray-600">Order patterns, peak hours, and operational efficiency</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => exportReport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button
            onClick={() => exportReport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
          
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Branches</option>
            <option value="main">Main Branch</option>
            <option value="downtown">Downtown</option>
            <option value="uptown">Uptown</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => setViewType('orders')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                viewType === 'orders' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Orders
            </button>
            <button
              onClick={() => setViewType('revenue')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                viewType === 'revenue' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Revenue
            </button>
            <button
              onClick={() => setViewType('customers')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                viewType === 'customers' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="h-4 w-4" />
              Customers
            </button>
            <button
              onClick={() => setViewType('efficiency')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                viewType === 'efficiency' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Zap className="h-4 w-4" />
              Efficiency
            </button>
          </div>

          <label className="flex items-center gap-2 ml-auto">
            <input
              type="checkbox"
              checked={compareWithPrevious}
              onChange={(e) => setCompareWithPrevious(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Compare with previous period</span>
          </label>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Orders"
          value={summary.totalOrders.toString()}
          icon={<BarChart3 className="h-6 w-6" />}
          color="blue"
          subtitle={`${summary.avgOrdersPerHour}/hour avg`}
        />
        <SummaryCard
          title="Total Revenue"
          value={`$${summary.totalRevenue.toLocaleString()}`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="green"
          subtitle="During analyzed period"
        />
        <SummaryCard
          title="Peak Order Hour"
          value={summary.busiestHour}
          icon={<Zap className="h-6 w-6" />}
          color="orange"
          subtitle="Most orders"
        />
        <SummaryCard
          title="Peak Revenue Hour"
          value={summary.peakRevenueHour}
          icon={<Coffee className="h-6 w-6" />}
          color="purple"
          subtitle="Highest revenue"
        />
      </div>

      {/* Main Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {getDisplayLabel()} by Hour
            </h3>
            <div className="text-sm text-gray-500">
              {dateRange === 'today' ? 'Today' : 
               dateRange === 'week' ? 'This Week' :
               dateRange === 'month' ? 'This Month' : 'This Quarter'}
            </div>
          </div>
          
          <HourlyChart 
            data={hourlyData}
            viewType={viewType}
            getDisplayValue={getDisplayValue}
            formatValue={formatValue}
            compareWithPrevious={compareWithPrevious}
          />
        </div>

        {/* Peak Hours & Insights */}
        <div className="space-y-6">
          {/* Peak Hours */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Peak Hours
            </h3>
            <div className="space-y-3">
              {peakHours.map((peak, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      peak.type === 'peak' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{peak.hour}</p>
                      <p className="text-sm text-gray-600">{peak.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${peak.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <InsightCard key={index} insight={insight} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Hourly Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Hourly Performance Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hour
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Order Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Efficiency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hourlyData.map((hour) => (
                <tr key={hour.hour} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {hour.hourDisplay}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {hour.orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${hour.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${hour.avgOrderValue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {hour.customers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {hour.efficiency.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center text-sm ${
                      hour.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className={`h-4 w-4 mr-1 ${
                        hour.growth < 0 && 'rotate-180'
                      }`} />
                      {Math.abs(hour.growth)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`w-16 h-2 rounded-full ${
                      hour.orders >= 100 ? 'bg-green-500' :
                      hour.orders >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Staffing & Operational Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <RecommendationCard
            title="Peak Staffing"
            content="Increase staff during 12 PM - 2 PM and 6 PM - 8 PM"
            type="staffing"
          />
          <RecommendationCard
            title="Inventory Management"
            content="Prepare extra inventory for lunch and dinner rushes"
            type="inventory"
          />
          <RecommendationCard
            title="Promotion Timing"
            content="Run promotions during slow hours (3 PM - 5 PM)"
            type="marketing"
          />
        </div>
      </div>
    </div>
  );
}

// Supporting Components

function SummaryCard({ 
  title, 
  value, 
  icon, 
  color, 
  subtitle 
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  subtitle?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function HourlyChart({ 
  data, 
  viewType, 
  getDisplayValue, 
  formatValue,
  compareWithPrevious 
}: {
  data: HourlyData[];
  viewType: string;
  getDisplayValue: (hour: HourlyData) => number;
  formatValue: (value: number) => string;
  compareWithPrevious: boolean;
}) {
  const maxValue = Math.max(...data.map(h => getDisplayValue(h)));
  
  return (
    <div className="space-y-4">
      {data.map((hour) => {
        const value = getDisplayValue(hour);
        const percentage = (value / maxValue) * 100;
        const isPeak = percentage > 80;
        const isSlow = percentage < 20;
        
        return (
          <div key={hour.hour} className="flex items-center space-x-4">
            <div className="w-16 text-sm font-medium text-gray-900">
              {hour.hourDisplay}
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{formatValue(value)}</span>
                {compareWithPrevious && (
                  <div className={`flex items-center ${
                    hour.growth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className={`h-3 w-3 mr-1 ${
                      hour.growth < 0 && 'rotate-180'
                    }`} />
                    {Math.abs(hour.growth)}%
                  </div>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 relative">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    isPeak ? 'bg-red-500' :
                    isSlow ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                ></div>
                {compareWithPrevious && (
                  <div
                    className="absolute top-0 h-3 bg-gray-400 opacity-30 rounded-full"
                    style={{ width: `${(hour.previousPeriodOrders / maxValue) * 100}%` }}
                  ></div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InsightCard({ insight }: { insight: PeakHourInsight }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'peak': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'slow': return <Coffee className="h-4 w-4 text-blue-500" />;
      case 'growing': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'peak': return 'bg-yellow-50 border-yellow-200';
      case 'slow': return 'bg-blue-50 border-blue-200';
      case 'growing': return 'bg-green-50 border-green-200';
      case 'declining': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getBackgroundColor(insight.type)}`}>
      <div className="flex items-start space-x-3">
        {getIcon(insight.type)}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-gray-900">{insight.metric}</h4>
            <span className="text-sm font-medium text-gray-700">
              {insight.type === 'peak' || insight.type === 'slow' ? insight.hour : 
               typeof insight.value === 'number' ? 
                 (insight.metric.includes('Revenue') ? `$${insight.value.toLocaleString()}` : insight.value)
                 : insight.value}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ 
  title, 
  content, 
  type 
}: {
  title: string;
  content: string;
  type: 'staffing' | 'inventory' | 'marketing';
}) {
  const getIcon = () => {
    switch (type) {
      case 'staffing': return <Users className="h-5 w-5 text-blue-600" />;
      case 'inventory': return <UtensilsCrossed className="h-5 w-5 text-green-600" />;
      case 'marketing': return <TrendingUp className="h-5 w-5 text-purple-600" />;
      default: return <BarChart3 className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'staffing': return 'border-blue-200';
      case 'inventory': return 'border-green-200';
      case 'marketing': return 'border-purple-200';
      default: return 'border-gray-200';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getBorderColor()} bg-white`}>
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-gray-50 rounded-lg">
          {getIcon()}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600 mt-1">{content}</p>
        </div>
      </div>
    </div>
  );
}