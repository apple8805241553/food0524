'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext()
AuthContext.displayName = 'MyAuthContext'

/*
1. 登入
2. 登出
3. 保有登入的狀態 (取得登入者的資訊)
4. 要有取得 Authorization 檔頭的函式
*/

const noAuth = {
  token: '',
  user_id: 0,
  email: '',
  username: '',
  full_name: '',
  phone_number: '',
  birthday: '',
  gender: '',
  address: '',
  profile_picture_url: '',
}

// 元件
export function AuthContextProvider({ children }) {
  const [auth, setAuth] = useState({
    user_id: '',
    email: '',
    username: '',
    token: '',
    profile_picture_url: '',
    // ... 其他欄位
  })
  const [authInit, setAuthInit] = useState(false) // 初始化狀態
  const storageKey = 'shinder-auth' // 你的 localStorage key

  // 登入功能函式
  const login = async (email = '', password = '') => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/jwt-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      // 直接使用後端回傳的 result.data 來更新 Auth Context 狀態和 localStorage
      if (result.success && result.data && result.data.token) {
        localStorage.setItem(storageKey, JSON.stringify(result.data))
        setAuth(result.data)
        return true // 登入成功
      } else {
        // 登入失敗，清除舊資料，重設為無登入狀態
        localStorage.removeItem(storageKey)
        setAuth({ ...noAuth })
        return false
      }
    } catch (error) {
      console.error('登入 API 錯誤:', error)
      return false
    }
  }

  // 登出功能函式
  // 清除 localStorage 中的 auth 資料
  const logout = () => {
    localStorage.removeItem(storageKey)
    setAuth({ ...noAuth })
  }

  // 取得 Authorization 檔頭
  const getAuthHeader = () => {
    if (auth?.token) {
      return {
        Authorization: `Bearer ${auth.token}`,
      }
    }
    return {}
  }

  useEffect(() => {
    // 刷新頁面時, 從 localStorage 讀取登入的狀態資料
    const str = localStorage.getItem(storageKey)
    if (str) {
      try {
        const storedAuthData = JSON.parse(str)
        // 確保從 localStorage 讀取的資料包含必要的 token 和 user_id
        if (storedAuthData && storedAuthData.token && storedAuthData.user_id) {
          setAuth({
            ...noAuth, // 從預設值開始
            ...storedAuthData, // 覆蓋儲存的值
            profile_picture_url: storedAuthData.profile_picture_url || '', // 從後端取得的大頭貼檔案路徑
          })
        } else {
          // 如果 localStorage 中的資料不完整或無 token，則清除它
          localStorage.removeItem(storageKey)
        }
      } catch (ex) {
        console.error('從 localStorage 解析 auth 資料失敗:', ex)
        localStorage.removeItem(storageKey) // 解析失敗也清除
      }
    }
    setAuthInit(true) // 標記初始化完成
  }, [])

  return (
    <AuthContext.Provider value={{ auth, setAuth, login, logout, getAuthHeader, authInit }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export default AuthContext
