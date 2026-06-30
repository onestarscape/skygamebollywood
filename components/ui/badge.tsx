import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold", {
  variants: {
    variant: {
      default: "bg-white/10 text-zinc-100",
      green: "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30",
      yellow: "bg-amber-500/20 text-amber-100 ring-1 ring-amber-300/30",
      red: "bg-red-500/20 text-red-100 ring-1 ring-red-400/30"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
