export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  branch?: string; // For backward compatibility
  branchId?: string;
  branchName?: string;
  restaurant?: {
    id: string;
    name: string;
  };
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}
