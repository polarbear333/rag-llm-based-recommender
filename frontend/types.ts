export interface ProductReview {
  content: string
  rating: number
  similarity: number
  verified_purchase: boolean
  user_id: string
  timestamp: string
}

export interface ProductRecommendation {
  asin: string
  product_title?: string
  cleaned_item_description?: string
  product_categories?: string
  similarity: number
  avg_rating: number
  displayed_rating: number
  combined_score: number
  explanation: string
  reviews?: ProductReview[]
}

export interface Message {
  id: number
  text: string
  sender: "user" | "ai"
  productRecommendations?: ProductRecommendation[]
}

export default {} as {};
