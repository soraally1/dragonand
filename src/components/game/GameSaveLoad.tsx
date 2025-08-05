'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GameSession } from '@/lib/groq';
import { 
  saveGameSession, 
  getUserGames, 
  loadGameSession, 
  deleteGameSession 
} from '@/lib/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  Save, 
  Download, 
  Trash2, 
  Calendar, 
  Users, 
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface GameSaveLoadProps {
  currentGame: GameSession;
  onLoadGame: (game: GameSession) => void;
  onSaveSuccess?: () => void;
}

export const GameSaveLoad = ({ currentGame, onLoadGame, onSaveSuccess }: GameSaveLoadProps) => {
  const { user } = useAuth();
  const [savedGames, setSavedGames] = useState<GameSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSavedGames();
    }
  }, [user]);

  const loadSavedGames = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const games = await getUserGames(user.uid);
      setSavedGames(games);
    } catch (error) {
      console.error('Error loading saved games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGame = async () => {
    if (!user) return;

    setSaveStatus('saving');
    try {
      const success = await saveGameSession(currentGame, user.uid);
      if (success) {
        setSaveStatus('success');
        onSaveSuccess?.();
        loadSavedGames(); // Refresh the list
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error saving game:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleLoadGame = async (gameId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const game = await loadGameSession(gameId, user.uid);
      if (game) {
        onLoadGame(game);
        setSelectedGame(null);
      }
    } catch (error) {
      console.error('Error loading game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!user) return;

    if (confirm('Are you sure you want to delete this saved game? This action cannot be undone.')) {
      try {
        await deleteGameSession(gameId, user.uid);
        loadSavedGames(); // Refresh the list
      } catch (error) {
        console.error('Error deleting game:', error);
      }
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const getGameStatusColor = (gameState: string) => {
    switch (gameState) {
      case 'playing': return 'text-green-600';
      case 'waiting': return 'text-yellow-600';
      case 'finished': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Save Current Game */}
      <Card title="Save Current Game">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {currentGame.players.length} Players • Turn {currentGame.turn}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last updated: {formatDate(currentGame.updatedAt)}
              </p>
            </div>
            <Button
              onClick={handleSaveGame}
              disabled={saveStatus === 'saving' || !user}
              variant="primary"
              icon={
                saveStatus === 'saving' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : saveStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : saveStatus === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )
              }
            >
              {saveStatus === 'saving' ? 'Saving...' : 
               saveStatus === 'success' ? 'Saved!' : 
               saveStatus === 'error' ? 'Error' : 'Save Game'}
            </Button>
          </div>
          
          {!user && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Please log in to save your game progress.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Load Saved Games */}
      <Card title="Load Saved Games">
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : savedGames.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No saved games found</p>
              <p className="text-sm">Save your current game to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedGames.map((game) => (
                <div
                  key={game.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedGame === game.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {game.players.length} Players
                        </span>
                        <span className="text-gray-500">•</span>
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Turn {game.turn}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className={`text-sm font-medium ${getGameStatusColor(game.gameState)}`}>
                          {game.gameState}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(game.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Updated: {formatDate(game.updatedAt)}</span>
                        </div>
                      </div>

                      {game.currentScene && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <strong>Scene:</strong> {game.currentScene}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleLoadGame(game.id)}
                        variant="secondary"
                        size="sm"
                        disabled={isLoading}
                      >
                        Load
                      </Button>
                      <Button
                        onClick={() => handleDeleteGame(game.id)}
                        variant="secondary"
                        size="sm"
                        icon={<Trash2 className="h-4 w-4" />}
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
      </Card>
    </div>
  );
}; 