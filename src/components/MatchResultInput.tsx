import React, { useState } from 'react';
import { Match, MatchResult } from '@/types/schedule';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

interface MatchResultInputProps {
  match: Match;
  onResultUpdate: (matchId: number, result: MatchResult) => void;
}

const MatchResultInput: React.FC<MatchResultInputProps> = ({ match, onResultUpdate }) => {
  const [team1Score, setTeam1Score] = useState(match.result?.team1Score?.toString() || '');
  const [team2Score, setTeam2Score] = useState(match.result?.team2Score?.toString() || '');

  const autoSaveResult = (t1Score: string, t2Score: string) => {
    if (t1Score !== '' && t2Score !== '' && !isNaN(parseInt(t1Score)) && !isNaN(parseInt(t2Score))) {
      const result: MatchResult = {
        team1Score: parseInt(t1Score),
        team2Score: parseInt(t2Score),
        completed: true
      };
      onResultUpdate(match.id, result);
    }
  };

  const handleTeam1ScoreChange = (value: string) => {
    setTeam1Score(value);
    autoSaveResult(value, team2Score);
  };

  const handleTeam2ScoreChange = (value: string) => {
    setTeam2Score(value);
    autoSaveResult(team1Score, value);
  };

  const handleClearResult = () => {
    setTeam1Score('');
    setTeam2Score('');
    onResultUpdate(match.id, { team1Score: 0, team2Score: 0, completed: false });
  };

  const isCompleted = match.result?.completed || false;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Round {match.round} - Court {match.court}</span>
          {isCompleted && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Complete
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Teams Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="font-medium text-sm mb-2">Team 1</div>
              <div className="text-xs space-y-1">
                <div>{match.players[0]?.name}</div>
                <div>{match.players[1]?.name}</div>
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium text-sm mb-2">Team 2</div>
              <div className="text-xs space-y-1">
                <div>{match.players[2]?.name}</div>
                <div>{match.players[3]?.name}</div>
              </div>
            </div>
          </div>

          {/* Score Input */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                type="number"
                placeholder="Score"
                value={team1Score}
                onChange={(e) => handleTeam1ScoreChange(e.target.value)}
                className="text-center"
                min="0"
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Score"
                value={team2Score}
                onChange={(e) => handleTeam2ScoreChange(e.target.value)}
                className="text-center"
                min="0"
              />
            </div>
          </div>

          {/* Clear Button */}
          {isCompleted && (
            <div className="flex justify-center">
              <Button
                onClick={handleClearResult}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear Result
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchResultInput;