import type { CurrentUser } from '../../auth/session';
import type { Permission } from '../../auth/permissions';
import type { Lang } from '../../types';
import { t } from '../../types';
import type { LicenseCard } from '../../store/operationsStore';

export const STAGES = [
  {
    id: 1,
    key: 'internal',
    title: 'Internal review',
    titleBn: 'অভ্যন্তরীণ মূল্যায়ন',
    purpose: 'Plant team finishes the audit checklist and Finance clears the fee.',
    purposeBn: 'প্ল্যান্ট দল অডিট চেকলিস্ট শেষ করে এবং অর্থ বিভাগ ফি অনুমোদন করে।',
    verb: 'File the application',
    verbBn: 'আবেদন দাখিল করুন',
    color: 'var(--status-purple)',
    badgeColor: 'var(--status-purple-bg)',
    textColor: 'var(--status-purple-text)',
  },
  {
    id: 2,
    key: 'filed',
    title: 'Application filed',
    titleBn: 'আবেদন দাখিল',
    purpose: 'Inspection date is set with the issuing agency.',
    purposeBn: 'ইস্যুকারী সংস্থার সাথে পরিদর্শনের তারিখ ঠিক করা হয়।',
    verb: 'Schedule inspection',
    verbBn: 'পরিদর্শন নির্ধারণ করুন',
    color: 'var(--status-info)',
    badgeColor: 'var(--status-info-bg)',
    textColor: 'var(--status-info)',
  },
  {
    id: 3,
    key: 'inspection',
    title: 'Field inspection',
    titleBn: 'মাঠ পরিদর্শন',
    purpose: 'Site visit is done and findings are recorded.',
    purposeBn: 'সরেজমিন পরিদর্শন শেষ করে ফলাফল লিপিবদ্ধ করা হয়।',
    verb: 'Record inspection',
    verbBn: 'পরিদর্শন লিপিবদ্ধ করুন',
    color: 'var(--status-warning)',
    badgeColor: 'var(--status-warning-bg)',
    textColor: 'var(--status-warning-text)',
  },
  {
    id: 4,
    key: 'vetting',
    title: 'Ministry vetting',
    titleBn: 'মন্ত্রণালয়ে যাচাই',
    purpose: 'The agency issues the certificate. A DO letter can speed this up.',
    purposeBn: 'সংস্থা সনদ ইস্যু করে। ডিও লেটার দিয়ে দ্রুত করা যায়।',
    verb: 'Record certificate',
    verbBn: 'সনদ লিপিবদ্ধ করুন',
    color: 'var(--brand-crimson)',
    badgeColor: 'var(--status-danger-bg)',
    textColor: 'var(--status-danger-text)',
  },
  {
    id: 5,
    key: 'active',
    title: 'Renewed & active',
    titleBn: 'সক্রিয় ও নবায়িত',
    purpose: 'Permit is current. Next cycle starts before expiry.',
    purposeBn: 'লাইসেন্স চালু আছে। মেয়াদ শেষের আগে পরবর্তী চক্র শুরু হবে।',
    verb: 'Active',
    verbBn: 'সক্রিয়',
    color: 'var(--status-success)',
    badgeColor: 'var(--status-success-bg)',
    textColor: 'var(--status-success-text)',
  },
] as const;

export type StageId = 1 | 2 | 3 | 4 | 5;

export interface ComplianceCaps {
  canView: boolean;
  canRenew: boolean;
  canDispatch: boolean;
  canApproveFund: boolean;
}

export function capsFromUser(user: CurrentUser | null): ComplianceCaps {
  const has = (p: Permission) => !!user?.permissions.has(p);
  return {
    canView: has('compliance:view'),
    canRenew: has('compliance:renew') || has('compliance:manage'),
    canDispatch: has('compliance:dispatch_letter'),
    canApproveFund: has('compliance:approve_fund'),
  };
}

export function isFocal(lic: LicenseCard, user: CurrentUser | null): boolean {
  if (!user) return false;
  return lic.focalEmpId === user.empId;
}

export function checklistOpen(lic: LicenseCard): number {
  return lic.auditChecklist.filter((c) => !c.passed).length;
}

export function checklistComplete(lic: LicenseCard): boolean {
  return lic.auditChecklist.length > 0 && checklistOpen(lic) === 0;
}

export function canDoLetter(lic: LicenseCard, caps: ComplianceCaps): boolean {
  if (!(caps.canDispatch || caps.canRenew)) return false;
  return lic.daysLeft <= 30 || lic.stage >= 4;
}

