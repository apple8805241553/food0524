// member-center/page.jsx
'use client'

import React, { useState, useEffect } from 'react'
import styles from './styles/profile-content.module.scss'
import Sidebar from './components/Sidebar'
import ProfileContent from './components/ProfileContent'
import PasswordContent from './components/PasswordContent'
import FavoritesContent from './components/FavoritesContent'
import OrdersContent from './components/OrdersContent'
import { useAuth } from '@/hooks/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'

export default function MemberCenter() {
  const { auth, authInit } = useAuth() // 從 Auth Context 取得登入狀態與初始化狀態
  const router = useRouter()
  const searchParams = useSearchParams()

  // 從 URL 參數取得初始分頁，如果沒有則預設為 'profile'
  const [activeContent, setActiveContent] = useState(
    searchParams.get('tab') || 'profile'
  )

  // 處理分頁變更
  const handleContentChange = (newContent) => {
    setActiveContent(newContent)
    // 更新 URL，但不重新整理頁面
    const newUrl = `?tab=${newContent}`
    window.history.pushState({}, '', newUrl)
  }

  // --- 偵錯用 ---
  useEffect(() => {
    console.log('[MemberCenter] Auth State:', auth)
    console.log('[MemberCenter] Auth Init:', authInit)
  }, [auth, authInit])
  // --- 偵錯用結束 ---

  useEffect(() => {
    // 等待 auth 初始化完成後才進行檢查
    if (authInit) {
      // 如果未登入 (auth.user_id 不存在或無效)，則導向到登入頁面
      if (!auth.user_id) {
        router.push('/login')
      }
    }
  }, [auth, authInit, router])

  // 如果 Auth Context 尚未初始化或使用者未登入，顯示提示訊息或載入狀態
  if (!authInit || !auth.user_id) {
    return (
      <div className={styles.pageContent}>
        <p className={styles.detailContent}>檢查登入狀態或跳轉至登入頁面...</p>
      </div>
    )
  }

  // 根據 activeContent 的值渲染對應的元件
  const renderContent = () => {
    switch (activeContent) {
      case 'profile':
        return <ProfileContent />
      case 'password':
        return <PasswordContent />
      case 'favorites':
        return <FavoritesContent />
      case 'orders':
        return <OrdersContent />
      default:
        return <ProfileContent />
    }
  }

  return (
    <>
      <div className={styles.pageContent}>
        <Sidebar
          activeContent={activeContent}
          setActiveContent={handleContentChange}
        />
        {/* 內容區域，根據 renderContent 的結果顯示 */}
        <div className={styles.contentArea}>{renderContent()}</div>
      </div>
    </>
  )
}
