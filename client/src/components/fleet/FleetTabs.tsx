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
      className={`fleet-tabs-bar ${compact ? 'compact' : ''}`}
    >
      {tabs.map(({ id, label, icon: Icon, tone, badge, badgeTone = 'info' }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={`fleet-tab-btn ${isActive ? `active-${tone}` : ''}`}
          >
            <Icon size={14} aria-hidden />
            <span>{label}</span>
            {badge !== undefined && (
              <span className={`fleet-tab-badge ${badgeTone}`}>
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
