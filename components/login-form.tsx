"use client"

import type React from "react"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react"
import authApi, { LoginResponse, type UserRole } from "@/lib/auth-api"

// Inner component that uses useSearchParams
function LoginFormContent() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }
  
    setIsLoading(true)
    setError(null)
  
    try {
      const response = await authApi.login({ email, password })
  
      if (!response.success) {
        throw new Error(response.message || "Login failed")
      }
  
      // Save token + user in localStorage
      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify({
        ...response.data.user,
        token: response.data.token
      }))
  
      // Set auth header for future requests
      const api = (await import('@/utils/api')).default
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
  
      // Determine redirect path based on user role
      let redirectPath = '/dashboard';

      // Force kitchen staff to orders page
      if (response.data.user.role === 'KITCHEN_STAFF') {
        console.log('Kitchen staff detected, redirecting to orders page');
        redirectPath = '/dashboard/orders';
      }
      // Redirect managers with POS_READ permission to POS page
      else if (response.data.user.role === 'MANAGER' && response.data.user.permissions?.includes('POS_READ')) {
        console.log('Manager with POS_READ permission detected, redirecting to POS page');
        redirectPath = '/pos';
      }
      // Redirect admins to dashboard (admins have access to everything)
      else if (response.data.user.role === 'ADMIN') {
        console.log('Admin detected, redirecting to dashboard');
        redirectPath = '/dashboard';
      }
      // For other roles, use the original redirect logic
      else {
        redirectPath = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
        // If trying to access dashboard root, find first accessible page
        if (redirectPath === '/dashboard' || redirectPath.startsWith('/dashboard?')) {
          // Check if user has any permissions that would allow access to the orders page
          const userPermissions = response.data.user.permissions || [];
          if (userPermissions.includes('ORDER_READ')) {
            redirectPath = '/dashboard/orders';
          }
          // Otherwise, let the middleware handle the redirection
          else {
            redirectPath = '/dashboard';
          }
        }
      }
      
      console.log('Redirecting to:', redirectPath);

      // Use Next.js navigation
      router.replace(redirectPath)
    } catch (err: any) {
      console.error("Login error:", err)
      const errorMessage = err.response?.data?.message ||
                           err.message ||
                           "An unexpected error occurred. Please try again."
      setError(errorMessage)
      setPassword("")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-card-foreground">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-input border-border text-foreground"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-card-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-input border-border text-foreground"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Demo credentials: admin@example.com / password
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function LoginForm() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  )
}