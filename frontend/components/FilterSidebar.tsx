"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function FilterSidebar() {
  const [priceRange, setPriceRange] = useState([0, 1000])

  return (
    <aside className="w-64 bg-white p-4 border-r">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>

      <div className="mb-4">
        <h3 className="font-medium mb-2">Type</h3>
        {["Athletic Jackets", "Joggers", "T-Shirts"].map((type) => (
          <div key={type} className="flex items-center mb-2">
            <Checkbox id={type} />
            <Label htmlFor={type} className="ml-2">
              {type}
            </Label>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h3 className="font-medium mb-2">Fit</h3>
        {["Relaxed", "Slim"].map((fit) => (
          <div key={fit} className="flex items-center mb-2">
            <Checkbox id={fit} />
            <Label htmlFor={fit} className="ml-2">
              {fit}
            </Label>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h3 className="font-medium mb-2">Price Range</h3>
        <Slider min={0} max={1000} step={10} value={priceRange} onValueChange={setPriceRange} className="mb-2" />
        <div className="flex justify-between text-sm text-gray-600">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}</span>
        </div>
      </div>

      <Button className="w-full mb-2">Apply Filters</Button>
      <Button variant="outline" className="w-full">
        Clear Filters
      </Button>
    </aside>
  )
}

