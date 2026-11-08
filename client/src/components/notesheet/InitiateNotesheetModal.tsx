import React, { useState } from 'react';
import { AppRole, ROLE_META, t } from '../../types';
import { deptCodeOf, nextNoteSheetRef, nextRef, peekNoteSheetRef, peekRef } from '../../lib/refs';
import { Button, FormField, Modal } from '../ui';
import AttachDocuments, { type AttachedFile } from '../AttachDocuments';
import {
  ArrowDown, ArrowUp, FileSignature, Send, Shield, Stamp, X,
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
  attachments?: AttachedFile[];
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
    avatarColor: 'var(--status-info-solid)',
    initials: 'HR',
  },
  {
    roleId: 'hod',
    roleName: 'CFO & Head of Finance',
    roleNameBn: 'সিএফও ও প্রধান অর্থ কর্মকর্তা',
    officerName: 'Farida Begum',
    dept: 'Corporate Finance & Accounts',
    avatarColor: 'var(--status-purple-solid)',
    initials: 'FB',
  },
  {
    roleId: 'hr_admin',
    roleName: 'GM, HR & Corporate Services',
    roleNameBn: 'মহাব্যবস্থাপক, মানবসম্পদ',
    officerName: 'Sayeda Afroza Sultana',
    dept: 'HR & Corporate Administration',
    avatarColor: 'var(--status-pink)',
    initials: 'SAS',
  },
  {
    roleId: 'transport_admin',
    roleName: 'Transport & Admin Supervisor',
    roleNameBn: 'পরিবহন ও প্রশাসন পরিদর্শক',
    officerName: 'Md. Kamruzzaman',
    dept: 'Admin & Transport Division',
    avatarColor: 'var(--status-success-solid)',
    initials: 'KZ',
  },
  {
    roleId: 'chairman',
    roleName: 'Chairman & Managing Director',
    roleNameBn: 'চেয়ারম্যান ও ব্যবস্থাপনা পরিচালক',
    officerName: 'Abdul Mannan Chowdhury',
    dept: "Chairman's Office, Baridhara HQ",
    avatarColor: 'var(--brand-crimson)',
    initials: 'AMC',
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
}

const ROUTING_PRESETS: RoutingPreset[] = [
  {
    id: 'plant_internal',
    titleEn: 'Factory Machinery Maintenance (Final: Plant GM)',
    titleBn: 'কারখানা যন্ত্রপাতি মেরামত (চূড়ান্ত: প্ল্যান্ট জিএম)',
    badge: 'Plant GM Approval',
    descEn: 'For routine factory servicing, cooling tower pumps & equipment repair. Concludes at Plant GM.',
    descBn: 'কারখানার নিয়মিত যন্ত্রপাতি মেরামত ও সার্ভিসিং। প্ল্যান্ট জিএম-এর স্বাক্ষরেই চূড়ান্ত।',
    targetRoleIds: ['plant_gm'],
    suggestedAmount: '৳3,50,000',
    suggestedTitle: 'Factory Cooling Water Pump Servicing & Pipe Valve Replacement',
    suggestedCategory: 'Plant Operations',
  },
  {
    id: 'dept_finance',
    titleEn: 'Department Software & Office Expenses (Final: CFO)',
    titleBn: 'সফটওয়্যার ও অফিস খরচ (চূড়ান্ত: অর্থ প্রধান)',
    badge: 'Finance Approval',
    descEn: 'For corporate software licenses, office supplies & vendor bills. Concludes at CFO.',
    descBn: 'অফিস সফটওয়্যার, সামগ্রী ও সরবরাহকারী বিল। অর্থ প্রধানের স্বাক্ষরেই চূড়ান্ত অনুমোদন।',
    targetRoleIds: ['hod'],
    suggestedAmount: '৳18,50,000',
    suggestedTitle: 'Annual Corporate Enterprise Software & Systems License Renewal',
    suggestedCategory: 'Finance & Accounts',
  },
  {
    id: 'hr_policy',
    titleEn: 'Staff Welfare & HR Policy (Final: GM HR)',
    titleBn: 'কর্মী কল্যাণ ও এইচআর পলিসি (চূড়ান্ত: জিএম এইচআর)',
    badge: 'HR Approval',
    descEn: 'For workforce welfare, staff uniforms, safety gear & administrative guidelines.',
    descBn: 'কর্মী কল্যাণ, ইউনিফর্ম ও নিরাপত্তা সরঞ্জাম। জিএম এইচআর-এর স্বাক্ষরেই চূড়ান্ত।',
    targetRoleIds: ['hr_admin'],
    suggestedAmount: 'Company Policy / Approved Budget',
    suggestedTitle: 'Plant Operations Staff Shift Uniform & Personal Protective Equipment',
    suggestedCategory: 'Human Resources',
  },
  {
    id: 'capex_boardroom',
    titleEn: 'Major Equipment & Plant Upgrades (Final: Chairman)',
    titleBn: 'বৃহৎ যন্ত্রপাতি ও প্ল্যান্ট সম্প্রসারণ (চূড়ান্ত: চেয়ারম্যান)',
    badge: 'Chairman Approval',
    descEn: 'For backup power generators, major equipment overhaul & capital investments.',
    descBn: 'ব্যাকআপ জেনারেটর মেরামত ও বৃহৎ যন্ত্রপাতি ক্রয়। চেয়ারম্যান মহোদয়ের স্বাক্ষরে চূড়ান্ত অনুমোদন।',
    targetRoleIds: ['plant_gm', 'hod', 'chairman'],
    suggestedAmount: '৳48,50,000',
    suggestedTitle: 'Backup Power Generator Overhaul & Critical Spare Parts Purchase',
    suggestedCategory: 'Plant Operations & Engineering',
  },
];

