import React from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SavedSchedule } from '@/types/schedule';

interface BeginTournamentButtonProps {
  schedule: SavedSchedule;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
}

const BeginTournamentButton: React.FC<BeginTournamentButtonProps> = ({
  schedule,
  className = "",
  variant = "default",
  size = "default",
  disabled = false
}) => {
  const navigate = useNavigate();

  const handleBeginTournament = () => {
    navigate('/tournament', {
      state: {
        schedule: schedule.schedule,
        name: schedule.name,
        scheduleId: schedule.id
      }
    });
  };

  return (
    <Button 
      onClick={handleBeginTournament}
      className={`flex items-center gap-2 ${className}`}
      variant={variant}
      size={size}
      disabled={disabled}
    >
      <Play className="h-4 w-4" />
      Begin Tournament
    </Button>
  );
};

export default BeginTournamentButton;