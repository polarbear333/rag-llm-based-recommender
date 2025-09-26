import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ChatSession, Message } from '@/types'

interface ChatSessionState {
  currentSessionId: string | null
  sessions: ChatSession[]
  input: string
  isLoading: boolean
  messageCounter: number
  
  // Actions
  createNewSession: () => string
  switchToSession: (sessionId: string) => void
  getCurrentSession: () => ChatSession | null
  addMessageToCurrentSession: (message: Omit<Message, 'id'>) => void
  setInput: (input: string) => void
  setIsLoading: (isLoading: boolean) => void
  deleteSession: (sessionId: string) => void
  getCurrentMessages: () => Message[]
}

const initialMessage: Message = {
  id: 1,
  text: "Hello! How can I assist you with your shopping today?",
  sender: "ai"
}

const generateSessionId = () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const createInitialSession = (): ChatSession => {
  const now = new Date().toISOString()
  return {
    id: generateSessionId(),
    title: "New Chat",
    messages: [initialMessage],
    createdAt: now,
    lastMessageAt: now
  }
}

const generateSessionTitle = (messages: Message[]): string => {
  // Find the first user message to use as title
  const firstUserMessage = messages.find(msg => msg.sender === 'user')
  if (firstUserMessage) {
    // Take first 40 characters and add ellipsis if longer
    const title = firstUserMessage.text.trim()
    return title.length > 40 ? title.substring(0, 40) + '...' : title
  }
  return "New Chat"
}

export const useChatSessionStore = create<ChatSessionState>()(
  persist(
    (set, get) => ({
      currentSessionId: null,
      sessions: [],
      input: '',
      isLoading: false,
      messageCounter: 2,

      createNewSession: () => {
        const newSession = createInitialSession()
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: newSession.id,
          messageCounter: 2,
          input: '',
          isLoading: false
        }))
        return newSession.id
      },

      switchToSession: (sessionId) => {
        const session = get().sessions.find(s => s.id === sessionId)
        if (session) {
          set({
            currentSessionId: sessionId,
            messageCounter: Math.max(...session.messages.map(m => m.id)) + 1,
            input: '',
            isLoading: false
          })
        }
      },

      getCurrentSession: () => {
        const { currentSessionId, sessions } = get()
        if (!currentSessionId) return null
        return sessions.find(s => s.id === currentSessionId) || null
      },

      getCurrentMessages: () => {
        const currentSession = get().getCurrentSession()
        return currentSession?.messages || []
      },

      addMessageToCurrentSession: (message) => {
        const { currentSessionId, messageCounter, sessions } = get()
        if (!currentSessionId) return

        const newMessage: Message = {
          id: messageCounter,
          ...message
        }

        const now = new Date().toISOString()
        
        set((state) => ({
          sessions: state.sessions.map(session => 
            session.id === currentSessionId 
              ? {
                  ...session,
                  messages: [...session.messages, newMessage],
                  lastMessageAt: now,
                  title: session.messages.length === 1 && message.sender === 'user' 
                    ? generateSessionTitle([...session.messages, newMessage])
                    : session.title
                }
              : session
          ),
          messageCounter: messageCounter + 1
        }))
      },

      setInput: (input) => set({ input }),

      setIsLoading: (isLoading) => set({ isLoading }),

      deleteSession: (sessionId) => {
        const { currentSessionId, sessions } = get()
        const updatedSessions = sessions.filter(s => s.id !== sessionId)
        
        set((state) => {
          const newState: Partial<ChatSessionState> = {
            sessions: updatedSessions
          }
          
          // If we deleted the current session, switch to another or create new
          if (currentSessionId === sessionId) {
            if (updatedSessions.length > 0) {
              newState.currentSessionId = updatedSessions[0].id
              newState.messageCounter = Math.max(...updatedSessions[0].messages.map(m => m.id)) + 1
            } else {
              // Create a new session if no sessions left
              const newSession = createInitialSession()
              newState.sessions = [newSession]
              newState.currentSessionId = newSession.id
              newState.messageCounter = 2
            }
          }
          
          return { ...state, ...newState }
        })
      }
    }),
    {
      name: 'chat-session-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        currentSessionId: state.currentSessionId,
        sessions: state.sessions,
        messageCounter: state.messageCounter
      })
    }
  )
)

// Initialize with a session if none exists
export const initializeChatSession = () => {
  const store = useChatSessionStore.getState()
  if (store.sessions.length === 0 || !store.currentSessionId) {
    store.createNewSession()
  }
}