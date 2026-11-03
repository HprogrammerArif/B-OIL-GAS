import { useMemo, useState, type ReactNode } from 'react';
import { Search, X, PenTool, CheckCircle2, Clock, RotateCcw, SearchX } from 'lucide-react';
import { t, type Lang } from '../../types';
import { StatusPill } from '../../components/ui';
import type { NoteFile } from '../../store/notesheetStore';
import {
  STATE_TONE, URGENCY_TONE, stateLabel, urgencyLabel, signProgress, type FileState,
} from './helpers';

type Filter = 'all' | FileState;

interface FileRailProps {
  files: NoteFile[];
  activeId: string;
  lang: Lang;
  /** Show the "Needs your signature" filter only for users who can sign. */
  canSign: boolean;
  stateOf: (file: NoteFile) => FileState;
  onSelect: (id: string) => void;
}

const STATE_ICON: Record<FileState, ReactNode> = {
  mine: <PenTool size={13} />,
  waiting: <Clock size={13} />,
  returned: <RotateCcw size={13} />,
  approved: <CheckCircle2 size={13} />,
};

/** File switcher: searchable, filterable list that becomes a horizontal strip on narrow widths. */
export default function FileRail({ files, activeId, lang, canSign, stateOf, onSelect }: FileRailProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const counts = useMemo(() => {
    const c: Record<FileState, number> = { mine: 0, waiting: 0, returned: 0, approved: 0 };
    files.forEach((f) => { c[stateOf(f)] += 1; });
    return c;
  }, [files, stateOf]);

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: t('All', 'সব', lang), count: files.length },
    ...(canSign ? [{ key: 'mine' as const, label: t('My turn', 'আমার পালা', lang), count: counts.mine }] : []),
    { key: 'waiting', label: t('In progress', 'চলমান', lang), count: counts.waiting },
    { key: 'returned', label: t('Returned', 'ফেরত', lang), count: counts.returned },
    { key: 'approved', label: t('Approved', 'অনুমোদিত', lang), count: counts.approved },
  ];

  const visible = files.filter((f) => {
    if (filter !== 'all' && stateOf(f) !== filter) return false;
    if (!q) return true;
    return [f.fileNo, f.title, f.dept, f.initiatorName ?? ''].some((v) => v.toLowerCase().includes(q));
  });

  return (
    <aside className="ns-rail" aria-label={t('Note-sheet files', 'নোট-শীট ফাইল', lang)}>
      <div className="ns-rail-top">
        <div className="ns-search">
          <Search size={14} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setQuery(''); }}
            placeholder={t('Search files…', 'ফাইল খুঁজুন…', lang)}
            aria-label={t('Search files', 'ফাইল খুঁজুন', lang)}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label={t('Clear search', 'অনুসন্ধান মুছুন', lang)}><X size={13} /></button>
          )}
        </div>
        <div className="ns-filters" role="group" aria-label={t('Filter files', 'ফাইল ফিল্টার', lang)}>
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`ns-filter ${filter === f.key ? 'active' : ''}`}
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label} <b>{f.count}</b>
            </button>
          ))}
        </div>
      </div>

      <ul className="ns-file-list">
        {visible.map((file) => {
          const state = stateOf(file);
          const { done, total } = signProgress(file);
          const active = file.id === activeId;
          return (
            <li key={file.id}>
              <button
                type="button"
                className={`ns-file state-${state} ${active ? 'active' : ''}`}
                aria-current={active ? 'true' : undefined}
                onClick={() => onSelect(file.id)}
              >
                <span className="ns-file-top">
                  <span className="ns-file-no">{file.fileNo}</span>
                  <span className={`ns-file-icon state-${state}`} aria-hidden>{STATE_ICON[state]}</span>
                </span>
                <span className="ns-file-title">{file.title}</span>
                <span className="ns-file-meta">
                  <span>{file.dept}</span>
                  <strong>{file.amount}</strong>
                </span>
                <span className="ns-file-foot">
                  <StatusPill tone={STATE_TONE[state]}>{stateLabel(state, file, lang)}</StatusPill>
                  {state !== 'approved' && file.urgency !== 'normal' && (
                    <StatusPill tone={URGENCY_TONE[file.urgency]}>{urgencyLabel(file.urgency, lang)}</StatusPill>
                  )}
                  <span className="ns-file-progress" title={t(`${done} of ${total} signed`, `${total}-এর মধ্যে ${done}টি স্বাক্ষরিত`, lang)}>
                    {done}/{total}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="ns-rail-empty">
            <SearchX size={18} />
            <span>{t('No files match.', 'কোনো ফাইল মেলেনি।', lang)}</span>
            <button type="button" onClick={() => { setFilter('all'); setQuery(''); }}>{t('Show all', 'সব দেখুন', lang)}</button>
          </li>
        )}
      </ul>
    </aside>
  );
}
