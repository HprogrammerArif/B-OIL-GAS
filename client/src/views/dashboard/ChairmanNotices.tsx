import { useMemo, useState } from 'react';
import { Megaphone, Pin, Plus, Search, X } from 'lucide-react';
import { t, type Lang } from '../../types';
import { showToast } from '../../components/ToastManager';
import { Button, EmptyState, StatusPill, type StatusTone } from '../../components/ui';
import { useNoticeStore } from '../../store/noticeStore';
import type { NoticeItem } from './types';
import PublishNoticeModal from './PublishNoticeModal';
import NoticeDetailModal from './NoticeDetailModal';

type Kind = 'all' | 'pinned' | 'unread' | 'safety' | 'hr' | 'operational';

const PAGE = 6;

const KINDS: ReadonlyArray<{ id: Kind; label: readonly [string, string] }> = [
  { id: 'all', label: ['All', 'সব'] },
  { id: 'unread', label: ['Unread', 'অপঠিত'] },
  { id: 'pinned', label: ['Pinned', 'পিন করা'] },
  { id: 'safety', label: ['Safety', 'নিরাপত্তা'] },
  { id: 'hr', label: ['HR', 'এইচআর'] },
  { id: 'operational', label: ['Operations', 'পরিচালনা'] },
];

const CATEGORY: Record<string, { label: readonly [string, string]; tone: StatusTone }> = {
  safety: { label: ['Safety', 'নিরাপত্তা'], tone: 'danger' },
  urgent: { label: ['Urgent', 'জরুরি'], tone: 'danger' },
  hr: { label: ['HR', 'এইচআর'], tone: 'info' },
  operational: { label: ['Operations', 'পরিচালনা'], tone: 'neutral' },
  executive: { label: ['Chairman', 'চেয়ারম্যান'], tone: 'gold' },
};

const tagHas = (n: NoticeItem, word: string) => !!n.tag?.toLowerCase().includes(word);

function matches(n: NoticeItem, kind: Kind): boolean {
  switch (kind) {
    case 'pinned': return n.pinned;
    case 'unread': return !n.read;
    case 'safety': return n.category === 'safety' || tagHas(n, 'safety');
    case 'hr': return n.category === 'hr' || tagHas(n, 'hr');
    case 'operational': return n.category === 'operational' || tagHas(n, 'operations') || tagHas(n, 'hse');
    default: return true;
  }
}

