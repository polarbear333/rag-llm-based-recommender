import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProductCardProps {
  title: string
  price: number
  originalPrice: number
  image: string
  discount: number
}

export function ProductCard({ title, price, originalPrice, image, discount }: ProductCardProps) {
  return (
    <Card className="group cursor-pointer overflow-hidden">
      <CardContent className="p-0 relative">
        <img
          src={image || "/placeholder.svg"}
          alt={title}
          className="w-full aspect-square object-cover transition-transform group-hover:scale-105"
        />
        {discount > 0 && <Badge className="absolute top-2 left-2 bg-blue-600">{discount}% OFF</Badge>}
      </CardContent>
      <CardFooter className="p-4">
        <div>
          <h3 className="font-medium mb-1">{title}</h3>
          <div className="flex items-center gap-2">
            <span className="font-bold">${price}</span>
            {originalPrice > price && (
              <span className="text-sm text-muted-foreground line-through">${originalPrice}</span>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

