import React from 'react';
import { Lang, t } from '../types';
import { useNoticeStore } from '../store/noticeStore';
import { showToast } from './ToastManager';
import { Megaphone, CheckCircle2, X } from 'lucide-react';

interface AnnouncementBannerProps {
  lang: Lang;
}

/** Company-wide live announcement strip shown under the topbar. */
export default function AnnouncementBanner({ lang }: AnnouncementBannerProps) {
  const { activeBroadcast, dismissActiveBroadcast, acknowledgeNotice } = useNoticeStore();
  if (!activeBroadcast) return null;

  return (
    <div className="announcement-banner">
      <div className="announcement-banner-main">
        <div className="announcement-banner-icon">
          <Megaphone size={16} color="var(--status-warning-bright)" />
        </div>
        <div>
          <div className="announcement-banner-title">
            <span className="announcement-banner-tag">{t('COMPANY ANNOUNCEMENT', 'বিশেষ ঘোষণা', lang)}</span>
            <span>{activeBroadcast.title}</span>
          </div>
          <div className="announcement-banner-body">
            {activeBroadcast.body} — <strong>{activeBroadcast.author}</strong>
          </div>
        </div>
      </div>

      <div className="announcement-banner-actions">
        {activeBroadcast.requireAck && (
          <button
            type="button"
            className="announcement-banner-ack"
            onClick={() => {
              acknowledgeNotice(`NOT-${activeBroadcast.id}`);
              dismissActiveBroadcast();
              showToast(
                t('Announcement acknowledged and saved to Notice Board.', 'ঘোষণাটি পঠিত হিসেবে নিশ্চিত করা হয়েছে।', lang),
                'gold'
              );
            }}
          >
            <CheckCircle2 size={13} />
            <span>{t('Acknowledge', 'পঠিত নিশ্চিত করুন', lang)}</span>
          </button>
        )}
        <button
          type="button"
          className="announcement-banner-dismiss"
          onClick={dismissActiveBroadcast}
          title={t('Dismiss banner', 'বন্ধ করুন', lang)}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
