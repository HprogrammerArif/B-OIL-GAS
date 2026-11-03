import { BadgeCheck, ShieldCheck } from 'lucide-react';
import { t, type Lang } from '../../types';
import { Button, Modal } from '../../components/ui';
import type { NoteFile } from '../../store/notesheetStore';

interface CertificateModalProps {
  file: NoteFile;
  open: boolean;
  lang: Lang;
  onClose: () => void;
}

export default function CertificateModal({ file, open, lang, onClose }: CertificateModalProps) {
  const signatures = (file.signatoryRoute ?? []).filter((s) => s.status === 'signed');
  const rows: [string, string][] = [
    [t('Subject', 'বিষয়', lang), file.title],
    [t('Amount authorized', 'অনুমোদিত অর্থ', lang), file.amount],
    [t('Department', 'বিভাগ', lang), file.dept],
    [t('Date', 'তারিখ', lang), file.date],
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      icon={<ShieldCheck size={16} />}
      title={t('Official certificate of approval', 'দাপ্তরিক অনুমোদন সনদ', lang)}
      footer={<Button variant="primary" onClick={onClose}>{t('Close', 'বন্ধ করুন', lang)}</Button>}
    >
      <div className="ns-cert">
        <div className="ns-cert-org">{t('Bashundhara Oil & Gas Company Limited', 'বসুন্ধরা অয়েল অ্যান্ড গ্যাস কোম্পানি লিমিটেড', lang)}</div>
        <h3>{t('Certificate of final approval', 'চূড়ান্ত অনুমোদনের সনদ', lang)}</h3>
        <div className="ns-cert-ref">{t('File reference', 'ফাইল রেফারেন্স', lang)}: <code>{file.fileNo}</code></div>

        <dl className="ns-cert-rows">
          {rows.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>

        {signatures.length > 0 && (
          <ul className="ns-cert-sigs">
            {signatures.map((s) => (
              <li key={s.id}>
                <BadgeCheck size={14} />
                <span>
                  <strong>{s.officerName}</strong>
                  <small>{t(s.roleName, s.roleNameBn, lang)}{s.signedAt ? ` · ${s.signedAt}` : ''}</small>
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="ns-cert-ok"><BadgeCheck size={14} /> {t('Verified by all designated authorities', 'সকল নির্ধারিত কর্তৃপক্ষ কর্তৃক যাচাইকৃত', lang)}</p>
      </div>
    </Modal>
  );
}
