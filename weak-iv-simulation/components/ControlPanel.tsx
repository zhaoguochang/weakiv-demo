import React from 'react';
import { Settings2, Play, Pause, Square, Download, Image as ImageIcon, FileText } from 'lucide-react';

interface ControlPanelProps {
  ivStrength: number;
  setIvStrength: (v: number) => void;
  endogeneity: number;
  setEndogeneity: (v: number) => void;
  sampleSize: number;
  setSampleSize: (v: number) => void;
  replications: number;
  setReplications: (v: number) => void;
  seed: number;
  setSeed: (v: number) => void;
  onRun: () => void;
  onPause: () => void;
  onCancel: () => void;
  onDownloadData: () => void;
  onDownloadImage: () => void;
  isRunning: boolean;
  isPaused: boolean;
  hasResults: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  ivStrength,
  setIvStrength,
  endogeneity,
  setEndogeneity,
  sampleSize,
  setSampleSize,
  replications,
  setReplications,
  seed,
  setSeed,
  onRun,
  onPause,
  onCancel,
  onDownloadData,
  onDownloadImage,
  isRunning,
  isPaused,
  hasResults,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col transition-colors duration-200">
      <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-100">
        <Settings2 className="w-5 h-5" />
        <h2 className="font-bold text-lg">Simulation Controls</h2>
      </div>

      <div className="space-y-6 flex-1">
        
        {/* IV Strength Control */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">IV Strength (π)</label>
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-slate-600 dark:text-slate-400">
              {ivStrength.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1.5"
            step="0.05"
            value={ivStrength}
            onChange={(e) => setIvStrength(parseFloat(e.target.value))}
            disabled={isRunning}
            className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50"
          />
        </div>

        {/* Endogeneity Control */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Endogeneity (ρ)</label>
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-slate-600 dark:text-slate-400">
              {endogeneity.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="0.9"
            step="0.1"
            value={endogeneity}
            onChange={(e) => setEndogeneity(parseFloat(e.target.value))}
            disabled={isRunning}
            className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50"
          />
        </div>

        {/* Sample Size Control */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sample Size (N)</label>
          </div>
          <select 
            value={sampleSize}
            onChange={(e) => setSampleSize(parseInt(e.target.value))}
            disabled={isRunning}
            className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
          >
            <option value="100">100 (Small)</option>
            <option value="500">500 (Medium)</option>
            <option value="1000">1,000 (Large)</option>
            <option value="5000">5,000 (Very Large)</option>
            <option value="10000">10,000</option>
            <option value="100000">100,000</option>
            <option value="500000">500,000</option>
            <option value="1000000">1,000,000 (Massive)</option>
          </select>
        </div>

        {/* Replications Control */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Replications</label>
          </div>
          <input 
            type="number"
            min="10"
            max="10000"
            step="10"
            value={replications}
            onChange={(e) => setReplications(Math.max(10, parseInt(e.target.value) || 0))}
            disabled={isRunning}
            className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
          />
           <p className="text-xs text-slate-500 dark:text-slate-400">
            Simulations to run (default: 500).
          </p>
        </div>

        {/* Seed Control */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">RNG Seed</label>
          </div>
          <input 
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
            disabled={isRunning}
            className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set a specific seed to reproduce results exactly.
          </p>
        </div>

      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 space-y-3">
        {/* Simulation Actions */}
        {!isRunning ? (
          <button
            onClick={onRun}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-md hover:shadow-lg transition-all active:transform active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            Run Simulation
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
             <button
              onClick={onPause}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-all shadow-md"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Resume
                </>
              ) : (
                 <>
                  <Pause className="w-4 h-4 fill-current" />
                  Pause
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-all shadow-md"
            >
              <Square className="w-4 h-4 fill-current" />
              Stop
            </button>
          </div>
        )}

        {/* Downloads */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onDownloadData}
            disabled={!hasResults || isRunning}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Download Estimates CSV"
          >
            <FileText className="w-4 h-4" />
            Data
          </button>
          <button
            onClick={onDownloadImage}
            disabled={!hasResults || isRunning}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Download Figure"
          >
            <ImageIcon className="w-4 h-4" />
            Figure
          </button>
        </div>
      </div>
    </div>
  );
};