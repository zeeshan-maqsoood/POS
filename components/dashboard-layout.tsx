"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { authApi } from "@/lib/auth-api"
import { usePermissions } from "@/hooks/use-permissions"
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
  Warehouse,
  Building,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "./ui/sheet"
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
  const [isInventoryOpen, setIsInventoryOpen] = React.useState(false)
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)

  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()

  // refs for custom user menu
  const userMenuRef = React.useRef<HTMLDivElement | null>(null)
  const userTriggerRef = React.useRef<HTMLButtonElement | null>(null)

  // close on outside click / Escape
  React.useEffect(() => {
    function handleDocClick(e: MouseEvent | TouchEvent) {
      const target = e.target as Node
      if (
        userMenuOpen &&
        userMenuRef.current &&
        userTriggerRef.current &&
        !userMenuRef.current.contains(target) &&
        !userTriggerRef.current.contains(target)
      ) {
        setUserMenuOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && userMenuOpen) setUserMenuOpen(false)
    }

    document.addEventListener("mousedown", handleDocClick)
    document.addEventListener("touchstart", handleDocClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleDocClick)
      document.removeEventListener("touchstart", handleDocClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [userMenuOpen])

  const { isAdmin, isManager } = usePermissions()

  const navItems = React.useMemo<NavItemType[]>(
    () => {
      const baseItems = [
        { name: "Dashboard", href: "/dashboard", icon: Home },
        { name: "Menu", href: "/dashboard/menu", icon: Sparkles },
        { name: "POS", href: "/pos", icon: ShoppingCart },
        { name: "Orders", href: "/dashboard/orders", icon: Package },
      ]

      // Add admin-only items
      if (isAdmin) {
        return [
          ...baseItems,
          { name: "Managers", href: "/dashboard/managers", icon: Users },
          { name: "Branches", href: "/dashboard/branches", icon: Building },
          { name: "Restaurants", href: "/dashboard/restaurants", icon: Building2 },
          { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
          { name: "Reports", href: "/dashboard/reports", icon: BarChart2 },
          { name: "Inventory", href: "/dashboard/Inventory", icon: Warehouse },
        ]
      }

      // Manager-specific items
      if (isManager) {
        return [
          ...baseItems,
          // Add any manager-specific items here if needed
        ]
      }

      return baseItems
    },
    [isAdmin, isManager]
  )

  const productItems = [
    { name: "All Products", href: "/dashboard/products" },
    { name: "Categories", href: "/dashboard/products/categories" },
    { name: "Inventory", href: "/dashboard/products/inventory" },
  ]

  const menuItemsData = [
    { name: "All Menu Items", href: "/dashboard/menu/items" },
    { name: "Categories", href: "/dashboard/menu/categories" },
    { name: "Modifiers", href: "/dashboard/menu/modifiers" },
  ]

  const inventoryItems = [
    { name: "All Inventory Items", href: "/dashboard/Inventory" },
    { name: "Categories", href: "/dashboard/Inventory/categories" },
    {name:"Suppliers",href:"/dashboard/Inventory/suppliers"}

  ]

  const handleLogout = async (router: any, setUserMenuOpen: any) => {
    try {
      // Call the logout API
      await authApi.logout();

      // Clear client-side state
      if (typeof window !== 'undefined') {
        // Clear all cookies by setting them to expire in the past
        document.cookie = "token=; Max-Age=0; path=/";
        document.cookie = `token=; Max-Age=0; path=/; domain=${window.location.hostname}`;

        // Clear local storage
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Clear session storage
        sessionStorage.clear();
      }

      // Close the user menu
      setUserMenuOpen(false);

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/");
        // Force a full page reload to ensure all state is cleared
        window.location.href = "/";
      }, 100);

    } catch (error) {
      console.error('Logout failed:', error);
      // Even if the API call fails, still clear local state and redirect
      if (typeof window !== 'undefined') {
        document.cookie = "token=; Max-Age=0; path=/";
        document.cookie = `token=; Max-Age=0; path=/; domain=${window.location.hostname}`;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.clear();
        window.location.href = "/";
      }
    }
  };

  const renderNavItems = React.useCallback(
    () => (
      <nav className="flex flex-col space-y-1 px-2 lg:px-0 lg:space-y-2">
        {navItems.map((item, index) => (
          <div
            key={item.name}
            style={{ animationDelay: `${index * 100}ms` }}
            className="animate-slide-up"
          >
            {item.name === "Products" || item.name === "Menu" || item.name === "Inventory" ? (
              <div className="space-y-1">
                <button
                  onClick={() => {
                    if (item.name === "Menu") {
                      setIsMenuOpen(!isMenuOpen)
                      setIsProductsOpen(false)
                      setIsInventoryOpen(false)
                    } else if (item.name === "Products") {
                      setIsProductsOpen(!isProductsOpen)
                      setIsMenuOpen(false)
                      setIsInventoryOpen(false)
                    } else if (item.name === "Inventory") {
                      setIsInventoryOpen(!isInventoryOpen)
                      setIsMenuOpen(false)
                      setIsProductsOpen(false)
                    }
                  }}
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
                      (item.name === "Products" ? isProductsOpen :
                       item.name === "Menu" ? isMenuOpen :
                       isInventoryOpen) && "rotate-180"
                    )}
                  />
                </button>

                {(item.name === "Products" ? isProductsOpen :
                  item.name === "Menu" ? isMenuOpen :
                  isInventoryOpen) && (
                  <div className="ml-8 mt-1 space-y-1">
                    {(item.name === "Products" ? productItems :
                      item.name === "Menu" ? menuItemsData :
                      inventoryItems).map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "block px-4 py-2 text-sm rounded-md transition-colors",
                          pathname === subItem.href
                            ? "bg-black text-white shadow-lg shadow-primary/25"
                            : "text-muted-foreground hover:bg-black hover:text-white"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        {subItem.name}
                      </Link>
                    ))}
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
    [navItems, pathname, isProductsOpen, isMenuOpen, isInventoryOpen]
  )

  // --- MOBILE LAYOUT ---
  if (isMobile) {
    return (
      <div className="flex h-screen flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 overflow-visible">
          <div className="flex items-center space-x-2">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="flex h-full flex-col">
                  <div className="flex h-16 items-center px-6">
                    <span className="text-lg font-semibold">Admin Panel</span>
                  </div>
                  <div className="flex-1 overflow-y-auto py-4 pr-2 custom-scrollbar">
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
            {/* notifications */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="relative hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-110"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></span>
                <span className="sr-only">View notifications</span>
              </Button>
            </div>

            {/* Custom user menu (mobile) */}
            <div className="relative">
              <button
                ref={userTriggerRef}
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                className="p-0 rounded-full"
                type="button"
              >
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarImage src="/avatars/01.png" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </button>

              {userMenuOpen && (
                <div
                  ref={userMenuRef}
                  role="menu"
                  aria-label="User menu"
                  className="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-50"
                >
                  <div className="py-1">
                    {/* <button
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false)
                        router.push("/dashboard/profile")
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </button>

                    <button
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false)
                        router.push("/dashboard/settings")
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button> */}

                    <div className="my-1 border-t" />

                    <button
                      role="menuitem"
                      onClick={() => handleLogout(router, setUserMenuOpen)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    )
  }

  // --- DESKTOP LAYOUT ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border/50 shadow-xl">
          <div className="flex h-16 items-center px-6 border-b border-sidebar-border/50 ">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sidebar-menu animate-pulse">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-sidebar-menu">Admin Panel</h2>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-4rem)] custom-scrollbar">{renderNavItems()}</div>
        </div>
      </div>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 overflow-visible">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden hover:bg-primary/10 hover:text-primary transition-all duration-300"
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

            {/* Custom user menu (desktop) */}
            <div className="relative">
              <button
                ref={userTriggerRef}
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                className="p-0 rounded-full"
                type="button"
              >
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarImage src="/avatars/01.png" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </button>

              {userMenuOpen && (
                <div
                  ref={userMenuRef}
                  role="menu"
                  aria-label="User menu"
                  className="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-50"
                >
                  <div className="">
                    {/* <button
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false)
                        router.push("/dashboard/profile")
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </button>

                    <button
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false)
                        router.push("/dashboard/settings")
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button> */}

                    <div className="my-1 border-t" />

                    <button
                      role="menuitem"
                      onClick={()=>handleLogout(router,setUserMenuOpen)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}