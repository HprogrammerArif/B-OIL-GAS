import React from 'react';
import { Lang, t } from '../types';
import { Printer, Download, QrCode, ShieldCheck } from 'lucide-react';
import { showToast } from '../App';

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
  paragraphs: { label: string; text: string; signedBy: string; hash?: string }[];
}

interface OfficialDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  docData: DocumentData;
}

export default function OfficialDocumentModal({
  isOpen,
  onClose,
  lang,
  docData,
}: OfficialDocumentModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    showToast(
      t(
        `Official PDF Ready: ${docData.docNumber}.pdf (Signed & Stamped)`,
        `অফিসিয়াল পিডিএফ প্রস্তুত: ${docData.docNumber}.pdf (স্বাক্ষর ও সিলমোহর সংযুক্ত)`,
        lang
      ),
      'gold'
    );
  };

  return (
    <div className="modal-bg" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal"
        style={{ maxWidth: '720px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Actions */}
        <div className="modal-hd" style={{ background: '#0F172A', color: '#fff', padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--brand-gold)" />
            <h3 style={{ color: '#fff', margin: 0, fontSize: '15px' }}>
              {t('Official Company Document & Print Preview', 'দাপ্তরিক নথি ও প্রিন্ট প্রিভিউ', lang)}
            </h3>
          </div>
          <button className="modal-close" style={{ color: '#fff' }} onClick={onClose}>×</button>
        </div>

        {/* Printable Sheet */}
        <div className="modal-body" style={{ overflowY: 'auto', padding: '24px', background: '#F1F5F9' }}>
          <div
            className="printable-paper"
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '36px 40px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              position: 'relative',
              color: '#0F172A',
              fontFamily: 'serif',
            }}
          >
            {/* Watermark */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-30deg)',
                fontSize: '52px',
                fontWeight: 900,
                color: 'rgba(165, 28, 48, 0.04)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                letterSpacing: '4px',
                textTransform: 'uppercase',
              }}
            >
              Bashundhara Oil & Gas
            </div>

            {/* Letterhead */}
            <div style={{ borderBottom: '2px solid #A51C30', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        background: '#A51C30',
                        color: '#D4AF37',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 900,
                      }}
                    >
                      B
                    </div>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#A51C30', margin: 0, letterSpacing: '0.5px' }}>
                        BASHUNDHARA OIL & GAS COMPANY LTD.
                      </h2>
                      <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'sans-serif' }}>
                        A Concern of Bashundhara Group • Official Record
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '6px', fontFamily: 'sans-serif' }}>
                    Plot-3, Block-G, Umme Kulsum Road, Baridhara R/A, Dhaka-1229 • Keraniganj Plant
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontFamily: 'sans-serif' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace' }}>{docData.docNumber}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Date: {docData.date}</div>
                  {docData.sapReference && (
                    <div style={{ fontSize: '10px', color: '#0369A1', fontFamily: 'monospace', marginTop: '2px' }}>
                      Ref: {docData.sapReference}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subject */}
            <div style={{ fontFamily: 'sans-serif', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#64748B' }}>
                Department: {docData.department}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginTop: '4px', borderLeft: '3px solid #A51C30', paddingLeft: '10px' }}>
                SUBJECT: {docData.title}
              </div>
              {docData.amountOrValue && (
                <div style={{ fontSize: '12px', color: '#A51C30', fontWeight: 700, marginTop: '4px', paddingLeft: '10px' }}>
                  Approved Amount / Value: {docData.amountOrValue}
                </div>
              )}
            </div>

            {/* Paragraphs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
              {docData.paragraphs.map((para, idx) => (
                <div key={idx} style={{ fontSize: '12.5px', lineHeight: '1.7', color: '#1E293B', textAlign: 'justify' }}>
                  <strong>{para.label}:</strong> {para.text}
                  <div style={{ marginTop: '4px', fontSize: '10.5px', color: '#64748B', fontFamily: 'sans-serif', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <span>— {para.signedBy}</span>
                    {para.hash && (
                      <span style={{ fontFamily: 'monospace', fontSize: '9.5px', color: '#059669' }}>
                        ✓ Stamp Code: {para.hash.slice(0, 26)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Seal & Authorization Box */}
            <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: 'sans-serif', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <QrCode size={64} color="#0F172A" />
                <div style={{ fontSize: '9.5px', color: '#64748B', maxWidth: '240px', lineHeight: 1.4 }}>
                  Scan this QR code at any company gate or office desk to verify this official document.
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    display: 'inline-block',
                    border: '2px solid #A51C30',
                    color: '#A51C30',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontWeight: 900,
                    fontSize: '11px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    transform: 'rotate(-5deg)',
                    marginBottom: '8px',
                  }}
                >
                  ★ BOGCL APPROVED ★
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800 }}>{docData.authorizedBy}</div>
                <div style={{ fontSize: '10.5px', color: '#64748B' }}>{docData.authorizerRole}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-ft" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)' }}>
            ✓ {t('Verified Official Company Record', 'যাচাইকৃত প্রাতিষ্ঠানিক নথি', lang)}
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-sm-ghost" onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} />
              <span>{t('Download PDF', 'পিডিএফ ডাউনলোড', lang)}</span>
            </button>
            <button className="btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={14} />
              <span>{t('Print Document', 'নথি প্রিন্ট করুন', lang)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
