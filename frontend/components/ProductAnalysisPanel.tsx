"use client"

import { Fragment, type HTMLAttributes } from "react"
import { AlertTriangle, MessageCircleWarning, Quote, Smile, ThumbsDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ProductAnalysis, ProductReview, ReviewHighlightItem } from "@/types"

interface ProductAnalysisPanelProps extends HTMLAttributes<HTMLDivElement> {
  analysis?: ProductAnalysis | null
  reviews?: ProductReview[] | null
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

export function ProductAnalysisPanel({ analysis, reviews, className, ...props }: ProductAnalysisPanelProps) {
  if (!analysis && (!reviews || reviews.length === 0)) {
    return null
  }

  const sellingPoints = take(
    analysis?.main_selling_points?.map((point) => {
      if (!point) return null
      const label = [point.title, point.description]
        .filter((value) => Boolean(value && value.trim()))
        .join(": ")

      return label.trim() || null
    })
      .filter((value): value is string => Boolean(value)),
    6
  )

  const positiveHighlights = highlightContent(analysis?.review_highlights?.positive)
  const negativeHighlights = highlightContent(analysis?.review_highlights?.negative)
  const confidence = formatConfidence(analysis?.confidence ?? null)

  const sampleReviews = take(reviews, 2)

  return (
    <section
      className={cn(
        "mt-3 space-y-4 rounded-lg border border-border bg-card/70 p-4 shadow-sm",
        className
      )}
      aria-label="Product analysis details"
      {...props}
    >
      {sellingPoints.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground">Selling points</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {sellingPoints.map((point, idx) => (
              <Badge key={`selling-point-${idx}`} variant="secondary" className="rounded-md px-2.5 py-1 text-xs font-medium">
                {point}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {(positiveHighlights?.length || negativeHighlights?.length) && (
        <Fragment>
          <Separator />
          <div className="grid gap-3 md:grid-cols-2">
            {positiveHighlights?.length ? (
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Smile className="h-4 w-4 text-success" aria-hidden="true" />
                  Positive highlights
                </div>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
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
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ThumbsDown className="h-4 w-4 text-warning" aria-hidden="true" />
                  Watch outs
                </div>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
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
          <Separator />
          <div className="flex items-start gap-2 text-sm text-foreground">
            <MessageCircleWarning className="h-4 w-4 text-primary" aria-hidden="true" />
            <div>
              <span className="font-semibold">Best for:</span> {analysis.best_for}
            </div>
          </div>
        </Fragment>
      )}

      {sampleReviews.length > 0 && (
        <Fragment>
          <Separator />
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Quote className="h-4 w-4 text-secondary" aria-hidden="true" /> Sample reviews
            </h4>
            <div className="mt-2 space-y-3 text-sm text-muted-foreground">
              {sampleReviews.map((review, index) => (
                <blockquote key={`review-${index}`} className="rounded-md border border-border/60 bg-background/60 p-3">
                  <p className="leading-relaxed">{review.content}</p>
                  <footer className="mt-2 flex items-center justify-between text-xs text-muted-foreground/80">
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
          <Separator />
          <div className="flex flex-col gap-3">
            {analysis?.warnings?.length ? (
              <div className="flex items-start gap-2 text-sm text-danger">
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
