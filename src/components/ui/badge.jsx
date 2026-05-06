import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/15 text-primary hover:bg-primary/20",
        secondary:
          "border-white/[0.06] bg-white/[0.05] text-white/60 hover:bg-white/[0.08]",
        destructive:
          "border-transparent bg-destructive/15 text-destructive",
        outline:
          "border-white/[0.08] text-white/50",
        success:
          "border-transparent bg-success/15 text-success",
        warning:
          "border-transparent bg-warning/15 text-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }