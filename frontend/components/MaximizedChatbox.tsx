"use client"

import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react"
import { Minimize2, MessageSquare, Send } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ChatRecommendationCard } from "@/components/ChatProductCard"
import { searchProducts } from "@/utils/api"
import { Message, ProductRecommendation } from "@/types"

interface MaximizedChatboxProps {
  onMinimize: () => void
}

const promptExamples = [
  "Find me a gift for a coffee lover",
  "What are the best noise-canceling headphones?",
  "Compare these two products: iPhone 13 vs Samsung Galaxy S21",
]

export function MaximizedChatbox({ onMinimize }: MaximizedChatboxProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! How can I assist you with your shopping today?", sender: "ai" },
  ])
  const [input, setInput] = useState("")
  const [activeTab, setActiveTab] = useState("chat")
  const [isLoading, setIsLoading] = useState(false)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const messageCounter = useRef(2)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const appendMessage = (message: Omit<Message, "id">) => {
    const newMessage = { id: messageCounter.current++, ...message }
    setMessages((prev) => [...prev, newMessage])
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    appendMessage({ text: trimmed, sender: "user" })
    setInput("")
    setIsLoading(true)

    try {
      const searchResults = await searchProducts(trimmed)
      appendMessage({
        sender: "ai",
        text: "Here are a few options that stood out:",
        productRecommendations: searchResults.results ?? [],
      })
    } catch (error) {
      console.error("Error fetching product recommendations", error)
      appendMessage({
        sender: "ai",
        text: "I hit a snag fetching recommendations. Please try again in a moment.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleSend()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const renderMessageBubble = (message: Message) => {
    const isUser = message.sender === "user"
    return (
      <div
        key={message.id}
        className={`flex flex-col gap-3 ${isUser ? "items-end" : "items-start"}`}
        role="group"
        aria-label={isUser ? "User message" : "Assistant message"}
      >
        <div
          className={`max-w-3xl rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card/90 text-foreground ring-1 ring-border/60"
          }`}
        >
          {!isUser ? (
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Assistant
            </span>
          ) : null}
          {message.text}
        </div>
        {message.productRecommendations && message.productRecommendations.length > 0 ? (
          <div className="grid w-full gap-3 md:grid-cols-2" aria-label="Recommended products">
            {message.productRecommendations.map((product: ProductRecommendation) => (
              <ChatRecommendationCard key={product.asin || product.product_title} product={product} />
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  const renderLoadingState = () => (
    <div className="space-y-4" aria-live="polite">
      <Skeleton shimmer className="h-16 w-3/5 rounded-2xl" />
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={`loading-card-${index}`} className="space-y-3 rounded-lg border border-border/60 p-4">
            <Skeleton shimmer className="h-16 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="relative h-2 w-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" aria-hidden="true" />
          <span className="relative block h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
        </span>
        Gathering matches for you…
      </div>
    </div>
  )

  const quickActions = useMemo(
    () => promptExamples.map((example) => ({ label: example, value: example })),
    []
  )

  return (
    <div className="fixed inset-0 z-50 flex bg-background">
      <Tabs defaultValue="chat" className="flex-1">
        <div className="flex h-full">
          <aside className="flex w-64 flex-col border-r bg-card/60 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">AI Shopping Assistant</h2>
              <Button variant="ghost" size="icon" onClick={onMinimize} aria-label="Minimize chat">
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" onClick={() => setActiveTab("chat")}>
                Chat
              </TabsTrigger>
              <TabsTrigger value="settings" onClick={() => setActiveTab("settings")}>
                Settings
              </TabsTrigger>
            </TabsList>

            {activeTab === "chat" ? (
              <ScrollArea className="mt-4 flex-1">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                    Recent prompts
                  </h3>
                  {quickActions.map((action) => (
                    <Button
                      key={action.value}
                      variant="ghost"
                      className="w-full justify-start px-2 text-left text-sm"
                      type="button"
                      onClick={() => {
                        setInput(action.value)
                        textAreaRef.current?.focus()
                      }}
                    >
                      <MessageSquare className="mr-2 h-4 w-4 text-primary" aria-hidden="true" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <p>Settings coming soon. We&apos;ll let you tailor tone, filters, and notifications.</p>
              </div>
            )}
          </aside>

          <div className="flex flex-1 flex-col p-6">
            <ScrollArea className="flex-1 pr-4">
              <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                aria-relevant="additions text"
                className="space-y-6 pr-4"
              >
                {messages.map(renderMessageBubble)}
                {isLoading ? renderLoadingState() : null}
                {messages.length === 1 && !isLoading ? (
                  <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Try asking:</p>
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                      {promptExamples.map((example) => (
                        <li key={example}>
                          <Button
                            variant="outline"
                            className="w-full justify-start whitespace-normal text-left text-sm"
                            type="button"
                            onClick={() => {
                              setInput(example)
                              textAreaRef.current?.focus()
                            }}
                          >
                            {example}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3" aria-label="Send a message">
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <Badge
                    key={`chip-${action.value}`}
                    variant="outline"
                    className="cursor-pointer rounded-full px-3 py-1 text-xs"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setInput(action.value)
                      textAreaRef.current?.focus()
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setInput(action.value)
                        textAreaRef.current?.focus()
                      }
                    }}
                    aria-label={`Use prompt ${action.label}`}
                  >
                    {action.label}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm">
                <Textarea
                  ref={textAreaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask for product ideas, comparisons, or shopping guidance..."
                  aria-label="Message the AI assistant"
                  rows={3}
                  maxLength={600}
                  disabled={isLoading}
                  className="min-h-[96px] resize-none border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Press Enter to send · Shift + Enter for a new line</span>
                  <Button type="submit" size="sm" disabled={isLoading || !input.trim()}>
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <TabsContent value="settings" className="hidden" />
      </Tabs>
    </div>
  )
}