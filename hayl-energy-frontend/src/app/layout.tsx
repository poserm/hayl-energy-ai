import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Hayl Energy AI - Virginia Energy Market Intelligence',
  description: 'Comprehensive energy market intelligence platform focused on Virginia utilities, technology trends, and market analysis.',
  keywords: [
    'energy market intelligence',
    'Virginia utilities',
    'Dominion Energy',
    'Appalachian Power',
    'NOVEC',
    'energy analytics',
    'renewable energy',
    'coal retirement',
    'natural gas',
    'nuclear power',
    'solar energy',
    'wind energy',
    'energy storage',
    'Virginia Clean Economy Act'
  ],
  authors: [{ name: 'Hayl Energy AI' }],
  creator: 'Hayl Energy AI',
  publisher: 'Hayl Energy AI',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    siteName: 'Hayl Energy AI',
    title: 'Virginia Energy Market Intelligence Platform',
    description: 'Comprehensive insights into Virginia\'s energy utilities and market trends.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hayl Energy AI - Virginia Energy Market Intelligence',
    description: 'Comprehensive insights into Virginia\'s energy utilities and market trends.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1e40af" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}