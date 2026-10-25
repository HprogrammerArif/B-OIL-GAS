import React, { useState } from 'react';
import {
  X,
  Megaphone,
  Sparkles,
  ShieldCheck,
  Crown,
  Pin,
  Users,
  BellRing,
  Eye,
  CheckCircle2,
  FileText,
  AlertCircle,
  HelpCircle,
  Lock,
} from 'lucide-react';
import { NoticeItem } from './types';
import { t } from '../../types';

interface PublishNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'bn';
  onPublish: (notice: NoticeItem) => void;
}

interface NoticeTemplate {
  label: string;
  icon: string;
  title: string;
  title_bn: string;
  tag: string;
  category: 'safety' | 'operational' | 'hr' | 'executive' | 'urgent';
  priority: 'critical' | 'high' | 'normal';
  targetAudience: string;
  body: string;
  body_bn: string;
  pinned: boolean;
  requiresAck: boolean;
}

const TEMPLATES: NoticeTemplate[] = [
  {
    label: "Chairman's Directive",
    icon: '👑',
    title: "Chairman's Special Directive — Operational Safety & Discipline Compliance",
    title_bn: "চেয়ারম্যানের বিশেষ নির্দেশনা — নিরাপত্তা ও শৃঙ্খলা বিধান",
    tag: "👑 CHAIRMAN DIRECTIVE",
    category: "executive",
    priority: "high",
    targetAudience: "All Group Employees (1,240 Staff)",
    body: "In alignment with Bashundhara Group's zero-incident commitment, all departmental heads, plant managers, and depot supervisors are strictly directed to conduct mandatory safety roll-calls at the start of every shift. Full operational integrity must be maintained across all bitumen refining and logistics assets without compromise.",
    body_bn: "বসুন্ধরা গ্রুপের জিরো-ইনসিডেন্ট নীতির আলোকে সকল বিভাগীয় প্রধান ও প্ল্যান্ট ম্যানেজারদের প্রতি শিফটে বাধ্যতামূলক নিরাপত্তা ব্রিফিং নিশ্চিত করার কঠোর নির্দেশ দেওয়া হলো।",
    pinned: true,
    requiresAck: true,
  },
  {
    label: 'Safety & LOTO Protocol',
    icon: '⚠️',
    title: 'Urgent Safety Circular — High-Pressure Steam & Bitumen Line Lockout Compliance',
    title_bn: 'জরুরি নিরাপত্তা সার্কুলার — হাই-প্রেসার স্টিম ও বিটুমিন লাইন এলওটিও মানদণ্ড',
    tag: '⚠️ SAFETY CRITICAL',
    category: 'safety',
    priority: 'critical',
    targetAudience: 'Keraniganj Refinery & Field Engineering (218 Personnel)',
    body: 'Effective immediately, dual-lock Lockout/Tagout (LOTO) protocols are strictly mandatory on all Unit-2 bitumen booster pumps and distillation columns prior to any mechanical inspection. Any bypass of safety interlocks will result in instant disciplinary escalation.',
    body_bn: 'অবিলম্বে কার্যকর: সকল বিটুমিন বুস্টার পাম্প ও ডিস্টিলেশন কলামে ডুয়াল-লক এলওটিও প্রোটোকল কঠোরভাবে বাধ্যতামূলক। নিরাপত্তা নিয়ম লঙ্ঘনে তাৎক্ষণিক শাস্তিমূলক ব্যবস্থা গ্রহণ করা হবে।',
    pinned: true,
    requiresAck: true,
  },
  {
    label: 'Plant Maintenance Window',
    icon: '🏭',
    title: 'Planned DCS Automation Upgrade & Scheduled Throughput Optimization',
    title_bn: 'পরিকল্পিত ডিসিএস অটোমেশন আপগ্রেড ও শিডিউল মেইনটেন্যান্স',
    tag: 'REFINERY OPERATIONS',
    category: 'operational',
    priority: 'normal',
    targetAudience: 'Plant Operations, DCS & Shift Engineers (218 Personnel)',
    body: 'Scheduled software calibration for DCS Node C-102 will be conducted on Sunday from 02:00 AM to 05:00 AM. Redundant analog safety controllers will remain active throughout the maintenance window.',
    body_bn: 'আগামী রবিবার রাত ২টা থেকে ভোর ৫টা পর্যন্ত ডিসিএস নোড সি-১০২ এর নির্ধারিত সফটওয়্যার ক্যালিব্রেশন অনুষ্ঠিত হবে। এ সময় সহায়ক নিরাপত্তা ব্যবস্থা সক্রিয় থাকবে।',
    pinned: false,
    requiresAck: false,
  },
  {
    label: 'HR Policy & Holiday Notice',
    icon: '📋',
    title: 'Corporate Circular — Official Holiday Observation & Essential Operations Roster',
    title_bn: 'কর্পোরেট সার্কুলার — সরকারি ছুটির দিন ও জরুরি ডিউটি রোস্টার',
    tag: 'HR CIRCULAR',
    category: 'hr',
    priority: 'normal',
    targetAudience: 'All Group Employees (1,240 Staff)',
    body: 'Head Office and administrative branches will observe holiday closure. Continuous operational units (Refinery DCS, Security, Gate Logistics, and Tank Farm) will operate under standard holiday overtime roster with full safety clearance.',
    body_bn: 'হেড অফিস ও প্রশাসনিক শাখাসমূহ ছুটিতে বন্ধ থাকবে। রিফাইনারি ডিসিএস, নিরাপত্তা ও গেট লজিস্টিকসের মতো জরুরি ইউনিটসমূহ ছুটির ডিউটি রোস্টারে চালু থাকবে।',
    pinned: false,
    requiresAck: false,
  },
];

