import { nextRef } from '../../lib/refs';
import { today, nowStamp } from '../../lib/clock';
import { parcelPhotoFor, type LicenseCard } from '../../store/operationsStore';
import type { ParcelItem } from '../ParcelView';
import { t, type Lang } from '../../types';

export type DoChannel = 'enothi' | 'courier' | 'liaison';

export function channelLabel(channel: DoChannel, lang: Lang): string {
  if (channel === 'enothi') return t('Government e-Nothi', 'সরকারি ই-নথি', lang);
  if (channel === 'courier') return t('sealed courier', 'সিলগালা কুরিয়ার', lang);
  return t('hand delivery', 'সরাসরি হস্তান্তর', lang);
}

export function nextDoMemo(tag: string): string {
  const n = nextRef('DO');
  const seq = n.split('-').pop() ?? '0101';
  return `BOGCL/CMD-DO/${tag.toUpperCase()}/2026/${seq}`;
}

export function letterHtml(lic: LicenseCard, lang: Lang, memo: string, signed: boolean): string {
  const subject = t(
    `Request to expedite renewal of ${lic.title} — Keraniganj plant.`,
    `${lic.titleBn} নবায়ন দ্রুত ইস্যুর অনুরোধ — কেরানীগঞ্জ প্ল্যান্ট।`,
    lang,
  );
  const body = t(
    `Plant checks for ${lic.refNo} are complete under ${lic.sroLawRef}. A delay risks ${lic.dailyShutdownRiskTk} in lost production. Kindly issue the renewal certificate.`,
    `${lic.refNo} এর প্ল্যান্ট যাচাই ${lic.sroLawRef} অনুযায়ী সম্পন্ন। বিলম্বে দৈনিক ${lic.dailyShutdownRiskTk} উৎপাদন ক্ষতি হতে পারে। নবায়ন সনদ ইস্যু করার অনুরোধ।`,
    lang,
  );
  const stamp = signed
    ? `<div style="margin-top:8px;color:#A51C30;font-weight:800;font-size:12px">SIGNED ${today()} · Abdul Mannan Chowdhury, CMD</div>`
    : `<div style="margin-top:8px;color:#64748b;font-size:12px">DRAFT — awaiting Chairman signature</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${memo}</title>
<style>
  body{font-family:Georgia,serif;max-width:720px;margin:32px auto;color:#0f172a;line-height:1.55}
  h1{color:#A51C30;letter-spacing:.08em;font-size:20px;margin:0}
  .rule{border-top:2px solid #A51C30;margin:12px 0 20px}
  .sub{font-weight:700;font-size:12px}
  .meta{display:flex;justify-content:space-between;font-size:13px;margin-bottom:16px}
  .subject{border-left:4px solid #A51C30;padding:8px 12px;background:#f8fafc;font-weight:700;margin:16px 0}
</style></head><body>
  <div style="text-align:center">
    <h1>BASHUNDHARA GROUP</h1>
    <div class="sub">${t("Office of the Chairman & Managing Director", 'চেয়ারম্যান ও ব্যবস্থাপনা পরিচালকের দপ্তর', lang)}</div>
  </div>
  <div class="rule"></div>
  <div class="meta">
    <div><strong>DO Memo:</strong> ${memo}<br><strong>License:</strong> ${lic.refNo}</div>
    <div style="text-align:right"><strong>Date:</strong> ${today()}</div>
  </div>
  <p><strong>To:</strong><br><strong>${lic.ministryRecipient}</strong><br>${lic.ministryAddress}</p>
  <div class="subject">${subject}</div>
  <p>${body}</p>
  <div style="text-align:right;margin-top:32px">
    <div style="font-weight:800">Abdul Mannan Chowdhury</div>
    <div style="font-size:12px;color:#64748b">${t('Chairman & Managing Director', 'চেয়ারম্যান ও ব্যবস্থাপনা পরিচালক', lang)}</div>
    ${stamp}
  </div>
</body></html>`;
}

export function escHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** A one-page HTML sheet, the same kind of file the DO letter saves. */
export function htmlSheet(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escHtml(title)}</title>
<style>body{font-family:Segoe UI,sans-serif;color:#1a1a1a;padding:32px;max-width:760px;margin:0 auto}h1{font-size:20px;margin:0 0 8px}p,li,td,th{font-size:13px;line-height:1.45}table{border-collapse:collapse;width:100%;margin-top:12px}td,th{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f4f4f4}</style>
</head><body><h1>${escHtml(title)}</h1>${bodyHtml}<p>Bashundhara Oil &amp; Gas Co. Ltd.</p></body></html>`;
}

export function downloadFile(filename: string, contents: string, mime = 'text/html;charset=utf-8') {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function printHtml(html: string) {
  const w = window.open('', '_blank', 'noopener,noreferrer,width=800,height=900');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  window.setTimeout(() => w.print(), 250);
  return true;
}

export function makeCourierParcel(lic: LicenseCard, memo: string, actor: string, actorRole: string): ParcelItem {
  const trackingNo = nextRef('PKG');
  const sealNo = nextRef('SEAL', 5);
  const stamp = nowStamp();
  return {
    id: trackingNo,
    trackingNo,
    sealNo,
    sender: actor,
    senderDept: "Chairman's Office",
    origin: 'Head Office, Baridhara',
    receiver: lic.ministryRecipient,
    receiverDept: lic.agency,
    destination: lic.ministryAddress,
    contents: `DO letter ${memo} — ${lic.title} (${lic.refNo})`,
    photo: parcelPhotoFor('legal_docs'),
    photos: [parcelPhotoFor('legal_docs')],
    category: 'legal_docs',
    weight: '0.4 kg',
    declaredValue: 'Confidential',
    specialHandling: 'Sealed legal pouch. Do not bend.',
    urgency: 'critical',
    currentStage: 1,
    status: 'dispatched',
    lastUpdated: stamp,
    eta: 'Awaiting courier pickup',
    corridorProgressPercent: 12,
    courier: {
      name: 'Unassigned',
      phone: '',
      vehicle: 'HQ despatch pool',
      avatarInitials: '—',
    },
    dispatchedBy: `${actor} (${actorRole})`,
    tamperStatus: 'secure',
    deliveryOtp: '4821',
    otpAttempts: 0,
    chainOfCustody: [{
      stage: 1,
      stageName: 'Despatch Logged',
      stageNameBn: 'ডেসপ্যাচ এন্ট্রি',
      location: 'Head Office, Baridhara',
      timestamp: stamp,
      actor,
      actorRole,
      notes: `Legal DO ${memo} sealed for ${lic.agency}.`,
    }],
  };
}
