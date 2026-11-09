import { useState } from 'react';
import { Hash } from 'lucide-react';
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
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<'name' | 'members' | null>(null);

  const reset = () => {
    setName('');
    setDescription('');
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
      size="sm"
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
      <p className="ui-page-desc" style={{ marginBottom: 14 }}>
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
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('e.g. Weekly tank review', 'যেমন সাপ্তাহিক ট্যাংক পর্যালোচনা', lang)}
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
            value={description}
            maxLength={120}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('Daily decisions among these leaders', 'এই নেতাদের দৈনিক সিদ্ধান্ত', lang)}
          />
        )}
      </FormField>
      <fieldset className="ic-room-members-fieldset">
        <legend className="ui-field-label">
          {t('Leaders in this room', 'এই রুমের নেতৃবৃন্দ', lang)}
          <span className="ui-field-required" aria-hidden> *</span>
        </legend>
        {error === 'members' && (
          <div className="ui-field-error" role="alert">
            {t('Pick at least one other leader.', 'অন্তত আর একজন নেতা বেছে নিন।', lang)}
          </div>
        )}
        <ul className="ic-room-member-picks">
          {members.map((m) => (
            <li key={m.id}>
              <label className="ic-room-member-pick">
                <input
                  type="checkbox"
                  checked={selected.has(m.id)}
                  onChange={() => toggle(m.id)}
                />
                <span className="ic-avatar" aria-hidden>{m.initials}</span>
                <span>
                  <strong>{m.name}</strong>
                  <small>{m.role}</small>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    </Modal>
  );
}
