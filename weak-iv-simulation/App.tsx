import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ResultsChart } from './components/ResultsChart';
import { SimulationSummary } from './components/StatsCard';
import { runMonteCarloAsync, createHistogramData } from './services/simulation';
import { SimulationResult, BinData } from './types';
import { BookOpen, Github, Moon, Sun } from 'lucide-react';

function App() {
  // State for Simulation Parameters
  const [ivStrength, setIvStrength] = useState<number>(0.5);
  const [endogeneity, setEndogeneity] = useState<number>(0.8);
  const [sampleSize, setSampleSize] = useState<number>(500);
  const [replications, setReplications] = useState<number>(500);
  const [seed, setSeed] = useState<number>(12345);
  
  // Theme State
  const [isDark, setIsDark] = useState<boolean>(false);
  
  // State for Results
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [chartData, setChartData] = useState<BinData[]>([]);
  
  // Execution State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Refs for control
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPausedRef = useRef<boolean>(false);

  // Constants
  const BETA_TRUE = 1.0;

  // Sync ref with state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Toggle Theme
  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Apply theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Pause Checker for Async Loop
  const checkPause = async () => {
    while (isPausedRef.current) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const handleRunSimulation = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    setIsPaused(false);
    setResult(null); // Clear previous results immediately or keep? usually clear to show new run
    
    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await runMonteCarloAsync({
        sampleSize,
        replications,
        ivStrength,
        endogeneity,
        betaTrue: BETA_TRUE,
        seed
      }, abortController.signal, checkPause);

      const bins = createHistogramData(res.olsEstimates, res.ivEstimates);
      
      setResult(res);
      setChartData(bins);
    } catch (error: any) {
      if (error.message === 'Simulation Cancelled') {
        console.log('Simulation was cancelled by user.');
      } else {
        console.error('Simulation error:', error);
      }
    } finally {
      setIsRunning(false);
      setIsPaused(false);
      abortControllerRef.current = null;
    }
  }, [ivStrength, endogeneity, sampleSize, replications, seed, isRunning]);

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // --- Download Handlers ---

  const handleDownloadData = () => {
    if (!result) return;
    
    // Create CSV content
    // Columns: Replication, OLS, IV, F-Stat
    let csvContent = "data:text/csv;charset=utf-8,Replication,OLS_Estimate,IV_Estimate,F_Statistic\n";
    
    // We assume all arrays are length equal to the number of completed replications
    const n = result.olsEstimates.length;
    for (let i = 0; i < n; i++) {
        const row = [
            i + 1,
            result.olsEstimates[i].toFixed(6),
            result.ivEstimates[i].toFixed(6),
            result.fStats[i].toFixed(6)
        ].join(",");
        csvContent += row + "\n";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `weak_iv_sim_N${sampleSize}_Pi${ivStrength}_Rho${endogeneity}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadImage = () => {
    // Find the SVG element in the chart container
    const container = document.getElementById('results-chart-container');
    if (!container) return;

    const svg = container.querySelector('svg');
    if (!svg) {
        alert("Chart not fully rendered yet.");
        return;
    }

    // Serialize SVG
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    // Add XML namespaces if missing
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+xmlns:xlink="http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    // Create Blob and Link
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `weak_iv_chart_N${sampleSize}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Run once on mount (optional, or wait for user)
  useEffect(() => {
    handleRunSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meanFStat = result ? result.fStats.reduce((a, b) => a + b, 0) / result.fStats.length : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Header */}
      <header className="bg-slate-900 dark:bg-slate-950 text-white py-6 shadow-md">
        <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="bg-indigo-500 w-8 h-8 rounded flex items-center justify-center text-lg">β</span>
              Weak IV Simulator
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Guochang Zhao (RIEM/SWUFE)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <a href="#" className="text-slate-400 hover:text-white transition-colors hidden sm:block">
              <Github className="w-6 h-6" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sidebar Controls */}
          <div className="lg:col-span-3">
            <ControlPanel
              ivStrength={ivStrength}
              setIvStrength={setIvStrength}
              endogeneity={endogeneity}
              setEndogeneity={setEndogeneity}
              sampleSize={sampleSize}
              setSampleSize={setSampleSize}
              replications={replications}
              setReplications={setReplications}
              seed={seed}
              setSeed={setSeed}
              onRun={handleRunSimulation}
              onPause={handlePause}
              onCancel={handleCancel}
              onDownloadData={handleDownloadData}
              onDownloadImage={handleDownloadImage}
              isRunning={isRunning}
              isPaused={isPaused}
              hasResults={!!result}
            />
          </div>

          {/* Results Area */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* DGP Section (Explicit Model) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-200">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Data Generating Process (DGP)</h3>
              <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 text-slate-700 dark:text-slate-300">
                <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">Structural Equation</span>
                    <div className="font-serif text-lg bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded border border-slate-200 dark:border-slate-700">
                        y<sub>i</sub> = βx<sub>i</sub> + u<sub>i</sub>
                    </div>
                </div>
                
                <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">First Stage</span>
                    <div className="font-serif text-lg bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded border border-slate-200 dark:border-slate-700">
                        x<sub>i</sub> = πz<sub>i</sub> + v<sub>i</sub>
                    </div>
                </div>

                <div className="flex flex-col justify-center text-sm font-sans gap-1">
                   <div>
                     <span className="font-semibold">Instrument:</span> <span className="font-serif">z<sub>i</sub> ~ N(0,1)</span>
                   </div>
                   <div>
                     <span className="font-semibold">Errors:</span> <span className="font-serif">(u<sub>i</sub>, v<sub>i</sub>)</span> are correlated
                   </div>
                   <div>
                     <span className="font-semibold">Correlation:</span> <span className="font-serif">Corr(u, v) = ρ</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Explanation Banner */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 rounded-lg flex items-start gap-3 transition-colors duration-200">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
              <div className="text-sm text-indigo-900 dark:text-indigo-200">
                <p className="font-semibold mb-1">Theoretical Context</p>
                <p>
                  When instruments are weak (low correlation with the endogenous regressor), the 2SLS estimator 
                  is biased towards the OLS estimator in finite samples. As <strong>IV Strength (π)</strong> decreases, 
                  watch the purple IV distribution spread out and its center drift towards the red OLS distribution.
                </p>
              </div>
            </div>

            {/* Stats Summary */}
            {result && (
              <SimulationSummary 
                ivBias={result.ivBias}
                olsBias={result.olsBias}
                ivVariance={result.ivVariance}
                olsVariance={result.olsVariance}
                meanFStat={meanFStat}
              />
            )}

            {/* Main Chart */}
            <div className="relative">
                {isRunning && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {isPaused ? "Paused" : "Simulating..."}
                            </span>
                            {sampleSize >= 100000 && <span className="text-xs text-slate-500 mt-1">Large sample size active</span>}
                        </div>
                    </div>
                )}
                <ResultsChart data={chartData} betaTrue={BETA_TRUE} isDark={isDark} />
            </div>

            {/* Analysis Text */}
            {result && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-200">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">What's happening?</h4>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>True Beta:</strong> {BETA_TRUE.toFixed(1)}</li>
                      <li><strong>OLS Bias:</strong> Caused by the correlation (ρ={endogeneity}) between X and the error term.</li>
                      <li><strong>IV Consistency:</strong> With a strong instrument, IV is centered near {BETA_TRUE.toFixed(1)}.</li>
                    </ul>
                  </div>
                  <div>
                     <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Weak Instrument Effect</h4>
                     <p className="mb-2">
                       Current F-Stat: <strong>{meanFStat.toFixed(1)}</strong>. 
                       {meanFStat < 10 
                        ? " Because the F-stat is low (<10), the instrument provides little independent variation. The 2SLS estimator effectively uses a 'noisy' version of X, leading to high variance and bias." 
                        : " The F-stat is healthy (>10). The instrument is relevant, so the IV estimator performs well with acceptable variance."}
                     </p>
                  </div>
               </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;