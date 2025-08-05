// Client-side functions that call the API route

export interface GameSession {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  gameState: 'waiting' | 'playing' | 'finished';
  story: string;
  currentScene: string;
  turn: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  name: string;
  character: Character;
  isActive: boolean;
  isCurrentTurn: boolean;
  connectionStatus?: 'connected' | 'disconnected' | 'away';
  lastSeen?: any;
}

export interface Character {
  name: string;
  gender: string;
  profileIcon: string;
  race: string;
  class: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  background: string;
  alignment: string;
  skills: Skill[];
  inventory: InventoryItem[];
  health: number;
  maxHealth: number;
  armorClass: number;
  initiative: number;
}

export interface Skill {
  name: string;
  level: number;
  description: string;
  category: 'combat' | 'social' | 'exploration' | 'magic';
  experienceRequired: number;
  unlocked: boolean;
}

export interface InventoryItem {
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'treasure' | 'magic';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  description: string;
  value: number;
  quantity: number;
  effects?: string[];
}

export interface GameAction {
  type: 'move' | 'attack' | 'cast' | 'interact' | 'talk' | 'explore' | 'skill' | 'inventory';
  description: string;
  target?: string;
  roll?: number;
  result?: string;
  experienceGained?: number;
  skillsUnlocked?: string[];
  itemsFound?: InventoryItem[];
}

export const generateDungeonMasterResponse = async (
  gameSession: GameSession,
  playerAction?: GameAction
): Promise<string> => {
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'dungeonMasterResponse',
        gameSession,
        playerAction,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate Dungeon Master response');
    }

    const data = await response.json();
    return data.response || "The Dungeon Master is thinking...";
  } catch (error) {
    console.error('Error generating Dungeon Master response:', error);
    return "The Dungeon Master is temporarily unavailable. Please try again.";
  }
};

export const generatePlayerActions = async (
  gameSession: GameSession,
  currentPlayer: Player
): Promise<string[]> => {
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'playerActions',
        gameSession,
        currentPlayer,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate player actions');
    }

    const data = await response.json();
    return data.actions || [
      "Explore the area",
      "Talk to nearby NPCs",
      "Search for clues",
      "Prepare for combat",
      "Cast a spell",
      "Move to a different location"
    ];
  } catch (error) {
    console.error('Error generating player actions:', error);
    return [
      "Explore the area",
      "Talk to nearby NPCs",
      "Search for clues",
      "Prepare for combat",
      "Cast a spell",
      "Move to a different location"
    ];
  }
};

// No default export needed - all functions are named exports 