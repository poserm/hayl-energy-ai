'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { useAuth } from '@/contexts/AuthContext'
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  DocumentChartBarIcon, 
  Cog6ToothIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const Header: React.FC = () => {
  const { user, logout, loading } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Utilities', href: '/dashboard/utilities', icon: MagnifyingGlassIcon },
    { name: 'Analytics', href: '/analytics', icon: DocumentChartBarIcon },
    { name: 'Compare', href: '/compare', icon: DocumentChartBarIcon },
  ]

  const handleLogout = async () => {
    await logout()
  }

  const isActivePath = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <div className="flex-shrink-0">
                <img
                  className="h-8 w-auto"
                  src="/hayl-logo-new.svg"
                  alt="Hayl Energy AI"
                />
              </div>
              <div className="ml-3 hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">
                  Hayl Energy AI
                </h1>
                <p className="text-xs text-gray-500">
                  Energy Market Intelligence
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors',
                    isActivePath(item.href)
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon className="h-4 w-4 mr-1.5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : user ? (
              <div className="flex items-center space-x-2">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-700">{user.name || user.email}</p>
                  <p className="text-xs text-gray-500">Energy Analyst</p>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center space-x-2 rounded-full bg-white p-2 text-sm text-gray-400 hover:text-gray-600"
                    onClick={handleLogout}
                  >
                    <UserIcon className="h-6 w-6" />
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  icon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
                  className="hidden md:inline-flex"
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors',
                      isActivePath(item.href)
                        ? 'text-primary-700 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
            {user && (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="px-3">
                  <p className="text-base font-medium text-gray-800">{user.name || user.email}</p>
                  <p className="text-sm text-gray-500">Energy Analyst</p>
                </div>
                <div className="mt-3 px-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    icon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
                    className="w-full justify-center"
                  >
                    Sign out
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default Header