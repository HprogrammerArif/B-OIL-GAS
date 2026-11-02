import React, { useId } from 'react';

export interface FormFieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  /** Render prop receives the generated input id for `htmlFor` wiring. */
  children: (id: string) => React.ReactNode;
}

/** Label + control + hint/error, with the id wired for accessibility. */
export default function FormField({ label, hint, error, required = false, children }: FormFieldProps) {
  const id = useId();
  return (
    <div className={`form-group ui-field${error ? ' has-error' : ''}`}>
      <label htmlFor={id} className="ui-field-label">
        {label}
        {required && <span className="ui-field-required" aria-hidden> *</span>}
      </label>
      {children(id)}
      {error ? (
        <div className="ui-field-error" role="alert">{error}</div>
      ) : (
        hint && <div className="ui-field-hint">{hint}</div>
      )}
    </div>
  );
}
