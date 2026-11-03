import { useState } from 'react';
import {
  BadgeCheck, CheckCircle2, Clock, Copy, Check, FileText, Lock, QrCode, RotateCcw, ShieldCheck, Layers, Hourglass,
} from 'lucide-react';
import { t, type Lang } from '../../types';
import { showToast } from '../../components/ToastManager';
import { Button, EmptyState } from '../../components/ui';
import type { NoteFile, NoteItem } from '../../store/notesheetStore';
import { signProgress, type FileState } from './helpers';

/* ── small shared pieces ─────────────────────────────────────────────────── */

function CodeChip({ code, lang }: { code: string; lang: Lang }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast(t('Could not copy the code.', 'কোডটি কপি করা যায়নি।', lang), 'warn');
    }
  };
  return (
    <span className="ns-code">
      <Lock size={11} />
      <code>{code}</code>
      <button type="button" onClick={copy} aria-label={t('Copy verification code', 'যাচাইকরণ কোড কপি করুন', lang)}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </span>
  );
}

function Verified({ lang }: { lang: Lang }) {
  return (
    <span className="ns-verified"><BadgeCheck size={13} /> {t('Verified signature', 'যাচাইকৃত স্বাক্ষর', lang)}</span>
  );
}

/* ── Note-sheet paragraphs ───────────────────────────────────────────────── */

function NoteCard({ note, lang }: { note: NoteItem; lang: Lang }) {
  return (
    <article className={`ns-note ${note.isChairman ? 'chairman' : ''}`}>
      <header className="ns-note-head">
        <span className="ns-para">{t('Para', 'অনুচ্ছেদ', lang)} {note.para}</span>
        <div className="ns-note-who">
          <strong>{note.author}</strong>
          <span>{note.role} · {note.dept}</span>
        </div>
        <time>{note.date}</time>
      </header>
      <p className="ns-note-body">{note.body}</p>
      {note.hash && (
        <footer className="ns-note-foot">
          <CodeChip code={note.hash} lang={lang} />
          <Verified lang={lang} />
        </footer>
      )}
    </article>
  );
}

