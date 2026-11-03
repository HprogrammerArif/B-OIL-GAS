import { ArrowDown, CalendarDays, CheckCircle2, Clock, Info, PenTool, Printer, QrCode, RotateCcw } from 'lucide-react';
import { t, type Lang } from '../../types';
import { Button, StatusPill } from '../../components/ui';
import type { NoteFile } from '../../store/notesheetStore';
import RouteStepper from './RouteStepper';
import {
  STATE_TONE, URGENCY_TONE, firstSentence, nextStepText, stateLabel, urgencyLabel, type FileState,
} from './helpers';

interface FileSummaryProps {
  file: NoteFile;
  state: FileState;
  lang: Lang;
  myRole?: string;
  isFinal: boolean;
  awaitingName: string;
  nextName: string | null;
  onPrint: () => void;
  onCertificate: () => void;
  onJumpToSign: () => void;
}

const NEXT_ICON: Record<FileState, typeof Info> = {
  mine: PenTool,
  waiting: Clock,
  returned: RotateCcw,
  approved: CheckCircle2,
};

/**
 * "In short" card: what this file is, who asked and why, how much, where it
 * stands, and what happens next. Everything else on the page is evidence.
 */
export default function FileSummary({
  file, state, lang, myRole, isFinal, awaitingName, nextName, onPrint, onCertificate, onJumpToSign,
}: FileSummaryProps) {
  const approved = state === 'approved';
  const asker = file.initiatorName ?? file.notes[0]?.author ?? '';
  const askerRole = file.initiatorRole ?? file.notes[0]?.role ?? '';
  const why = file.notes[0] ? firstSentence(file.notes[0].body) : '';
  const NextIcon = NEXT_ICON[state];

  return (
    <section className="ns-card ns-summary" aria-labelledby="ns-summary-title">
      <div className="ns-sum-top">
        <div className="ns-pills">
          <StatusPill tone={STATE_TONE[state]}>{stateLabel(state, file, lang)}</StatusPill>
          {!approved && file.urgency !== 'normal' && (
            <StatusPill tone={URGENCY_TONE[file.urgency]}>{urgencyLabel(file.urgency, lang)}</StatusPill>
          )}
        </div>
        <div className="ns-fh-actions">
          <Button variant="secondary" size="sm" icon={<Printer size={13} />} onClick={onPrint}>
            {t('Print', 'প্রিন্ট', lang)}
          </Button>
          {approved && (
            <Button variant="secondary" size="sm" icon={<QrCode size={13} />} onClick={onCertificate}>
              {t('Certificate', 'সনদ', lang)}
            </Button>
          )}
        </div>
      </div>

      <div className="ns-sum-main">
        <div className="ns-sum-title">
          <h3 id="ns-summary-title">{file.title}</h3>
          <span className="ns-fileno">
            <code>{file.fileNo}</code>
            <span><CalendarDays size={12} /> {file.date}</span>
          </span>
        </div>
        <div className="ns-amount">
          <small>{t('Amount', 'পরিমাণ', lang)}</small>
          <strong>{file.amount}</strong>
        </div>
      </div>

      <dl className="ns-sum-facts">
        <div>
          <dt>{t('Asked by', 'আবেদনকারী', lang)}</dt>
          <dd>
            <strong>{asker}</strong>
            <small>{[askerRole, file.dept].filter(Boolean).join(' · ')}</small>
          </dd>
        </div>
        {why && (
          <div>
            <dt>{t('Why', 'কেন', lang)}</dt>
            <dd><span className="ns-why">{why}</span></dd>
          </div>
        )}
      </dl>

      <RouteStepper file={file} lang={lang} myRole={myRole} />

      <div className={`ns-next-step state-${state}`} role="status">
        <NextIcon size={16} />
        <span>{nextStepText(state, { isFinal, awaitingName, nextName, initiator: asker, dept: file.dept }, lang)}</span>
        {state === 'mine' && (
          <button type="button" className="ns-jump" onClick={onJumpToSign}>
            {t('Go to signing', 'স্বাক্ষরে যান', lang)} <ArrowDown size={13} />
          </button>
        )}
      </div>
    </section>
  );
}
