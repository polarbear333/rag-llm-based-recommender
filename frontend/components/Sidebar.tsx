"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Shirt, Tv, Home, Smile, Dumbbell, Star } from "lucide-react"

const categories = [
  { name: "Fashion", icon: Shirt },
  { name: "Electronics", icon: Tv },
  { name: "Home & Kitchen", icon: Home },
  { name: "Beauty", icon: Smile },
  { name: "Sports & Outdoors", icon: Dumbbell },
]

const brands = ["Brand A", "Brand B", "Brand C", "Brand D"]
const features = ["Feature 1", "Feature 2", "Feature 3", "Feature 4"]

interface SidebarProps {
  isOpen: boolean
}

export function Sidebar({ isOpen }: SidebarProps) {
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [openSections, setOpenSections] = useState<string[]>([])

  const toggleSection = (section: string) => {
    setOpenSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-64 bg-background border-r p-4 overflow-y-auto transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <h2 className="text-lg font-semibold mb-4">Filter Products</h2>

      <Accordion type="multiple" value={openSections} className="w-full">
        <AccordionItem value="categories">
          <AccordionTrigger onClick={() => toggleSection("categories")}>Categories</AccordionTrigger>
          <AccordionContent>
            {categories.map((category) => (
              <div key={category.name} className="flex items-center space-x-2 mb-2">
                <Checkbox id={`category-${category.name}`} />
                <Label htmlFor={`category-${category.name}`} className="flex items-center">
                  <category.icon className="h-4 w-4 mr-2" />
                  {category.name}
                </Label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price">
          <AccordionTrigger onClick={() => toggleSection("price")}>Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <Slider min={0} max={1000} step={10} value={priceRange} onValueChange={setPriceRange} />
              <div className="flex justify-between">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="brand">
          <AccordionTrigger onClick={() => toggleSection("brand")}>Brand</AccordionTrigger>
          <AccordionContent>
            {brands.map((brand) => (
              <div key={brand} className="flex items-center space-x-2 mb-2">
                <Checkbox id={brand} />
                <Label htmlFor={brand}>{brand}</Label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="features">
          <AccordionTrigger onClick={() => toggleSection("features")}>Features</AccordionTrigger>
          <AccordionContent>
            {features.map((feature) => (
              <div key={feature} className="flex items-center space-x-2 mb-2">
                <Checkbox id={feature} />
                <Label htmlFor={feature}>{feature}</Label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="rating">
          <AccordionTrigger onClick={() => toggleSection("rating")}>User Rating</AccordionTrigger>
          <AccordionContent>
            {[4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-2 mb-2">
                <Checkbox id={`rating-${rating}`} />
                <Label htmlFor={`rating-${rating}`} className="flex items-center">
                  {Array(rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  {Array(5 - rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-gray-300" />
                    ))}
                  <span className="ml-1">& Up</span>
                </Label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  )
}

