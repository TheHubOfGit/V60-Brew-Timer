import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RecipeStep, ChartDataPoint } from '../types';
import { generateChartData } from '../utils/recipe';

interface BrewChartProps {
  currentTime: number;
  recipe: RecipeStep[];
  totalWater: number;
  theme: 'light' | 'dark';
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const BrewChart: React.FC<BrewChartProps> = ({ currentTime, recipe, totalWater, theme }) => {
  const data = useMemo(() => generateChartData(recipe), [recipe]);

  // Calculate current target weight with smooth interpolation
  const currentTargetWeight = useMemo(() => {
    const step = recipe.find(s => currentTime >= s.startTime && currentTime < s.endTime);

    if (!step) {
      // If finished or not started, return appropriate value
      if (currentTime >= recipe[recipe.length - 1].endTime) return totalWater;
      return 0;
    }

    if (step.type === 'wait') {
      return step.targetWeight;
    } else {
      // It's a pour step, interpolate
      const progress = (currentTime - step.startTime) / (step.endTime - step.startTime);
      // Find previous target (start of this pour)
      const prevTarget = recipe.find(r => r.endTime === step.startTime)?.targetWeight || 0;
      return prevTarget + (step.targetWeight - prevTarget) * progress;
    }
  }, [currentTime, recipe, totalWater]);

  // Filter data to show "past" as a filled area if desired, or just use the single line with a dot
  // To make it look like the image, we use a dashed line for the full path, 
  // and maybe a solid Area for the progress?
  // The image shows: Dashed White line for future. Solid Blue line for past.

  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      pastWeight: d.time <= currentTime ? d.target : null,
      futureWeight: d.target
    }));
  }, [data, currentTime]);

  const colors = {
    grid: theme === 'dark' ? '#374151' : '#e5e7eb',
    text: theme === 'dark' ? '#9ca3af' : '#6b7280',
    tooltipBg: theme === 'dark' ? '#1f2937' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#374151' : '#e5e7eb',
    tooltipText: theme === 'dark' ? '#f3f4f6' : '#111827',
    futureStroke: theme === 'dark' ? '#6b7280' : '#9ca3af',
  };

  return (
    <div className="w-full h-full select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />

          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            stroke={colors.text}
            tick={{ fill: colors.text, fontSize: 12 }}
            interval={45} // roughly shows major steps
            type="number"
            domain={[0, 'auto']}
            allowDataOverflow={false}
          />

          <YAxis
            stroke={colors.text}
            tick={{ fill: colors.text, fontSize: 12 }}
            tickFormatter={(val) => `${val}g`}
            domain={[0, totalWater + 20]}
          />

          <Tooltip
            contentStyle={{ backgroundColor: colors.tooltipBg, borderColor: colors.tooltipBorder, color: colors.tooltipText }}
            itemStyle={{ color: '#3b82f6' }}
            labelFormatter={formatTime}
            formatter={(value: number) => [`${Math.round(value)}g`, 'Water Weight']}
          />

          {/* The Future Path (Dashed) */}
          <Area
            type="monotone"
            dataKey="futureWeight"
            stroke={colors.futureStroke}
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="transparent"
            isAnimationActive={false}
          />

          {/* The Past Path (Solid Blue with Gradient Fill) */}
          <Area
            type="monotone"
            dataKey="pastWeight"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="url(#colorPast)"
            isAnimationActive={false}
          />

          {/* Current Time Vertical Line */}
          <ReferenceLine x={currentTime} stroke="#ef4444" strokeWidth={2} />

          {/* Current Position Dot */}
          <ReferenceDot
            x={currentTime}
            y={currentTargetWeight}
            r={6}
            fill="#3b82f6"
            stroke="#fff"
            strokeWidth={2}
            isFront={true}
          />

          {/* Text Annotation for Current Target */}
          <ReferenceDot
            x={currentTime}
            y={currentTargetWeight}
            r={0}
            label={{
              position: 'right',
              value: `Target: ${Math.round(currentTargetWeight)}g`,
              fill: '#3b82f6',
              fontSize: 16,
              fontWeight: 'bold',
              dx: 10,
              dy: -5
            }}
          />

        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};