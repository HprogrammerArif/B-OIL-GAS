import React from 'react';
import { Lang, t } from '../types';
import { Database } from 'lucide-react';

interface SapGatewayModalProps {
  onClose: () => void;
  lang: Lang;
}

type IntegrationStatus = 'planned' | 'manual';

const INTEGRATIONS: {
  name: [string, string];
  scope: [string, string];
  status: IntegrationStatus;
}[] = [
  {
    name: ['SAP Finance & Accounting', 'এসএপি অর্থ ও হিসাব'],
    scope: ['Purchase orders, expense vouchers, asset depreciation', 'ক্রয় আদেশ, ব্যয় ভাউচার, সম্পদের অবচয়'],
    status: 'planned',
  },
  {
    name: ['Plant & store inventory', 'প্ল্যান্ট ও স্টোর মজুদ'],
    scope: ['Spare-parts stock and maintenance logs', 'খুচরা যন্ত্রাংশের মজুদ ও রক্ষণাবেক্ষণ লগ'],
    status: 'planned',
  },
  {
    name: ['HR attendance & payroll', 'এইচআর উপস্থিতি ও বেতন'],
    scope: ['Monthly attendance, leave and overtime export', 'মাসিক উপস্থিতি, ছুটি ও ওভারটাইম এক্সপোর্ট'],
    status: 'manual',
  },
];

const STATUS_LABEL: Record<IntegrationStatus, { label: [string, string]; className: string }> = {
  planned: { label: ['Not connected · planned', 'সংযুক্ত নয় · পরিকল্পিত'], className: 'badge' },
  manual: { label: ['Manual file export', 'ম্যানুয়াল ফাইল এক্সপোর্ট'], className: 'badge info' },
};

export default function SapGatewayModal({ onClose, lang }: SapGatewayModalProps) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <h3>
            <Database size={18} color="var(--status-info)" />
            <span>{t('Integrations', 'ইন্টিগ্রেশন', lang)}</span>
          </h3>
          <button className="modal-close" onClick={onClose} aria-label={t('Close', 'বন্ধ করুন', lang)}>×</button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 0, marginBottom: '14px' }}>
            {t(
              'OneOps keeps its own records. Connections to company systems are added after go-live; until then, data is exchanged by export.',
              'ওয়ানঅপ্স নিজস্ব রেকর্ড সংরক্ষণ করে। কোম্পানির অন্যান্য সিস্টেমের সাথে সংযোগ চালুর পরে যুক্ত হবে; ততদিন এক্সপোর্টের মাধ্যমে তথ্য আদান-প্রদান হবে।',
              lang
            )}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {INTEGRATIONS.map((it) => (
              <div
                key={it.name[0]}
                style={{ padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong>{t(it.name[0], it.name[1], lang)}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t(it.scope[0], it.scope[1], lang)}</div>
                </div>
                <span className={STATUS_LABEL[it.status].className}>
                  {t(STATUS_LABEL[it.status].label[0], STATUS_LABEL[it.status].label[1], lang)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-ft">
          <button className="btn-sm-ghost" onClick={onClose}>{t('Close', 'বন্ধ করুন', lang)}</button>
        </div>
      </div>
    </div>
  );
}