export default function PublishNoticeModal({
  isOpen,
  onClose,
  lang,
  onPublish,
}: PublishNoticeModalProps) {
  const [title, setTitle] = useState('');
  const [titleBn, setTitleBn] = useState('');
  const [tag, setTag] = useState('👑 CHAIRMAN DIRECTIVE');
  const [category, setCategory] = useState<'safety' | 'operational' | 'hr' | 'executive' | 'urgent'>('executive');
  const [priority, setPriority] = useState<'critical' | 'high' | 'normal'>('high');
  const [targetAudience, setTargetAudience] = useState('All Group Employees (1,240 Staff)');
  const [body, setBody] = useState('');
  const [author] = useState('Ahmed Akbar Sobhan');
  const [authorRole] = useState('Chairman & Managing Director');
  const [referenceNo, setReferenceNo] = useState(`BOGCL/DIR/2026/Q4-${Math.floor(100 + Math.random() * 900)}`);
  const [pinned, setPinned] = useState(true);
  const [requiresAck, setRequiresAck] = useState(true);
  const [sendSms, setSendSms] = useState(true);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl: NoticeTemplate) => {
    setTitle(tmpl.title);
    setTitleBn(tmpl.title_bn);
    setTag(tmpl.tag);
    setCategory(tmpl.category);
    setPriority(tmpl.priority);
    setTargetAudience(tmpl.targetAudience);
    setBody(tmpl.body);
    setPinned(tmpl.pinned);
    setRequiresAck(tmpl.requiresAck);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newNotice: NoticeItem = {
      id: `NOT-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim(),
      title_bn: titleBn.trim() || title.trim(),
      tag,
      category,
      priority,
      date: 'Today, Just Now',
      author,
      authorRole,
      targetAudience,
      body: body.trim() || title.trim(),
      body_bn: titleBn.trim() || undefined,
      read: false,
      pinned,
      requiresAck,
      acknowledgedCount: 0,
      totalRecipients: targetAudience.includes('218') ? 218 : targetAudience.includes('32') ? 32 : targetAudience.includes('520') ? 520 : targetAudience.includes('142') ? 142 : 1240,
      referenceNo,
    };

    onPublish(newNotice);
    onClose();
  };

  return (
    <div
      className="modal-bg"
      onClick={onClose}
      style={{
        zIndex: 99999,
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="notice-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '820px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(15, 23, 42, 0.1)',
          boxSizing: 'border-box',
        }}
      >
        {/* ─── 1. MODAL HEADER ─── */}
        <div
          className="notice-modal-hd"
          style={{
            padding: '18px 28px',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #871424 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)',
                flexShrink: 0,
              }}
            >
              <Crown size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {t('Publish Enterprise Notice & Board Circular', 'কর্পোরেট নোটিশ ও সার্কুলার প্রকাশনা ফর্ম', lang)}
                </h3>
                <span
                  style={{
                    backgroundColor: '#F59E0B',
                    color: '#0F172A',
                    fontSize: '10px',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Directorate
                </span>
              </div>
              <p
                style={{
                  margin: '3px 0 0 0',
                  fontSize: '12px',
                  color: '#CBD5E1',
                  lineHeight: 1.4,
                }}
              >
                {t(
                  'Broadcast official announcements, safety bulletins & directives to 1,240 employees',
                  'সকল ১,২৪০ কর্মকর্তা ও কর্মচারীদের জন্য প্রাতিষ্ঠানিক নোটিশ প্রকাশ ও বিতরণ করুন',
                  lang
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#CBD5E1';
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── 2. SUBHEADER: QUICK PRESETS & VIEW TOGGLE ─── */}
        <div
          className="notice-modal-subhd"
          style={{
            padding: '12px 28px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxSizing: 'border-box',
          }}
        >
          {/* Preset Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              flex: 1,
              minWidth: 0,
              paddingBottom: '2px',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#64748B',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                marginRight: '4px',
                flexShrink: 0,
              }}
            >
              <Sparkles size={13} color="#D97706" />
              {t('Quick Presets:', 'টেমপ্লেট:', lang)}
            </span>
            {TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#A51C30';
                  e.currentTarget.style.color = '#A51C30';
                  e.currentTarget.style.backgroundColor = '#FFF5F5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.color = '#334155';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <span>{tmpl.icon}</span>
                <span>{tmpl.label}</span>
              </button>
            ))}
          </div>

          {/* Form vs Preview Tab Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#E2E8F0',
              padding: '3px',
              borderRadius: '10px',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              style={{
                padding: '5px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.15s ease',
                backgroundColor: activeTab === 'form' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'form' ? '#0F172A' : '#64748B',
                boxShadow: activeTab === 'form' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <FileText size={12} style={{ display: 'inline', marginRight: '5px', verticalAlign: '-1px' }} />
              {t('Edit Form', 'ফর্ম পূরণ', lang)}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              style={{
                padding: '5px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.15s ease',
                backgroundColor: activeTab === 'preview' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'preview' ? '#0F172A' : '#64748B',
                boxShadow: activeTab === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Eye size={12} style={{ display: 'inline', marginRight: '5px', verticalAlign: '-1px' }} />
              {t('Preview Card', 'প্রিভিউ কার্ড', lang)}
            </button>
          </div>
        </div>

        {/* ─── 3. FORM BODY ─── */}
        {activeTab === 'form' ? (
          <form
            id="publish-notice-form"
            onSubmit={handleSubmit}
            className="notice-modal-body"
            style={{
              flex: '1 1 auto',
              overflowY: 'auto',
              padding: '28px 32px',
              backgroundColor: '#FFFFFF',
              boxSizing: 'border-box',
            }}
          >
            {/* Field 1: Circular Headline (English) */}
            <div className="notice-field-group" style={{ marginBottom: '20px' }}>
              <div className="notice-field-label">
                <span>
                  {t('Circular Headline (English)', 'সার্কুলার শিরোনাম (ইংরেজি)', lang)}{' '}
                  <span style={{ color: '#E11D48' }}>*</span>
                </span>
                <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'none', fontWeight: 500 }}>
                  Mandatory field
                </span>
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mandatory Safety Briefing — Q4 Plant Operations"
                className="notice-input"
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#0F172A',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Field 2: Circular Headline (Bengali) */}
            <div className="notice-field-group" style={{ marginBottom: '20px' }}>
              <div className="notice-field-label">
                <span>{t('Headline in Bengali (বাংলা শিরোনাম - ঐচ্ছিক)', 'বাংলা শিরোনাম (ঐচ্ছিক)', lang)}</span>
                <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'none', fontWeight: 500 }}>
                  Bengali script supported
                </span>
              </div>
              <input
                type="text"
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                placeholder="যেমন: বাধ্যতামূলক নিরাপত্তা ব্রিফিং — ৪র্থ প্রান্তিক প্ল্যান্ট অপারেশন"
                className="notice-input"
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13.5px',
                  color: '#0F172A',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Field 3 & 4: Two-column grid (Category Tag & Priority Level) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '18px',
                marginBottom: '20px',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div className="notice-field-label">
                  <span>{t('Category Tag', 'নোটিশ বিভাগ / ট্যাগ', lang)}</span>
                </div>
                <select
                  value={tag}
                  onChange={(e) => {
                    setTag(e.target.value);
                    if (e.target.value.includes('SAFETY')) setCategory('safety');
                    else if (e.target.value.includes('CHAIRMAN')) setCategory('executive');
                    else if (e.target.value.includes('HR')) setCategory('hr');
                    else setCategory('operational');
                  }}
                  className="notice-select"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="👑 CHAIRMAN DIRECTIVE">👑 CHAIRMAN DIRECTIVE</option>
                  <option value="⚠️ SAFETY CRITICAL">⚠️ SAFETY CRITICAL</option>
                  <option value="HSE">HSE (Health & Environment)</option>
                  <option value="HR CIRCULAR">HR CIRCULAR</option>
                  <option value="REFINERY OPERATIONS">REFINERY OPERATIONS</option>
                  <option value="CORPORATE FINANCE">CORPORATE FINANCE</option>
                  <option value="LOGISTICS & FLEET">LOGISTICS & FLEET</option>
                </select>
              </div>

              <div>
                <div className="notice-field-label">
                  <span>{t('Priority Level', 'অগ্রাধিকার স্তর', lang)}</span>
                </div>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as typeof priority)}
                  className="notice-select"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="critical">🔴 Critical Priority (Immediate Emergency Alert)</option>
                  <option value="high">🟡 High Priority (Mandatory Staff Read)</option>
                  <option value="normal">🔵 General Announcement (Informational)</option>
                </select>
              </div>
            </div>

            {/* Field 5 & 6: Two-column grid (Target Audience & Circular Reference No.) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '18px',
                marginBottom: '20px',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div className="notice-field-label">
                  <span>{t('Distribution Scope / Target Audience', 'বিজ্ঞপ্তির আওতাভুক্ত প্রাপক', lang)}</span>
                </div>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="notice-select"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="All Group Employees (1,240 Staff)">🌐 All Group Employees (1,240 Staff)</option>
                  <option value="Keraniganj Refinery & Field Engineering (218 Personnel)">
                    🏭 Keraniganj Refinery & Field Engineering (218)
                  </option>
                  <option value="Baridhara Corporate HQ (520 Staff)">🏢 Baridhara Corporate HQ (520 Staff)</option>
                  <option value="Central Logistics & Fleet Crew (142 Drivers & Marshals)">
                    🚗 Central Logistics & Fleet Crew (142)
                  </option>
                  <option value="Board of Directors & Department Heads (32 Leaders)">
                    👥 Board of Directors & Department Heads (32)
                  </option>
                </select>
              </div>

              <div>
                <div className="notice-field-label">
                  <span>{t('Official Circular Reference No.', 'স্মারক / রেফারেন্স নম্বর', lang)}</span>
                </div>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="notice-input"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#0F172A',
                    backgroundColor: '#F8FAFC',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Field 7: Announcement Body / Circular Message */}
            <div className="notice-field-group" style={{ marginBottom: '22px' }}>
              <div className="notice-field-label">
                <span>{t('Announcement Body / Circular Message', 'পূর্ণাঙ্গ নোটিশের বার্তা / নির্দেশনাবলি', lang)}</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    fontWeight: 700,
                  }}
                >
                  {body.length} characters
                </span>
              </div>
              <textarea
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write full circular instructions, policies, compliance deadlines, or executive announcements..."
                className="notice-textarea"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  color: '#0F172A',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: '110px',
                }}
              />
            </div>

            {/* Field 8: Official Signatory Profile Card */}
            <div
              style={{
                borderRadius: '12px',
                border: '1.5px solid #FCD34D',
                background: 'linear-gradient(135deg, #FFFDF5 0%, #FEF3C7 100%)',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '22px',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#D97706',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '16px',
                    boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  👑
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
                    {author}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#B45309', marginTop: '1px' }}>
                    {authorRole} • Bashundhara Group
                  </div>
                </div>
              </div>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #F59E0B',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}
              >
                Authorized Signatory
              </span>
            </div>

            {/* Field 9: Governance & Distribution Controls (Styled Cards) */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '2px',
                }}
              >
                <ShieldCheck size={15} color="#059669" />
                <span>Governance & Broadcast Protocols</span>
              </div>

              {/* Control 1 */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginTop: '2px',
                    accentColor: '#D97706',
                    cursor: 'pointer',
                  }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                    {t('Pin to Top of Notice Board (Highlighted Gold Ribbon)', 'নোটিশ বোর্ডের শীর্ষে পিন করে রাখুন', lang)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                    Displays prominent gold banner at the top of employee and director dashboards.
                  </div>
                </div>
              </label>

              {/* Control 2 */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={requiresAck}
                  onChange={(e) => setRequiresAck(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginTop: '2px',
                    accentColor: '#059669',
                    cursor: 'pointer',
                  }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                    {t('Require Mandatory Digital Employee Acknowledgment (Track read %)', 'কর্মীদের দ্বারা স্বীকৃতি প্রদান বাধ্যতামূলক করুন', lang)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                    Enforces "Mark as Read" acknowledgment audit ledger and compliance metric reporting.
                  </div>
                </div>
              </label>

              {/* Control 3 */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginTop: '2px',
                    accentColor: '#A51C30',
                    cursor: 'pointer',
                  }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                    {t('Dispatch Priority App Notification & SMS Broadcast to 1,240 Employees', 'মোবাইল অ্যাপ নোটিফিকেশন ও এসএমএস অ্যালার্ট পাঠান', lang)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                    Sends high-priority mobile push notice and SMS flash bulletin across all refinery & HQ units.
                  </div>
                </div>
              </label>
            </div>
          </form>
        ) : (
          /* Live Preview Mode */
          <div
            className="notice-modal-body"
            style={{
              flex: '1 1 auto',
              overflowY: 'auto',
              padding: '28px 32px',
              backgroundColor: '#F8FAFC',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '14px',
              }}
            >
              {t('Live Notice Card Render Preview (How staff will see it):', 'নোটিশ বোর্ড প্রিভিউ:', lang)}
            </div>

            <div
              className={`notice-card${pinned ? ' pinned' : ''} ${pinned && tag.includes('CHAIRMAN') ? 'gold-pin' : ''}`}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                padding: '20px 24px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                boxSizing: 'border-box',
              }}
            >
              <div className="notice-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{tag.includes('CHAIRMAN') ? '👑' : tag.includes('SAFETY') ? '⚠️' : '📢'}</span>
                  <span>{title || 'Notice Headline'}</span>
                </div>
                <span className={`badge ${pinned ? 'danger' : 'info'}`}>{tag}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
                Just Now · {author}, {authorRole} · <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#D97706' }}>{referenceNo}</span>
              </div>
              <div style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.6, marginBottom: '16px' }}>
                {body || 'Notice message body will appear here...'}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: '12px',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: '#64748B' }}>
                  Target: <strong>{targetAudience}</strong>
                </span>
                {requiresAck && (
                  <button
                    type="button"
                    className="btn-sm-ghost"
                    style={{
                      fontSize: '11.5px',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: '1px solid #10B981',
                      color: '#059669',
                      backgroundColor: '#ECFDF5',
                      fontWeight: 700,
                    }}
                  >
                    ✅ {t('Acknowledge', 'পড়েছি', lang)}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── 4. MODAL FOOTER ─── */}
        <div
          className="notice-modal-ft"
          style={{
            padding: '16px 28px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748B' }}>
            <ShieldCheck size={16} color="#059669" />
            <span>Digital Cryptographic Seal • BOGCL Enterprise Governance</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#475569',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #CBD5E1',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F1F5F9';
                e.currentTarget.style.borderColor = '#94A3B8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
            >
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button
              type="submit"
              form="publish-notice-form"
              disabled={!title.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#FFFFFF',
                background: !title.trim()
                  ? '#CBD5E1'
                  : 'linear-gradient(135deg, #A51C30 0%, #871424 100%)',
                border: 'none',
                cursor: !title.trim() ? 'not-allowed' : 'pointer',
                boxShadow: !title.trim() ? 'none' : '0 4px 14px rgba(165, 28, 48, 0.35)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (title.trim()) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(165, 28, 48, 0.45)';
                }
              }}
              onMouseLeave={(e) => {
                if (title.trim()) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(165, 28, 48, 0.35)';
                }
              }}
            >
              <Megaphone size={15} />
              <span>{t('Publish & Dispatch Circular', 'নোটিশ প্রকাশ ও প্রেরণ করুন', lang)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