export function NoteList({ file, state, awaitingName, lang }: { file: NoteFile; state: FileState; awaitingName: string; lang: Lang }) {
  const nextPara = (file.notes[file.notes.length - 1]?.para ?? 0) + 1;
  return (
    <div className="ns-notes">
      {file.notes.map((n) => <NoteCard key={n.id} note={n} lang={lang} />)}
      {(state === 'mine' || state === 'waiting') && (
        <div className="ns-note pending" aria-live="polite">
          <Hourglass size={15} />
          <span>
            <strong>{t('Para', 'অনুচ্ছেদ', lang)} {nextPara}</strong>
            {state === 'mine'
              ? t('Waiting for your signature.', 'আপনার স্বাক্ষরের অপেক্ষায়।', lang)
              : t(`Waiting for ${awaitingName}.`, `${awaitingName}-এর অপেক্ষায়।`, lang)}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Budget summary ──────────────────────────────────────────────────────── */

export function BudgetCard({ file, lang }: { file: NoteFile; lang: Lang }) {
  const b = file.budgetInfo;
  const items: [string, string, string?][] = [
    [t('Budget head', 'বাজেট খাত', lang), b.budgetHead],
    [t('Account code', 'হিসাব কোড', lang), b.accountCode, 'mono'],
    [t('Annual allocation', 'বার্ষিক বরাদ্দ', lang), b.annualAllocation],
    [t('Available balance', 'প্রাপ্য স্থিতি', lang), b.availableBalance, 'ok'],
  ];
  return (
    <section className="ns-card" aria-labelledby="ns-budget-title">
      <header className="ns-card-head compact">
        <span className="ns-card-icon"><Layers size={15} /></span>
        <h3 id="ns-budget-title">{t('Budget & account allocation', 'বাজেট ও হিসাব বরাদ্দ', lang)}</h3>
      </header>
      <dl className="ns-facts four">
        {items.map(([label, value, tone]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className={tone}>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ── Side column: status when it is not the user's turn ──────────────────── */

interface StatusCardProps {
  file: NoteFile;
  state: FileState;
  isFinal: boolean;
  awaitingName: string;
  awaitingRole: string;
  lang: Lang;
  onHistory: () => void;
  onCertificate: () => void;
}

export function StatusCard({ file, state, isFinal, awaitingName, awaitingRole, lang, onHistory, onCertificate }: StatusCardProps) {
  const approved = state === 'approved';
  const returned = state === 'returned';
  const title = approved
    ? t('File approved', 'ফাইল অনুমোদিত', lang)
    : returned
      ? t('Returned to initiator', 'সূচনাকারীর কাছে ফেরত', lang)
      : t('Awaiting signature', 'স্বাক্ষরের অপেক্ষায়', lang);
  const description = approved
    ? t('All signatories have signed. The certificate is ready.', 'সব স্বাক্ষরকারী স্বাক্ষর করেছেন। সনদ প্রস্তুত।', lang)
    : returned
      ? t('Corrections were requested. The file is re-routed once it is resubmitted.', 'সংশোধন চাওয়া হয়েছে। পুনরায় জমা দিলে ফাইলটি আবার পাঠানো হবে।', lang)
      : t('This file is with another signatory. You can read it but not sign yet.', 'ফাইলটি অন্য স্বাক্ষরকারীর কাছে আছে। আপনি পড়তে পারবেন, এখনই স্বাক্ষর করতে পারবেন না।', lang);

  return (
    <section className={`ns-card ns-status state-${state}`} aria-labelledby="ns-status-title">
      <header className="ns-card-head">
        <span className="ns-card-icon">{approved ? <ShieldCheck size={16} /> : returned ? <RotateCcw size={16} /> : <Clock size={16} />}</span>
        <div>
          <h3 id="ns-status-title">{title}</h3>
          <p>{description}</p>
        </div>
      </header>

      {state === 'waiting' && (
        <div className="ns-next">
          <small>{isFinal ? t('Final approver', 'চূড়ান্ত অনুমোদনকারী', lang) : t('Next signatory', 'পরবর্তী স্বাক্ষরকারী', lang)}</small>
          <strong>{awaitingName}</strong>
          <span>{awaitingRole}</span>
        </div>
      )}

      <div className="ns-actions">
        {approved && (
          <Button variant="primary" icon={<QrCode size={14} />} block onClick={onCertificate}>
            {t('View approval certificate', 'অনুমোদন সনদ দেখুন', lang)}
          </Button>
        )}
        <Button variant="secondary" icon={<Lock size={13} />} block onClick={onHistory}>
          {t('View signature history', 'স্বাক্ষর ইতিহাস দেখুন', lang)}
        </Button>
      </div>
    </section>
  );
}

/* ── Side column: file facts ─────────────────────────────────────────────── */

export function FileFacts({ file, lang }: { file: NoteFile; lang: Lang }) {
  const { done, total } = signProgress(file);
  const pct = Math.round((done / total) * 100);
  return (
    <section className="ns-card" aria-labelledby="ns-facts-title">
      <header className="ns-card-head compact">
        <span className="ns-card-icon"><FileText size={15} /></span>
        <h3 id="ns-facts-title">{t('File details', 'ফাইলের বিবরণ', lang)}</h3>
      </header>
      <dl className="ns-facts stack">
        <div>
          <dt>{t('Initiated by', 'সূচনাকারী', lang)}</dt>
          <dd>
            {file.initiatorName ?? file.notes[0]?.author ?? '—'}
            {file.initiatorRole && <small>{file.initiatorRole}</small>}
          </dd>
        </div>
        <div>
          <dt>{t('Purchase reference', 'ক্রয় রেফারেন্স', lang)}</dt>
          <dd className="mono">{file.sapRef}</dd>
        </div>
        <div>
          <dt>{t('Signatures', 'স্বাক্ষর', lang)}</dt>
          <dd>
            <span className="ns-meter" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
              <i style={{ width: `${pct}%` }} />
            </span>
            <small>{t(`${done} of ${total} signed`, `${total}-এর মধ্যে ${done}টি স্বাক্ষরিত`, lang)}</small>
          </dd>
        </div>
      </dl>
    </section>
  );
}

/* ── Vendor quotations tab ───────────────────────────────────────────────── */

export function QuotationsTab({ file, lang }: { file: NoteFile; lang: Lang }) {
  const quotes = file.quotations ?? [];
  return (
    <section className="ns-card ns-tabcard" aria-labelledby="ns-quotes-title">
      <header className="ns-tab-head">
        <div>
          <h3 id="ns-quotes-title">{t('Vendor quotations & price comparison', 'সরবরাহকারী দরপত্র ও মূল্য তুলনা', lang)}</h3>
          <p>{file.fileNo} · {file.title}</p>
        </div>
        {quotes.length > 0 && (
          <span className="badge success"><ShieldCheck size={12} /> {t(`${quotes.length} quotations compared`, `${quotes.length}টি দরপত্র তুলনা করা হয়েছে`, lang)}</span>
        )}
      </header>

      {quotes.length > 0 ? (
        <div className="ns-quotes">
          {quotes.map((q) => (
            <article key={q.vendor} className={`ns-quote ${q.isRecommended ? 'recommended' : ''}`}>
              {q.isRecommended && <span className="ns-quote-flag"><CheckCircle2 size={12} /> {t('Recommended', 'সুপারিশকৃত', lang)}</span>}
              <h4>{q.vendor}</h4>
              <span className="ns-quote-origin">{t('Origin', 'উৎস', lang)}: {q.origin}</span>
              <strong className="ns-quote-price">{q.priceText}</strong>
              <dl>
                <div><dt>{t('Delivery', 'সরবরাহ', lang)}</dt><dd>{q.deliveryTime}</dd></div>
                <div><dt>{t('Warranty', 'ওয়ারেন্টি', lang)}</dt><dd>{q.warranty}</dd></div>
                <div><dt>{t('Notes', 'মন্তব্য', lang)}</dt><dd>{q.remarks}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          compact
          icon={<FileText size={20} />}
          title={t('No competing quotations on this file', 'এই ফাইলে কোনো প্রতিযোগিতামূলক দরপত্র নেই', lang)}
          description={t(
            `Price details are linked under purchase reference ${file.sapRef}.`,
            `মূল্যের বিবরণ ক্রয় রেফারেন্স ${file.sapRef}-এর অধীনে সংযুক্ত।`,
            lang,
          )}
        />
      )}
    </section>
  );
}

/* ── Signatures & history tab ────────────────────────────────────────────── */

export function HistoryTab({ file, state, awaitingName, lang }: { file: NoteFile; state: FileState; awaitingName: string; lang: Lang }) {
  const signed = file.notes.filter((n) => n.hash).length;
  return (
    <section className="ns-card ns-tabcard" aria-labelledby="ns-history-title">
      <header className="ns-tab-head">
        <div>
          <h3 id="ns-history-title">{t('Approval history & audit trail', 'অনুমোদনের ইতিহাস ও অডিট ট্রেইল', lang)}</h3>
          <p>{t('File', 'ফাইল', lang)}: {file.fileNo}</p>
        </div>
        <span className={`badge ${state === 'approved' ? 'success' : 'warn'}`}>
          {state === 'approved'
            ? t('All signatures verified', 'সব স্বাক্ষর যাচাইকৃত', lang)
            : t(`${signed} signed · awaiting ${awaitingName}`, `${signed}টি স্বাক্ষরিত · ${awaitingName}-এর অপেক্ষায়`, lang)}
        </span>
      </header>

      <ol className="ns-timeline">
        {file.notes.map((n) => (
          <li key={n.id} className={n.isChairman ? 'chairman' : ''}>
            <span className="ns-tl-dot" aria-hidden><Check size={12} /></span>
            <div className="ns-tl-body">
              <div className="ns-tl-top">
                <strong>{n.author}</strong>
                <time>{n.date}</time>
              </div>
              <span className="ns-tl-role">{n.role} · {n.dept}</span>
              <p>{n.body}</p>
              {n.hash && (
                <div className="ns-note-foot">
                  <CodeChip code={n.hash} lang={lang} />
                  <Verified lang={lang} />
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