export function canToggleChecklist(lic: LicenseCard, caps: ComplianceCaps, user: CurrentUser | null): boolean {
  if (lic.stage >= 5) return false;
  return caps.canRenew || isFocal(lic, user);
}

export function canApproveThisFee(lic: LicenseCard, caps: ComplianceCaps): boolean {
  return caps.canApproveFund && lic.fundStatus === 'pending' && lic.stage === 1;
}

export type WorkKind = 'checklist' | 'fund' | 'advance' | 'do_letter';

export interface WorkItem {
  license: LicenseCard;
  kind: WorkKind;
  label: string;
  labelBn: string;
}

export function myWork(licenses: LicenseCard[], caps: ComplianceCaps, user: CurrentUser | null, _lang: Lang): WorkItem[] {
  const items: WorkItem[] = [];
  for (const lic of licenses) {
    if (canApproveThisFee(lic, caps)) {
      items.push({
        license: lic,
        kind: 'fund',
        label: `Approve ${lic.feeAmountTk} renewal fee`,
        labelBn: `${lic.feeAmountTk} নবায়ন ফি অনুমোদন করুন`,
      });
    }
    if ((caps.canRenew || isFocal(lic, user)) && lic.stage === 1 && !checklistComplete(lic)) {
      items.push({
        license: lic,
        kind: 'checklist',
        label: `${checklistOpen(lic)} checklist item(s) still open`,
        labelBn: `${checklistOpen(lic)}টি চেকলিস্ট আইটেম বাকি`,
      });
    }
    if (caps.canRenew && canAdvance(lic, caps).ok) {
      const stage = STAGES[lic.stage - 1];
      items.push({
        license: lic,
        kind: 'advance',
        label: stage.verb,
        labelBn: stage.verbBn,
      });
    }
    if (caps.canDispatch && lic.stage >= 4 && lic.stage < 5 && lic.daysLeft <= 30) {
      items.push({
        license: lic,
        kind: 'do_letter',
        label: 'Sign the DO letter',
        labelBn: 'ডিও লেটারে স্বাক্ষর করুন',
      });
    }
  }
  return items;
}

export function canAdvance(lic: LicenseCard, caps: ComplianceCaps): { ok: boolean; reason?: string; reasonBn?: string } {
  if (!caps.canRenew) {
    return {
      ok: false,
      reason: 'Only the plant compliance owner can move this filing.',
      reasonBn: 'শুধু প্ল্যান্ট কমপ্লায়েন্স দায়িত্বপ্রাপ্ত এই আবেদন সরাতে পারেন।',
    };
  }
  if (lic.stage >= 5) {
    return { ok: false, reason: 'This permit is already active.', reasonBn: 'এই লাইসেন্স ইতিমধ্যে সক্রিয়।' };
  }
  if (lic.stage === 1) {
    if (!checklistComplete(lic)) {
      return {
        ok: false,
        reason: `Finish the audit checklist first (${checklistOpen(lic)} item(s) open).`,
        reasonBn: `আগে অডিট চেকলিস্ট শেষ করুন (${checklistOpen(lic)}টি আইটেম বাকি)।`,
      };
    }
    if (lic.fundStatus === 'pending') {
      return {
        ok: false,
        reason: `Waiting for Finance to approve the ${lic.feeAmountTk} fee.`,
        reasonBn: `অর্থ বিভাগ ${lic.feeAmountTk} ফি অনুমোদন করলে আবেদন দাখিল করা যাবে।`,
      };
    }
  }
  if (lic.stage === 4 && !lic.documents.some((d) => /certificate|সনদ/i.test(d.type) || /certificate/i.test(d.name))) {
    // Prototype: any attached file is enough if named/typed as certificate; otherwise allow complete with existing vault.
    return { ok: true };
  }
  return { ok: true };
}

export function canRevert(lic: LicenseCard, caps: ComplianceCaps): boolean {
  return caps.canRenew && lic.stage > 1 && lic.stage < 5;
}

