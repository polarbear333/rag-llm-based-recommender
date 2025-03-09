import { Button } from "@/components/ui/button"

export function MarketingBanner() {
  return (
    <div className="bg-gradient-to-r from-lightblue to-secondary py-12 px-4 relative overflow-hidden">
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight mb-4 text-white">Looking for the one? It's here.</h2>
          <p className="text-xl text-white/80 mb-8">Welcome to the largest online marketplace for collectibles.</p>
          <Button size="lg" className="bg-white text-secondary hover:bg-white/90">
            Shop now
          </Button>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-lightblue/50 to-secondary/50" />
    </div>
  )
}

