"use client"

import { useState } from "react"
import { X, Send, Maximize2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { searchProducts } from "@/utils/api"
import { ProductCard } from "./ChatProductCard"  // Import the new component
import { OrbitProgress } from "react-loading-indicators";

interface ChatboxOverlayProps {
  onClose: () => void
  onMaximize: () => void
  isOpen: boolean
  onOpen: () => void
}

interface ProductReview {
  content: string
  rating: number
  similarity: number
  verified_purchase: boolean
  user_id: string
  timestamp: string
}

interface ProductRecommendation {
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

interface Message {
  id: number
  text: string
  sender: "user" | "ai"
  productRecommendations?: ProductRecommendation[]
}

export function ChatboxOverlay({ onClose, onMaximize, isOpen, onOpen }: ChatboxOverlayProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! How can I assist you with your shopping today?", sender: "ai" },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage: Message = { id: messages.length + 1, text: input, sender: "user" }
      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsLoading(true)

      try {
        const searchResults = await searchProducts(input)
        const aiMessage: Message = {
          id: messages.length + 2,
          text: "Based on your query, here are some product recommendations:",
          sender: "ai",
          productRecommendations: searchResults.results,
        }
        setMessages((prev) => [...prev, aiMessage])
      } catch (error) {
        console.error("Error fetching product recommendations:", error)
        const errorMessage: Message = {
          id: messages.length + 2,
          text: "I'm sorry, I couldn't fetch product recommendations at the moment. Please try again later.",
          sender: "ai",
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    }
  }

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-4 right-4 rounded-full p-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
        onClick={onOpen}
      >
        <MessageCircle className="w-6 h-6 mr-2" />
        AI Shopping Assistant
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[500px] shadow-xl flex flex-col z-50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>AI Shopping Assistant</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={onMaximize}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full px-4">
          {messages.map((message) => (
            <div key={message.id} className={`mb-4 ${message.sender === "user" ? "text-right" : "text-left"}`}>
              <div
                className={`inline-block p-3 rounded-lg ${
                  message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                } max-w-[85%]`}
              >
                {message.text}
              </div>

              {message.productRecommendations && message.productRecommendations.length > 0 && (
                <div className="mt-3 space-y-2 text-left">
                  {message.productRecommendations.map((product, index) => (
                    <ProductCard key={index} product={product} />
                  ))}
                </div>
              )}
            </div>
          ))}
              {/* Add loading indicator here */}
          {isLoading && (
            <div className="flex justify-center items-center py-4">
              <OrbitProgress size="medium" color="#3b82f6" />
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex w-full items-center space-x-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}