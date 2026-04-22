import type { InputHTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      'h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-hidden ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring',
      className,
    )}
    {...props}
  />
);
