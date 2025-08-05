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
  onSnapshot,
  serverTimestamp,
  addDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';
import { GameSession, Player, Character } from './groq';

export interface GameRoom {
  id: string;
  roomCode: string;
  hostId: string;
  hostName: string;
  players: Player[];
  maxPlayers: number;
  gameState: 'waiting' | 'playing' | 'finished';
  currentPlayerIndex: number;
  story: string;
  currentScene: string;
  turn: number;
  createdAt: any;
  updatedAt: any;
  isPublic: boolean;
  gameSettings: {
    allowSpectators: boolean;
    autoSave: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
  };
}

export interface PlayerConnection {
  id: string;
  name: string;
  character: Character;
  isHost: boolean;
  isReady: boolean;
  lastSeen: any;
  connectionStatus: 'connected' | 'disconnected' | 'away';
}

// Generate a unique 6-character room code
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Create a new game room
export const createGameRoom = async (
  hostId: string, 
  hostName: string, 
  hostCharacter: Character,
  maxPlayers: number = 4,
  isPublic: boolean = false
): Promise<GameRoom> => {
  try {
    const roomCode = generateRoomCode();
    
    // Check if room code already exists
    const existingRoom = await getDocs(query(
      collection(db, 'gameRooms'), 
      where('roomCode', '==', roomCode)
    ));
    
    if (!existingRoom.empty) {
      // If code exists, generate a new one
      return createGameRoom(hostId, hostName, hostCharacter, maxPlayers, isPublic);
    }

    const hostPlayer: Player = {
      id: hostId,
      name: hostName,
      character: hostCharacter,
      isActive: true,
      isCurrentTurn: true
    };

    const gameRoom: GameRoom = {
      id: roomCode,
      roomCode,
      hostId,
      hostName,
      players: [hostPlayer],
      maxPlayers,
      gameState: 'waiting',
      currentPlayerIndex: 0,
      story: '',
      currentScene: '',
      turn: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPublic,
      gameSettings: {
        allowSpectators: true,
        autoSave: true,
        difficulty: 'medium'
      }
    };

    await setDoc(doc(db, 'gameRooms', roomCode), gameRoom);
    
    // Also save to user's rooms collection for easy access
    await setDoc(doc(db, 'users', hostId, 'rooms', roomCode), {
      roomCode,
      isHost: true,
      joinedAt: serverTimestamp()
    });

    return gameRoom;
  } catch (error) {
    console.error('Error creating game room:', error);
    throw error;
  }
};

// Join an existing game room
export const joinGameRoom = async (
  roomCode: string,
  playerId: string,
  playerName: string,
  playerCharacter: Character
): Promise<GameRoom> => {
  try {
    const roomRef = doc(db, 'gameRooms', roomCode);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const room = roomDoc.data() as GameRoom;

    if (room.gameState !== 'waiting') {
      throw new Error('Game has already started');
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    // Check if player is already in the room
    const existingPlayer = room.players.find(p => p.id === playerId);
    if (existingPlayer) {
      throw new Error('You are already in this room');
    }

    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      character: playerCharacter,
      isActive: true,
      isCurrentTurn: false
    };

    // Add player to room
    await updateDoc(roomRef, {
      players: arrayUnion(newPlayer),
      updatedAt: serverTimestamp()
    });

    // Save room reference to user's rooms
    await setDoc(doc(db, 'users', playerId, 'rooms', roomCode), {
      roomCode,
      isHost: false,
      joinedAt: serverTimestamp()
    });

    return { ...room, players: [...room.players, newPlayer] };
  } catch (error) {
    console.error('Error joining game room:', error);
    throw error;
  }
};

// Leave a game room
export const leaveGameRoom = async (roomCode: string, playerId: string): Promise<void> => {
  try {
    const roomRef = doc(db, 'gameRooms', roomCode);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      return;
    }

    const room = roomDoc.data() as GameRoom;
    const updatedPlayers = room.players.filter(p => p.id !== playerId);

    if (updatedPlayers.length === 0) {
      // If no players left, delete the room
      await deleteDoc(roomRef);
    } else {
      // If host left, transfer host to next player
      let newHostId = room.hostId;
      if (room.hostId === playerId) {
        newHostId = updatedPlayers[0].id;
      }

      await updateDoc(roomRef, {
        players: updatedPlayers,
        hostId: newHostId,
        hostName: updatedPlayers.find(p => p.id === newHostId)?.name || room.hostName,
        updatedAt: serverTimestamp()
      });
    }

    // Remove room reference from user's rooms
    await deleteDoc(doc(db, 'users', playerId, 'rooms', roomCode));
  } catch (error) {
    console.error('Error leaving game room:', error);
    throw error;
  }
};

