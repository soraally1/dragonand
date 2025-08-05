export const getProfileIconEmoji = (icon: string): string => {
  const iconMap: { [key: string]: string } = {
    'male-warrior': '👨‍⚔️',
    'male-mage': '👨‍🔬',
    'male-rogue': '👨‍💼',
    'male-cleric': '👨‍⚕️',
    'male-ranger': '👨‍🌾',
    'male-paladin': '👨‍⚖️',
    'male-barbarian': '👨‍🦱',
    'male-bard': '👨‍🎤',
    'male-druid': '👨‍🌿',
    'male-monk': '👨‍🏫',
    'male-sorcerer': '👨‍🎭',
    'male-warlock': '👨‍💀',
    'female-warrior': '👩‍⚔️',
    'female-mage': '👩‍🔬',
    'female-rogue': '👩‍💼',
    'female-cleric': '👩‍⚕️',
    'female-ranger': '👩‍🌾',
    'female-paladin': '👩‍⚖️',
    'female-barbarian': '👩‍🦱',
    'female-bard': '👩‍🎤',
    'female-druid': '👩‍🌿',
    'female-monk': '👩‍🏫',
    'female-sorcerer': '👩‍🎭',
    'female-warlock': '👩‍💀',
  };
  return iconMap[icon] || '👤';
};

export const getGenderLabel = (gender: string): string => {
  const genderMap: { [key: string]: string } = {
    'male': 'Pria',
    'female': 'Wanita',
    'other': 'Lainnya',
  };
  return genderMap[gender] || gender;
};

