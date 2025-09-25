// utils/descriptionParser.ts
export const parseMainDescription = (text: string): string => {
  const bullets = splitDescriptionToBullets(text)
  if (bullets.length > 0) {
    const firstBullet = bullets[0]
    const openBracketIndex = firstBullet.indexOf("[")
    if (openBracketIndex !== -1) {
      return firstBullet.substring(openBracketIndex + 1)
    }
    return firstBullet
  }
  return text
}

export const parseAdditionalDetails = (text: string): string[] => {
  const bullets = splitDescriptionToBullets(text)
  return bullets.slice(1)
}

export const splitDescriptionToBullets = (text?: string | null): string[] => {
  if (typeof text !== "string") {
    return []
  }

  const trimmed = text.trim()
  if (!trimmed) {
    return []
  }

  const pattern = /(•\s|\.\s+|\]\s+|\d+\.\s|\[•\]\s)/

  return trimmed
    .split(pattern)
    .map((part) => part.trim())
    .filter((part) => {
      return (
        part.length > 1 &&
        !/^\d+$/.test(part) &&
        !/^[•\-]\s*$/.test(part)
      )
    })
}