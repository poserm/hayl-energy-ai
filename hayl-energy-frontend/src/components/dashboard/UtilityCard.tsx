'use client'

import React from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Utility, UtilityType } from '@/types/energy'
import { energyApiUtils } from '@/lib/energy-api'
import Button from '@/components/ui/Button'
import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  BoltIcon,
  MapPinIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'

interface UtilityCardProps {
  utility: Utility
  showAnalyzeButton?: boolean
  compact?: boolean
  className?: string
  onAnalyze?: (utility: Utility) => void
  onCompare?: (utility: Utility) => void
}

const UtilityCard: React.FC<UtilityCardProps> = ({
  utility,
  showAnalyzeButton = true,
  compact = false,
  className,
  onAnalyze,
  onCompare,
}) => {
  const logoSize = energyApiUtils.getLogoSize(utility.totalCapacity)
  const logoUrl = energyApiUtils.getUtilityLogoUrl(utility)

  const getTypeColor = (type: UtilityType) => {
    switch (type) {
      case UtilityType.INVESTOR_OWNED:
        return 'bg-primary-50 text-primary-700 ring-primary-600/20'
      case UtilityType.COOPERATIVE:
        return 'bg-secondary-50 text-secondary-700 ring-secondary-600/20'
      case UtilityType.MUNICIPAL:
        return 'bg-accent-50 text-accent-700 ring-accent-600/20'
      default:
        return 'bg-gray-50 text-gray-700 ring-gray-600/20'
    }
  }

  const getTypeLabel = (type: UtilityType) => {
    switch (type) {
      case UtilityType.INVESTOR_OWNED:
        return 'Investor Owned'
      case UtilityType.COOPERATIVE:
        return 'Cooperative'
      case UtilityType.MUNICIPAL:
        return 'Municipal'
      case UtilityType.PUBLIC_POWER:
        return 'Public Power'
      case UtilityType.FEDERAL:
        return 'Federal'
      default:
        return 'Utility'
    }
  }

  if (compact) {
    return (
      <div
        className={clsx(
          'relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm hover:border-gray-400 transition-colors',
          className
        )}
      >
        <div className="flex-shrink-0">
          <img
            className={clsx('rounded-lg object-contain')}
            style={{ width: `${Math.max(logoSize * 0.6, 32)}px`, height: `${Math.max(logoSize * 0.6, 32)}px` }}
            src={logoUrl}
            alt={`${utility.name} logo`}
            onError={(e) => {
              e.currentTarget.src = '/logos/placeholder.svg'
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">{utility.name}</p>
          <p className="text-xs text-gray-500 truncate">
            {energyApiUtils.formatCapacity(utility.totalCapacity)} • {energyApiUtils.formatCustomers(utility.customerCount)}
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className={clsx('inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset', getTypeColor(utility.type))}>
            {getTypeLabel(utility.type)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'relative flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header with logo */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <img
            className={clsx('rounded-lg object-contain')}
            style={{ width: `${logoSize}px`, height: `${logoSize}px` }}
            src={logoUrl}
            alt={`${utility.name} logo`}
            onError={(e) => {
              e.currentTarget.src = '/logos/placeholder.svg'
            }}
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{utility.name}</h3>
            <p className="text-sm text-gray-500">{utility.region}</p>
          </div>
        </div>
        <span className={clsx('inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset', getTypeColor(utility.type))}>
          {getTypeLabel(utility.type)}
        </span>
      </div>

      {/* Key metrics */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <BoltIcon className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {energyApiUtils.formatCapacity(utility.totalCapacity)}
            </p>
            <p className="text-xs text-gray-500">Total Capacity</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <UserGroupIcon className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {energyApiUtils.formatCustomers(utility.customerCount)}
            </p>
            <p className="text-xs text-gray-500">Customers</p>
          </div>
        </div>
      </div>

      {/* Service territory */}
      <div className="mt-4 flex items-center space-x-2">
        <MapPinIcon className="h-4 w-4 text-gray-400" />
        <p className="text-sm text-gray-600">
          {utility.serviceTerritory.counties.slice(0, 3).join(', ')}
          {utility.serviceTerritory.counties.length > 3 && ` +${utility.serviceTerritory.counties.length - 3} more`}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-6 flex space-x-3">
        {showAnalyzeButton && (
          <Link href={`/dashboard/utilities/${utility.id}`} className="flex-1">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => onAnalyze?.(utility)}
            >
              ANALYZE UTILITY
            </Button>
          </Link>
        )}
        {onCompare && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCompare(utility)}
            icon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}
          >
            Compare
          </Button>
        )}
        {utility.website && (
          <a
            href={utility.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <BuildingOfficeIcon className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  )
}

export default UtilityCard