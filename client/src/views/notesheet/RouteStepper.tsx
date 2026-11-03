import { Check, Clock, PenTool } from 'lucide-react';
import { t, type Lang } from '../../types';
import type { SignatoryStep } from '../../components/notesheet/InitiateNotesheetModal';
import type { NoteFile } from '../../store/notesheetStore';

interface RouteStepperProps {
  file: NoteFile;
  lang: Lang;
  /** Role of the signed-in user, to label "You". */
  myRole?: string;
}

function stepCaption(step: SignatoryStep, returned: boolean, lang: Lang): string {
  if (step.status === 'signed') return step.signedAt ?? t('Signed', 'স্বাক্ষরিত', lang);
  if (step.status === 'pending') {
    return returned ? t('On hold: returned', 'স্থগিত: ফেরত', lang) : t('Awaiting signature', 'স্বাক্ষরের অপেক্ষায়', lang);
  }
  return t('Not yet reached', 'এখনও পৌঁছায়নি', lang);
}

/** Sequential signatory route: who has signed, who is next, who is still ahead. */
export default function RouteStepper({ file, lang, myRole }: RouteStepperProps) {
  const route = file.signatoryRoute ?? [];
  if (route.length === 0) return null;
  const returned = file.status === 'in_review';

  return (
    <section className="ns-route" aria-label={t('Approval route', 'অনুমোদনের ধারা', lang)}>
      <h4 className="ns-label">{t('Approval route', 'অনুমোদনের ধারা', lang)}</h4>
      <ol className="ns-steps">
        {route.map((step, idx) => {
          const state = step.status === 'pending' && returned ? 'held' : step.status;
          return (
            <li key={step.id || idx} className={`ns-step is-${state}`}>
              <span className="ns-step-mark" aria-hidden>
                {step.status === 'signed' ? <Check size={14} /> : step.status === 'pending' ? <PenTool size={13} /> : <Clock size={13} />}
              </span>
              <span className="ns-step-body">
                <strong>
                  {step.officerName}
                  {myRole === step.roleId && <em>{t('You', 'আপনি', lang)}</em>}
                </strong>
                <span className="ns-step-role">{t(step.roleName, step.roleNameBn, lang)}</span>
                <span className="ns-step-cap">{stepCaption(step, returned, lang)}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
