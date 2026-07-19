import { ShoppingBag, Package } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'light' | 'dark';
  className?: string;
}

const sizeMap = {
  sm: { box: 'h-9 w-9', bag: 18, pkg: 11, text: 'text-lg', sub: 'text-[10px]' },
  md: { box: 'h-12 w-12', bag: 24, pkg: 14, text: 'text-2xl', sub: 'text-xs' },
  lg: { box: 'h-16 w-16', bag: 32, pkg: 18, text: 'text-3xl', sub: 'text-sm' },
  xl: { box: 'h-20 w-20', bag: 40, pkg: 22, text: 'text-4xl', sub: 'text-sm' },
};

export function Logo({ size = 'md', showText = true, variant = 'dark', className }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'relative grid place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-glow',
          s.box,
        )}
      >
        <ShoppingBag size={s.bag} className="text-white" strokeWidth={2.2} />
        <div className="absolute -bottom-1.5 -right-1.5 grid place-items-center rounded-xl bg-white shadow-card ring-2 ring-brand-600 p-1">
          <Package size={s.pkg} className="text-brand-700" strokeWidth={2.5} />
        </div>
      </div>
      {showText && (
        <div className="leading-tight">
          <div
            className={cn(
              'font-extrabold tracking-tight',
              s.text,
              variant === 'light' ? 'text-white' : 'text-ink-900',
            )}
          >
            APNA <span className="text-brand-600">SAMAN</span>
          </div>
          <div
            className={cn(
              'font-medium tracking-wide',
              s.sub,
              variant === 'light' ? 'text-brand-100' : 'text-ink-500',
            )}
          >
            Har Dukaan Ka Wholesale Partner
          </div>
        </div>
      )}
    </div>
  );
}
