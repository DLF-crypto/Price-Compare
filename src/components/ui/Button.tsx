import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 shadow-sm hover:shadow-md',
    secondary:
      'bg-white text-sky-600 border border-sky-300 hover:bg-sky-50 hover:border-sky-400',
    danger:
      'bg-red-500 text-white hover:bg-red-600 shadow-sm',
    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 14px', fontSize: '12px' },
    md: { padding: '10px 20px', fontSize: '14px' },
    lg: { padding: '12px 28px', fontSize: '16px' },
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      style={sizeStyles[size]}
      {...props}
    >
      {children}
    </button>
  );
}
