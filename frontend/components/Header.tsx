import Link from "next/link"
import Image from "next/image"
import { Search, ShoppingCart, User, MessageCircle, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Import icons for categories
import { Shirt, Home, Tv, Smile, Dumbbell } from "lucide-react"

const categories = [
  { name: "Fashion", icon: Shirt },
  { name: "Home & Kitchen", icon: Home },
  { name: "Electronics", icon: Tv },
  { name: "Beauty", icon: Smile },
  { name: "Sports", icon: Dumbbell },
]

interface HeaderProps {
  onOpenChatbox: () => void
  onToggleSidebar: () => void
}

export function Header({ onOpenChatbox, onToggleSidebar }: HeaderProps) {
  return (
    <header className="border-b sticky top-0 bg-white shadow-sm z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="mr-2 text-black">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </Button>
            <Link href="/" className="flex items-center text-2xl font-bold text-black">
              <Image src="/favicon.ico" alt="MegaMart Logo" width={32} height={32} className="mr-2" />
              MegaMart
            </Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl mx-6">
            <div className="relative w-full">
              <Input type="search" placeholder="Search essentials, groceries and more..." className="w-full pl-10" />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onOpenChatbox} className="text-black">
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-black">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-black">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <nav className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
          {categories.map((category) => (
            <DropdownMenu key={category.name}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full border-gray-200 hover:bg-gray-100 hover:text-black transition-colors"
                >
                  <category.icon className="h-4 w-4 mr-2 text-black" />
                  {category.name}
                  <ChevronDown className="h-4 w-4 ml-2 text-black" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Sub-category 1</DropdownMenuItem>
                <DropdownMenuItem>Sub-category 2</DropdownMenuItem>
                <DropdownMenuItem>Sub-category 3</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </nav>
      </div>
    </header>
  )
}