// Start the game
export const startGame = async (roomCode: string): Promise<void> => {
  try {
    const roomRef = doc(db, 'gameRooms', roomCode);
    await updateDoc(roomRef, {
      gameState: 'playing',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error starting game:', error);
    throw error;
  }
};

// Update game state
export const updateGameState = async (
  roomCode: string, 
  updates: Partial<GameSession>
): Promise<void> => {
  try {
    const roomRef = doc(db, 'gameRooms', roomCode);
    await updateDoc(roomRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating game state:', error);
    throw error;
  }
};

// Get public rooms
export const getPublicRooms = async (): Promise<GameRoom[]> => {
  try {
    const roomsRef = collection(db, 'gameRooms');
    const q = query(
      roomsRef,
      where('isPublic', '==', true),
      where('gameState', '==', 'waiting'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GameRoom[];
  } catch (error) {
    console.error('Error getting public rooms:', error);
    return [];
  }
};

// Get user's rooms
export const getUserRooms = async (userId: string): Promise<GameRoom[]> => {
  try {
    const userRoomsRef = collection(db, 'users', userId, 'rooms');
    const querySnapshot = await getDocs(userRoomsRef);
    
    const roomCodes = querySnapshot.docs.map(doc => doc.data().roomCode);
    const rooms: GameRoom[] = [];

    for (const roomCode of roomCodes) {
      const roomDoc = await getDoc(doc(db, 'gameRooms', roomCode));
      if (roomDoc.exists()) {
        rooms.push({ id: roomDoc.id, ...roomDoc.data() } as GameRoom);
      }
    }

    return rooms.sort((a, b) => b.updatedAt?.toDate() - a.updatedAt?.toDate());
  } catch (error) {
    console.error('Error getting user rooms:', error);
    return [];
  }
};

// Listen to room changes in real-time
export const subscribeToRoom = (
  roomCode: string,
  callback: (room: GameRoom | null) => void
): (() => void) => {
  const roomRef = doc(db, 'gameRooms', roomCode);
  
  const unsubscribe = onSnapshot(roomRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as GameRoom);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

// Update player connection status
export const updatePlayerStatus = async (
  roomCode: string,
  playerId: string,
  status: 'connected' | 'disconnected' | 'away'
): Promise<void> => {
  try {
    const roomRef = doc(db, 'gameRooms', roomCode);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) return;

    const room = roomDoc.data() as GameRoom;
    const updatedPlayers = room.players.map(player => 
      player.id === playerId 
        ? { ...player, connectionStatus: status, lastSeen: serverTimestamp() }
        : player
    );

    await updateDoc(roomRef, {
      players: updatedPlayers,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating player status:', error);
  }
};

// Kick player from room (host only)
export const kickPlayer = async (
  roomCode: string,
  hostId: string,
  playerId: string
): Promise<void> => {
  try {
    const roomRef = doc(db, 'gameRooms', roomCode);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const room = roomDoc.data() as GameRoom;

    if (room.hostId !== hostId) {
      throw new Error('Only the host can kick players');
    }

    if (room.hostId === playerId) {
      throw new Error('Host cannot kick themselves');
    }

    await leaveGameRoom(roomCode, playerId);
  } catch (error) {
    console.error('Error kicking player:', error);
    throw error;
  }
}; 

// Save game room state for later resumption
export const saveGameRoom = async (
  roomCode: string,
  userId: string,
  saveName?: string
): Promise<void> => {
  try {
    const roomRef = doc(db, 'gameRooms', roomCode);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const room = roomDoc.data() as GameRoom;
    const saveId = saveName || `save_${Date.now()}`;
    
    // Save to user's saved games collection
    await setDoc(doc(db, 'users', userId, 'savedGames', saveId), {
      roomCode,
      roomData: room,
      saveName: saveName || `Game Save ${new Date().toLocaleDateString()}`,
      savedAt: serverTimestamp(),
      lastPlayed: room.updatedAt
    });

    // Update room with save reference
    await updateDoc(roomRef, {
      lastSaved: serverTimestamp(),
      savedBy: arrayUnion(userId)
    });
  } catch (error) {
    console.error('Error saving game room:', error);
    throw error;
  }
};

// Load saved game room
export const loadSavedGameRoom = async (
  saveId: string,
  userId: string
): Promise<GameRoom | null> => {
  try {
    const saveRef = doc(db, 'users', userId, 'savedGames', saveId);
    const saveDoc = await getDoc(saveRef);

    if (!saveDoc.exists()) {
      return null;
    }

    const saveData = saveDoc.data();
    return saveData.roomData as GameRoom;
  } catch (error) {
    console.error('Error loading saved game room:', error);
    return null;
  }
};

// Get user's saved games
export const getUserSavedGames = async (userId: string): Promise<any[]> => {
  try {
    const savedGamesRef = collection(db, 'users', userId, 'savedGames');
    const q = query(savedGamesRef, orderBy('savedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error loading saved games:', error);
    return [];
  }
};

// Delete saved game
export const deleteSavedGame = async (
  saveId: string,
  userId: string
): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'savedGames', saveId));
  } catch (error) {
    console.error('Error deleting saved game:', error);
    throw error;
  }
};

// Resume game from save
export const resumeGameFromSave = async (
  saveId: string,
  userId: string
): Promise<GameRoom | null> => {
  try {
    const savedGame = await loadSavedGameRoom(saveId, userId);
    if (!savedGame) {
      throw new Error('Saved game not found');
    }

    // Check if the original room still exists
    const roomRef = doc(db, 'gameRooms', savedGame.roomCode);
    const roomDoc = await getDoc(roomRef);

    if (roomDoc.exists()) {
      // Room still exists, return current state
      return { id: roomDoc.id, ...roomDoc.data() } as GameRoom;
    } else {
      // Room was deleted, recreate it with saved data
      const recreatedRoom = {
        ...savedGame,
        id: savedGame.roomCode,
        gameState: 'waiting',
        updatedAt: serverTimestamp()
      };

      await setDoc(roomRef, recreatedRoom);
      return recreatedRoom as GameRoom;
    }
  } catch (error) {
    console.error('Error resuming game from save:', error);
    throw error;
  }
}; 