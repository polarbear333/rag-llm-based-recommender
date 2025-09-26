"use client"

import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react"
import { Maximize2, MessageCircle, Send, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { ChatRecommendationCard } from "@/components/ChatProductCard"
import { searchProducts } from "@/utils/api"
import { Message, ProductRecommendation } from "@/types"
import { useChatSessionStore, initializeChatSession } from "@/lib/chat-session-store"
import { useChatActions } from "@/lib/use-chat-actions"

interface ChatboxOverlayProps {
  onClose: () => void
  onMaximize: () => void
  isOpen: boolean
  onOpen: () => void
}

const quickPrompts = [
  "Show me trending smart home devices",
  "I need a laptop under $1,000",
  "Find eco-friendly kitchen essentials",
]

export function ChatboxOverlay({ onClose, onMaximize, isOpen, onOpen }: ChatboxOverlayProps) {
  const { input, isLoading, setInput, getCurrentMessages } = useChatSessionStore()
  const { sendMessage } = useChatActions()

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Initialize session on mount
  useEffect(() => {
    initializeChatSession()
  }, [])

  const messages = getCurrentMessages()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSend = async () => {
    await sendMessage(input)
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

  const renderLoading = () => (
    <div className="space-y-3" aria-live="polite">
      <Skeleton shimmer className="h-12 w-4/5 rounded-2xl" />
      <div className="space-y-2 rounded-lg border border-border/70 p-3">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-6 w-full" />
      </div>
    </div>
  )

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 bg-indigo-600 text-white hover:bg-indigo-700"
        onClick={onOpen}
        aria-label="Open AI shopping assistant"
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        Chat with AI
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 flex h-[520px] w-96 flex-col overflow-hidden rounded-3xl border border-border/60 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between px-5 pb-3 pt-4">
        <CardTitle className="text-base font-semibold">AI Shopping Assistant</CardTitle>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={onMaximize} aria-label="Open full chat">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close chat">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden px-0">
        <ScrollArea className="h-full px-5">
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            className="space-y-6"
          >
            {messages.map((message) => {
              const isUser = message.sender === "user"
              return (
                <div key={message.id} className={`flex flex-col gap-4 ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-3xl rounded-3xl px-5 py-3.5 text-sm leading-relaxed shadow-sm transition ${
                      isUser
                        ? "bg-indigo-600 text-white"
                        : "bg-card/95 text-foreground ring-1 ring-border/70"
                    }`}
                  >
                    {!isUser ? (
                      <span className="mb-1 block text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                        Assistant
                      </span>
                    ) : null}
                    {message.text}
                  </div>

                  {message.productRecommendations?.length ? (
                    // make cards smaller by giving them an explicit maxWidth and
                    // increase gap so the two cards are more visually separated
                    <div className="grid w-full gap-6 sm:grid-cols-1 md:grid-cols-2">
                      {message.productRecommendations.map((product: ProductRecommendation) => (
                        <ChatRecommendationCard key={product.asin || product.product_title} product={product} />
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}

            {isLoading ? renderLoading() : null}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t border-border/60 px-5 pb-5 pt-4">
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3" aria-label="Send a message">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <Badge
                key={prompt}
                variant="outline"
                role="button"
                tabIndex={0}
                onClick={() => {
                  setInput(prompt)
                  textareaRef.current?.focus()
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    setInput(prompt)
                    textareaRef.current?.focus()
                  }
                }}
                className="cursor-pointer rounded-full px-2.5 py-1 text-[0.65rem] font-medium"
                aria-label={`Use suggestion ${prompt}`}
              >
                {prompt}
              </Badge>
            ))}
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for product ideas..."
              aria-label="Message the AI assistant"
              rows={3}
              className="min-h-[72px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
              maxLength={400}
              disabled={isLoading}
            />
            <div className="mt-2 flex items-center justify-between text-[0.7rem] text-muted-foreground">
              <span>Enter to send · Shift + Enter for a new line</span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isLoading || !input.trim()}
                    className="shadow-sm bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </Button>
            </div>
          </div>
        </form>
      </CardFooter>
    </Card>
  )
}