'use client';

import { User } from 'lucide-react';

interface GenderSelectorProps {
  selectedGender: string;
  onGenderChange: (gender: string) => void;
}

export const GenderSelector = ({ selectedGender, onGenderChange }: GenderSelectorProps) => {
  const genders = [
    {
      value: 'male',
      label: 'Pria',
      emoji: '👨',
      description: 'Karakter pria'
    },
    {
      value: 'female',
      label: 'Wanita',
      emoji: '👩',
      description: 'Karakter wanita'
    },
    {
      value: 'other',
      label: 'Lainnya',
      emoji: '🧙',
      description: 'Karakter non-binary'
    }
  ];

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Gender
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {genders.map((gender) => (
          <div
            key={gender.value}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 p-6 ${
              selectedGender === gender.value
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => onGenderChange(gender.value)}
          >
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className={`p-3 rounded-full transition-colors ${
                  selectedGender === gender.value
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  <User className="h-8 w-8" />
                </div>
              </div>
              <div className="text-3xl mb-2">{gender.emoji}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {gender.label}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {gender.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 