'use client'

// context套用第1步: 建立context
import { createContext, useState, useContext } from 'react'

// createContext的傳入參數是 defaultValue，是在套用context失敗或有錯誤發生時會得到的預設值(也有備援值的概念)，可以用有意義的值或是null(通常是針對物件或是除錯用)
const AuthContext = createContext(null)
// 設定displayName屬性(呈現名稱)
// 可選的屬性，用於搭配react devtools(瀏覽器擴充)使用，方便除錯。不給定的話都是統一使用"Context"名稱
AuthContext.displayName = 'AuthContext'

// 建立AuthProvider元件，它也是用來包裹套嵌用的元件(前後開頭結尾)
// 要共享的狀態放在這元件中各別管理(而不是放在Providers元件中)
// 導出(命名導出 named export)
export function AuthProvider({ children }) {
  // 預設使用者的值
  const defaultUser = { id: 0, name: '', username: '', email: '' }
  // 定義使用者狀態
  const [user, setUser] = useState(defaultUser)
  // 判斷使用者是否有登入
  const isAuth = Boolean(user?.id)
  // 登入函式
  const login = () => {
    setUser({
      id: 3,
      name: '哈利',
      username: 'harry',
      email: 'harry@test.com',
    })
  }
  // 登出函式
  const logout = () => {
    setUser(defaultUser)
  }

  // context第3步改到這裡，可以利用value屬性傳遞後代元件共享狀態
  return (
    <AuthContext.Provider
      // 要傳出的值屬性比較多時，可以按值or函式分組，與按英文名稱由上到下排序
      value={{
        isAuth,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// 導出(命名導出 named export)自訂名稱的勾子(hook)，配合上面的AuthProvider使用，用於解析出對應的context的value屬性值，專用名稱可以讓閱讀性較佳
// 注意: 如果想要在編輯器中有提示或自動完成功能，需要使用TypeScript或是JSDoc來定義回傳值的類型。
/**
 *
 * useAuth是一個設計專門用來讀取AuthContext的值的勾子(hook)。
 *
 * @typedef {Object} Auth
 * @property {number} id
 * @property {string} username
 * @property {string} name
 * @property {string} email
 *
 * @returns {{user: {id: number, username: string, name: string, email: string}, isAuth: boolean, login: Function, logout: Function}}
 */
export const useAuth = () => useContext(AuthContext)
