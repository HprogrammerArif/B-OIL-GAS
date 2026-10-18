import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
}

export default function Sparkline({
  data,
  color = '#A51C30',
  width = 84,
  height = 26,
  strokeWidth = 2,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = 3;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * chartWidth;
    const y = height - padding - ((val - min) / range) * chartHeight;
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const gradientId = `spark-grad-${Math.random().toString(36).substr(2, 9)}`;

  const lastPoint = points[points.length - 1];

  return (
    <div style={{ width, height, overflow: 'visible', display: 'inline-block' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Shaded Area */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pulse Dot at Current Endpoint */}
        <circle cx={lastPoint.x} cy={lastPoint.y} r={3} fill={color} />
        <circle cx={lastPoint.x} cy={lastPoint.y} r={5} fill={color} opacity="0.3">
          <animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
