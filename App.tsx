import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, Droplets, Coffee, Settings2, FlaskConical, Sun, Moon } from 'lucide-react';
import { BrewChart } from './components/BrewChart';
import { generateRecipe, getCurrentStep } from './utils/recipe';
import { BrewMethod } from './types';
import { playStepCompleteTone, initAudio } from './utils/audio';

const DEFAULT_WATER = 300;

const App: React.FC = () => {
  // Settings
  const [totalWater, setTotalWater] = useState(() => {
    const saved = localStorage.getItem('totalWater');
    return saved ? Number(saved) : DEFAULT_WATER;
  });

  useEffect(() => {
    localStorage.setItem('totalWater', totalWater.toString());
  }, [totalWater]);

  const [demoSpeed, setDemoSpeed] = useState(1);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [brewMethod, setBrewMethod] = useState<BrewMethod>(() => {
    const saved = localStorage.getItem('brewMethod');
    return (saved as BrewMethod) || '4:6';
  });

  useEffect(() => {
    localStorage.setItem('brewMethod', brewMethod);
  }, [brewMethod]);

  // Timer State
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Recipe State
  const recipe = useMemo(() => generateRecipe(totalWater, brewMethod), [totalWater, brewMethod]);
  const currentStep = getCurrentStep(recipe, time);

  // Refs for animation loop
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const lastStepIndexRef = useRef<number>(-1);

  // Derived values
  const coffeeWeight = useMemo(() => {
    if (brewMethod === 'hoffmann-1cup') return Math.round(totalWater / 16.66);
    return Math.round(totalWater / 15); // 1:15 Ratio standard for 4:6 method
  }, [totalWater, brewMethod]);

  const reset = () => {
    setIsRunning(false);
    setTime(0);
    setIsFinished(false);
    lastStepIndexRef.current = -1;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const togglePlay = () => {
    if (!isRunning) {
      initAudio(); // Ensure audio context is ready
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  };

  const animate = useCallback((timestamp: number) => {
    if (!previousTimeRef.current) previousTimeRef.current = timestamp;

    const deltaTime = (timestamp - previousTimeRef.current) / 1000; // Convert to seconds
    previousTimeRef.current = timestamp;

    setTime(prevTime => {
      // Apply speed multiplier
      const newTime = prevTime + (deltaTime * demoSpeed);

      // Check for finish
      const endTime = recipe[recipe.length - 1].endTime;
      if (newTime >= endTime) {
        setIsFinished(true);
        setIsRunning(false);
        return endTime;
      }
      return newTime;
    });

    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [isRunning, demoSpeed, recipe]);

  useEffect(() => {
    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      previousTimeRef.current = undefined;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, animate]);

  // Tone Logic
  useEffect(() => {
    // Find which step index we are in
    const stepIndex = recipe.findIndex(s => time >= s.startTime && time < s.endTime);

    // If we entered a new step (and it's not the very start 0)
    if (stepIndex !== -1 && stepIndex !== lastStepIndexRef.current) {
      if (lastStepIndexRef.current !== -1) {
        // We moved from one step to another
        playStepCompleteTone();
      }
      lastStepIndexRef.current = stepIndex;
    } else if (isFinished && lastStepIndexRef.current !== -1) {
      // Finished the brew
      playStepCompleteTone();
      lastStepIndexRef.current = -1;
    }
  }, [time, recipe, isFinished]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    // Show fractional if speeding up for debugging? No, standard timer is fine.
    return `${m}:${s.toString().padStart(2, '0')}`;
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center p-2 md:p-8 font-sans transition-colors duration-300">

      {/* Main Card */}
      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden relative transition-colors duration-300">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {brewMethod === 'hoffmann-1cup' ? 'James Hoffmann 1-Cup' : 'V60 Guide: 4:6 Method'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center gap-2">
              <Coffee size={14} />
              <span>Recommended Dose: <span className="text-blue-500 dark:text-blue-400 font-bold">{coffeeWeight}g</span> Coffee</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="text-right">
              <div className="text-5xl font-mono font-bold tracking-wider text-gray-900 dark:text-white tabular-nums">
                {formatTime(time)}
              </div>
              <div className="text-sm font-medium text-blue-500 dark:text-blue-400 mt-1">
                {isFinished ? "Enjoy!" : (currentStep?.description || "Get Ready")}
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="relative w-full h-[300px] md:h-[450px] bg-gray-50/50 dark:bg-gray-900/50 p-2 md:p-4 transition-colors duration-300">
          {/* Chart */}

          <BrewChart
            currentTime={time}
            recipe={recipe}
            totalWater={totalWater}
            theme={theme}
          />
        </div>

        {/* Controls & Settings */}
        <div className="p-6 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">



          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brew Method */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <FlaskConical size={16} className="text-green-500 dark:text-green-400" />
                Brew Method
              </label>
              <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1 transition-colors duration-300">
                <button
                  onClick={() => { reset(); setBrewMethod('4:6'); }}
                  className={`flex-1 py-1 px-2 rounded-md text-sm font-medium transition-all ${brewMethod === '4:6'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                  4:6 Method
                </button>
                <button
                  onClick={() => { reset(); setBrewMethod('hoffmann-1cup'); }}
                  className={`flex-1 py-1 px-2 rounded-md text-sm font-medium transition-all ${brewMethod === 'hoffmann-1cup'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                  Hoffmann
                </button>
              </div>
              <div className="text-xs text-gray-500 px-1">
                {brewMethod === '4:6' ? 'Sweetness & Strength balance' : 'Better 1 Cup Technique'}
              </div>
            </div>

            {/* Water Settings */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Droplets size={16} className="text-blue-500 dark:text-blue-400" />
                  Total Water
                </label>
                <span className="text-blue-500 dark:text-blue-400 font-bold">{totalWater}g</span>
              </div>
              <input
                type="range"
                min="150"
                max="600"
                step="10"
                value={totalWater}
                onChange={(e) => {
                  reset();
                  setTotalWater(Number(e.target.value));
                }}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
              />
              <div className="flex justify-between text-xs text-gray-500 px-1">
                <span>150g</span>
                <span>600g</span>
              </div>
            </div>

            {/* Speed Settings */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Settings2 size={16} className="text-purple-500 dark:text-purple-400" />
                  Demo Speed
                </label>
                <span className="text-purple-500 dark:text-purple-400 font-bold">{demoSpeed}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={demoSpeed}
                onChange={(e) => setDemoSpeed(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
              />
              <div className="flex justify-between text-xs text-gray-500 px-1">
                <span>Realtime</span>
                <span>Fast Forward</span>
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex justify-center gap-4">
            <button
              onClick={togglePlay}
              className={`
                flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 shadow-lg
                ${isRunning
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-yellow-900/20'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'}
              `}
            >
              {isRunning ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              {isRunning ? 'Pause' : time > 0 ? 'Resume' : 'Start Brewing'}
            </button>

            <button
              onClick={reset}
              className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-all transform active:scale-95 shadow-lg shadow-gray-400/20 dark:shadow-gray-900/20"
            >
              <RotateCcw size={24} />
              Reset
            </button>
          </div>

        </div>
      </div>

      <p className="mt-8 text-gray-500 text-sm text-center max-w-2xl">
        {brewMethod === '4:6'
          ? "Based on Tetsu Kasuya's 4:6 method. Adjust grind size to finish drawdown around 3:30."
          : "Based on James Hoffmann's 'Better 1 Cup V60' technique. High temp, medium-fine grind."}
      </p>

    </div >
  );
};

export default App;