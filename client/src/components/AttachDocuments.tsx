import { FileText, UploadCloud, X } from 'lucide-react';
import { t, type Lang } from '../types';
import { showToast } from './ToastManager';
import {
  ATTACHMENT_ACCEPT,
  MAX_ATTACHMENT_BYTES,
  formatBytes,
  isAllowedAttachment,
} from '../views/chat/helpers';

/** A chosen file. The prototype keeps the name and size only; nothing is uploaded. */
export interface AttachedFile {
  name: string;
  size: string;
}

/**
 * Optional document picker for a request. Several files can be added, and each
 * can be removed before the form is sent.
 */
export default function AttachDocuments({
  lang,
  files,
  onChange,
  label,
}: {
  lang: Lang;
  files: AttachedFile[];
  onChange: (files: AttachedFile[]) => void;
  label: string;
}) {
  return (
    <div className="eam-field">
      <span className="eam-label">{label}</span>
      {files.length > 0 && (
        <div className="attach-chips">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="claims-voucher-chip">
              <FileText size={14} style={{ color: 'var(--status-info)' }} />
              <span style={{ fontWeight: 600, color: 'var(--brand-slate-800)' }}>{file.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>({file.size})</span>
              <button
                type="button"
                aria-label={t(`Remove ${file.name}`, `${file.name} সরান`, lang)}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'inline-flex' }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <label className="claims-dropzone" style={{ display: 'block' }}>
        <input
          type="file"
          accept={ATTACHMENT_ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? []);
            e.target.value = '';
            const accepted = picked.filter((file) => isAllowedAttachment(file.name) && file.size <= MAX_ATTACHMENT_BYTES);
            if (accepted.length < picked.length) {
              showToast(
                t(
                  'Only PDF, Word, Excel or image files up to 10 MB can be attached.',
                  'শুধু ১০ এমবি পর্যন্ত PDF, Word, Excel বা ছবি সংযুক্ত করা যাবে।',
                  lang,
                ),
                'warn',
              );
            }
            if (accepted.length === 0) return;
            onChange([...files, ...accepted.map((file) => ({ name: file.name, size: formatBytes(file.size) }))]);
          }}
        />
        <UploadCloud size={22} style={{ color: 'var(--status-info)', margin: '0 auto 6px' }} />
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-slate-700)' }}>
          {t('Click to attach a document', 'নথি সংযুক্ত করতে ক্লিক করুন', lang)}
        </div>
        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {t('PDF, Word, Excel or image, up to 10 MB each. Optional.', 'PDF, Word, Excel বা ছবি, প্রতিটি সর্বোচ্চ ১০ এমবি। ঐচ্ছিক।', lang)}
        </div>
      </label>
    </div>
  );
}
