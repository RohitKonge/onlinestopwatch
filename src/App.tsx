import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, GitFork, Flag, Download, Bell, Keyboard, X, ChevronUp, ChevronDown, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SplitTime {
  id: number;
  time: string;
  duration: number;
  lap: string;
}

interface Target {
  hours: string;
  minutes: string;
  seconds: string;
}

function App() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [splits, setSplits] = useState<SplitTime[]>([]);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [target, setTarget] = useState<Target>({ hours: '00', minutes: '00', seconds: '00' });
  const [showTarget, setShowTarget] = useState(false);
  const lastSplitTime = useRef(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = useCallback((ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
      milliseconds: milliseconds.toString().padStart(2, '0')
    };
  }, []);

  const calculateStats = useCallback(() => {
    if (splits.length === 0) return null;
    
    const lapTimes = splits.map(split => split.duration);
    const avgLap = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
    const bestLap = Math.min(...lapTimes);
    const worstLap = Math.max(...lapTimes);
    
    return {
      average: formatTime(avgLap),
      best: formatTime(bestLap),
      worst: formatTime(worstLap)
    };
  }, [splits, formatTime]);

  useEffect(() => {
    let interval: number | undefined;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 10;
          const targetMs = (parseInt(target.hours) * 3600000) + 
                         (parseInt(target.minutes) * 60000) + 
                         (parseInt(target.seconds) * 1000);
          if (targetMs > 0 && newTime >= targetMs && prevTime < targetMs) {
            audioRef.current?.play();
          }
          return newTime;
        });
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning, target]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleStartStop();
      } else if (e.code === 'KeyR') {
        handleReset();
      } else if (e.code === 'KeyS') {
        handleSplit();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRunning]);

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setSplits([]);
    lastSplitTime.current = 0;
  };

  const handleSplit = () => {
    if (isRunning) {
      const currentSplit = time - lastSplitTime.current;
      const formattedTime = formatTime(time);
      const formattedSplit = formatTime(currentSplit);
      const timeString = `${formattedTime.hours}:${formattedTime.minutes}:${formattedTime.seconds}.${formattedTime.milliseconds}`;
      const lapString = `${formattedSplit.hours}:${formattedSplit.minutes}:${formattedSplit.seconds}.${formattedSplit.milliseconds}`;
      
      setSplits(prevSplits => [...prevSplits, {
        id: Date.now(),
        time: timeString,
        duration: currentSplit,
        lap: lapString
      }]);
      
      lastSplitTime.current = time;
    }
  };

  const handleExportExcel = () => {
    const stats = calculateStats();
    const currentDate = new Date().toLocaleString();
    
    // Prepare worksheet data
    const wsData = [
      ['Stopwatch Session - ' + currentDate],
      [],
      ['Total Time', `${hours}:${minutes}:${seconds}.${milliseconds}`],
      [],
      ['Statistics'],
      ['Average Lap', `${stats?.average.hours}:${stats?.average.minutes}:${stats?.average.seconds}.${stats?.average.milliseconds}`],
      ['Best Lap', `${stats?.best.hours}:${stats?.best.minutes}:${stats?.best.seconds}.${stats?.best.milliseconds}`],
      ['Worst Lap', `${stats?.worst.hours}:${stats?.worst.minutes}:${stats?.worst.seconds}.${stats?.worst.milliseconds}`],
      [],
      ['Split Times'],
      ['Split Number', 'Total Time', 'Lap Time']
    ];

    // Add split times
    splits.forEach((split, index) => {
      wsData.push([index + 1, split.time, split.lap]);
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = [{ wch: 15 }, { wch: 20 }, { wch: 20 }];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Stopwatch Data');

    // Save file
    XLSX.writeFile(wb, `stopwatch-session-${currentDate.replace(/[/:\\]/g, '-')}.xlsx`);
  };

  const { hours, minutes, seconds, milliseconds } = formatTime(time);
  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white text-gray-800">
      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 text-blue-600">Free Online Stopwatch</h1>
          <p className="text-gray-600 text-xl mb-4">Professional Digital Timer with Split Times & Analytics</p>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Accurate to milliseconds, perfect for sports timing, workout tracking, cooking, studying, and professional time management. Works offline with keyboard shortcuts and split time tracking.
          </p>
        </header>

        {/* Rich Feature Section for SEO */}
        <section className="mb-8 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-blue-600">Millisecond Precision</h2>
              <p className="text-sm text-gray-600">High-accuracy timing</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-blue-600">Works Offline</h2>
              <p className="text-sm text-gray-600">No internet needed</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-blue-600">Split Times</h2>
              <p className="text-sm text-gray-600">Track lap times easily</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-blue-600">Excel Export</h2>
              <p className="text-sm text-gray-600">Save your timings</p>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100">
          <div className="mb-8 flex justify-end">
            <button
              onClick={() => setShowTarget(!showTarget)}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
            >
              <Bell size={20} />
              {showTarget ? 'Hide Target' : 'Set Target'}
            </button>
          </div>

          {showTarget && (
            <div className="mb-8 p-4 bg-gray-50 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Set Target Time</h3>
              <div className="flex gap-4 items-center justify-center">
                <div>
                  <label className="block text-sm text-gray-600">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={target.hours}
                    onChange={(e) => setTarget(prev => ({ ...prev, hours: e.target.value.padStart(2, '0') }))}
                    className="w-16 p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={target.minutes}
                    onChange={(e) => setTarget(prev => ({ ...prev, minutes: e.target.value.padStart(2, '0') }))}
                    className="w-16 p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Seconds</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={target.seconds}
                    onChange={(e) => setTarget(prev => ({ ...prev, seconds: e.target.value.padStart(2, '0') }))}
                    className="w-16 p-2 border rounded"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="text-center mb-12">
            <div className="font-mono text-7xl md:text-8xl lg:text-9xl tracking-wider">
              <span>{hours}</span>
              <span className="text-blue-500">:</span>
              <span>{minutes}</span>
              <span className="text-blue-500">:</span>
              <span>{seconds}</span>
              <span className="text-blue-500">.</span>
              <span className="text-4xl md:text-5xl lg:text-6xl text-blue-500">{milliseconds}</span>
            </div>
          </div>

          <div className="flex justify-center gap-8 mb-12">
            <button
              onClick={handleStartStop}
              className={`rounded-full p-6 ${
                isRunning
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              } transition-colors text-white shadow-lg`}
              aria-label={isRunning ? 'Pause' : 'Start'}
            >
              {isRunning ? <Pause size={32} /> : <Play size={32} />}
            </button>
            
            <button
              onClick={handleSplit}
              className="rounded-full p-6 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 shadow-lg"
              aria-label="Split"
            >
              <GitFork size={32} />
            </button>

            <button
              onClick={handleReset}
              className="rounded-full p-6 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 shadow-lg"
              aria-label="Reset"
            >
              <RotateCcw size={32} />
            </button>

            {splits.length > 0 && (
              <button
                onClick={handleExportExcel}
                className="rounded-full p-6 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 shadow-lg"
                aria-label="Export to Excel"
                title="Export to Excel"
              >
                <FileSpreadsheet size={32} />
              </button>
            )}
          </div>

          <div className="flex justify-center mb-8">
            <button
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
            >
              <Keyboard size={20} />
              {showKeyboardShortcuts ? 'Hide Shortcuts' : 'Show Shortcuts'}
            </button>
          </div>

          {showKeyboardShortcuts && (
            <div className="mb-8 p-4 bg-gray-50 rounded-xl">
              <h3 className="text-lg font-semibold mb-2">Keyboard Shortcuts</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white rounded border">Space</kbd>
                  <span>Start/Pause</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white rounded border">R</kbd>
                  <span>Reset</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white rounded border">S</kbd>
                  <span>Split</span>
                </div>
              </div>
            </div>
          )}

          {splits.length > 0 && (
            <>
              <div className="mb-8 p-6 bg-blue-50 rounded-xl">
                <h3 className="text-lg font-semibold mb-4">Lap Statistics</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-gray-600">Average Lap</p>
                    <p className="font-mono text-lg">{stats?.average.hours}:{stats?.average.minutes}:{stats?.average.seconds}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Best Lap</p>
                    <p className="font-mono text-lg text-green-600">{stats?.best.hours}:{stats?.best.minutes}:{stats?.best.seconds}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Worst Lap</p>
                    <p className="font-mono text-lg text-red-600">{stats?.worst.hours}:{stats?.worst.minutes}:{stats?.worst.seconds}</p>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-gray-700">
                  <Timer size={28} />
                  Split Times
                </h2>
                <div className="bg-gray-50 rounded-2xl p-6 max-h-80 overflow-y-auto shadow-inner">
                  {splits.map((split, index) => (
                    <div
                      key={split.id}
                      className="flex justify-between items-center py-4 px-6 border-b border-gray-200 last:border-0"
                    >
                      <div>
                        <span className="text-gray-600 text-lg">Split {index + 1}</span>
                        <span className="ml-4 text-sm text-gray-500">Lap: {split.lap}</span>
                      </div>
                      <span className="font-mono text-xl">{split.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Additional SEO Content */}
        <footer className="mt-12 text-center text-gray-600 max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Why Use Our Online Stopwatch?</h2>
          <p className="mb-4">
            Our professional-grade online stopwatch combines precision timing with user-friendly features. 
            Perfect for athletes, teachers, students, and professionals who need reliable timing tools.
          </p>
          <div className="text-sm mt-8">
            <p>© {new Date().getFullYear()} Online Stopwatch - The Most Accurate Free Online Timer</p>
            <p>Available 24/7 at onlinestopwatch.site</p>
          </div>
        </footer>
      </main>
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />
    </div>
  );
}

export default App;