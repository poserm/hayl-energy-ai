'use client'

import React, { useState, useEffect } from 'react'

interface ShowMoreControlsProps {
  totalItems: number
  visibleItems: number
  onShowMore: () => void
  onShowLess?: () => void
  initialCount?: number
  incrementCount?: number
  className?: string
  showLessThreshold?: number
}

export default function ShowMoreControls({
  totalItems,
  visibleItems,
  onShowMore,
  onShowLess,
  initialCount = 12,
  incrementCount = 12,
  className = '',
  showLessThreshold = 24
}: ShowMoreControlsProps) {
  const remainingItems = totalItems - visibleItems
  const canShowMore = remainingItems > 0
  const canShowLess = onShowLess && visibleItems > showLessThreshold

  if (!canShowMore && !canShowLess) {
    return null
  }

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {/* Progress indicator */}
      {totalItems > initialCount && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Showing {visibleItems} of {totalItems}</span>
            <span>{Math.round((visibleItems / totalItems) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min((visibleItems / totalItems) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center space-x-4">
        {canShowLess && (
          <button
            onClick={onShowLess}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            Show Less
          </button>
        )}

        {canShowMore && (
          <button
            onClick={onShowMore}
            className="flex items-center px-6 py-3 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
          >
            Show {Math.min(remainingItems, incrementCount)} More
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Quick stats */}
      {canShowMore && totalItems > 50 && (
        <div className="text-xs text-gray-500 text-center">
          {remainingItems} more items available
        </div>
      )}
    </div>
  )
}

// Hook for managing show more/less state
export function useShowMore(totalItems: number, initialCount: number = 12, incrementCount: number = 12) {
  const [visibleCount, setVisibleCount] = useState(initialCount)
  
  const showMore = () => {
    setVisibleCount(prev => Math.min(prev + incrementCount, totalItems))
  }
  
  const showLess = () => {
    setVisibleCount(initialCount)
  }
  
  const showAll = () => {
    setVisibleCount(totalItems)
  }
  
  // Use useEffect to reset when total items change
  useEffect(() => {
    if (totalItems > 0 && visibleCount > totalItems) {
      setVisibleCount(Math.min(initialCount, totalItems))
    }
  }, [totalItems, visibleCount, initialCount])
  
  return {
    visibleCount,
    setVisibleCount,
    showMore,
    showLess,
    showAll,
    resetCount: () => setVisibleCount(initialCount),
    hasMore: visibleCount < totalItems,
    hasLess: visibleCount > initialCount
  }
}