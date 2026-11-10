import { useMemo, useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { Search, X, SearchX, ChevronLeft, ChevronRight } from 'lucide-react';
import { t, type Lang } from '../../types';
import { StatusPill } from '../../components/ui';
import type { NoteFile } from '../../store/notesheetStore';
import { STATE_TONE, URGENCY_TONE, stateLabel, urgencyLabel, type FileState } from './helpers';

type Filter = 'all' | FileState;

interface FileRailProps {
  files: NoteFile[];
  activeId: string;
  lang: Lang;
  /** Show the "Needs your signature" filter only for users who can sign. */
  canSign: boolean;
  stateOf: (file: NoteFile) => FileState;
  onSelect: (id: string) => void;
  createAction?: ReactNode;
}

/** File switcher: searchable, filterable list that becomes an interactive horizontal carousel on narrow widths. */
export default function FileRail({ files, activeId, lang, canSign, stateOf, onSelect, createAction }: FileRailProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const listRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    startScroll: 0,
    moved: false,
    active: false,
  });

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

  const visible = useMemo(() => files.filter((f) => {
    if (filter !== 'all' && stateOf(f) !== filter) return false;
    if (!q) return true;
    return [f.fileNo, f.title, f.dept, f.initiatorName ?? ''].some((v) => v.toLowerCase().includes(q));
  }), [files, filter, q, stateOf]);

  const visibleIds = visible.map((f) => f.id).join('|');
  useEffect(() => {
    if (!visibleIds) return;
    const ids = visibleIds.split('|');
    if (!ids.includes(activeId)) onSelect(ids[0]);
  }, [visibleIds, activeId, onSelect]);

  const updateScrollState = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    updateScrollState();

    const handleScroll = () => updateScrollState();
    el.addEventListener('scroll', handleScroll, { passive: true });

    const ro = new ResizeObserver(() => updateScrollState());
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      ro.disconnect();
    };
  }, [updateScrollState, visibleIds]);

  // Translate vertical mouse wheel over horizontal carousel to smooth horizontal scroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth > el.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const canScroll =
          (e.deltaY > 0 && el.scrollLeft < el.scrollWidth - el.clientWidth - 1) ||
          (e.deltaY < 0 && el.scrollLeft > 1);
        if (canScroll) {
          e.preventDefault();
          el.scrollBy({ left: e.deltaY * 1.2, behavior: 'auto' });
        }
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Smooth scroll buttons
  const scrollTrack = (direction: 'left' | 'right') => {
    const el = listRef.current;
    if (!el) return;
    const scrollAmount = Math.max(280, Math.floor(el.clientWidth * 0.7));
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const listOverflows = () => {
    const el = listRef.current;
    return !!el && el.scrollWidth > el.clientWidth + 2;
  };

  // Drag-to-scroll only after a real swipe, so a click still selects the file.
  const handlePointerDown = (e: React.PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if (!listOverflows() || !listRef.current) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: listRef.current.scrollLeft,
      moved: false,
      active: true,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLUListElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== e.pointerId || !listRef.current) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) < 12) return;
    if (!drag.moved) {
      drag.moved = true;
      setIsDragging(true);
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* capture optional */ }
    }
    listRef.current.scrollLeft = drag.startScroll - dx;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLUListElement>) => {
    const drag = dragRef.current;
    if (!drag.active || (drag.pointerId !== e.pointerId && drag.pointerId !== -1)) return;
    drag.active = false;
    setIsDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already released */ }
  };

  const handleCardClick = (fileId: string, e: React.MouseEvent) => {
    if (dragRef.current.moved) {
      e.preventDefault();
      dragRef.current.moved = false;
      return;
    }
    onSelect(fileId);
  };

  // Keep the active card visible inside the list without scrolling the page.
  useEffect(() => {
    const list = listRef.current;
    if (!activeId || !list) return;
    const activeEl = list.querySelector<HTMLElement>(`[data-file-id="${activeId}"]`);
    if (!activeEl) return;
    const item = activeEl.getBoundingClientRect();
    const track = list.getBoundingClientRect();
    let dx = 0;
    let dy = 0;
    if (item.left < track.left) dx = item.left - track.left;
    else if (item.right > track.right) dx = item.right - track.right;
    if (item.top < track.top) dy = item.top - track.top;
    else if (item.bottom > track.bottom) dy = item.bottom - track.bottom;
    if (dx !== 0 || dy !== 0) list.scrollBy({ left: dx, top: dy, behavior: 'smooth' });
  }, [activeId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const idx = visible.findIndex((f) => f.id === activeId);
      if (idx !== -1) {
        const nextIdx = e.key === 'ArrowRight' ? Math.min(idx + 1, visible.length - 1) : Math.max(idx - 1, 0);
        if (nextIdx !== idx) {
          e.preventDefault();
          onSelect(visible[nextIdx].id);
        }
      }
    }
  };

  return (
    <>
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
        <select
          className="ns-status-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          aria-label={t('Filter files', 'ফাইল ফিল্টার', lang)}
        >
          {filters.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label} ({f.count})
            </option>
          ))}
        </select>
        {createAction && <div className="ns-rail-create">{createAction}</div>}
      </div>

      <aside className="ns-rail" aria-label={t('Note-sheet files', 'নোট-শীট ফাইল', lang)}>
      <div className={`ns-file-track-container ${canScrollLeft ? 'has-scroll-left' : ''} ${canScrollRight ? 'has-scroll-right' : ''}`}>
        {canScrollLeft && (
          <button
            type="button"
            className="ns-track-nav ns-track-nav-prev"
            onClick={() => scrollTrack('left')}
            aria-label={t('Previous files', 'পূর্ববর্তী ফাইল', lang)}
            title={t('Previous files', 'পূর্ববর্তী ফাইল', lang)}
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <ul
          ref={listRef}
          className={`ns-file-list ${isDragging ? 'is-dragging' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="list"
          aria-label={t('Files list', 'ফাইল তালিকা', lang)}
        >
          {visible.map((file) => {
            const state = stateOf(file);
            const active = file.id === activeId;
            return (
              <li key={file.id} data-file-id={file.id}>
                <button
                  type="button"
                  className={`ns-file state-${state} ${active ? 'active' : ''}`}
                  aria-current={active ? 'true' : undefined}
                  onClick={(e) => handleCardClick(file.id, e)}
                >
                  <span className="ns-file-title">{file.title}</span>
                  <span className="ns-file-meta">
                    <span className="ns-file-no">{file.fileNo.split('/').slice(-2).join('/')}</span>
                    <strong>{file.amount}</strong>
                  </span>
                  <span className="ns-file-foot">
                    <StatusPill tone={STATE_TONE[state]}>{stateLabel(state, file, lang)}</StatusPill>
                    {state !== 'approved' && file.urgency === 'urgent' && (
                      <StatusPill tone={URGENCY_TONE[file.urgency]}>{urgencyLabel(file.urgency, lang)}</StatusPill>
                    )}
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

        {canScrollRight && (
          <button
            type="button"
            className="ns-track-nav ns-track-nav-next"
            onClick={() => scrollTrack('right')}
            aria-label={t('Next files', 'পরবর্তী ফাইল', lang)}
            title={t('Next files', 'পরবর্তী ফাইল', lang)}
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>
      </aside>
    </>
  );
}
