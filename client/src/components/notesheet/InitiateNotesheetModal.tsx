import React, { useState } from 'react';
import { AppRole, ROLE_META, t } from '../../types';
import { showToast } from '../../App';
import {
  FileSignature,
  FileText,
  X,
  Check,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Building2,
  DollarSign,
  AlertTriangle,
  Clock,
  Crown,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

export interface SignatoryStep {
  id: string;
  roleId: AppRole;
  roleName: string;
  roleNameBn: string;
  officerName: string;
  dept: string;
  avatarColor: string;
  initials: string;
  status: 'signed' | 'pending' | 'upcoming';
  signedAt?: string;
  hash?: string;
  signatureText?: string;
}

export interface NewNotesheetData {
  fileNo: string;
  title: string;
  dept: string;
  amount: string;
  urgency: 'urgent' | 'high' | 'normal';
  sapRef: string;
  initiatorName: string;
  initiatorRole: string;
  initiatorDept: string;
  initialNote: string;
  signatoryRoute: SignatoryStep[];
  finalApproverRole: AppRole;
}

interface InitiateNotesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewNotesheetData) => void;
  lang: 'en' | 'bn';
  currentRole: AppRole;
}

export const AVAILABLE_OFFICERS: Omit<SignatoryStep, 'id' | 'status'>[] = [
  {
    roleId: 'plant_gm',
    roleName: 'Plant General Manager',
    roleNameBn: 'প্ল্যান্ট জেনারেল ম্যানেজার',
    officerName: 'Engr. Md. Harunur Rashid',
    dept: 'Keraniganj Refinery Complex',
    avatarColor: '#0369A1',
    initials: 'HR',
  },
  {
    roleId: 'hod',
    roleName: 'CFO & Head of Finance',
    roleNameBn: 'সিএফও ও প্রধান অর্থ কর্মকর্তা',
    officerName: 'Farida Begum',
    dept: 'Corporate Finance & Accounts',
    avatarColor: '#7C3AED',
    initials: 'FB',
  },
  {
    roleId: 'hr_admin',
    roleName: 'GM, HR & Corporate Services',
    roleNameBn: 'মহাব্যবস্থাপক, মানবসম্পদ',
    officerName: 'Sayeda Afroza Sultana',
    dept: 'HR & Corporate Administration',
    avatarColor: '#BE185D',
    initials: 'SAS',
  },
  {
    roleId: 'transport_admin',
    roleName: 'Transport & Admin Supervisor',
    roleNameBn: 'পরিবহন ও প্রশাসন পরিদর্শক',
    officerName: 'Md. Kamruzzaman',
    dept: 'Admin & Transport Division',
    avatarColor: '#059669',
    initials: 'KZ',
  },
  {
    roleId: 'chairman',
    roleName: 'Chairman & Managing Director',
    roleNameBn: 'চেয়ারম্যান ও ব্যবস্থাপনা পরিচালক',
    officerName: 'Ahmed Akbar Sobhan',
    dept: "Chairman's Office, Baridhara HQ",
    avatarColor: '#A51C30',
    initials: 'AAS',
  },
];

interface RoutingPreset {
  id: string;
  titleEn: string;
  titleBn: string;
  badge: string;
  descEn: string;
  descBn: string;
  targetRoleIds: AppRole[];
  suggestedAmount: string;
  suggestedTitle: string;
  suggestedCategory: string;
  icon: string;
}

