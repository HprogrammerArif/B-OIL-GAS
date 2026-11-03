import { t, type Lang } from '../../types';
import type { StatusTone } from '../../components/ui';
import { isTurnOf, pendingStepOf, type NoteFile } from '../../store/notesheetStore';
import type { AppRole } from '../../types';

/** Where a file stands from the signed-in user's point of view. */
export type FileState = 'mine' | 'waiting' | 'returned' | 'approved';

export function fileStateOf(file: NoteFile, role: AppRole | undefined, canSign: boolean): FileState {
  if (file.status === 'approved') return 'approved';
  if (file.status === 'in_review') return 'returned';
  if (role && canSign && isTurnOf(file, role)) return 'mine';
  return 'waiting';
}

export const STATE_TONE: Record<FileState, StatusTone> = {
  mine: 'gold',
  waiting: 'neutral',
  returned: 'warn',
  approved: 'success',
};

export function stateLabel(state: FileState, file: NoteFile, lang: Lang): string {
  switch (state) {
    case 'approved':
      return t('Approved', 'অনুমোদিত', lang);
    case 'returned':
      return t('Returned for correction', 'সংশোধনের জন্য ফেরত', lang);
    case 'mine':
      return t('Needs your signature', 'আপনার স্বাক্ষর প্রয়োজন', lang);
    default: {
      const who = pendingStepOf(file)?.officerName;
      return who ? t(`Awaiting ${who}`, `${who}-এর অপেক্ষায়`, lang) : t('In progress', 'প্রক্রিয়াধীন', lang);
    }
  }
}

export const URGENCY_TONE: Record<NoteFile['urgency'], StatusTone> = {
  urgent: 'danger',
  high: 'warn',
  normal: 'info',
};

export function urgencyLabel(urgency: NoteFile['urgency'], lang: Lang): string {
  if (urgency === 'urgent') return t('Urgent', 'জরুরি', lang);
  if (urgency === 'high') return t('High priority', 'উচ্চ অগ্রাধিকার', lang);
  return t('Normal', 'সাধারণ', lang);
}

export function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter((p) => p && !/^(engr|md|mr|mrs|ms|dr|adv|eng)\.?$/i.test(p));
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

/** Whole signed count / route length for the progress meter. */
export function signProgress(file: NoteFile): { done: number; total: number } {
  const route = file.signatoryRoute ?? [];
  if (route.length > 0) return { done: route.filter((s) => s.status === 'signed').length, total: route.length };
  const done = file.notes.filter((n) => n.hash).length;
  return { done, total: Math.max(done, 1) };
}
