import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-35 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] active:scale-[0.98]",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20",
        outline:
          "border border-white/[0.08] bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white hover:border-white/[0.12]",
        secondary:
          "bg-card text-white/70 border border-white/[0.06] hover:bg-card-elevated hover:text-white",
        ghost:
          "text-white/60 hover:bg-white/[0.05] hover:text-white",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm:      "h-8 rounded-lg px-3.5 text-xs",
        lg:      "h-11 rounded-xl px-7 text-[15px]",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }