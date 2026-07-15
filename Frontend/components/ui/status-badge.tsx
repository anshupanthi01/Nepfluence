import { cn } from "@/lib/utils"

export type BadgeTone = "neutral" | "positive" | "warning" | "negative" | "info"

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  positive: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  negative: "bg-destructive/10 text-destructive",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
}

type StatusBadgeProps = {
  label: string
  tone?: BadgeTone
  className?: string
}

export function StatusBadge({ label, tone = "neutral", className }: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      {label.replaceAll("_", " ")}
    </span>
  )
}
