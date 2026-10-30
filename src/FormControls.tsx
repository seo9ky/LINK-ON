import type { SelectHTMLAttributes } from 'react';

export function SelectField({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <span className="select-field">
    <select {...props}>{children}</select>
    <span className="select-indicator" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 18 18"><path d="m5 7 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  </span>;
}
