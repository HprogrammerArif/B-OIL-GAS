import { useState } from 'react';
import { BadgeCheck, Check, CheckCircle2, Copy, Hourglass, Wallet, Scale } from 'lucide-react';
import { t, type Lang } from '../../types';
import { showToast } from '../../components/ToastManager';
import type { NoteFile, NoteItem } from '../../store/notesheetStore';
import { formatTaka } from '../approvals/format';
import { parseTaka, type FileState } from './helpers';

/** BR-03-06: purchases above this amount must carry competing quotations. */
const QUOTES_REQUIRED_ABOVE = 200000;

/* ── Price comparison ────────────────────────────────────────────────────── */

function verdictText(file: NoteFile, lang: Lang): string {
  const quotes = file.quotations;
  const priced = quotes
    .map((q) => ({ q, n: parseTaka(q.priceText) }))
    .filter((p): p is { q: typeof p.q; n: number } => p.n !== null);
  const rec = quotes.find((q) => q.isRecommended);
  if (priced.length === 0) {
    return rec
      ? t(`${quotes.length} suppliers quoted. ${rec.vendor} is recommended.`, `${quotes.length}টি সরবরাহকারী দর দিয়েছে। ${rec.vendor}-কে সুপারিশ করা হয়েছে।`, lang)
      : t(`${quotes.length} suppliers quoted.`, `${quotes.length}টি সরবরাহকারী দর দিয়েছে।`, lang);
  }
  const lowest = priced.reduce((a, b) => (b.n < a.n ? b : a));
  const highest = priced.reduce((a, b) => (b.n > a.n ? b : a));
  const recN = rec ? parseTaka(rec.priceText) : null;
  const n = quotes.length;

  if (rec && recN !== null && recN === lowest.n) {
    const saving = highest.n - lowest.n;
    return saving > 0
      ? t(
        `${n} suppliers quoted. ${rec.vendor} is recommended and is also the cheapest, ${formatTaka(saving)} less than the highest quote.`,
        `${n}টি সরবরাহকারী দর দিয়েছে। ${rec.vendor}-কে সুপারিশ করা হয়েছে এবং তাদের দরই সবচেয়ে কম, সর্বোচ্চ দরের চেয়ে ${formatTaka(saving)} কম।`,
        lang,
      )
      : t(`${n} suppliers quoted. ${rec.vendor} is recommended.`, `${n}টি সরবরাহকারী দর দিয়েছে। ${rec.vendor}-কে সুপারিশ করা হয়েছে।`, lang);
  }
  if (rec && recN !== null) {
    return t(
      `${n} suppliers quoted. ${rec.vendor} is recommended even though ${lowest.q.vendor} is ${formatTaka(recN - lowest.n)} cheaper. The reason is noted below.`,
      `${n}টি সরবরাহকারী দর দিয়েছে। ${lowest.q.vendor} ${formatTaka(recN - lowest.n)} কমে দিলেও ${rec.vendor}-কে সুপারিশ করা হয়েছে। কারণ নিচে লেখা আছে।`,
      lang,
    );
  }
  return t(
    `${n} suppliers quoted. The lowest is ${lowest.q.vendor} at ${formatTaka(lowest.n)}.`,
    `${n}টি সরবরাহকারী দর দিয়েছে। সবচেয়ে কম ${lowest.q.vendor}, ${formatTaka(lowest.n)}।`,
    lang,
  );
}

