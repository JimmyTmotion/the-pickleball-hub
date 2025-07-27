import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Save, X, Edit } from 'lucide-react';
import { Schedule } from '@/types/schedule';
import { toast } from '@/hooks/use-toast';

interface PlayerNameEditorProps {
  schedule: Schedule;
  onPlayerNamesUpdate: (playerNames: Record<number, string>) => Promise<void>;
}

const PlayerNameEditor: React.FC<PlayerNameEditorProps> = ({ schedule, onPlayerNamesUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [playerNames, setPlayerNames] = useState<Record<number, string>>(() => {
    const names: Record<number, string> = {};
    schedule.playerStats.forEach(stat => {
      names[stat.playerId] = stat.playerName;
    });
    return names;
  });
  const [originalNames, setOriginalNames] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEditing = () => {
    setOriginalNames({ ...playerNames });
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setPlayerNames({ ...originalNames });
    setIsEditing(false);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await onPlayerNamesUpdate(playerNames);
      setIsEditing(false);
      toast({
        title: "Player names updated",
        description: "All player names have been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating player names:', error);
      toast({
        title: "Error",
        description: "Failed to update player names. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlayerNameChange = (playerId: number, newName: string) => {
    setPlayerNames(prev => ({
      ...prev,
      [playerId]: newName
    }));
  };

  const hasChanges = () => {
    return Object.entries(playerNames).some(([playerId, name]) => 
      originalNames[parseInt(playerId)] !== name
    );
  };

  return (
    <div className="space-y-4">
      {!isEditing ? (
        <div className="flex justify-end">
          <Button onClick={handleStartEditing} variant="outline" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Player Names
          </Button>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <Button 
            onClick={handleCancelEditing} 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={isSaving}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button 
            onClick={handleSaveChanges} 
            className="flex items-center gap-2"
            disabled={!hasChanges() || isSaving}
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schedule.playerStats
          .sort((a, b) => a.playerId - b.playerId)
          .map((stat) => (
            <Card key={stat.playerId} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Label htmlFor={`player-${stat.playerId}`} className="text-sm font-medium">
                    Player {stat.playerId}
                  </Label>
                  {isEditing ? (
                    <Input
                      id={`player-${stat.playerId}`}
                      value={playerNames[stat.playerId] || ''}
                      onChange={(e) => handlePlayerNameChange(stat.playerId, e.target.value)}
                      placeholder={`Player ${stat.playerId}`}
                      className="w-full"
                    />
                  ) : (
                    <div className="p-2 bg-gray-50 rounded border text-sm">
                      {stat.playerName}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default PlayerNameEditor;