// Generate default skills based on character class
export const generateDefaultSkills = (characterClass: string) => {
  const baseSkills = [
    {
      name: 'Athletics',
      level: 1,
      description: 'Physical activities like climbing, jumping, and swimming',
      category: 'combat' as const,
      experienceRequired: 0,
      unlocked: true
    },
    {
      name: 'Perception',
      level: 1,
      description: 'Noticing details in your environment',
      category: 'exploration' as const,
      experienceRequired: 0,
      unlocked: true
    }
  ];

  const classSkills: { [key: string]: any[] } = {
    'Fighter': [
      { name: 'Weapon Mastery', level: 1, description: 'Proficiency with all weapons', category: 'combat', experienceRequired: 0, unlocked: true },
      { name: 'Armor Training', level: 1, description: 'Proficiency with all armor types', category: 'combat', experienceRequired: 0, unlocked: true },
      { name: 'Second Wind', level: 2, description: 'Recover health during combat', category: 'combat', experienceRequired: 1000, unlocked: false },
      { name: 'Action Surge', level: 3, description: 'Take an additional action', category: 'combat', experienceRequired: 2000, unlocked: false }
    ],
    'Wizard': [
      { name: 'Spellcasting', level: 1, description: 'Cast arcane spells', category: 'magic', experienceRequired: 0, unlocked: true },
      { name: 'Arcane Recovery', level: 1, description: 'Recover spell slots during rest', category: 'magic', experienceRequired: 0, unlocked: true },
      { name: 'Ritual Casting', level: 2, description: 'Cast spells as rituals', category: 'magic', experienceRequired: 1000, unlocked: false },
      { name: 'Spell Mastery', level: 3, description: 'Master specific spells', category: 'magic', experienceRequired: 2000, unlocked: false }
    ],
    'Cleric': [
      { name: 'Divine Spellcasting', level: 1, description: 'Cast divine spells', category: 'magic', experienceRequired: 0, unlocked: true },
      { name: 'Divine Domain', level: 1, description: 'Special abilities from your deity', category: 'magic', experienceRequired: 0, unlocked: true },
      { name: 'Turn Undead', level: 2, description: 'Turn or destroy undead creatures', category: 'magic', experienceRequired: 1000, unlocked: false },
      { name: 'Divine Intervention', level: 3, description: 'Call upon your deity for aid', category: 'magic', experienceRequired: 2000, unlocked: false }
    ],
    'Rogue': [
      { name: 'Sneak Attack', level: 1, description: 'Deal extra damage when hidden', category: 'combat', experienceRequired: 0, unlocked: true },
      { name: 'Thieves\' Cant', level: 1, description: 'Secret language of thieves', category: 'social', experienceRequired: 0, unlocked: true },
      { name: 'Cunning Action', level: 2, description: 'Use bonus action to hide, dash, or disengage', category: 'combat', experienceRequired: 1000, unlocked: false },
      { name: 'Uncanny Dodge', level: 3, description: 'Halve damage from attacks', category: 'combat', experienceRequired: 2000, unlocked: false }
    ],
    'Ranger': [
      { name: 'Favored Enemy', level: 1, description: 'Bonus against specific creature types', category: 'combat', experienceRequired: 0, unlocked: true },
      { name: 'Natural Explorer', level: 1, description: 'Enhanced abilities in natural environments', category: 'exploration', experienceRequired: 0, unlocked: true },
      { name: 'Hunter\'s Mark', level: 2, description: 'Track and deal extra damage to targets', category: 'combat', experienceRequired: 1000, unlocked: false },
      { name: 'Primeval Awareness', level: 3, description: 'Sense nearby creatures', category: 'exploration', experienceRequired: 2000, unlocked: false }
    ],
    'Paladin': [
      { name: 'Divine Sense', level: 1, description: 'Detect celestial, fiend, or undead', category: 'magic', experienceRequired: 0, unlocked: true },
      { name: 'Lay on Hands', level: 1, description: 'Heal wounds or cure diseases', category: 'magic', experienceRequired: 0, unlocked: true },
      { name: 'Divine Smite', level: 2, description: 'Channel divine energy into attacks', category: 'combat', experienceRequired: 1000, unlocked: false },
      { name: 'Aura of Protection', level: 3, description: 'Protect allies from harmful effects', category: 'magic', experienceRequired: 2000, unlocked: false }
    ],
    'Barbarian': [
      { name: 'Rage', level: 1, description: 'Enter a battle rage for enhanced combat', category: 'combat', experienceRequired: 0, unlocked: true },
      { name: 'Unarmored Defense', level: 1, description: 'Natural armor from Constitution', category: 'combat', experienceRequired: 0, unlocked: true },
      { name: 'Reckless Attack', level: 2, description: 'Advantage on attacks but vulnerability', category: 'combat', experienceRequired: 1000, unlocked: false },
      { name: 'Danger Sense', level: 3, description: 'Advantage on Dexterity saves', category: 'combat', experienceRequired: 2000, unlocked: false }
    ],
    'Bard': [
      { name: 'Bardic Inspiration', level: 1, description: 'Inspire allies with magical music', category: 'social', experienceRequired: 0, unlocked: true },
      { name: 'Song of Rest', level: 1, description: 'Enhanced healing during short rests', category: 'magic', experienceRequired: 0, unlocked: true },
      { name: 'Jack of All Trades', level: 2, description: 'Add half proficiency to untrained skills', category: 'social', experienceRequired: 1000, unlocked: false },
      { name: 'Font of Inspiration', level: 3, description: 'Recover Bardic Inspiration on short rest', category: 'social', experienceRequired: 2000, unlocked: false }
    ],
    'Druid': [
      { name: 'Wild Shape', level: 1, description: 'Transform into animals', category: 'magic', experienceRequired: 0, unlocked: true },
      { name: 'Druidic', level: 1, description: 'Secret language of druids', category: 'social', experienceRequired: 0, unlocked: true },
      { name: 'Wild Companion', level: 2, description: 'Summon a familiar', category: 'magic', experienceRequired: 1000, unlocked: false },
      { name: 'Circle Forms', level: 3, description: 'Enhanced wild shape abilities', category: 'magic', experienceRequired: 2000, unlocked: false }
    ],
    'Monk': [
      { name: 'Unarmored Defense', level: 1, description: 'Natural armor from Wisdom', category: 'combat', experienceRequired: 0, unlocked: true },
      { name: 'Martial Arts', level: 1, description: 'Enhanced unarmed combat', category: 'combat', experienceRequired: 0, unlocked: true },
      { name: 'Ki', level: 2, description: 'Channel mystical energy', category: 'magic', experienceRequired: 1000, unlocked: false },
      { name: 'Deflect Missiles', level: 3, description: 'Catch and throw projectiles', category: 'combat', experienceRequired: 2000, unlocked: false }
    ],
    'Sorcerer': [
      { name: 'Sorcerous Origin', level: 1, description: 'Innate magical abilities', category: 'magic', experienceRequired: 0, unlocked: true },
      { name: 'Font of Magic', level: 1, description: 'Convert spell slots to sorcery points', category: 'magic', experienceRequired: 0, unlocked: true },
      { name: 'Metamagic', level: 2, description: 'Modify spells with sorcery points', category: 'magic', experienceRequired: 1000, unlocked: false },
      { name: 'Sorcerous Restoration', level: 3, description: 'Recover sorcery points on short rest', category: 'magic', experienceRequired: 2000, unlocked: false }
    ],
    'Warlock': [
      { name: 'Pact Magic', level: 1, description: 'Cast spells from your patron', category: 'magic', experienceRequired: 0, unlocked: true },
      { name: 'Eldritch Invocations', level: 1, description: 'Mystical abilities from your patron', category: 'magic', experienceRequired: 0, unlocked: true },
      { name: 'Pact Boon', level: 2, description: 'Special gift from your patron', category: 'magic', experienceRequired: 1000, unlocked: false },
      { name: 'Mystic Arcanum', level: 3, description: 'Access to powerful spells', category: 'magic', experienceRequired: 2000, unlocked: false }
    ]
  };

  return [...baseSkills, ...(classSkills[characterClass] || [])];
};

