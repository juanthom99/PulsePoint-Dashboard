// shadcn/ui Card primitive, styled for PulsePoint. MIT attribution in THIRD_PARTY.md.
import { cn } from '@/lib/utils';
export function Card({ className, ...props }) {
  return <div data-slot="card" className={cn('flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm', className)} {...props} />;
}
export function CardHeader({ className, ...props }) {
  return <div data-slot="card-header" className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />;
}
export function CardTitle({ className, ...props }) {
  return <h2 data-slot="card-title" className={cn('font-semibold leading-none tracking-tight', className)} {...props} />;
}
export function CardContent({ className, ...props }) {
  return <div data-slot="card-content" className={cn('p-6 pt-0', className)} {...props} />;
}
