import React from 'react';
import { Check, ChevronRight, Clock, RotateCcw, ShieldCheck, Eye } from 'lucide-react';
import { t, type Lang } from '../../types';
import type { ApprovalItem } from '../../store/approvalStore';
import { CATEGORY_LABELS } from './config';
import { URGENCY_LABEL, avatarTone, initialsOf } from './format';
import { slaLabel, slaMinutesLeft, slaTone, useNow } from '../../lib/sla';

interface ApprovalCardProps {
  item: ApprovalItem;
  mode: 'pending' | 'history';
  lang: Lang;
  canDecide: boolean;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onApprove: (item: ApprovalItem) => void;
  onReturn: (item: ApprovalItem) => void;
}

export default function ApprovalCard({
  item, mode, lang, canDecide, selectable, selected,
  onToggleSelect, onOpen, onApprove, onReturn,
}: ApprovalCardProps) {
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const minutesLeft = slaMinutesLeft(item, useNow());
  const tone = mode === 'pending' ? slaTone(minutesLeft) : item.decisionStatus === 'rejected' ? 'warn' : 'done';
  const trail = item.approvalTrail ?? [];
  const lastEndorser = trail[trail.length - 1];
  const title = t(item.title, item.titleBn, lang);
  const returned = item.decisionStatus === 'rejected';

  return (
    <article
      className={`apv-card tone-${tone} ${selected ? 'selected' : ''}`}
      onClick={() => onOpen(item.id)}
    >
      {selectable && (
        <label className="apv-check" onClick={stop}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(item.id)}
            aria-label={t(`Select ${item.id}`, `${item.id} নির্বাচন করুন`, lang)}
          />
        </label>
      )}

      <div className="apv-main">
        <div className="apv-tags">
          <span className="apv-chip">{t(CATEGORY_LABELS[item.category][0], CATEGORY_LABELS[item.category][1], lang)}</span>
          {mode === 'pending' && item.urgency !== 'normal' && (
            <span className={`apv-chip urgency-${item.urgency}`}>{t(URGENCY_LABEL[item.urgency][0], URGENCY_LABEL[item.urgency][1], lang)}</span>
          )}
          <span className="apv-ref">{item.id}</span>
        </div>

        <h3 className="apv-title">
          <button type="button" onClick={(e) => { stop(e); onOpen(item.id); }}>{title}</button>
        </h3>
        <p className="apv-details">{item.details}</p>

        <div className="apv-meta">
          <span className={`apv-avatar tone-${avatarTone(item.requester)}`} aria-hidden>{initialsOf(item.requester)}</span>
          <span className="apv-requester">
            <strong>{item.requester}</strong>
            <span>{item.designation} · {item.dept}</span>
          </span>
          {trail.length > 0 && (
            <span
              className="apv-endorse"
              title={lastEndorser ? `${lastEndorser.officerName} — ${lastEndorser.roleName}` : undefined}
            >
              <ShieldCheck size={13} />
              {t(`${trail.length} endorsement${trail.length > 1 ? 's' : ''}`, `${trail.length}টি সুপারিশ`, lang)}
            </span>
          )}
        </div>
      </div>

      <div className="apv-side">
        <div className="apv-amount">
          <strong>{item.amount ?? t('No amount', 'অর্থ নেই', lang)}</strong>
          <span>{item.sapDocRef}</span>
        </div>

        {mode === 'pending' ? (
          <div className="apv-sla">
            <span className={`apv-sla-pill ${tone}`}>
              <Clock size={12} /> {slaLabel(minutesLeft, lang)}
            </span>
            <span className="apv-submitted">{t('Submitted', 'দাখিল', lang)}: {item.date}</span>
          </div>
        ) : (
          <div className="apv-sla">
            <span className={`apv-sla-pill ${returned ? 'warn' : 'done'}`}>
              {returned ? <RotateCcw size={12} /> : <Check size={12} />}
              {returned ? t('Returned with query', 'আপত্তিসহ ফেরত', lang) : t('Approved', 'অনুমোদিত', lang)}
            </span>
            <span className="apv-submitted">
              {returned ? item.rejectedAt : item.authorizedAt}
            </span>
          </div>
        )}

        <div className="apv-actions" onClick={stop}>
          {mode === 'pending' && canDecide ? (
            <>
              <button type="button" className="apv-btn return" onClick={() => onReturn(item)}>
                <RotateCcw size={13} /> {t('Return', 'ফেরত', lang)}
              </button>
              <button type="button" className="apv-btn approve" onClick={() => onApprove(item)}>
                <Check size={14} /> {t('Approve', 'অনুমোদন', lang)}
              </button>
            </>
          ) : (
            <button type="button" className="apv-btn review" onClick={() => onOpen(item.id)}>
              <Eye size={13} /> {mode === 'pending' ? t('Review', 'পর্যালোচনা', lang) : t('View record', 'বিবরণ', lang)}
            </button>
          )}
          <ChevronRight size={16} className="apv-chevron" aria-hidden />
        </div>
      </div>
    </article>
  );
}