/** Company notice board for the Chairman: publish, pin and watch staff receipts — they do not acknowledge. */
export default function ChairmanNotices({ lang }: { lang: Lang }) {
  const { notices, addNotice, markNoticeRead, togglePin } = useNoticeStore();
  const [kind, setKind] = useState<Kind>('all');
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [showPublish, setShowPublish] = useState(false);
  const [detail, setDetail] = useState<NoticeItem | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notices.filter((n) => {
      if (!matches(n, kind)) return false;
      if (!q) return true;
      return [n.title, n.title_bn, n.body, n.tag, n.author, n.referenceNo].some((v) => !!v && v.toLowerCase().includes(q));
    });
  }, [notices, kind, query]);

  const unread = notices.filter((n) => !n.read).length;
  const hasFilter = kind !== 'all' || query.trim() !== '';
  const clear = () => { setKind('all'); setQuery(''); setShown(PAGE); };

  const openNotice = (n: NoticeItem) => {
    markNoticeRead(n.id || n.title);
    setDetail(n);
  };

  const pin = (n: NoticeItem) => {
    togglePin(n.id || n.title);
    showToast(n.pinned ? t('Unpinned.', 'পিন সরানো হয়েছে।', lang) : t('Pinned to the top.', 'উপরে পিন করা হয়েছে।', lang), 'info');
  };

  return (
    <section className="tab-pane-fade dash-section" aria-labelledby="cn-title">
      <header className="dash-sec-head">
        <div>
          <h3 id="cn-title">{t('Company notices', 'কোম্পানির নোটিশ', lang)}</h3>
          <p>{t('Announcements sent to staff. Pinned notices stay on top.', 'কর্মীদের পাঠানো ঘোষণা। পিন করা নোটিশ উপরে থাকে।', lang)}</p>
        </div>
        <div className="cn-head-actions">
          {unread > 0 && <StatusPill tone="warn">{t(`${unread} unread`, `${unread.toLocaleString('bn-BD')}টি অপঠিত`, lang)}</StatusPill>}
          <Button variant="gold" size="sm" icon={<Plus size={13} />} onClick={() => setShowPublish(true)}>
            {t('Publish notice', 'নোটিশ প্রকাশ', lang)}
          </Button>
        </div>
      </header>

      <div className="cn-toolbar">
        <div className="psf-filters" role="group" aria-label={t('Filter notices', 'নোটিশ ফিল্টার', lang)}>
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              className={`psf-filter ${kind === k.id ? 'active' : ''}`}
              aria-pressed={kind === k.id}
              onClick={() => { setKind(k.id); setShown(PAGE); }}
            >
              {t(k.label[0], k.label[1], lang)}
              <b>{notices.filter((n) => matches(n, k.id)).length}</b>
            </button>
          ))}
        </div>
        <label className="dash-search">
          <Search size={14} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }}
            placeholder={t('Search notices', 'নোটিশ খুঁজুন', lang)}
            aria-label={t('Search notices', 'নোটিশ খুঁজুন', lang)}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label={t('Clear search', 'অনুসন্ধান মুছুন', lang)}><X size={13} /></button>
          )}
        </label>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={22} />}
          title={hasFilter ? t('No notices match', 'কোনো নোটিশ মেলেনি', lang) : t('No notices yet', 'এখনো কোনো নোটিশ নেই', lang)}
          description={hasFilter ? undefined : t('Published notices will appear here.', 'প্রকাশিত নোটিশ এখানে দেখা যাবে।', lang)}
          action={hasFilter ? <Button variant="secondary" size="sm" onClick={clear}>{t('Clear filters', 'ফিল্টার মুছুন', lang)}</Button> : undefined}
        />
      ) : (
        <>
          <ul className="cn-list">
            {visible.slice(0, shown).map((n) => {
              const cat = n.category ? CATEGORY[n.category] : undefined;
              const reach = n.requiresAck && n.totalRecipients
                ? t(
                    `${n.acknowledgedCount ?? 0} of ${n.totalRecipients} staff have acknowledged`,
                    `${(n.acknowledgedCount ?? 0).toLocaleString('bn-BD')} / ${n.totalRecipients.toLocaleString('bn-BD')} জন স্বীকার করেছেন`,
                    lang,
                  )
                : null;
              return (
                <li key={n.id ?? n.title} className={`cn-item ${n.pinned ? 'is-pinned' : ''} ${n.read ? '' : 'is-unread'}`}>
                  <div className="cn-top">
                    <button type="button" className="cn-title" onClick={() => openNotice(n)}>
                      {!n.read && <span className="cn-dot" aria-label={t('Unread', 'অপঠিত', lang)} />}
                      {t(n.title, n.title_bn, lang)}
                    </button>
                    <div className="cn-chips">
                      {n.pinned && <StatusPill tone="gold">{t('Pinned', 'পিন করা', lang)}</StatusPill>}
                      {cat && <StatusPill tone={cat.tone}>{t(cat.label[0], cat.label[1], lang)}</StatusPill>}
                    </div>
                  </div>
                  <span className="cn-meta">{[n.date, n.author].filter(Boolean).join(' · ')}</span>
                  {n.body && <p className="cn-body">{t(n.body, n.body_bn || n.body, lang)}</p>}
                  <div className="cn-foot">
                    <span className="cn-reach">{reach}</span>
                    <div className="cn-actions">
                      <Button variant="ghost" size="sm" onClick={() => openNotice(n)}>{t('Read full notice', 'পুরো নোটিশ পড়ুন', lang)}</Button>
                      <button
                        type="button"
                        className={`cn-pin ${n.pinned ? 'on' : ''}`}
                        aria-pressed={n.pinned}
                        aria-label={n.pinned ? t('Unpin notice', 'পিন সরান', lang) : t('Pin notice', 'পিন করুন', lang)}
                        onClick={() => pin(n)}
                      >
                        <Pin size={14} fill={n.pinned ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {visible.length > shown && (
            <Button variant="secondary" size="sm" className="cn-more" onClick={() => setShown((s) => s + PAGE)}>
              {t(`Show ${Math.min(PAGE, visible.length - shown)} more`, `আরও ${Math.min(PAGE, visible.length - shown).toLocaleString('bn-BD')}টি দেখুন`, lang)}
            </Button>
          )}
        </>
      )}

      <PublishNoticeModal
        isOpen={showPublish}
        onClose={() => setShowPublish(false)}
        lang={lang}
        onPublish={(notice) => {
          addNotice(notice);
          showToast(t('Notice published and sent to staff by app and SMS.', 'নোটিশ প্রকাশিত হয়েছে এবং অ্যাপ ও এসএমএসে কর্মীদের পাঠানো হয়েছে।', lang), 'gold');
        }}
      />
      <NoticeDetailModal
        notice={detail}
        onClose={() => setDetail(null)}
        lang={lang}
        canAcknowledge={false}
      />
    </section>
  );
}
