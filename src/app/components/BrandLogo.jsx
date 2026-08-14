'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function BrandLogo({ size = 36, className }) {
  return (
    <Image
      src="/logo.png"
      alt="SmartiTV"
      width={size}
      height={size}
      className={cn('rounded-xl object-cover', className)}
      priority
    />
  );
}
