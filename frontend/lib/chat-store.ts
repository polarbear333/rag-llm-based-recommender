import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Message } from '@/types'

interface ChatState {
  messages: Message[]
  input: string
  isLoading: boolean
  messageCounter: number
  
  // Actions
  addMessage: (message: Omit<Message, 'id'>) => void
  setInput: (input: string) => void
  setIsLoading: (isLoading: boolean) => void
  clearMessages: () => void
  resetToInitialState: () => void
}

const initialMessage: Message = {
  id: 1,
  text: "Hello! How can I assist you with your shopping today?",
  sender: "ai"
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [initialMessage],
      input: '',
      isLoading: false,
      messageCounter: 2,

      addMessage: (message) => {
        const { messageCounter } = get()
        const newMessage: Message = {
          id: messageCounter,
          ...message
        }
        
        set((state) => ({
          messages: [...state.messages, newMessage],
          messageCounter: messageCounter + 1
        }))
      },

      setInput: (input) => set({ input }),

      setIsLoading: (isLoading) => set({ isLoading }),

      clearMessages: () => set({ 
        messages: [initialMessage], 
        messageCounter: 2 
      }),

      resetToInitialState: () => set({
        messages: [initialMessage],
        input: '',
        isLoading: false,
        messageCounter: 2
      })
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist messages and messageCounter, not input or loading state
      partialize: (state) => ({
        messages: state.messages,
        messageCounter: state.messageCounter
      })
    }
  )
)