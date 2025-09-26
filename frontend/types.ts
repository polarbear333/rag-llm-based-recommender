export interface ProductReview {
  content: string
  rating: number
  similarity: number
  verified_purchase: boolean
  user_id: string
  timestamp: string
  has_rating?: number
}

export interface ReviewHighlightItem {
  summary?: string | null
  explanation?: string | null
  quote?: string | null
}

export interface ReviewHighlights {
  overall_sentiment?: string | null
  positive?: ReviewHighlightItem[]
  negative?: ReviewHighlightItem[]
}

export interface MainSellingPoint {
  title?: string | null
  description?: string | null
}

export interface KeySpec {
  feature?: string | null
  detail?: string | null
}

export interface ProductAnalysis {
  asin?: string
  main_selling_points?: MainSellingPoint[]
  best_for?: string | null
  review_highlights?: ReviewHighlights
  confidence?: number | null
  warnings?: string[] | null
  notes?: string | null
  key_specs?: KeySpec[]
}

export interface ProductRecommendation {
  asin: string
  product_title?: string
  cleaned_item_description?: string | null
  product_categories?: string | string[]
  product_image_url?: string | null
  image_url?: string | null
  image?: string | null
  thumbnail_url?: string | null
  similarity?: number
  avg_rating?: number | null
  rating_count?: number | null
  displayed_rating?: string | number | null
  combined_score?: number
  reviews?: ProductReview[]
  analysis?: ProductAnalysis
}

export interface Message {
  id: number
  text: string
  sender: "user" | "ai"
  productRecommendations?: ProductRecommendation[]
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  lastMessageAt: string
}

export default {} as {};
