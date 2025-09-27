'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { ProtectedRouteWrapper } from '@/components/protected-route-wrapper';
import { UserRole, UserRoleType } from '@/hooks/use-permissions';

export default function DashboardLayoutPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRouteWrapper
      requiredRole={[UserRole.ADMIN as UserRoleType, UserRole.MANAGER as UserRoleType]}
    >
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRouteWrapper>
  );
}