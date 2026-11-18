import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { gradeFraction } from '@/lib/student-presentation';
import type { Scored, Weight } from '@/lib/grading';
import type { ReactNode } from 'react';

export function GradeCalculation({ items, weights, children }: { items: Scored[]; weights: Weight[]; children: ReactNode }) {
  const fraction = gradeFraction(items, weights);
  if (!fraction) return <>{children}</>;
  return <TooltipProvider delayDuration={150}><Tooltip><TooltipTrigger asChild><span tabIndex={0} className="inline-flex cursor-help" aria-label="Grade calculation">{children}</span></TooltipTrigger><TooltipContent side="bottom" align="end" className="max-w-[calc(100vw-2rem)] rounded-none border border-foreground/70 bg-vc-note px-1.5 py-0.5 text-[16px] leading-[21px] text-foreground shadow-none"><span className="block border-b border-foreground text-center">{fraction.numerator}</span><span className="block text-center">{fraction.denominator}</span></TooltipContent></Tooltip></TooltipProvider>;
}