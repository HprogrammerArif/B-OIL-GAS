import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type FleetTabTone = 'crimson' | 'gold' | 'blue' | 'emerald' | 'violet' | 'indigo';
export type FleetBadgeTone = 'danger' | 'gold' | 'info';

export interface FleetTabItem<Id extends string = string> {
  id: Id;
  label: string;
  icon: LucideIcon;
  tone: FleetTabTone;
  badge?: string | number;
  badgeTone?: FleetBadgeTone;
}

const ACTIVE_STYLES: Record<FleetTabTone, { border: string; text: string; bg: string }> = {
  crimson: {
    border: 'border-[#A51C30]',
    text: 'text-[#A51C30] dark:text-rose-400',
    bg: 'bg-rose-50/50 dark:bg-rose-950/20'
  },
  gold: {
    border: 'border-amber-600',
    text: 'text-amber-800 dark:text-amber-400',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20'
  },
  blue: {
    border: 'border-blue-600',
    text: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50/50 dark:bg-blue-950/20'
  },
  emerald: {
    border: 'border-emerald-600',
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20'
  },
  violet: {
    border: 'border-violet-600',
    text: 'text-violet-700 dark:text-violet-400',
    bg: 'bg-violet-50/50 dark:bg-violet-950/20'
  },
  indigo: {
    border: 'border-indigo-600',
    text: 'text-indigo-700 dark:text-indigo-400',
    bg: 'bg-indigo-50/50 dark:bg-indigo-950/20'
  },
};

const BADGE_STYLES: Record<FleetBadgeTone, string> = {
  danger: 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900',
  gold: 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
  info: 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900',
};

interface FleetTabsProps<Id extends string> {
  tabs: FleetTabItem<Id>[];
  active: Id;
  onChange: (id: Id) => void;
  compact?: boolean;
  ariaLabel?: string;
}

export default function FleetTabs<Id extends string>({
  tabs,
  active,
  onChange,
  compact = false,
  ariaLabel,
}: FleetTabsProps<Id>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 scrollbar-none ${
        compact ? 'mb-2 pb-1' : 'mb-3.5 pb-1'
      }`}
    >
      {tabs.map(({ id, label, icon: Icon, tone, badge, badgeTone = 'info' }) => {
        const isActive = id === active;
        const style = ACTIVE_STYLES[tone];
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-t-xl border-b-2 px-3.5 py-2 text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isActive
                ? `${style.border} ${style.text} ${style.bg} font-extrabold shadow-2xs`
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/40'
            }`}
          >
            <Icon size={14} className={isActive ? '' : 'text-slate-400'} aria-hidden />
            <span>{label}</span>
            {badge !== undefined && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${BADGE_STYLES[badgeTone]}`}>
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
