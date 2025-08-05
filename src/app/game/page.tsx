'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { GameModeSelector } from '@/components/game/GameModeSelector';
import { PlayerSetup } from '@/components/game/PlayerSetup';
import { GameArea } from '@/components/game/GameArea';
import { MultiplayerLobby } from '@/components/multiplayer/MultiplayerLobby';
import { MultiplayerGameRoom } from '@/components/multiplayer/MultiplayerGameRoom';
import { Player } from '@/lib/groq';
import { GameRoom } from '@/lib/multiplayer';

type GameState = 'mode-selection' | 'player-setup' | 'playing' | 'multiplayer-lobby' | 'multiplayer-game';

export default function GamePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>('mode-selection');
  const [selectedMode, setSelectedMode] = useState<'solo' | 'multiplayer' | null>(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [checkingCharacter, setCheckingCharacter] = useState(true);

  // Check if user has a character
  useEffect(() => {
    const checkUserCharacter = async () => {
      if (!user) {
        setCheckingCharacter(false);
        return;
      }

      try {
        console.log('Checking if user has character:', user.uid);
        const characterDoc = await getDoc(doc(db, 'users', user.uid, 'characters', 'main'));
        
        if (!characterDoc.exists()) {
          console.log('No character found, redirecting to character creation');
          router.push('/character');
          return;
        }
        
        console.log('Character found, allowing access to game');
        setCheckingCharacter(false);
      } catch (error) {
        console.error('Error checking character:', error);
        // On error, redirect to character creation to be safe
        router.push('/character');
      }
    };

    if (!authLoading && user) {
      checkUserCharacter();
    } else if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  if (authLoading || checkingCharacter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white text-xl">
            {authLoading ? 'Loading...' : 'Checking character...'}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const handleModeSelect = (mode: 'solo' | 'multiplayer', count: number) => {
    setSelectedMode(mode);
    setPlayerCount(count);
    if (mode === 'multiplayer') {
      setGameState('multiplayer-lobby');
    } else {
      setGameState('player-setup');
    }
  };

  const handlePlayersReady = (readyPlayers: Player[]) => {
    setPlayers(readyPlayers);
    setGameState('playing');
  };

  const handleBackToMenu = () => {
    setGameState('mode-selection');
    setSelectedMode(null);
    setPlayerCount(2);
    setPlayers([]);
    setCurrentRoom(null);
  };

  const handleJoinMultiplayerGame = (room: GameRoom) => {
    setCurrentRoom(room);
    setGameState('multiplayer-game');
  };

  const handleLeaveMultiplayerGame = () => {
    setCurrentRoom(null);
    setGameState('multiplayer-lobby');
  };

  const handleBackToSetup = () => {
    setGameState('player-setup');
  };

  return (
    <div className="min-h-screen bg-gradient p-4">
      <div className="max-w-6xl mx-auto">
        {gameState === 'mode-selection' && (
          <GameModeSelector onModeSelect={handleModeSelect} />
        )}

        {gameState === 'player-setup' && (
          <PlayerSetup
            playerCount={playerCount}
            onPlayersReady={handlePlayersReady}
            onBack={handleBackToMenu}
          />
        )}

        {gameState === 'playing' && (
          <GameArea
            players={players}
            onBackToMenu={handleBackToMenu}
          />
        )}

        {gameState === 'multiplayer-lobby' && (
          <MultiplayerLobby
            onJoinGame={handleJoinMultiplayerGame}
            onBackToMenu={handleBackToMenu}
          />
        )}

        {gameState === 'multiplayer-game' && currentRoom && (
          <MultiplayerGameRoom
            room={currentRoom}
            onLeaveRoom={handleLeaveMultiplayerGame}
          />
        )}
      </div>
    </div>
  );
} 