const URGENCY_OPTIONS: { value: NewNotesheetData['urgency']; en: string; bn: string; descEn: string; descBn: string }[] = [
  { value: 'normal', en: 'Normal', bn: 'সাধারণ', descEn: 'Standard turnaround', descBn: 'স্বাভাবিক সময়' },
  { value: 'high', en: 'High priority', bn: 'উচ্চ অগ্রাধিকার', descEn: 'Review soon', descBn: 'দ্রুত পর্যালোচনা' },
  { value: 'urgent', en: 'Urgent', bn: 'জরুরি', descEn: 'Immediate action', descBn: 'তাৎক্ষণিক পদক্ষেপ' },
];

const NOTE_LIMIT = 2000;
const FIRST_PRESET = ROUTING_PRESETS[0];

function routeFor(preset: RoutingPreset): SignatoryStep[] {
  return preset.targetRoleIds.map((rId, idx) => {
    const officer = AVAILABLE_OFFICERS.find((o) => o.roleId === rId) || AVAILABLE_OFFICERS[0];
    return { ...officer, id: `step-${idx + 1}`, status: idx === 0 ? 'pending' : 'upcoming' };
  });
}

/** Re-number a route so only the first signatory is "pending". */
function renumber(route: SignatoryStep[]): SignatoryStep[] {
  return route.map((s, idx) => ({ ...s, status: idx === 0 ? 'pending' : 'upcoming' }));
}

/**
 * Start-a-note-sheet dialog. Mount it only while open (the parent renders it
 * conditionally) so every new file starts from a clean form.
 */
