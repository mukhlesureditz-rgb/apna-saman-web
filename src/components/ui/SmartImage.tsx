import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SmartImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  rounded?: string;
}

export function SmartImage({ src, alt, className, fallbackClassName, rounded = 'rounded-2xl' }: SmartImageProps) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || errored) {
    return (
      <div
        className={cn(
          'grid place-items-center bg-gradient-to-br from-brand-50 to-ink-100 text-brand-400',
          rounded,
          fallbackClassName ?? className,
        )}
      >
        <div className="flex flex-col items-center gap-1 text-brand-300">
          <ImageOff size={32} strokeWidth={1.5} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden bg-ink-100', rounded, className)}>
      {!loaded && <div className="absolute inset-0 skeleton" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  );
}
