'use client';

interface ProfileIconSelectorProps {
  selectedIcon: string;
  onIconChange: (icon: string) => void;
  gender: string;
}

export const ProfileIconSelector = ({ selectedIcon, onIconChange, gender }: ProfileIconSelectorProps) => {
  const maleIcons = [
    { value: 'male-warrior', emoji: '⚔️', label: 'Warrior' },
    { value: 'male-mage', emoji: '🧙‍♂️', label: 'Mage' },
    { value: 'male-archer', emoji: '🏹', label: 'Archer' },
    { value: 'male-paladin', emoji: '🛡️', label: 'Paladin' },
    { value: 'male-rogue', emoji: '🗡️', label: 'Rogue' },
    { value: 'male-barbarian', emoji: '🪓', label: 'Barbarian' },
    { value: 'male-druid', emoji: '🌿', label: 'Druid' },
    { value: 'male-monk', emoji: '🥋', label: 'Monk' },
    { value: 'male-bard', emoji: '🎵', label: 'Bard' },
    { value: 'male-cleric', emoji: '⛪', label: 'Cleric' },
    { value: 'male-sorcerer', emoji: '🔮', label: 'Sorcerer' },
    { value: 'male-warlock', emoji: '👹', label: 'Warlock' }
  ];

  const femaleIcons = [
    { value: 'female-warrior', emoji: '⚔️', label: 'Warrior' },
    { value: 'female-mage', emoji: '🧙‍♀️', label: 'Mage' },
    { value: 'female-archer', emoji: '🏹', label: 'Archer' },
    { value: 'female-paladin', emoji: '🛡️', label: 'Paladin' },
    { value: 'female-rogue', emoji: '🗡️', label: 'Rogue' },
    { value: 'female-barbarian', emoji: '🪓', label: 'Barbarian' },
    { value: 'female-druid', emoji: '🌿', label: 'Druid' },
    { value: 'female-monk', emoji: '🥋', label: 'Monk' },
    { value: 'female-bard', emoji: '🎵', label: 'Bard' },
    { value: 'female-cleric', emoji: '⛪', label: 'Cleric' },
    { value: 'female-sorcerer', emoji: '🔮', label: 'Sorcerer' },
    { value: 'female-warlock', emoji: '👹', label: 'Warlock' }
  ];

  const otherIcons = [
    { value: 'other-warrior', emoji: '⚔️', label: 'Warrior' },
    { value: 'other-mage', emoji: '🧙', label: 'Mage' },
    { value: 'other-archer', emoji: '🏹', label: 'Archer' },
    { value: 'other-paladin', emoji: '🛡️', label: 'Paladin' },
    { value: 'other-rogue', emoji: '🗡️', label: 'Rogue' },
    { value: 'other-barbarian', emoji: '🪓', label: 'Barbarian' },
    { value: 'other-druid', emoji: '🌿', label: 'Druid' },
    { value: 'other-monk', emoji: '🥋', label: 'Monk' },
    { value: 'other-bard', emoji: '🎵', label: 'Bard' },
    { value: 'other-cleric', emoji: '⛪', label: 'Cleric' },
    { value: 'other-sorcerer', emoji: '🔮', label: 'Sorcerer' },
    { value: 'other-warlock', emoji: '👹', label: 'Warlock' }
  ];

  const getIcons = () => {
    switch (gender) {
      case 'male':
        return maleIcons;
      case 'female':
        return femaleIcons;
      default:
        return otherIcons;
    }
  };

  const icons = getIcons();

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Icon Profile
      </label>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {icons.map((icon) => (
          <div
            key={icon.value}
            className={`cursor-pointer transition-all duration-200 hover:scale-110 p-3 rounded-lg border-2 ${
              selectedIcon === icon.value
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => onIconChange(icon.value)}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">{icon.emoji}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {icon.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 