'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CharacterCard } from '@/components/ui/CharacterCard';
import { GameSaveLoad } from '@/components/game/GameSaveLoad';
import { DiceRoller } from '@/components/ui/DiceRoller';
import { 
  subscribeToRoom, 
  updateGameState, 
  leaveGameRoom, 
  kickPlayer,
  updatePlayerStatus,
  saveGameRoom,
  getUserSavedGames,
  deleteSavedGame,
  resumeGameFromSave,
  GameRoom 
} from '@/lib/multiplayer';
import { 
  generateDungeonMasterResponse, 
  generatePlayerActions,
  GameAction 
} from '@/lib/groq';
import { 
  addExperience, 
  unlockSkill, 
  addItemToInventory 
} from '@/lib/firestore';
import { 
  Crown, 
  Users, 
  MessageSquare, 
  ArrowRight, 
  RefreshCw, 
  Home, 
  Save, 
  Star, 
  Package, 
  Award,
  Copy,
  Settings,
  LogOut,
  UserX,
  X,
  Sword
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { getProfileIconEmoji } from '@/lib/characterUtils';

// Function to format Dungeon Master responses with better visual formatting
const formatDungeonMasterText = (text: string): React.ReactElement => {
  if (!text) return <span>Selamat datang di petualangan Anda! Dungeon Master sedang mempersiapkan cerita...</span>;
  
  // Split text into paragraphs
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  
  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => {
        // Format bold text (**text** -> <strong>text</strong>)
        const formattedParagraph = paragraph
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\n/g, '<br />');
        
        return (
          <p 
            key={index} 
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedParagraph }}
          />
        );
      })}
    </div>
  );
};

interface MultiplayerGameRoomProps {
  room: GameRoom;
  onLeaveRoom: () => void;
}

