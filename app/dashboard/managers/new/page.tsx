"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ManagerForm } from "@/components/admin/managers/new-manager-form";

export default function NewManagerPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Manager</h1>
        <p className="text-muted-foreground">
          Add a new manager to your restaurant
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manager Information</CardTitle>
          <CardDescription>
            Enter the manager's details below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManagerForm />
        </CardContent>
      </Card>
    </div>
  );
}
