import { Link, useLocation } from "react-router-dom"
import { Home, ShoppingCart, Package, Box, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Vendas", href: "/vendas", icon: ShoppingCart },
  { name: "Compras", href: "/compras", icon: ShoppingBag },
  { name: "Estoque", href: "/estoque", icon: Package },
  { name: "Produtos", href: "/produtos", icon: Box },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 shrink-0 items-center px-6 border-b">
        <span className="text-xl font-semibold text-[#05204A]">Odi Vendas</span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-5 flex-1 space-y-1 px-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  isActive
                    ? "bg-[#FDF0D5] text-[#05204A]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md"
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? "text-[#05204A]" : "text-gray-400 group-hover:text-gray-500",
                    "mr-3 flex-shrink-0 h-5 w-5"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
