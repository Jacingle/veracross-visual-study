import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { gradeFormula, gradeFraction } from '@/lib/student-presentation';
import type { Scored, Weight } from '@/lib/grading';
import type { ReactNode } from 'react';

export function GradeCalculation({ items, weights, children }: { items: Scored[]; weights: Weight[]; children: ReactNode }) {
  const formula = gradeFormula(items, weights);
  const fraction = formula ? null : gradeFraction(items, weights);
  if (!formula && !fraction) return <>{children}</>;
  return <TooltipProvider delayDuration={150}><Tooltip><TooltipTrigger asChild><span tabIndex={0} className="inline-flex cursor-help" aria-label="Grade calculation">{children}</span></TooltipTrigger><TooltipContent side="bottom" align="end" sideOffset={8} alignOffset={-37} className="max-w-[calc(100vw-1rem)] rounded-none border border-vc-gray-light/70 bg-vc-hint px-[4px] py-[3px] font-[Arial,sans-serif] text-[17.5px] leading-[21px] text-foreground shadow-none">{formula ? <span className="whitespace-nowrap">{formula}</span> : fraction && <><span className="block border-b border-foreground text-center">{fraction.numerator}</span><span className="block text-center">{fraction.denominator}</span></>}</TooltipContent></Tooltip></TooltipProvider>;
}