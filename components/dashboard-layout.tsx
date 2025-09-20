
"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "./ui/button"
import {
  Menu,
  X,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Home,
  BarChart2,
  LogOut,
  ChevronDown,
  Bell,
  User,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "./ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

interface NavItemType {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isProductsOpen, setIsProductsOpen] = React.useState(false)
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()

  const navItems = React.useMemo<NavItemType[]>(
    () => [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Menu", href: "/dashboard/menu", icon: Sparkles },
      { name: "POS", href: "/pos", icon: ShoppingCart },
      { name: "Managers", href: "/dashboard/managers", icon: Users },
      { name: "Orders", href: "/dashboard/orders", icon: Package },
      { name: "Customers", href: "/dashboard/customers", icon: User },
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
    []
  )

  const productItems = [
    { name: "All Products", href: "/dashboard/products" },
    { name: "Categories", href: "/dashboard/products/categories" },
    { name: "Inventory", href: "/dashboard/products/inventory" },
    // { name: "Add New", href: "/dashboard/products/new" },
  ]

  const menuItems = [
    { name: "All Menu Items", href: "/dashboard/menu/items" },
    { name: "Categories", href: "/dashboard/menu/categories" },
    { name: "Modifiers", href: "/dashboard/menu/modifiers" },
    // { name: "Add New Item", href: "/dashboard/menu/new" },
  ]

  const renderNavItems = React.useCallback(
    () => (
      <nav className="flex flex-col space-y-1 px-2 lg:px-0 lg:space-y-2">
        {navItems.map((item, index) => (
          <div
            key={item.name}
            style={{ animationDelay: `${index * 100}ms` }}
            className="animate-slide-up"
          >
            {item.name === "Products" || item.name === "Menu" ? (
              <div className="space-y-1">
                <button
                  onClick={() =>
                    item.name === "Menu"
                      ? setIsMenuOpen(!isMenuOpen)
                      : setIsOpen(!isOpen)
                  }
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md transition-all duration-300 group",
                    pathname.startsWith(`/dashboard/${item.name.toLowerCase()}`)
                      ? "bg-black text-white shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:text-sidebar-foreground lg:hover:bg-black lg:hover:text-white"
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                    {item.name}
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      (item.name === "Products" ? isProductsOpen : isMenuOpen) &&
                        "rotate-180"
                    )}
                  />
                </button>

                {(item.name === "Products" ? isProductsOpen : isMenuOpen) && (
                  <div className="ml-8 mt-1 space-y-1">
                    {(item.name === "Products" ? productItems : menuItems).map(
                      (subItem) => (
                        <SheetClose asChild key={subItem.href}>
                        <Link
                          href={subItem.href}
                          className={cn(
                            "block px-4 py-2 text-sm rounded-md transition-colors",
                            pathname === subItem.href
                              ? "bg-black text-white shadow-lg shadow-primary/25"
                              : "text-muted-foreground hover:bg-black hover:text-white"
                          )}
                        >
                          {subItem.name}
                        </Link>
                        </SheetClose>
                      )
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all duration-300 group hover-lift",
                  pathname === item.href
                    ? "bg-black text-white shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-black hover:text-white lg:text-sidebar-foreground lg:hover:bg-black lg:hover:text-white"
                )}
              >
                <item.icon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                {item.name}
              </Link>
            )}
          </div>
        ))}
      </nav>
    ),
    [navItems, pathname, isProductsOpen, isMenuOpen]
  )

  // --- MOBILE LAYOUT ---
  if (isMobile) {
    return (
      <div className="flex h-screen flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center space-x-2">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="flex h-full flex-col">
                  <div className="flex h-16 items-center justify-between px-6">
                    <span className="text-lg font-semibold">Admin Panel</span>
                    {/* <SheetClose asChild>
                      <Button variant="ghost" size="icon">
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close menu</span>
                      </Button>
                    </SheetClose> */}
                  </div>
                  <div className="flex-1 overflow-y-auto py-4">
                    {renderNavItems()}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-lg text-card-foreground font-semibold">
              Admin Panel
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/01.png" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => router.push("/")}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    )
  }

  // --- DESKTOP LAYOUT ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border/50 shadow-xl">
          <div className="flex h-16 items-center px-6 border-b border-sidebar-border/50 ">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sidebar-menu animate-pulse">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-sidebar-menu">Admin Panel</h2>
            </div>
          </div>
          <div className="flex-1 p-4">{renderNavItems()}</div>
        </div>
      </div>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden hover:bg-primary/10 hover:text-primary transition-all duration-300"
            onClick={() => setIsOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>

          {/* Spacer */}
          <div className="flex flex-1" />

          {/* Right side: notifications + avatar */}
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-110"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></span>
              <span className="sr-only">View notifications</span>
            </Button>

            {/* Divider */}
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border/50" />

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/avatars/01.png" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => router.push("/")}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}