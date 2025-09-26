import { useMemo, useState } from "react"
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Package,
  Sparkles,
  Star,
  Tag,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ProductAnalysisPanel } from "@/components/ProductAnalysisPanel"
import { KeySpecsTable } from "@/components/KeySpecsTable"
import { cn } from "@/lib/utils"
import { /* parseAdditionalDetails, parseMainDescription, */ /* splitDescriptionToBullets */ } from "@/utils/descriptionParser"
import { getKeySpecs } from "@/utils/keySpecs"
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
  maxWidth,
  showFullButton = false,
}: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const title = product.product_title?.trim() || "Untitled product"
  const productImage = useMemo(() => {
    const candidates = [
      product.product_image_url,
      product.image_url,
      product.image,
      product.thumbnail_url,
    ]

    const found = candidates.find((value): value is string => typeof value === "string" && value.trim().length > 0)
    return found ?? null
  }, [product.image, product.image_url, product.product_image_url, product.thumbnail_url])

  const imageAlt = productImage ? `${title} product photo` : `${title} placeholder`

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

    // intentionally do not fallback to cleaned_item_description here for the product card
    return []
  }, [product.analysis?.main_selling_points, product.product_categories])

  const warnings = (product.analysis?.warnings ?? []).filter((warning): warning is string => Boolean(warning))
  const hasWarnings = warnings.length > 0
  const primaryWarning = warnings[0]
  const additionalWarnings = warnings.length > 1 ? warnings.length - 1 : 0

  const keySpecs = useMemo(() => {
    return getKeySpecs(product.analysis, product.cleaned_item_description)
  }, [product.analysis, product.cleaned_item_description])

  // removed description/supporting details from the product card (use analysis/keySpecs only)

  const accentBadgeClasses = [
    "border-primary/30 bg-primary/10 text-primary",
    "border-secondary/30 bg-secondary/10 text-secondary",
    "border-success/30 bg-success/10 text-success",
    "border-accent/30 bg-accent/10 text-accent",
  ]

  const productDetailUrl = useMemo(() => {
    if (product.asin) {
      return `https://www.amazon.com/dp/${product.asin}`
    }

    if (product.product_title) {
      return `https://www.google.com/search?q=${encodeURIComponent(product.product_title)}`
    }

    return null
  }, [product.asin, product.product_title])

  const handleViewProduct = () => {
    if (!productDetailUrl) return
    if (typeof window !== "undefined") {
      window.open(productDetailUrl, "_blank", "noopener,noreferrer")
    }
  }

  const cardStyle = useMemo(() => {
    if (maxWidth === undefined || maxWidth === null) return undefined
    if (typeof maxWidth === "number") {
      return { maxWidth: `${maxWidth}px` }
    }
    if (typeof maxWidth === "string") {
      return { maxWidth }
    }
    return undefined
  }, [maxWidth])

  return (
    <Card
      role="article"
      tabIndex={0}
      aria-label={title}
      className={cn(
        "group mx-auto relative flex w-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/95 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      )}
      style={cardStyle}
    >
      {/* match percentage moved next to rating count label */}

      <div className="flex flex-col gap-6 p-6">
        {/* allow children to stretch full width instead of centering to avoid large side whitespace */}
        <div className="flex flex-col gap-5 items-stretch">
          <div className="w-full flex items-center justify-center">
            <div className="relative flex h-48 md:h-60 lg:h-72 w-full max-w-[48rem] md:max-w-[72rem] items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/40 shadow-inner">
              {productImage ? (
                <img src={productImage} alt={imageAlt} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <Package className="h-16 w-16 text-muted-foreground/70" aria-hidden="true" />
              )}
            </div>
          </div>

          {/* content column: allow the content to grow and use a larger responsive max-width */}
          <div className="w-full flex min-w-0 flex-1 flex-col gap-4 max-w-[48rem] md:max-w-[72rem]">
            <div className="space-y-3">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold leading-snug text-foreground">{title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-foreground/90">
                    <Star className="h-4 w-4 fill-warning/90 text-warning" aria-hidden="true" />
                    {ratingDisplay ?? "Not rated"}
                  </span>
                  {ratingCountLabel ? (
                    <span aria-label="Rating count" className="inline-flex items-center gap-2">
                      <span>{ratingCountLabel}</span>
                      <Badge
                        variant={matchVariant}
                        className="inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium h-9 px-3 shadow-sm bg-secondary text-foreground"
                      >
                        {matchPercent}% match
                      </Badge>
                    </span>
                  ) : null}
                </div>
              </div>

              {keySpecs.length > 0 ? <KeySpecsTable specs={keySpecs} /> : null}
            </div>

            {chips.length > 0 ? (
              <div className="flex flex-wrap gap-2" aria-label="Product tags">
                {chips.map((chip, index) => (
                  <Badge
                    key={`${product.asin ?? index}-chip-${index}`}
                    variant="outline"
                    className={cn(
                      "whitespace-normal rounded-full px-3 py-1 text-[0.72rem] font-medium",
                      accentBadgeClasses[index % accentBadgeClasses.length]
                    )}
                    title={chip}
                  >
                    <Tag className="mr-1 h-3 w-3" aria-hidden="true" />
                    {chip}
                  </Badge>
                ))}
              </div>
            ) : null}

            {product.analysis?.best_for ? (
              <div className="flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-primary">
                <Sparkles className="mt-0.5 h-4 w-4" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-primary/90">Best for:</span> {product.analysis.best_for}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3">
          {hasWarnings ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-label="Review warnings"
              aria-expanded={isExpanded}
              className="border-warning/40 bg-warning/10 text-warning hover:bg-warning/20"
            >
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs font-semibold">
                {primaryWarning}
                {additionalWarnings > 0 ? ` (+${additionalWarnings})` : ""}
              </span>
            </Button>
          ) : (
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="border-success/40 bg-success/10 px-3 py-1 text-success">
                Safe pick
              </Badge>
              No warnings reported
            </span>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shadow-sm"
              onClick={handleViewProduct}
              disabled={!productDetailUrl}
            >
              View product
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              aria-controls={`analysis-${product.asin}`}
              className="gap-1 text-xs uppercase"
            >
              Insights {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {isExpanded ? (
          <ProductAnalysisPanel
            analysis={product.analysis}
            reviews={product.reviews}
            description={product.cleaned_item_description}
            id={`analysis-${product.asin}`}
            className="mt-4"
          />
        ) : null}

        {showFullButton ? (
          <Button variant="secondary" className="w-full" onClick={handleViewProduct} disabled={!productDetailUrl}>
            View product details
          </Button>
        ) : null}
      </div>
    </Card>
  )
}