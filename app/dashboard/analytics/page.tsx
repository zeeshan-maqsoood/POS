"use client";

import { useState } from 'react';
import { BarChart2, LineChart, PieChart, ShoppingBag, Users, DollarSign, TrendingUp, Download } from 'lucide-react';

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [chartType, setChartType] = useState('bar');

  // Sample data
  const salesData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [12, 19, 3, 5, 2, 3, 15]
  };

  const topProducts = [
    { name: 'Cappuccino', sales: 120 },
    { name: 'Latte', sales: 85 },
    { name: 'Espresso', sales: 65 },
    { name: 'Mocha', sales: 45 },
    { name: 'Tea', sales: 30 },
  ];

  const stats = [
    { name: 'Total Sales', value: '$2,456', change: '+12%', trend: 'up', icon: DollarSign },
    { name: 'Total Orders', value: '1,234', change: '+5%', trend: 'up', icon: ShoppingBag },
    { name: 'New Customers', value: '89', change: '+8%', trend: 'up', icon: Users },
    { name: 'Avg. Order Value', value: '$45.67', change: '+2.5%', trend: 'up', icon: TrendingUp },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500">Track your business performance</p>
        </div>
        <div className="flex space-x-2">
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A3A3A]"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button className="flex items-center space-x-2 bg-[#3A3A3A] text-white px-4 py-2 rounded-md text-sm hover:bg-[#2D2D2D]">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                <div className={`flex items-center mt-2 text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                  <TrendingUp className="h-4 w-4 ml-1" />
                </div>
              </div>
              <div className="p-3 rounded-full bg-gray-50">
                <stat.icon className="h-6 w-6 text-[#3A3A3A]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Sales Overview</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 text-sm rounded-md ${chartType === 'bar' ? 'bg-[#3A3A3A] text-white' : 'bg-gray-100'}`}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 text-sm rounded-md ${chartType === 'line' ? 'bg-[#3A3A3A] text-white' : 'bg-gray-100'}`}
            >
              Line
            </button>
          </div>
        </div>
        
        {/* Chart Placeholder - You can replace this with a real chart library like Recharts or Chart.js */}
        <div className="h-80 bg-gray-50 rounded-md flex items-center justify-center">
          {chartType === 'bar' ? (
            <BarChart2 className="h-16 w-16 text-gray-300" />
          ) : (
            <LineChart className="h-16 w-16 text-gray-300" />
          )}
          <p className="ml-2 text-gray-400">Sales Chart</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Top Selling Products</h2>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 mr-4">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.sales} sales</p>
                </div>
                <div className="text-[#3A3A3A] font-medium">
                  ${(product.sales * 4.5).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <ShoppingBag className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New order #100{item}</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
                <span className="text-sm font-medium text-[#3A3A3A]">${(45 + item * 5).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
