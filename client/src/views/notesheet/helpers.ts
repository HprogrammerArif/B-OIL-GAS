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

/** "৳1,42,00,000" -> 14200000. Returns null when the text holds no amount (e.g. "Company policy"). */
export function parseTaka(text: string): number | null {
  const match = text.match(/^\s*(?:৳|Tk\.?)?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*$/i);
  return match ? Number(match[1].replace(/,/g, '')) : null;
}

/** First sentence of a paragraph, trimmed to `max` characters. */
export function firstSentence(text: string, max = 170): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const end = clean.search(/[.!?](\s|$)/);
  const sentence = end > 0 ? clean.slice(0, end + 1) : clean;
  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
}

interface NextStepContext {
  isFinal: boolean;
  awaitingName: string;
  nextName: string | null;
  initiator: string;
  dept: string;
}

/** One plain sentence: what happens next, and whether the viewer has to do anything. */
export function nextStepText(state: FileState, ctx: NextStepContext, lang: Lang): string {
  switch (state) {
    case 'mine':
      return ctx.isFinal
        ? t('You are the last approver. Your signature approves this request and closes the file.', 'আপনি শেষ অনুমোদনকারী। আপনার স্বাক্ষরে আবেদনটি অনুমোদিত হয়ে ফাইল নিষ্পন্ন হবে।', lang)
        : t(
          `Read the paragraphs below. Sign to pass it to ${ctx.nextName ?? 'the next officer'}, or return it if something is wrong.`,
          `নিচের অনুচ্ছেদগুলো পড়ুন। স্বাক্ষর করে ${ctx.nextName ?? 'পরবর্তী কর্মকর্তা'}-কে পাঠান, কিছু ভুল থাকলে ফেরত দিন।`,
          lang,
        );
    case 'waiting':
      return t(`${ctx.awaitingName} is reviewing it. Nothing for you to do.`, `${ctx.awaitingName} পর্যালোচনা করছেন। আপনার কিছু করার নেই।`, lang);
    case 'returned':
      return t(
        `Sent back to ${ctx.initiator} with questions. It continues once they fix it and send it again.`,
        `প্রশ্নসহ ${ctx.initiator}-এর কাছে ফেরত গেছে। তিনি ঠিক করে আবার পাঠালে এগোবে।`,
        lang,
      );
    default:
      return t(
        `Everyone on the route has signed. ${ctx.dept} can go ahead.`,
        `রুটের সবাই স্বাক্ষর করেছেন। ${ctx.dept} এগিয়ে যেতে পারে।`,
        lang,
      );
  }
}
