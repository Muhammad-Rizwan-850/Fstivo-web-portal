// Event Filters Component
export interface EventFiltersProps {
  categories: Array<{ id: string; name: string; slug: string }>;
  onCategoryChange?: (category: string) => void;
  onDateFilterChange?: (date: string) => void;
}

export function EventFilters({ categories, onCategoryChange, onDateFilterChange }: EventFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Categories</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategoryChange?.('')}
            className="px-3 py-1 bg-gray-200 rounded-full text-sm hover:bg-gray-300"
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange?.(cat.slug)}
              className="px-3 py-1 bg-gray-200 rounded-full text-sm hover:bg-gray-300"
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Date</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onDateFilterChange?.('today')}
            className="px-3 py-1 bg-gray-200 rounded-full text-sm hover:bg-gray-300"
          >
            Today
          </button>
          <button
            onClick={() => onDateFilterChange?.('week')}
            className="px-3 py-1 bg-gray-200 rounded-full text-sm hover:bg-gray-300"
          >
            This Week
          </button>
          <button
            onClick={() => onDateFilterChange?.('month')}
            className="px-3 py-1 bg-gray-200 rounded-full text-sm hover:bg-gray-300"
          >
            This Month
          </button>
        </div>
      </div>
    </div>
  );
}
