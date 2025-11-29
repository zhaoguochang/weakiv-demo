import { SimulationParams, SimulationResult, BinData } from '../types';

/**
 * Seeded Random Number Generator (Mulberry32)
 * Provides deterministic results based on a seed.
 */
class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /**
   * Returns a random number between 0 (inclusive) and 1 (exclusive).
   */
  next(): number {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/**
 * Generates two correlated standard normal variables using seeded RNG.
 * Uses Box-Muller transform + Cholesky decomposition.
 */
function generateCorrelatedNormals(n: number, rho: number, rng: SeededRNG): [number[], number[]] {
  const u: number[] = [];
  const v: number[] = [];

  for (let i = 0; i < n; i++) {
    // Generate independent standard normals
    let u1 = rng.next();
    let u2 = rng.next();
    
    // Avoid log(0)
    if (u1 <= 0) u1 = 0.0000001;

    const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const z2 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

    // Apply correlation
    // v = z1
    // u = rho * z1 + sqrt(1 - rho^2) * z2
    const valV = z1;
    const valU = rho * z1 + Math.sqrt(1 - rho * rho) * z2;

    v.push(valV);
    u.push(valU);
  }
  
  return [u, v];
}

/**
 * Calculates mean of an array
 */
function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Calculates variance of an array
 */
function variance(arr: number[], mu?: number): number {
  const m = mu ?? mean(arr);
  return arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / arr.length;
}

/**
 * Simple OLS Estimator: beta = cov(x,y) / var(x)
 */
function estimateOLS(x: number[], y: number[]): number {
  let num = 0;
  let den = 0;
  const n = x.length;
  const xBar = mean(x);
  const yBar = mean(y);

  for (let i = 0; i < n; i++) {
    num += (x[i] - xBar) * (y[i] - yBar);
    den += (x[i] - xBar) * (x[i] - xBar);
  }
  return num / den;
}

/**
 * IV Estimator (2SLS): beta = cov(z,y) / cov(z,x)
 */
function estimateIV(x: number[], y: number[], z: number[]): number {
  let num = 0;
  let den = 0;
  const n = x.length;
  const xBar = mean(x);
  const yBar = mean(y);
  const zBar = mean(z);

  for (let i = 0; i < n; i++) {
    num += (z[i] - zBar) * (y[i] - yBar);
    den += (z[i] - zBar) * (x[i] - xBar);
  }
  
  if (Math.abs(den) < 1e-9) return 0; // Avoid division by zero
  return num / den;
}

/**
 * Runs the Monte Carlo simulation asynchronously.
 * Supports AbortSignal for cancellation.
 */
export async function runMonteCarloAsync(
  params: SimulationParams,
  signal: AbortSignal,
  checkPause: () => Promise<void>
): Promise<SimulationResult> {
  const { sampleSize, replications, ivStrength, endogeneity, betaTrue, seed } = params;
  
  const olsEstimates: number[] = [];
  const ivEstimates: number[] = [];
  const fStats: number[] = [];
  
  const rng = new SeededRNG(seed);

  // Batch size determines how often we yield to the event loop
  // For small N, we can do more reps at once. For large N, fewer.
  const batchSize = sampleSize > 10000 ? 1 : 10;

  for (let r = 0; r < replications; r++) {
    // 1. Check Cancellation
    if (signal.aborted) {
      throw new Error('Simulation Cancelled');
    }

    // 2. Yield to main thread and check for Pause
    if (r % batchSize === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
      await checkPause();
    }

    // --- Core Simulation Logic (same as before but using rng) ---

    // Generate Errors (u, v)
    const [u, v] = generateCorrelatedNormals(sampleSize, endogeneity, rng);
    
    // Generate Instrument z ~ N(0,1)
    // Note: generateCorrelatedNormals returns [u, v]. If we want just one vector, 
    // we can use correlation 0, and take the first one.
    const [z] = generateCorrelatedNormals(sampleSize, 0, rng);

    // Generate X = pi * z + v
    const x = z.map((val, i) => ivStrength * val + v[i]);

    // Generate Y = beta * x + u
    const y = x.map((val, i) => betaTrue * val + u[i]);

    // Estimate OLS
    const betaOLS = estimateOLS(x, y);
    olsEstimates.push(betaOLS);

    // Estimate IV
    const betaIV = estimateIV(x, y, z);
    ivEstimates.push(betaIV);

    // First Stage F-stat
    const piHat = estimateOLS(z, x); 
    const xPred = z.map(val => piHat * val);
    const residuals = x.map((val, i) => val - xPred[i]);
    const ssr = residuals.reduce((acc, val) => acc + val * val, 0);
    const sst = variance(x) * sampleSize;
    const rSquared = 1 - (ssr / sst);
    
    const fStat = (rSquared * (sampleSize - 2)) / (1 - rSquared);
    fStats.push(fStat);
  }

  const olsMean = mean(olsEstimates);
  const ivMean = mean(ivEstimates);

  return {
    olsEstimates,
    ivEstimates,
    fStats,
    olsBias: olsMean - betaTrue,
    ivBias: ivMean - betaTrue,
    olsVariance: variance(olsEstimates),
    ivVariance: variance(ivEstimates),
  };
}

/**
 * Bins data for histogram visualization
 */
export function createHistogramData(ols: number[], iv: number[], bins: number = 40): BinData[] {
  const allValues = [...ols, ...iv];
  if (allValues.length === 0) return [];

  allValues.sort((a, b) => a - b);
  const minVal = allValues[Math.floor(allValues.length * 0.02)] ?? Math.min(...allValues);
  const maxVal = allValues[Math.floor(allValues.length * 0.98)] ?? Math.max(...allValues);
  
  const range = maxVal - minVal;
  const start = minVal - range * 0.1;
  const end = maxVal + range * 0.1;
  const step = (end - start) / bins;

  const data: BinData[] = [];

  for (let i = 0; i < bins; i++) {
    const rangeStart = start + i * step;
    const rangeEnd = start + (i + 1) * step;
    const midpoint = (rangeStart + rangeEnd) / 2;

    const olsCount = ols.filter(v => v >= rangeStart && v < rangeEnd).length;
    const ivCount = iv.filter(v => v >= rangeStart && v < rangeEnd).length;

    data.push({
      rangeStart,
      rangeEnd,
      midpoint,
      olsFrequency: ols.length ? olsCount / ols.length : 0,
      ivFrequency: iv.length ? ivCount / iv.length : 0
    });
  }

  return data;
}