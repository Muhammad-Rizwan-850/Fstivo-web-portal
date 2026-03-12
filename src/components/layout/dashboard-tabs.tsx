/**
 * Dashboard Tabs Component
 * Tab navigation for dashboard sections
 */

'use client'

import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

export interface DashboardTab {
  id: string
  label: string
  icon: LucideIcon
  count?: number
}

interface DashboardTabsProps {
  tabs: DashboardTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function DashboardTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: DashboardTabsProps) {
  return (
    <div className={cn('border-b border-gray-200', className)}>
      {/* Desktop: Full width tabs */}
      <nav className="hidden sm:flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'group relative min-w-0 flex-1 overflow-hidden py-4 px-1 text-center text-sm font-medium transition-colors',
                isActive
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      'ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      isActive
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </nav>

      {/* Mobile: Horizontal scrollable tabs */}
      <nav
        className="sm:hidden -mb-px flex space-x-8 overflow-x-auto"
        aria-label="Tabs"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'whitespace-nowrap py-4 px-1 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors',
                isActive
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    'ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    isActive
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
