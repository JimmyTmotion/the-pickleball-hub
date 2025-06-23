
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, MapPin } from 'lucide-react';
import { ScheduleConfig } from '@/types/schedule';

interface ScheduleFormProps {
  onGenerateSchedule: (config: ScheduleConfig) => void;
  isLoading?: boolean;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ onGenerateSchedule, isLoading }) => {
  const [config, setConfig] = React.useState<ScheduleConfig>({
    sessionStart: '09:00',
    sessionEnd: '12:00',
    matchLength: 30,
    numPlayers: 8,
    numCourts: 2
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateSchedule(config);
  };

  const updateConfig = (field: keyof ScheduleConfig, value: string | number) => {
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sessionStart" className="text-sm font-medium">
                  Session Start
                </Label>
                <Input
                  id="sessionStart"
                  type="time"
                  value={config.sessionStart}
                  onChange={(e) => updateConfig('sessionStart', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sessionEnd" className="text-sm font-medium">
                  Session End
                </Label>
                <Input
                  id="sessionEnd"
                  type="time"
                  value={config.sessionEnd}
                  onChange={(e) => updateConfig('sessionEnd', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="matchLength" className="text-sm font-medium">
                Match Length (minutes)
              </Label>
              <Input
                id="matchLength"
                type="number"
                min="15"
                max="60"
                value={config.matchLength}
                onChange={(e) => updateConfig('matchLength', parseInt(e.target.value))}
                className="mt-1"
              />
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
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Schedule'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ScheduleForm;
