'use client';

import { useState } from 'react';

interface TargetingEditorProps {
  value: {
    locations: string[];
    categories: string[];
    devices: string[];
    demographics?: {
      age_range?: [number, number];
      genders?: string[];
    };
    interests?: string[];
  };
  onChange: (value: any) => void;
}

export function TargetingEditor({ value, onChange }: TargetingEditorProps) {
  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newInterest, setNewInterest] = useState('');

  const locations = ['Lahore', 'Karachi', 'Islamabad', 'Peshawar', 'Quetta', 'Multan'];
  const categories = ['Music', 'Sports', 'Technology', 'Food', 'Art', 'Business', 'Education'];
  const interests = ['Concerts', 'Festivals', 'Workshops', 'Networking', 'Sports', 'Food & Drink'];

  function addLocation() {
    if (newLocation && !value.locations.includes(newLocation)) {
      onChange({
        ...value,
        locations: [...value.locations, newLocation]
      });
      setNewLocation('');
    }
  }

  function removeLocation(location: string) {
    onChange({
      ...value,
      locations: value.locations.filter((l) => l !== location)
    });
  }

  function addCategory() {
    if (newCategory && !value.categories.includes(newCategory)) {
      onChange({
        ...value,
        categories: [...value.categories, newCategory]
      });
      setNewCategory('');
    }
  }

  function removeCategory(category: string) {
    onChange({
      ...value,
      categories: value.categories.filter((c) => c !== category)
    });
  }

  function toggleDevice(device: string) {
    const devices = value.devices.includes(device)
      ? value.devices.filter((d) => d !== device)
      : [...value.devices, device];

    onChange({ ...value, devices });
  }

  function addInterest() {
    if (newInterest && !value.interests?.includes(newInterest)) {
      onChange({
        ...value,
        interests: [...(value.interests || []), newInterest]
      });
      setNewInterest('');
    }
  }

  function removeInterest(interest: string) {
    onChange({
      ...value,
      interests: value.interests?.filter((i) => i !== interest) || []
    });
  }

  return (
    <div className="space-y-6">
      {/* Locations */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Target Locations
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <select
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a city...</option>
              {locations.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addLocation}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {value.locations.map((location) => (
              <span
                key={location}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {location}
                <button
                  type="button"
                  onClick={() => removeLocation(location)}
                  className="hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Event Categories */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Event Categories
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addCategory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {value.categories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
              >
                {category}
                <button
                  type="button"
                  onClick={() => removeCategory(category)}
                  className="hover:text-green-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Devices */}
      <div>
        <label className="block text-sm font-medium mb-3">
          Target Devices
        </label>
        <div className="flex gap-4">
          {['Desktop', 'Mobile', 'Tablet'].map((device) => (
            <label key={device} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.devices.includes(device.toLowerCase())}
                onChange={() => toggleDevice(device.toLowerCase())}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm">{device}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <label className="block text-sm font-medium mb-2">
          User Interests
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <select
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an interest...</option>
              {interests.map((interest) => (
                <option key={interest} value={interest}>{interest}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addInterest}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {value.interests?.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
              >
                {interest}
                <button
                  type="button"
                  onClick={() => removeInterest(interest)}
                  className="hover:text-purple-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div>
        <label className="block text-sm font-medium mb-3">
          Age Range
        </label>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min="18"
            max="65"
            value={value.demographics?.age_range?.[0] || 18}
            onChange={(e) => onChange({
              ...value,
              demographics: {
                ...value.demographics,
                age_range: [parseInt(e.target.value), value.demographics?.age_range?.[1] || 65]
              }
            })}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <span>to</span>
          <input
            type="number"
            min="18"
            max="65"
            value={value.demographics?.age_range?.[1] || 65}
            onChange={(e) => onChange({
              ...value,
              demographics: {
                ...value.demographics,
                age_range: [value.demographics?.age_range?.[0] || 18, parseInt(e.target.value)]
              }
            })}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">years old</span>
        </div>
      </div>
    </div>
  );
}