export function nextLine(lic: LicenseCard, caps: ComplianceCaps, user: CurrentUser | null, lang: Lang): string {
  const focal = lic.focalPerson;
  if (lic.stage === 5) {
    return t(`Active until ${lic.certificateValidity}. Nothing for you to do.`, `${lic.certificateValidity} পর্যন্ত সক্রিয়। আপনার করার কিছু নেই।`, lang);
  }
  if (canApproveThisFee(lic, caps)) {
    return t(`Approve the ${lic.feeAmountTk} fee so the application can be filed.`, `আবেদন দাখিলের জন্য ${lic.feeAmountTk} ফি অনুমোদন করুন।`, lang);
  }
  if (lic.stage === 1 && !checklistComplete(lic)) {
    if (caps.canRenew || isFocal(lic, user)) {
      return t(
        `${checklistOpen(lic)} plant check(s) still open. Tick them before filing.`,
        `${checklistOpen(lic)}টি প্ল্যান্ট চেক বাকি। আবেদনের আগে যাচাই করুন।`,
        lang,
      );
    }
    return t(`Waiting for ${focal} to finish the plant checklist.`, `${focal} প্ল্যান্ট চেকলিস্ট শেষ করছেন। আপনার করার কিছু নেই।`, lang);
  }
  if (lic.stage === 1 && lic.fundStatus === 'pending') {
    return t(
      `Waiting for Farida Begum in Finance to approve ${lic.feeAmountTk}.`,
      `অর্থ বিভাগের ফরিদা বেগম ${lic.feeAmountTk} অনুমোদন করছেন।`,
      lang,
    );
  }
  if (lic.stage === 1) {
    if (caps.canRenew) return t('File the application with the issuing agency.', 'ইস্যুকারী সংস্থায় আবেদন দাখিল করুন।', lang);
    return t(`Waiting for the plant team to file with ${lic.agency}.`, `প্ল্যান্ট দল ${lic.agencyBn}-এ আবেদন দাখিল করবে।`, lang);
  }
  if (lic.stage === 2) {
    if (caps.canRenew) return t('Set the inspection date with the agency inspector.', 'সংস্থার পরিদর্শকের সাথে তারিখ ঠিক করুন।', lang);
    return t(`Waiting for the plant team to schedule inspection with ${lic.inspectorName}.`, `প্ল্যান্ট দল ${lic.inspectorName}-এর সাথে পরিদর্শন নির্ধারণ করবে।`, lang);
  }
  if (lic.stage === 3) {
    if (caps.canRenew) return t('Record that the site inspection is complete.', 'সরেজমিন পরিদর্শন সম্পন্ন হয়েছে বলে লিপিবদ্ধ করুন।', lang);
    return t(`Waiting for the plant team to record ${lic.inspectorName}'s inspection.`, `প্ল্যান্ট দল ${lic.inspectorName}-এর পরিদর্শন লিপিবদ্ধ করবে।`, lang);
  }
  if (lic.stage === 4) {
    if (caps.canDispatch && lic.daysLeft <= 30) {
      return t('Sign the DO letter so the ministry can issue the certificate.', 'সনদ দ্রুত পেতে ডিও লেটারে স্বাক্ষর করুন।', lang);
    }
    if (caps.canRenew) {
      return t(
        `Waiting on ${lic.agency}. Record the certificate when it arrives, or send a DO letter to the Chairman to sign.`,
        `${lic.agencyBn}-এর উত্তরের অপেক্ষা। সনদ এলে লিপিবদ্ধ করুন, অথবা চেয়ারম্যানের স্বাক্ষরের জন্য ডিও লেটার পাঠান।`,
        lang,
      );
    }
    return t(`Waiting on ${lic.agency} to issue the certificate.`, `${lic.agencyBn} সনদ ইস্যু করার অপেক্ষা।`, lang);
  }
  return t('No action needed from you.', 'আপনার করার কিছু নেই।', lang);
}

export function stageOf(id: number) {
  return STAGES[(Math.min(5, Math.max(1, id)) - 1) as 0 | 1 | 2 | 3 | 4];
}

export const AGENCY_FILTERS = [
  { id: 'all', label: 'All agencies', labelBn: 'সকল সংস্থা' },
  { id: 'explosives', label: 'Explosives / Fire', labelBn: 'বিস্ফোরক ও ফায়ার', tags: ['fire'] as LicenseCard['tag'][] },
  { id: 'doe', label: 'Environment (DoE)', labelBn: 'পরিবেশ অধিদপ্তর', tags: ['doe'] as LicenseCard['tag'][] },
  { id: 'bsti', label: 'BSTI standards', labelBn: 'বিএসটিআই মান', tags: ['bsti'] as LicenseCard['tag'][] },
  { id: 'trade', label: 'Energy Div quota', labelBn: 'জ্বালানি বিভাগ কোটা', tags: ['trade'] as LicenseCard['tag'][] },
  { id: 'calibration', label: 'Metrology / Boilers', labelBn: 'মেট্রোলজি ও বয়লার', tags: ['env'] as LicenseCard['tag'][] },
];