export default function InitiateNotesheetModal({
  isOpen,
  onClose,
  onSubmit,
  lang,
  currentRole,
}: InitiateNotesheetModalProps) {
  const currentMeta = ROLE_META[currentRole] || ROLE_META.plant_gm;

  // A route template pre-fills a coherent starting point; every field stays editable.
  const [presetId, setPresetId] = useState<string>(FIRST_PRESET.id);
  const [title, setTitle] = useState(FIRST_PRESET.suggestedTitle);
  const [dept, setDept] = useState(FIRST_PRESET.suggestedCategory);
  const [amount, setAmount] = useState(FIRST_PRESET.suggestedAmount);
  const [urgency, setUrgency] = useState<NewNotesheetData['urgency']>('normal');
  const [initialNote, setInitialNote] = useState('');
  const [docs, setDocs] = useState<AttachedFile[]>([]);
  const [route, setRoute] = useState<SignatoryStep[]>(() => routeFor(FIRST_PRESET));
  const [submitted, setSubmitted] = useState(false);

  // Reference numbers are previewed from the sequential counters and only
  // allocated when the form is submitted.
  const initiatorDeptCode = deptCodeOf(currentMeta.dept);
  const [sapRef, setSapRef] = useState(() => peekRef('PR', 5));
  const fileNo = peekNoteSheetRef(initiatorDeptCode);

  const errors = {
    title: title.trim() ? '' : t('Enter the subject of this file.', 'ফাইলের বিষয় লিখুন।', lang),
    amount: amount.trim() ? '' : t('Enter the amount, or "Non-financial".', 'অর্থের পরিমাণ লিখুন, অথবা "অর্থবিহীন"।', lang),
    dept: dept.trim() ? '' : t('Enter the department or GL head.', 'বিভাগ বা জিএল হেড লিখুন।', lang),
    note: initialNote.trim() ? '' : t('Write the justification for Para 1.', 'প্যারা-১-এর যৌক্তিকতা লিখুন।', lang),
  };
  const shown = (key: keyof typeof errors) => (submitted ? errors[key] : '');

  const applyPreset = (preset: RoutingPreset) => {
    setPresetId(preset.id);
    setTitle(preset.suggestedTitle);
    setDept(preset.suggestedCategory);
    setAmount(preset.suggestedAmount);
    setRoute(routeFor(preset));
  };

  const toggleOfficer = (officer: Omit<SignatoryStep, 'id' | 'status'>) => {
    const exists = route.some((s) => s.roleId === officer.roleId);
    if (exists) {
      if (route.length === 1) return;
      setRoute((prev) => renumber(prev.filter((s) => s.roleId !== officer.roleId)));
    } else {
      setRoute((prev) => renumber([...prev, { ...officer, id: `step-${officer.roleId}`, status: 'upcoming' }]));
    }
    setPresetId('custom');
  };

  const moveStep = (idx: number, delta: number) => {
    const target = idx + delta;
    if (target < 0 || target >= route.length) return;
    setRoute((prev) => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return renumber(next);
    });
    setPresetId('custom');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const firstBad = (['title', 'amount', 'dept', 'note'] as const).find((k) => errors[k]);
    if (firstBad || route.length === 0) {
      if (firstBad) document.querySelector<HTMLElement>(`#nsf-form [data-nsf="${firstBad}"]`)?.focus();
      return;
    }

    const allocatedFileNo = nextNoteSheetRef(initiatorDeptCode);
    const typedRef = sapRef.trim();
    const allocatedSapRef = !typedRef || typedRef === peekRef('PR', 5) ? nextRef('PR', 5) : typedRef;

    onSubmit({
      fileNo: allocatedFileNo,
      title: title.trim(),
      dept: dept.trim(),
      amount: amount.trim(),
      urgency,
      sapRef: allocatedSapRef,
      initiatorName: currentMeta.name,
      initiatorRole: currentMeta.label,
      initiatorDept: currentMeta.dept,
      initialNote: initialNote.trim(),
      attachments: docs.length > 0 ? docs : undefined,
      signatoryRoute: route,
      finalApproverRole: route[route.length - 1].roleId,
    });
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="lg"
      icon={<FileSignature size={17} />}
      title={t('Start a new note-sheet', 'নতুন নোট-শীট শুরু করুন', lang)}
      footer={(
        <>
          <span className="nsf-foot-note">
            <Shield size={14} /> {t('Every signature is sealed with a SHA-256 code.', 'প্রতিটি স্বাক্ষর SHA-256 কোড দিয়ে সিলমোহরকৃত।', lang)}
          </span>
          <Button variant="secondary" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</Button>
          <Button type="submit" form="nsf-form" variant="primary" icon={<Send size={14} />}>
            {t('Send for approval', 'অনুমোদনের জন্য পাঠান', lang)}
          </Button>
        </>
      )}
    >
      <form id="nsf-form" className="nsf" onSubmit={handleSubmit} noValidate>
        {/* Initiator */}
        <div className="nsf-initiator">
          <span className="nsf-avatar" style={{ background: currentMeta.avatarColor }} aria-hidden>{currentMeta.initials}</span>
          <span className="nsf-who">
            <strong>{currentMeta.name}</strong>
            <small>{t(currentMeta.label, currentMeta.labelBn, lang)} · {currentMeta.dept}</small>
          </span>
          <span className="nsf-ref">
            <small>{t('File reference', 'ফাইল রেফারেন্স', lang)}</small>
            <code>{fileNo}</code>
          </span>
        </div>

        {/* 1. Template */}
        <section className="nsf-section" aria-labelledby="nsf-s1">
          <h4 id="nsf-s1"><b>1</b> {t('Choose an approval route', 'অনুমোদনের ধারা বেছে নিন', lang)}</h4>
          <FormField
            label={t('Template', 'টেমপ্লেট', lang)}
            hint={
              presetId === 'custom'
                ? t('Custom route: you changed the template.', 'কাস্টম ধারা: আপনি টেমপ্লেট পরিবর্তন করেছেন।', lang)
                : t(ROUTING_PRESETS.find((p) => p.id === presetId)?.descEn ?? '', ROUTING_PRESETS.find((p) => p.id === presetId)?.descBn ?? '', lang)
            }
          >
            {(id) => (
              <select
                id={id}
                className="notice-select"
                value={presetId === 'custom' ? 'custom' : presetId}
                onChange={(e) => {
                  if (e.target.value === 'custom') return;
                  const preset = ROUTING_PRESETS.find((p) => p.id === e.target.value);
                  if (preset) applyPreset(preset);
                }}
              >
                {ROUTING_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>{t(preset.titleEn, preset.titleBn, lang)}</option>
                ))}
                {presetId === 'custom' && (
                  <option value="custom">{t('Custom route', 'কাস্টম ধারা', lang)}</option>
                )}
              </select>
            )}
          </FormField>
        </section>

        {/* 2. Route */}
        <section className="nsf-section" aria-labelledby="nsf-s2">
          <h4 id="nsf-s2"><b>2</b> {t('Review the signing order', 'স্বাক্ষরের ক্রম দেখুন', lang)}</h4>
          <ol className="nsf-route">
            {route.map((step, idx) => {
              const isFinal = idx === route.length - 1;
              return (
                <li key={step.id} className={isFinal ? 'final' : ''}>
                  <span className="nsf-step-no">{idx + 1}</span>
                  <span className="nsf-step-body">
                    <strong>{step.officerName}</strong>
                    <small>{t(step.roleName, step.roleNameBn, lang)}</small>
                    {isFinal && <em><Stamp size={11} /> {t('Final approver', 'চূড়ান্ত অনুমোদনকারী', lang)}</em>}
                  </span>
                  <span className="nsf-step-tools">
                    <button type="button" onClick={() => moveStep(idx, -1)} disabled={idx === 0} aria-label={t('Move earlier', 'আগে নিন', lang)}><ArrowUp size={13} /></button>
                    <button type="button" onClick={() => moveStep(idx, 1)} disabled={isFinal} aria-label={t('Move later', 'পরে নিন', lang)}><ArrowDown size={13} /></button>
                    {route.length > 1 && (
                      <button type="button" onClick={() => toggleOfficer(step)} aria-label={t(`Remove ${step.officerName}`, `${step.officerName}-কে সরান`, lang)}><X size={13} /></button>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="nsf-add">
            <label htmlFor="nsf-add-officer">{t('Add a signatory', 'স্বাক্ষরকারী যোগ করুন', lang)}</label>
            <select
              id="nsf-add-officer"
              className="notice-select"
              value=""
              onChange={(e) => {
                const officer = AVAILABLE_OFFICERS.find((o) => o.roleId === e.target.value);
                if (officer) toggleOfficer(officer);
              }}
            >
              <option value="">{t('Choose an officer to add…', 'যোগ করতে একজন কর্মকর্তা বেছে নিন…', lang)}</option>
              {AVAILABLE_OFFICERS.filter((o) => !route.some((s) => s.roleId === o.roleId)).map((officer) => (
                <option key={officer.roleId} value={officer.roleId}>
                  {officer.officerName} — {t(officer.roleName, officer.roleNameBn, lang)}
                </option>
              ))}
            </select>
          </div>
          <small className="nsf-hint">{t('Signatures are collected in this order. New signatories join at the end.', 'স্বাক্ষর এই ক্রমে নেওয়া হবে। নতুন স্বাক্ষরকারী শেষে যুক্ত হয়।', lang)}</small>
        </section>

        {/* 3. Details */}
        <section className="nsf-section" aria-labelledby="nsf-s3">
          <h4 id="nsf-s3"><b>3</b> {t('File details', 'ফাইলের বিবরণ', lang)}</h4>
          <div className="nsf-grid">
            <div className="nsf-span">
              <FormField label={t('Subject / procurement matter', 'বিষয় / ক্রয়ের বিবরণ', lang)} required error={shown('title')}>
                {(id) => (
                  <input
                    id={id}
                    data-nsf="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="notice-input"
                    maxLength={200}
                    aria-invalid={!!shown('title')}
                  />
                )}
              </FormField>
            </div>
            <FormField label={t('Estimated amount', 'আনুমানিক অর্থ', lang)} required error={shown('amount')} hint={t('For example ৳4,50,000', 'যেমন ৳4,50,000', lang)}>
              {(id) => (
                <input id={id} data-nsf="amount" type="text" value={amount} onChange={(e) => setAmount(e.target.value)} className="notice-input" aria-invalid={!!shown('amount')} />
              )}
            </FormField>
            <FormField label={t('Department / GL head', 'বিভাগ / জিএল হেড', lang)} required error={shown('dept')}>
              {(id) => (
                <input id={id} data-nsf="dept" type="text" value={dept} onChange={(e) => setDept(e.target.value)} className="notice-input" aria-invalid={!!shown('dept')} />
              )}
            </FormField>
            <FormField label={t('Purchase request reference', 'ক্রয় অনুরোধ রেফারেন্স', lang)} hint={t('Assigned automatically if left blank', 'ফাঁকা রাখলে স্বয়ংক্রিয়ভাবে নির্ধারিত হবে', lang)}>
              {(id) => (
                <input id={id} type="text" value={sapRef} onChange={(e) => setSapRef(e.target.value)} className="notice-input nsf-mono" />
              )}
            </FormField>
            <div className="form-group ui-field">
              <span className="ui-field-label" id="nsf-urgency-label">{t('Urgency', 'জরুরিতা', lang)}</span>
              <div className="nsf-seg" role="radiogroup" aria-labelledby="nsf-urgency-label">
                {URGENCY_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={urgency === o.value}
                    className={`${urgency === o.value ? 'active' : ''} u-${o.value}`}
                    onClick={() => setUrgency(o.value)}
                    title={t(o.descEn, o.descBn, lang)}
                  >
                    {t(o.en, o.bn, lang)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Para 1 */}
        <section className="nsf-section" aria-labelledby="nsf-s4">
          <h4 id="nsf-s4"><b>4</b> {t('Para 1: your note and justification', 'প্যারা-১: আপনার নোট ও যৌক্তিকতা', lang)}</h4>
          <FormField label={t('Why is this needed?', 'এটি কেন প্রয়োজন?', lang)} required error={shown('note')}>
            {(id) => (
              <textarea
                id={id}
                data-nsf="note"
                rows={4}
                maxLength={NOTE_LIMIT}
                value={initialNote}
                onChange={(e) => setInitialNote(e.target.value)}
                placeholder={t(
                  'State the technical, operational or administrative reason, and what you are asking the approvers to decide.',
                  'প্রযুক্তিগত, পরিচালনাগত বা প্রশাসনিক কারণ এবং অনুমোদনকারীদের কী সিদ্ধান্ত নিতে হবে তা লিখুন।',
                  lang,
                )}
                className="notice-textarea"
                aria-invalid={!!shown('note')}
              />
            )}
          </FormField>
          <span className="nsf-count">{initialNote.length}/{NOTE_LIMIT}</span>
          <AttachDocuments
            lang={lang}
            files={docs}
            onChange={setDocs}
            label={t('Attach a supporting document', 'একটি সহায়ক নথি সংযুক্ত করুন', lang)}
          />
        </section>
      </form>
    </Modal>
  );
}
