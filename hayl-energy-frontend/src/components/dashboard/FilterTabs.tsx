'use client'

import React from 'react'
import { clsx } from 'clsx'
import { UtilityType, utilityTypeDescriptions } from '@/data/virginia-utilities'

interface FilterTabsProps {
  activeFilter: UtilityType | 'all'
  onFilterChange: (filter: UtilityType | 'all') => void
  utilityCounts?: { [key in UtilityType | 'all']: number }
  className?: string
}

const FilterTabs: React.FC<FilterTabsProps> = ({
  activeFilter,
  onFilterChange,
  utilityCounts,
  className,
}) => {
  const tabs = [
    {
      key: 'all' as const,
      label: 'All Utilities',
      description: 'All Virginia energy utilities',
    },
    {
      key: UtilityType.INVESTOR_OWNED,
      label: 'Investor Owned',
      description: utilityTypeDescriptions[UtilityType.INVESTOR_OWNED].description,
    },
    {
      key: UtilityType.COOPERATIVE,
      label: 'Cooperatives',
      description: utilityTypeDescriptions[UtilityType.COOPERATIVE].description,
    },
    {
      key: UtilityType.MUNICIPAL,
      label: 'Municipal',
      description: utilityTypeDescriptions[UtilityType.MUNICIPAL].description,
    },
  ]

  return (
    <div className={clsx('border-b border-gray-200', className)}>
      <nav className="-mb-px flex space-x-8" aria-label="Utility types">
        {tabs.map((tab) => {
          const isActive = activeFilter === tab.key
          const count = utilityCounts?.[tab.key]
          
          return (
            <button
              key={tab.key}
              onClick={() => onFilterChange(tab.key)}
              className={clsx(
                'group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="text-left">
                <div className="flex items-center">
                  <span>{tab.label}</span>
                  {count !== undefined && (
                    <span
                      className={clsx(
                        'ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        isActive
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {count}
                    </span>
                  )}
                </div>
                <div className={clsx(
                  'mt-1 text-xs',
                  isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                )}>
                  {tab.description}
                </div>
              </div>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default FilterTabs

// Alternative compact filter tabs for smaller spaces
export const CompactFilterTabs: React.FC<FilterTabsProps> = ({
  activeFilter,
  onFilterChange,
  utilityCounts,
  className,
}) => {
  const tabs = [
    { key: 'all' as const, label: 'All' },
    { key: UtilityType.INVESTOR_OWNED, label: 'Investor Owned' },
    { key: UtilityType.COOPERATIVE, label: 'Cooperatives' },
    { key: UtilityType.MUNICIPAL, label: 'Municipal' },
  ]

  return (
    <div className={clsx('flex space-x-1 rounded-lg bg-gray-100 p-1', className)}>
      {tabs.map((tab) => {
        const isActive = activeFilter === tab.key
        const count = utilityCounts?.[tab.key]
        
        return (
          <button
            key={tab.key}
            onClick={() => onFilterChange(tab.key)}
            className={clsx(
              'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all',
              isActive
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <span>{tab.label}</span>
            {count !== undefined && (
              <span
                className={clsx(
                  'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  isActive
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-200 text-gray-600'
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}