import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Check, RotateCcw, ChevronUp, ChevronDown, Clock, ShieldCheck, Building2,
  CalendarClock, FileText, Hash, Layers, MessageSquareQuote, Receipt,
} from 'lucide-react';
import { t, type Lang } from '../../types';
import type { ApprovalItem } from '../../store/approvalStore';
import { CATEGORY_LABELS } from './config';
import { SOURCE_LABEL, URGENCY_LABEL, avatarTone, initialsOf } from './format';
import { slaLabel, slaMinutesLeft, slaTone, useNow } from '../../lib/sla';

interface ApprovalDetailDrawerProps {
  item: ApprovalItem;
  mode: 'pending' | 'history';
  lang: Lang;
  canDecide: boolean;
  position: number; // 1-based position within the visible list
  total: number;
  /** A modal is open above the drawer — keyboard shortcuts pause. */
  suspendKeys: boolean;
  signerLabel: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onApprove: (item: ApprovalItem) => void;
  onReturn: (item: ApprovalItem) => void;
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
}

/** Full-context review panel: details, endorsement timeline, decision record, and next/previous navigation. */
export default function ApprovalDetailDrawer({
  item, mode, lang, canDecide, position, total, suspendKeys, signerLabel,
  onClose, onPrev, onNext, onApprove, onReturn,
}: ApprovalDetailDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [item.id]);

  useEffect(() => {
    if (suspendKeys) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'j' || e.key === 'J') onNext();
      if (e.key === 'k' || e.key === 'K') onPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [suspendKeys, onClose, onNext, onPrev]);

  const trail = item.approvalTrail ?? [];
  const returned = item.decisionStatus === 'rejected';
  const decided = mode === 'history';
  const minutesLeft = slaMinutesLeft(item, useNow());
  const tone = slaTone(minutesLeft);
  const sourceKey = item.sourceType ?? 'generic';

  return createPortal(
    <div className="apv-drawer-backdrop" onClick={onClose}>
      <aside
        className="apv-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t(item.title, item.titleBn, lang)}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="apv-drawer-head">
          <div className="apv-drawer-nav">
            <button
              type="button" onClick={onPrev} disabled={position <= 1}
              aria-label={t('Previous request', 'আগের আবেদন', lang)} title={`${t('Previous', 'আগেরটি', lang)} (K)`}
            >
              <ChevronUp size={16} />
            </button>
            <span>{position} / {total}</span>
            <button
              type="button" onClick={onNext} disabled={position >= total}
              aria-label={t('Next request', 'পরের আবেদন', lang)} title={`${t('Next', 'পরেরটি', lang)} (J)`}
            >
              <ChevronDown size={16} />
            </button>
          </div>
          <button ref={closeRef} type="button" className="apv-drawer-close" onClick={onClose} aria-label={t('Close', 'বন্ধ করুন', lang)}>
            <X size={18} />
          </button>
        </header>

        <div className="apv-drawer-body" ref={bodyRef}>
          <div className="apv-tags">
            <span className="apv-chip">{t(CATEGORY_LABELS[item.category][0], CATEGORY_LABELS[item.category][1], lang)}</span>
            {!decided && item.urgency !== 'normal' && (
              <span className={`apv-chip urgency-${item.urgency}`}>{t(URGENCY_LABEL[item.urgency][0], URGENCY_LABEL[item.urgency][1], lang)}</span>
            )}
            <span className="apv-ref">{item.id}</span>
          </div>
          <h2 className="apv-drawer-title">{t(item.title, item.titleBn, lang)}</h2>

          <div className="apv-hero">
            <div>
              <span className="apv-hero-label">{t('Amount', 'পরিমাণ', lang)}</span>
              <strong>{item.amount ?? t('Not applicable', 'প্রযোজ্য নয়', lang)}</strong>
            </div>
            {decided ? (
              <span className={`apv-sla-pill ${returned ? 'warn' : 'done'}`}>
                {returned ? <RotateCcw size={12} /> : <Check size={12} />}
                {returned ? t('Returned with query', 'আপত্তিসহ ফেরত', lang) : t('Approved', 'অনুমোদিত', lang)}
              </span>
            ) : (
              <span className={`apv-sla-pill ${tone}`}><Clock size={12} /> {slaLabel(minutesLeft, lang)}</span>
            )}
          </div>

          <div className="apv-requester-card">
            <span className={`apv-avatar lg tone-${avatarTone(item.requester)}`} aria-hidden>{initialsOf(item.requester)}</span>
            <div>
              <strong>{item.requester}</strong>
              <span>{item.designation}</span>
            </div>
          </div>

          <dl className="apv-facts">
            <div><dt><Building2 size={13} /> {t('Department', 'বিভাগ', lang)}</dt><dd>{item.dept}</dd></div>
            <div><dt><CalendarClock size={13} /> {t('Submitted', 'দাখিল', lang)}</dt><dd>{item.date}</dd></div>
            <div><dt><Hash size={13} /> {t('Reference', 'রেফারেন্স', lang)}</dt><dd className="mono">{item.sapDocRef}</dd></div>
            <div><dt><Layers size={13} /> {t('Source', 'উৎস', lang)}</dt><dd>{t(SOURCE_LABEL[sourceKey][0], SOURCE_LABEL[sourceKey][1], lang)}</dd></div>
          </dl>

          <section className="apv-section">
            <h4><FileText size={13} /> {t('Purpose & details', 'উদ্দেশ্য ও বিবরণ', lang)}</h4>
            <p>{item.details}</p>
          </section>

          <section className="apv-section">
            <h4><ShieldCheck size={13} /> {t('Endorsement trail', 'সুপারিশের ধারা', lang)}</h4>
            <ol className="apv-timeline">
              {trail.map((step) => (
                <li key={step.stepNo} className="done">
                  <span className="apv-dot"><Check size={10} /></span>
                  <div>
                    <div className="apv-step-top">
                      <strong>{step.officerName}</strong>
                      <time>{step.timestamp}</time>
                    </div>
                    <span className="apv-step-role">{step.roleName} · {step.department}</span>
                    {step.note && <p className="apv-step-note">“{step.note}”</p>}
                  </div>
                </li>
              ))}
              {trail.length === 0 && (
                <li className="done">
                  <span className="apv-dot"><Check size={10} /></span>
                  <div>
                    <strong>{item.requester}</strong>
                    <span className="apv-step-role">{t('Submitted the request', 'আবেদন দাখিল করেছেন', lang)}</span>
                  </div>
                </li>
              )}
              {!decided && (
                <li className="current">
                  <span className="apv-dot" />
                  <div>
                    <strong>{signerLabel || t('You', 'আপনি', lang)}</strong>
                    <span className="apv-step-role">{t('Awaiting your decision', 'আপনার সিদ্ধান্তের অপেক্ষায়', lang)}</span>
                  </div>
                </li>
              )}
            </ol>
          </section>

          {decided && (
            <section className={`apv-section apv-decision ${returned ? 'returned' : 'approved'}`}>
              <h4>
                {returned ? <RotateCcw size={13} /> : <Receipt size={13} />}
                {returned ? t('Return record', 'ফেরতের রেকর্ড', lang) : t('Approval record', 'অনুমোদনের রেকর্ড', lang)}
              </h4>
              <p className="apv-decision-by">
                {returned ? item.rejectedBy : item.authorizedBy} · {returned ? item.rejectedAt : item.authorizedAt}
              </p>
              {returned ? (
                <>
                  {item.rejectionReason && <p><strong>{t('Reason', 'কারণ', lang)}:</strong> {item.rejectionReason}</p>}
                  {item.rejectionObservation && <p><strong>{t('Observation', 'পর্যবেক্ষণ', lang)}:</strong> {item.rejectionObservation}</p>}
                  {item.rejectionImprovementNotes && <p><strong>{t('Required changes', 'প্রয়োজনীয় সংশোধন', lang)}:</strong> {item.rejectionImprovementNotes}</p>}
                </>
              ) : (
                <>
                  {item.executiveDirective && (
                    <blockquote><MessageSquareQuote size={14} /> {item.executiveDirective}</blockquote>
                  )}
                  {item.sapVoucher && <p><strong>{t('Voucher', 'ভাউচার', lang)}:</strong> <span className="mono">{item.sapVoucher}</span></p>}
                </>
              )}
            </section>
          )}
        </div>

        <footer className="apv-drawer-foot">
          {!decided && canDecide ? (
            <>
              <button type="button" className="apv-btn return lg" onClick={() => onReturn(item)}>
                <RotateCcw size={14} /> {t('Return with query', 'আপত্তিসহ ফেরত', lang)}
              </button>
              <button type="button" className="apv-btn approve lg" onClick={() => onApprove(item)}>
                <Check size={15} /> {t('Approve', 'অনুমোদন', lang)}
              </button>
            </>
          ) : (
            <button type="button" className="apv-btn review lg" onClick={onClose}>{t('Close', 'বন্ধ করুন', lang)}</button>
          )}
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