export const MultiplayerGameRoom = ({ room, onLeaveRoom }: MultiplayerGameRoomProps) => {
  const { user } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<GameRoom>(room);
  const [dungeonMasterResponse, setDungeonMasterResponse] = useState(room.story || '');
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [showCharacterDetails, setShowCharacterDetails] = useState<string | null>(null);
  const [gameEvents, setGameEvents] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [savedGames, setSavedGames] = useState<any[]>([]);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSaves, setIsLoadingSaves] = useState(false);

  const currentPlayer = currentRoom.players[currentRoom.currentPlayerIndex];
  const isHost = currentRoom.hostId === user?.uid;
  const isMyTurn = currentPlayer?.id === user?.uid;

  useEffect(() => {
    // Subscribe to room changes
    const unsubscribe = subscribeToRoom(room.roomCode, (updatedRoom) => {
      if (updatedRoom) {
        setCurrentRoom(updatedRoom);
        setDungeonMasterResponse(updatedRoom.story || '');
        
        // Generate actions for current player if it's their turn
        if (updatedRoom.gameState === 'playing' && updatedRoom.players[updatedRoom.currentPlayerIndex]?.id === user?.uid) {
          generateActionsForPlayer(updatedRoom.players[updatedRoom.currentPlayerIndex]);
        }
      } else {
        // Room was deleted
        onLeaveRoom();
      }
    });

    // Update player status to connected
    if (user) {
      updatePlayerStatus(room.roomCode, user.uid, 'connected');
    }

    // Start game if it hasn't started yet and we're the host
    if (currentRoom.gameState === 'waiting' && isHost && currentRoom.players.length >= 2) {
      startGame();
    }

    return () => {
      unsubscribe();
      // Update player status to disconnected
      if (user) {
        updatePlayerStatus(room.roomCode, user.uid, 'disconnected');
      }
    };
  }, [room.roomCode, user, isHost]);

  // Load saved games when save/load modal is opened
  useEffect(() => {
    if (showSaveLoad && user) {
      loadSavedGames();
    }
  }, [showSaveLoad, user]);

  const loadSavedGames = async () => {
    if (!user) return;
    setIsLoadingSaves(true);
    try {
      const saves = await getUserSavedGames(user.uid);
      setSavedGames(saves);
    } catch (error) {
      console.error('Error loading saved games:', error);
    } finally {
      setIsLoadingSaves(false);
    }
  };

  const handleSaveGame = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await saveGameRoom(currentRoom.roomCode, user.uid, saveName);
      setGameEvents(prev => [...prev, '💾 Game saved successfully!']);
      setSaveName('');
      await loadSavedGames(); // Refresh the list
    } catch (error) {
      console.error('Error saving game:', error);
      setGameEvents(prev => [...prev, '❌ Failed to save game']);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadGame = async (saveId: string) => {
    if (!user) return;
    try {
      const loadedRoom = await resumeGameFromSave(saveId, user.uid);
      if (loadedRoom) {
        setGameEvents(prev => [...prev, '📂 Game loaded successfully!']);
        // Navigate to the loaded room
        onLeaveRoom(); // Assuming onLeaveRoom will handle navigation or state update
      }
    } catch (error) {
      console.error('Error loading game:', error);
      setGameEvents(prev => [...prev, '❌ Failed to load game']);
    }
  };

  const handleDeleteSave = async (saveId: string) => {
    if (!user) return;
    try {
      await deleteSavedGame(saveId, user.uid);
      await loadSavedGames(); // Refresh the list
      setGameEvents(prev => [...prev, '🗑️ Save deleted']);
    } catch (error) {
      console.error('Error deleting save:', error);
      setGameEvents(prev => [...prev, '❌ Failed to delete save']);
    }
  };

  const startGame = async () => {
    setIsLoading(true);
    try {
      // Generate initial story
      const response = await generateDungeonMasterResponse({
        id: currentRoom.roomCode,
        players: currentRoom.players,
        currentPlayerIndex: 0,
        gameState: 'playing',
        story: '',
        currentScene: '',
        turn: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update room state
      await updateGameState(currentRoom.roomCode, {
        gameState: 'playing',
        story: response,
        currentScene: 'Opening Scene',
        currentPlayerIndex: 0,
        turn: 1
      });

      // Generate actions for first player
      if (currentRoom.players[0]) {
        generateActionsForPlayer(currentRoom.players[0]);
      }
    } catch (error) {
      console.error('Error starting game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateActionsForPlayer = async (player: any) => {
    try {
      const actions = await generatePlayerActions({
        ...currentRoom,
        story: currentRoom.story || '',
        currentScene: currentRoom.currentScene || 'Memulai petualangan',
        turn: currentRoom.turn,
        players: currentRoom.players,
        currentPlayerIndex: currentRoom.currentPlayerIndex
      }, player);
      setSuggestedActions(actions);
    } catch (error) {
      console.error('Error generating actions:', error);
      setSuggestedActions([
        "Jelajahi area sekitar",
        "Bicara dengan NPC terdekat",
        "Cari petunjuk atau barang berguna",
        "Bersiap untuk pertarungan",
        "Gunakan sihir atau kemampuan khusus",
        "Pindah ke lokasi yang berbeda"
      ]);
    }
  };

  const handlePlayerAction = async (actionDescription: string) => {
    if (!currentPlayer || !isMyTurn) return;

    setIsLoading(true);
    try {
      // Create a game action with potential rewards
      const action: GameAction = {
        type: 'explore',
        description: actionDescription,
        roll: Math.floor(Math.random() * 20) + 1,
        experienceGained: Math.floor(Math.random() * 50) + 10,
        skillsUnlocked: actionDescription.toLowerCase().includes('magic') ? ['Spell Mastery'] : [],
        itemsFound: Math.random() > 0.7 ? [{
          name: 'Mysterious Gem',
          type: 'treasure',
          rarity: 'uncommon',
          description: 'A glowing gem that seems to pulse with energy',
          value: 25,
          quantity: 1,
          effects: ['Unknown magical properties']
        }] : []
      };

      // Generate DM response with enhanced story continuity
      const response = await generateDungeonMasterResponse({
        ...currentRoom,
        story: currentRoom.story || '',
        currentScene: currentRoom.currentScene || 'Memulai petualangan',
        turn: currentRoom.turn,
        players: currentRoom.players,
        currentPlayerIndex: currentRoom.currentPlayerIndex
      }, action);

      // Handle experience and rewards
      if (user && action.experienceGained) {
        const levelResult = await addExperience(currentPlayer.character.name, user.uid, action.experienceGained);
        if (levelResult?.leveledUp) {
          setGameEvents(prev => [...prev, `🎉 ${currentPlayer.character.name} leveled up to level ${levelResult.newLevel}!`]);
        }
        setGameEvents(prev => [...prev, `✨ ${currentPlayer.character.name} gained ${action.experienceGained} experience!`]);
      }

      // Handle skill unlocking
      if (user && action.skillsUnlocked?.length) {
        for (const skillName of action.skillsUnlocked) {
          await unlockSkill(currentPlayer.character.name, user.uid, skillName);
          setGameEvents(prev => [...prev, `🎯 ${currentPlayer.character.name} unlocked skill: ${skillName}!`]);
        }
      }

      // Handle item discovery
      if (user && action.itemsFound?.length) {
        for (const item of action.itemsFound) {
          await addItemToInventory(currentPlayer.character.name, user.uid, item);
          setGameEvents(prev => [...prev, `💎 ${currentPlayer.character.name} found: ${item.name}!`]);
        }
      }

      // Calculate next player
      const nextPlayerIndex = (currentRoom.currentPlayerIndex + 1) % currentRoom.players.length;
      const updatedPlayers = currentRoom.players.map((p, index) => ({
        ...p,
        isCurrentTurn: index === nextPlayerIndex
      }));

      // Update room state
      await updateGameState(currentRoom.roomCode, {
        story: response,
        currentScene: `Scene ${currentRoom.turn + 1}`,
        currentPlayerIndex: nextPlayerIndex,
        players: updatedPlayers,
        turn: nextPlayerIndex === 0 ? currentRoom.turn + 1 : currentRoom.turn
      });

      // Generate actions for next player
      const nextPlayer = updatedPlayers[nextPlayerIndex];
      if (nextPlayer) {
        generateActionsForPlayer(nextPlayer);
      }
    } catch (error) {
      console.error('Error handling player action:', error);
      setDungeonMasterResponse('The Dungeon Master is thinking about your action...');
    } finally {
      setIsLoading(false);
    }
  };

  const customAction = async () => {
    const action = prompt('Deskripsikan aksi Anda (gunakan Bahasa Indonesia):');
    if (action) {
      await handlePlayerAction(action);
    }
  };

  const handleLeaveRoom = async () => {
    if (user) {
      try {
        await leaveGameRoom(currentRoom.roomCode, user.uid);
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    }
    onLeaveRoom();
  };

  const handleKickPlayer = async (playerId: string) => {
    if (!isHost) return;
    
    try {
      await kickPlayer(currentRoom.roomCode, user!.uid, playerId);
    } catch (error) {
      console.error('Error kicking player:', error);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(currentRoom.roomCode);
    setGameEvents(prev => [...prev, '📋 Room code copied to clipboard!']);
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Crown className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Multiplayer Game
                </h1>
                <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                  <span>Room: {currentRoom.roomCode}</span>
                  <span>•</span>
                  <span>Turn {currentRoom.turn}</span>
                  <span>•</span>
                  <span>{currentRoom.players.length}/{currentRoom.maxPlayers} Players</span>
                  {isHost && <span className="text-yellow-600">• Host</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowSaveLoad(true)}
                variant="secondary"
                icon={<Save className="h-5 w-5" />}
                size="sm"
              >
                Save/Load
              </Button>
              <Button
                onClick={copyRoomCode}
                variant="secondary"
                icon={<Copy className="h-5 w-5" />}
                size="sm"
              >
                Copy Code
              </Button>
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="secondary"
                icon={<Settings className="h-5 w-5" />}
                size="sm"
              >
                Settings
              </Button>
              <Button
                onClick={handleLeaveRoom}
                variant="secondary"
                icon={<LogOut className="h-5 w-5" />}
              >
                Leave
              </Button>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card title="Room Settings">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Room Info</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Code:</strong> {currentRoom.roomCode}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Host:</strong> {currentRoom.hostName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Created:</strong> {formatDate(currentRoom.createdAt)}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Game Settings</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Difficulty:</strong> {currentRoom.gameSettings.difficulty}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Auto Save:</strong> {currentRoom.gameSettings.autoSave ? 'On' : 'Off'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Spectators:</strong> {currentRoom.gameSettings.allowSpectators ? 'Allowed' : 'Not Allowed'}
                  </p>
                </div>
              </div>
              
              {isHost && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Player Management</h4>
                  <div className="space-y-2">
                    {currentRoom.players.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="flex items-center space-x-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{player.character.name}</span>
                            <span className="text-xs text-gray-500">{player.name}</span>
                          </div>
                          {player.id === currentRoom.hostId && <Crown className="h-4 w-4 text-yellow-500" />}
                          <span className={`text-xs px-2 py-1 rounded ${
                            player.connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                            player.connectionStatus === 'away' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {player.connectionStatus}
                          </span>
                        </div>
                        {player.id !== user?.uid && (
                          <Button
                            onClick={() => handleKickPlayer(player.id)}
                            variant="secondary"
                            size="sm"
                            icon={<UserX className="h-4 w-4" />}
                            className="text-red-600 hover:text-red-700"
                          >
                            Kick
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Save/Load Modal */}
        {showSaveLoad && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Save & Load Games
                </h2>
                <button
                  onClick={() => setShowSaveLoad(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Save Current Game */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                    <Save className="h-5 w-5 text-green-600" />
                    <span>Save Current Game</span>
                  </h3>
                  <div className="flex space-x-3">
                    <Input
                      label="Save Name"
                      type="text"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="Enter save name..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSaveGame}
                      disabled={isSaving || !saveName.trim()}
                      variant="primary"
                      icon={isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      className="bg-gradient-to-r from-green-500 to-emerald-500"
                    >
                      {isSaving ? 'Saving...' : 'Save Game'}
                    </Button>
                  </div>
                </div>

                {/* Load Saved Games */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <span>Load Saved Games</span>
                  </h3>
                  
                  {isLoadingSaves ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                      <p className="text-gray-600 dark:text-gray-400 mt-2">Loading saves...</p>
                    </div>
                  ) : savedGames.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">No saved games found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedGames.map((save) => (
                        <div
                          key={save.id}
                          className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {save.saveName}
                              </h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                <span>Room: {save.roomCode}</span>
                                <span>•</span>
                                <span>Saved: {formatDate(save.savedAt)}</span>
                                {save.lastPlayed && (
                                  <>
                                    <span>•</span>
                                    <span>Last played: {formatDate(save.lastPlayed)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => handleLoadGame(save.id)}
                                variant="primary"
                                size="sm"
                                icon={<Package className="h-4 w-4" />}
                                className="bg-gradient-to-r from-blue-500 to-cyan-500"
                              >
                                Load
                              </Button>
                              <Button
                                onClick={() => handleDeleteSave(save.id)}
                                variant="secondary"
                                size="sm"
                                icon={<X className="h-4 w-4" />}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Events */}
        {gameEvents.length > 0 && (
          <div className="mb-6">
            <Card title="Peristiwa Terbaru">
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {gameEvents.slice(-5).map((event, index) => (
                  <div key={index} className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded border-l-4 border-purple-500">
                    {event}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Story Progress */}
        {currentRoom.story && (
          <div className="mb-6">
            <Card title="Progress Cerita">
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Turn:</span>
                  <span className="font-semibold text-purple-600">{currentRoom.turn}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Adegan:</span>
                  <span className="font-semibold text-purple-600">{currentRoom.currentScene}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span className={`font-semibold px-2 py-1 rounded text-xs ${
                    currentRoom.gameState === 'playing' ? 'bg-green-100 text-green-800' :
                    currentRoom.gameState === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {currentRoom.gameState === 'playing' ? 'Sedang Bermain' :
                     currentRoom.gameState === 'waiting' ? 'Menunggu Pemain' : 'Selesai'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dungeon Master Area */}
            <Card title="Dungeon Master">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-4">
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-purple-600" />
                        <span className="text-purple-700 font-medium">Dungeon Master sedang berpikir...</span>
                      </div>
                    ) : (
                      formatDungeonMasterText(dungeonMasterResponse || 'Selamat datang di petualangan Anda! Dungeon Master sedang mempersiapkan cerita...')
                    )}
                  </div>
                </div>

                {currentRoom.currentScene && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Current Scene:</strong> {currentRoom.currentScene}
                  </div>
                )}
              </div>
            </Card>

            {/* Player Actions */}
            {currentPlayer && isMyTurn && currentRoom.gameState === 'playing' && (
              <Card title={`${currentPlayer.character.name}'s Turn`}>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-2xl">
                      {getProfileIconEmoji(currentPlayer.character.profileIcon)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {currentPlayer.character.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentPlayer.character.race} {currentPlayer.character.class} (Level {currentPlayer.character.level})
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                      <Sword className="h-4 w-4 mr-2 text-purple-600" />
                      Pilihan Aksi
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {suggestedActions.map((action, index) => (
                        <Button
                          key={index}
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePlayerAction(action)}
                          disabled={isLoading}
                          className="text-left justify-start h-auto py-3 px-4 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                        >
                          <ArrowRight className="h-4 w-4 mr-2 flex-shrink-0 text-purple-600" />
                          <span className="text-sm font-medium">{action}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={customAction}
                      variant="primary"
                      disabled={isLoading}
                      icon={<MessageSquare className="h-5 w-5" />}
                    >
                      Custom Action
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Waiting for other players */}
            {currentRoom.gameState === 'waiting' && (
              <Card title="Waiting for Players">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Waiting for more players to join...
                  </p>
                  {isHost && currentRoom.players.length >= 2 && (
                    <Button
                      onClick={startGame}
                      variant="primary"
                      className="mt-4"
                      disabled={isLoading}
                    >
                      Start Game
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* Not your turn */}
            {currentPlayer && !isMyTurn && currentRoom.gameState === 'playing' && (
              <Card title="Waiting for Turn">
                <div className="text-center py-8">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-spin" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Waiting for {currentPlayer.character.name} to take their turn...
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Player List */}
          <div className="space-y-6">
            <Card title="Players">
              <div className="space-y-4">
                {currentRoom.players.map((player) => (
                  <CharacterCard
                    key={player.id}
                    character={player.character}
                    isCurrentTurn={player.isCurrentTurn}
                    showDetails={showCharacterDetails === player.id}
                    onToggleDetails={() => setShowCharacterDetails(
                      showCharacterDetails === player.id ? null : player.id
                    )}
                  />
                ))}
              </div>
            </Card>

            {/* Dice Roller */}
            <Card title="Dice Roller">
              <DiceRoller onRoll={(result) => console.log('Dice roll result:', result)} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}; 