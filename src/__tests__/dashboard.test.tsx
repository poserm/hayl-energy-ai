import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import StateSelector from '@/components/ui/StateSelector'
import MetricCard from '@/components/ui/MetricCard'
import EnergyChart from '@/components/ui/EnergyChart'

// Mock useEnergyDashboard hook
jest.mock('@/hooks/useEnergyDashboard', () => ({
  useEnergyDashboard: () => ({
    selectedStates: ['Virginia'],
    updateSelectedStates: jest.fn(),
    dashboardData: {
      utilities: [],
      technologyMix: [],
      statesComparison: null,
      loading: false,
      error: null
    },
    refreshData: jest.fn(),
    getCapacityChartData: () => [],
    getTechnologyChartData: () => [],
    getStateMetrics: () => ({
      totalUtilities: 0,
      totalCapacity: 0,
      totalCustomers: 0,
      avgCapacity: 0,
      selectedStatesCount: 1
    })
  })
}))

describe('Dashboard Components', () => {
  describe('StateSelector', () => {
    it('renders selected states', () => {
      const mockOnChange = jest.fn()
      render(
        <StateSelector 
          selectedStates={['Virginia', 'California']} 
          onStatesChange={mockOnChange}
        />
      )
      
      expect(screen.getByText('Virginia')).toBeInTheDocument()
      expect(screen.getByText('California')).toBeInTheDocument()
      expect(screen.getByText('Selected States (2)')).toBeInTheDocument()
    })

    it('opens dropdown and shows add state option', () => {
      const mockOnChange = jest.fn()
      render(
        <StateSelector 
          selectedStates={[]} 
          onStatesChange={mockOnChange}
        />
      )
      
      const addButton = screen.getByText('Add State')
      fireEvent.click(addButton)
      
      expect(screen.getByPlaceholderText('Search states...')).toBeInTheDocument()
    })

    it('removes states when X is clicked', () => {
      const mockOnChange = jest.fn()
      render(
        <StateSelector 
          selectedStates={['Virginia']} 
          onStatesChange={mockOnChange}
        />
      )
      
      // Find the X button by its icon
      const removeButton = screen.getByRole('button', { 
        hidden: true 
      })
      fireEvent.click(removeButton)
      
      expect(mockOnChange).toHaveBeenCalledWith([])
    })
  })

  describe('MetricCard', () => {
    it('renders metric information correctly', () => {
      const mockIcon = <div data-testid="test-icon">Icon</div>
      
      render(
        <MetricCard
          title="Test Metric"
          value={1234}
          unit="MW"
          icon={mockIcon}
          color="blue"
        />
      )
      
      expect(screen.getByText('Test Metric')).toBeInTheDocument()
      expect(screen.getByText('1.2K')).toBeInTheDocument()
      expect(screen.getByText('MW')).toBeInTheDocument()
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('formats large numbers correctly', () => {
      render(
        <MetricCard
          title="Large Number"
          value={2500000}
          color="green"
        />
      )
      
      expect(screen.getByText('2.5M')).toBeInTheDocument()
    })
  })

  describe('EnergyChart', () => {
    const mockData = [
      { label: 'Coal', value: 1000, color: '#8B4513' },
      { label: 'Natural Gas', value: 2000, color: '#4169E1' },
      { label: 'Solar', value: 500, color: '#FFA500' }
    ]

    it('renders bar chart correctly', () => {
      render(
        <EnergyChart
          data={mockData}
          title="Test Bar Chart"
          type="bar"
        />
      )
      
      expect(screen.getByText('Test Bar Chart')).toBeInTheDocument()
      expect(screen.getByText('Coal')).toBeInTheDocument()
      expect(screen.getByText('Natural Gas')).toBeInTheDocument()
      expect(screen.getByText('Solar')).toBeInTheDocument()
    })

    it('shows no data message when empty', () => {
      render(
        <EnergyChart
          data={[]}
          title="Empty Chart"
          type="bar"
        />
      )
      
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('renders donut chart correctly', () => {
      render(
        <EnergyChart
          data={mockData}
          title="Test Donut Chart"
          type="donut"
        />
      )
      
      expect(screen.getByText('Test Donut Chart')).toBeInTheDocument()
      expect(screen.getByText('3.5K')).toBeInTheDocument() // Total MW formatted
      expect(screen.getByText('Total MW')).toBeInTheDocument()
    })
  })
})