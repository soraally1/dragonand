'use client';

import { useState } from 'react';
import { Card } from './Card';
import { Character, Skill, InventoryItem } from '@/lib/groq';
import { getProfileIconEmoji } from '@/lib/characterUtils';
import { 
  Heart, 
  Shield, 
  Zap, 
  Star, 
  Sword, 
  BookOpen, 
  Map, 
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Award,
  Package
} from 'lucide-react';

interface CharacterCardProps {
  character: Character;
  isCurrentTurn?: boolean;
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

export const CharacterCard = ({ 
  character, 
  isCurrentTurn = false, 
  showDetails = false,
  onToggleDetails 
}: CharacterCardProps) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600';
      case 'uncommon': return 'text-green-600';
      case 'rare': return 'text-blue-600';
      case 'epic': return 'text-purple-600';
      case 'legendary': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getSkillIcon = (category: string) => {
    switch (category) {
      case 'combat': return <Sword className="h-4 w-4" />;
      case 'social': return <MessageCircle className="h-4 w-4" />;
      case 'exploration': return <Map className="h-4 w-4" />;
      case 'magic': return <Zap className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const experienceProgress = (character.experience / character.experienceToNextLevel) * 100;

  return (
    <Card className={`transition-all duration-300 ${isCurrentTurn ? 'ring-2 ring-purple-500 shadow-lg' : ''}`}>
      <div className="space-y-4">
        {/* Character Header */}
        <div className="flex items-center space-x-4">
          <div className="text-3xl">
            {getProfileIconEmoji(character.profileIcon)}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {character.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {character.race} {character.class} • Level {character.level}
            </p>
          </div>
          {onToggleDetails && (
            <button
              onClick={onToggleDetails}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {showDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          )}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center space-x-1">
            <Heart className="h-4 w-4 text-red-500" />
            <span>{character.health}/{character.maxHealth}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Shield className="h-4 w-4 text-blue-500" />
            <span>AC {character.armorClass}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>Init {character.initiative}</span>
          </div>
        </div>

        {/* Experience Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Experience</span>
            <span className="font-medium">{character.experience}/{character.experienceToNextLevel} XP</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${experienceProgress}%` }}
            />
          </div>
        </div>

        {/* Detailed Stats (if expanded) */}
        {showDetails && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Ability Scores */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Ability Scores</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <div className="font-medium">STR</div>
                  <div className="text-lg font-bold">{character.strength}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <div className="font-medium">DEX</div>
                  <div className="text-lg font-bold">{character.dexterity}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <div className="font-medium">CON</div>
                  <div className="text-lg font-bold">{character.constitution}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <div className="font-medium">INT</div>
                  <div className="text-lg font-bold">{character.intelligence}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <div className="font-medium">WIS</div>
                  <div className="text-lg font-bold">{character.wisdom}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <div className="font-medium">CHA</div>
                  <div className="text-lg font-bold">{character.charisma}</div>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <button
                onClick={() => toggleSection('skills')}
                className="flex items-center space-x-2 w-full text-left font-semibold text-gray-900 dark:text-white"
              >
                <Award className="h-4 w-4" />
                <span>Skills ({character.skills.filter(s => s.unlocked).length}/{character.skills.length})</span>
                {expandedSections.includes('skills') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.includes('skills') && (
                <div className="mt-2 space-y-2">
                  {character.skills.map((skill, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-2 rounded text-sm ${
                        skill.unlocked 
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                          : 'bg-gray-50 dark:bg-gray-800 opacity-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {getSkillIcon(skill.category)}
                        <span className={skill.unlocked ? 'font-medium' : ''}>{skill.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">Lv.{skill.level}</span>
                        {skill.unlocked && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory */}
            <div>
              <button
                onClick={() => toggleSection('inventory')}
                className="flex items-center space-x-2 w-full text-left font-semibold text-gray-900 dark:text-white"
              >
                <Package className="h-4 w-4" />
                <span>Inventory ({character.inventory.length} items)</span>
                {expandedSections.includes('inventory') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.includes('inventory') && (
                <div className="mt-2 space-y-2">
                  {character.inventory.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No items in inventory</p>
                  ) : (
                    character.inventory.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${getRarityColor(item.rarity)}`}>{item.name}</span>
                          {item.quantity > 1 && <span className="text-xs text-gray-500">x{item.quantity}</span>}
                        </div>
                        <span className="text-xs text-gray-500">{item.type}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}; 