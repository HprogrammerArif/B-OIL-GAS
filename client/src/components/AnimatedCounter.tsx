import React, { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: string;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({ value, duration = 1200, className }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    // Parse prefix, number, suffix
    // Matches patterns like "৳ 4,82,50,000", "743", "96.3%", "284 Days", "8/24", "Seat #7"
    const match = value.match(/^([^0-9]*)([\d,.]+)(.*)$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const prefix = match[1];
    const rawNumStr = match[2];
    const suffix = match[3];

    // Check if it's a fractional or comma-separated number
    const isDecimal = rawNumStr.includes('.');
    const cleanNum = parseFloat(rawNumStr.replace(/,/g, ''));

    if (isNaN(cleanNum)) {
      setDisplayValue(value);
      return;
    }

    let startTime: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = cleanNum * easeProgress;

      let formattedNum: string;
      if (isDecimal) {
        formattedNum = current.toFixed(1);
      } else if (rawNumStr.includes(',')) {
        // Bengali / South Asian lakh/crore formatting or standard grouping
        formattedNum = Math.floor(current).toLocaleString('en-IN');
      } else {
        formattedNum = Math.floor(current).toString();
      }

      setDisplayValue(`${prefix}${formattedNum}${suffix}`);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value, duration]);

  return <span className={className}>{displayValue}</span>;
}
