import React from 'react';
import { Lang, t } from '../types';
import { Database, Server, RefreshCw } from 'lucide-react';
import { showToast } from '../App';

interface SapGatewayModalProps {
  onClose: () => void;
  lang: Lang;
}

export default function SapGatewayModal({ onClose, lang }: SapGatewayModalProps) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd" style={{ background: 'linear-gradient(135deg, #0B132B 0%, #0369A1 100%)' }}>
          <h3 style={{ color: '#fff' }}>
            <Database size={18} color="#38BDF8" />
            <span>{t('Accounting, Plant & Payroll Sync Status', 'হিসাব, প্ল্যান্ট ও বেতন সিস্টেম সংযোগ স্ট্যাটাস', lang)}</span>
          </h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Server size={18} color="#0284C7" />
              <strong style={{ fontSize: '13px', color: '#0369A1' }}>
                {t('All Company Offices & Plant Connected Live', 'প্রধান কার্যালয় ও কেরানীগঞ্জ প্ল্যান্ট সরাসরি সংযুক্ত', lang)}
              </strong>
            </div>
            <p style={{ fontSize: '12px', color: '#0C4A6E', lineHeight: 1.5, margin: 0 }}>
              {t(
                'Every approval, expense voucher, vehicle fuel slip, equipment record, and daily staff check-in entered in OneOps automatically updates our central Accounting, HR, and Plant records without double entry.',
                'ওয়ানঅপ্স-এ প্রদত্ত প্রতিটি অনুমোদন, ব্যয় ভাউচার, গাড়ির জ্বালানি স্লিপ, সম্পদের হিসাব ও কর্মী উপস্থিতি স্বয়ংক্রিয়ভাবে কেন্দ্রীয় হিসাব ও এইচআর সিস্টেমে যুক্ত হয়।',
                lang
              )}
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h5 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-slate-800)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('Connected Company Systems:', 'সংযুক্ত বিভাগীয় সিস্টেমসমূহ:', lang)}
            </h5>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '10px 14px', background: 'var(--brand-slate-100)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong>{t('Finance & Accounting Books', 'অর্থ ও হিসাব বিভাগ', lang)}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                    {t('Purchase orders, expense vouchers & annual asset value updates', 'ক্রয় আদেশ, ব্যয় ভাউচার ও স্থায়ী সম্পদের বার্ষিক অবচয় হিসাব', lang)}
                  </div>
                </div>
                <span className="badge success">{t('Up to Date', 'হালনাগাদ', lang)}</span>
              </div>

              <div style={{ padding: '10px 14px', background: 'var(--brand-slate-100)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong>{t('Keraniganj Plant & Store Inventory', 'কেরানীগঞ্জ প্ল্যান্ট ও স্টোর মজুদ', lang)}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                    {t('Daily bitumen production, spare parts stock & maintenance logs', 'দৈনিক বিটুমিন উৎপাদন, খুচরা যন্ত্রাংশের মজুদ ও রক্ষণাবেক্ষণ লগ', lang)}
                  </div>
                </div>
                <span className="badge success">{t('Up to Date', 'হালনাগাদ', lang)}</span>
              </div>

              <div style={{ padding: '10px 14px', background: 'var(--brand-slate-100)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong>{t('HR Attendance & Monthly Payroll', 'এইচআর উপস্থিতি ও মাসিক বেতন', lang)}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                    {t('Daily check-in times, shift rosters, approved leaves & overtime', 'দৈনিক উপস্থিতি, শিফট তালিকা, অনুমোদিত ছুটি ও ওভারটাইম হিসাব', lang)}
                  </div>
                </div>
                <span className="badge success">{t('Up to Date', 'হালনাগাদ', lang)}</span>
              </div>
            </div>
          </div>

          <div className="responsive-col-2-eq" style={{ gap: '12px', fontSize: '11.5px', background: 'var(--brand-slate-50, #F8FAFC)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--brand-slate-200)', marginBottom: 0 }}>
            <div>
              <span style={{ color: '#059669', fontWeight: 700 }}>✓ {t('Easy for All Staff', 'সকল কর্মীর জন্য সহজ', lang)}</span>
              <div style={{ color: 'var(--brand-slate-500)' }}>
                {t('Simple web & mobile screens for office staff, plant engineers, and drivers.', 'অফিস কর্মী, প্রকৌশলী ও ড্রাইভারদের জন্য সহজ ইন্টারফেস।', lang)}
              </div>
            </div>
            <div>
              <span style={{ color: '#059669', fontWeight: 700 }}>✓ {t('Automatic Backup', 'স্বয়ংক্রিয় ব্যাকআপ', lang)}</span>
              <div style={{ color: 'var(--brand-slate-500)' }}>
                {t('Records stay safe even during temporary internet interruptions.', 'ইন্টারনেট ধীর থাকলেও কোনো তথ্য হারায় না।', lang)}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-ft">
          <button className="btn-sm-ghost" onClick={onClose}>{t('Close', 'বন্ধ করুন', lang)}</button>
          <button
            className="btn-primary"
            onClick={() => {
              showToast(
                t(
                  'Connection check passed: Finance, Plant & HR systems are 100% online.',
                  'সংযোগ পরীক্ষা সফল: অর্থ, প্ল্যান্ট ও এইচআর সিস্টেম ১০০% সচল রয়েছে।',
                  lang
                ),
                'success'
              );
              onClose();
            }}
          >
            <RefreshCw size={13} />
            {t('Run Connection Check', 'সংযোগ পরীক্ষা করুন', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
