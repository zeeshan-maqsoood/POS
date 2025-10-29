'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { ProtectedRouteWrapper } from '@/components/protected-route-wrapper';

export default function ManagersLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRouteWrapper requiredPermission="MANAGER_READ">
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRouteWrapper>
  );
}
