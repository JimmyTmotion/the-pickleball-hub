
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Clock, Users, MapPin, Shuffle, Hash, Heart, Target } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScheduleConfig } from '@/types/schedule';

interface ScheduleFormProps {
  onGenerateSchedule: (config: ScheduleConfig, name?: string) => void;
  isLoading?: boolean;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ onGenerateSchedule, isLoading }) => {
  const [config, setConfig] = React.useState<ScheduleConfig>({
    numRounds: 10,
    numPlayers: 8,
    numCourts: 2,
    prioritizeUniquePartnerships: true,
    avoidConsecutiveSittingOut: true,
    balanceMatchCounts: true
  });
  
  const [playerNamesText, setPlayerNamesText] = React.useState('');
  const [scheduleName, setScheduleName] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse player names from textarea
    const playerNames = playerNamesText
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    const configWithNames = {
      ...config,
      playerNames: playerNames.length > 0 ? playerNames : undefined,
      randomSeed: Math.floor(Math.random() * 1000000) // Generate random seed each time
    };
    
    onGenerateSchedule(configWithNames, scheduleName.trim() || undefined);
  };

  const updateConfig = (field: keyof ScheduleConfig, value: string | number | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-bold text-green-700">
          <Clock className="h-6 w-6" />
          Schedule Setup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="scheduleName" className="text-sm font-medium">
                Schedule Name (optional)
              </Label>
              <Input
                id="scheduleName"
                type="text"
                placeholder="e.g., Morning Tournament, Team Building Event..."
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-purple-600" />
              <div className="flex-1">
                <Label htmlFor="numRounds" className="text-sm font-medium">
                  Number of Rounds
                </Label>
                <Input
                  id="numRounds"
                  type="number"
                  min="1"
                  max="50"
                  value={config.numRounds}
                  onChange={(e) => updateConfig('numRounds', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <Label htmlFor="numPlayers" className="text-sm font-medium">
                  Number of Players
                </Label>
                <Input
                  id="numPlayers"
                  type="number"
                  min="4"
                  max="20"
                  value={config.numPlayers}
                  onChange={(e) => updateConfig('numPlayers', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <Label htmlFor="numCourts" className="text-sm font-medium">
                  Number of Courts
                </Label>
                <Input
                  id="numCourts"
                  type="number"
                  min="1"
                  max="6"
                  value={config.numCourts}
                  onChange={(e) => updateConfig('numCourts', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="playerNames" className="text-sm font-medium">
                Player Names (optional)
              </Label>
              <Textarea
                id="playerNames"
                placeholder="Enter player names, one per line&#10;John Smith&#10;Jane Doe&#10;Mike Johnson&#10;..."
                value={playerNamesText}
                onChange={(e) => setPlayerNamesText(e.target.value)}
                className="mt-1 min-h-[100px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use default names (Player 1, Player 2, etc.)
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Priority Setting
              </Label>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className={`text-sm ${config.prioritizeUniquePartnerships !== false ? 'font-bold' : 'font-normal'}`}>
                    Unique Partnerships
                  </span>
                </div>
                <Switch
                  id="priorityToggle"
                  checked={config.prioritizeUniquePartnerships !== false}
                  onCheckedChange={(checked) => updateConfig('prioritizeUniquePartnerships', checked)}
                />
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className={`text-sm ${config.prioritizeUniquePartnerships === false ? 'font-bold' : 'font-normal'}`}>
                    Varied Opposition
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Toggle between prioritizing unique partnerships or varied opposition matchups
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Schedule Requirements
              </Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="avoidConsecutiveSittingOut"
                    checked={config.avoidConsecutiveSittingOut !== false}
                    onCheckedChange={(checked) => updateConfig('avoidConsecutiveSittingOut', checked)}
                  />
                  <Label htmlFor="avoidConsecutiveSittingOut" className="text-sm cursor-pointer">
                    Avoid players sitting out twice in a row
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="balanceMatchCounts"
                    checked={config.balanceMatchCounts !== false}
                    onCheckedChange={(checked) => updateConfig('balanceMatchCounts', checked)}
                  />
                  <Label htmlFor="balanceMatchCounts" className="text-sm cursor-pointer">
                    Balance match counts across all players
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
            disabled={isLoading}
          >
            <Shuffle className="h-4 w-4 mr-2" />
            {isLoading ? 'Generating...' : 'Generate Schedule'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ScheduleForm;
