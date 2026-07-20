import { cn } from '../../lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'light' | 'dark';
  className?: string;
}

const sizeMap = {
  sm: { box: 'h-9 w-9', text: 'text-lg', sub: 'text-[10px]' },
  md: { box: 'h-12 w-12', text: 'text-2xl', sub: 'text-xs' },
  lg: { box: 'h-16 w-16', text: 'text-3xl', sub: 'text-sm' },
  xl: { box: 'h-20 w-20', text: 'text-4xl', sub: 'text-sm' },
};

export function Logo({ size = 'md', showText = true, variant = 'dark', className }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img
        src="/file_000000003dc88208becc724d945594bb.png"
        alt="APNA SAMAN"
        className={cn('object-contain rounded-2xl', s.box)}
      />
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
