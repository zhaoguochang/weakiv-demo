import React from 'react';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { BinData } from '../types';

interface ResultsChartProps {
  data: BinData[];
  betaTrue: number;
  isDark: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-600 shadow-lg rounded-lg text-sm">
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Value: {Number(label).toFixed(2)}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="flex items-center gap-2">
            <span className="capitalize">{entry.name}:</span>
            <span className="font-mono">{Number(entry.value).toFixed(3)} density</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ResultsChart: React.FC<ResultsChartProps> = ({ data, betaTrue, isDark }) => {
  // Define colors based on theme
  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const axisColor = isDark ? "#94a3b8" : "#64748b";
  const refLineColor = isDark ? "#4ade80" : "#22c55e"; // Green

  return (
    <div id="results-chart-container" className="w-full h-[400px] bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-200">
      <div className="mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Distribution of Estimators</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Comparing the sampling distributions of OLS and IV (2SLS) estimators over 500 replications.
        </p>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis 
            dataKey="midpoint" 
            type="number" 
            domain={['auto', 'auto']}
            tickFormatter={(val) => val.toFixed(1)}
            stroke={axisColor}
            label={{ value: 'Estimated β', position: 'insideBottom', offset: -5, fill: axisColor }}
          />
          <YAxis stroke={axisColor} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }}/>
          
          <ReferenceLine 
            x={betaTrue} 
            stroke={refLineColor} 
            strokeDasharray="5 5" 
            label={{ value: 'True β', position: 'top', fill: refLineColor, fontSize: 12 }} 
          />

          {/* OLS Distribution */}
          <Area
            type="monotone"
            dataKey="olsFrequency"
            name="OLS Estimator"
            fill="#f87171"
            stroke="#ef4444"
            fillOpacity={0.3}
            strokeWidth={2}
            isAnimationActive={false}
          />

          {/* IV Distribution */}
          <Area
            type="monotone"
            dataKey="ivFrequency"
            name="IV Estimator"
            fill="#818cf8"
            stroke="#6366f1"
            fillOpacity={0.3}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};