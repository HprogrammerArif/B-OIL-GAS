import { useEffect } from 'react';
import { Lang, t } from '../types';
import { Printer, QrCode, ShieldCheck, FileText, BadgeCheck } from 'lucide-react';
import { Button, Modal } from './ui';

export interface DocumentData {
  type: 'notesheet' | 'trip_pass' | 'gate_pass';
  docNumber: string;
  title: string;
  date: string;
  department: string;
  authorizedBy: string;
  authorizerRole: string;
  amountOrValue?: string;
  sapReference?: string;
  /** Drives the stamp: only approved documents carry the approval seal. Defaults to approved. */
  status?: 'approved' | 'in_progress' | 'returned';
  paragraphs: { label: string; text: string; signedBy: string; hash?: string }[];
}

interface OfficialDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  docData: DocumentData;
}

/** Print preview. Print or "Save as PDF" both go through the browser print dialog. */
export default function OfficialDocumentModal({ isOpen, onClose, lang, docData }: OfficialDocumentModalProps) {
  // While open, print CSS hides the rest of the app so only the paper is printed.
  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.classList.add('ns-printing');
    return () => document.body.classList.remove('ns-printing');
  }, [isOpen]);

  const status = docData.status ?? 'approved';
  const approved = status === 'approved';
  const stamp = approved
    ? t('Approved', 'অনুমোদিত', lang)
    : status === 'returned'
      ? t('Returned for correction', 'সংশোধনের জন্য ফেরত', lang)
      : t('Not yet approved', 'এখনও অনুমোদিত নয়', lang);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="lg"
      icon={<FileText size={17} />}
      title={t('Print preview', 'প্রিন্ট প্রিভিউ', lang)}
      footer={(
        <>
          <span className="nsd-foot-note">
            <ShieldCheck size={14} /> {t('Each paragraph carries its signature code.', 'প্রতিটি অনুচ্ছেদে স্বাক্ষর কোড আছে।', lang)}
          </span>
          <Button variant="secondary" onClick={onClose}>{t('Close', 'বন্ধ করুন', lang)}</Button>
          <Button variant="primary" icon={<Printer size={14} />} onClick={() => window.print()}>
            {t('Print / Save as PDF', 'প্রিন্ট / পিডিএফ সংরক্ষণ', lang)}
          </Button>
        </>
      )}
    >
      <div className="nsd-stage">
        <article className="nsd-paper printable-paper">
          <span className="nsd-watermark" aria-hidden>Bashundhara Oil &amp; Gas</span>

          <header className="nsd-letterhead">
            <div className="nsd-brand">
              <span className="nsd-logo" aria-hidden>B</span>
              <div>
                <h2>{t('Bashundhara Oil & Gas Company Ltd.', 'বসুন্ধরা অয়েল অ্যান্ড গ্যাস কোম্পানি লিমিটেড', lang)}</h2>
                <small>{t('A concern of Bashundhara Group · Official record', 'বসুন্ধরা গ্রুপের একটি প্রতিষ্ঠান · দাপ্তরিক নথি', lang)}</small>
              </div>
            </div>
            <div className="nsd-docmeta">
              <code>{docData.docNumber}</code>
              <span>{t('Date', 'তারিখ', lang)}: {docData.date}</span>
              {docData.sapReference && <span>{t('Ref', 'রেফ', lang)}: <code>{docData.sapReference}</code></span>}
            </div>
          </header>

          <section className="nsd-subject">
            <span className="nsd-dept">{t('Department', 'বিভাগ', lang)}: {docData.department}</span>
            <h3>{t('Subject', 'বিষয়', lang)}: {docData.title}</h3>
            {docData.amountOrValue && (
              <p>{approved ? t('Approved amount', 'অনুমোদিত অর্থ', lang) : t('Proposed amount', 'প্রস্তাবিত অর্থ', lang)}: <strong>{docData.amountOrValue}</strong></p>
            )}
          </section>

          <section className="nsd-paras">
            {docData.paragraphs.map((para, idx) => (
              <div key={idx} className="nsd-para">
                <p><strong>{para.label}:</strong> {para.text}</p>
                <div className="nsd-para-foot">
                  <span>— {para.signedBy}</span>
                  {para.hash && (
                    <span className="nsd-code"><BadgeCheck size={12} /> {t('Stamp code', 'স্ট্যাম্প কোড', lang)}: {para.hash}</span>
                  )}
                </div>
              </div>
            ))}
          </section>

          <footer className="nsd-seal">
            <div className="nsd-verify">
              <QrCode size={56} aria-hidden />
              <small>{t('Verify this document with its reference number and the stamp codes above.', 'রেফারেন্স নম্বর ও উপরের স্ট্যাম্প কোড দিয়ে নথিটি যাচাই করুন।', lang)}</small>
            </div>
            <div className="nsd-sign">
              <span className={`nsd-stamp ${approved ? 'ok' : 'pending'}`}>{stamp}</span>
              <strong>{docData.authorizedBy}</strong>
              <small>{approved ? docData.authorizerRole : `${docData.authorizerRole} · ${t('final approver', 'চূড়ান্ত অনুমোদনকারী', lang)}`}</small>
            </div>
          </footer>
        </article>
      </div>
    </Modal>
  );
}
