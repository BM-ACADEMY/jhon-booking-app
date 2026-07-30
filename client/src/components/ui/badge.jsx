import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-100 text-primary-800 hover:bg-primary-200/80",
        secondary:
          "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200/80",
        destructive:
          "border-transparent bg-red-100 text-red-800 hover:bg-red-200/80",
        success:
          "border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-200/80",
        warning:
          "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200/80",
        outline: "text-gray-950 border-gray-200",
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
