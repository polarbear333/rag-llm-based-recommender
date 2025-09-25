"use client"

import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react"
import { Maximize2, MessageCircle, Send, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

interface ChatbotInterfaceProps {
  onExpandChat: () => void
}

interface MessageItem {
  id: number
  text: string
  sender: "user" | "ai"
}

const suggestions = [
  "Show me gift ideas for tech enthusiasts",
  "What workout gear is trending right now?",
  "Find highly rated budget TVs",
]

export function ChatbotInterface({ onExpandChat }: ChatbotInterfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const messageCounter = useRef(1)

  useEffect(() => {
    if (!isOpen) return
    if (messages.length === 0) {
      setMessages([
        {
          id: messageCounter.current++,
          sender: "ai",
          text: "Hi! Ask for product ideas, comparisons, or reviews whenever you&apos;re ready.",
        },
      ])
    }
  }, [isOpen, messages.length])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isThinking])

  const appendMessage = (message: Omit<MessageItem, "id">) => {
    setMessages((prev) => [...prev, { id: messageCounter.current++, ...message }])
  }

  const simulateAssistantReply = () => {
    setIsThinking(true)
    setTimeout(() => {
      appendMessage({
        sender: "ai",
        text: "Got it! Tap the expand icon to see richer recommendations powered by the full assistant UI.",
      })
      setIsThinking(false)
    }, 900)
  }

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return

    appendMessage({ sender: "user", text: trimmed })
    setInput("")
    simulateAssistantReply()
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

  return (
    <>
      {!isOpen ? (
        <Button
          className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
          onClick={() => {
            setIsOpen(true)
            requestAnimationFrame(() => textareaRef.current?.focus())
          }}
          aria-label="Open quick chat"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          Ask AI
        </Button>
      ) : null}

      {isOpen ? (
        <Card className="fixed bottom-4 right-4 z-40 flex h-96 w-80 flex-col overflow-hidden rounded-3xl border border-border/70 shadow-card">
          <CardHeader className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Quick chat</span>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="icon" onClick={onExpandChat} aria-label="Open full chat">
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close chat">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden px-0">
            <ScrollArea className="h-full px-4">
              <div ref={scrollRef} role="log" aria-live="polite" aria-relevant="additions text" className="space-y-3 py-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card/95 text-foreground ring-1 ring-border/70"
                      }`}
                    >
                      {message.sender === "ai" ? (
                        <span className="mb-1 block text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                          Assistant
                        </span>
                      ) : null}
                      {message.text}
                    </div>
                  </div>
                ))}

                {isThinking ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Skeleton shimmer className="h-9 w-24 rounded-full" />
                    Typing…
                  </div>
                ) : null}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t border-border/60 px-4 py-3">
            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2" aria-label="Send a message">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer rounded-full px-2.5 py-0.5 text-[0.6rem] font-medium"
                    onClick={() => {
                      setInput(suggestion)
                      textareaRef.current?.focus()
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setInput(suggestion)
                        textareaRef.current?.focus()
                      }
                    }}
                    aria-label={`Use suggestion ${suggestion}`}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask for a product tip..."
                  aria-label="Message the assistant"
                  rows={3}
                  className="min-h-[72px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
                  disabled={isThinking}
                  maxLength={300}
                />
                <div className="mt-2 flex items-center justify-between text-[0.65rem] text-muted-foreground">
                  <span>Enter to send · Shift + Enter for a new line</span>
                  <Button type="submit" size="sm" disabled={!input.trim() || isThinking}>
                    <Send className="mr-1.5 h-4 w-4" />
                    Send
                  </Button>
                </div>
              </div>
            </form>
          </CardFooter>
        </Card>
      ) : null}
    </>
  )
}

