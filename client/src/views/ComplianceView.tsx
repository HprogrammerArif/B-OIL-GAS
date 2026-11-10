import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../components/ToastManager';
import { useOperationsStore, licenseScanFor, type LicenseCard, type LicenseEvent } from '../store/operationsStore';
import { useCurrentUser } from '../auth/session';
import { today, nowStamp } from '../lib/clock';
import {
  ShieldCheck, AlertTriangle, Clock, Building, ArrowRight, ArrowLeft,
  ChevronLeft, ChevronRight,
  FileText, User, CheckSquare, X, FileBadge, ShieldAlert, Search,
  Download, Printer, Send, Check, CircleDot,
} from 'lucide-react';
import { Button, EmptyState, PageHeader, StatusPill } from '../components/ui';
import {
  AGENCY_FILTERS,
  STAGES,
  canAdvance,
  canApproveThisFee,
  canDoLetter,
  canRevert,
  canToggleChecklist,
  capsFromUser,
  checklistComplete,
  checklistOpen,
  myWork,
  nextLine,
  stageOf,
} from './compliance/pipeline';
import {
  channelLabel,
  downloadFile,
  letterHtml,
  makeCourierParcel,
  nextDoMemo,
  printHtml,
  type DoChannel,
} from './compliance/doLetter';

