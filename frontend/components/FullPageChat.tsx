"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, ArrowLeft } from "lucide-react"

export function FullPageChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([])
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
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 flex items-center">
        <Button variant="ghost" onClick={onClose} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">AI Assistant - Full Chat</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[80%] ${
              msg.isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted mr-auto"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </main>
      <footer className="border-t p-4 flex items-center">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about our products..."
          className="flex-1 mr-4"
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
        />
        <Button onClick={handleSend}>
          <Send className="w-5 h-5 mr-2" />
          Send
        </Button>
      </footer>
    </div>
  )
}

