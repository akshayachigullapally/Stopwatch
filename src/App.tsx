import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw, Clock, Trash2 } from 'lucide-react';

interface LapTime {
  id: number;
  lapNumber: number;
  lapTime: number;
  totalTime: number;
}

interface FloatingClock {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  speed: number;
  opacity: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

function App() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [lapTimes, setLapTimes] = useState<LapTime[]>([]);
  const [floatingClocks, setFloatingClocks] = useState<FloatingClock[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const lapCounter = useRef(1);
  const animationRef = useRef<number>();

  const formatTime = (timeMs: number): string => {
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    const milliseconds = Math.floor((timeMs % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // Initialize floating clocks
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clocks: FloatingClock[] = [];
      for (let i = 0; i < 8; i++) {
        clocks.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 40 + 20,
          rotation: Math.random() * 360,
          speed: Math.random() * 0.5 + 0.2,
          opacity: Math.random() * 0.3 + 0.1,
        });
      }
      setFloatingClocks(clocks);
    }
  }, []);

  // Animate floating clocks
  useEffect(() => {
    const animateClocks = () => {
      setFloatingClocks(prev => prev.map(clock => ({
        ...clock,
        rotation: clock.rotation + clock.speed,
        y: clock.y + Math.sin(clock.rotation * 0.01) * 0.5,
        x: clock.x + Math.cos(clock.rotation * 0.008) * 0.3,
      })));
      animationRef.current = requestAnimationFrame(animateClocks);
    };
    animationRef.current = requestAnimationFrame(animateClocks);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Create particles when starting/stopping
  const createParticles = useCallback((centerX: number, centerY: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: centerX,
        y: centerY,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 4 + 2,
        opacity: 1,
        color,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Animate particles
  useEffect(() => {
    const animateParticles = () => {
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          opacity: particle.opacity - 0.02,
          vy: particle.vy + 0.1, // gravity
        }))
        .filter(particle => particle.opacity > 0)
      );
    };

    const particleInterval = setInterval(animateParticles, 16);
    return () => clearInterval(particleInterval);
  }, []);

  const startStopwatch = useCallback(() => {
    if (!isRunning) {
      startTimeRef.current = Date.now() - time;
      intervalRef.current = setInterval(() => {
        setTime(Date.now() - startTimeRef.current);
      }, 10);
      setIsRunning(true);
      createParticles(window.innerWidth / 2, window.innerHeight / 2, '#10B981');
    }
  }, [isRunning, time, createParticles]);

  const pauseStopwatch = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    createParticles(window.innerWidth / 2, window.innerHeight / 2, '#F59E0B');
  }, [createParticles]);

  const resetStopwatch = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTime(0);
    setIsRunning(false);
    setLapTimes([]);
    lapCounter.current = 1;
    createParticles(window.innerWidth / 2, window.innerHeight / 2, '#EF4444');
  }, [createParticles]);

  const recordLap = useCallback(() => {
    if (isRunning && time > 0) {
      const newLap: LapTime = {
        id: Date.now(),
        lapNumber: lapCounter.current,
        lapTime: lapTimes.length > 0 ? time - lapTimes[lapTimes.length - 1].totalTime : time,
        totalTime: time,
      };
      setLapTimes(prev => [...prev, newLap]);
      lapCounter.current += 1;
      createParticles(window.innerWidth / 2, window.innerHeight / 2, '#3B82F6');
    }
  }, [isRunning, time, lapTimes, createParticles]);

  const clearLaps = useCallback(() => {
    setLapTimes([]);
    lapCounter.current = 1;
    createParticles(window.innerWidth / 2, window.innerHeight / 2, '#8B5CF6');
  }, [createParticles]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (isRunning) {
            pauseStopwatch();
          } else {
            startStopwatch();
          }
          break;
        case 'KeyR':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            resetStopwatch();
          }
          break;
        case 'KeyL':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            recordLap();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRunning, startStopwatch, pauseStopwatch, resetStopwatch, recordLap]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div>
      {/* Page Heading */}
    <div className="absolute top-8 left-0 right-0 text-center z-20">
      <h1 className="text-4xl font-extrabold text-white bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-lg">
        Welcome to Stopwatch Pro
      </h1>
      <p className="text-white/70 mt-2 text-sm">
        A sleek and interactive stopwatch with animations and shortcuts.
      </p>
    </div>
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-indigo-900 to-black">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20 animate-pulse"></div>
        <div 
          className="absolute inset-0 bg-gradient-to-l from-gray-800/20 to-indigo-800/20 animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      {/* Floating Clocks */}
      {floatingClocks.map(clock => (
        <div
          key={clock.id}
          className="absolute pointer-events-none"
          style={{
            left: `${clock.x}px`,
            top: `${clock.y}px`,
            transform: `rotate(${clock.rotation}deg)`,
            opacity: clock.opacity,
          }}
        >
          <Clock 
            size={clock.size} 
            className="text-white/30 drop-shadow-lg animate-pulse" 
          />
        </div>
      ))}

      {/* Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute pointer-events-none rounded-full"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
          }}
        />
      ))}

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite',
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Main Stopwatch Container */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-500 hover:scale-105 hover:shadow-3xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="relative">
                  <Clock className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '8s' }} />
                  <div className="absolute inset-0 w-8 h-8 bg-white/20 rounded-full animate-ping"></div>
                </div>
                <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Stopwatch Pro
                </h1>
              </div>
              <p className="text-white/70 text-sm animate-pulse">Press Space to start/pause</p>
            </div>

            {/* Time Display */}
            <div className="text-center mb-8">
              <div className="bg-black/40 rounded-2xl p-6 mb-4 relative overflow-hidden group hover:bg-black/50 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative text-5xl font-mono font-bold text-white tracking-wider drop-shadow-lg">
                  {formatTime(time)}
                </div>
                {isRunning && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={isRunning ? pauseStopwatch : startStopwatch}
                className={`group relative flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-110 active:scale-95 transform-gpu ${
                  isRunning
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/40'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/40'
                }`}
              >
                <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {isRunning ? <Pause className="w-5 h-5 relative z-10" /> : <Play className="w-5 h-5 relative z-10" />}
                <span className="relative z-10">{isRunning ? 'Pause' : 'Start'}</span>
              </button>

              <button
                onClick={resetStopwatch}
                className="group relative flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg shadow-red-500/40 transform-gpu"
              >
                <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Square className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Reset</span>
              </button>
            </div>

            {/* Lap and Clear Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={recordLap}
                disabled={!isRunning || time === 0}
                className="group relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg shadow-blue-500/40 disabled:shadow-none transform-gpu"
              >
                <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <RotateCcw className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Lap</span>
              </button>

              <button
                onClick={clearLaps}
                disabled={lapTimes.length === 0}
                className="group relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 disabled:from-gray-500/50 disabled:to-slate-500/50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg shadow-gray-500/40 disabled:shadow-none transform-gpu"
              >
                <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Trash2 className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Clear</span>
              </button>
            </div>

            {/* Lap Times */}
            {lapTimes.length > 0 && (
              <div className="bg-black/30 rounded-2xl p-4 max-h-64 overflow-y-auto backdrop-blur-sm border border-white/10">
                <h3 className="text-white font-semibold mb-3 text-center flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Lap Times
                </h3>
                <div className="space-y-2">
                  {lapTimes
                    .slice()
                    .reverse()
                    .map((lap, index) => (
                      <div
                        key={lap.id}
                        className={`flex justify-between items-center py-3 px-4 rounded-lg text-sm transition-all duration-300 hover:scale-105 hover:bg-white/20 ${
                          index % 2 === 0 ? 'bg-white/10' : 'bg-white/5'
                        }`}
                        style={{
                          animation: `slideIn 0.5s ease-out ${index * 0.1}s both`,
                        }}
                      >
                        <span className="text-white/80 font-medium flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          Lap {lap.lapNumber}
                        </span>
                        <div className="text-right">
                          <div className="text-white font-mono font-bold">
                            {formatTime(lap.lapTime)}
                          </div>
                          <div className="text-white/60 text-xs font-mono">
                            Total: {formatTime(lap.totalTime)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <p className="text-white/60 text-xs text-center animate-pulse">
                Shortcuts: Space (Start/Pause) • Ctrl+R (Reset) • Ctrl+L (Lap)
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
    </div>
  );
}

export default App;