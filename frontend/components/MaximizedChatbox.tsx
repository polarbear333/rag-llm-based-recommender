"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Minimize2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { searchProducts } from "@/utils/api"
import { ChatRecommendationCard } from "./ChatProductCard"  // Import the renamed component
import { ProductRecommendation, Message } from "@/types"
import { OrbitProgress } from "react-loading-indicators";


interface MaximizedChatboxProps {
  onMinimize: () => void
}

// Using shared types from `frontend/types.ts`

const promptExamples = [
  "Find me a gift for a coffee lover.",
  "What are the best noise-canceling headphones?",
  "Compare these two products: iPhone 13 vs Samsung Galaxy S21.",
]

export function MaximizedChatbox({ onMinimize }: MaximizedChatboxProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! How can I assist you with your shopping today?", sender: "ai" },
  ])
  const [input, setInput] = useState("")
  const [activeTab, setActiveTab] = useState("chat")
  const [isLoading, setIsLoading] = useState(false)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage: Message = { id: messages.length + 1, text: input, sender: "user" }
  setMessages((prev: Message[]) => [...prev, userMessage])
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
  setMessages((prev: Message[]) => [...prev, aiMessage])
      } catch (error) {
        console.error("Error fetching product recommendations:", error)
        const errorMessage: Message = {
          id: messages.length + 2,
          text: "I'm sorry, I couldn't fetch product recommendations at the moment. Please try again later.",
          sender: "ai",
        }
  setMessages((prev: Message[]) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex">
      <Tabs defaultValue="chat" className="flex-1 flex">
        <div className="w-64 border-r p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">AI Shopping Assistant</h2>
            <Button variant="ghost" size="icon" onClick={onMinimize}>
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="chat" onClick={() => setActiveTab("chat")}>
              Chat
            </TabsTrigger>
            <TabsTrigger value="settings" onClick={() => setActiveTab("settings")}>
              Settings
            </TabsTrigger>
          </TabsList>
          {activeTab === "chat" && (
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                <h3 className="font-medium">Conversation History</h3>
                <Button variant="ghost" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Previous Chat 1
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Previous Chat 2
                </Button>
              </div>
            </ScrollArea>
          )}
          {activeTab === "settings" && (
            <div className="flex-1">
              <h3 className="font-medium mb-2">Settings</h3>
              <p className="text-sm text-muted-foreground">Customize your AI assistant experience here.</p>
            </div>
          )}
        </div>
        <TabsContent value="chat" className="flex-1 flex flex-col p-4">
          <ScrollArea className="flex-1 pr-4">
            <div ref={scrollRef} className="pr-4">
            {messages.map((message: Message) => (
              <div key={message.id} className={`mb-4 ${message.sender === "user" ? "text-right" : "text-left"}`}>
                <div
                  className={`inline-block p-3 rounded-lg ${
                    message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {message.text}
                </div>
                {message.productRecommendations && (
                  <div className="mt-4 space-y-4">
                    {message.productRecommendations.map((product: ProductRecommendation) => (
                      <ChatRecommendationCard key={product.asin || product.product_title} product={product} maxWidth="2xl" showFullButton={false} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            </div>
            {isLoading && (
                <div className="flex justify-center items-center py-4">
                  <OrbitProgress size="medium" color="#3b82f6" />
                  <p className="text-sm text-muted-foreground ml-2">Searching for products...</p>
                </div>
              )}
            {messages.length === 1 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Try asking:</h3>
                <ul className="space-y-2">
                  {promptExamples.map((example, index) => (
                    <li key={index}>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left h-auto whitespace-normal"
                        onClick={() => setInput(example)}
                      >
                        {example}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </ScrollArea>
          <div className="mt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center space-x-2"
            >
              <Input
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </form>
          </div>
        </TabsContent>
        <TabsContent value="settings" className="flex-1 p-4">
          <h2 className="text-2xl font-bold mb-4">Settings</h2>
          <p>Customize your AI shopping assistant experience here.</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}