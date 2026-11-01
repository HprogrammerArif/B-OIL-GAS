import React from 'react';

export type StatusTone = 'success' | 'warn' | 'danger' | 'info' | 'purple' | 'gold' | 'neutral';

export interface StatusPillProps {
  tone: StatusTone;
  children: React.ReactNode;
  icon?: React.ReactNode;
  dot?: boolean;
  className?: string;
  title?: string;
}

/** Compact status chip. Uses `.badge` tones so it matches existing tables. */
export default function StatusPill({ tone, children, icon, dot = false, className = '', title }: StatusPillProps) {
  return (
    <span className={`badge ${tone === 'neutral' ? 'ui-pill-neutral' : tone} ${className}`.trim()} title={title}>
      {dot && <span className="ui-pill-dot" aria-hidden />}
      {icon}
      {children}
    </span>
  );
}
