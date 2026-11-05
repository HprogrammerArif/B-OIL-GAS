import { useMemo, useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../components/ToastManager';
import {
  ClipboardCheck, Check, Search, Inbox, X, Clock, History, ArrowUpDown, SearchX, ListChecks,
} from 'lucide-react';

import { useApprovalStore } from '../store/approvalStore';
import { useCan } from '../auth/session';
import { CATEGORY_LABELS, useMyApprovalQueue } from './approvals/config';
import { formatTaka, formatTakaCompact, parseApprovalDate, type SortKey } from './approvals/format';
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

    out.sort((a, b) => {
      if (sortKey === 'amount' || sortKey === 'amount_desc') {
        return (b.costTk ?? 0) - (a.costTk ?? 0);
      }
      if (sortKey === 'amount_asc') {
        return (a.costTk ?? 0) - (b.costTk ?? 0);
      }
      if (sortKey === 'requester' || sortKey === 'requester_asc') {
        return a.requester.localeCompare(b.requester);
      }
      if (sortKey === 'requester_desc') {
        return b.requester.localeCompare(a.requester);
      }
      if (sortKey === 'date_desc') {
        return parseApprovalDate(b.date) - parseApprovalDate(a.date);
      }
      if (sortKey === 'date_asc') {
        return parseApprovalDate(a.date) - parseApprovalDate(b.date);
      }
      if (sortKey === 'sla_desc') {
        return slaMinutesLeft(b, now) - slaMinutesLeft(a, now);
      }
      // Default: sla / sla_asc (most urgent first)
      if (isPending) {
        return slaMinutesLeft(a, now) - slaMinutesLeft(b, now);
      }
      return parseApprovalDate(b.date) - parseApprovalDate(a.date);
    });

    return out;
  }, [listToDisplay, selectedCategory, outcome, dueSoonOnly, query, sortKey, isPending, now]);

  const toggleSortDirection = () => {
    const map: Record<SortKey, SortKey> = {
      sla: 'sla_desc',
      sla_asc: 'sla_desc',
      sla_desc: 'sla',
      amount: 'amount_asc',
      amount_desc: 'amount_asc',
      amount_asc: 'amount',
      date_desc: 'date_asc',
      date_asc: 'date_desc',
      requester: 'requester_desc',
      requester_asc: 'requester_desc',
      requester_desc: 'requester',
    };
    setSortKey((prev) => map[prev] ?? 'sla_desc');
  };

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

  const bn = (n: number) => n.toLocaleString('bn-BD');
  const verdict = isPending
    ? approvalItems.length === 0
      ? t('You are all caught up. Nothing is waiting for your signature.', 'সব নিষ্পন্ন। আপনার স্বাক্ষরের অপেক্ষায় কিছু নেই।', lang)
      : t(
        `${approvalItems.length} ${approvalItems.length === 1 ? 'file needs' : 'files need'} your decision${totalPendingCost > 0 ? `, worth ${formatTakaCompact(totalPendingCost, lang)}` : ''}.${dueSoonItems.length > 0 && nextDue !== null ? ` ${dueSoonItems.length} due within 12 hours (next: ${slaLabel(nextDue, lang).toLowerCase()}).` : ''}`,
        `${bn(approvalItems.length)}টি নথিতে আপনার সিদ্ধান্ত প্রয়োজন${totalPendingCost > 0 ? `, মোট ${formatTakaCompact(totalPendingCost, lang)}` : ''}।${dueSoonItems.length > 0 && nextDue !== null ? ` ${bn(dueSoonItems.length)}টির সময়সীমা ১২ ঘণ্টার মধ্যে; সবচেয়ে কাছেরটি: ${slaLabel(nextDue, lang)}।` : ''}`,
        lang,
      )
    : decidedItems.length === 0
      ? t('You have not decided on any file yet.', 'আপনি এখনো কোনো নথির সিদ্ধান্ত দেননি।', lang)
      : t(`You decided on ${decidedItems.length}: ${approvedCount} approved, ${returnedCount} sent back.`, `আপনি ${bn(decidedItems.length)}টির সিদ্ধান্ত দিয়েছেন: ${bn(approvedCount)}টি অনুমোদিত, ${bn(returnedCount)}টি ফেরত।`, lang);

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
      />

      {/* One-sentence verdict: what is waiting and how urgent */}
      <div className={`apv-verdict ${isPending && dueSoonItems.length > 0 ? 'urgent' : ''}`} role="status">
        <span className="apv-verdict-icon">{isPending ? (dueSoonItems.length > 0 ? <Clock size={16} /> : <ClipboardCheck size={16} />) : <History size={16} />}</span>
        <p>{verdict}</p>
        {isPending && dueSoonItems.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => setDueSoonOnly((v) => !v)}>
            {dueSoonOnly ? t('Show all', 'সব দেখান', lang) : t('Show urgent only', 'শুধু জরুরি দেখান', lang)}
          </Button>
        )}
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
          <select
            className="form-input"
            style={{ minWidth: 220, fontSize: 12, padding: '5px 10px', height: 'auto' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label={t('Category', 'বিভাগ', lang)}
          >
            <option value="all">{t('All categories', 'সব বিভাগ', lang)} ({listToDisplay.length})</option>
            {categories.map((cat) => {
              const count = listToDisplay.filter((i) => i.category === cat).length;
              return (
                <option key={cat} value={cat}>
                  {t(CATEGORY_LABELS[cat][0], CATEGORY_LABELS[cat][1], lang)} ({count})
                </option>
              );
            })}
          </select>
          {!isPending && (
            (['approved', 'rejected'] as const).map((o) => (
              <button key={o} type="button" className={`apv-filter ${outcome === o ? 'active' : ''}`} onClick={() => setOutcome(outcome === o ? 'all' : o)} aria-pressed={outcome === o}>
                {o === 'approved' ? t('Approved', 'অনুমোদিত', lang) : t('Returned', 'ফেরত', lang)}{' '}
                <b>{o === 'approved' ? approvedCount : returnedCount}</b>
              </button>
            ))
          )}
        </div>

        <div className="apv-sort">
          <button
            type="button"
            className="apv-sort-toggle-btn"
            onClick={toggleSortDirection}
            title={t('Click to reverse sort direction', 'সাজানোর দিক পরিবর্তন করতে ক্লিক করুন', lang)}
            aria-label={t('Toggle sort direction', 'সাজানোর দিক উল্টান', lang)}
          >
            <ArrowUpDown size={13} />
            <span>{t('Sort', 'সাজান', lang)}</span>
          </button>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label={t('Sort approvals', 'অনুমোদন সাজান', lang)}
          >
            {isPending && <option value="sla">{t('Most urgent first', 'সবচেয়ে জরুরি আগে', lang)}</option>}
            {isPending && <option value="sla_desc">{t('Least urgent first', 'কম জরুরি আগে', lang)}</option>}
            <option value="amount">{t('Highest amount', 'সর্বোচ্চ পরিমাণ', lang)}</option>
            <option value="amount_asc">{t('Lowest amount', 'সর্বনিম্ন পরিমাণ', lang)}</option>
            <option value="date_desc">{t('Newest first', 'নতুন আগে', lang)}</option>
            <option value="date_asc">{t('Oldest first', 'পুরনো আগে', lang)}</option>
            <option value="requester">{t('Requester A–Z', 'আবেদনকারী A–Z', lang)}</option>
            <option value="requester_desc">{t('Requester Z–A', 'আবেদনকারী Z–A', lang)}</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="apv-list-wrap">
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

        {filteredItems.length === 0 ? (
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
                <small>{i.requester} · {i.dept}</small>
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
