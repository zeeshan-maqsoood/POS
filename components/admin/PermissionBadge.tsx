import { Badge } from '@/components/ui/badge';
import { Permission } from '@/types/prisma';

interface PermissionBadgeProps {
  permission: Permission;
}

export function PermissionBadge({ permission }: PermissionBadgeProps) {
  // Map permission types to badge variants
  const getVariant = (perm: string) => {
    if (perm.startsWith('ADMIN_')) return 'destructive';
    if (perm.startsWith('MANAGER_')) return 'default';
    if (perm.endsWith('_CREATE')) return 'default';
    if (perm.endsWith('_UPDATE')) return 'secondary';
    if (perm.endsWith('_DELETE')) return 'destructive';
    return 'outline';
  };

  // Format permission name for display
  const formatPermission = (perm: string) => {
    return perm
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Badge variant={getVariant(permission)} className="text-xs">
      {formatPermission(permission)}
    </Badge>
  );
}
