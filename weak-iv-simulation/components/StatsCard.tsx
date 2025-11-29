import React from 'react';
import { TrendingUp, Target, Activity, AlertTriangle } from 'lucide-react';

interface StatsCardProps {
  title: string;
  bias: number;
  variance: number;
  colorClass: string;
  darkColorClass: string;
  icon: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, bias, variance, colorClass, darkColorClass, icon }) => {
  return (
    <div className={`p-5 rounded-xl border bg-white dark:bg-slate-800 shadow-sm flex flex-col ${colorClass} ${darkColorClass} transition-colors duration-200`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-opacity-20 bg-current">
          {icon}
        </div>
        <h4 className="font-bold text-lg text-slate-700 dark:text-slate-200">{title}</h4>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Bias</span>
          <span className={`font-mono font-semibold ${Math.abs(bias) > 0.1 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {bias > 0 ? '+' : ''}{bias.toFixed(4)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500 dark:text-slate-400">Variance</span>
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
            {variance.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
};

interface SimulationSummaryProps {
  ivBias: number;
  olsBias: number;
  ivVariance: number;
  olsVariance: number;
  meanFStat: number;
}

export const SimulationSummary: React.FC<SimulationSummaryProps> = ({
  ivBias,
  olsBias,
  ivVariance,
  olsVariance,
  meanFStat
}) => {
  const isWeakIV = meanFStat < 10;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatsCard
        title="OLS Estimator"
        bias={olsBias}
        variance={olsVariance}
        colorClass="border-red-100"
        darkColorClass="dark:border-red-900/50"
        icon={<TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />}
      />
      <StatsCard
        title="IV Estimator"
        bias={ivBias}
        variance={ivVariance}
        colorClass="border-indigo-100"
        darkColorClass="dark:border-indigo-900/50"
        icon={<Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
      />
      <div className={`p-5 rounded-xl border bg-white dark:bg-slate-800 shadow-sm flex flex-col justify-center transition-colors duration-200 ${isWeakIV ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800' : 'border-slate-200 dark:border-slate-700'}`}>
        <div className="flex items-center gap-2 mb-2">
            <Activity className={`w-5 h-5 ${isWeakIV ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`} />
            <span className="font-bold text-slate-700 dark:text-slate-200">First Stage F-Statistic</span>
        </div>
        <div className="text-3xl font-mono font-bold text-slate-800 dark:text-slate-100 my-2">
            {meanFStat.toFixed(1)}
        </div>
        {isWeakIV && (
            <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 p-2 rounded">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Weak Instrument Detected (F &lt; 10). IV estimates may be unreliable and biased toward OLS.</span>
            </div>
        )}
        {!isWeakIV && (
            <div className="text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/40 p-2 rounded">
                Instrument appears strong. IV should be consistent.
            </div>
        )}
      </div>
    </div>
  );
};