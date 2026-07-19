import type { ReactNode } from 'react';
import { Logo } from '../../components/ui/Logo';
import { ShieldCheck, Truck, Clock } from 'lucide-react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  admin?: boolean;
}

export function AuthShell({ title, subtitle, children, footer, admin }: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50 via-white to-white">
      <div className="px-6 pt-10 pb-6">
        <Logo size="md" />
      </div>

      <div className="flex-1 flex flex-col px-6 pb-10">
        <div className="mx-auto w-full max-w-md">
          <div className="card p-6 sm:p-7 animate-fade-in">
            <h1 className="text-2xl font-extrabold text-ink-900">{title}</h1>
            <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>
            <div className="mt-6">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>}
          </div>

          {!admin && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Free Delivery' },
                { icon: Clock, label: '20 Min Delivery' },
                { icon: ShieldCheck, label: 'COD Only' },
              ].map((f) => (
                <div
                  key={f.label}
                  className="card p-3 flex flex-col items-center gap-1.5 text-center"
                >
                  <f.icon size={20} className="text-brand-600" />
                  <span className="text-[11px] font-semibold text-ink-600">{f.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
