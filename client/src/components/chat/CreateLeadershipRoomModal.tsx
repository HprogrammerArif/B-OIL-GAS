import { useMemo, useState } from 'react';
import { Hash, Search } from 'lucide-react';
import { t, type Lang } from '../../types';
import { Button, FormField, Modal } from '../ui';
import type { ChatMember } from '../../store/operationsStore';

interface CreateLeadershipRoomModalProps {
  open: boolean;
  lang: Lang;
  members: ChatMember[];
  onClose: () => void;
  onCreate: (name: string, description: string, memberIds: string[]) => 'name' | 'members' | void;
}

function matchesQuery(member: ChatMember, query: string): boolean {
  if (!query) return true;
  const hay = `${member.name} ${member.role}`.toLowerCase();
  return hay.includes(query);
}

/** Chairman opens a leadership room with chosen leaders (BR-15-18). */
export default function CreateLeadershipRoomModal({
  open,
  lang,
  members,
  onClose,
  onCreate,
}: CreateLeadershipRoomModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<'name' | 'members' | null>(null);

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => members.filter((m) => matchesQuery(m, q)), [members, q]);

  const reset = () => {
    setName('');
    setDescription('');
    setQuery('');
    setSelected(new Set());
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = () => {
    const result = onCreate(name, description, [...selected]);
    if (result) {
      setError(result);
      return;
    }
    close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      icon={<Hash size={16} />}
      title={t('New leadership room', 'নতুন নেতৃত্ব রুম', lang)}
      footer={(
        <>
          <Button variant="secondary" size="sm" onClick={close}>
            {t('Cancel', 'বাতিল', lang)}
          </Button>
          <Button variant="gold" size="sm" onClick={submit}>
            {t('Open room', 'রুম খুলুন', lang)}
          </Button>
        </>
      )}
    >
      <div className="ic-create-room">
        <p className="ui-page-desc">
          {t(
            'Name the room and pick who should be in it. You are added as admin.',
            'রুমের নাম দিন এবং কারা থাকবেন তা বেছে নিন। আপনি অ্যাডমিন হিসেবে যুক্ত থাকবেন।',
            lang,
          )}
        </p>
        <FormField
          label={t('Room name', 'রুমের নাম', lang)}
          required
          error={error === 'name' ? t('Use 2–60 characters.', '২–৬০ অক্ষর দিন।', lang) : undefined}
        >
          {(id) => (
            <input
              id={id}
              type="text"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('e.g. Weekly tank review', 'যেমন সাপ্তাহিক ট্যাংক পর্যালোচনা', lang)}
              autoComplete="off"
            />
          )}
        </FormField>
        <FormField
          label={t('Purpose', 'উদ্দেশ্য', lang)}
          hint={t('One line, so people know why this room exists.', 'এক লাইনে বলুন এই রুম কেন।', lang)}
        >
          {(id) => (
            <input
              id={id}
              type="text"
              value={description}
              maxLength={120}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('Daily decisions among these leaders', 'এই নেতাদের দৈনিক সিদ্ধান্ত', lang)}
              autoComplete="off"
            />
          )}
        </FormField>
        <fieldset className="ic-room-members-fieldset">
          <legend className="ic-create-room-legend">
            {t('Leaders in this room', 'এই রুমের নেতৃবৃন্দ', lang)}
            <span className="ui-field-required" aria-hidden> *</span>
          </legend>
          <div className="ic-create-room-members-hd" aria-hidden>
            <span className="ui-field-label">
              {t('Leaders in this room', 'এই রুমের নেতৃবৃন্দ', lang)}
              <span className="ui-field-required"> *</span>
            </span>
            <span className="ic-create-room-count">
              {t(`${selected.size} selected`, `${selected.size} জন নির্বাচিত`, lang)}
            </span>
          </div>
          {error === 'members' && (
            <div className="ui-field-error" role="alert">
              {t('Pick at least one other leader.', 'অন্তত আর একজন নেতা বেছে নিন।', lang)}
            </div>
          )}
          <div className="ic-create-room-search">
            <Search size={15} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Search by name', 'নাম দিয়ে খুঁজুন', lang)}
              aria-label={t('Search leaders by name', 'নাম দিয়ে নেতা খুঁজুন', lang)}
              autoComplete="off"
            />
          </div>
          {visible.length === 0 ? (
            <p className="ic-create-room-empty">
              {t('No leader matches that name.', 'এই নামে কোনো নেতা নেই।', lang)}
            </p>
          ) : (
            <ul className="ic-room-member-picks">
              {visible.map((m) => {
                const on = selected.has(m.id);
                return (
                  <li key={m.id}>
                    <label className={`ic-room-member-pick${on ? ' is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(m.id)}
                      />
                      <span className="ic-room-member-check" aria-hidden />
                      <span className="ic-avatar" aria-hidden>{m.initials}</span>
                      <span>
                        <strong>{m.name}</strong>
                        <small>{m.role}</small>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </fieldset>
      </div>
    </Modal>
  );
}
