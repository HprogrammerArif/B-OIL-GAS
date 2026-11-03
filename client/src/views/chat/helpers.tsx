import React from 'react';

/** "0:38" → 38. Falls back to `fallback` when the label is missing or malformed. */
export function parseDurationSeconds(label: string | undefined, fallback = 24): number {
  if (!label) return fallback;
  const [m, s] = label.split(':').map((n) => Number.parseInt(n, 10));
  if (Number.isNaN(m) || Number.isNaN(s)) return fallback;
  return m * 60 + s;
}

/** 83 → "1:23". */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Attachments accepted by the composer (client-side check only; the prototype has no upload backend). */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_EXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'] as const;
export const ATTACHMENT_ACCEPT = ALLOWED_ATTACHMENT_EXT.map((e) => `.${e}`).join(',');

export function isAllowedAttachment(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return (ALLOWED_ATTACHMENT_EXT as readonly string[]).includes(ext);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Wraps case-insensitive matches of `query` in <mark>. Returns the text untouched when there is no query. */
export function Highlight({ text, query }: { text: string; query: string }): React.ReactElement {
  const q = query.trim();
  if (q.length < 2) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, 'ig'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="ic-mark">{part}</mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}
