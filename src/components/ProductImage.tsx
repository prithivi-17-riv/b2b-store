'use client';

import React, { useState } from 'react';
import { Package } from 'lucide-react';
import clsx from 'clsx';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProductImage({
  src,
  alt,
  className,
  size = 'md',
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg text-xs',
    md: 'w-11 h-11 rounded-xl text-sm',
    lg: 'w-16 h-16 rounded-2xl text-base',
  }[size];

  if (!src || hasError) {
    return (
      <div
        className={clsx(
          'flex items-center justify-center bg-slate-100 border border-slate-200 text-slate-400 shrink-0 font-bold',
          sizeClasses,
          className
        )}
        title={alt}
      >
        <Package className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'} />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'relative shrink-0 overflow-hidden bg-slate-100 border border-slate-200/80 shadow-2xs group',
        sizeClasses,
        className
      )}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
      />
    </div>
  );
}
