// React-0422/app/register-success/page.jsx
'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import styles from './styles/RegisterSuccess.module.scss'

export default function RegisterSuccessPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  // 此狀態用來控制是否允許顯示此頁面 (只能在註冊成功後顯示)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    const registrationFlag = sessionStorage.getItem('registrationSuccess')
    if (registrationFlag === 'true') {
      setIsAllowed(true)
      // 選擇性功能：在第一次成功載入後移除標記，這樣重新整理就會導向
      // sessionStorage.removeItem('registrationSuccess');

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // 倒數到 1 時清除計時器，避免負數
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      const redirectTimeout = setTimeout(() => {
        router.push('/login')
      }, 5000)

      return () => {
        clearInterval(timer)
        clearTimeout(redirectTimeout)
      }
    } else {
      // 如果沒有 sessionStorage 標記，則導向回註冊頁或首頁
      router.replace('/register') // 使用 replace 避免使用者可以按上一頁回到這裡
    }
  }, [router])

  // 如果不允許顯示本頁面，則渲染 null 或其他提示
  if (!isAllowed) {
    return null
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <Image
            src="/images/logo/logo-onlyFont-02.svg"
            alt="Logo"
            width={45}
            height={68}
            style={{ width: 'auto', height: '100%' }}
            priority
          />
        </div>
        <h1 className={styles.title}>會員註冊</h1>
        <div className={styles.messageContainer}>
          <p className={styles.message}>您已成功完成註冊！現在可以進行登入</p>
          {countdown > 0 ? (
            <p className={styles.message}>{countdown} 秒後自動跳轉至登入頁面</p>
          ) : (
            <p className={styles.message}>正在跳轉至登入頁面...</p>
          )}
        </div>
        <Link href="/login" legacyBehavior>
          <a className={styles.linkButton}>立即登入</a>
        </Link>
      </div>
    </div>
  )
}
// 這個頁面是註冊成功後的提示頁面，會顯示註冊成功的訊息，並在 5 秒後自動導向登入頁面