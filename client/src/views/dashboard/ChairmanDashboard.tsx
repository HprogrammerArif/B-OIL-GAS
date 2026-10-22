import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { t } from '../../types';
import { showToast } from '../../App';
import Pagination from '../../components/Pagination';
import { DetailDrawerData } from '../../components/DetailDrawer';
import { DashboardSubViewProps } from './types';
import { INNER_CIRCLE, PENDING_APPROVALS, NOTICE_BOARD } from './dashboardData';

export default function ChairmanDashboard({
  lang,
  activeTab,
  onOpenDetailDrawer
}: DashboardSubViewProps) {
  const [approvalsPage, setApprovalsPage] = useState(1);
  const [innerCirclePage, setInnerCirclePage] = useState(1);
  const [innerCircleFilter, setInnerCircleFilter] = useState<string>('all');
  const [noticesPage, setNoticesPage] = useState(1);
  const [notices, setNotices] = useState(NOTICE_BOARD);

  const filteredInnerCircle = INNER_CIRCLE.filter(p => {
    if (innerCircleFilter === 'all') return true;
    return p.status === innerCircleFilter;
  });

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
          CHAIRMAN: TAB "notices" (Paginated)
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
              className="btn-outline"
              style={{ fontSize: '11px', padding: '4px 10px' }}
              onClick={() => {
                const titleInput = prompt('Enter new corporate circular headline / নোটিশ শিরোনাম লিখুন:');
                if (!titleInput) return;
                const newNotice = {
                  title: titleInput,
                  title_bn: titleInput,
                  tag: 'URGENT CIRCULAR',
                  date: 'Today, Just Now',
                  read: false,
                  pinned: true
                };
                setNotices([newNotice, ...notices]);
                showToast('📢 New company-wide notice published & pushed to all 1,240 employees via App & SMS.', 'gold');
              }}
            >
              + {t('Publish Notice', 'নোটিশ প্রকাশ', lang)}
            </button>
          </div>
          <div className="card-body">
            {/* Pinned Chairman Message */}
            <div className="notice-card gold-pin" style={{ marginBottom: '12px' }}>
              <div className="notice-hd">
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-gold-dark)' }}>
                  👑 {t("Chairman's Message — Eid ul-Adha 2026", "চেয়ারম্যানের বার্তা — ঈদুল আযহা ২০২৬", lang)}
                </div>
                <span className="badge gold">Pinned</span>
              </div>
              <div className="notice-meta">Jun 17, 2026 · Ahmed Akbar Sobhan, Chairman</div>
              <div className="notice-body" style={{ fontStyle: 'italic', color: 'var(--brand-slate-600)' }}>
                {t('"On behalf of Bashundhara Group, I extend heartfelt Eid Mubarak to every employee and their families..."', '"বাশুন্ধারা গ্রুপের পক্ষে সকল কর্মী ও তাদের পরিবারকে ঈদ মোবারক..."', lang)}
              </div>
            </div>

            <div className="notice-list">
              {notices.slice((noticesPage - 1) * 2, noticesPage * 2).map((notice, i) => (
                <div key={i} className={`notice-card${notice.pinned ? ' pinned' : ''}`}>
                  <div className="notice-hd">
                    <div className="notice-title">{t(notice.title, notice.title_bn, lang)}</div>
                    <span className={`badge ${notice.pinned ? 'danger' : 'info'}`}>{notice.tag}</span>
                  </div>
                  <div className="notice-meta">{notice.date}</div>
                  {!notice.read && (
                    <button className="btn-sm-ghost" style={{ fontSize: '11px' }} onClick={() => showToast('Notice acknowledged.', 'success')}>
                      ✅ {t('Acknowledge', 'পড়েছি', lang)}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Pagination
              currentPage={noticesPage}
              totalItems={notices.length}
              pageSize={2}
              onPageChange={setNoticesPage}
              lang={lang}
            />
          </div>
        </div>
      )}
    </>
  );
}
