import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, extra, children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-100 ${className}`}
    >
      {(title || extra) && (
        <div className="flex items-center justify-between border-b border-slate-100" style={{ padding: '20px 32px' }}>
          {title && (
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          )}
          {extra && <div>{extra}</div>}
        </div>
      )}
      <div style={{ padding: '24px 32px' }}>{children}</div>
    </div>
  );
}