// Generate default inventory based on character class
export const generateDefaultInventory = (characterClass: string) => {
  const baseItems = [
    {
      name: 'Backpack',
      type: 'treasure' as const,
      rarity: 'common' as const,
      description: 'A standard adventurer\'s backpack',
      value: 2,
      quantity: 1,
      effects: ['Carry capacity +30 lbs']
    },
    {
      name: 'Bedroll',
      type: 'treasure' as const,
      rarity: 'common' as const,
      description: 'A comfortable bedroll for camping',
      value: 1,
      quantity: 1,
      effects: ['Comfortable rest outdoors']
    },
    {
      name: 'Rations (5 days)',
      type: 'consumable' as const,
      rarity: 'common' as const,
      description: 'Dried food for survival',
      value: 5,
      quantity: 1,
      effects: ['Sustain for 5 days']
    },
    {
      name: 'Waterskin',
      type: 'treasure' as const,
      rarity: 'common' as const,
      description: 'Leather container for water',
      value: 2,
      quantity: 1,
      effects: ['Hold 4 pints of liquid']
    }
  ];

  const classItems: { [key: string]: any[] } = {
    'Fighter': [
      {
        name: 'Longsword',
        type: 'weapon' as const,
        rarity: 'common' as const,
        description: 'A versatile martial weapon',
        value: 15,
        quantity: 1,
        effects: ['1d8 slashing damage', 'Versatile (1d10)']
      },
      {
        name: 'Chain Mail',
        type: 'armor' as const,
        rarity: 'common' as const,
        description: 'Heavy armor made of interlocking metal rings',
        value: 75,
        quantity: 1,
        effects: ['AC 16', 'Disadvantage on Stealth']
      },
      {
        name: 'Shield',
        type: 'armor' as const,
        rarity: 'common' as const,
        description: 'A wooden shield for protection',
        value: 10,
        quantity: 1,
        effects: ['AC +2']
      }
    ],
    'Wizard': [
      {
        name: 'Spellbook',
        type: 'magic' as const,
        rarity: 'common' as const,
        description: 'A leather-bound book containing your spells',
        value: 50,
        quantity: 1,
        effects: ['Store and prepare spells']
      },
      {
        name: 'Arcane Focus',
        type: 'magic' as const,
        rarity: 'common' as const,
        description: 'A crystal orb for channeling magic',
        value: 10,
        quantity: 1,
        effects: ['Cast spells without material components']
      },
      {
        name: 'Scholar\'s Pack',
        type: 'treasure' as const,
        rarity: 'common' as const,
        description: 'A pack containing academic supplies',
        value: 40,
        quantity: 1,
        effects: ['Contains books, ink, and writing supplies']
      }
    ],
    'Cleric': [
      {
        name: 'Mace',
        type: 'weapon' as const,
        rarity: 'common' as const,
        description: 'A simple but effective weapon',
        value: 5,
        quantity: 1,
        effects: ['1d6 bludgeoning damage']
      },
      {
        name: 'Scale Mail',
        type: 'armor' as const,
        rarity: 'common' as const,
        description: 'Medium armor made of overlapping metal scales',
        value: 50,
        quantity: 1,
        effects: ['AC 14', 'Disadvantage on Stealth']
      },
      {
        name: 'Holy Symbol',
        type: 'magic' as const,
        rarity: 'common' as const,
        description: 'A sacred symbol of your deity',
        value: 5,
        quantity: 1,
        effects: ['Cast divine spells', 'Channel divinity']
      }
    ],
    'Rogue': [
      {
        name: 'Shortsword',
        type: 'weapon' as const,
        rarity: 'common' as const,
        description: 'A light, finesse weapon',
        value: 10,
        quantity: 1,
        effects: ['1d6 piercing damage', 'Finesse', 'Light']
      },
      {
        name: 'Shortbow',
        type: 'weapon' as const,
        rarity: 'common' as const,
        description: 'A simple ranged weapon',
        value: 25,
        quantity: 1,
        effects: ['1d6 piercing damage', 'Range 80/320', 'Ammunition']
      },
      {
        name: 'Leather Armor',
        type: 'armor' as const,
        rarity: 'common' as const,
        description: 'Light armor made of tanned animal hide',
        value: 10,
        quantity: 1,
        effects: ['AC 11 + Dex modifier']
      }
    ]
  };

  return [...baseItems, ...(classItems[characterClass] || [])];
};

// Calculate character stats based on ability scores
export const calculateCharacterStats = (character: any) => {
  const getModifier = (score: number) => Math.floor((score - 10) / 2);
  
  // Base health calculation (assuming d8 hit die for most classes)
  const baseHealth = 8 + getModifier(character.constitution);
  const maxHealth = Math.max(1, baseHealth); // Minimum 1 HP
  
  // Armor Class calculation
  let armorClass = 10 + getModifier(character.dexterity);
  
  // Initiative calculation
  const initiative = getModifier(character.dexterity);
  
  return {
    health: maxHealth,
    maxHealth,
    armorClass,
    initiative
  };
}; 