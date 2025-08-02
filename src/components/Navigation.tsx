'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

function NavLink({ href, children, className = '', onClick }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href
  
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        px-4 py-2 rounded-md transition-colors duration-200 font-medium
        ${isActive 
          ? 'bg-blue-600 text-white' 
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
        }
        ${className}
      `}
    >
      {children}
    </Link>
  )
}

interface AuthNavigationProps {
  variant?: 'header' | 'footer' | 'sidebar'
  showLogo?: boolean
  className?: string
}

export function AuthNavigation({ 
  variant = 'header', 
  showLogo = true,
  className = '' 
}: AuthNavigationProps) {
  const { user, logout, loading } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    await logout('/login')
    setIsMenuOpen(false)
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  if (variant === 'header') {
    return (
      <header className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            {showLogo && (
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">H</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Hayl Energy AI</span>
              </Link>
            )}

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {user ? (
                <>
                  <NavLink href="/dashboard">Dashboard</NavLink>
                  <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
                    <span className="text-sm text-gray-600">
                      Welcome, {user.name || user.email.split('@')[0]}
                    </span>
                    <button
                      onClick={handleLogout}
                      disabled={loading}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                    >
                      {loading ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <NavLink href="/login">Sign In</NavLink>
                  <NavLink 
                    href="/signup"
                    className="bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                  >
                    Get Started
                  </NavLink>
                </>
              )}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-2">
                {user ? (
                  <>
                    <NavLink href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      Dashboard
                    </NavLink>
                    <div className="px-4 py-2 border-t border-gray-200 mt-2 pt-2">
                      <p className="text-sm text-gray-600 mb-2">
                        Signed in as {user.name || user.email}
                      </p>
                      <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                      >
                        {loading ? 'Signing out...' : 'Sign Out'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <NavLink href="/login" onClick={() => setIsMenuOpen(false)}>
                      Sign In
                    </NavLink>
                    <NavLink 
                      href="/signup" 
                      onClick={() => setIsMenuOpen(false)}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Get Started
                    </NavLink>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
    )
  }

  if (variant === 'footer') {
    return (
      <footer className={`bg-gray-50 border-t border-gray-200 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">H</span>
              </div>
              <span className="text-gray-900 font-medium">Hayl Energy AI</span>
            </div>
            
            <div className="flex items-center space-x-6">
              {!user && (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-blue-600 text-sm">
                    Sign In
                  </Link>
                  <Link href="/signup" className="text-gray-600 hover:text-blue-600 text-sm">
                    Get Started
                  </Link>
                </>
              )}
              <div className="text-xs text-gray-500">
                © 2024 Hayl Energy AI. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>
    )
  }

  if (variant === 'sidebar') {
    return (
      <nav className={`bg-white shadow-sm border-r border-gray-200 ${className}`}>
        <div className="p-4">
          {/* Logo */}
          {showLogo && (
            <Link href="/" className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">H</span>
              </div>
              <span className="text-lg font-bold text-gray-900">Hayl Energy AI</span>
            </Link>
          )}

          {/* Navigation Links */}
          <div className="flex flex-col space-y-2">
            {user ? (
              <>
                <NavLink href="/dashboard">Dashboard</NavLink>
                <NavLink href="/profile">Profile</NavLink>
                <NavLink href="/settings">Settings</NavLink>
                <div className="border-t border-gray-200 mt-4 pt-4">
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="w-full text-left px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink href="/login">Sign In</NavLink>
                <NavLink href="/signup">Get Started</NavLink>
              </>
            )}
          </div>
        </div>
      </nav>
    )
  }

  return null
}

// Breadcrumb navigation for auth pages
interface BreadcrumbProps {
  items: Array<{
    label: string
    href?: string
    current?: boolean
  }>
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg
                className="h-4 w-4 text-gray-400 mx-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            {item.href && !item.current ? (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-blue-600 transition-colors duration-200"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={item.current ? 'text-blue-600 font-medium' : 'text-gray-900'}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Auth page navigation switcher
interface AuthPageNavProps {
  currentPage: 'login' | 'signup'
}

export function AuthPageNav({ currentPage }: AuthPageNavProps) {
  return (
    <div className="text-center mt-6">
      {currentPage === 'login' ? (
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link 
            href="/signup" 
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
          >
            Create one here
          </Link>
        </p>
      ) : (
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link 
            href="/login" 
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
          >
            Sign in here
          </Link>
        </p>
      )}
    </div>
  )
}

// Quick action buttons for auth pages
export function QuickActions() {
  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <p className="text-center text-sm text-gray-500 mb-4">
        Need help getting started?
      </p>
      <div className="flex justify-center space-x-4">
        <button className="text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors duration-200">
          View Demo
        </button>
        <button className="text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors duration-200">
          Contact Support
        </button>
        <button className="text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors duration-200">
          Documentation
        </button>
      </div>
    </div>
  )
}

export default AuthNavigation