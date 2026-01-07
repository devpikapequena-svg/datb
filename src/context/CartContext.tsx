'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface Produto {
  slug: string
  title: string
  img: string
  price: string
  discount: string
  quantity?: number
}

interface CartContextType {
  cart: Produto[]
  addToCart: (produto: Produto) => void
  removeFromCart: (slug: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Produto[]>([])

  // 🔸 Carrega o carrinho salvo no localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cart')
    if (saved) setCart(JSON.parse(saved))
  }, [])

  // 🔸 Salva sempre que mudar
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  // 🛒 Adiciona produto (aumenta quantidade se já existir)
  const addToCart = (produto: Produto) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.slug === produto.slug)
      if (existing) {
        return prev.map((p) =>
          p.slug === produto.slug ? { ...p, quantity: (p.quantity || 1) + 1 } : p
        )
      }
      return [...prev, { ...produto, quantity: 1 }]
    })
  }

  const removeFromCart = (slug: string) => {
    setCart((prev) => prev.filter((p) => p.slug !== slug))
  }

  const clearCart = () => setCart([])

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart precisa estar dentro do CartProvider')
  return context
}
