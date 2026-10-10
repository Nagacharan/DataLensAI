import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  icon: Icon = null,
  onClick,
  type = 'button',
  title,
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-coral-500 hover:bg-coral-600 text-white shadow-sm hover:shadow focus:ring-coral-500',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60 focus:ring-slate-400',
    accent: 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm focus:ring-indigo-500',
    danger: 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 focus:ring-rose-500',
    success: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 focus:ring-emerald-500',
    ghost: 'hover:bg-slate-100 text-slate-600 hover:text-slate-900',
    outline: 'border border-coral-500/60 text-coral-600 hover:bg-coral-50 focus:ring-coral-500',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-xs sm:text-sm px-4 py-2 gap-2',
    lg: 'text-sm sm:text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      {children}
    </button>
  );
}
