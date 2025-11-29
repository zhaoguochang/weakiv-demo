export interface SimulationParams {
  sampleSize: number;
  replications: number;
  ivStrength: number; // Represents correlation between Z and X (pi)
  endogeneity: number; // Represents correlation between X and Error (rho)
  betaTrue: number;
  seed: number;
}

export interface SimulationResult {
  olsEstimates: number[];
  ivEstimates: number[];
  fStats: number[];
  olsBias: number;
  ivBias: number;
  olsVariance: number;
  ivVariance: number;
}

export interface BinData {
  rangeStart: number;
  rangeEnd: number;
  olsFrequency: number;
  ivFrequency: number;
  midpoint: number;
}