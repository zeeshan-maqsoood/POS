export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  branch?: string; // Add branch property
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}
