import { useMemo, useState } from "react"
import { AlertTriangle, ChevronDown, ChevronUp, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ProductAnalysisPanel } from "@/components/ProductAnalysisPanel"
import { cn } from "@/lib/utils"
import { splitDescriptionToBullets } from "@/utils/descriptionParser"
import { ProductRecommendation } from "@/types"

interface ProductCardProps {
  product: ProductRecommendation
  maxWidth?: string
  showFullButton?: boolean
}

const parseCategories = (categories?: string | string[] | null) => {
  if (!categories) return []
  if (Array.isArray(categories)) {
    return categories.map((value) => value.trim()).filter(Boolean)
  }
  return categories
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export function ChatRecommendationCard({
  product,
  maxWidth = "2xl",
  showFullButton = false,
}: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const title = product.product_title?.trim() || "Untitled product"
  const imageUrl = "/placeholder.svg"

  const matchPercent = useMemo(() => {
    const raw = product.combined_score ?? product.similarity ?? 0
    const normalized = raw > 1 ? raw : raw * 100
    return clamp(Math.round(normalized), 0, 100)
  }, [product.combined_score, product.similarity])

  const matchVariant = matchPercent >= 80 ? "success" : matchPercent >= 60 ? "warning" : "secondary"

  const ratingDisplay = useMemo(() => {
    if (product.displayed_rating !== undefined && product.displayed_rating !== null) {
      return Number(product.displayed_rating).toFixed(1)
    }

    if (typeof product.avg_rating === "number") {
      return product.avg_rating.toFixed(1)
    }

    return null
  }, [product.displayed_rating, product.avg_rating])

  const ratingCountLabel = useMemo(() => {
    if (typeof product.rating_count === "number" && product.rating_count > 0) {
      if (product.rating_count >= 1000) {
        return `${(product.rating_count / 1000).toFixed(1)}k reviews`
      }
      return `${product.rating_count} review${product.rating_count === 1 ? "" : "s"}`
    }
    return null
  }, [product.rating_count])

  const chips = useMemo(() => {
    const sellingPoints = product.analysis?.main_selling_points
      ?.map((point) => {
        if (!point) return null
        const slot = [point.title, point.description]
          .filter((value) => Boolean(value && value.trim()))
          .join(": ")
          .trim()
        return slot || null
      })
      .filter((value): value is string => Boolean(value))

    if (sellingPoints && sellingPoints.length > 0) {
      return sellingPoints.slice(0, 3)
    }

    const categories = parseCategories(product.product_categories)
    if (categories.length > 0) {
      return categories.slice(0, 3)
    }

    return splitDescriptionToBullets(product.cleaned_item_description).slice(0, 3)
  }, [product.analysis?.main_selling_points, product.product_categories, product.cleaned_item_description])

  const warnings = (product.analysis?.warnings ?? []).filter((warning): warning is string => Boolean(warning))
  const hasWarnings = warnings.length > 0

  return (
    <Card
      role="article"
      tabIndex={0}
      aria-label={title}
      className={cn(
        "relative w-full border-border/80 bg-card/95 shadow-card transition hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        typeof maxWidth === "string" ? `max-w-${maxWidth}` : undefined
      )}
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
            <img
              src={imageUrl}
              alt={title ? `${title} thumbnail` : "Product image"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {hasWarnings ? (
              <Badge
                variant="warning"
                className="absolute -top-2 -right-2 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide"
              >
                Warning
              </Badge>
            ) : null}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning/80 text-warning" aria-hidden="true" />
                    <span>{ratingDisplay ?? "Not rated"}</span>
                  </span>
                  {ratingCountLabel ? <span aria-label="Rating count">· {ratingCountLabel}</span> : null}
                </div>
              </div>

              <Badge variant={matchVariant} className="px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                {matchPercent}% match
              </Badge>
            </div>

            {chips.length > 0 ? (
              <div className="flex flex-wrap gap-2" aria-label="Key selling points">
                {chips.map((chip, index) => (
                  <Badge
                    key={`${product.asin ?? index}-chip-${index}`}
                    variant="outline"
                    className="truncate rounded-md border-border/60 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    title={chip}
                  >
                    {chip}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {product.analysis?.best_for ? (
          <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Best for:</span> {product.analysis.best_for}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          {hasWarnings ? (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-md border border-transparent bg-warning/20 px-2 py-1 text-xs font-semibold text-warning transition hover:bg-warning/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/60"
              aria-label="View warnings"
              aria-expanded={isExpanded}
            >
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              {warnings[0]}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">No warnings reported</span>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            aria-controls={`analysis-${product.asin}`}
            className="ml-auto inline-flex items-center gap-1 text-xs"
          >
            Details {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {isExpanded ? (
          <ProductAnalysisPanel
            analysis={product.analysis}
            reviews={product.reviews}
            id={`analysis-${product.asin}`}
          />
        ) : null}

        {showFullButton ? (
          <Button variant="secondary" className="w-full">
            View product details
          </Button>
        ) : null}
      </div>
    </Card>
  )
}