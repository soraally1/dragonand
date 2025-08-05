'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { getProfileIconEmoji } from '@/lib/characterUtils';
import { Character } from '@/lib/groq';
import { 
  Users, 
  User, 
  Crown, 
  Sword, 
  Shield, 
  LogOut, 
  Settings, 
  Edit, 
  Sparkles,
  Zap,
  Star,
  Heart,
  Target,
  Globe,
  Users2,
  Gamepad2,
  Trophy,
  ArrowRight,
  CheckCircle,
  Play,
  Castle,
  Scroll,
  Gem,
  ScrollText,
  Map,
  Compass,
  BookOpen,
  Flame,
  Zap as Lightning
} from 'lucide-react';

interface GameModeSelectorProps {
  onModeSelect: (mode: 'solo' | 'multiplayer', playerCount: number) => void;
}

export const GameModeSelector = ({ onModeSelect }: GameModeSelectorProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<'solo' | 'multiplayer' | null>(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [character, setCharacter] = useState<Character | null>(null);
  const [loadingCharacter, setLoadingCharacter] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isHovered, setIsHovered] = useState<string | null>(null);

  useEffect(() => {
    const loadUserCharacter = async () => {
      if (!user) {
        setLoadingCharacter(false);
        return;
      }

      try {
        const characterDoc = await getDoc(doc(db, 'users', user.uid, 'characters', 'main'));
        if (characterDoc.exists()) {
          setCharacter(characterDoc.data() as Character);
        } else {
          console.error('No character found - this should not happen as character check is done in game page');
          window.location.href = '/character';
        }
      } catch (error) {
        console.error('Error loading character:', error);
      } finally {
        setLoadingCharacter(false);
      }
    };

    loadUserCharacter();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleEditCharacter = () => {
    router.push('/character');
  };

  const modes = [
    {
      id: 'solo',
      title: 'Solo Quest',
      subtitle: 'Petualangan Pribadi',
      description: 'Jelajahi dunia fantasi dengan AI Dungeon Master yang bijaksana',
      icon: <User className="h-8 w-8" />,
      emoji: '🧙‍♂️',
      theme: 'medieval-solo',
      features: [
        { icon: <ScrollText className="h-4 w-4" />, text: 'Petualangan personal yang mendalam' },
        { icon: <Target className="h-4 w-4" />, text: 'Fokus pada karakter Anda' },
        { icon: <Heart className="h-4 w-4" />, text: 'Cerita yang disesuaikan' },
        { icon: <Gamepad2 className="h-4 w-4" />, text: 'Kontrol penuh atas aksi' }
      ],
      stats: { difficulty: 'Mudah', duration: '30-60 min', players: '1' }
    },
    {
      id: 'multiplayer',
      title: 'Royal Campaign',
      subtitle: 'Petualangan Kerajaan',
      description: 'Bermain dengan pemain lain dalam pertempuran epik',
      icon: <Users className="h-8 w-8" />,
      emoji: '🏰',
      theme: 'medieval-multiplayer',
      features: [
        { icon: <Castle className="h-4 w-4" />, text: 'Real-time multiplayer' },
        { icon: <Map className="h-4 w-4" />, text: 'Room codes untuk bergabung' },
        { icon: <Trophy className="h-4 w-4" />, text: 'Cerita yang terhubung' },
        { icon: <Star className="h-4 w-4" />, text: 'Pengalaman sosial' }
      ],
      stats: { difficulty: 'Menengah', duration: '60-120 min', players: '2-6' }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-amber-900/20 dark:to-orange-900/20 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-amber-200 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-orange-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-yellow-200 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-amber-300 to-orange-300 rounded-full blur-3xl opacity-5"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Hero Section with Enhanced Layout */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="relative p-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full border-4 border-amber-300 shadow-2xl">
                <Crown className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-7xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-6 font-serif leading-tight">
            Pilih Mode Permainan
          </h1>
          <p className="text-2xl text-amber-800 dark:text-amber-200 max-w-4xl mx-auto font-medium leading-relaxed">
            Pilih bagaimana Anda ingin menjelajahi dunia fantasi Dungeons & Dragons
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Character Scroll Section - Now Sidebar */}
          <div className="xl:col-span-1">
            <div className="sticky top-8">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-amber-200 dark:border-amber-700 p-6 relative overflow-hidden">
                {/* Parchment Texture */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 to-orange-100/50 opacity-60"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 font-serif">
                      📜 Karakter Pahlawan
                    </h3>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-700 dark:text-amber-300"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      
                      {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-amber-50 dark:bg-amber-900/50 rounded-xl shadow-xl border-2 border-amber-200 dark:border-amber-700 z-10 backdrop-blur-sm">
                          <div className="py-2">
                            <button
                              onClick={handleEditCharacter}
                              className="flex items-center w-full px-4 py-3 text-sm text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                            >
                              <Edit className="h-4 w-4 mr-3" />
                              Edit Karakter
                            </button>
                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <LogOut className="h-4 w-4 mr-3" />
                              Logout
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {loadingCharacter ? (
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-amber-200 dark:bg-amber-700 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-5 bg-amber-200 dark:bg-amber-700 rounded mb-2"></div>
                          <div className="h-4 bg-amber-200 dark:bg-amber-700 rounded w-3/4"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-12 bg-amber-200 dark:bg-amber-700 rounded"></div>
                        <div className="h-12 bg-amber-200 dark:bg-amber-700 rounded"></div>
                      </div>
                    </div>
                  ) : character ? (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="text-5xl animate-bounce">
                          {getProfileIconEmoji(character.profileIcon)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-amber-900 dark:text-amber-100 text-xl font-serif">
                            {character.name}
                          </h4>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            {character.race} • {character.class}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-800/50 dark:to-orange-800/50 rounded-xl p-3 text-center border border-amber-300 dark:border-amber-600">
                          <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                            {character.level}
                          </div>
                          <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                            Level
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-orange-200 to-red-200 dark:from-orange-800/50 dark:to-red-800/50 rounded-xl p-3 text-center border border-orange-300 dark:border-orange-600">
                          <div className="text-lg font-bold text-orange-800 dark:text-orange-200">
                            {character.class}
                          </div>
                          <div className="text-xs text-orange-700 dark:text-orange-300 font-medium">
                            Class
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm bg-amber-100/50 dark:bg-amber-900/30 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                        <div className="flex justify-between">
                          <span className="text-amber-700 dark:text-amber-300">Background:</span>
                          <span className="font-medium text-amber-900 dark:text-amber-100">{character.background}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700 dark:text-amber-300">Alignment:</span>
                          <span className="font-medium text-amber-900 dark:text-amber-100">{character.alignment}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-amber-200 dark:bg-amber-700 rounded-full mx-auto mb-4"></div>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                        Belum ada karakter
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleEditCharacter}
                        icon={<Edit className="h-4 w-4" />}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                      >
                        Buat Karakter
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Game Modes Section - Now Main Content */}
          <div className="xl:col-span-3">
            {/* Game Modes Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
              {modes.map((mode) => (
                <div
                  key={mode.id}
                  className={`group cursor-pointer transition-all duration-500 hover:scale-105 ${
                    selectedMode === mode.id
                      ? 'ring-4 ring-amber-500 ring-opacity-50 shadow-2xl'
                      : 'hover:shadow-xl'
                  }`}
                  onClick={() => setSelectedMode(mode.id as 'solo' | 'multiplayer')}
                  onMouseEnter={() => setIsHovered(mode.id)}
                  onMouseLeave={() => setIsHovered(null)}
                >
                  <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 h-full ${
                    selectedMode === mode.id
                      ? 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-500'
                      : 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-300 dark:border-amber-600 hover:border-amber-400 dark:hover:border-amber-500'
                  }`}>
                    {/* Medieval Decorative Elements */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 to-orange-400"></div>
                    <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-amber-300 to-orange-300 rounded-full"></div>
                    
                    <div className="relative p-8 h-full flex flex-col">
                      {/* Header */}
                      <div className="text-center mb-8 flex-shrink-0">
                        <div className="flex justify-center mb-6">
                          <div className={`p-4 rounded-2xl transition-all duration-500 border-2 ${
                            selectedMode === mode.id
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 shadow-lg'
                              : 'bg-gradient-to-r from-amber-200 to-orange-200 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-600 group-hover:bg-gradient-to-r group-hover:from-amber-300 group-hover:to-orange-300'
                          }`}>
                            {mode.icon}
                          </div>
                        </div>
                        <div className="text-7xl mb-6 animate-pulse">
                          {mode.emoji}
                        </div>
                        <h3 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-3 font-serif">
                          {mode.title}
                        </h3>
                        <p className="text-lg font-medium text-amber-700 dark:text-amber-300 mb-3">
                          {mode.subtitle}
                        </p>
                        <p className="text-amber-800 dark:text-amber-200 text-base leading-relaxed">
                          {mode.description}
                        </p>
                      </div>

                      {/* Features */}
                      <div className="space-y-4 mb-8 flex-grow">
                        {mode.features.map((feature, index) => (
                          <div 
                            key={index} 
                            className="flex items-center space-x-4 transition-all duration-300 hover:translate-x-2 p-3 rounded-lg hover:bg-amber-100/50 dark:hover:bg-amber-800/30"
                          >
                            <div className={`p-2 rounded-full border flex-shrink-0 ${
                              selectedMode === mode.id
                                ? 'bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-600'
                                : 'bg-amber-100 dark:bg-amber-800/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700'
                            }`}>
                              {feature.icon}
                            </div>
                            <span className="text-base text-amber-800 dark:text-amber-200 font-medium">
                              {feature.text}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 text-center flex-shrink-0">
                        <div className="bg-amber-100/50 dark:bg-amber-800/30 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                          <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">Kesulitan</div>
                          <div className="text-base font-semibold text-amber-900 dark:text-amber-100">{mode.stats.difficulty}</div>
                        </div>
                        <div className="bg-amber-100/50 dark:bg-amber-800/30 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                          <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">Durasi</div>
                          <div className="text-base font-semibold text-amber-900 dark:text-amber-100">{mode.stats.duration}</div>
                        </div>
                        <div className="bg-amber-100/50 dark:bg-amber-800/30 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                          <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">Pemain</div>
                          <div className="text-base font-semibold text-amber-900 dark:text-amber-100">{mode.stats.players}</div>
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      {selectedMode === mode.id && (
                        <div className="absolute top-6 right-6">
                          <div className="bg-green-500 text-white rounded-full p-3 animate-pulse border-2 border-white shadow-lg">
                            <CheckCircle className="h-6 w-6" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Multiplayer Features - Enhanced Layout */}
            {selectedMode === 'multiplayer' && (
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl p-8 border-2 border-amber-300 dark:border-amber-700 mb-8">
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full border-2 border-amber-400">
                      <Castle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-3 font-serif">
                    ⚔️ Fitur Kerajaan
                  </h3>
                  <p className="text-lg text-amber-800 dark:text-amber-200 max-w-2xl mx-auto">
                    Nikmati pengalaman bermain bersama dengan fitur-fitur kerajaan yang memukau
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { icon: <Lightning className="h-5 w-5" />, text: 'Create or join rooms with codes', desc: 'Bergabung dengan mudah menggunakan kode ruangan' },
                    { icon: <Castle className="h-5 w-5" />, text: 'Real-time story synchronization', desc: 'Cerita yang sinkron secara real-time' },
                    { icon: <Crown className="h-5 w-5" />, text: 'Host controls and player management', desc: 'Kontrol host dan manajemen pemain' },
                    { icon: <Shield className="h-5 w-5" />, text: 'Public and private room options', desc: 'Opsi ruangan publik dan privat' }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-amber-100/50 dark:bg-amber-800/30 rounded-xl border border-amber-200 dark:border-amber-700 hover:bg-amber-200/70 dark:hover:bg-amber-800/50 transition-colors">
                      <div className="p-3 bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200 rounded-full border border-amber-300 dark:border-amber-600 flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-base font-semibold text-amber-900 dark:text-amber-100 mb-1">
                          {feature.text}
                        </div>
                        <div className="text-sm text-amber-700 dark:text-amber-300">
                          {feature.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Start Adventure Button - Enhanced */}
            {selectedMode && (
              <div className="text-center">
                <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl p-8 border-2 border-amber-300 dark:border-amber-700">
                  <div className="mb-6">
                    <div className="text-4xl mb-4">⚔️</div>
                    <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-2 font-serif">
                      Siap Memulai Petualangan?
                    </h3>
                    <p className="text-amber-800 dark:text-amber-200">
                      Pilih mode permainan Anda dan mulai jelajahi dunia fantasi
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => onModeSelect(selectedMode, playerCount)}
                    variant="primary"
                    size="lg"
                    icon={<Sword className="h-6 w-6" />}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-12 py-6 text-xl font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-amber-400 font-serif"
                  >
                    <span className="mr-3">⚔️ Mulai Petualangan</span>
                    <ArrowRight className="h-6 w-6" />
                  </Button>
                  
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-4 font-medium">
                    🏰 Siap untuk menjelajahi dunia fantasi?
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 