import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { CheckCheck, Crown, Eraser, PenTool, RotateCcw, ShieldCheck, Stamp } from 'lucide-react';
import { t, type Lang } from '../../types';
import { readToken } from '../../lib/theme';
import { Button, Modal } from '../../components/ui';
import type { CurrentUser } from '../../auth/session';
import type { NoteFile } from '../../store/notesheetStore';

const REMARK_LIMIT = 500;

interface SignPanelProps {
  file: NoteFile;
  user: CurrentUser;
  lang: Lang;
  isFinal: boolean;
  /** Officer who receives the file after this signature (null on the final step). */
  nextOfficer: string | null;
  /** Resolves true when the signature was recorded. */
  onSign: (remark: string) => Promise<boolean>;
  onReturn: () => void;
}

/**
 * Signing card for the officer whose turn it is. Mount it with a `key` per
 * file and step so the pad and remarks reset when the file changes.
 */
export default function SignPanel({ file, user, lang, isFinal, nextOfficer, onSign, onReturn }: SignPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [signed, setSigned] = useState(false);
  const [remark, setRemark] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Match the bitmap to the displayed size so strokes are not stretched.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(canvas.clientHeight * ratio);
  }, []);

  const ctxOf = () => {
    const ctx = canvasRef.current?.getContext('2d') ?? null;
    if (ctx) {
      const ratio = window.devicePixelRatio || 1;
      ctx.lineWidth = 2.5 * ratio;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = readToken('--text-1');
      ctx.fillStyle = readToken('--text-1');
    }
    return ctx;
  };

  const pointOf = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const onDown = (e: PointerEvent<HTMLCanvasElement>) => {
    const ctx = ctxOf();
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = pointOf(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    // A tap leaves a dot, so it should count as a mark too.
    ctx.lineTo(x + 0.01, y);
    ctx.stroke();
  };

  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = ctxOf();
    if (!ctx) return;
    const { x, y } = pointOf(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const onUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setSigned(true);
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
  };

  const applyStamp = () => {
    const canvas = canvasRef.current;
    const ctx = ctxOf();
    if (!canvas || !ctx) return;
    const ratio = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `italic 700 ${Math.round(26 * ratio)}px "Outfit", Georgia, serif`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(user.name, 18 * ratio, canvas.height * 0.58);
    ctx.beginPath();
    ctx.moveTo(14 * ratio, canvas.height * 0.72);
    ctx.bezierCurveTo(canvas.width * 0.25, canvas.height * 0.9, canvas.width * 0.6, canvas.height * 0.55, canvas.width - 14 * ratio, canvas.height * 0.7);
    ctx.stroke();
    setSigned(true);
  };

  const submit = async () => {
    if (!signed || busy) return;
    setBusy(true);
    try {
      const ok = await onSign(remark.trim());
      if (ok) {
        setRemark('');
        clearPad();
      }
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  };

  const primaryLabel = isFinal ? t('Approve & close file', 'অনুমোদন ও ফাইল বন্ধ', lang) : t('Sign & forward', 'স্বাক্ষর ও ফরোয়ার্ড', lang);
  const placeholder = isFinal
    ? t('Approved as recommended. The concerned department may proceed.', 'সুপারিশ অনুযায়ী অনুমোদিত। সংশ্লিষ্ট বিভাগ অগ্রসর হতে পারে।', lang)
    : t('Reviewed and found in order. Forwarded for the next signature.', 'পর্যালোচিত ও যথাযথ। পরবর্তী স্বাক্ষরের জন্য পাঠানো হলো।', lang);

  return (
    <section className={`ns-card ns-sign ${isFinal ? 'final' : ''}`} id="ns-sign-panel" aria-labelledby="ns-sign-title">
      <header className="ns-card-head">
        <span className="ns-card-icon">{isFinal ? <Crown size={16} /> : <Stamp size={16} />}</span>
        <div>
          <h3 id="ns-sign-title">{isFinal ? t('Final approval', 'চূড়ান্ত অনুমোদন', lang) : t('Review & sign', 'পর্যালোচনা ও স্বাক্ষর', lang)}</h3>
          <p>
            {isFinal
              ? t('Your signature closes the file.', 'আপনার স্বাক্ষরে ফাইল নিষ্পন্ন হবে।', lang)
              : t(
                `Your signature forwards it to ${nextOfficer ?? 'the next authority'}.`,
                `আপনার স্বাক্ষরে ফাইলটি ${nextOfficer ?? 'পরবর্তী কর্তৃপক্ষ'}-এর কাছে যাবে।`,
                lang,
              )}
          </p>
        </div>
      </header>

      <div className="ns-signer">
        <ShieldCheck size={15} />
        <span>
          <strong>{t(user.name, user.nameBn, lang)}</strong>
          <small>{t(user.label, user.labelBn, lang)} · {user.empId}</small>
        </span>
      </div>

      <div className="ns-field">
        <div className="ns-field-top">
          <label id="ns-pad-label">{t('Signature', 'স্বাক্ষর', lang)}</label>
          <span className="ns-field-tools">
            <button type="button" onClick={applyStamp}><Stamp size={12} /> {t('Use my stamp', 'আমার স্ট্যাম্প', lang)}</button>
            <button type="button" onClick={clearPad} disabled={!signed}><Eraser size={12} /> {t('Clear', 'মুছুন', lang)}</button>
          </span>
        </div>
        <div className={`ns-pad ${signed ? 'is-signed' : ''}`}>
          <canvas
            ref={canvasRef}
            aria-labelledby="ns-pad-label"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
          {!signed && (
            <span className="ns-pad-hint"><PenTool size={14} /> {t('Draw your signature here, or use your stamp', 'এখানে স্বাক্ষর আঁকুন বা স্ট্যাম্প ব্যবহার করুন', lang)}</span>
          )}
        </div>
      </div>

      <div className="ns-field">
        <div className="ns-field-top">
          <label htmlFor="ns-remark">{t('Remarks', 'মন্তব্য', lang)} <em>{t('optional', 'ঐচ্ছিক', lang)}</em></label>
          <span className="ns-count">{remark.length}/{REMARK_LIMIT}</span>
        </div>
        <textarea
          id="ns-remark"
          rows={3}
          maxLength={REMARK_LIMIT}
          value={remark}
          placeholder={placeholder}
          onChange={(e) => setRemark(e.target.value)}
        />
        <small className="ns-help">{t('Left blank, the text above is recorded as your remark.', 'ফাঁকা রাখলে উপরের লেখাটি আপনার মন্তব্য হিসেবে নথিভুক্ত হবে।', lang)}</small>
      </div>

      <div className="ns-actions">
        <Button
          variant={isFinal ? 'gold' : 'primary'}
          icon={<CheckCheck size={15} />}
          loading={busy}
          disabled={!signed}
          block
          onClick={() => (isFinal ? setConfirmOpen(true) : void submit())}
        >
          {primaryLabel}
        </Button>
        <Button variant="outline-danger" icon={<RotateCcw size={14} />} disabled={busy} block onClick={onReturn}>
          {t('Return with query', 'আপত্তিসহ ফেরত', lang)}
        </Button>
        {!signed && <small className="ns-help center">{t('Add your signature to continue.', 'চালিয়ে যেতে স্বাক্ষর যোগ করুন।', lang)}</small>}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        size="sm"
        icon={<Crown size={16} />}
        title={t('Approve and close this file?', 'ফাইলটি অনুমোদন ও বন্ধ করবেন?', lang)}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={busy}>{t('Cancel', 'বাতিল', lang)}</Button>
            <Button variant="gold" icon={<CheckCheck size={15} />} loading={busy} onClick={() => void submit()}>
              {t('Approve', 'অনুমোদন', lang)}
            </Button>
          </>
        )}
      >
        <p className="ns-confirm">
          {t(
            `You are giving final approval to ${file.fileNo} for ${file.amount}. A certificate is issued and this cannot be undone.`,
            `আপনি ${file.fileNo} ফাইলটি ${file.amount} অঙ্কের জন্য চূড়ান্তভাবে অনুমোদন করছেন। সনদ ইস্যু হবে এবং এটি ফেরানো যাবে না।`,
            lang,
          )}
        </p>
      </Modal>
    </section>
  );
}
