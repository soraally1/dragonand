'use client';

import { useState } from 'react';
import { Button } from './Button';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';

interface DiceRollerProps {
  onRoll: (result: number) => void;
  disabled?: boolean;
}

const diceIcons = [
  <Dice1 key="1" className="h-6 w-6" />,
  <Dice2 key="2" className="h-6 w-6" />,
  <Dice3 key="3" className="h-6 w-6" />,
  <Dice4 key="4" className="h-6 w-6" />,
  <Dice5 key="5" className="h-6 w-6" />,
  <Dice6 key="6" className="h-6 w-6" />
];

export const DiceRoller = ({ onRoll, disabled = false }: DiceRollerProps) => {
  const [isRolling, setIsRolling] = useState(false);
  const [currentRoll, setCurrentRoll] = useState<number[]>([]);

  const roll4d6DropLowest = () => {
    if (disabled || isRolling) return;

    setIsRolling(true);
    setCurrentRoll([]);

    // Simulate rolling animation
    const rollInterval = setInterval(() => {
      const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
      setCurrentRoll(rolls);
    }, 100);

    // Stop rolling after 1.5 seconds
    setTimeout(() => {
      clearInterval(rollInterval);
      const finalRolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
      setCurrentRoll(finalRolls);
      
      // Sort and drop lowest
      const sortedRolls = [...finalRolls].sort((a, b) => b - a);
      const result = sortedRolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0);
      
      setIsRolling(false);
      onRoll(result);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={roll4d6DropLowest}
        disabled={disabled || isRolling}
        loading={isRolling}
        variant="danger"
        size="lg"
        className="w-full"
        icon={<Dice1 className="h-5 w-5" />}
      >
        {isRolling ? 'Rolling...' : '🎲 Roll 4d6 Drop Lowest'}
      </Button>

      {currentRoll.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex justify-center space-x-2 mb-2">
            {currentRoll.map((roll, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                  isRolling 
                    ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-center">
                  {diceIcons[roll - 1]}
                </div>
                <div className="text-center text-sm font-medium mt-1">{roll}</div>
              </div>
            ))}
          </div>
          {!isRolling && currentRoll.length === 4 && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Dropped: {Math.min(...currentRoll)} | Total: {currentRoll.sort((a, b) => b - a).slice(0, 3).reduce((sum, roll) => sum + roll, 0)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 