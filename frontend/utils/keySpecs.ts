import { KeySpec, ProductAnalysis } from "@/types"

const MAX_ITEMS = 8
const MAX_FEATURE_WORDS = 6
const MAX_DETAIL_LENGTH = 200

const sanitizeKeySpecs = (specs?: KeySpec[] | null): KeySpec[] => {
  if (!Array.isArray(specs)) {
    return []
  }

  const seen = new Set<string>()
  const normalized: KeySpec[] = []

  for (const spec of specs) {
    if (!spec) continue

    const feature = (spec.feature ?? "").trim()
    const detail = (spec.detail ?? "").trim()

    if (!feature || !detail) continue

    const featureWords = feature.split(/\s+/).slice(0, MAX_FEATURE_WORDS)
    const normalizedFeature = featureWords.join(" ").trim()
    if (!normalizedFeature) continue

    const key = normalizedFeature.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    const clippedDetail =
      detail.length > MAX_DETAIL_LENGTH ? `${detail.slice(0, MAX_DETAIL_LENGTH - 1).trimEnd()}…` : detail

    normalized.push({ feature: normalizedFeature, detail: clippedDetail })

    if (normalized.length >= MAX_ITEMS) break
  }

  return normalized
}

const deriveKeySpecsFromDescription = (description?: string | null): KeySpec[] => {
  if (typeof description !== "string") {
    return []
  }

  let normalized = description.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
  if (!normalized) {
    return []
  }

  normalized = normalized
    .replace(/\[/g, "\n")
    .replace(/\]/g, "\n")
    .replace(/,\s*:/g, ":")
    .replace(/\s{2,}/g, " ")

  const segments = normalized.split(/\n|•|;|(?<!\d),(?=\s*[A-Z])/)

  const seen = new Set<string>()
  const specs: KeySpec[] = []

  for (const fragment of segments) {
    let candidate = fragment.trim()
    if (!candidate) continue

  if (!candidate.includes(":") && candidate.includes(" - ")) {
      candidate = candidate.replace(" - ", ": ")
    }

    if (!candidate.includes(":")) continue

    const [featurePart, ...detailParts] = candidate.split(":")
    let feature = featurePart.replace(/^[•\-\s]+/, "").replace(/[.,;\s]+$/, "").trim()
    if (feature.includes(".")) {
      const segments = feature.split(/[.?!]\s*/)
      feature = segments[segments.length - 1]?.trim() ?? feature
    }
    let detail = detailParts.join(":").replace(/^[•\-\s]+/, "").trim()

    if (!feature || !detail) continue

    const featureWords = feature.split(/\s+/).slice(0, MAX_FEATURE_WORDS)
    feature = featureWords.join(" ").trim()
    if (!feature) continue

    const key = feature.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    if (detail.length > MAX_DETAIL_LENGTH) {
      detail = `${detail.slice(0, MAX_DETAIL_LENGTH - 1).trimEnd()}…`
    }

    specs.push({ feature, detail })

    if (specs.length >= MAX_ITEMS) break
  }

  return specs
}

export const getKeySpecs = (
  analysis?: ProductAnalysis | null,
  description?: string | null
): KeySpec[] => {
  const fromAnalysis = sanitizeKeySpecs(analysis?.key_specs)
  if (fromAnalysis.length > 0) {
    return fromAnalysis
  }

  return sanitizeKeySpecs(deriveKeySpecsFromDescription(description))
}