export function PriceComparison({ file, lang }: { file: NoteFile; lang: Lang }) {
  const quotes = file.quotations;
  if (quotes.length === 0) return null;
  const lowestN = Math.min(...quotes.map((q) => parseTaka(q.priceText) ?? Infinity));

  return (
    <section className="ns-card" aria-labelledby="ns-price-title">
      <header className="ns-sec-head">
        <span className="ns-card-icon"><Scale size={16} /></span>
        <div>
          <h3 id="ns-price-title">{t('Price comparison', 'মূল্য তুলনা', lang)}</h3>
          <p>
            {t(
              `Company rule: purchases above ${formatTaka(QUOTES_REQUIRED_ABOVE)} need competing quotes, so approvers can check the price is fair.`,
              `কোম্পানির নিয়ম: ${formatTaka(QUOTES_REQUIRED_ABOVE)}-এর বেশি ক্রয়ে একাধিক দর লাগে, যাতে অনুমোদনকারীরা দাম ন্যায্য কি না দেখতে পারেন।`,
              lang,
            )}
          </p>
        </div>
      </header>

      <p className="ns-verdict"><CheckCircle2 size={15} /> {verdictText(file, lang)}</p>

      <table className="ns-quotes">
        <thead>
          <tr>
            <th scope="col">{t('Supplier', 'সরবরাহকারী', lang)}</th>
            <th scope="col">{t('Price', 'মূল্য', lang)}</th>
            <th scope="col">{t('Delivery', 'সরবরাহ', lang)}</th>
            <th scope="col">{t('Warranty', 'ওয়ারেন্টি', lang)}</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => {
            const n = parseTaka(q.priceText);
            const extra = n !== null && Number.isFinite(lowestN) ? n - lowestN : 0;
            return (
              <tr key={q.vendor} className={q.isRecommended ? 'recommended' : ''}>
                <th scope="row" data-label={t('Supplier', 'সরবরাহকারী', lang)}>
                  <strong>{q.vendor}</strong>
                  {q.isRecommended && <span className="ns-rec"><Check size={11} /> {t('Recommended', 'সুপারিশকৃত', lang)}</span>}
                  <small>{q.remarks}</small>
                </th>
                <td data-label={t('Price', 'মূল্য', lang)}>
                  <b>{q.priceText}</b>
                  {extra > 0 && <small>+{formatTaka(extra)}</small>}
                  {n !== null && extra === 0 && <small className="ok">{t('Lowest', 'সর্বনিম্ন', lang)}</small>}
                </td>
                <td data-label={t('Delivery', 'সরবরাহ', lang)}>{q.deliveryTime}</td>
                <td data-label={t('Warranty', 'ওয়ারেন্টি', lang)}>{q.warranty}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

/* ── Budget check ────────────────────────────────────────────────────────── */

export function BudgetCheck({ file, lang }: { file: NoteFile; lang: Lang }) {
  const b = file.budgetInfo;
  const available = parseTaka(b.availableBalance);
  const request = parseTaka(file.amount);
  const left = available !== null && request !== null ? available - request : null;
  const within = left !== null && left >= 0;

  return (
    <section className="ns-card" aria-labelledby="ns-budget-title">
      <header className="ns-sec-head">
        <span className="ns-card-icon"><Wallet size={16} /></span>
        <div>
          <h3 id="ns-budget-title">{t('Is there budget?', 'বাজেট আছে কি?', lang)}</h3>
          <p>{b.budgetHead} · {b.accountCode}</p>
        </div>
        {left !== null && (
          <span className={`badge ${within ? 'success' : 'danger'}`}>
            {within ? t('Within budget', 'বাজেটের মধ্যে', lang) : t('Over budget', 'বাজেটের বেশি', lang)}
          </span>
        )}
      </header>

      {left !== null && available !== null && request !== null ? (
        <dl className="ns-budget">
          <div><dt>{t('Available', 'প্রাপ্য', lang)}</dt><dd>{formatTaka(available)}</dd></div>
          <div><dt>{t('This request', 'এই আবেদন', lang)}</dt><dd>{formatTaka(request)}</dd></div>
          <div className={within ? 'ok' : 'bad'}>
            <dt>{within ? t('Left after', 'অবশিষ্ট থাকবে', lang) : t('Short by', 'ঘাটতি', lang)}</dt>
            <dd>{formatTaka(Math.abs(left))}</dd>
          </div>
        </dl>
      ) : (
        <p className="ns-muted">{t('This file has no fixed amount to check against the budget.', 'এই ফাইলে বাজেটের সঙ্গে মেলানোর মতো নির্দিষ্ট অঙ্ক নেই।', lang)}</p>
      )}
    </section>
  );
}

/* ── Discussion: what each officer said ──────────────────────────────────── */

function VerifyDetails({ code, lang }: { code: string; lang: Lang }) {
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
    <details className="ns-verify">
      <summary><BadgeCheck size={13} /> {t('Signed and verified', 'স্বাক্ষরিত ও যাচাইকৃত', lang)}</summary>
      <div className="ns-verify-body">
        <small>{t('Signature code. It changes if the paragraph is edited.', 'স্বাক্ষর কোড। অনুচ্ছেদ বদলালে কোডও বদলে যায়।', lang)}</small>
        <span className="ns-code">
          <code>{code}</code>
          <button type="button" onClick={copy} aria-label={t('Copy signature code', 'স্বাক্ষর কোড কপি করুন', lang)}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </span>
      </div>
    </details>
  );
}

function NoteCard({ note, lang }: { note: NoteItem; lang: Lang }) {
  return (
    <article className={`ns-note ${note.isChairman ? 'chairman' : ''}`}>
      <header className="ns-note-head">
        <span className="ns-para">{t('Para', 'অনুচ্ছেদ', lang)} {note.para}</span>
        <div className="ns-note-who">
          <strong>{note.author}</strong>
          <span>{note.role}</span>
        </div>
        <time>{note.date}</time>
      </header>
      <p className="ns-note-body">{note.body}</p>
      {note.hash && <VerifyDetails code={note.hash} lang={lang} />}
    </article>
  );
}

export function Discussion({ file, state, awaitingName, lang }: { file: NoteFile; state: FileState; awaitingName: string; lang: Lang }) {
  const nextPara = (file.notes[file.notes.length - 1]?.para ?? 0) + 1;
  return (
    <section className="ns-card" aria-labelledby="ns-disc-title">
      <header className="ns-sec-head">
        <div>
          <h3 id="ns-disc-title">{t('What each officer said', 'প্রত্যেক কর্মকর্তা কী বলেছেন', lang)}</h3>
          <p>{t('One paragraph per officer, in order. Each is signed.', 'প্রত্যেক কর্মকর্তার একটি অনুচ্ছেদ, ক্রম অনুযায়ী। প্রতিটি স্বাক্ষরিত।', lang)}</p>
        </div>
      </header>
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
    </section>
  );
}
