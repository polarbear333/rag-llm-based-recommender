"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send, X, Maximize2 } from "lucide-react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ChatbotInterfaceProps {
  onExpandChat: () => void
}

interface Message {
  text: string
  isUser: boolean
}

export function ChatbotInterface({ onExpandChat }: ChatbotInterfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { text: input, isUser: true }])
      // Here you would typically send the message to your AI backend
      // and then add the AI's response to the messages
      setInput("")
    }
  }

  return (
    <>
      {!isOpen && (
        <Button
          className="fixed bottom-4 right-4 rounded-full p-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}
      {isOpen && (
        <Card className="fixed bottom-4 right-4 w-80 h-96 shadow-lg flex flex-col">
          <CardHeader className="flex justify-between items-center p-4 border-b">
            <h3 className="font-semibold">AI Assistant</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={onExpandChat}>
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg mb-2 ${
                    msg.isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex w-full"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for recommendations..."
                className="flex-1 mr-2"
              />
              <Button type="submit">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  )
}