const ROUTING_PRESETS: RoutingPreset[] = [
  {
    id: 'plant_internal',
    titleEn: 'Plant Internal Approval (Final: Plant GM)',
    titleBn: 'প্ল্যান্ট অভ্যন্তরীণ অনুমোদন (চূড়ান্ত: প্ল্যান্ট জিএম)',
    badge: 'No Chairman Sign Needed',
    descEn: 'For equipment overhaul, catalyst dosing & plant work orders (< ৳5 Lakhs). Concludes at Plant GM.',
    descBn: 'যন্ত্রপাতি মেরামত ও প্ল্যান্ট কাজের জন্য। প্ল্যান্ট জিএম-এর স্বাক্ষরেই চূড়ান্ত।',
    targetRoleIds: ['plant_gm'],
    suggestedAmount: '৳4,50,000',
    suggestedTitle: 'Emergency Calibration of Unit-1 Bitumen Distillation Heat Exchanger Shell',
    suggestedCategory: 'Plant Maintenance & Reliability',
    icon: '🏭',
  },
  {
    id: 'dept_finance',
    titleEn: 'Department Expense Vetting (Final: CFO & HOD)',
    titleBn: 'বিভাগীয় ব্যয় অনুমোদন (চূড়ান্ত: সিএফও ও অর্থ প্রধান)',
    badge: 'Finance Final Sanction',
    descEn: 'For operational utilities, terminal leasing & supplier invoices (< ৳25 Lakhs). Concludes at CFO.',
    descBn: 'পরিচালন ব্যয় ও সরবরাহকারী ইনভয়েসের জন্য। সিএফও-এর স্বাক্ষরেই চূড়ান্ত অনুমোদন।',
    targetRoleIds: ['hod'],
    suggestedAmount: '৳14,20,000',
    suggestedTitle: 'Meghna Ghat Asphalt Depot Storage Tank Jetty River Dredging Invoice',
    suggestedCategory: 'Corporate Finance & Accounts',
    icon: '💼',
  },
  {
    id: 'hr_policy',
    titleEn: 'HR Policy & Workforce Authorization (Final: GM HR)',
    titleBn: 'এইচআর পলিসি ও মানবসম্পদ অনুমোদন (চূড়ান্ত: জিএম এইচআর)',
    badge: 'HR Final Sanction',
    descEn: 'For shift technician roster increments, safety gear & administrative orders. Concludes at GM HR.',
    descBn: 'শিফট কর্মী ভাতা ও প্রশাসনিক সার্কুলারের জন্য। জিএম এইচআর-এর স্বাক্ষরেই চূড়ান্ত।',
    targetRoleIds: ['hr_admin'],
    suggestedAmount: 'Policy / Non-Financial',
    suggestedTitle: 'Hazardous Environment Allowance for Keraniganj Bitumen Tank Marshals',
    suggestedCategory: 'Human Resources Directorate',
    icon: '👥',
  },
  {
    id: 'capex_boardroom',
    titleEn: 'Executive CAPEX & Boardroom Policy (Final: Chairman & MD)',
    titleBn: 'শীর্ষ নির্বাহী সিএপিইএক্স (চূড়ান্ত: মাননীয় চেয়ারম্যান)',
    badge: 'Sovereign Boardroom Seal',
    descEn: 'For emergency reactor relief valves, imported bitumen contracts & multi-crore L/Cs (> ৳25 Lakhs).',
    descBn: 'জরুরি রিঅ্যাক্টর ভালভ, আন্তর্জাতিক বিটুমিন এল/সি ও বৃহৎ বিনিয়োগের জন্য।',
    targetRoleIds: ['plant_gm', 'hod', 'chairman'],
    suggestedAmount: '৳48,50,000',
    suggestedTitle: 'Emergency Procurement for Keraniganj Bitumen Reactor Safety Relief Valves',
    suggestedCategory: 'Executive Boardroom Directorate',
    icon: '👑',
  },
];

