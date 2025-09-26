"use client"

import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react"
import { Minimize2, MessageSquare, Send, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChatRecommendationCard } from "@/components/ChatProductCard"
import { searchProducts } from "@/utils/api"
import { Message, ProductRecommendation } from "@/types"
import { useChatSessionStore, initializeChatSession } from "@/lib/chat-session-store"
import { useChatActions } from "@/lib/use-chat-actions"

interface MaximizedChatboxProps {
  onMinimize: () => void
}

const promptExamples = [
  "Find me a gift for a coffee lover",
  "What are the best noise-canceling headphones?",
  "Compare these two products: iPhone 13 vs Samsung Galaxy S21",
]

export function MaximizedChatbox({ onMinimize }: MaximizedChatboxProps) {
  const { 
    input, 
    isLoading, 
    setInput, 
    getCurrentMessages, 
    sessions, 
    currentSessionId 
  } = useChatSessionStore()
  const { sendMessage, startNewConversation, switchToChat, deleteChat } = useChatActions()
  const [activeTab, setActiveTab] = useState("chat")
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

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

  const renderMessageBubble = (message: Message) => {
    const isUser = message.sender === "user"
    return (
      <div
        key={message.id}
        className={`flex flex-col gap-4 ${isUser ? "items-end" : "items-start"}`}
        role="group"
        aria-label={isUser ? "User message" : "Assistant message"}
      >
        <div
          className={`max-w-3xl rounded-3xl px-5 py-3.5 text-sm leading-relaxed shadow-sm transition ${
            isUser
              ? "bg-indigo-600 text-white"
              : "bg-card/95 text-foreground ring-1 ring-border/60"
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
          <div className="grid w-full gap-x-10 gap-y-10 justify-items-center items-start sm:grid-cols-1 md:grid-cols-2" aria-label="Recommended products">
            {message.productRecommendations.map((product: ProductRecommendation) => (
              <ChatRecommendationCard key={product.asin || product.product_title} product={product} maxWidth="820px" />
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  const renderLoadingState = () => (
    <div className="space-y-5" aria-live="polite">
      <Skeleton shimmer className="h-16 w-3/5 rounded-2xl" />
      <div className="grid gap-y-8 gap-x-16 justify-items-center items-start sm:grid-cols-1 md:grid-cols-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`loading-card-${index}`}
            className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm max-w-[820px] w-full"
          >
            <div className="flex items-start gap-3">
              <Skeleton shimmer className="h-16 w-16 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3.5 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-3.5 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
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

  const handleNewChat = () => {
    startNewConversation()
  }

  const handleSwitchToSession = (sessionId: string) => {
    switchToChat(sessionId)
  }

  const handleDeleteSession = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setSessionToDelete(sessionId)
  }

  const confirmDeleteSession = () => {
    if (sessionToDelete) {
      deleteChat(sessionToDelete)
      setSessionToDelete(null)
    }
  }

  const getSessionToDeleteTitle = () => {
    if (!sessionToDelete) return ""
    const session = sessions.find(s => s.id === sessionToDelete)
    return session?.title || "Untitled Chat"
  }

  const cancelDeleteSession = () => {
    setSessionToDelete(null)
  }



  return (
    <div className="fixed inset-0 z-50 flex bg-background">
      <Tabs defaultValue="chat" className="flex-1">
        <div className="flex h-full">
          <aside className="flex w-64 flex-col border-r bg-card/60 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">AI Shopping Assistant</h2>
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
              <ScrollArea className="mt-3 flex-1">
                <div className="space-y-3">
                  {/* New Chat Button */}
                  <div className="space-y-2 mx-1">
                    <Button
                      variant="outline"
                      className="w-56 justify-start text-left h-9 px-3 rounded-md max-w-full"
                      type="button"
                      onClick={handleNewChat}
                    >
                      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                      New Chat
                    </Button>
                  </div>

                  {/* Recent Chats */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                      Recent Chats
                    </h3>
                    <div className="space-y-0.5">
                      {sessions.length > 0 ? (
                        sessions.slice(0, 8).map((session) => (
                          <div
                            key={session.id}
                            className={`group flex items-center gap-1 rounded-md px-2 py-1 mx-1 hover:bg-muted/50 ${
                              session.id === currentSessionId ? 'bg-muted' : ''
                            }`}
                          >
                            <Button
                              variant="ghost"
                              className="w-48 justify-start px-1 text-left text-xs h-8 min-w-0 max-w-full"
                              type="button"
                              onClick={() => handleSwitchToSession(session.id)}
                            >
                              <MessageSquare className="mr-2 h-3 w-3 text-primary flex-shrink-0" aria-hidden="true" />
                              <span className="truncate text-xs leading-tight">{session.title}</span>
                            </Button>
                            {sessions.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-60 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all flex-shrink-0"
                                onClick={(e) => handleDeleteSession(session.id, e)}
                                title="Delete chat"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-muted-foreground text-xs px-2 py-2">
                          No chats yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Example Prompts */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                      Example Prompts
                    </h3>
                    <div className="space-y-0.5">
                      {quickActions.map((action) => (
                        <div key={action.value} className="mx-1">
                          <Button
                            variant="ghost"
                            className="w-56 justify-start px-2 text-left text-xs h-8 min-w-0 rounded-md max-w-full"
                            type="button"
                            onClick={() => {
                              setInput(action.value)
                              textAreaRef.current?.focus()
                            }}
                          >
                            <MessageSquare className="mr-2 h-2.5 w-2.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                            <span className="truncate text-xs leading-tight">{action.label}</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="mt-6 space-y-4 text-sm">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                    Chat Management
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNewChat}
                    className="w-full justify-start text-left"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Start New Chat
                  </Button>
                </div>
                <div className="space-y-2 text-muted-foreground">
                  <p>Chat history is stored in your current browser session and will be cleared when you close the tab.</p>
                  <p>More settings coming soon. We&apos;ll let you tailor tone, filters, and notifications.</p>
                </div>
              </div>
            )}
          </aside>

          <div className="flex flex-1 flex-col bg-muted/20 p-6">
            <ScrollArea className="flex-1 pr-4">
              <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                aria-relevant="additions text"
                className="space-y-8 pr-4"
              >
                {messages.map(renderMessageBubble)}
                {isLoading ? renderLoadingState() : null}
                {messages.length === 1 && !isLoading ? (
                  <div className="rounded-xl border border-dashed border-border/70 bg-card/80 p-5 text-sm text-muted-foreground">
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

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" aria-label="Send a message">
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <Badge
                    key={`chip-${action.value}`}
                    variant="outline"
                    className="cursor-pointer rounded-full border-border/60 px-3 py-1 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/10"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setInput(action.value)
                      textAreaRef.current?.focus()
                    }}
                    onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
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
              <div className="flex flex-col gap-3 rounded-3xl border border-border/80 bg-card/90 p-5 shadow-lg">
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
                  className="min-h-[96px] resize-none border-0 bg-transparent text-sm leading-relaxed shadow-none focus-visible:ring-0"
                />
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>Press Enter to send · Shift + Enter for a new line</span>
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
          </div>
        </div>

        <TabsContent value="settings" className="hidden" />
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{getSessionToDeleteTitle()}"</strong>? This action cannot be undone and all messages in this conversation will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteSession}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}