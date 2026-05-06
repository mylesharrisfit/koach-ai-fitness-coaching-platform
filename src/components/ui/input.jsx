import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white shadow-none transition-all",
        "placeholder:text-white/25",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30 focus-visible:bg-white/[0.06]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      ref={ref}
      {...props}
    />
  );
})
Input.displayName = "Input"

export { Input }