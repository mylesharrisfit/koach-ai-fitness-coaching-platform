import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white shadow-none transition-all",
        "placeholder:text-white/25",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30 focus-visible:bg-white/[0.06]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      ref={ref}
      {...props}
    />
  );
})
Textarea.displayName = "Textarea"

export { Textarea }