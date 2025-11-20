export interface RecipeStep {
  startTime: number; // in seconds
  endTime: number; // in seconds
  targetWeight: number; // in grams
  description: string;
  type: 'pour' | 'wait';
}

export interface ChartDataPoint {
  time: number;
  target: number;
  current?: number;
  annotation?: string;
}

export interface AudioContextState {
  ctx: AudioContext | null;
}