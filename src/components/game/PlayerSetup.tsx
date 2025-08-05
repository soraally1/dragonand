'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getProfileIconEmoji } from '@/lib/characterUtils';
import { Player, Character } from '@/lib/groq';
import { Users, User, Crown, ArrowRight, Plus, Trash2 } from 'lucide-react';

interface PlayerSetupProps {
  playerCount: number;
  onPlayersReady: (players: Player[]) => void;
  onBack: () => void;
}

export const PlayerSetup = ({ playerCount, onPlayersReady, onBack }: PlayerSetupProps) => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  useEffect(() => {
    const loadCurrentUserCharacter = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        console.log('Loading character for user:', user.uid);
        const characterDoc = await getDoc(doc(db, 'users', user.uid, 'characters', 'main'));
        
        if (characterDoc.exists()) {
          const characterData = characterDoc.data() as Character;
          console.log('Character found:', characterData);
          
          const currentPlayer: Player = {
            id: user.uid,
            name: user.displayName || user.email || 'Player 1',
            character: characterData,
            isActive: true,
            isCurrentTurn: true
          };
          setPlayers([currentPlayer]);
        } else {
          console.error('No character found - this should not happen as character check is done in game page');
          // This should not happen since we check for character existence in the game page
          // If it does happen, redirect back to character creation
          window.location.href = '/character';
        }
      } catch (error) {
        console.error('Error loading character:', error);
        // On error, redirect to character creation
        window.location.href = '/character';
      } finally {
        setLoading(false);
      }
    };

    loadCurrentUserCharacter();
  }, [user]);

  const addPlayer = () => {
    if (players.length >= playerCount) return;

    const newPlayer: Player = {
      id: `player-${players.length + 1}`,
      name: `Player ${players.length + 1}`,
      character: {
        name: `Player ${players.length + 1}`,
        gender: 'other',
        profileIcon: 'other-warrior',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        experience: 0,
        experienceToNextLevel: 1000,
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        background: 'Soldier',
        alignment: 'Neutral',
        skills: [],
        inventory: [],
        health: 8,
        maxHealth: 8,
        armorClass: 10,
        initiative: 0
      },
      isActive: true,
      isCurrentTurn: false
    };

    setPlayers([...players, newPlayer]);
  };

  const removePlayer = (playerId: string) => {
    if (players.length <= 1) return;
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const updatePlayerName = (playerId: string, name: string) => {
    setPlayers(players.map(p => 
      p.id === playerId ? { ...p, name } : p
    ));
  };

  const isReady = players.length >= 2 && players.every(p => p.name.trim() !== '');

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading character data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Setup Pemain
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Konfigurasi {playerCount} pemain untuk petualangan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {players.map((player, index) => (
          <div
            key={player.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Pemain {index + 1}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {player.character.race} {player.character.class}
                  </p>
                </div>
              </div>
              {players.length > 1 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => removePlayer(player.id)}
                  icon={<Trash2 className="h-4 w-4" />}
                >
                  Hapus
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <Input
                label="Nama Pemain"
                type="text"
                value={player.name}
                onChange={(e) => updatePlayerName(player.id, e.target.value)}
                placeholder="Masukkan nama pemain"
                required
              />

              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {getProfileIconEmoji(player.character.profileIcon)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {player.character.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Level {player.character.level} • {player.character.background}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                  <span className="text-gray-600 dark:text-gray-400">STR:</span>
                  <span className="font-semibold ml-1">{player.character.strength}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                  <span className="text-gray-600 dark:text-gray-400">DEX:</span>
                  <span className="font-semibold ml-1">{player.character.dexterity}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                  <span className="text-gray-600 dark:text-gray-400">CON:</span>
                  <span className="font-semibold ml-1">{player.character.constitution}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                  <span className="text-gray-600 dark:text-gray-400">INT:</span>
                  <span className="font-semibold ml-1">{player.character.intelligence}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {players.length < playerCount && (
        <div className="text-center">
          <Button
            onClick={addPlayer}
            variant="secondary"
            icon={<Plus className="h-5 w-5" />}
          >
            Tambah Pemain
          </Button>
        </div>
      )}

      <div className="flex justify-between">
        <Button
          onClick={onBack}
          variant="secondary"
          icon={<ArrowRight className="h-5 w-5 rotate-180" />}
        >
          Kembali
        </Button>

        <Button
          onClick={() => onPlayersReady(players)}
          variant="primary"
          disabled={!isReady}
          icon={<Crown className="h-5 w-5" />}
        >
          Mulai Game
        </Button>
      </div>
    </div>
  );
}; 