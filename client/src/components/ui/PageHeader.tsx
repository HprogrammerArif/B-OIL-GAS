import React from 'react';

export interface PageHeaderProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

/** Title block at the top of a view: heading, one-line description, actions. */
export default function PageHeader({ title, description, actions, meta, className = '' }: PageHeaderProps) {
  const hasText = (title != null && title !== '') || !!description || !!meta;
  return (
    <div className={`ui-page-header ${className}`.trim()}>
      {hasText && (
        <div className="ui-page-header-text">
          {title != null && title !== '' && <h2 className="ui-page-title">{title}</h2>}
          {description && <p className="ui-page-desc">{description}</p>}
          {meta && <div className="ui-page-meta">{meta}</div>}
        </div>
      )}
      {actions && <div className="ui-page-actions">{actions}</div>}
    </div>
  );
}
