import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

interface CountdownTimerProps {
  onTimerComplete: () => void;
  onTimerStart: () => void;
  onTimerStop: () => void;
  onTimerReset: () => void;
  onCompleteRound: () => void;
  currentRound: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  onTimerComplete,
  onTimerStart,
  onTimerStop,
  onTimerReset,
  onCompleteRound,
  currentRound
}) => {
  const [initialMinutes, setInitialMinutes] = useState(9);
  const [initialSeconds, setInitialSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(9 * 60); // 9 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setTimeLeft(initialMinutes * 60 + initialSeconds);
  }, [initialMinutes, initialSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsRunning(false);
            onTimerComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else if (!isRunning && interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, onTimerComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    onTimerStart();
  };

  const handleStop = () => {
    setIsRunning(false);
    onTimerStop();
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(initialMinutes * 60 + initialSeconds);
    onTimerReset();
  };

  const handleMinutesChange = (minutes: number) => {
    if (minutes >= 0 && minutes <= 120) {
      setInitialMinutes(minutes);
      if (!isRunning) {
        setTimeLeft(minutes * 60 + initialSeconds);
      }
    }
  };

  const handleSecondsChange = (seconds: number) => {
    if (seconds >= 0 && seconds <= 59) {
      setInitialSeconds(seconds);
      if (!isRunning) {
        setTimeLeft(initialMinutes * 60 + seconds);
      }
    }
  };

  const getTimerColor = () => {
    if (timeLeft <= 60) return 'text-red-600'; // Last minute - red
    if (timeLeft <= 300) return 'text-orange-600'; // Last 5 minutes - orange
    return 'text-primary'; // Normal - primary color
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Round {currentRound} Timer</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          {showSettings && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium">
                Set Timer:
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="timer-minutes"
                  type="number"
                  min="0"
                  max="120"
                  value={initialMinutes}
                  onChange={(e) => handleMinutesChange(parseInt(e.target.value) || 0)}
                  className="w-20"
                  disabled={isRunning}
                />
                <span className="text-sm text-muted-foreground">min</span>
                <Input
                  id="timer-seconds"
                  type="number"
                  min="0"
                  max="59"
                  value={initialSeconds}
                  onChange={(e) => handleSecondsChange(parseInt(e.target.value) || 0)}
                  className="w-20"
                  disabled={isRunning}
                />
                <span className="text-sm text-muted-foreground">sec</span>
              </div>
            </div>
          )}
          
          <div className={`text-6xl font-bold ${getTimerColor()}`}>
            {formatTime(timeLeft)}
          </div>
          
          {timeLeft <= 60 && timeLeft > 0 && (
            <div className="text-red-600 font-medium animate-pulse">
              Last minute!
            </div>
          )}
          
          <div className="flex justify-center gap-4">
            {!isRunning ? (
              <>
                <Button 
                  onClick={handleStart} 
                  size="lg" 
                  className="flex items-center gap-2"
                  disabled={timeLeft === 0}
                >
                  <Play className="h-5 w-5" />
                  Start Timer
                </Button>
                <Button 
                  onClick={onCompleteRound} 
                  size="lg" 
                  variant="secondary" 
                  className="flex items-center gap-2"
                >
                  Complete Round
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleStop} 
                size="lg" 
                variant="destructive" 
                className="flex items-center gap-2"
              >
                <Pause className="h-5 w-5" />
                Stop Timer
              </Button>
            )}
            
            <Button 
              onClick={handleReset} 
              size="lg" 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-5 w-5" />
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CountdownTimer;