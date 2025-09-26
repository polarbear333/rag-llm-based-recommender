import { useChatSessionStore } from './chat-session-store'
import { searchProducts } from '@/utils/api'

export const useChatActions = () => {
  const { 
    addMessageToCurrentSession, 
    setInput, 
    setIsLoading, 
    createNewSession,
    switchToSession,
    deleteSession
  } = useChatSessionStore()

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    addMessageToCurrentSession({ sender: "user", text: trimmed })
    setInput("")
    setIsLoading(true)

    try {
      const response = await searchProducts(trimmed)
      addMessageToCurrentSession({
        sender: "ai",
        text: "Here's what I found for you:",
        productRecommendations: response.results ?? [],
      })
    } catch (error) {
      console.error("Error fetching product recommendations", error)
      addMessageToCurrentSession({
        sender: "ai",
        text: "Something went wrong while searching. Please try again shortly.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startNewConversation = () => {
    createNewSession()
  }

  const switchToChat = (sessionId: string) => {
    switchToSession(sessionId)
  }

  const deleteChat = (sessionId: string) => {
    deleteSession(sessionId)
  }

  return {
    sendMessage,
    startNewConversation,
    switchToChat,  
    deleteChat,
  }
}