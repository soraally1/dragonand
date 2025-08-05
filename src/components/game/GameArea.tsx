'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DiceRoller } from '@/components/ui/DiceRoller';
import { CharacterCard } from '@/components/ui/CharacterCard';
import { GameSaveLoad } from '@/components/game/GameSaveLoad';
import { getProfileIconEmoji } from '@/lib/characterUtils';
import { GameSession, Player, GameAction, generateDungeonMasterResponse, generatePlayerActions } from '@/lib/groq';
import { addExperience, unlockSkill, addItemToInventory } from '@/lib/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { Crown, Sword, MessageSquare, Users, ArrowRight, RefreshCw, Home, Save, Star, Package, Award } from 'lucide-react';

interface GameAreaProps {
  players: Player[];
  onBackToMenu: () => void;
}

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

export const GameArea = ({ players, onBackToMenu }: GameAreaProps) => {
  const { user } = useAuth();
  const [gameSession, setGameSession] = useState<GameSession>({
    id: 'session-1',
    players: players.map((p, index) => ({ ...p, isCurrentTurn: index === 0 })),
    currentPlayerIndex: 0,
    gameState: 'waiting',
    story: '',
    currentScene: '',
    turn: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const [dungeonMasterResponse, setDungeonMasterResponse] = useState('');
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [showCharacterDetails, setShowCharacterDetails] = useState<string | null>(null);
  const [gameEvents, setGameEvents] = useState<string[]>([]);

  const currentPlayer = gameSession.players[gameSession.currentPlayerIndex];

  useEffect(() => {
    if (!gameStarted) {
      startGame();
    }
  }, [gameStarted]);

  const startGame = async () => {
    setIsLoading(true);
    try {
      const response = await generateDungeonMasterResponse(gameSession);
      setDungeonMasterResponse(response);
      setGameSession(prev => ({
        ...prev,
        gameState: 'playing',
        story: response,
        currentScene: 'Opening Scene'
      }));
      setGameStarted(true);

      // Generate suggested actions for the first player
      const actions = await generatePlayerActions(gameSession, currentPlayer);
      setSuggestedActions(actions);
    } catch (error) {
      console.error('Error starting game:', error);
      setDungeonMasterResponse('Selamat datang di petualangan! Dungeon Master sedang mempersiapkan cerita Anda...');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayerAction = async (actionDescription: string) => {
    if (!currentPlayer) return;

    setIsLoading(true);
    try {
      // Determine action type and rewards based on action description
      const actionLower = actionDescription.toLowerCase();
      const isBattle = actionLower.includes('serang') || actionLower.includes('lawan') || actionLower.includes('bertarung') || actionLower.includes('attack') || actionLower.includes('fight') || actionLower.includes('battle');
      const isTraining = actionLower.includes('latih') || actionLower.includes('berlatih') || actionLower.includes('train') || actionLower.includes('practice') || actionLower.includes('meditasi') || actionLower.includes('meditate');
      const isMagic = actionLower.includes('sihir') || actionLower.includes('mantra') || actionLower.includes('magic') || actionLower.includes('spell') || actionLower.includes('conjure');
      const isExploration = actionLower.includes('jelajahi') || actionLower.includes('cari') || actionLower.includes('explore') || actionLower.includes('search') || actionLower.includes('investigate');
      
      // Determine action type (map to valid GameAction types)
      let actionType: 'move' | 'attack' | 'cast' | 'interact' | 'talk' | 'explore' | 'skill' | 'inventory' = 'explore';
      if (isBattle) actionType = 'attack';
      else if (isTraining) actionType = 'skill';
      else if (isMagic) actionType = 'cast';
      else if (actionLower.includes('bicara') || actionLower.includes('negosiasi') || actionLower.includes('talk') || actionLower.includes('negotiate')) actionType = 'talk';
      else if (actionLower.includes('bergerak') || actionLower.includes('pindah') || actionLower.includes('move') || actionLower.includes('go')) actionType = 'move';
      else if (actionLower.includes('gunakan') || actionLower.includes('ambil') || actionLower.includes('use') || actionLower.includes('take')) actionType = 'inventory';
      else if (actionLower.includes('sentuh') || actionLower.includes('buka') || actionLower.includes('interact') || actionLower.includes('open')) actionType = 'interact';

      // Detect purchase/shopping events
      const isPurchase = actionLower.includes('beli') || actionLower.includes('membeli') || actionLower.includes('buy') || actionLower.includes('purchase') || 
                        actionLower.includes('barter') || actionLower.includes('tukar') || actionLower.includes('dagang') || actionLower.includes('trade');
      
      // Enhanced battle and training XP system
      const shouldGiveExp = isBattle || isTraining;
      let expAmount = 0;
      let battleReward = null;
      
      if (isBattle) {
        // Enhanced battle XP based on dice roll (simulating battle difficulty/success)
        const battleRoll = Math.floor(Math.random() * 20) + 1;
        if (battleRoll >= 18) {
          expAmount = Math.floor(Math.random() * 50) + 100; // Critical success: 100-150 XP
          battleReward = 'critical';
        } else if (battleRoll >= 15) {
          expAmount = Math.floor(Math.random() * 40) + 60; // Great success: 60-100 XP
          battleReward = 'great';
        } else if (battleRoll >= 10) {
          expAmount = Math.floor(Math.random() * 30) + 40; // Good success: 40-70 XP
          battleReward = 'good';
        } else if (battleRoll >= 5) {
          expAmount = Math.floor(Math.random() * 20) + 20; // Moderate success: 20-40 XP
          battleReward = 'moderate';
        } else {
          expAmount = Math.floor(Math.random() * 15) + 10; // Difficult victory: 10-25 XP
          battleReward = 'difficult';
        }
      } else if (isTraining) {
        // Training XP remains the same
        expAmount = Math.floor(Math.random() * 40) + 10; // 10-50 XP for training
      }

      // Generate contextual items based on action type
      let contextualItems = [];
      
      if (isPurchase) {
        // For purchase events, generate appropriate shop items
        const shopItems = [
          {
            name: 'Ramuan Penyembuhan',
            type: 'consumable' as const,
            rarity: 'common' as const,
            description: 'Ramuan yang dapat memulihkan kesehatan',
            value: 25,
            quantity: Math.floor(Math.random() * 3) + 1,
            effects: ['Memulihkan 2d4+2 HP']
          },
          {
            name: 'Pedang Baja',
            type: 'weapon' as const,
            rarity: 'uncommon' as const,
            description: 'Pedang berkualitas tinggi dari baja tempa',
            value: 75,
            quantity: 1,
            effects: ['+1 damage pada serangan pedang']
          },
          {
            name: 'Perisai Kayu Ek',
            type: 'armor' as const,
            rarity: 'common' as const,
            description: 'Perisai yang terbuat dari kayu ek yang kuat',
            value: 50,
            quantity: 1,
            effects: ['+1 AC saat digunakan']
          },
          {
            name: 'Tali Panjat',
            type: 'treasure' as const,
            rarity: 'common' as const,
            description: 'Tali yang kuat untuk memanjat atau mengikat',
            value: 15,
            quantity: 1,
            effects: ['Berguna untuk eksplorasi']
          },
          {
            name: 'Obor',
            type: 'treasure' as const,
            rarity: 'common' as const,
            description: 'Obor yang dapat menerangi area gelap',
            value: 5,
            quantity: Math.floor(Math.random() * 5) + 2,
            effects: ['Memberikan cahaya selama 1 jam']
          }
        ];
        
        // Select 1-2 random items for purchase
        const numItems = Math.random() > 0.7 ? 2 : 1;
        for (let i = 0; i < numItems; i++) {
          const randomItem = shopItems[Math.floor(Math.random() * shopItems.length)];
          contextualItems.push(randomItem);
        }
      } else if (isBattle) {
        // Enhanced battle rewards based on battle performance
        const battleLoot = [
          {
            name: 'Koin Emas',
            type: 'treasure' as const,
            rarity: 'common' as const,
            description: 'Koin emas yang berkilauan',
            value: Math.floor(Math.random() * 20) + 10,
            quantity: battleReward === 'critical' ? Math.floor(Math.random() * 10) + 5 : 
                     battleReward === 'great' ? Math.floor(Math.random() * 8) + 3 :
                     Math.floor(Math.random() * 5) + 1,
            effects: ['Dapat digunakan untuk membeli barang']
          },
          {
            name: 'Ramuan Kekuatan',
            type: 'consumable' as const,
            rarity: battleReward === 'critical' ? 'rare' as const : 'uncommon' as const,
            description: 'Ramuan yang meningkatkan kekuatan sementara',
            value: 40,
            quantity: 1,
            effects: ['+2 STR selama 1 jam']
          },
          {
            name: 'Senjata Musuh',
            type: 'weapon' as const,
            rarity: battleReward === 'critical' ? 'rare' as const : 
                   battleReward === 'great' ? 'uncommon' as const : 'common' as const,
            description: 'Senjata yang direbut dari musuh yang dikalahkan',
            value: battleReward === 'critical' ? 100 : battleReward === 'great' ? 75 : 50,
            quantity: 1,
            effects: [battleReward === 'critical' ? '+2 damage' : '+1 damage']
          }
        ];
        
        // Battle always gives at least gold, with chance for additional items
        contextualItems.push(battleLoot[0]); // Always get gold
        
        if (battleReward === 'critical') {
          contextualItems.push(battleLoot[1], battleLoot[2]); // Get potion and weapon
        } else if (battleReward === 'great') {
          contextualItems.push(Math.random() > 0.5 ? battleLoot[1] : battleLoot[2]); // Get either potion or weapon
        } else if (battleReward === 'good' && Math.random() > 0.7) {
          contextualItems.push(battleLoot[1]); // Small chance for potion
        }
      } else if (Math.random() > 0.75) {
        // Regular item discovery for non-purchase actions
        contextualItems.push({
          name: isBattle ? 'Pedang Berkilau' : isExploration ? 'Permata Misterius' : isTraining ? 'Gulungan Latihan' : 'Artefak Kuno',
          type: (isBattle ? 'weapon' : 'treasure') as 'weapon' | 'armor' | 'consumable' | 'treasure' | 'magic',
          rarity: (Math.random() > 0.8 ? 'rare' : 'uncommon') as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
          description: isBattle ? 'Pedang yang berkilau dengan kekuatan magis' : 
                      isExploration ? 'Permata yang bersinar dengan energi misterius' :
                      isTraining ? 'Gulungan berisi teknik latihan rahasia' : 'Artefak dengan kekuatan yang tidak diketahui',
          value: Math.floor(Math.random() * 50) + 25,
          quantity: 1,
          effects: [isBattle ? 'Meningkatkan kekuatan serangan' : 'Properti magis yang tidak diketahui']
        });
      }

      // Create a game action with contextual rewards
      const action: GameAction = {
        type: actionType,
        description: actionDescription,
        roll: Math.floor(Math.random() * 20) + 1, // Simple d20 roll
        experienceGained: expAmount,
        skillsUnlocked: (isMagic && Math.random() > 0.8) ? ['Penguasaan Sihir'] : 
                       (isBattle && Math.random() > 0.9) ? ['Teknik Bertarung'] : 
                       (isTraining && Math.random() > 0.85) ? ['Disiplin Mental'] : [],
        itemsFound: contextualItems
      };

      // Generate DM response
      const response = await generateDungeonMasterResponse(gameSession, action);
      setDungeonMasterResponse(response);

      // Handle experience and rewards with enhanced battle feedback
      if (user && action.experienceGained && action.experienceGained > 0) {
        try {
          const levelResult = await addExperience(currentPlayer.character.name, user.uid, action.experienceGained);
          
          if (isBattle) {
            // Enhanced battle XP messages
            const battleMessages = {
              critical: `🔥 KEMENANGAN LUAR BIASA! ${currentPlayer.character.name} mendapat ${action.experienceGained} XP!`,
              great: `⚔️ Kemenangan gemilang! ${currentPlayer.character.name} mendapat ${action.experienceGained} XP!`,
              good: `🗡️ Pertarungan yang baik! ${currentPlayer.character.name} mendapat ${action.experienceGained} XP!`,
              moderate: `⚡ Kemenangan yang diraih! ${currentPlayer.character.name} mendapat ${action.experienceGained} XP!`,
              difficult: `💪 Kemenangan sulit! ${currentPlayer.character.name} mendapat ${action.experienceGained} XP!`
            };
            setGameEvents(prev => [...prev, battleMessages[battleReward as keyof typeof battleMessages] || `✨ ${currentPlayer.character.name} mendapat ${action.experienceGained} poin pengalaman!`]);
          } else {
            setGameEvents(prev => [...prev, `✨ ${currentPlayer.character.name} mendapat ${action.experienceGained} poin pengalaman!`]);
          }
          
          if (levelResult?.leveledUp) {
            setGameEvents(prev => [...prev, `🎉 LEVEL UP! ${currentPlayer.character.name} naik ke level ${levelResult.newLevel}!`]);
            // Note: Player state will be updated automatically when the component re-renders
            // as the character data is fetched from Firestore
          }
        } catch (error) {
          console.error('Error adding experience:', error);
          setGameEvents(prev => [...prev, `❌ Gagal menambahkan pengalaman. Silakan coba lagi.`]);
        }
      }

      // Handle skill unlocking
      if (user && action.skillsUnlocked?.length) {
        for (const skillName of action.skillsUnlocked) {
          await unlockSkill(currentPlayer.character.name, user.uid, skillName);
          setGameEvents(prev => [...prev, `🎯 ${currentPlayer.character.name} membuka kemampuan baru: ${skillName}!`]);
        }
      }

      // Handle item discovery and purchases
      if (user && action.itemsFound?.length) {
        for (const item of action.itemsFound) {
          await addItemToInventory(currentPlayer.character.name, user.uid, item);
          
          if (isPurchase) {
            setGameEvents(prev => [...prev, `🛒 ${currentPlayer.character.name} membeli: ${item.name} (${item.quantity}x)!`]);
          } else {
            setGameEvents(prev => [...prev, `💎 ${currentPlayer.character.name} menemukan: ${item.name}!`]);
          }
        }
      }

      // Update game session
      const nextPlayerIndex = (gameSession.currentPlayerIndex + 1) % gameSession.players.length;
      const updatedPlayers = gameSession.players.map((p, index) => ({
        ...p,
        isCurrentTurn: index === nextPlayerIndex
      }));

      setGameSession(prev => ({
        ...prev,
        currentPlayerIndex: nextPlayerIndex,
        players: updatedPlayers,
        turn: nextPlayerIndex === 0 ? prev.turn + 1 : prev.turn,
        story: response,
        updatedAt: new Date()
      }));

      // Generate actions for next player
      const nextPlayer = updatedPlayers[nextPlayerIndex];
      const actions = await generatePlayerActions(gameSession, nextPlayer);
      setSuggestedActions(actions);
    } catch (error) {
      console.error('Error handling player action:', error);
      setDungeonMasterResponse('Dungeon Master sedang memikirkan aksi Anda...');
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
                  Dungeons & Dragons
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Turn {gameSession.turn} • {gameSession.players.length} Players
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSaveLoad(!showSaveLoad)}
                className="hover:bg-green-50 transition-colors"
              >
                <Save className="h-4 w-4 mr-2 text-green-600" />
                <span className="font-medium">Simpan/Muat</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onBackToMenu}
                className="hover:bg-gray-50 transition-colors"
              >
                <Home className="h-4 w-4 mr-2 text-gray-600" />
                <span className="font-medium">Menu</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Save/Load Panel */}
        {showSaveLoad && (
          <div className="mb-6">
            <GameSaveLoad
              currentGame={gameSession}
              onLoadGame={(game) => {
                setGameSession(game);
                setShowSaveLoad(false);
              }}
            />
          </div>
        )}

        {/* Game Events */}
        {gameEvents.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-yellow-800 mb-3 flex items-center">
              <Star className="h-4 w-4 mr-2" />
              Peristiwa Terbaru
            </h4>
            <div className="space-y-2">
              {gameEvents.slice(-5).map((event, index) => (
                <div key={index} className="text-sm text-yellow-700 bg-white/50 rounded px-3 py-2 border border-yellow-100">
                  {event}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dungeon Master Area */}
          <div className="lg:col-span-2 space-y-6">
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
                      formatDungeonMasterText(dungeonMasterResponse)
                    )}
                  </div>
                </div>

                {gameSession.currentScene && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Current Scene:</strong> {gameSession.currentScene}
                  </div>
                )}
              </div>
            </Card>

            {/* Player Actions */}
            {currentPlayer && (
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
          </div>

          {/* Player List */}
          <div className="space-y-6">
            <Card title="Players">
              <div className="space-y-4">
                {gameSession.players.map((player, index) => (
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