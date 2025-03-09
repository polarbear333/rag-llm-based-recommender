"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProductRecommendationSystem() {
  const [userPreferences, setUserPreferences] = useState({
    category: "",
    priceRange: "",
    brand: "",
  })
  const [recommendations, setRecommendations] = useState([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserPreferences((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real application, you would make an API call here to get recommendations
    // For this mockup, we'll just set some dummy data
    setRecommendations([
      { id: 1, name: "Product 1", price: "$19.99" },
      { id: 2, name: "Product 2", price: "$24.99" },
      { id: 3, name: "Product 3", price: "$14.99" },
    ])
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Product Recommendation System</h1>
      <Card>
        <CardHeader>
          <CardTitle>Your Preferences</CardTitle>
          <CardDescription>Tell us what you're looking for</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                type="text"
                id="category"
                name="category"
                value={userPreferences.category}
                onChange={handleInputChange}
                placeholder="e.g., Electronics, Clothing, Books"
              />
            </div>
            <div>
              <Label htmlFor="priceRange">Price Range</Label>
              <Input
                type="text"
                id="priceRange"
                name="priceRange"
                value={userPreferences.priceRange}
                onChange={handleInputChange}
                placeholder="e.g., $0-$50, $50-$100"
              />
            </div>
            <div>
              <Label htmlFor="brand">Preferred Brand (optional)</Label>
              <Input
                type="text"
                id="brand"
                name="brand"
                value={userPreferences.brand}
                onChange={handleInputChange}
                placeholder="e.g., Nike, Apple, Samsung"
              />
            </div>
            <Button type="submit" className="w-full">
              Get Recommendations
            </Button>
          </form>
        </CardContent>
      </Card>

      {recommendations.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recommended Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((product) => (
                <li key={product.id} className="flex justify-between items-center border-b py-2">
                  <span>{product.name}</span>
                  <span className="font-semibold">{product.price}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">Based on your preferences</p>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

