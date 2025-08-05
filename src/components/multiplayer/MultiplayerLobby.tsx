'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { CharacterCard } from '@/components/ui/CharacterCard';
import { 
  createGameRoom, 
  joinGameRoom, 
  getPublicRooms, 
  getUserRooms,
  getUserSavedGames,
  resumeGameFromSave,
  deleteSavedGame,
  GameRoom 
} from '@/lib/multiplayer';
import { getUserCharacters, loadCharacter } from '@/lib/firestore';
import { Character } from '@/lib/groq';
import { 
  Users, 
  Plus, 
  Search, 
  Copy, 
  RefreshCw, 
  Crown, 
  Clock, 
  Settings,
  ArrowRight,
  Home,
  Filter,
  Star,
  TrendingUp,
  Shield,
  Zap,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  X,
  Info,
  Save,
  Package
} from 'lucide-react';

interface MultiplayerLobbyProps {
  onJoinGame: (room: GameRoom) => void;
  onBackToMenu: () => void;
}

export const MultiplayerLobby = ({ onJoinGame, onBackToMenu }: MultiplayerLobbyProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'public' | 'my-rooms' | 'saved-games'>('create');
  const [roomCode, setRoomCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [userCharacters, setUserCharacters] = useState<Character[]>([]);
  const [publicRooms, setPublicRooms] = useState<GameRoom[]>([]);
  const [userRooms, setUserRooms] = useState<GameRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'waiting' | 'playing' | 'finished'>('all');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [gameSettings, setGameSettings] = useState({
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    allowSpectators: true,
    autoSave: true,
    voiceChat: false
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showSavedGames, setShowSavedGames] = useState(false);
  const [savedGames, setSavedGames] = useState<any[]>([]);
  const [isLoadingSaves, setIsLoadingSaves] = useState(false);
  const [isDeletingSave, setIsDeletingSave] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserCharacters();
      loadPublicRooms();
      loadUserRooms();
    }
  }, [user]);

  // Load saved games when the saved-games tab is selected
  useEffect(() => {
    if (activeTab === 'saved-games' && user) {
      loadSavedGames();
    }
  }, [activeTab, user]);

  const loadUserCharacters = async () => {
    if (!user) return;
    try {
      const characters = await getUserCharacters(user.uid);
      setUserCharacters(characters);
      if (characters.length > 0) {
        setSelectedCharacter(characters[0]);
      }
    } catch (error) {
      console.error('Error loading characters:', error);
    }
  };

  const loadPublicRooms = async () => {
    try {
      const rooms = await getPublicRooms();
      setPublicRooms(rooms);
    } catch (error) {
      console.error('Error loading public rooms:', error);
    }
  };

  const loadUserRooms = async () => {
    if (!user) return;
    try {
      const rooms = await getUserRooms(user.uid);
      setUserRooms(rooms);
    } catch (error) {
      console.error('Error loading user rooms:', error);
    }
  };

  const loadSavedGames = async () => {
    if (!user) return;
    setIsLoadingSaves(true);
    try {
      const saves = await getUserSavedGames(user.uid);
      setSavedGames(saves);
    } catch (error) {
      console.error('Error loading saved games:', error);
      setError('Failed to load saved games');
    } finally {
      setIsLoadingSaves(false);
    }
  };

  const handleLoadSavedGame = async (saveId: string) => {
    if (!user) return;
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const loadedRoom = await resumeGameFromSave(saveId, user.uid);
      if (loadedRoom) {
        setSuccess('Game loaded successfully!');
        setTimeout(() => {
          onJoinGame(loadedRoom);
        }, 1000);
      } else {
        setError('Failed to load saved game');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load saved game');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSavedGame = async (saveId: string) => {
    if (!user) return;
    setIsDeletingSave(saveId);
    try {
      await deleteSavedGame(saveId, user.uid);
      setSuccess('Save deleted successfully!');
      await loadSavedGames(); // Refresh the list
    } catch (error: any) {
      setError(error.message || 'Failed to delete save');
    } finally {
      setIsDeletingSave(null);
    }
  };

  const handleCreateRoom = async () => {
    if (!user || !selectedCharacter) {
      setError('Please select a character first');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const room = await createGameRoom(
        user.uid,
        user.displayName || user.email || 'Player',
        selectedCharacter,
        maxPlayers,
        isPublic
      );

      setSuccess(`Room created successfully! Code: ${room.roomCode}`);
      setCopiedCode(room.roomCode);
      setTimeout(() => {
        onJoinGame(room);
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!user || !selectedCharacter) {
      setError('Please select a character first');
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const room = await joinGameRoom(
        roomCode.toUpperCase(),
        user.uid,
        user.displayName || user.email || 'Player',
        selectedCharacter
      );

      setSuccess('Successfully joined room!');
      setTimeout(() => {
        onJoinGame(room);
      }, 1000);
    } catch (error: any) {
      setError(error.message || 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setSuccess('Room code copied to clipboard!');
    setTimeout(() => {
      setCopiedCode(null);
      setSuccess('');
    }, 2000);
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'disconnected': return <WifiOff className="h-4 w-4 text-red-500" />;
      default: return <Wifi className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <Shield className="h-4 w-4 text-green-500" />;
      case 'medium': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'hard': return <Star className="h-4 w-4 text-red-500" />;
      default: return <Zap className="h-4 w-4 text-yellow-500" />;
    }
  };

  const filteredPublicRooms = publicRooms.filter(room => {
    const matchesSearch = room.hostName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.roomCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || room.gameState === filterType;
    return matchesSearch && matchesFilter;
  });

  const filteredUserRooms = userRooms.filter(room => {
    const matchesSearch = room.hostName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.roomCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || room.gameState === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Multiplayer Lobby
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Create or join epic multiplayer adventures
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Connected</span>
              </div>
              <Button
                onClick={onBackToMenu}
                variant="secondary"
                icon={<Home className="h-5 w-5" />}
                className="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Menu
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
            <nav className="flex space-x-1 p-2">
              {[
                { id: 'create', label: 'Create Room', icon: Plus, color: 'from-green-500 to-emerald-500' },
                { id: 'join', label: 'Join Room', icon: Search, color: 'from-blue-500 to-cyan-500' },
                { id: 'public', label: 'Public Rooms', icon: Users, color: 'from-purple-500 to-pink-500' },
                { id: 'my-rooms', label: 'My Rooms', icon: Crown, color: 'from-yellow-500 to-orange-500' },
                { id: 'saved-games', label: 'Saved Games', icon: Save, color: 'from-indigo-500 to-purple-500' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Enhanced Character Selection */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span>Select Your Character</span>
                </h3>
                <Button
                  onClick={loadUserCharacters}
                  variant="secondary"
                  icon={<RefreshCw className="h-4 w-4" />}
                  size="sm"
                >
                  Refresh
                </Button>
              </div>
              
              {userCharacters.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border-2 border-dashed border-purple-200 dark:border-purple-700">
                  <div className="text-6xl mb-4">🎭</div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No characters found. Create your first character to start playing!
                  </p>
                  <Button
                    onClick={() => window.location.href = '/character'}
                    variant="primary"
                    icon={<Plus className="h-5 w-5" />}
                    className="bg-gradient-to-r from-purple-500 to-blue-500"
                  >
                    Create Character
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {userCharacters.map((character) => (
                    <div
                      key={character.name}
                      onClick={() => setSelectedCharacter(character)}
                      className={`cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                        selectedCharacter?.name === character.name
                          ? 'ring-4 ring-purple-500 shadow-2xl scale-105'
                          : 'hover:shadow-lg'
                      }`}
                    >
                      <CharacterCard
                        character={character}
                        showDetails={false}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enhanced Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-800 dark:text-red-200">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <p className="text-green-800 dark:text-green-200">{success}</p>
                <button
                  onClick={() => setSuccess('')}
                  className="ml-auto text-green-500 hover:text-green-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Enhanced Tab Content */}
            {activeTab === 'create' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Players
                      </label>
                      <select
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                      >
                        {[2, 3, 4, 5, 6].map(num => (
                          <option key={num} value={num}>{num} Players</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="isPublic" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Make room public
                      </label>
                      <Info className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                      className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Advanced Settings</span>
                    </button>
                    
                    {showAdvancedSettings && (
                      <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Difficulty
                          </label>
                          <select
                            value={gameSettings.difficulty}
                            onChange={(e) => setGameSettings({...gameSettings, difficulty: e.target.value as any})}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="allowSpectators"
                            checked={gameSettings.allowSpectators}
                            onChange={(e) => setGameSettings({...gameSettings, allowSpectators: e.target.checked})}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <label htmlFor="allowSpectators" className="text-xs text-gray-600 dark:text-gray-400">
                            Allow spectators
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="autoSave"
                            checked={gameSettings.autoSave}
                            onChange={(e) => setGameSettings({...gameSettings, autoSave: e.target.checked})}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <label htmlFor="autoSave" className="text-xs text-gray-600 dark:text-gray-400">
                            Auto-save progress
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={handleCreateRoom}
                  disabled={isLoading || !selectedCharacter}
                  variant="primary"
                  icon={isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-4 text-lg font-semibold"
                >
                  {isLoading ? 'Creating Room...' : 'Create Room'}
                </Button>
              </div>
            )}

            {activeTab === 'join' && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">🎮</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Join a Game Room
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Enter the 6-digit room code to join an existing game
                  </p>
                </div>
                
                <Input
                  label="Room Code"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit room code"
                  maxLength={6}
                  icon={<Search className="h-5 w-5" />}
                  className="text-center text-2xl font-mono tracking-widest"
                />
                
                <Button
                  onClick={handleJoinRoom}
                  disabled={isLoading || !selectedCharacter || !roomCode}
                  variant="primary"
                  icon={isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-4 text-lg font-semibold"
                >
                  {isLoading ? 'Joining Room...' : 'Join Room'}
                </Button>
              </div>
            )}

            {activeTab === 'public' && (
              <div className="space-y-6">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      label="Search Rooms"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by host name or room code..."
                      icon={<Search className="h-5 w-5" />}
                    />
                  </div>
                  <div className="flex items-end">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Rooms</option>
                      <option value="waiting">Waiting</option>
                      <option value="playing">Playing</option>
                      <option value="finished">Finished</option>
                    </select>
                  </div>
                  <Button
                    onClick={loadPublicRooms}
                    variant="secondary"
                    icon={<RefreshCw className="h-4 w-4" />}
                  >
                    Refresh
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Public Rooms ({filteredPublicRooms.length})
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Active</span>
                  </div>
                </div>

                {filteredPublicRooms.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">No public rooms available</p>
                    <p className="text-sm text-gray-500">Try creating your own room or check back later!</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredPublicRooms.map((room) => (
                      <div
                        key={room.roomCode}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 hover:shadow-lg bg-white dark:bg-gray-800"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <Crown className="h-5 w-5 text-yellow-500" />
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {room.hostName}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                room.gameState === 'playing' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                room.gameState === 'waiting' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                              }`}>
                                {room.gameState}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {room.players.length}/{room.maxPlayers} Players
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(room.createdAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {getDifficultyIcon(room.gameSettings?.difficulty || 'medium')}
                                <span className="capitalize">{room.gameSettings?.difficulty || 'medium'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-center">
                              <div className="text-2xl font-mono font-bold text-purple-600 dark:text-purple-400">
                                {room.roomCode}
                              </div>
                              <button
                                onClick={() => copyRoomCode(room.roomCode)}
                                className="text-xs text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                              >
                                {copiedCode === room.roomCode ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                            <Button
                              onClick={() => {
                                setRoomCode(room.roomCode);
                                setActiveTab('join');
                              }}
                              variant="primary"
                              size="sm"
                              className="bg-gradient-to-r from-purple-500 to-blue-500"
                            >
                              Join
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'my-rooms' && (
              <div className="space-y-6">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      label="Search My Rooms"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by host name or room code..."
                      icon={<Search className="h-5 w-5" />}
                    />
                  </div>
                  <div className="flex items-end">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Rooms</option>
                      <option value="waiting">Waiting</option>
                      <option value="playing">Playing</option>
                      <option value="finished">Finished</option>
                    </select>
                  </div>
                  <Button
                    onClick={loadUserRooms}
                    variant="secondary"
                    icon={<RefreshCw className="h-4 w-4" />}
                  >
                    Refresh
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    My Rooms ({filteredUserRooms.length})
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span>Host</span>
                  </div>
                </div>

                {filteredUserRooms.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl">
                    <Crown className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">You haven't joined any rooms yet</p>
                    <p className="text-sm text-gray-500">Create a room or join a public one to get started!</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredUserRooms.map((room) => (
                      <div
                        key={room.roomCode}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 hover:shadow-lg bg-white dark:bg-gray-800"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              {room.hostId === user?.uid && (
                                <Crown className="h-5 w-5 text-yellow-500" />
                              )}
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {room.hostName}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                room.gameState === 'playing' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                room.gameState === 'waiting' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                              }`}>
                                {room.gameState}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {room.players.length}/{room.maxPlayers} Players
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>Updated: {formatDate(room.updatedAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {getDifficultyIcon(room.gameSettings?.difficulty || 'medium')}
                                <span className="capitalize">{room.gameSettings?.difficulty || 'medium'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-center">
                              <div className="text-2xl font-mono font-bold text-purple-600 dark:text-purple-400">
                                {room.roomCode}
                              </div>
                              <button
                                onClick={() => copyRoomCode(room.roomCode)}
                                className="text-xs text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                              >
                                {copiedCode === room.roomCode ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                            <Button
                              onClick={() => onJoinGame(room)}
                              variant="primary"
                              size="sm"
                              disabled={room.gameState === 'finished'}
                              className="bg-gradient-to-r from-green-500 to-emerald-500"
                            >
                              {room.gameState === 'finished' ? 'Finished' : 'Rejoin'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'saved-games' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Saved Games
                  </h3>
                  <Button
                    onClick={loadSavedGames}
                    variant="secondary"
                    icon={<RefreshCw className="h-4 w-4" />}
                    disabled={isLoadingSaves}
                  >
                    {isLoadingSaves ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>

                {isLoadingSaves ? (
                  <div className="text-center py-16">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-600 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading saved games...</p>
                  </div>
                ) : savedGames.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl">
                    <Save className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">No Saved Games</p>
                    <p className="text-sm text-gray-500">Save your multiplayer games from the game room to resume them later!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedGames.map((save) => (
                      <div
                        key={save.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 hover:shadow-lg bg-white dark:bg-gray-800"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <Save className="h-5 w-5 text-purple-500" />
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {save.saveName}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Room: {save.roomCode}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>Saved: {formatDate(save.savedAt)}</span>
                              </div>
                              {save.lastPlayed && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>Last played: {formatDate(save.lastPlayed)}</span>
                                  </div>
                                </>
                              )}
                            </div>
                            {save.roomData && (
                              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center space-x-4">
                                  <span>{save.roomData.players?.length || 0} Players</span>
                                  <span>•</span>
                                  <span className={`capitalize ${
                                    save.roomData.gameState === 'playing' ? 'text-green-600' :
                                    save.roomData.gameState === 'waiting' ? 'text-yellow-600' :
                                    'text-gray-600'
                                  }`}>
                                    {save.roomData.gameState || 'unknown'}
                                  </span>
                                  {save.roomData.turn && (
                                    <>
                                      <span>•</span>
                                      <span>Turn {save.roomData.turn}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => handleLoadSavedGame(save.id)}
                              variant="primary"
                              size="sm"
                              disabled={isLoading}
                              icon={<Package className="h-4 w-4" />}
                              className="bg-gradient-to-r from-purple-500 to-blue-500"
                            >
                              {isLoading ? 'Loading...' : 'Load'}
                            </Button>
                            <Button
                              onClick={() => handleDeleteSavedGame(save.id)}
                              variant="secondary"
                              size="sm"
                              disabled={isDeletingSave === save.id}
                              icon={isDeletingSave === save.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                              className="text-red-600 hover:text-red-700"
                            >
                              {isDeletingSave === save.id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 