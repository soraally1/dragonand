'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { DiceRoller } from '@/components/ui/DiceRoller';
import { GenderSelector } from '@/components/ui/GenderSelector';
import { ProfileIconSelector } from '@/components/ui/ProfileIconSelector';
import { getProfileIconEmoji, getGenderLabel, generateDefaultSkills, generateDefaultInventory, calculateCharacterStats } from '@/lib/characterUtils';
import { Sword, Shield, User, Crown, Sparkles, ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface Character {
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
  skills: any[];
  inventory: any[];
  health: number;
  maxHealth: number;
  armorClass: number;
  initiative: number;
}

const races = [
  'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Tiefling', 'Half-Elf', 'Half-Orc', 'Gnome'
];

const classes = [
  'Fighter', 'Wizard', 'Cleric', 'Rogue', 'Ranger', 'Paladin', 'Barbarian', 'Bard', 'Druid', 'Monk', 'Sorcerer', 'Warlock'
];

const backgrounds = [
  'Acolyte', 'Criminal', 'Folk Hero', 'Noble', 'Sage', 'Soldier', 'Urchin', 'Entertainer', 'Guild Artisan', 'Hermit', 'Outlander'
];

const alignments = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
];

export const CharacterCreation = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [character, setCharacter] = useState<Character>({
    name: '',
    gender: '',
    profileIcon: '',
    race: '',
    class: '',
    level: 1,
    experience: 0,
    experienceToNextLevel: 1000,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    background: '',
    alignment: '',
    skills: [],
    inventory: [],
    health: 8,
    maxHealth: 8,
    armorClass: 10,
    initiative: 0
  });

  const rollAbilityScore = () => {
    const rolls = [];
    for (let i = 0; i < 4; i++) {
      rolls.push(Math.floor(Math.random() * 6) + 1);
    }
    rolls.sort((a, b) => b - a);
    return rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0);
  };

  const rollAllStats = () => {
    setCharacter(prev => ({
      ...prev,
      strength: rollAbilityScore(),
      dexterity: rollAbilityScore(),
      constitution: rollAbilityScore(),
      intelligence: rollAbilityScore(),
      wisdom: rollAbilityScore(),
      charisma: rollAbilityScore()
    }));
  };

  const handleSave = async () => {
    if (!user) {
      alert('User not authenticated');
      return;
    }

    // Validate required fields
    if (!character.name || !character.gender || !character.profileIcon || !character.race || !character.class || !character.background || !character.alignment) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      console.log('Saving character for user:', user.uid);
      
      // Generate skills and inventory based on class
      const skills = generateDefaultSkills(character.class);
      const inventory = generateDefaultInventory(character.class);
      
      // Calculate derived stats
      const stats = calculateCharacterStats(character);
      
      // Create complete character
      const completeCharacter = {
        ...character,
        ...stats,
        skills,
        inventory,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('Complete character data:', completeCharacter);
      
      // Save character data to Firestore in user's characters subcollection
      await setDoc(doc(db, 'users', user.uid, 'characters', 'main'), completeCharacter);
      
      console.log('Character saved successfully');
      alert('Character created successfully!');
      router.push('/game');
    } catch (error: any) {
      console.error('Error saving character:', error);
      if (error.code === 'permission-denied') {
        alert('Permission denied. Please check your Firebase configuration.');
      } else {
        alert('Error saving character. Please try again.');
      }
    }
  };

  const getModifier = (score: number) => {
    return Math.floor((score - 10) / 2);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Informasi Dasar</h3>
        <p className="text-gray-600 dark:text-gray-400">Tentukan identitas karakter Anda</p>
      </div>
      
      <Input
        label="Nama Karakter"
        type="text"
        value={character.name}
        onChange={(e) => setCharacter(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Masukkan nama karakter"
        icon={<User className="h-5 w-5" />}
        required
      />

      <GenderSelector
        selectedGender={character.gender}
        onGenderChange={(gender) => setCharacter(prev => ({ ...prev, gender }))}
      />

      {character.gender && (
        <ProfileIconSelector
          selectedIcon={character.profileIcon}
          onIconChange={(icon) => setCharacter(prev => ({ ...prev, profileIcon: icon }))}
          gender={character.gender}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ras
          </label>
          <select
            value={character.race}
            onChange={(e) => setCharacter(prev => ({ ...prev, race: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Pilih Ras</option>
            {races.map(race => (
              <option key={race} value={race}>{race}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Kelas
          </label>
          <select
            value={character.class}
            onChange={(e) => setCharacter(prev => ({ ...prev, class: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Pilih Kelas</option>
            {classes.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <Sword className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Kemampuan (Ability Scores)</h3>
        <p className="text-gray-600 dark:text-gray-400">Roll dice untuk menentukan kemampuan karakter Anda</p>
      </div>
      
      <DiceRoller onRoll={rollAllStats} />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { name: 'Strength', key: 'strength', icon: '💪' },
          { name: 'Dexterity', key: 'dexterity', icon: '🏃' },
          { name: 'Constitution', key: 'constitution', icon: '❤️' },
          { name: 'Intelligence', key: 'intelligence', icon: '🧠' },
          { name: 'Wisdom', key: 'wisdom', icon: '👁️' },
          { name: 'Charisma', key: 'charisma', icon: '✨' }
        ].map(ability => (
          <Card key={ability.key} className="text-center">
            <div className="text-2xl mb-2">{ability.icon}</div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{ability.name}</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {character[ability.key as keyof Character] as number}
            </div>
            <div className={`text-sm font-medium ${
              getModifier(character[ability.key as keyof Character] as number) >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {getModifier(character[ability.key as keyof Character] as number) >= 0 ? '+' : ''}
              {getModifier(character[ability.key as keyof Character] as number)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <Crown className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Latar Belakang & Alignment</h3>
        <p className="text-gray-600 dark:text-gray-400">Tentukan kisah dan moral karakter Anda</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Latar Belakang
        </label>
        <select
          value={character.background}
          onChange={(e) => setCharacter(prev => ({ ...prev, background: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="">Pilih Latar Belakang</option>
          {backgrounds.map(bg => (
            <option key={bg} value={bg}>{bg}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Alignment
        </label>
        <select
          value={character.alignment}
          onChange={(e) => setCharacter(prev => ({ ...prev, alignment: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="">Pilih Alignment</option>
          {alignments.map(align => (
            <option key={align} value={align}>{align}</option>
          ))}
        </select>
      </div>

      <Card title="Ringkasan Karakter" className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="text-center mb-4">
          {character.profileIcon && (
            <div className="text-4xl mb-2">
              {getProfileIconEmoji(character.profileIcon)}
            </div>
          )}
          <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">{character.name || 'Belum diisi'}</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p><strong className="text-blue-900 dark:text-blue-100">Gender:</strong> <span className="text-blue-800 dark:text-blue-200">
              {getGenderLabel(character.gender)}
            </span></p>
            <p><strong className="text-blue-900 dark:text-blue-100">Ras:</strong> <span className="text-blue-800 dark:text-blue-200">{character.race || 'Belum dipilih'}</span></p>
            <p><strong className="text-blue-900 dark:text-blue-100">Kelas:</strong> <span className="text-blue-800 dark:text-blue-200">{character.class || 'Belum dipilih'}</span></p>
          </div>
          <div className="space-y-2">
            <p><strong className="text-blue-900 dark:text-blue-100">Level:</strong> <span className="text-blue-800 dark:text-blue-200">{character.level}</span></p>
            <p><strong className="text-blue-900 dark:text-blue-100">Latar Belakang:</strong> <span className="text-blue-800 dark:text-blue-200">{character.background || 'Belum dipilih'}</span></p>
            <p><strong className="text-blue-900 dark:text-blue-100">Alignment:</strong> <span className="text-blue-800 dark:text-blue-200">{character.alignment || 'Belum dipilih'}</span></p>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20"></div>
          <div className="relative">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Pembuatan Karakter
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Langkah {step} dari 3
              </p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      step >= stepNumber 
                        ? 'bg-purple-600 text-white shadow-lg' 
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}>
                      {stepNumber}
                    </div>
                    {stepNumber < 3 && (
                      <div className={`w-20 h-1 mx-2 transition-all duration-300 ${
                        step > stepNumber ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-8">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                variant="secondary"
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                Sebelumnya
              </Button>

              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  variant="primary"
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  Selanjutnya
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  variant="success"
                  size="lg"
                  icon={<Check className="h-5 w-5" />}
                >
                  Buat Karakter
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}; 