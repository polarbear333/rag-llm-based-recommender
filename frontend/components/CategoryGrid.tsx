import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, Tv, Sofa, Watch, Flower, Headphones } from "lucide-react"

const categories = [
  { name: "Mobile", icon: Smartphone },
  { name: "Cosmetics", icon: Flower },
  { name: "Electronics", icon: Tv },
  { name: "Furniture", icon: Sofa },
  { name: "Watches", icon: Watch },
  { name: "Decor", icon: Flower },
  { name: "Accessories", icon: Headphones },
]

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {categories.map((category) => (
        <Card key={category.name} className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 flex flex-col items-center gap-2">
            <category.icon className="h-8 w-8" />
            <span className="text-sm font-medium">{category.name}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