export default function InitiateNotesheetModal({
  isOpen,
  onClose,
  onSubmit,
  lang,
  currentRole,
}: InitiateNotesheetModalProps) {
  const currentMeta = ROLE_META[currentRole] || ROLE_META.plant_gm;

  // Form State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('plant_internal');
  const [title, setTitle] = useState(
    'Emergency Calibration of Unit-1 Bitumen Distillation Heat Exchanger Shell'
  );
  const [dept, setDept] = useState('Plant Maintenance & Reliability');
  const [amount, setAmount] = useState('৳4,50,000');
  const [urgency, setUrgency] = useState<'urgent' | 'high' | 'normal'>('high');
  const [sapRef, setSapRef] = useState(
    `SAP-PR-2026-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [fileNo, setFileNo] = useState(
    `BOGCL/PROC/KER-2026/${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [initialNote, setInitialNote] = useState(
    'Submitted for administrative and technical approval. Mandatory ultrasonic thickness testing of Unit-1 heat exchanger shell completed; replacement of seal rings and calibration required prior to peak asphalt refining run.'
  );

  // Custom Signatory Route State
  const [selectedRoute, setSelectedRoute] = useState<SignatoryStep[]>([
    {
      ...AVAILABLE_OFFICERS[0], // Plant GM
      id: 'step-1',
      status: 'pending',
    },
  ]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: RoutingPreset) => {
    setSelectedPresetId(preset.id);
    setTitle(preset.suggestedTitle);
    setDept(preset.suggestedCategory);
    setAmount(preset.suggestedAmount);

    const newRoute: SignatoryStep[] = preset.targetRoleIds.map((rId, idx) => {
      const officer = AVAILABLE_OFFICERS.find((o) => o.roleId === rId) || AVAILABLE_OFFICERS[0];
      return {
        ...officer,
        id: `step-${idx + 1}`,
        status: idx === 0 ? 'pending' : 'upcoming',
      };
    });

    setSelectedRoute(newRoute);
    showToast(
      lang === 'bn'
        ? `অনুমোদন রুট নির্বাচন: ${preset.titleBn}`
        : `Approval route applied: ${preset.titleEn}`,
      'info'
    );
  };

  const toggleSignatory = (officer: Omit<SignatoryStep, 'id' | 'status'>) => {
    const exists = selectedRoute.some((s) => s.roleId === officer.roleId);
    if (exists) {
      if (selectedRoute.length === 1) {
        showToast(
          t('At least one approving authority is required.', 'কমপক্ষে একজন অনুমোদনকারী আবশ্যক।', lang),
          'warn'
        );
        return;
      }
      setSelectedRoute((prev) =>
        prev
          .filter((s) => s.roleId !== officer.roleId)
          .map((s, idx) => ({ ...s, status: idx === 0 ? 'pending' : 'upcoming' }))
      );
    } else {
      setSelectedRoute((prev) => [
        ...prev,
        {
          ...officer,
          id: `step-${Date.now()}-${Math.random()}`,
          status: 'upcoming',
        },
      ]);
    }
    setSelectedPresetId('custom');
  };

  const handleRemoveStep = (idx: number) => {
    if (selectedRoute.length === 1) {
      showToast(
        t('At least one approving authority is required.', 'কমপক্ষে একজন অনুমোদনকারী আবশ্যক।', lang),
        'warn'
      );
      return;
    }
    setSelectedRoute((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, status: i === 0 ? 'pending' : 'upcoming' }))
    );
    setSelectedPresetId('custom');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !initialNote.trim()) {
      showToast(
        t('Please enter document subject and initial note.', 'অনুগ্রহ করে বিষয় ও নোটের বিবরণ লিখুন।', lang),
        'warn'
      );
      return;
    }

    if (selectedRoute.length === 0) {
      showToast(
        t('Please designate at least one approving signatory.', 'অনুগ্রহ করে কমপক্ষে একজন অনুমোদনকারী নির্বাচন করুন।', lang),
        'warn'
      );
      return;
    }

    const finalApprover = selectedRoute[selectedRoute.length - 1];

    onSubmit({
      fileNo,
      title,
      dept,
      amount,
      urgency,
      sapRef,
      initiatorName: currentMeta.name,
      initiatorRole: currentMeta.label,
      initiatorDept: currentMeta.dept,
      initialNote,
      signatoryRoute: selectedRoute,
      finalApproverRole: finalApprover.roleId,
    });

    onClose();
  };

  const finalSignatory = selectedRoute[selectedRoute.length - 1];

  return (
    <div
      className="modal-bg"
      onClick={onClose}
      style={{
        zIndex: 99999,
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="fleet-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '860px',
          width: '96%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* ─── 1. MODAL HEADER ─── */}
        <div className="fleet-modal-hd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #A51C30 0%, #E11D48 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)',
                flexShrink: 0,
              }}
            >
              <FileSignature size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {t('Start New Note-Sheet & E-Authorization File', 'নতুন ই-নোটশীট ও ফাইল অনুমোদন শুরু করুন', lang)}
                </h3>
                <span
                  style={{
                    backgroundColor: '#D97706',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Configurable Routing
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
                  'Initiator defines file scope, cost center, and designates required signing authorities',
                  'আবেদনকারী ফাইলের উদ্দেশ্য, ব্যয় ও কার কার স্বাক্ষর প্রয়োজন তা নির্ধারণ করতে পারেন',
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
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── 2. INITIATOR PROFILE STRIP ─── */}
        <div className="fleet-modal-profile-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: currentMeta.avatarColor,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '12px',
              }}
            >
              {currentMeta.initials}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '12.5px' }}>
                {t('Initiator: ', 'উত্থাপনকারী: ', lang)}
                <strong>{currentMeta.name}</strong> •{' '}
                <span style={{ opacity: 0.8 }}>{t(currentMeta.label, currentMeta.labelBn, lang)}</span>
              </div>
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '1px' }}>
                {currentMeta.dept} • File Reference:{' '}
                <code style={{ fontWeight: 700, color: 'var(--brand-crimson)' }}>{fileNo}</code>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: '6px',
                background: 'rgba(5, 150, 105, 0.12)',
                color: '#059669',
                fontWeight: 700,
                border: '1px solid rgba(5, 150, 105, 0.25)',
              }}
            >
              ✓ SAP PR Synced
            </div>
          </div>
        </div>

        {/* ─── 3. FORM BODY ─── */}
        <form
          id="initiate-notesheet-form"
          onSubmit={handleSubmit}
          className="fleet-modal-body"
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            padding: '22px 28px',
            boxSizing: 'border-box',
          }}
        >
          {/* 3A. APPROVAL ROUTING PRESETS BAR */}
          <div className="fleet-preset-bar" style={{ marginBottom: '22px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800 }}>
                <Sparkles size={14} color="#D97706" />
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('1-Click Signatory Routing Templates', 'স্বাক্ষরকারী রুট টেমপ্লেট নির্বাচন', lang)}
                </span>
              </div>
              <span style={{ fontSize: '10.5px', opacity: 0.75 }}>
                {t('Select workflow governance tier', 'অনুমোদন প্রক্রিয়া নির্বাচন করুন', lang)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '8px' }}>
              {ROUTING_PRESETS.map((preset) => {
                const isActive = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="fleet-preset-chip"
                    style={{
                      borderColor: isActive ? 'var(--brand-crimson)' : undefined,
                      backgroundColor: isActive ? 'rgba(165, 28, 48, 0.08)' : undefined,
                      color: isActive ? 'var(--brand-crimson)' : undefined,
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      whiteSpace: 'normal',
                      textAlign: 'left',
                      height: 'auto',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 800, fontSize: '11.5px' }}>
                      <span>{preset.icon}</span>
                      <span>{lang === 'bn' ? preset.titleBn : preset.titleEn}</span>
                    </div>
                    <div
                      style={{
                        fontSize: '9.5px',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        marginTop: '4px',
                        backgroundColor: isActive ? '#A51C30' : 'rgba(0,0,0,0.08)',
                        color: isActive ? '#FFFFFF' : 'inherit',
                        fontWeight: 700,
                      }}
                    >
                      {preset.badge}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3B. VISUAL ACTIVE SIGNATORY PIPELINE */}
          <div
            className="fleet-telemetry-hud"
            style={{ marginBottom: '22px' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800 }}>
                <Layers size={14} color="#2563EB" />
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('Configured Approval Chain & Signatory Sequence', 'নির্বাচিত ধারাবাহিক অনুমোদনকারী চেইন', lang)}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                Final Approver: {finalSignatory ? finalSignatory.officerName : 'None'}
              </div>
            </div>

            {/* Step-by-Step Sequence Cards */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '6px',
              }}
            >
              {/* Originator Card */}
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.04)',
                  border: '1px solid var(--brand-slate-200, #E2E8F0)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexShrink: 0,
                  fontSize: '11.5px',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: currentMeta.avatarColor,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '10px',
                  }}
                >
                  {currentMeta.initials}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '11px' }}>{currentMeta.name.split(' ')[0]}</div>
                  <div style={{ fontSize: '9.5px', opacity: 0.7 }}>Initiator (Para 1)</div>
                </div>
              </div>

              <ChevronRight size={14} color="#94A3B8" style={{ flexShrink: 0 }} />

              {/* Dynamic Signatory Steps */}
              {selectedRoute.map((step, idx) => {
                const isFinal = idx === selectedRoute.length - 1;
                return (
                  <React.Fragment key={step.id}>
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: isFinal ? 'rgba(217, 119, 6, 0.08)' : 'rgba(37, 99, 235, 0.08)',
                        border: isFinal ? '1.5px solid #D97706' : '1.5px solid #3B82F6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexShrink: 0,
                        fontSize: '11.5px',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: step.avatarColor,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '10px',
                        }}
                      >
                        {step.initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '11.5px', color: isFinal ? '#B45309' : '#1E40AF' }}>
                          {step.officerName.split(' ')[0]}
                        </div>
                        <div style={{ fontSize: '9.5px', opacity: 0.8 }}>
                          {isFinal ? '👑 Final Authority' : `Reviewer (Para ${idx + 2})`}
                        </div>
                      </div>
                      {selectedRoute.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            padding: '2px',
                            marginLeft: '4px',
                          }}
                          title="Remove Signatory"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    {!isFinal && <ChevronRight size={14} color="#94A3B8" style={{ flexShrink: 0 }} />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Quick Add Signatory Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', opacity: 0.75, fontWeight: 600 }}>
                {t('Toggle Authorities in Route:', 'স্বাক্ষরকারী যুক্ত/বাতিল করুন:', lang)}
              </span>
              {AVAILABLE_OFFICERS.map((officer) => {
                const isIncluded = selectedRoute.some((s) => s.roleId === officer.roleId);
                return (
                  <button
                    key={officer.roleId}
                    type="button"
                    onClick={() => toggleSignatory(officer)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: isIncluded ? '1px solid #059669' : '1px dashed var(--brand-slate-300, #CBD5E1)',
                      background: isIncluded ? 'rgba(5, 150, 105, 0.08)' : 'transparent',
                      color: isIncluded ? '#059669' : 'inherit',
                      fontSize: '11px',
                      fontWeight: isIncluded ? 700 : 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{isIncluded ? '✓' : '+'}</span>
                    <span>{officer.officerName.split(' ')[0]} ({officer.roleName.split(' ')[0]})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3C. DOCUMENT SUBJECT & SAP REFERENCE */}
          <div className="notice-field-group" style={{ marginBottom: '18px' }}>
            <div className="notice-field-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FileText size={14} color="#A51C30" />
                {t('Document Subject / Procurement Matter', 'নথির বিষয় / কার্যাদেশের বিবরণ', lang)}{' '}
                <span style={{ color: '#A51C30' }}>*</span>
              </span>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Emergency Procurement for Keraniganj Bitumen Reactor Safety Relief Valves"
              className="notice-input"
            />
          </div>

          {/* 3D. FINANCIAL ESTIMATE, CATEGORY & URGENCY */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              marginBottom: '18px',
            }}
          >
            <div>
              <div className="notice-field-label">
                <span>{t('Estimated Amount / Financial Scope', 'আনুমানিক ব্যয় / আর্থিক পরিমাণ', lang)}</span>
              </div>
              <input
                type="text"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. ৳48,50,000 or Policy / Non-Financial"
                className="notice-input"
              />
            </div>

            <div>
              <div className="notice-field-label">
                <span>{t('Department / GL Head', 'বিভাগ / জিএল হেড', lang)}</span>
              </div>
              <input
                type="text"
                required
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="notice-input"
              />
            </div>

            <div>
              <div className="notice-field-label">
                <span>{t('SAP PR / Material Reference', 'এসএপি পিআর রেফারেন্স', lang)}</span>
              </div>
              <input
                type="text"
                required
                value={sapRef}
                onChange={(e) => setSapRef(e.target.value)}
                className="notice-input"
                style={{ fontFamily: 'monospace', fontWeight: 700 }}
              />
            </div>

            <div>
              <div className="notice-field-label">
                <span>{t('Urgency Level', 'জরুরিতা মাত্রা', lang)}</span>
              </div>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="notice-select"
              >
                <option value="urgent">🔴 Urgent (Immediate Action)</option>
                <option value="high">🟠 High Priority</option>
                <option value="normal">🟢 Normal Work Order</option>
              </select>
            </div>
          </div>

          {/* 3E. PARAGRAPH #1 (INITIATOR'S OFFICIAL NOTE) */}
          <div className="notice-field-group" style={{ marginBottom: '18px' }}>
            <div className="notice-field-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FileSignature size={14} color="#2563EB" />
                {t('Para-1: Initiating Officer Official Note & Justification', 'প্যারা-১: উত্থাপনকারীর অফিসিয়াল নোট ও যৌক্তিকতা', lang)}{' '}
                <span style={{ color: '#A51C30' }}>*</span>
              </span>
              <span style={{ fontSize: '11px', opacity: 0.7, textTransform: 'none', fontWeight: 500 }}>
                {initialNote.length} characters
              </span>
            </div>
            <textarea
              required
              rows={4}
              value={initialNote}
              onChange={(e) => setInitialNote(e.target.value)}
              placeholder="State the technical, operational, or administrative reason for this note-sheet..."
              className="notice-textarea"
              style={{ lineHeight: 1.6 }}
            />
          </div>
        </form>

        {/* ─── 4. MODAL FOOTER ─── */}
        <div className="fleet-modal-ft">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', opacity: 0.8 }}>
            <Shield size={16} color="#059669" />
            <span>
              Cryptographic SHA-256 seal assigned at each signatory tier. Final authority:{' '}
              <strong>{finalSignatory ? finalSignatory.roleName : ''}</strong>
            </span>
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
                color: 'inherit',
                backgroundColor: 'transparent',
                border: '1.5px solid var(--brand-slate-200, #CBD5E1)',
                cursor: 'pointer',
              }}
            >
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button
              type="submit"
              form="initiate-notesheet-form"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, #A51C30 0%, #871424 100%)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(165, 28, 48, 0.35)',
              }}
            >
              <FileSignature size={15} />
              <span>{t('Launch Note-Sheet into Workflow', 'নোট-শীট ওয়ার্কফ্লোতে প্রেরণ করুন', lang)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
