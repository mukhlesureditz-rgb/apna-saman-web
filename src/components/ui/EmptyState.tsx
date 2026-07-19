import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-14 animate-fade-in ${className ?? ''}`}
    >
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-3xl bg-brand-100 blur-xl opacity-60" />
        <div className="relative grid place-items-center h-20 w-20 rounded-3xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200">
          <Icon className="text-brand-600" size={36} strokeWidth={1.8} />
        </div>
      </div>
      <h3 className="text-lg font-bold text-ink-900">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-ink-500 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
