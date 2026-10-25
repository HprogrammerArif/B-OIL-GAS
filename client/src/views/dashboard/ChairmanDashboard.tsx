import React, { useState, useMemo } from 'react';
import { ChevronRight, Plus, Eye, Pin, CheckCircle2, Megaphone, Search, X } from 'lucide-react';
import { t } from '../../types';
import { showToast } from '../../App';
import Pagination from '../../components/Pagination';
import { DetailDrawerData } from '../../components/DetailDrawer';
import { DashboardSubViewProps, NoticeItem } from './types';
import { INNER_CIRCLE, PENDING_APPROVALS, NOTICE_BOARD } from './dashboardData';
import PublishNoticeModal from './PublishNoticeModal';
import NoticeDetailModal from './NoticeDetailModal';

export default function ChairmanDashboard({
  lang,
  activeTab,
  onOpenDetailDrawer
}: DashboardSubViewProps) {
  const [approvalsPage, setApprovalsPage] = useState(1);
  const [innerCirclePage, setInnerCirclePage] = useState(1);
  const [innerCircleFilter, setInnerCircleFilter] = useState<string>('all');
  const [noticesPage, setNoticesPage] = useState(1);
  const [notices, setNotices] = useState<NoticeItem[]>(NOTICE_BOARD);
  const [noticeFilter, setNoticeFilter] = useState<string>('all');
  const [noticeSearch, setNoticeSearch] = useState<string>('');
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [selectedNoticeForDetail, setSelectedNoticeForDetail] = useState<NoticeItem | null>(null);

  const filteredInnerCircle = INNER_CIRCLE.filter(p => {
    if (innerCircleFilter === 'all') return true;
    return p.status === innerCircleFilter;
  });

  const filteredNotices = useMemo(() => {
    return notices.filter(n => {
      if (noticeFilter === 'pinned' && !n.pinned) return false;
      if (noticeFilter === 'safety' && !n.tag?.toLowerCase().includes('safety') && n.category !== 'safety') return false;
      if (noticeFilter === 'hr' && !n.tag?.toLowerCase().includes('hr') && n.category !== 'hr') return false;
      if (noticeFilter === 'operational' && !n.tag?.toLowerCase().includes('operations') && !n.tag?.toLowerCase().includes('hse') && n.category !== 'operational') return false;

      if (noticeSearch.trim()) {
        const q = noticeSearch.toLowerCase().trim();
        return (
          n.title.toLowerCase().includes(q) ||
          (n.title_bn && n.title_bn.toLowerCase().includes(q)) ||
          (n.body && n.body.toLowerCase().includes(q)) ||
          n.tag.toLowerCase().includes(q) ||
          (n.author && n.author.toLowerCase().includes(q)) ||
          (n.referenceNo && n.referenceNo.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [notices, noticeFilter, noticeSearch]);

  const handleRowClick = (item: DetailDrawerData) => {
    if (onOpenDetailDrawer) onOpenDetailDrawer(item);
  };

  return (
    <>
      {/* ═══════════════════════════════════════════
          CHAIRMAN: TAB "approvals" (Paginated)
          ═══════════════════════════════════════════ */}
      {activeTab === 'approvals' && (
        <div className="card mb-5 tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon">⚡</div>
              <div>
                <div className="card-title">{t('Priority Approvals — Chairman\'s Action Required', 'জরুরি অনুমোদন — চেয়ারম্যানের পদক্ষেপ প্রয়োজন', lang)}</div>
                <div className="card-subtitle">{t('High-value files escalated to Chairman\'s office', 'উচ্চ-মূল্যের ফাইল চেয়ারম্যান দপ্তরে উন্নীত', lang)}</div>
              </div>
            </div>
            <span className="badge danger">{PENDING_APPROVALS.length} {t('items', 'টি ফাইল', lang)}</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PENDING_APPROVALS.slice((approvalsPage - 1) * 2, approvalsPage * 2).map((item, i) => (
                <div
                  key={i}
                  className="approval-interactive-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderLeft: `4px solid ${item.urgency === 'urgent' ? 'var(--brand-crimson)' : 'var(--brand-slate-400)'}`
                  }}
                  onClick={() => handleRowClick(item)}
                >
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--brand-slate-900)' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', marginTop: '2px' }}>
                      {item.id} · {item.dept} · <strong style={{ color: 'var(--brand-gold-dark)' }}>{item.amount}</strong>
                    </div>
                  </div>
                  <div className="flex-gap" onClick={(e) => e.stopPropagation()}>
                    <button className="btn-gold" style={{ fontSize: '11px', padding: '6px 14px' }} onClick={() => showToast(`👑 Chairman authorized: ${item.id}`, 'gold')}>
                      👑 {t('Authorize', 'অনুমোদন', lang)}
                    </button>
                    <button className="btn-outline" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={() => handleRowClick(item)}>
                      {t('Inspect File', 'নথি দেখুন', lang)}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={approvalsPage}
              totalItems={PENDING_APPROVALS.length}
              pageSize={2}
              onPageChange={setApprovalsPage}
              lang={lang}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          CHAIRMAN: TAB "inner_circle" (Paginated & Filterable)
          ═══════════════════════════════════════════ */}
      {activeTab === 'inner_circle' && (
        <div className="card mb-5 tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon">👥</div>
              <div>
                <div className="card-title">{t('Inner Circle — Executive Presence', 'ইনার সার্কেল — নেতৃত্ব উপস্থিতি', lang)}</div>
                <div className="card-subtitle">{t('Live status of key leadership across Refinery, Finance & Operations', 'মূল নেতৃত্বের লাইভ স্ট্যাটাস', lang)}</div>
              </div>
            </div>
            <span className="badge success">{filteredInnerCircle.length} {t('executives', 'জন কর্মকর্তা', lang)}</span>
          </div>
          <div className="card-body">
            {/* Interactive Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '11px' }}>
              {[
                { id: 'all', label: 'All Tracked (8)', bg: '#F1F5F9', color: '#334155' },
                { id: 'present', label: '🟢 Present (4)', bg: '#ECFDF5', color: '#065F46' },
                { id: 'meeting', label: '🔵 In Meeting (1)', bg: '#EFF6FF', color: '#1E40AF' },
                { id: 'leave', label: '🟡 Informed Leave (1)', bg: '#FEF3C7', color: '#92400E' },
                { id: 'sick', label: '🟠 Sick Leave (1)', bg: '#FFFBEB', color: '#B45309' },
                { id: 'uninformed', label: '🔴 Uninformed Absent (1)', bg: '#FEE2E2', color: '#991B1B' },
              ].map(pill => (
                <button
                  key={pill.id}
                  onClick={() => { setInnerCircleFilter(pill.id); setInnerCirclePage(1); }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: innerCircleFilter === pill.id ? '2px solid var(--brand-crimson)' : '1px solid transparent',
                    background: pill.bg,
                    color: pill.color,
                    fontWeight: innerCircleFilter === pill.id ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="presence-list">
              {filteredInnerCircle.slice((innerCirclePage - 1) * 4, innerCirclePage * 4).map((person, i) => (
                <div
                  key={i}
                  className="presence-row interactive-row"
                  onClick={() => {
                    if (person.status === 'uninformed') {
                      showToast(`🚨 URGENT: HR GM Sayeda Afroza instructed to initiate formal inquiry for ${person.name}.`, 'danger');
                    } else {
                      showToast(`📍 ${person.name} location: ${person.location} (${person.phone})`, 'info');
                    }
                  }}
                  title="Click to view leadership detail or trigger intervention"
                  style={{
                    background: person.status === 'uninformed' ? '#FEF2F2' : undefined,
                    border: person.status === 'uninformed' ? '1px solid #FECACA' : undefined
                  }}
                >
                  <div className="presence-person">
                    <div className="presence-avatar" style={{ background: person.color }}>{person.initials}</div>
                    <div>
                      <div className="prs-name">{person.name}</div>
                      <div className="prs-role">{person.role} • <span style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>{person.location}</span></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${person.badge}`}>{t(person.statusLabel, person.statusLabelBn, lang)}</span>
                    {person.status === 'uninformed' ? (
                      <button
                        className="btn-outline-danger"
                        style={{ padding: '2px 8px', fontSize: '10px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast(`🚨 Priority Notice dispatched to ${person.name} & GM HR for unauthorized absence.`, 'danger');
                        }}
                      >
                        Alert HR
                      </button>
                    ) : (
                      <ChevronRight size={14} color="var(--brand-slate-300)" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={innerCirclePage}
              totalItems={filteredInnerCircle.length}
              pageSize={4}
              onPageChange={setInnerCirclePage}
              lang={lang}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          CHAIRMAN: TAB "notices" (Paginated & Filterable)
          ═══════════════════════════════════════════ */}
      {activeTab === 'notices' && (
        <div className="card mb-5 tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon">📢</div>
              <div>
                <div className="card-title">{t('Enterprise Notice Board', 'এন্টারপ্রাইজ নোটিশ বোর্ড', lang)}</div>
                <div className="card-subtitle">{t('Latest corporate announcements & group circulars', 'সর্বশেষ কর্পোরেট ঘোষণা', lang)}</div>
              </div>
            </div>
            <button
              className="btn-gold flex items-center gap-1.5 shadow-xs"
              style={{ fontSize: '11.5px', padding: '6px 14px' }}
              onClick={() => setShowPublishModal(true)}
            >
              <Plus size={13} />
              <span>+ {t('Publish Notice', 'নোটিশ প্রকাশ', lang)}</span>
            </button>
          </div>
          <div className="card-body">
            {/* Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
                {[
                  { id: 'all', label: `All Circulars (${notices.length})` },
                  { id: 'pinned', label: `📌 Pinned (${notices.filter(n => n.pinned).length})` },
                  { id: 'safety', label: `⚠️ Safety Critical (${notices.filter(n => n.tag?.toLowerCase().includes('safety') || n.category === 'safety').length})` },
                  { id: 'hr', label: `📋 HR & Admin (${notices.filter(n => n.tag?.toLowerCase().includes('hr') || n.category === 'hr').length})` },
                  { id: 'operational', label: `🏭 Refinery Operations (${notices.filter(n => n.tag?.toLowerCase().includes('operations') || n.category === 'operational').length})` },
                ].map(pill => (
                  <button
                    key={pill.id}
                    onClick={() => { setNoticeFilter(pill.id); setNoticesPage(1); }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition ${
                      noticeFilter === pill.id
                        ? 'bg-[#A51C30] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[200px] sm:w-60">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={noticeSearch}
                  onChange={(e) => { setNoticeSearch(e.target.value); setNoticesPage(1); }}
                  placeholder={t('Search notices, circulars...', 'নোটিশ খুঁজুন...', lang)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
                {noticeSearch && (
                  <button onClick={() => setNoticeSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Flagship Pinned Chairman Message */}
            {noticeFilter === 'all' && !noticeSearch && (
              <div
                className="notice-card gold-pin mb-3 cursor-pointer hover:shadow-md transition"
                onClick={() => setSelectedNoticeForDetail({
                  id: 'NOT-CHAIRMAN-EID',
                  title: "Chairman's Message — Eid ul-Adha 2026",
                  title_bn: "চেয়ারম্যানের বার্তা — ঈদুল আযহা ২০২৬",
                  tag: "👑 CHAIRMAN'S MESSAGE",
                  category: "executive",
                  priority: "high",
                  date: "Jun 17, 2026",
                  author: "Ahmed Akbar Sobhan",
                  authorRole: "Chairman & Managing Director",
                  targetAudience: "All Employees & Families of Bashundhara Group",
                  body: "On behalf of Bashundhara Group, I extend heartfelt Eid Mubarak to every employee and their families. Your relentless dedication to establishing world-class refining infrastructure, maintaining zero-incident safety standards, and powering the nation's energy future is the pride of our group. May this blessed occasion bring joy, health, and renewed determination to all.",
                  read: true,
                  pinned: true,
                  referenceNo: "BOGCL/CHAIR/EID-2026"
                })}
              >
                <div className="notice-hd">
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--brand-gold-dark)' }}>
                    👑 {t("Chairman's Message — Eid ul-Adha 2026", "চেয়ারম্যানের বার্তা — ঈদুল আযহা ২০২৬", lang)}
                  </div>
                  <span className="badge gold">👑 Pinned by Chairman</span>
                </div>
                <div className="notice-meta">Jun 17, 2026 · Ahmed Akbar Sobhan, Chairman · <span className="font-mono text-amber-700">BOGCL/CHAIR/EID-2026</span></div>
                <div className="notice-body" style={{ fontStyle: 'italic', color: 'var(--brand-slate-600)' }}>
                  {t('"On behalf of Bashundhara Group, I extend heartfelt Eid Mubarak to every employee and their families. Your relentless dedication to establishing world-class refining infrastructure..."', '"বাশুন্ধারা গ্রুপের পক্ষে সকল কর্মী ও তাদের পরিবারকে ঈদ মোবারক..."', lang)}
                </div>
              </div>
            )}

            {/* Paginated Notices List */}
            {filteredNotices.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Megaphone className="mx-auto mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {t('No corporate notices found matching this filter', 'কোনো নোটিশ পাওয়া যায়নি', lang)}
                </div>
              </div>
            ) : (
              <div className="notice-list">
                {filteredNotices.slice((noticesPage - 1) * 4, noticesPage * 4).map((notice, i) => {
                  const isSafety = notice.tag.includes('SAFETY') || notice.category === 'safety';
                  const isChairman = notice.tag.includes('CHAIRMAN') || notice.category === 'executive';

                  return (
                    <div
                      key={notice.id || i}
                      className={`notice-card${notice.pinned ? (isChairman ? ' gold-pin' : ' pinned') : ''} group relative transition-all hover:shadow-md cursor-pointer`}
                      onClick={() => setSelectedNoticeForDetail(notice)}
                    >
                      <div className="notice-hd">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm">{isChairman ? '👑' : isSafety ? '⚠️' : '📢'}</span>
                          <div className="notice-title text-[13.5px] font-bold text-slate-900 dark:text-white">
                            {t(notice.title, notice.title_bn, lang)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {notice.pinned && (
                            <span className={`badge ${isChairman ? 'gold' : 'danger'}`}>
                              {isChairman ? '👑 Chairman Pinned' : '📌 Pinned'}
                            </span>
                          )}
                          <span className={`badge ${isSafety ? 'danger' : notice.tag.includes('HR') ? 'info' : 'secondary'}`}>
                            {notice.tag}
                          </span>
                        </div>
                      </div>

                      <div className="notice-meta text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span>{notice.date}</span>
                        {notice.author && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600 dark:text-slate-300 font-medium">By {notice.author}</span>
                          </>
                        )}
                        {notice.targetAudience && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">Audience: {notice.targetAudience}</span>
                          </>
                        )}
                        {notice.referenceNo && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-400">{notice.referenceNo}</span>
                          </>
                        )}
                      </div>

                      {notice.body && (
                        <div className="notice-body text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                          {t(notice.body, notice.body_bn || notice.body, lang)}
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-[11px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {notice.requiresAck && (
                            <span className="text-slate-500 flex items-center gap-1">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span>
                                {notice.acknowledgedCount || 184}/{notice.totalRecipients || 218} Read ({Math.round(((notice.acknowledgedCount || 184) / (notice.totalRecipients || 218)) * 100)}%)
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn-sm-ghost flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900"
                            onClick={() => setSelectedNoticeForDetail(notice)}
                          >
                            <Eye size={12} />
                            <span>{t('View Full Circular', 'বিস্তারিত দেখুন', lang)}</span>
                          </button>

                          {!notice.read ? (
                            <button
                              type="button"
                              className="btn-sm-ghost text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md"
                              onClick={() => {
                                setNotices(prev => prev.map(n => n.id === notice.id || n.title === notice.title ? { ...n, read: true, acknowledgedCount: (n.acknowledgedCount || 0) + 1 } : n));
                                showToast(t('✓ Notice acknowledged.', '✓ নোটিশ স্বীকৃতি সংরক্ষিত হয়েছে।', lang), 'success');
                              }}
                            >
                              ✅ {t('Acknowledge', 'পড়েছি', lang)}
                            </button>
                          ) : (
                            <span className="text-[10.5px] font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              <span>Acknowledged</span>
                            </span>
                          )}

                          <button
                            type="button"
                            className="text-slate-400 hover:text-amber-600 p-1 rounded transition"
                            title={notice.pinned ? "Unpin notice" : "Pin notice"}
                            onClick={() => {
                              setNotices(prev => prev.map(n => n.id === notice.id || n.title === notice.title ? { ...n, pinned: !n.pinned } : n));
                              showToast(notice.pinned ? '📌 Notice unpinned' : '📌 Notice pinned to top', 'info');
                            }}
                          >
                            <Pin size={13} className={notice.pinned ? "fill-amber-500 text-amber-500" : ""} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Pagination
              currentPage={noticesPage}
              totalItems={filteredNotices.length}
              pageSize={4}
              onPageChange={setNoticesPage}
              lang={lang}
            />
          </div>
        </div>
      )}

      {/* ─── MODAL 1: PUBLISH ENTERPRISE NOTICE ─── */}
      <PublishNoticeModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        lang={lang}
        onPublish={(newNotice) => {
          setNotices([newNotice, ...notices]);
          showToast(
            t(
              `👑 Executive Circular published! Pushed to 1,240 employees via App & SMS.`,
              `👑 নতুন কর্পোরেট নোটিশ প্রকাশিত ও ১,২৪০ কর্মকর্তা-কর্মচারীদের নিকট প্রেরিত হয়েছে।`,
              lang
            ),
            'gold'
          );
        }}
      />

      {/* ─── MODAL 2: NOTICE DETAIL LETTERHEAD INSPECTION ─── */}
      <NoticeDetailModal
        notice={selectedNoticeForDetail}
        onClose={() => setSelectedNoticeForDetail(null)}
        lang={lang}
        onAcknowledge={(noticeId) => {
          setNotices(prev => prev.map(n => n.id === noticeId || n.title === selectedNoticeForDetail?.title ? { ...n, read: true, acknowledgedCount: (n.acknowledgedCount || 0) + 1 } : n));
        }}
      />
    </>
  );
}
