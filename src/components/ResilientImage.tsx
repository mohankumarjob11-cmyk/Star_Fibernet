import { useState } from 'react';
import { Cpu } from 'lucide-react';

interface ResilientImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackLabel,
}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 text-slate-500 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Cpu className="w-8 h-8 text-blue-600/70 mb-2" />
        <span className="text-xs font-medium text-slate-600 line-clamp-2 max-w-[180px]">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
