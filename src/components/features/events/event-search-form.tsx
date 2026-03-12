// Event Search Form Component
export interface EventSearchFormProps {
  onSearch?: (params: {
    query?: string;
    category?: string;
    location?: string;
    date?: string;
  }) => void;
  initialParams?: {
    query?: string;
    category?: string;
    location?: string;
    date?: string;
  };
}

export function EventSearchForm({ onSearch, initialParams }: EventSearchFormProps) {
  return (
    <form className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Search events..."
          defaultValue={initialParams?.query}
          className="px-4 py-2 border rounded-lg"
        />
        <select className="px-4 py-2 border rounded-lg">
          <option value="">All Categories</option>
        </select>
        <input
          type="text"
          placeholder="Location"
          defaultValue={initialParams?.location}
          className="px-4 py-2 border rounded-lg"
        />
        <input
          type="date"
          defaultValue={initialParams?.date}
          className="px-4 py-2 border rounded-lg"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
      >
        Search Events
      </button>
    </form>
  );
}