export default function ComplianceView({ lang }: ViewProps) {
  const { licenses, setLicenses, setParcels } = useOperationsStore();
  const user = useCurrentUser();
  const caps = capsFromUser(user);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDoLetterModal, setShowDoLetterModal] = useState<LicenseCard | null>(null);
  const [revertId, setRevertId] = useState<string | null>(null);
  const [revertReason, setRevertReason] = useState('');
  const [focusedStage, setFocusedStage] = useState<number | 'all'>('all');
  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState<string>('all');
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [doLetterDeliveryMode, setDoLetterDeliveryMode] = useState<DoChannel>('enothi');
  const [stageAction, setStageAction] = useState<{ kind: 'inspect' | 'certificate'; id: string } | null>(null);
  const [inspectFindings, setInspectFindings] = useState('');
  const [certConfirm, setCertConfirm] = useState(false);
  const [certPhoto, setCertPhoto] = useState('');

  const selectedLicense = licenses.find((l) => l.id === selectedId) ?? null;

  const patchLicense = (id: string, patch: Partial<LicenseCard> | ((lic: LicenseCard) => LicenseCard)) => {
    setLicenses((prev) => prev.map((lic) => {
      if (lic.id !== id) return lic;
      return typeof patch === 'function' ? patch(lic) : { ...lic, ...patch };
    }));
  };

  const addEvent = (lic: LicenseCard, text: string, textBn: string): LicenseEvent[] => {
    const ev: LicenseEvent = {
      id: `${Date.now()}`,
      at: nowStamp(lang),
      actor: user?.name ?? 'System',
      text,
      textBn,
    };
    return [ev, ...(lic.events ?? [])].slice(0, 20);
  };

  const handleOpenDoLetter = (lic: LicenseCard) => {
    setDoLetterDeliveryMode(lic.doLetterChannel ?? 'enothi');
    setShowDoLetterModal(lic);
  };

  const commitAdvance = (lic: LicenseCard, extra: Partial<LicenseCard> = {}) => {
    const nextStage = Math.min(5, lic.stage + 1) as 1 | 2 | 3 | 4 | 5;
    const label = stageOf(nextStage);
    patchLicense(lic.id, (row) => ({
      ...row,
      ...extra,
      stage: nextStage,
      events: addEvent(row, `Moved to ${label.title}.`, `${label.titleBn} ধাপে স্থানান্তর।`),
    }));
    showToast(t(`Moved to ${label.title}.`, `${label.titleBn} ধাপে স্থানান্তর হয়েছে।`, lang), 'success');
  };

  const closeStage = () => {
    setStageAction(null);
    setCertPhoto('');
  };

  const handleCertPhoto = (file: File | undefined) => {
    if (!file) return;
    const allowed = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
    if (!allowed || file.size > 2 * 1024 * 1024) {
      showToast(t('Use a JPEG, PNG, or WebP image under 2 MB.', '২ এমবির কম JPEG, PNG বা WebP ছবি ব্যবহার করুন।', lang), 'info');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCertPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  const tryAdvance = (lic: LicenseCard) => {
    const gate = canAdvance(lic, caps);
    if (!gate.ok) {
      showToast(t(gate.reason ?? 'Cannot advance.', gate.reasonBn ?? 'এখন সরানো যাবে না।', lang), 'warn');
      return;
    }
    if (lic.stage === 3) {
      setInspectFindings(lic.inspectionFindings ?? '');
      setStageAction({ kind: 'inspect', id: lic.id });
      return;
    }
    if (lic.stage === 4) {
      setCertConfirm(false);
      setCertPhoto('');
      setStageAction({ kind: 'certificate', id: lic.id });
      return;
    }
    if (lic.stage === 1) {
      commitAdvance(lic, {
        documents: [
          { name: `Application_${lic.refNo.replace(/\//g, '-')}.html`, size: '48 KB', date: today(), type: 'Application' },
          ...lic.documents,
        ],
      });
      return;
    }
    if (lic.stage === 2) {
      commitAdvance(lic);
      return;
    }
    commitAdvance(lic);
  };

  const confirmInspection = () => {
    const lic = licenses.find((l) => l.id === stageAction?.id);
    if (!lic || inspectFindings.trim().length < 10) {
      showToast(t('Write the inspection findings (10+ characters).', 'পরিদর্শনের ফলাফল লিখুন (কমপক্ষে ১০ অক্ষর)।', lang), 'warn');
      return;
    }
    commitAdvance(lic, {
      inspectionFindings: inspectFindings.trim(),
      lastInspection: today(),
      documents: [
        { name: `Inspection_findings_${lic.refNo.replace(/\//g, '-')}.html`, size: '36 KB', date: today(), type: 'Inspection Report' },
        ...lic.documents,
      ],
    });
    setStageAction(null);
    setCertPhoto('');
  };

  const confirmCertificate = () => {
    const lic = licenses.find((l) => l.id === stageAction?.id);
    if (!lic || !certConfirm) {
      showToast(t('Confirm that the renewal certificate is in hand.', 'নবায়ন সনদ হাতে আছে বলে নিশ্চিত করুন।', lang), 'warn');
      return;
    }
    const certName = `Renewal_Certificate_${lic.refNo.replace(/\//g, '-')}.html`;
    commitAdvance(lic, {
      scan: certPhoto || lic.scan || licenseScanFor(lic.tag),
      documents: [
        { name: certName, size: '120 KB', date: today(), type: 'Renewal Certificate' },
        ...lic.documents,
      ],
    });
    setStageAction(null);
    setCertPhoto('');
  };

  const submitDoLetter = () => {
    const lic = showDoLetterModal;
    if (!lic || !user) return;
    if (lic.doLetterStatus === 'dispatched') {
      setShowDoLetterModal(null);
      return;
    }
    const memo = lic.doLetterMemo || nextDoMemo(lic.tag);
    const filename = `${memo.replace(/\//g, '_')}.html`;
    const html = letterHtml(lic, lang, memo, caps.canDispatch);

    if (caps.canDispatch) {
      let parcelRef: string | undefined;
      if (doLetterDeliveryMode === 'courier') {
        const parcel = makeCourierParcel(lic, memo, user.name, user.label);
        parcelRef = parcel.trackingNo;
        setParcels((prev) => [parcel, ...prev]);
      }
      downloadFile(filename, html);
      patchLicense(lic.id, (row) => ({
        ...row,
        doLetterStatus: 'dispatched',
        doLetterMemo: memo,
        doLetterChannel: doLetterDeliveryMode,
        doLetterAt: nowStamp(lang),
        doLetterBy: user.name,
        doLetterParcelRef: parcelRef,
        documents: [{ name: filename, size: '52 KB', date: today(), type: 'DO Letter' }, ...row.documents],
        events: addEvent(
          row,
          `Signed DO ${memo} and sent via ${channelLabel(doLetterDeliveryMode, 'en')}${parcelRef ? ` (${parcelRef})` : ''}.`,
          `ডিও ${memo} স্বাক্ষর করে ${channelLabel(doLetterDeliveryMode, 'bn')} দিয়ে পাঠানো হয়েছে${parcelRef ? ` (${parcelRef})` : ''}।`,
        ),
      }));
      const extra = doLetterDeliveryMode === 'courier'
        ? t(` Courier pouch ${parcelRef} is on the mail desk.`, ` কুরিয়ার পাউচ ${parcelRef} মেইল ডেস্কে আছে।`, lang)
        : doLetterDeliveryMode === 'enothi'
          ? t(' Queued on the government e-Nothi adapter.', ' সরকারি ই-নথি অ্যাডাপ্টারে সারিবদ্ধ।', lang)
          : t(' Marked for executive hand delivery.', ' নির্বাহী হস্তান্তরের জন্য চিহ্নিত।', lang);
      showToast(t(`DO ${memo} signed and sent to ${lic.agency}.`, `ডিও ${memo} ${lic.agencyBn}-এ স্বাক্ষর করে পাঠানো হয়েছে।`, lang) + extra, 'gold');
    } else {
      downloadFile(filename, html);
      patchLicense(lic.id, (row) => ({
        ...row,
        doLetterStatus: 'awaiting_signature',
        doLetterMemo: memo,
        doLetterChannel: doLetterDeliveryMode,
        doLetterAt: nowStamp(lang),
        doLetterBy: user.name,
        documents: [{ name: filename, size: '48 KB', date: today(), type: 'DO Letter (draft)' }, ...row.documents],
        events: addEvent(
          row,
          `Draft DO ${memo} sent to the Chairman for signature.`,
          `ডিও খসড়া ${memo} স্বাক্ষরের জন্য চেয়ারম্যানের কাছে পাঠানো হয়েছে।`,
        ),
      }));
      showToast(t(`Draft ${memo} is waiting on the Chairman's desk.`, `খসড়া ${memo} চেয়ারম্যানের দপ্তরে অপেক্ষা করছে।`, lang), 'gold');
    }
    setShowDoLetterModal(null);
  };

  const printDoLetter = (lic: LicenseCard) => {
    const memo = lic.doLetterMemo || nextDoMemo(lic.tag);
    const ok = printHtml(letterHtml(lic, lang, memo, lic.doLetterStatus === 'dispatched' || caps.canDispatch));
    if (!ok) {
      showToast(t('Allow pop-ups to print the letter.', 'প্রিন্ট করতে পপ-আপ অনুমোদন করুন।', lang), 'warn');
      return;
    }
    patchLicense(lic.id, (row) => ({
      ...row,
      doLetterMemo: row.doLetterMemo || memo,
      events: addEvent(row, 'DO letter sent to printer.', 'ডিও লেটার প্রিন্টারে পাঠানো হয়েছে।'),
    }));
    showToast(t('Print dialog opened for the DO letter.', 'ডিও লেটারের প্রিন্ট ডায়ালগ খোলা হয়েছে।', lang), 'info');
  };

  const downloadVaultDoc = (lic: LicenseCard, docName: string, docType: string) => {
    const memo = lic.doLetterMemo || `REF ${lic.refNo}`;
    const html = docType.toLowerCase().includes('do')
      ? letterHtml(lic, lang, memo, lic.doLetterStatus === 'dispatched')
      : `<!doctype html><html><head><meta charset="utf-8"><title>${docName}</title></head>
<body style="font-family:sans-serif;padding:32px">
<h2>${docName}</h2>
<p>${docType} · ${lic.title} · ${lic.refNo}</p>
<p>Official copy downloaded from BOGCL OneOps on ${today()} by ${user?.name ?? ''}.</p>
</body></html>`;
    const file = docName.endsWith('.pdf') ? docName.replace(/\.pdf$/i, '.html') : docName;
    downloadFile(file, html);
    showToast(t(`Saved ${file} to your downloads.`, `${file} ডাউনলোড ফোল্ডারে সংরক্ষিত।`, lang), 'success');
  };

  const toggleChecklistItem = (itemIndex: number) => {
    if (!selectedLicense || !canToggleChecklist(selectedLicense, caps, user)) return;
    patchLicense(selectedLicense.id, (lic) => ({
      ...lic,
      auditChecklist: lic.auditChecklist.map((c, i) => (i === itemIndex ? { ...c, passed: !c.passed } : c)),
    }));
    showToast(t('Checklist updated.', 'চেকলিস্ট হালনাগাদ হয়েছে।', lang), 'info');
  };

  const approveFee = (lic: LicenseCard) => {
    if (!canApproveThisFee(lic, caps)) return;
    patchLicense(lic.id, { fundStatus: 'approved' });
    showToast(
      t(`Fee ${lic.feeAmountTk} approved. The plant team can now file.`, `${lic.feeAmountTk} অনুমোদিত। প্ল্যান্ট দল এখন আবেদন দাখিল করতে পারবে।`, lang),
      'success',
    );
  };

  const confirmRevert = () => {
    if (!revertId || revertReason.trim().length < 8) {
      showToast(t('Write a short reason (8+ characters) to send it back.', 'ফেরত পাঠাতে কমপক্ষে ৮ অক্ষরের কারণ লিখুন।', lang), 'warn');
      return;
    }
    const lic = licenses.find((l) => l.id === revertId);
    if (!lic || !canRevert(lic, caps)) return;
    patchLicense(revertId, (row) => ({
      ...row,
      stage: Math.max(1, row.stage - 1),
      events: addEvent(row, `Sent back: ${revertReason.trim()}`, `ফেরত: ${revertReason.trim()}`),
    }));
    showToast(t('Filing returned to the previous stage.', 'আবেদন আগের ধাপে ফেরত গেছে।', lang), 'info');
    setRevertId(null);
    setRevertReason('');
  };

  const urgencyBands = useMemo(() => ([
    { id: 'all', label: t('Any urgency', 'সব', lang), count: licenses.length },
    { id: 'critical', label: t('≤ 30 days', '≤ ৩০ দিন', lang), count: licenses.filter((l) => l.daysLeft <= 30).length },
    { id: 'warning', label: t('31–90 days', '৩১–৯০ দিন', lang), count: licenses.filter((l) => l.daysLeft > 30 && l.daysLeft <= 90).length },
    { id: 'active', label: t('> 90 days', '> ৯০ দিন', lang), count: licenses.filter((l) => l.daysLeft > 90).length },
  ]), [licenses, lang]);

  const filteredLicenses = useMemo(() => {
    return licenses.filter((lic) => {
      const agency = AGENCY_FILTERS.find((f) => f.id === selectedAgencyFilter);
      if (agency && agency.id !== 'all' && 'tags' in agency && agency.tags && !agency.tags.includes(lic.tag)) return false;
      if (selectedUrgencyFilter === 'critical' && lic.daysLeft > 30) return false;
      if (selectedUrgencyFilter === 'warning' && (lic.daysLeft <= 30 || lic.daysLeft > 90)) return false;
      if (selectedUrgencyFilter === 'active' && lic.daysLeft <= 90) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = [lic.title, lic.titleBn, lic.refNo, lic.agency, lic.agencyBn, lic.focalPerson].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [licenses, selectedAgencyFilter, selectedUrgencyFilter, searchQuery]);

  const criticalLicenses = licenses.filter((l) => l.daysLeft <= 30 && l.stage < 5);
  const closestExpiry = licenses.length ? Math.min(...licenses.map((l) => l.daysLeft)) : 0;
  const mostCriticalLicense = licenses.length
    ? licenses.reduce((prev, curr) => (curr.daysLeft < prev.daysLeft ? curr : prev), licenses[0])
    : undefined;
  const renewalsInProgress = licenses.filter((l) => l.stage < 5).length;
  const checklistTotal = licenses.reduce((n, l) => n + l.auditChecklist.length, 0);
  const checklistPassed = licenses.reduce((n, l) => n + l.auditChecklist.filter((c) => c.passed).length, 0);
  const readinessPct = checklistTotal ? Math.round((checklistPassed / checklistTotal) * 100) : 100;
  const agencyCount = new Set(licenses.map((l) => l.agency)).size;
  const workItems = myWork(filteredLicenses, caps, user, lang);

  const kanbanRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateKanbanScroll = useCallback(() => {
    const el = kanbanRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = kanbanRef.current;
    if (!el) return;
    updateKanbanScroll();
    const onScroll = () => updateKanbanScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(() => updateKanbanScroll());
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [updateKanbanScroll, filteredLicenses, focusedStage]);

  const scrollKanbanByColumn = (dir: -1 | 1) => {
    const el = kanbanRef.current;
    if (!el) return;
    const col = el.querySelector('.kanban-col') as HTMLElement | null;
    const amount = (col?.offsetWidth ?? 240) + 14;
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  const scrollStageIntoView = (stageId: number) => {
    const col = kanbanRef.current?.querySelector(`[data-stage="${stageId}"]`) as HTMLElement | null;
    col?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  const pageDesc = caps.canRenew
    ? t('You run the plant filings: checklist, inspection and certificate.', 'আপনি প্ল্যান্টের আবেদন চালান: চেকলিস্ট, পরিদর্শন ও সনদ।', lang)
    : caps.canDispatch
      ? t('You sign DO letters when a permit is close to expiry. The plant team moves the stages.', 'মেয়াদ ঘনিয়ে এলে আপনি ডিও লেটারে স্বাক্ষর করেন। ধাপ সরানো প্ল্যান্ট দলের কাজ।', lang)
      : caps.canApproveFund
        ? t('You approve renewal fees so the plant can file with the agency.', 'প্ল্যান্ট আবেদন দাখিল করতে পারার জন্য আপনি নবায়ন ফি অনুমোদন করেন।', lang)
        : t('Status of statutory permits for the Keraniganj plant. Nothing to approve here.', 'কেরানীগঞ্জ প্ল্যান্টের বিধিবদ্ধ লাইসেন্সের অবস্থা। এখানে আপনার অনুমোদনের কিছু নেই।', lang);

  return (
    <div className="view-container" style={{ paddingBottom: '40px' }}>
      <PageHeader
        title={t('Permits & Licenses', 'লাইসেন্স ও অনুমোদনপত্র', lang)}
        description={pageDesc}
        actions={
          <div style={{ padding: '8px 14px', background: readinessPct >= 85 ? 'var(--status-success-bg)' : 'var(--status-warning-bg)', border: `1px solid ${readinessPct >= 85 ? 'var(--status-success-border)' : 'var(--status-warning-border)'}`, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} color={readinessPct >= 85 ? 'var(--status-success)' : 'var(--status-warning)'} />
            <div style={{ fontSize: '11.5px', color: readinessPct >= 85 ? 'var(--status-success-text)' : 'var(--status-warning-text)' }}>
              <div style={{ fontWeight: 800, fontSize: '13px' }}>{t(`Audit readiness: ${readinessPct}%`, `অডিট প্রস্তুতি: ${readinessPct}%`, lang)}</div>
              <div>{t(`${checklistPassed} of ${checklistTotal} checklist items verified`, `${checklistTotal}টির মধ্যে ${checklistPassed}টি যাচাইকৃত`, lang)}</div>
            </div>
          </div>
        }
      />

      <div className="pipe-work">
        <div className="pipe-work-hd">
          <div>
            <h3 className="pipe-work-title">{t('What you need to do', 'আপনার করণীয়', lang)}</h3>
            <p className="pipe-work-sub">
              {workItems.length
                ? t(`${workItems.length} item(s) waiting on you.`, `${workItems.length}টি কাজ আপনার জন্য অপেক্ষা করছে।`, lang)
                : t('Nothing for you to do on this board.', 'এই বোর্ডে আপনার করার কিছু নেই।', lang)}
            </p>
          </div>
        </div>
        {workItems.length === 0 ? (
          <EmptyState
            compact
            icon={<Check size={18} />}
            title={t('No filings waiting on you', 'আপনার কাছে কোনো আবেদন অপেক্ষা করছে না', lang)}
            description={
              mostCriticalLicense && mostCriticalLicense.daysLeft <= 30
                ? t(
                    `${mostCriticalLicense.title} expires in ${mostCriticalLicense.daysLeft} days. The plant team is handling the filing.`,
                    `${mostCriticalLicense.titleBn}-এর মেয়াদ ${mostCriticalLicense.daysLeft} দিনে শেষ। প্ল্যান্ট দল আবেদন চালাচ্ছে।`,
                    lang,
                  )
                : t('All current permits are on track.', 'বর্তমান সব লাইসেন্স সঠিক পথে আছে।', lang)
            }
          />
        ) : (
          <div className="pipe-work-list">
            {workItems.map((item) => (
              <button
                key={`${item.license.id}-${item.kind}`}
                type="button"
                className="pipe-work-row"
                onClick={() => {
                  if (item.kind === 'do_letter') handleOpenDoLetter(item.license);
                  else setSelectedId(item.license.id);
                }}
              >
                <div>
                  <strong>{t(item.license.title, item.license.titleBn, lang)}</strong>
                  <span>{t(item.label, item.labelBn, lang)}</span>
                </div>
                <StatusPill tone={item.kind === 'do_letter' || item.kind === 'fund' ? 'warn' : 'info'}>
                  {t(item.label, item.labelBn, lang)}
                </StatusPill>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="responsive-col-4 mb-4" style={{ gap: '14px' }}>
        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--status-danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>
              {t('Nearest expiry', 'নিকটতম মেয়াদোত্তীর্ণ', lang)}
            </span>
            <AlertTriangle size={16} color="var(--status-danger)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--status-danger)', marginTop: '4px' }}>
            {closestExpiry} {t('days left', 'দিন বাকি', lang)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
            {t(`${criticalLicenses.length} permit(s) due within 30 days`, `৩০ দিনের মধ্যে ${criticalLicenses.length}টি লাইসেন্স নবায়নযোগ্য`, lang)}
          </div>
        </div>
        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--status-warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>{t('Renewals in progress', 'চলমান নবায়ন', lang)}</span>
            <Clock size={16} color="var(--status-warning)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--status-warning-text)', marginTop: '4px' }}>{renewalsInProgress}</div>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>{t('Not yet renewed & active', 'এখনো সক্রিয় ও নবায়িত নয়', lang)}</div>
        </div>
        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--status-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>{t('Permits tracked', 'তদারকিকৃত লাইসেন্স', lang)}</span>
            <Building size={16} color="var(--status-success)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--brand-slate-900)', marginTop: '4px' }}>
            {licenses.length} <span style={{ fontSize: '12px', fontWeight: 600 }}>{t('permits', 'টি লাইসেন্স', lang)}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>{t(`Across ${agencyCount} issuing agencies`, `${agencyCount}টি ইস্যুকারী সংস্থা`, lang)}</div>
        </div>
        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--status-info)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>{t('Checklist items open', 'অসম্পন্ন চেকলিস্ট', lang)}</span>
            <CheckSquare size={16} color="var(--status-info)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--status-info)', marginTop: '4px' }}>{checklistTotal - checklistPassed}</div>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>{t('Must be verified before filing', 'আবেদনের আগে যাচাই করতে হবে', lang)}</div>
        </div>
      </div>

      {mostCriticalLicense && mostCriticalLicense.daysLeft <= 30 && (
        <div className="pipe-alert critical">
          <div>
            <strong>{t('Nearest permit at risk', 'ঝুঁকিতে নিকটতম লাইসেন্স', lang)}</strong>
            <p>
              {t(
                `${mostCriticalLicense.title} — ${mostCriticalLicense.daysLeft} days left, currently in ${stageOf(mostCriticalLicense.stage).title}. ${nextLine(mostCriticalLicense, caps, user, 'en')}`,
                `${mostCriticalLicense.titleBn} — ${mostCriticalLicense.daysLeft} দিন বাকি, এখন ${stageOf(mostCriticalLicense.stage).titleBn} ধাপে। ${nextLine(mostCriticalLicense, caps, user, 'bn')}`,
                lang,
              )}
            </p>
          </div>
          {canDoLetter(mostCriticalLicense, caps) && (
            <Button variant="gold" size="sm" icon={<FileText size={14} />} onClick={() => handleOpenDoLetter(mostCriticalLicense)}>
              {mostCriticalLicense.doLetterStatus === 'dispatched'
                ? t('View DO letter', 'ডিও লেটার দেখুন', lang)
                : caps.canDispatch
                  ? t('Sign DO letter', 'ডিও লেটারে স্বাক্ষর', lang)
                  : t('Draft DO letter', 'ডিও লেটার খসড়া', lang)}
            </Button>
          )}
        </div>
      )}

      <div className="card mb-4">
        <div className="workforce-toolbar roster-toolbar">
          <div className="workforce-tabs" role="group" aria-label={t('Urgency', 'জরুরি অবস্থা', lang)}>
            {urgencyBands.map((u) => (
              <button
                key={u.id}
                type="button"
                className={`workforce-tab${selectedUrgencyFilter === u.id ? ' active' : ''}`}
                aria-pressed={selectedUrgencyFilter === u.id}
                onClick={() => setSelectedUrgencyFilter(u.id)}
              >
                {u.label} <b>{u.count}</b>
              </button>
            ))}
          </div>
          <div className="workforce-filter-row">
            <div className="workforce-search-wrap">
              <Search size={14} className="workforce-search-icon" aria-hidden />
              <input
                type="search"
                className="workforce-search-input"
                placeholder={t('Search license, ref, focal…', 'লাইসেন্স, রেফারেন্স বা কর্মকর্তা…', lang)}
                aria-label={t('Search permits', 'লাইসেন্স খুঁজুন', lang)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="workforce-search-clear" onClick={() => setSearchQuery('')} aria-label={t('Clear search', 'অনুসন্ধান মুছুন', lang)}>
                  <X size={13} />
                </button>
              )}
            </div>
            <select
              className="workforce-select"
              value={selectedAgencyFilter}
              onChange={(e) => setSelectedAgencyFilter(e.target.value)}
              aria-label={t('Agency', 'সংস্থা', lang)}
            >
              {AGENCY_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>{t(f.label, f.labelBn, lang)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card mb-5">
        <div className="card-hd">
          <div className="card-hd-left">
            <div className="card-hd-icon"><Building size={18} /></div>
            <div>
              <div className="card-title">{t('Renewal pipeline', 'নবায়ন পাইপলাইন', lang)}</div>
              <div className="card-subtitle">{t('Each permit moves through the same five stages. Click a stage to focus it.', 'প্রতিটি লাইসেন্স একই পাঁচ ধাপ পার হয়। ধাপে ক্লিক করে ফোকাস করুন।', lang)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="pipe-nav"
              disabled={!canScrollLeft}
              aria-label={t('Previous stages', 'আগের ধাপ', lang)}
              onClick={() => scrollKanbanByColumn(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="pipe-nav"
              disabled={!canScrollRight}
              aria-label={t('Next stages', 'পরের ধাপ', lang)}
              onClick={() => scrollKanbanByColumn(1)}
            >
              <ChevronRight size={18} />
            </button>
            <StatusPill tone="info">{filteredLicenses.length} {t('filings', 'টি আবেদন', lang)}</StatusPill>
          </div>
        </div>
        <div className="card-body">
          <div className="pipe-stepper" role="tablist" aria-label={t('Renewal stages', 'নবায়ন ধাপ', lang)}>
            {STAGES.map((stage) => {
              const count = filteredLicenses.filter((l) => l.stage === stage.id).length;
              const isFocus = focusedStage === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  role="tab"
                  aria-selected={isFocus}
                  className={`pipe-step${isFocus ? ' is-focus' : ''}${count === 0 ? ' is-empty' : ''}`}
                  style={{ color: stage.color }}
                  onClick={() => {
                    setFocusedStage(isFocus ? 'all' : stage.id);
                    scrollStageIntoView(stage.id);
                  }}
                >
                  <div className="pipe-step-idx">
                    <span>{t(`Stage ${stage.id}`, `ধাপ ${stage.id}`, lang)}</span>
                    <span className="kanban-count" style={{ background: stage.badgeColor, color: stage.textColor, borderColor: 'transparent' }}>{count}</span>
                  </div>
                  <div className="pipe-step-title">{t(stage.title, stage.titleBn, lang)}</div>
                  <div className="pipe-step-purpose">{t(stage.purpose, stage.purposeBn, lang)}</div>
                  <div className="pipe-step-bar" />
                </button>
              );
            })}
          </div>

          <div className="pipe-board">
            <button
              type="button"
              className="pipe-nav pipe-nav-side pipe-nav-left"
              disabled={!canScrollLeft}
              aria-label={t('Previous stages', 'আগের ধাপ', lang)}
              onClick={() => scrollKanbanByColumn(-1)}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="pipe-nav pipe-nav-side pipe-nav-right"
              disabled={!canScrollRight}
              aria-label={t('Next stages', 'পরের ধাপ', lang)}
              onClick={() => scrollKanbanByColumn(1)}
            >
              <ChevronRight size={20} />
            </button>
            <div ref={kanbanRef} className="kanban" style={{ scrollSnapType: 'x mandatory' }}>
            {STAGES.map((stage) => {
              const stageLicenses = filteredLicenses.filter((l) => l.stage === stage.id);
              return (
                <div
                  key={stage.id}
                  data-stage={stage.id}
                  className={`kanban-col${stageLicenses.length === 0 ? ' is-empty' : ''}${focusedStage === stage.id ? ' is-focus' : ''}`}
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className={`kanban-col-hd stage-${stage.id}`} style={{ borderBottom: `2px solid ${stage.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: stage.color }} />
                      <h4 style={{ margin: 0, fontSize: '12px' }}>{t(stage.title, stage.titleBn, lang)}</h4>
                    </div>
                    <span className="kanban-count" style={{ background: stage.badgeColor, color: stage.textColor, borderColor: 'transparent' }}>{stageLicenses.length}</span>
                  </div>
                  <div className="kanban-cards">
                    {stageLicenses.map((lic) => {
                      const isUrgent = lic.daysLeft <= 30;
                      const isWarn = lic.daysLeft > 30 && lic.daysLeft <= 90;
                      const line = nextLine(lic, caps, user, lang);
                      const yours = workItems.some((w) => w.license.id === lic.id);
                      const gate = canAdvance(lic, caps);
                      return (
                        <div
                          key={lic.id}
                          className="k-card"
                          onClick={() => setSelectedId(lic.id)}
                          style={{
                            borderLeft: isUrgent ? '4px solid var(--status-danger)' : isWarn ? '4px solid var(--status-warning)' : '4px solid var(--status-success)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span className={`k-tag ${lic.tag}`}>{lic.tagLabel}</span>
                            <span className={`k-countdown ${isUrgent ? 'urgent' : isWarn ? 'warning' : 'ok'}`}>
                              {lic.daysLeft <= 0 ? t('Expired', 'মেয়াদোত্তীর্ণ', lang) : t(`${lic.daysLeft}d left`, `${lic.daysLeft} দিন বাকি`, lang)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <img
                              className="permit-feed-photo"
                              src={lic.scan || licenseScanFor(lic.tag)}
                              alt={t(lic.title, lic.titleBn, lang)}
                            />
                            <div className="k-title" style={{ flex: 1, minWidth: 0 }}>{t(lic.title, lic.titleBn, lang)}</div>
                          </div>
                          <div className="k-meta">
                            <div style={{ color: 'var(--brand-slate-800)', fontWeight: 600 }}>{t(lic.agency, lic.agencyBn, lang)}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>{lic.refNo}</div>
                            <div style={{ marginTop: '5px', color: 'var(--brand-slate-600)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={12} color="var(--brand-slate-400)" />
                              <span>{lic.focalPerson}</span>
                            </div>
                            {lic.fundStatus === 'pending' && (
                              <div style={{ marginTop: '4px' }}>
                                <StatusPill tone="warn">{t(`Fee ${lic.feeAmountTk} waiting`, `ফি ${lic.feeAmountTk} অপেক্ষমাণ`, lang)}</StatusPill>
                              </div>
                            )}
                            {lic.doLetterStatus === 'awaiting_signature' && (
                              <div style={{ marginTop: '4px' }}>
                                <StatusPill tone="gold">{t('DO waiting for Chairman', 'ডিও চেয়ারম্যানের অপেক্ষা', lang)}</StatusPill>
                              </div>
                            )}
                            {lic.doLetterStatus === 'dispatched' && (
                              <div style={{ marginTop: '4px' }}>
                                <StatusPill tone="success">{t(`DO sent · ${lic.doLetterMemo ?? ''}`, `ডিও পাঠানো · ${lic.doLetterMemo ?? ''}`, lang)}</StatusPill>
                              </div>
                            )}
                          </div>
                          <div className={`k-next${yours ? ' is-yours' : ''}`}>
                            <CircleDot size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            {line}
                          </div>
                          {(yours || gate.ok || canDoLetter(lic, caps) || canApproveThisFee(lic, caps) || canRevert(lic, caps)) && (
                            <div className="k-footer" style={{ paddingTop: '8px', flexWrap: 'wrap', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                              {canApproveThisFee(lic, caps) && (
                                <Button size="sm" variant="primary" onClick={() => approveFee(lic)}>{t('Approve fee', 'ফি অনুমোদন', lang)}</Button>
                              )}
                              {gate.ok && (
                                <Button size="sm" variant="ghost" icon={<ArrowRight size={12} />} onClick={() => tryAdvance(lic)}>
                                  {t(stage.verb, stage.verbBn, lang)}
                                </Button>
                              )}
                              {canRevert(lic, caps) && (
                                <Button size="sm" variant="ghost" icon={<ArrowLeft size={12} />} onClick={() => { setRevertId(lic.id); setRevertReason(''); }}>
                                  {t('Send back', 'ফেরত পাঠান', lang)}
                                </Button>
                              )}
                              {canDoLetter(lic, caps) && lic.stage >= 4 && (
                                <Button size="sm" variant={lic.doLetterStatus === 'dispatched' ? 'ghost' : 'outline-danger'} icon={<FileText size={12} />} onClick={() => handleOpenDoLetter(lic)}>
                                  {lic.doLetterStatus === 'dispatched'
                                    ? t('View DO', 'ডিও দেখুন', lang)
                                    : caps.canDispatch
                                      ? t('Sign DO', 'ডিও স্বাক্ষর', lang)
                                      : t('Draft DO', 'ডিও খসড়া', lang)}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {stageLicenses.length === 0 && (
                      <EmptyState
                        compact
                        title={t('No filings here', 'এই ধাপে কোনো আবেদন নেই', lang)}
                        description={t(stage.purpose, stage.purposeBn, lang)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>

      {caps.canRenew && (
        <div className="card mb-4">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><AlertTriangle size={16} /></div>
              <div>
                <div className="card-title">{t('Storage tank inspection log (API 653)', 'স্টোরেজ ট্যাংক পরিদর্শন লগ (এপিআই ৬৫৩)', lang)}</div>
                <div className="card-subtitle">{t('Wall thickness and relief-valve tests for the tank farm that sits under the Explosives storage permit.', 'বিস্ফোরক স্টোরেজ লাইসেন্সের আওতায় ট্যাংক ফার্মের ওয়াল পুরুত্ব ও রিলিফ ভালভ পরীক্ষা।', lang)}</div>
              </div>
            </div>
            <StatusPill tone="warn">{t('1 retest due', '১টি পুনঃপরীক্ষা বাকি', lang)}</StatusPill>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>{t('Tank', 'ট্যাংক', lang)}</th>
                    <th>{t('Product / capacity', 'পণ্য / ধারণক্ষমতা', lang)}</th>
                    <th>{t('Wall thickness', 'ওয়াল পুরুত্ব', lang)}</th>
                    <th>{t('Relief valve test', 'রিলিফ ভালভ পরীক্ষা', lang)}</th>
                    <th>{t('Status', 'অবস্থা', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>TK-101</strong></td>
                    <td>Bitumen 60/70 (5,000 MT)</td>
                    <td>12.4 mm ({t('nominal', 'নির্ধারিত', lang)} 12.5)</td>
                    <td><StatusPill tone="success">{t('Passed 10 Sep', 'উত্তীর্ণ ১০ সেপ্ট', lang)}</StatusPill></td>
                    <td><StatusPill tone="success">{t('In service', 'চালু', lang)}</StatusPill></td>
                  </tr>
                  <tr>
                    <td><strong>TK-102</strong></td>
                    <td>Bitumen 80/100 (5,000 MT)</td>
                    <td>12.1 mm ({t('nominal', 'নির্ধারিত', lang)} 12.5)</td>
                    <td><StatusPill tone="success">{t('Passed 10 Sep', 'উত্তীর্ণ ১০ সেপ্ট', lang)}</StatusPill></td>
                    <td><StatusPill tone="success">{t('In service', 'চালু', lang)}</StatusPill></td>
                  </tr>
                  <tr style={{ background: 'var(--status-warning-bg)' }}>
                    <td><strong>TK-201</strong></td>
                    <td>Emulsion SS-1 (2,000 MT)</td>
                    <td>11.2 mm ({t('threshold', 'সীমা', lang)} 10.8)</td>
                    <td><StatusPill tone="warn">{t('Retest overdue (20 Oct)', 'পুনঃপরীক্ষা বাকি (২০ অক্টো)', lang)}</StatusPill></td>
                    <td><StatusPill tone="warn">{t('Monitoring', 'পর্যবেক্ষণে', lang)}</StatusPill></td>
                  </tr>
                  <tr>
                    <td><strong>TK-202</strong></td>
                    <td>Cutback RC-70 (2,000 MT)</td>
                    <td>12.3 mm ({t('nominal', 'নির্ধারিত', lang)} 12.5)</td>
                    <td><StatusPill tone="success">{t('Passed 04 Oct', 'উত্তীর্ণ ০৪ অক্টো', lang)}</StatusPill></td>
                    <td><StatusPill tone="success">{t('In service', 'চালু', lang)}</StatusPill></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedLicense && (
        <div className="modal-bg" onClick={() => setSelectedId(null)}>
          <div className="modal" style={{ maxWidth: '780px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'linear-gradient(135deg, var(--surface-inverse-2) 0%, var(--surface-inverse) 100%)', color: 'var(--text-on-brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '6px' }}>
                  <Building size={20} color="var(--status-warning-bright)" />
                </div>
                <div>
                  <h3 style={{ color: 'var(--text-on-brand)', margin: 0, fontSize: '16px', fontWeight: 800 }}>
                    {t(selectedLicense.title, selectedLicense.titleBn, lang)}
                  </h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {t(selectedLicense.agency, selectedLicense.agencyBn, lang)} • {selectedLicense.refNo}
                  </div>
                </div>
              </div>
              <button type="button" className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setSelectedId(null)}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '76vh', overflowY: 'auto', padding: '20px' }}>
              <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'var(--surface-0)', border: '1px solid var(--border-1)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>{t('What happens next', 'এরপর কী হবে', lang)}</div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--brand-slate-900)', marginTop: '4px' }}>
                  {nextLine(selectedLicense, caps, user, lang)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>
                  {t(`From ${selectedLicense.focalPerson} · ${selectedLicense.focalDesignation}`, `${selectedLicense.focalPerson} · ${selectedLicense.focalDesignation}`, lang)}
                </div>
                {selectedLicense.doLetterStatus === 'dispatched' && (
                  <div style={{ marginTop: '8px' }}>
                    <StatusPill tone="success">
                      {t(
                        `DO ${selectedLicense.doLetterMemo} sent ${selectedLicense.doLetterAt ?? ''} via ${selectedLicense.doLetterChannel ? channelLabel(selectedLicense.doLetterChannel, 'en') : ''}`,
                        `ডিও ${selectedLicense.doLetterMemo} পাঠানো হয়েছে`,
                        lang,
                      )}
                    </StatusPill>
                  </div>
                )}
              </div>

              {(selectedLicense.events?.length ?? 0) > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>{t('Activity', 'কার্যক্রম', lang)}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedLicense.events.slice(0, 6).map((ev) => (
                      <div key={ev.id} style={{ fontSize: '12px', padding: '8px 10px', background: 'var(--surface-0)', border: '1px solid var(--border-1)', borderRadius: '6px' }}>
                        <div style={{ fontWeight: 600 }}>{t(ev.text, ev.textBn, lang)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-2)' }}>{ev.actor} · {ev.at}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="responsive-col-4" style={{ gap: '10px', marginBottom: '18px' }}>
                <div style={{ background: 'var(--surface-0)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>{t('Statutory law', 'প্রযোজ্য আইন', lang)}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-900)', marginTop: '2px' }}>{selectedLicense.sroLawRef}</div>
                </div>
                <div style={{ background: 'var(--surface-0)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>{t('Renewal fee', 'নবায়ন ফি', lang)}</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--status-success)', marginTop: '2px' }}>{selectedLicense.feeAmountTk}</div>
                  {selectedLicense.fundStatus === 'pending' && <div style={{ fontSize: '11px', color: 'var(--status-warning-text)' }}>{t('Waiting on Finance', 'অর্থ বিভাগের অপেক্ষা', lang)}</div>}
                </div>
                <div style={{ background: 'var(--surface-0)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>{t('Days to expiry', 'মেয়াদ শেষ হতে', lang)}</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: selectedLicense.daysLeft <= 30 ? 'var(--status-danger)' : 'var(--status-warning)', marginTop: '2px' }}>
                    {selectedLicense.daysLeft} {t('days', 'দিন', lang)}
                  </div>
                </div>
                <div style={{ background: 'var(--surface-0)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>{t('Validity', 'মেয়াদ', lang)}</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '2px' }}>{selectedLicense.certificateValidity}</div>
                </div>
              </div>

              <div style={{ background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-bright)', borderRadius: '8px', padding: '12px 14px', marginBottom: '18px', display: 'flex', gap: '10px' }}>
                <ShieldAlert size={18} color="var(--status-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--status-danger-text)' }}>
                  <strong>{t('If this lapses', 'মেয়াদোত্তীর্ণ হলে', lang)}</strong>
                  <div style={{ marginTop: '2px' }}>{t(selectedLicense.statutoryPenalty, selectedLicense.statutoryPenaltyBn, lang)}</div>
                </div>
              </div>

              <div style={{ background: 'var(--surface-2)', padding: '12px 14px', borderRadius: '8px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontWeight: 700, textTransform: 'uppercase' }}>{t('Agency inspector', 'সংস্থার পরিদর্শক', lang)}</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '2px' }}>{selectedLicense.inspectorName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)' }}>{selectedLicense.inspectorDesignation}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontWeight: 700, textTransform: 'uppercase' }}>{t('Plant focal', 'প্ল্যান্ট দায়িত্বপ্রাপ্ত', lang)}</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '2px' }}>{selectedLicense.focalPerson}</div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)' }}>{selectedLicense.focalDesignation}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontWeight: 700, textTransform: 'uppercase' }}>{t('Last site inspection', 'সর্বশেষ পরিদর্শন', lang)}</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--status-info)', marginTop: '2px' }}>{selectedLicense.lastInspection}</div>
                </div>
              </div>

              <div style={{ marginBottom: '18px', background: 'var(--surface-0)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800 }}>{t('Where this filing is', 'আবেদন এখন যে ধাপে', lang)}</div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: stageOf(selectedLicense.stage).color }}>
                    {t(stageOf(selectedLicense.stage).title, stageOf(selectedLicense.stage).titleBn, lang)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {STAGES.map((s) => {
                    const isCurrent = s.id === selectedLicense.stage;
                    const isPassed = s.id < selectedLicense.stage;
                    return (
                      <div
                        key={s.id}
                        style={{
                          flex: '1 1 120px', padding: '8px 6px', textAlign: 'center', fontSize: '11px', borderRadius: '6px',
                          background: isCurrent ? s.color : isPassed ? 'var(--status-success)' : 'var(--text-inverse)',
                          color: isCurrent || isPassed ? 'var(--text-on-brand)' : 'var(--text-3)',
                          fontWeight: isCurrent ? 800 : 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        }}
                      >
                        {isPassed && <Check size={12} />}
                        <span>{t(s.title, s.titleBn, lang)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckSquare size={16} color="var(--brand-crimson)" />
                    {t('Plant audit checklist', 'প্ল্যান্ট অডিট চেকলিস্ট', lang)}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                    {selectedLicense.auditChecklist.filter((c) => c.passed).length} / {selectedLicense.auditChecklist.length} {t('verified', 'যাচাইকৃত', lang)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedLicense.auditChecklist.map((c, idx) => {
                    const canTick = canToggleChecklist(selectedLicense, caps, user);
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                          background: c.passed ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
                          border: c.passed ? '1px solid var(--status-success-border)' : '1px solid var(--status-warning-bright)',
                          borderRadius: '6px', cursor: canTick ? 'pointer' : 'default',
                        }}
                        onClick={() => canTick && toggleChecklistItem(idx)}
                      >
                        <input type="checkbox" checked={c.passed} disabled={!canTick} onChange={() => {}} style={{ width: '16px', height: '16px' }} />
                        <span style={{ fontSize: '12.5px', flex: 1, color: c.passed ? 'var(--status-success-text)' : 'var(--status-warning-text)' }}>
                          {t(c.item, c.itemBn ?? c.item, lang)}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: c.passed ? 'var(--status-success)' : 'var(--status-warning)' }}>
                          {c.passed ? t('Verified', 'যাচাইকৃত', lang) : t('Still open', 'বাকি', lang)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {!canToggleChecklist(selectedLicense, caps, user) && !checklistComplete(selectedLicense) && (
                  <p style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '8px' }}>
                    {t(`Waiting for ${selectedLicense.focalPerson} to tick the open items.`, `খোলা আইটেম ${selectedLicense.focalPerson} যাচাই করবেন।`, lang)}
                  </p>
                )}
              </div>

              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileBadge size={16} color="var(--brand-gold-dark)" />
                  {t('Certificates and evidence', 'সনদ ও প্রমাণ', lang)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <img
                    className="permit-scan"
                    src={selectedLicense.scan || licenseScanFor(selectedLicense.tag)}
                    alt={t(selectedLicense.title, selectedLicense.titleBn, lang)}
                  />
                  {selectedLicense.documents.map((doc, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface-0)', border: '1px solid var(--border-1)', borderRadius: '6px' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 700 }}>{doc.name}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>{doc.type} • {doc.size} • {doc.date}</div>
                      </div>
                      <Button size="sm" variant="ghost" icon={<Download size={13} />} onClick={() => downloadVaultDoc(selectedLicense, doc.name, doc.type)}>
                        {t('Download', 'ডাউনলোড', lang)}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-ft" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {canApproveThisFee(selectedLicense, caps) && (
                  <Button variant="primary" icon={<Check size={14} />} onClick={() => approveFee(selectedLicense)}>
                    {t(`Approve ${selectedLicense.feeAmountTk}`, `${selectedLicense.feeAmountTk} অনুমোদন`, lang)}
                  </Button>
                )}
                {canDoLetter(selectedLicense, caps) && (
                  <Button
                    variant="gold"
                    icon={<FileText size={14} />}
                    onClick={() => { setSelectedId(null); handleOpenDoLetter(selectedLicense); }}
                  >
                    {caps.canDispatch ? t('Sign DO letter', 'ডিও লেটারে স্বাক্ষর', lang) : t('Draft DO letter', 'ডিও লেটার খসড়া', lang)}
                  </Button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {canRevert(selectedLicense, caps) && (
                  <Button variant="ghost" icon={<ArrowLeft size={14} />} onClick={() => { setRevertId(selectedLicense.id); setRevertReason(''); }}>
                    {t('Send back', 'ফেরত পাঠান', lang)}
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setSelectedId(null)}>{t('Close', 'বন্ধ করুন', lang)}</Button>
                {caps.canRenew && selectedLicense.stage < 5 && canAdvance(selectedLicense, caps).ok && (
                  <Button
                    variant="primary"
                    icon={<ArrowRight size={14} />}
                    onClick={() => tryAdvance(selectedLicense)}
                  >
                    {t(stageOf(selectedLicense.stage).verb, stageOf(selectedLicense.stage).verbBn, lang)}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {revertId && (
        <div className="modal-bg" onClick={() => setRevertId(null)}>
          <div className="modal" style={{ maxWidth: '480px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd">
              <h3>{t('Send this filing back one stage', 'এই আবেদন এক ধাপ পেছনে পাঠান', lang)}</h3>
              <button type="button" className="modal-close" onClick={() => setRevertId(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: 0 }}>
                {t('A reason is required so the next person knows what to fix.', 'পরবর্তী ব্যক্তি কী সংশোধন করবেন তা জানতে কারণ লাগবে।', lang)}
              </p>
              <textarea
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '10px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-1)', background: 'var(--surface-0)' }}
                placeholder={t('e.g. Inspection report is missing page 3', 'যেমন: পরিদর্শন প্রতিবেদনের ৩ নং পাতা নেই', lang)}
              />
            </div>
            <div className="modal-ft" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="ghost" onClick={() => setRevertId(null)}>{t('Cancel', 'বাতিল', lang)}</Button>
              <Button variant="danger" onClick={confirmRevert}>{t('Send back', 'ফেরত পাঠান', lang)}</Button>
            </div>
          </div>
        </div>
      )}

      {showDoLetterModal && (() => {
        const doLive = licenses.find((l) => l.id === showDoLetterModal.id) ?? showDoLetterModal;
        const sent = doLive.doLetterStatus === 'dispatched';
        const memo = doLive.doLetterMemo || `BOGCL/CMD-DO/${doLive.tag.toUpperCase()}/2026/…`;
        return (
        <div className="modal-bg" onClick={() => setShowDoLetterModal(null)}>
          <div className="modal" style={{ maxWidth: '720px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'var(--brand-crimson-dark)', color: 'var(--text-on-brand)' }}>
              <div>
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0, fontSize: '15px', fontWeight: 800 }}>
                  {sent
                    ? t('DO letter on file', 'দাখিলকৃত ডিও লেটার', lang)
                    : caps.canDispatch
                      ? t('Sign the DO letter', 'ডিও লেটারে স্বাক্ষর করুন', lang)
                      : t('Draft DO letter for the Chairman', 'চেয়ারম্যানের জন্য ডিও লেটার খসড়া', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--status-danger-bright)', marginTop: '2px' }}>
                  {t(doLive.title, doLive.titleBn, lang)}
                </div>
              </div>
              <button type="button" className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setShowDoLetterModal(null)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '74vh', overflowY: 'auto', padding: '20px' }}>
              {sent && (
                <div style={{ marginBottom: '12px', padding: '10px 12px', background: 'var(--status-success-bg)', border: '1px solid var(--status-success-border)', borderRadius: '6px', fontSize: '12.5px', color: 'var(--status-success-text)' }}>
                  {t(
                    `Signed by ${doLive.doLetterBy} on ${doLive.doLetterAt}. Sent via ${doLive.doLetterChannel ? channelLabel(doLive.doLetterChannel, 'en') : ''}${doLive.doLetterParcelRef ? ` · parcel ${doLive.doLetterParcelRef}` : ''}.`,
                    `${doLive.doLetterBy} স্বাক্ষর করেছেন ${doLive.doLetterAt}।`,
                    lang,
                  )}
                </div>
              )}
              <div style={{ marginBottom: '14px', background: 'var(--surface-0)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-600)', marginBottom: '6px' }}>
                  {t('Dispatch channel', 'প্রেরণ মাধ্যম', lang)}
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'enothi' as const, label: 'Government e-Nothi', labelBn: 'সরকারি ই-নথি' },
                    { id: 'courier' as const, label: 'Sealed courier', labelBn: 'সিলগালা কুরিয়ার' },
                    { id: 'liaison' as const, label: 'Hand delivery', labelBn: 'সরাসরি প্রদান' },
                  ].map((c) => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', cursor: sent ? 'default' : 'pointer' }}>
                      <input type="radio" name="deliveryMode" disabled={sent} checked={doLetterDeliveryMode === c.id} onChange={() => setDoLetterDeliveryMode(c.id)} />
                      <span>{t(c.label, c.labelBn, lang)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ border: '2px solid var(--border-1)', padding: '24px', borderRadius: '6px', background: 'var(--surface-1)', fontSize: '12.5px', lineHeight: 1.6 }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid var(--brand-crimson-dark)', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--brand-crimson-dark)' }}>BASHUNDHARA GROUP</div>
                  <div style={{ fontSize: '11px', fontWeight: 700 }}>{t("Office of the Chairman & Managing Director", 'চেয়ারম্যান ও ব্যবস্থাপনা পরিচালকের দপ্তর', lang)}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '11.5px' }}>
                  <div>
                    <strong>DO Memo:</strong> {memo}<br />
                    <strong>License:</strong> {doLive.refNo}
                  </div>
                  <div style={{ textAlign: 'right' }}><strong>{t('Date', 'তারিখ', lang)}:</strong> {today()}</div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <strong>{t('To', 'প্রাপক', lang)}:</strong><br />
                  <strong>{doLive.ministryRecipient}</strong><br />
                  {doLive.ministryAddress}
                </div>
                <div style={{ fontWeight: 800, marginBottom: '12px', padding: '8px 10px', background: 'var(--surface-0)', borderLeft: '4px solid var(--brand-crimson-dark)' }}>
                  {t(
                    `Request to expedite renewal of ${doLive.title} — Keraniganj plant.`,
                    `${doLive.titleBn} নবায়ন দ্রুত ইস্যুর অনুরোধ — কেরানীগঞ্জ প্ল্যান্ট।`,
                    lang,
                  )}
                </div>
                <div style={{ color: 'var(--text-2)', textAlign: 'justify' }}>
                  {t(
                    `Plant checks for ${doLive.refNo} are complete under ${doLive.sroLawRef}. A delay risks ${doLive.dailyShutdownRiskTk} in lost production. Kindly issue the renewal certificate.`,
                    `${doLive.refNo} এর প্ল্যান্ট যাচাই ${doLive.sroLawRef} অনুযায়ী সম্পন্ন। বিলম্বে দৈনিক ${doLive.dailyShutdownRiskTk} উৎপাদন ক্ষতি হতে পারে। নবায়ন সনদ ইস্যু করার অনুরোধ।`,
                    lang,
                  )}
                </div>
                <div style={{ marginTop: '24px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 800 }}>Abdul Mannan Chowdhury</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t('Chairman & Managing Director', 'চেয়ারম্যান ও ব্যবস্থাপনা পরিচালক', lang)}</div>
                  {sent
                    ? <div style={{ fontSize: '11px', color: 'var(--status-danger)', fontWeight: 800, marginTop: '4px' }}>{t('SIGNED', 'স্বাক্ষরিত', lang)}</div>
                    : <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>{t('DRAFT', 'খসড়া', lang)}</div>}
                </div>
              </div>
            </div>
            <div className="modal-ft" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="ghost" onClick={() => setShowDoLetterModal(null)}>{t('Close', 'বন্ধ করুন', lang)}</Button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" icon={<Printer size={13} />} onClick={() => printDoLetter(doLive)}>
                  {t('Print', 'প্রিন্ট', lang)}
                </Button>
                <Button variant="ghost" icon={<Download size={13} />} onClick={() => downloadVaultDoc(doLive, `${memo.replace(/\//g, '_')}.html`, 'DO Letter')}>
                  {t('Download', 'ডাউনলোড', lang)}
                </Button>
                {!sent && (
                  <Button variant="gold" icon={<Send size={14} />} onClick={submitDoLetter}>
                    {caps.canDispatch
                      ? t('Sign & send', 'স্বাক্ষর করে পাঠান', lang)
                      : t('Send to Chairman', 'চেয়ারম্যানের কাছে পাঠান', lang)}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {stageAction && (
        <div className="modal-bg" onClick={closeStage}>
          <div className="modal" style={{ maxWidth: '520px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd">
              <h3>
                {stageAction.kind === 'inspect'
                  ? t('Record field inspection', 'মাঠ পরিদর্শন লিপিবদ্ধ করুন', lang)
                  : t('Record the renewal certificate', 'নবায়ন সনদ লিপিবদ্ধ করুন', lang)}
              </h3>
              <button type="button" className="modal-close" onClick={closeStage}>×</button>
            </div>
            <div className="modal-body">
              {stageAction.kind === 'inspect' ? (
                <>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: 0 }}>
                    {t('Write what the inspector found. This is kept on the filing.', 'পরিদর্শক কী পেয়েছেন তা লিখুন। এটি আবেদনের সাথে থাকবে।', lang)}
                  </p>
                  <textarea
                    value={inspectFindings}
                    onChange={(e) => setInspectFindings(e.target.value)}
                    rows={5}
                    style={{ width: '100%', padding: '10px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-1)', background: 'var(--surface-0)' }}
                    placeholder={t('e.g. Site visit complete. Fire pumps tested. No outstanding findings.', 'যেমন: সরেজমিন পরিদর্শন সম্পন্ন। ফায়ার পাম্প পরীক্ষিত।', lang)}
                  />
                </>
              ) : (
                <>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: 0 }}>
                    {t('The new certificate will be filed and this permit marked active for 12 months.', 'নতুন সনদ দাখিল হবে এবং লাইসেন্স ১২ মাসের জন্য সক্রিয় হবে।', lang)}
                  </p>
                  <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px' }}>
                    <input type="checkbox" checked={certConfirm} onChange={(e) => setCertConfirm(e.target.checked)} />
                    <span>{t('I have the signed renewal certificate from the agency.', 'সংস্থার স্বাক্ষরিত নবায়ন সনদ হাতে আছে।', lang)}</span>
                  </label>
                  <div style={{ marginTop: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                      {t('Certificate picture', 'সনদের ছবি', lang)}
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        handleCertPhoto(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
                      {t('Optional. One JPEG, PNG, or WebP, up to 2 MB. None keeps the current certificate.', 'ঐচ্ছিক। একটি JPEG, PNG বা WebP, সর্বোচ্চ ২ এমবি। না দিলে বর্তমান সনদই থাকবে।', lang)}
                    </div>
                    {certPhoto && (
                      <div style={{ position: 'relative', display: 'inline-block', marginTop: '8px' }}>
                        <img className="permit-form-photo" src={certPhoto} alt={t('Renewal certificate', 'নবায়ন সনদ', lang)} />
                        <button type="button" className="guest-photo-remove" onClick={() => setCertPhoto('')} aria-label={t('Remove picture', 'ছবি সরান', lang)}>×</button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="modal-ft" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="ghost" onClick={closeStage}>{t('Cancel', 'বাতিল', lang)}</Button>
              <Button variant="primary" onClick={stageAction.kind === 'inspect' ? confirmInspection : confirmCertificate}>
                {stageAction.kind === 'inspect'
                  ? t('Save and move to ministry vetting', 'সংরক্ষণ করে মন্ত্রণালয় ধাপে যান', lang)
                  : t('Mark renewed & active', 'সক্রিয় ও নবায়িত চিহ্নিত করুন', lang)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
