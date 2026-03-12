"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Trophy,
  Award,
  Briefcase,
  Building2,
  Plus,
  Globe,
  Ticket,
} from "lucide-react"
import { signOut } from "@/lib/auth/server-actions"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/brand/Logo"

interface DashboardHeaderProps {
  user: any
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Events', href: '/dashboard/attendee', icon: Ticket },
    { name: 'Analytics', href: '/dashboard/analytics', icon: LayoutDashboard },
    { name: 'Log Activity', href: '/dashboard/activities', icon: Plus },
    { name: 'Volunteer', href: '/dashboard/volunteer', icon: Trophy },
    { name: 'Certificates', href: '/dashboard/certificates', icon: Award },
    { name: 'Jobs', href: '/jobs', icon: Briefcase },
    { name: 'Corporate', href: '/dashboard/corporate', icon: Building2 },
    { name: 'Conferences', href: '/dashboard/conferences', icon: Globe },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <>
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-gray-200">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 mb-6">
            <Link href="/dashboard">
              <Logo size="md" />
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-grow px-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-[#E94C89] transition-colors"
              >
                <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-[#E94C89]" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* User menu */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 w-full group">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.user_metadata?.full_name || user?.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.user_metadata?.role || 'Attendee'}
                  </p>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link href="/dashboard">
            <Logo size="sm" />
          </Link>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-3 py-2 text-base font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-[#E94C89]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-[#E94C89]" />
                  {item.name}
                </Link>
              ))}
              <button
                onClick={() => {
                  handleSignOut()
                  setIsMenuOpen(false)
                }}
                className="w-full group flex items-center px-3 py-2 text-base font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-red-600"
              >
                <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-600" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
