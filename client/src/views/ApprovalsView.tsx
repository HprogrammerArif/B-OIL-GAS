import { useMemo, useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../components/ToastManager';
import {
  ClipboardCheck, Check, Search, Clock, Wallet, ShieldCheck, RefreshCw, Inbox,
  X, Flame, History, ArrowUpDown, SearchX, ListChecks,
} from 'lucide-react';

import { useApprovalStore } from '../store/approvalStore';
import { useCan } from '../auth/session';
import { nowTime } from '../lib/clock';
import { CATEGORY_LABELS, useMyApprovalQueue } from './approvals/config';
import { formatTaka, formatTakaCompact, type SortKey } from './approvals/format';
import { SLA_URGENT_MINUTES, slaLabel, slaMinutesLeft, useNow } from '../lib/sla';
import { useApprovalDecisions } from './approvals/useApprovalDecisions';
import ApprovalCard from './approvals/ApprovalCard';
import ApprovalDetailDrawer from './approvals/ApprovalDetailDrawer';
import { Button, EmptyState, Modal, PageHeader } from '../components/ui';

type Tab = 'pending' | 'history';
type Outcome = 'all' | 'approved' | 'rejected';

export default function ApprovalsView({ lang }: ViewProps) {
  const canDecide = useCan('approvals:decide');
  const { batchApproveItems } = useApprovalStore();
  const now = useNow();
  const { user, config: cfg, pending: approvalItems, decided: decidedItems } = useMyApprovalQueue();

  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [outcome, setOutcome] = useState<Outcome>('all');
  const [dueSoonOnly, setDueSoonOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('sla');
  const [openId, setOpenId] = useState<string | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => nowTime(lang));

  const categories = cfg?.categories ?? [];
  const canBatch = canDecide && (cfg?.canBatch ?? false);
  const isPending = activeTab === 'pending';
  const query = searchQuery.trim().toLowerCase();

  const listToDisplay = isPending ? approvalItems : decidedItems;

  const filteredItems = useMemo(() => {
    const out = listToDisplay.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (!isPending && outcome !== 'all' && item.decisionStatus !== outcome) return false;
      if (isPending && dueSoonOnly && slaMinutesLeft(item, now) >= SLA_URGENT_MINUTES) return false;
      if (!query) return true;
      return [item.title, item.requester, item.id, item.dept, item.details, item.sapDocRef, item.amount ?? '']
        .some((field) => field.toLowerCase().includes(query));
    });
    if (isPending) {
      out.sort((a, b) => {
        if (sortKey === 'amount') return (b.costTk ?? 0) - (a.costTk ?? 0);
        if (sortKey === 'requester') return a.requester.localeCompare(b.requester);
        return slaMinutesLeft(a, now) - slaMinutesLeft(b, now);
      });
    }
    return out;
  }, [listToDisplay, selectedCategory, outcome, dueSoonOnly, query, sortKey, isPending, now]);

  // Only act on what is visible: a selection hidden by a filter is never approved by accident.
  const selectedVisible = useMemo(
    () => filteredItems.filter((i) => selectedIds.includes(i.id)),
    [filteredItems, selectedIds],
  );
  const selectedTotal = selectedVisible.reduce((sum, i) => sum + (i.costTk ?? 0), 0);
  const allVisibleSelected = filteredItems.length > 0 && selectedVisible.length === filteredItems.length;

  const totalPendingCost = approvalItems.reduce((sum, i) => sum + (i.costTk ?? 0), 0);
  const dueSoonItems = approvalItems.filter((i) => slaMinutesLeft(i, now) < SLA_URGENT_MINUTES);
  const nextDue = approvalItems.length > 0 ? Math.min(...approvalItems.map((i) => slaMinutesLeft(i, now))) : null;
  const approvedCount = decidedItems.filter((d) => d.decisionStatus !== 'rejected').length;
  const returnedCount = decidedItems.length - approvedCount;

  const openItem = openId ? [...approvalItems, ...decidedItems].find((i) => i.id === openId) ?? null : null;
  const openIndex = openItem ? filteredItems.findIndex((i) => i.id === openItem.id) : -1;
  const hasActiveFilter = selectedCategory !== 'all' || dueSoonOnly || outcome !== 'all' || !!query;

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setSelectedCategory('all');
    setOutcome('all');
    setDueSoonOnly(false);
    setSelectedIds([]);
    setOpenId(null);
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setOutcome('all');
    setDueSoonOnly(false);
    setSearchQuery('');
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleSelectAll = () =>
    setSelectedIds(allVisibleSelected ? [] : filteredItems.map((i) => i.id));

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    window.setTimeout(() => {
      setRefreshing(false);
      setLastUpdated(nowTime(lang));
      showToast(t('Queue is up to date.', 'তালিকা হালনাগাদ আছে।', lang), 'info');
    }, 700);
  };

  /** After deciding from the drawer, move on to the next request in the list (or close at the end). */
  const nextIdAfter = (id: string): string | null => {
    const idx = filteredItems.findIndex((i) => i.id === id);
    return (filteredItems[idx + 1] ?? filteredItems[idx - 1])?.id ?? null;
  };

  const goRelative = (delta: number) => {
    if (openIndex < 0) return;
    const next = filteredItems[openIndex + delta];
    if (next) setOpenId(next.id);
  };

  const { requestApprove, requestReturn, modals, busy: decisionOpen } = useApprovalDecisions(lang, (id) => {
    const next = nextIdAfter(id);
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    if (openId === id) setOpenId(next);
  });

  const handleConfirmBatch = () => {
    if (selectedVisible.length === 0 || !user) return;
    const res = batchApproveItems(selectedVisible.map((i) => i.id), user.role);
    setSelectedIds([]);
    setBatchOpen(false);
    showToast(
      t(
        `✓ Batch approved ${res.count} items (${formatTaka(res.totalCost)} authorized). Official vouchers created.`,
        `✓ একযোগে ${res.count}টি আবেদন অনুমোদিত (${formatTaka(res.totalCost)})। ভাউচার প্রস্তুত।`,
        lang,
      ),
      'gold',
    );
  };

  if (!cfg) {
    return (
      <div>
        <PageHeader title={t('Approvals', 'অনুমোদন', lang)} />
        <div className="card">
          <EmptyState
            icon={<ClipboardCheck size={20} />}
            title={t('No approval queue', 'কোনো অনুমোদন তালিকা নেই', lang)}
            description={t('You do not have an approval queue.', 'আপনার কোনো অনুমোদন তালিকা নেই।', lang)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="apv-page">
      <PageHeader
        title={t(cfg.title[0], cfg.title[1], lang)}
        description={t(cfg.description[0], cfg.description[1], lang)}
        actions={
          <>
            <span className="apv-updated"><Clock size={12} /> {t(`Updated ${lastUpdated}`, `হালনাগাদ ${lastUpdated}`, lang)}</span>
            <Button variant="secondary" size="sm" icon={<RefreshCw size={13} className={refreshing ? 'apv-spin' : ''} />} onClick={handleRefresh} disabled={refreshing}>
              {t('Refresh', 'রিফ্রেশ', lang)}
            </Button>
          </>
        }
      />

      {/* KPI ribbon */}
      <div className="apv-kpis">
        <div className="apv-kpi red">
          <div className="apv-kpi-top">
            <span>{t('Pending in queue', 'অনুমোদনের অপেক্ষায়', lang)}</span>
            <i><ClipboardCheck size={16} /></i>
          </div>
          <strong>{approvalItems.length}</strong>
          <small>
            {approvalItems.length === 0
              ? t('You are all caught up', 'সব নিষ্পন্ন হয়েছে', lang)
              : t(
                `${approvalItems.length === 1 ? '1 file needs' : `${approvalItems.length} files need`} your signature`,
                `${approvalItems.length}টি নথি আপনার স্বাক্ষরের অপেক্ষায়`,
                lang,
              )}
          </small>
        </div>

        <button
          type="button"
          className={`apv-kpi warn clickable ${dueSoonOnly && isPending ? 'active' : ''}`}
          disabled={dueSoonItems.length === 0}
          onClick={() => { switchTab('pending'); setDueSoonOnly(true); }}
          aria-pressed={dueSoonOnly && isPending}
        >
          <div className="apv-kpi-top">
            <span>{t('Due within 12 hours', '১২ ঘণ্টার মধ্যে সময়সীমা', lang)}</span>
            <i><Flame size={16} /></i>
          </div>
          <strong>{dueSoonItems.length}</strong>
          <small>
            {nextDue !== null && dueSoonItems.length > 0
              ? `${t('Next due', 'সবচেয়ে কাছে', lang)}: ${slaLabel(nextDue, lang)}`
              : t('Nothing urgent right now', 'এখন কোনো জরুরি নথি নেই', lang)}
          </small>
        </button>

        <div className="apv-kpi gold">
          <div className="apv-kpi-top">
            <span>{t('Value awaiting decision', 'সিদ্ধান্তের অপেক্ষায় থাকা অর্থ', lang)}</span>
            <i><Wallet size={16} /></i>
          </div>
          <strong title={formatTaka(totalPendingCost)}>{formatTakaCompact(totalPendingCost, lang)}</strong>
          <small>{formatTaka(totalPendingCost)} · {t('across pending files', 'অপেক্ষমাণ নথিতে', lang)}</small>
        </div>

        <button
          type="button"
          className={`apv-kpi green clickable ${!isPending ? 'active' : ''}`}
          onClick={() => switchTab('history')}
          aria-pressed={!isPending}
        >
          <div className="apv-kpi-top">
            <span>{t('Decided by you', 'আপনার নিষ্পন্ন সিদ্ধান্ত', lang)}</span>
            <i><ShieldCheck size={16} /></i>
          </div>
          <strong>{decidedItems.length}</strong>
          <small>
            {decidedItems.length === 0
              ? t('No decisions yet', 'এখনও কোনো সিদ্ধান্ত নেই', lang)
              : t(`${approvedCount} approved · ${returnedCount} returned`, `${approvedCount}টি অনুমোদিত · ${returnedCount}টি ফেরত`, lang)}
          </small>
        </button>
      </div>

      {/* Tabs + search */}
      <div className="apv-toolbar">
        <div className="apv-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={isPending} className={isPending ? 'active' : ''} onClick={() => switchTab('pending')}>
            <ClipboardCheck size={14} /> {t('Needs your decision', 'আপনার সিদ্ধান্ত প্রয়োজন', lang)}
            <span className="apv-count">{approvalItems.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={!isPending} className={!isPending ? 'active' : ''} onClick={() => switchTab('history')}>
            <History size={14} /> {t('Decision history', 'সিদ্ধান্তের ইতিহাস', lang)}
            <span className="apv-count">{decidedItems.length}</span>
          </button>
        </div>

        <div className="apv-search">
          <Search size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setSearchQuery(''); }}
            placeholder={t('Search title, requester, reference, amount…', 'শিরোনাম, আবেদনকারী, রেফারেন্স বা পরিমাণ খুঁজুন…', lang)}
            aria-label={t('Search approvals', 'অনুমোদন খুঁজুন', lang)}
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} aria-label={t('Clear search', 'অনুসন্ধান মুছুন', lang)}><X size={13} /></button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="apv-filters">
        <div className="apv-chips">
          <button type="button" className={`apv-filter ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>
            {t('All', 'সব', lang)} <b>{listToDisplay.length}</b>
          </button>
          {categories.map((cat) => {
            const count = listToDisplay.filter((i) => i.category === cat).length;
            return (
              <button key={cat} type="button" className={`apv-filter ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>
                {t(CATEGORY_LABELS[cat][0], CATEGORY_LABELS[cat][1], lang)} <b>{count}</b>
              </button>
            );
          })}
          {isPending ? (
            <button
              type="button" className={`apv-filter urgent ${dueSoonOnly ? 'active' : ''}`}
              onClick={() => setDueSoonOnly((v) => !v)} aria-pressed={dueSoonOnly}
            >
              <Flame size={12} /> {t('Due soon', 'শীঘ্রই সময়সীমা', lang)} <b>{dueSoonItems.length}</b>
            </button>
          ) : (
            (['approved', 'rejected'] as const).map((o) => (
              <button key={o} type="button" className={`apv-filter ${outcome === o ? 'active' : ''}`} onClick={() => setOutcome(outcome === o ? 'all' : o)} aria-pressed={outcome === o}>
                {o === 'approved' ? t('Approved', 'অনুমোদিত', lang) : t('Returned', 'ফেরত', lang)}{' '}
                <b>{o === 'approved' ? approvedCount : returnedCount}</b>
              </button>
            ))
          )}
        </div>

        {isPending && (
          <label className="apv-sort">
            <ArrowUpDown size={13} />
            <span>{t('Sort', 'সাজান', lang)}</span>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
              <option value="sla">{t('Most urgent first', 'সবচেয়ে জরুরি আগে', lang)}</option>
              <option value="amount">{t('Highest amount', 'সর্বোচ্চ পরিমাণ', lang)}</option>
              <option value="requester">{t('Requester A–Z', 'আবেদনকারী A–Z', lang)}</option>
            </select>
          </label>
        )}
      </div>

      {/* List */}
      <div className="apv-list-wrap" aria-busy={refreshing}>
        <div className="apv-list-head">
          {isPending && canBatch && filteredItems.length > 0 ? (
            <label className="apv-selectall">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
              <span>{allVisibleSelected ? t('Clear selection', 'নির্বাচন মুছুন', lang) : t('Select all', 'সব নির্বাচন', lang)}</span>
            </label>
          ) : <span />}
          <span className="apv-showing">
            {t(`Showing ${filteredItems.length} of ${listToDisplay.length}`, `${listToDisplay.length}টির মধ্যে ${filteredItems.length}টি`, lang)}
            {hasActiveFilter && (
              <button type="button" className="apv-clear" onClick={clearFilters}>{t('Clear filters', 'ফিল্টার মুছুন', lang)}</button>
            )}
          </span>
        </div>

        {refreshing ? (
          <div className="apv-list" role="status" aria-label={t('Refreshing the queue', 'তালিকা হালনাগাদ হচ্ছে', lang)}>
            {Array.from({ length: Math.min(Math.max(filteredItems.length, 2), 4) }, (_, i) => (
              <div key={i} className="apv-skel" aria-hidden>
                <div className="apv-skel-col">
                  <span className="skeleton w-20" />
                  <span className="skeleton title w-70" />
                  <span className="skeleton w-90" />
                  <span className="skeleton w-40" />
                </div>
                <div className="apv-skel-col end">
                  <span className="skeleton amount" />
                  <span className="skeleton pill" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={hasActiveFilter ? <SearchX size={20} /> : <Inbox size={20} />}
              title={hasActiveFilter
                ? t('No requests match your filters', 'ফিল্টারের সঙ্গে মিলছে এমন কিছু নেই', lang)
                : isPending
                  ? t('Nothing waiting for you', 'আপনার জন্য কিছু অপেক্ষমাণ নেই', lang)
                  : t('No decisions recorded yet', 'এখনও কোনো সিদ্ধান্ত নথিভুক্ত হয়নি', lang)}
              description={hasActiveFilter
                ? t('Try clearing the search or filters.', 'অনুসন্ধান বা ফিল্টার মুছে দেখুন।', lang)
                : isPending
                  ? t('New files routed to you will appear here.', 'আপনার কাছে পাঠানো নতুন নথি এখানে দেখা যাবে।', lang)
                  : t('Approved and returned files will be archived here.', 'অনুমোদিত ও ফেরত পাঠানো নথি এখানে সংরক্ষিত থাকবে।', lang)}
              action={hasActiveFilter ? <Button variant="secondary" size="sm" onClick={clearFilters}>{t('Clear filters', 'ফিল্টার মুছুন', lang)}</Button> : undefined}
            />
          </div>
        ) : (
          <div className="apv-list">
            {filteredItems.map((item) => (
              <ApprovalCard
                key={item.id}
                item={item}
                mode={isPending ? 'pending' : 'history'}
                lang={lang}
                canDecide={canDecide}
                selectable={isPending && canBatch}
                selected={selectedIds.includes(item.id)}
                onToggleSelect={toggleSelect}
                onOpen={setOpenId}
                onApprove={requestApprove}
                onReturn={requestReturn}
              />
            ))}
          </div>
        )}
      </div>

      {/* Batch action bar */}
      {isPending && canBatch && selectedVisible.length > 0 && (
        <div className="apv-batchbar" role="region" aria-label={t('Batch actions', 'একযোগে পদক্ষেপ', lang)}>
          <div className="apv-batch-info">
            <ListChecks size={16} />
            <span>
              <strong>{t(`${selectedVisible.length} selected`, `${selectedVisible.length}টি নির্বাচিত`, lang)}</strong>
              <small>{formatTaka(selectedTotal)} {t('total', 'মোট', lang)}</small>
            </span>
          </div>
          <div className="apv-batch-actions">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>{t('Clear', 'মুছুন', lang)}</Button>
            <Button variant="gold" icon={<Check size={15} />} onClick={() => setBatchOpen(true)}>
              {t(`Approve ${selectedVisible.length}`, `${selectedVisible.length}টি অনুমোদন`, lang)}
            </Button>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {openItem && (
        <ApprovalDetailDrawer
          item={openItem}
          mode={approvalItems.some((i) => i.id === openItem.id) ? 'pending' : 'history'}
          lang={lang}
          canDecide={canDecide}
          position={openIndex + 1}
          total={filteredItems.length}
          suspendKeys={decisionOpen || batchOpen}
          signerLabel={user ? `${user.name} (${user.label})` : ''}
          onClose={() => setOpenId(null)}
          onPrev={() => goRelative(-1)}
          onNext={() => goRelative(1)}
          onApprove={requestApprove}
          onReturn={requestReturn}
        />
      )}

      {/* Batch confirmation */}
      <Modal
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        title={t(`Approve ${selectedVisible.length} requests?`, `${selectedVisible.length}টি আবেদন অনুমোদন করবেন?`, lang)}
        icon={<Check size={16} />}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBatchOpen(false)}>{t('Cancel', 'বাতিল', lang)}</Button>
            <Button variant="gold" icon={<Check size={15} />} onClick={handleConfirmBatch}>
              {t(`Approve ${selectedVisible.length} · ${formatTaka(selectedTotal)}`, `${selectedVisible.length}টি অনুমোদন · ${formatTaka(selectedTotal)}`, lang)}
            </Button>
          </>
        }
      >
        <p className="apv-batch-note">
          {t(
            'Each file is signed under your name with the standard approval note, and an official voucher is created. This cannot be undone from here.',
            'প্রতিটি নথি আপনার নামে স্বাভাবিক অনুমোদন নোটসহ স্বাক্ষরিত হবে এবং দাপ্তরিক ভাউচার তৈরি হবে। এখান থেকে এটি ফেরানো যাবে না।',
            lang,
          )}
        </p>
        <ul className="apv-batch-list">
          {selectedVisible.map((i) => (
            <li key={i.id}>
              <span>
                <strong>{t(i.title, i.titleBn, lang)}</strong>
                <small>{i.id} · {i.requester}</small>
              </span>
              <b>{i.amount ?? '—'}</b>
            </li>
          ))}
        </ul>
      </Modal>

      {modals}
    </div>
  );
}
