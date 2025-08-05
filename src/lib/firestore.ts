import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { GameSession, Player, Character, Skill, InventoryItem } from './groq';

// Game Session Management
export const saveGameSession = async (gameSession: GameSession, userId: string) => {
  try {
    const gameRef = doc(db, 'users', userId, 'games', gameSession.id);
    await setDoc(gameRef, {
      ...gameSession,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error saving game session:', error);
    return false;
  }
};

export const loadGameSession = async (gameId: string, userId: string) => {
  try {
    const gameRef = doc(db, 'users', userId, 'games', gameId);
    const gameDoc = await getDoc(gameRef);
    
    if (gameDoc.exists()) {
      return gameDoc.data() as GameSession;
    }
    return null;
  } catch (error) {
    console.error('Error loading game session:', error);
    return null;
  }
};

export const getUserGames = async (userId: string) => {
  try {
    const gamesRef = collection(db, 'users', userId, 'games');
    const q = query(gamesRef, orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GameSession[];
  } catch (error) {
    console.error('Error loading user games:', error);
    return [];
  }
};

// Character Management
export const saveCharacter = async (character: Character, userId: string) => {
  try {
    const characterRef = doc(db, 'users', userId, 'characters', character.name);
    await setDoc(characterRef, {
      ...character,
      userId,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error saving character:', error);
    return false;
  }
};

export const loadCharacter = async (characterName: string, userId: string) => {
  try {
    const characterRef = doc(db, 'users', userId, 'characters', characterName);
    const characterDoc = await getDoc(characterRef);
    
    if (characterDoc.exists()) {
      return characterDoc.data() as Character;
    }
    return null;
  } catch (error) {
    console.error('Error loading character:', error);
    return null;
  }
};

export const getUserCharacters = async (userId: string) => {
  try {
    const charactersRef = collection(db, 'users', userId, 'characters');
    const q = query(charactersRef, orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const characters = querySnapshot.docs.map(doc => ({
      name: doc.id,
      ...doc.data()
    })) as Character[];

    // If no characters found in subcollection, try to migrate from old location
    if (characters.length === 0) {
      try {
        const oldCharacterRef = doc(db, 'characters', userId);
        const oldCharacterDoc = await getDoc(oldCharacterRef);
        
        if (oldCharacterDoc.exists()) {
          const oldCharacter = oldCharacterDoc.data() as Character;
          // Migrate to new location
          await saveCharacter(oldCharacter, userId);
          // Delete from old location
          await deleteDoc(oldCharacterRef);
          
          // Return the migrated character
          return [oldCharacter];
        }
      } catch (migrationError) {
        console.error('Migration error:', migrationError);
      }
    }
    
    return characters;
  } catch (error) {
    console.error('Error loading user characters:', error);
    return [];
  }
};

// Experience and Leveling
export const addExperience = async (characterName: string, userId: string, experience: number) => {
  try {
    const characterRef = doc(db, 'users', userId, 'characters', characterName);
    const characterDoc = await getDoc(characterRef);
    
    if (characterDoc.exists()) {
      const character = characterDoc.data() as Character;
      const newExperience = character.experience + experience;
      let newLevel = character.level;
      let experienceToNextLevel = character.experienceToNextLevel;
      
      // Check for level up
      if (newExperience >= character.experienceToNextLevel) {
        newLevel += 1;
        experienceToNextLevel = newLevel * 1000; // Simple leveling formula
      }
      
      await updateDoc(characterRef, {
        experience: newExperience,
        level: newLevel,
        experienceToNextLevel,
        updatedAt: serverTimestamp(),
      });
      
      return { newLevel, leveledUp: newLevel > character.level };
    }
    return null;
  } catch (error) {
    console.error('Error adding experience:', error);
    return null;
  }
};

// Skills Management
export const unlockSkill = async (characterName: string, userId: string, skillName: string) => {
  try {
    const characterRef = doc(db, 'users', userId, 'characters', characterName);
    const characterDoc = await getDoc(characterRef);
    
    if (characterDoc.exists()) {
      const character = characterDoc.data() as Character;
      const updatedSkills = character.skills.map(skill => 
        skill.name === skillName ? { ...skill, unlocked: true } : skill
      );
      
      await updateDoc(characterRef, {
        skills: updatedSkills,
        updatedAt: serverTimestamp(),
      });
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error unlocking skill:', error);
    return false;
  }
};

// Inventory Management
export const addItemToInventory = async (characterName: string, userId: string, item: InventoryItem) => {
  try {
    const characterRef = doc(db, 'users', userId, 'characters', characterName);
    const characterDoc = await getDoc(characterRef);
    
    if (characterDoc.exists()) {
      const character = characterDoc.data() as Character;
      const existingItemIndex = character.inventory.findIndex(invItem => invItem.name === item.name);
      
      let updatedInventory;
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        updatedInventory = [...character.inventory];
        updatedInventory[existingItemIndex].quantity += item.quantity;
      } else {
        // Add new item
        updatedInventory = [...character.inventory, item];
      }
      
      await updateDoc(characterRef, {
        inventory: updatedInventory,
        updatedAt: serverTimestamp(),
      });
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error adding item to inventory:', error);
    return false;
  }
};

// Game Progress Tracking
export const updateGameProgress = async (gameId: string, userId: string, updates: Partial<GameSession>) => {
  try {
    const gameRef = doc(db, 'users', userId, 'games', gameId);
    await updateDoc(gameRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error updating game progress:', error);
    return false;
  }
};

// Delete game session
export const deleteGameSession = async (gameId: string, userId: string) => {
  try {
    const gameRef = doc(db, 'users', userId, 'games', gameId);
    await deleteDoc(gameRef);
    return true;
  } catch (error) {
    console.error('Error deleting game session:', error);
    return false;
  }
}; 