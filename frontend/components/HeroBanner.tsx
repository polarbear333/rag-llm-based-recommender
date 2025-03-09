"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const banners = [
  {
    title: "Best Deal Online on smart watches",
    subtitle: "SMART WEARABLE.",
    description: "UP to 80% OFF",
    image: "/placeholder.svg",
    bgColor: "bg-[#1E2832]",
  },
  {
    title: "NEW ARRIVALS",
    subtitle: "Spring Collection",
    description: "UP to 50% OFF",
    image: "/placeholder.svg",
    bgColor: "bg-secondary",
  },
  {
    title: "FLASH SALE",
    subtitle: "24 Hours Only",
    description: "UP to 70% OFF",
    image: "/placeholder.svg",
    bgColor: "bg-accent",
  },
]

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
  }

  return (
    <div className={`relative ${banners[currentSlide].bgColor} text-white overflow-hidden h-[400px]`}>
      <div className="container mx-auto h-full flex items-center justify-center px-16">
        <div className="flex items-center justify-between w-full">
          <div className="max-w-xl">
            <p className="text-lg mb-2">{banners[currentSlide].title}</p>
            <h1 className="text-5xl font-bold mb-2">{banners[currentSlide].subtitle}</h1>
            <p className="text-2xl mb-6">{banners[currentSlide].description}</p>
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              Shop Now
            </Button>
          </div>
          <div className="hidden md:block">
            <img
              src={banners[currentSlide].image || "/placeholder.svg"}
              alt="Featured Product"
              className="h-[300px] w-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* Navigation Arrows with circular outline */}
      <button
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full border-2 border-white/50 flex items-center justify-center hover:bg-white/10 transition-colors"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <button
        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full border-2 border-white/50 flex items-center justify-center hover:bg-white/10 transition-colors"
        onClick={nextSlide}
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide ? "bg-white w-6" : "bg-white/50"
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  )
}

