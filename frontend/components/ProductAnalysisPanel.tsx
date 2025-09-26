"use client"

import { Fragment, type HTMLAttributes } from "react"
import { AlertTriangle, MessageCircleWarning, Quote, Smile, ThumbsDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
// removed key-spec extraction and table display from Insights panel (handled in product card)
import { ProductAnalysis, ProductReview, ReviewHighlightItem } from "@/types"

interface ProductAnalysisPanelProps extends HTMLAttributes<HTMLDivElement> {
  analysis?: ProductAnalysis | null
  reviews?: ProductReview[] | null
  description?: string | null
}

const take = <T,>(items: T[] | undefined | null, count: number): T[] => {
  if (!items || items.length === 0) {
    return []
  }

  return items.slice(0, count)
}

const highlightContent = (items?: ReviewHighlightItem[] | null) => {
  if (!items || items.length === 0) {
    return null
  }

  return items
    .map((item) => item?.summary || item?.explanation || item?.quote)
    .filter((value): value is string => Boolean(value && value.trim()))
}

const formatConfidence = (value?: number | null) => {
  if (typeof value !== "number") {
    return null
  }

  if (value <= 1) {
    return `${Math.round(value * 100)}%`
  }

  if (value <= 100) {
    return `${Math.round(value)}%`
  }

  return `${Math.round(value)}%`
}

export function ProductAnalysisPanel({ analysis, reviews, description, className, ...props }: ProductAnalysisPanelProps) {
  if (!analysis && (!reviews || reviews.length === 0)) {
    return null
  }

  // key specs and selling points removed from Insights panel — these are shown on the product card

  const positiveHighlights = highlightContent(analysis?.review_highlights?.positive)
  const negativeHighlights = highlightContent(analysis?.review_highlights?.negative)
  const confidence = formatConfidence(analysis?.confidence ?? null)

  const sampleReviews = take(reviews, 2)

  return (
    <section
      className={cn(
        "mt-4 space-y-5 rounded-2xl border border-border/70 bg-background/80 p-5 shadow-sm backdrop-blur",
        className
      )}
      aria-label="Product analysis details"
      {...props}
    >
      {/* key specs and selling points intentionally omitted here */}

      {(positiveHighlights?.length || negativeHighlights?.length) && (
        <Fragment>
          <Separator className="border-border/60" />
          <div className="grid gap-4 md:grid-cols-2">
            {positiveHighlights?.length ? (
              <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-success">
                  <Smile className="h-4 w-4" aria-hidden="true" />
                  What people love
                </div>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-success/90">
                  {positiveHighlights.map((content, index) => (
                    <li key={`positive-${index}`} className="flex items-start gap-2">
                      <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                      <span>{content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {negativeHighlights?.length ? (
              <div className="rounded-xl border border-warning/25 bg-warning/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-warning">
                  <ThumbsDown className="h-4 w-4" aria-hidden="true" />
                  Things to consider
                </div>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-warning/90">
                  {negativeHighlights.map((content, index) => (
                    <li key={`negative-${index}`} className="flex items-start gap-2">
                      <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
                      <span>{content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Fragment>
      )}

      {analysis?.best_for && (
        <Fragment>
          <Separator className="border-border/60" />
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
            <MessageCircleWarning className="mt-0.5 h-4 w-4" aria-hidden="true" />
            <div>
              <span className="font-semibold">Best for:</span> {analysis.best_for}
            </div>
          </div>
        </Fragment>
      )}

      {sampleReviews.length > 0 && (
        <Fragment>
          <Separator className="border-border/60" />
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Quote className="h-4 w-4 text-secondary" aria-hidden="true" />
              Snapshot from reviews
            </h4>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground">
              {sampleReviews.map((review, index) => (
                <blockquote
                  key={`review-${index}`}
                  className="rounded-xl border border-border/70 bg-background/90 p-4 shadow-inner"
                >
                  <p className="leading-relaxed">{review.content}</p>
                  <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground/80">
                    <span className="font-medium">Rating: {review.rating ?? "NA"}</span>
                    {review.timestamp ? (
                      <time dateTime={review.timestamp}>
                        {new Date(review.timestamp).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                    ) : null}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </Fragment>
      )}

      {(analysis?.warnings?.length || confidence) && (
        <Fragment>
          <Separator className="border-border/60" />
          <div className="flex flex-col gap-3">
            {analysis?.warnings?.length ? (
              <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
                <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden="true" />
                <ul className="space-y-1">
                  {analysis.warnings.map((warning, index) => (
                    <li key={`warning-${index}`}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {confidence ? (
              <div className="text-xs text-muted-foreground">
                Confidence score: <span className="font-semibold text-foreground">{confidence}</span>
              </div>
            ) : null}
          </div>
        </Fragment>
      )}
    </section>
  )
}
