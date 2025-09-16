import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-card-foreground mb-2">Admin Dashboard</h1>
          <p className="text-card-foreground/80">Sign in to access your admin panel</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
