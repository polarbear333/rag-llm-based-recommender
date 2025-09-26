import { KeySpec } from "@/types"
import { cn } from "@/lib/utils"

interface KeySpecsTableProps {
  specs?: KeySpec[] | null
  caption?: string
  className?: string
}

export function KeySpecsTable({ specs, caption = "Key specs", className }: KeySpecsTableProps) {
  const rows = (specs ?? []).filter((spec): spec is KeySpec => Boolean(spec?.feature && spec?.detail))

  if (rows.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-background/80 shadow-sm backdrop-blur",
        className
      )}
    >
      <div className="bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
        {caption}
      </div>
      <table className="w-full border-collapse text-sm" aria-label={caption}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th className="w-32 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground/80 md:w-40">
              Feature
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
              Detail
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((spec, index) => (
            <tr key={`${spec.feature}-${index}`} className="align-top">
              <th
                scope="row"
                className="w-32 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground/80 md:w-40"
              >
                {spec.feature}
              </th>
              <td className="px-4 py-3 text-muted-foreground">{spec.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
