'use client'

import React, { useState } from 'react'
import { Filter, ChevronDown, ChevronUp, X, Search } from 'lucide-react'
import { EVENT_CATEGORIES, EVENT_FIELDS, getFieldsByCategory } from '@/lib/event-categories'

interface CategoryFilterProps {
  selectedCategory: string
  selectedField: string
  onCategoryChange: (categoryId: string) => void
  onFieldChange: (fieldId: string) => void
  className?: string
}

export function EventCategoryFilter({
  selectedCategory,
  selectedField,
  onCategoryChange,
  onFieldChange,
  className = ''
}: CategoryFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const selectedCategoryData = EVENT_CATEGORIES.find(cat => cat.id === selectedCategory)
  const availableFields = selectedCategory ? getFieldsByCategory(selectedCategory) : []

  const filteredCategories = EVENT_CATEGORIES.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const hasActiveFilters = selectedCategory || selectedField

  const clearFilters = () => {
    onCategoryChange('')
    onFieldChange('')
    setSearchTerm('')
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    onCategoryChange(category.id === selectedCategory ? '' : category.id)
                    onFieldChange('') // Reset field when category changes
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    selectedCategory === category.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-2xl">{category.icon}</div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">{category.name}</div>
                    <div className="text-xs text-gray-500">{category.description}</div>
                  </div>
                  {selectedCategory === category.id && (
                    <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}

              {filteredCategories.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No categories found
                </div>
              )}
            </div>
          </div>

          {/* Field/Subcategory Selection */}
          {selectedCategory && availableFields.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                <button
                  onClick={() => onFieldChange('')}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${
                    !selectedField
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900">All Fields</div>
                    <div className="text-xs text-gray-500">Show all events in this category</div>
                  </div>
                </button>

                {availableFields.map((field) => (
                  <button
                    key={field.id}
                    onClick={() => onFieldChange(field.id === selectedField ? '' : field.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${
                      selectedField === field.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-900">{field.name}</div>
                      <div className="text-xs text-gray-500">{field.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Active Filters:</div>
              <div className="flex flex-wrap gap-2">
                {selectedCategory && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                    <span>{selectedCategoryData?.icon} {selectedCategoryData?.name}</span>
                    <button
                      onClick={() => {
                        onCategoryChange('')
                        onFieldChange('')
                      }}
                      className="hover:text-indigo-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {selectedField && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    <span>{availableFields.find(f => f.id === selectedField)?.name}</span>
                    <button
                      onClick={() => onFieldChange('')}
                      className="hover:text-green-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
