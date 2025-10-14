// app/dashboard/reports/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Package, 
  Utensils, 
  Building, 
  Users, 
  DollarSign,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

const reportSections = [
  {
    title: 'Sales & Orders',
    description: 'Order performance, payment analytics, and revenue tracking',
    icon: BarChart3,
    href: '/dashboard/reports/sales',
    color: 'bg-blue-50 text-blue-600'
  },
  {
    title: 'Inventory',
    description: 'Stock levels, transactions, and low stock alerts',
    icon: Package,
    href: '/dashboard/reports/inventory',
    color: 'bg-green-50 text-green-600'
  },
  {
    title: 'Menu Performance',
    description: 'Menu item analytics and category performance',
    icon: Utensils,
    href: '/dashboard/reports/menu',
    color: 'bg-purple-50 text-purple-600'
  },
  {
    title: 'Branch Performance',
    description: 'Multi-branch comparison and analytics',
    icon: Building,
    href: '/dashboard/reports/branch',
    color: 'bg-orange-50 text-orange-600'
  },
  {
    title: 'Staff Performance',
    description: 'Staff activity and performance metrics',
    icon: Users,
    href: '/dashboard/reports/staff',
    color: 'bg-red-50 text-red-600'
  },
  {
    title: 'Financial Reports',
    description: 'Revenue analysis and tax reports',
    icon: DollarSign,
    href: '/dashboard/reports/financial',
    color: 'bg-emerald-50 text-emerald-600'
  },
  {
    title:'Time Analytics Reports',
    description:'Time analytics and performance metrics',
    icon:Clock,
    href:'/dashboard/reports/time-analytics',
    color:'bg-indigo-50 text-indigo-600'
  }
];

const dashboardData = {
  today: {
    orders: 24,
    revenue: 1845.50
  },
  week: {
    orders: 156,
    revenue: 12450.75
  },
  alerts: {
    lowStock: 8,
    pendingOrders: 12
  },
  staff: {
    activeToday: 6
  }
};

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive business intelligence and performance metrics
        </p>
      </div>

      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{dashboardData.today.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.today.orders} orders today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{dashboardData.week.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.week.orders} orders this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.alerts.lowStock + dashboardData.alerts.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.alerts.lowStock} low stock, {dashboardData.alerts.pendingOrders} pending orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.staff.activeToday}</div>
            <p className="text-xs text-muted-foreground">
              Staff active today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportSections.map((section) => (
          <Card key={section.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${section.color}`}>
                  <section.icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl">{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={section.href}>
                  View Reports
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}