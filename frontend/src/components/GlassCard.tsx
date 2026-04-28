import { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  style?: CSSProperties;
}

export function GlassCard({ children, className, hover = false, style }: GlassCardProps) {
  return (
    <div
      className={cn(
        hover ? 'glass-card-hover' : 'glass-card',
        'p-6',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
