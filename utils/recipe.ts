import { RecipeStep, ChartDataPoint, BrewMethod } from '../types';

/**
 * Generates a recipe based on total water target and method.
 */
export const generateRecipe = (totalWater: number, method: BrewMethod = '4:6'): RecipeStep[] => {
  const pourTime = 10;

  if (method === 'hoffmann-1cup') {
    // James Hoffmann 1 Cup V60 Method
    // Based on 15g coffee / 250g water
    // Steps: 20% (Bloom), 40%, 60%, 80%, 100%

    const p1 = totalWater * 0.2;
    const p2 = totalWater * 0.4;
    const p3 = totalWater * 0.6;
    const p4 = totalWater * 0.8;
    const p5 = totalWater;

    return [
      // Step 1: Bloom (0:00 - 0:45)
      // Pour 50g (20%)
      { startTime: 0, endTime: 10, targetWeight: p1, type: 'pour', description: 'Bloom Pour' },
      { startTime: 10, endTime: 45, targetWeight: p1, type: 'wait', description: 'Swirl & Bloom' },

      // Step 2: Second Pour (0:45 - 1:00)
      // Pour to 100g (40%)
      { startTime: 45, endTime: 60, targetWeight: p2, type: 'pour', description: 'Pour to 40%' },
      { startTime: 60, endTime: 70, targetWeight: p2, type: 'wait', description: 'Pause' },

      // Step 3: Third Pour (1:10 - 1:20)
      // Pour to 150g (60%)
      { startTime: 70, endTime: 80, targetWeight: p3, type: 'pour', description: 'Pour to 60%' },
      { startTime: 80, endTime: 90, targetWeight: p3, type: 'wait', description: 'Pause' },

      // Step 4: Fourth Pour (1:30 - 1:40)
      // Pour to 200g (80%)
      { startTime: 90, endTime: 100, targetWeight: p4, type: 'pour', description: 'Pour to 80%' },
      { startTime: 100, endTime: 110, targetWeight: p4, type: 'wait', description: 'Pause' },

      // Step 5: Final Pour (1:50 - 2:00)
      // Pour to 250g (100%)
      { startTime: 110, endTime: 120, targetWeight: p5, type: 'pour', description: 'Pour to 100%' },
      { startTime: 120, endTime: 180, targetWeight: p5, type: 'wait', description: 'Swirl & Draw Down' },
    ];
  }

  // Default: 4:6 Method
  // The 4:6 method divides water into 40% (sweet/acidity) and 60% (strength).
  const pour1 = totalWater * 0.2;
  const pour2 = totalWater * 0.4;
  const pour3 = totalWater * 0.6;
  const pour4 = totalWater * 0.8;
  const pour5 = totalWater;

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