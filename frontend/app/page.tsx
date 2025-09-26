"use client"

import { useState } from "react"
import { Header } from "@/components/Header"
import { Sidebar } from "@/components/Sidebar"
import { HeroBanner } from "@/components/HeroBanner"
import { CategoryGrid } from "@/components/CategoryGrid"
import { ProductGrid } from "@/components/ProductGrid"
import { ChatboxOverlay } from "@/components/ChatboxOverlay"
import { MaximizedChatbox } from "@/components/MaximizedChatbox"
import { MarketingBanner } from "@/components/MarketingBanner"

export default function Home() {
  const [isChatboxOpen, setIsChatboxOpen] = useState(false)
  const [isChatboxMaximized, setIsChatboxMaximized] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Handler when opening the small overlay chatbox (used by the overlay itself)
  const handleOpenOverlayChatbox = () => {
    setIsChatboxOpen(true)
  }

  // Handler for the Header button: open the maximized chatbox directly
  const handleOpenMaximizedFromHeader = () => {
    setIsChatboxMaximized(true)
  }

  return (
    <div className="min-h-screen bg-background">
  <Header onOpenChatbox={handleOpenMaximizedFromHeader} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} />
      <main className={`transition-all duration-300 ${isSidebarOpen ? "ml-64" : ""}`}>
        <HeroBanner />

        <div className="container mx-auto px-4 py-8 space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">Shop From Top Categories</h2>
            <CategoryGrid />
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-primary">Grab the best deal on Smartphones</h2>
              <a href="#" className="text-secondary hover:text-secondary/80 font-medium">
                View All
              </a>
            </div>
            <ProductGrid />
          </section>

          {/* Marketing Banner moved below smartphones section */}
          <section>
            <MarketingBanner />
          </section>
        </div>
      </main>
      <ChatboxOverlay
        onClose={() => setIsChatboxOpen(false)}
        onMaximize={() => setIsChatboxMaximized(true)}
        isOpen={isChatboxOpen}
        onOpen={handleOpenOverlayChatbox}
      />
      {isChatboxMaximized && <MaximizedChatbox onMinimize={() => setIsChatboxMaximized(false)} />}
    </div>
  )
}

