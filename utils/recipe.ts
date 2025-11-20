import { RecipeStep, ChartDataPoint } from '../types';

/**
 * Generates a 4:6 Method recipe based on total water target.
 * The 4:6 method divides water into 40% (sweet/acidity) and 60% (strength).
 * Standard timing is usually 45s per pour.
 */
export const generateRecipe = (totalWater: number): RecipeStep[] => {
  const pour1 = totalWater * 0.2;
  const pour2 = totalWater * 0.4;
  const pour3 = totalWater * 0.6;
  const pour4 = totalWater * 0.8;
  const pour5 = totalWater;

  // We assume a somewhat fast pour rate of ~5-10 seconds per pour for the simulation curve
  // The user needs time to pour.
  const pourTime = 10; 

  return [
    // Step 1: Bloom
    { startTime: 0, endTime: pourTime, targetWeight: pour1, type: 'pour', description: 'Bloom Pour' },
    { startTime: pourTime, endTime: 45, targetWeight: pour1, type: 'wait', description: 'Bloom Wait' },
    
    // Step 2: Second Pour (Sweetness/Acidity balance)
    { startTime: 45, endTime: 45 + pourTime, targetWeight: pour2, type: 'pour', description: '2nd Pour' },
    { startTime: 45 + pourTime, endTime: 90, targetWeight: pour2, type: 'wait', description: 'Wait' },

    // Step 3: Strength Pour 1
    { startTime: 90, endTime: 90 + pourTime, targetWeight: pour3, type: 'pour', description: '3rd Pour' },
    { startTime: 90 + pourTime, endTime: 135, targetWeight: pour3, type: 'wait', description: 'Wait' },

    // Step 4: Strength Pour 2
    { startTime: 135, endTime: 135 + pourTime, targetWeight: pour4, type: 'pour', description: '4th Pour' },
    { startTime: 135 + pourTime, endTime: 180, targetWeight: pour4, type: 'wait', description: 'Wait' },

    // Step 5: Final Pour
    { startTime: 180, endTime: 180 + pourTime, targetWeight: pour5, type: 'pour', description: 'Final Pour' },
    { startTime: 180 + pourTime, endTime: 210, targetWeight: pour5, type: 'wait', description: 'Draw Down' },
  ];
};

export const generateChartData = (recipe: RecipeStep[]): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const totalTime = recipe[recipe.length - 1].endTime;
  
  // Generate points every second for smooth resolution
  for (let t = 0; t <= totalTime + 10; t++) {
    const step = recipe.find(s => t >= s.startTime && t < s.endTime) || recipe[recipe.length - 1];
    
    let weight = 0;
    
    // Calculate interpolated weight for "pour" phases to show the ramp up
    if (step.type === 'pour') {
      const progress = (t - step.startTime) / (step.endTime - step.startTime);
      const prevTarget = recipe.find(r => r.endTime === step.startTime)?.targetWeight || 0;
      weight = prevTarget + (step.targetWeight - prevTarget) * progress;
    } else {
      weight = step.targetWeight;
    }

    data.push({
      time: t,
      target: Math.round(weight),
      annotation: step.type === 'wait' && t === step.startTime ? step.description : undefined
    });
  }
  return data;
};

export const getCurrentStep = (recipe: RecipeStep[], time: number): RecipeStep | undefined => {
  return recipe.find(s => time >= s.startTime && time < s.endTime);
};