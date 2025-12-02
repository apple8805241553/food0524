'use client'
// 此檔案(providers.js)是"客戶端元件"
// 集中所有的Context Provider在這裡進行導入與嵌入children。
// 因為layout檔案的設計傾向使用伺服器元件也會被快取，較不適合作套用Context Provider

// 會員認証+授權使用 (andy老師的)
import { AuthProvider } from '@/hooks/use-auth'
// 購物車用
import { CartProvider } from '@/hooks/use-cart'
// Shinder老師作的會員登入相關的功能
import { AuthContextProvider } from '@/hooks/auth-context'

export default function Providers({ children }) {
  return (
    // <AuthProvider>
    <AuthContextProvider>
      <CartProvider>{children}</CartProvider>
    </AuthContextProvider>
    //</AuthProvider>
  )
}
