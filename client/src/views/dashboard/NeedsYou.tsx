import { AlertTriangle, ArrowRight, Info } from 'lucide-react';
import { t, type Lang } from '../../types';
import { Button } from '../../components/ui';
import type { AttentionItem } from './config';

const TONE_ICON = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
} as const;

interface NeedsYouProps {
  items: AttentionItem[];
  lang: Lang;
  onOpen: (item: AttentionItem) => void;
}

/** Plain-language list of what needs the signed-in user, most urgent first. */
export default function NeedsYou({ items, lang, onOpen }: NeedsYouProps) {
  if (items.length === 0) return null;

  const rank = { danger: 0, warning: 1, info: 2 } as const;
  const sorted = [...items].sort((a, b) => rank[a.tone] - rank[b.tone]);

  return (
    <section className="dash-needs" aria-labelledby="dash-needs-title">
      <header>
        <h3 id="dash-needs-title">{t('Needs you today', 'আজ আপনার করণীয়', lang)}</h3>
        <p>
          {t(
            `${sorted.length} ${sorted.length === 1 ? 'thing' : 'things'}, most urgent first.`,
            `${sorted.length.toLocaleString('bn-BD')}টি বিষয়, জরুরিগুলো আগে।`,
            lang,
          )}
        </p>
      </header>
      <ul>
        {sorted.map((item) => {
          const Icon = TONE_ICON[item.tone];
          const canOpen = !!item.cta && (!!item.tab || !!item.view);
          return (
            <li key={item.id} className={`tone-${item.tone}`}>
              <Icon size={16} aria-hidden />
              <span>{t(item.text[0], item.text[1], lang)}</span>
              {canOpen && item.cta && (
                <Button variant="secondary" size="sm" onClick={() => onOpen(item)} icon={<ArrowRight size={13} />}>
                  {t(item.cta[0], item.cta[1], lang)}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
