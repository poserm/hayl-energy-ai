'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setIsVisible(true)
    
    // Redirect to dashboard if user is already authenticated
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src="/background.png"
          alt="Clean energy background"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/90 via-white/95 to-secondary-50/90"></div>
      </div>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-bounce-gentle"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Image
                src="/logo.png"
                alt="Hayl Energy AI Logo"
                width={40}
                height={40}
                className="rounded-lg shadow-md"
              />
              <span className="text-2xl font-bold text-gradient">Hayl Energy AI</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-neutral-600 hover:text-primary-600 transition-colors duration-200 font-medium">
                Features
              </Link>
              <Link href="#about" className="text-neutral-600 hover:text-primary-600 transition-colors duration-200 font-medium">
                About
              </Link>
              <Link href="#contact" className="text-neutral-600 hover:text-primary-600 transition-colors duration-200 font-medium">
                Contact
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" size="md" className="hidden sm:inline-flex">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="md" className="bg-gradient-brand hover:opacity-90 shadow-brand text-white font-semibold">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-neutral-900 mb-8 leading-tight">
                  Revolutionize Your{' '}
                  <span className="text-gradient">Clean Energy</span>{' '}
                  Operations
                </h1>
                <p className="text-xl lg:text-2xl text-neutral-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                  Harness the power of AI to optimize renewable energy projects, accelerate development timelines, 
                  and maximize ROI in the clean energy transition.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <Link href="/signup">
                  <Button size="xl" className="bg-gradient-brand hover:opacity-90 shadow-brand text-white font-semibold text-lg px-8 py-4">
                    Start Free Trial
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                    </svg>
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button variant="outline" size="xl" className="text-lg px-8 py-4 border-2 hover:bg-primary-50">
                    Watch Demo
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M12 7a4 4 0 110 8 4 4 0 010-8z" />
                    </svg>
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className={`grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {[
                  { value: '50+', label: 'Energy Projects Optimized' },
                  { value: '25%', label: 'Average Cost Reduction' },
                  { value: '60%', label: 'Faster Development' },
                  { value: '98%', label: 'Prediction Accuracy' }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl lg:text-4xl font-bold text-gradient mb-2">{stat.value}</div>
                    <div className="text-sm lg:text-base text-neutral-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-3xl lg:text-5xl font-bold text-neutral-900 mb-6">
                Intelligent Energy Solutions
              </h2>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                Our AI-powered platform provides comprehensive tools for every stage of your clean energy projects
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  title: 'Smart Site Selection',
                  description: 'AI-driven analysis of location data, weather patterns, and grid connectivity to identify optimal sites for renewable energy projects.',
                  features: ['Wind & solar resource mapping', 'Grid impact analysis', 'Environmental assessments']
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ),
                  title: 'Performance Analytics',
                  description: 'Real-time monitoring and predictive analytics to maximize energy output and identify optimization opportunities.',
                  features: ['Real-time performance tracking', 'Predictive maintenance alerts', 'ROI optimization']
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  ),
                  title: 'Financial Modeling',
                  description: 'Advanced financial analysis and risk assessment tools to support investment decisions and project financing.',
                  features: ['LCOE calculations', 'Risk analysis', 'Investment portfolio optimization']
                }
              ].map((feature, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group border border-neutral-100">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">{feature.title}</h3>
                  <p className="text-neutral-600 mb-6 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-sm text-neutral-600">
                        <svg className="w-4 h-4 text-secondary-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-r from-primary-600 to-secondary-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Energy Projects?
            </h2>
            <p className="text-xl text-primary-100 mb-12 max-w-2xl mx-auto">
              Join leading energy companies using AI to accelerate the clean energy transition
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="xl" className="bg-white text-primary-600 hover:bg-primary-50 text-lg px-8 py-4 font-semibold shadow-lg">
                  Start Your Free Trial
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="xl" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                  Sign In to Continue
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="Hayl Energy AI Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-xl font-bold">Hayl Energy AI</span>
              </div>
              <p className="text-neutral-400 mb-4 max-w-md">
                Empowering the clean energy transition through intelligent automation and data-driven insights.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-neutral-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#api" className="hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-neutral-400">
                <li><Link href="#about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-8 pt-8 text-center text-neutral-400">
            <p>&copy; 2024 Hayl Energy AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
