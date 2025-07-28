import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpDown } from 'lucide-react';
import { Player } from '@/types/schedule';

interface PlayerSwapperProps {
  players: Player[];
  onSwap: (fromIndex: number, toIndex: number) => void;
  className?: string;
}

const PlayerSwapper: React.FC<PlayerSwapperProps> = ({ players, onSwap, className = "" }) => {
  const handleSwap = (fromIndex: number, toIndex: number) => {
    if (fromIndex !== toIndex) {
      onSwap(fromIndex, toIndex);
    }
  };

  return (
    <Card className={`border-dashed border-2 border-gray-300 ${className}`}>
      <CardContent className="p-4">
        <div className="text-center mb-3">
          <div className="text-sm font-medium text-gray-600 mb-2">
            Drag & Drop to Rearrange Teams
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Team 1 */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs font-semibold text-blue-700 mb-2 text-center">Team 1</div>
            <div className="space-y-2">
              {players.slice(0, 2).map((player, index) => (
                <div key={player.id} className="flex items-center gap-2">
                  <div className="flex-1 bg-white rounded p-2 text-sm font-medium">
                    {player.name}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => handleSwap(index, (index + 1) % 4)}
                      title={`Swap with ${players[(index + 1) % 4]?.name}`}
                    >
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-sm font-bold text-gray-600">VS</div>

          {/* Team 2 */}
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-xs font-semibold text-orange-700 mb-2 text-center">Team 2</div>
            <div className="space-y-2">
              {players.slice(2, 4).map((player, index) => (
                <div key={player.id} className="flex items-center gap-2">
                  <div className="flex-1 bg-white rounded p-2 text-sm font-medium">
                    {player.name}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => handleSwap(index + 2, ((index + 1) % 2) + 2)}
                      title={`Swap with ${players[((index + 1) % 2) + 2]?.name}`}
                    >
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick swap buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSwap(0, 2)}
              className="text-xs"
            >
              Swap Teams
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSwap(1, 3)}
              className="text-xs"
            >
              Cross Swap
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerSwapper;