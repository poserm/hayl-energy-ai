'use client'

import React from 'react'
import Layout from '@/components/layout/Layout'
import EnergyMarketDashboard from '@/components/dashboard/EnergyMarketDashboard'
import { withAuth } from '@/contexts/AuthContext'

function DashboardPage() {
  return (
    <Layout>
      <EnergyMarketDashboard region="virginia" />
    </Layout>
  )
}

// Protect the page with authentication
export default withAuth(DashboardPage)