import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize, 
  Settings, 
  ArrowLeft,
  Timer as TimerIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import AnimatedSection from '@/components/AnimatedSection';

const MatchTimer = () => {
  const [minutes, setMinutes] = useState(15);
  const [seconds, setSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // Convert to seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create siren sound using Web Audio API
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    const createSirenSound = () => {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.setValueAtTime(800, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, context.currentTime + 0.5);
      oscillator.frequency.exponentialRampToValueAtTime(800, context.currentTime + 1);
      
      gainNode.gain.setValueAtTime(0.3, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1);
      
      oscillator.start();
      oscillator.stop(context.currentTime + 1);
    };

    audioRef.current = { play: createSirenSound } as any;
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            setIsFlashing(true);
            // Play siren sound
            if (audioRef.current) {
              audioRef.current.play();
            }
            toast("Time's up!");
            // Flash for 10 seconds
            setTimeout(() => setIsFlashing(false), 10000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleStart = () => {
    if (timeLeft > 0) {
      setIsRunning(true);
      setShowSettings(false);
      setIsFinished(false);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setIsFlashing(false);
    setTimeLeft(minutes * 60 + seconds);
    setShowSettings(true);
  };

  const handleTimeChange = () => {
    const totalSeconds = minutes * 60 + seconds;
    if (totalSeconds > 0) {
      setTimeLeft(totalSeconds);
    }
  };

  const goFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isFlashing 
        ? 'bg-gradient-to-br from-red-500 via-red-400 to-red-600 animate-pulse' 
        : 'bg-gradient-to-br from-green-50 via-blue-50 to-white'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <AnimatedSection animation="fade-up" className="flex justify-between items-center mb-8">
          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button onClick={goFullscreen} variant="outline" size="sm">
              <Maximize className="h-4 w-4 mr-2" />
              Fullscreen
            </Button>
          </div>
        </AnimatedSection>

        {/* Settings Panel */}
        {showSettings && (
          <AnimatedSection animation="scale-in" delay={100}>
            <Card className="mb-8 max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TimerIcon className="h-5 w-5" />
                Timer Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minutes">Minutes</Label>
                  <Input
                    id="minutes"
                    type="number"
                    min="0"
                    max="99"
                    value={minutes}
                    onChange={(e) => {
                      setMinutes(parseInt(e.target.value) || 0);
                      setTimeout(handleTimeChange, 100);
                    }}
                    disabled={isRunning}
                  />
                </div>
                <div>
                  <Label htmlFor="seconds">Seconds</Label>
                  <Input
                    id="seconds"
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={(e) => {
                      setSeconds(parseInt(e.target.value) || 0);
                      setTimeout(handleTimeChange, 100);
                    }}
                    disabled={isRunning}
                  />
                </div>
              </div>
            </CardContent>
            </Card>
          </AnimatedSection>
        )}

        {/* Timer Display */}
        <AnimatedSection animation="scale-in" delay={showSettings ? 200 : 100} className="flex justify-center mb-8">
          <Card className={`w-full max-w-2xl ${isFlashing ? 'bg-white/90' : ''}`}>
            <CardContent className="p-8 text-center">
              <div className={`text-8xl md:text-9xl font-mono font-bold mb-8 ${
                isFinished ? 'text-red-600' : 'text-primary'
              } ${isFlashing ? 'animate-pulse' : ''}`}>
                {formatTime(timeLeft)}
              </div>
              
              {isFinished && (
                <div className="text-2xl font-bold text-red-600 mb-6 animate-bounce">
                  TIME'S UP!
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex justify-center gap-4">
                {!isRunning ? (
                  <Button 
                    onClick={handleStart} 
                    size="lg"
                    disabled={timeLeft === 0}
                    className="px-8"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Start
                  </Button>
                ) : (
                  <Button onClick={handlePause} size="lg" variant="secondary" className="px-8">
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </Button>
                )}
                
                <Button onClick={handleReset} size="lg" variant="outline" className="px-8">
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Instructions */}
        {!isRunning && !isFinished && (
          <AnimatedSection animation="fade-in" delay={300} className="text-center text-gray-600 max-w-md mx-auto">
            <p className="mb-2">Set your match duration and click Start to begin the timer.</p>
            <p className="text-sm">The timer will flash red and sound a siren when time is up.</p>
          </AnimatedSection>
        )}
      </div>
    </div>
  );
};

export default MatchTimer;