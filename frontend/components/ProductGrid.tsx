import { ProductCard } from "./ProductCard"

const products = [
  {
    id: 1,
    title: "Galaxy S23 Ultra",
    price: 999.99,
    originalPrice: 1199.99,
    image: "/placeholder.svg",
    discount: 15,
  },
  {
    id: 2,
    title: "Galaxy M13",
    price: 299.99,
    originalPrice: 349.99,
    image: "/placeholder.svg",
    discount: 10,
  },
  // Add more products as needed
]

export function ProductGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  )
}

