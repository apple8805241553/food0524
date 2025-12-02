'use client'

import React, { useState } from 'react'
import { useAuth as useAppAuth } from '@/hooks/auth-context' // 重命名以避免與 Firebase 的 auth 衝突
import { useRouter } from 'next/navigation'
import styles from './styles/Login.module.scss'
import Image from 'next/image'
import Link from 'next/link'
import { FaGoogle, FaFacebook, FaEye, FaEyeSlash } from '../icons/icons'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth' // Firebase Google 登入
import { auth as firebaseAuth } from '@/lib/firebase' // 引入 Firebase auth 實例

export default function LoginPage() {
  const { login: appLogin, setAuth: setAppAuth } = useAppAuth() // 使用 appLogin 和 setAppAuth
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    submit: '', // 當提交時出現錯誤的狀態
  })

  // 驗證電子郵件格式
  const validateEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 欄位失焦時進行驗證
  const validateField = (name, value) => {
    let error = ''
    const trimmedValue = value.trim()

    if (name === 'email') {
      if (!trimmedValue) {
        error = '請輸入電子信箱'
      } else if (!validateEmail(trimmedValue)) {
        error = '帳號格式錯誤或此帳號尚未註冊'
      }
    }
    if (name === 'password') {
      if (!trimmedValue) {
        error = '請輸入密碼'
      }
    }
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  // 提交表單
  const handleSubmit = async e => {
    e.preventDefault()
    setErrors({ email: '', password: '', submit: '' })

    let hasError = false
    let newErrors = {
      email: '',
      password: '',
      submit: '',
    }

    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedEmail) {
      newErrors.email = '請輸入電子信箱'
      hasError = true
    } else if (!validateEmail(trimmedEmail)) {
      newErrors.email = '帳號格式錯誤或此帳號尚未註冊'
      hasError = true
    }

    if (!trimmedPassword) {
      newErrors.password = '請輸入密碼'
      hasError = true
    }

    if (hasError) {
      setErrors(newErrors)
      return
    }

    try {
      const success = await appLogin(email.trim(), password.trim())
      if (success) {
        router.push('/member-center')
      } else {
        setErrors(prev => ({
          ...prev,
          submit: '帳號或密碼錯誤，請重新輸入',
        }))
      }
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        submit: '登入時發生問題，請稍後再試',
      }))
    }
  }

  // 使用 appLogin 進行登入
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider()
    try {
      setErrors(prev => ({ ...prev, submit: '' })) // 清除先前的錯誤
      const result = await signInWithPopup(firebaseAuth, provider)
      // Google 登入成功後，`result.user` 是 Firebase User 物件
      const user = result.user

      // 從 Firebase User 物件獲取 ID Token
      const firebaseIdToken = await user.getIdToken(true) // true 強制刷新 token
      console.log('Firebase ID Token:', firebaseIdToken)

      // 將 Firebase ID Token 發送到您的後端進行驗證和處理
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/firebase-google-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${firebaseIdToken}`, // 將 Firebase ID Token 放在 Authorization header
          },
          // body: JSON.stringify({ token: firebaseIdToken }), // 或者放在 body 中
        }
      )

      const data = await res.json()

      if (res.ok && data.success && data.data.token) {
        // 後端驗證成功，並回傳了您應用程式的 JWT
        localStorage.setItem('shinder-auth', JSON.stringify(data.data)) // 與 auth-context 儲存方式一致
        setAppAuth(data.data) // 更新您自己 Auth Context 的狀態
        router.push('/member-center')
      } else {
        setErrors(prev => ({
          ...prev,
          submit: data.message || 'Google 登入失敗或帳號處理錯誤，請稍後再試',
        }))
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error)
      let errorMessage = 'Google 登入過程中發生錯誤'
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Google 登入視窗已關閉'
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Google 登入請求已取消'
      }
      setErrors(prev => ({
        ...prev,
        submit: errorMessage,
      }))
    }
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginForm}>
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

        <h1 className={styles.title}>會員登入</h1>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* 帳號輸入框 */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              帳號 (電子信箱)
            </label>
            <input
              type="text"
              id="email"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="Example@email.com"
              value={email}
              onChange={e => setEmail(e.target.value.trim())}
              onBlur={e => validateField('email', e.target.value.trim())}
            />
            {errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
          </div>

          {/* 密碼輸入框 */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              密碼
            </label>
            <div className={styles.passwordInput}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                maxLength="20"
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                placeholder="*************"
                value={password}
                onChange={e => setPassword(e.target.value.trim())}
                onBlur={e => validateField('password', e.target.value.trim())}
              />
              <button
                type="button"
                className={styles.eyeIcon}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            {errors.password && <div className={styles.errorMessage}>{errors.password}</div>}
          </div>

          <div className={styles.forgotLinkContainer}>
            <Link href="/forgot-password" className={styles.forgotLink}>
              忘記密碼
            </Link>
          </div>

          <button type="submit" className={styles.loginButton}>
            登入
          </button>

          {/* 提交後的錯誤訊息 */}
          {errors.submit && <div className={`${styles.errorMessageSubmit}`}>{errors.submit}</div>}
        </form>

        {/* 其他帳號登入 */}
        <div className={styles.divider}>
          <span className={styles.dividerLine}></span>
          <span className={styles.dividerText}>以其他帳號登入</span>
          <span className={styles.dividerLine}></span>
        </div>

        {/* 第三方登入按鈕 (只做GOOGLE) */}
        <div className={styles.socialButtons}>
          <button onClick={handleGoogleSignIn} className={styles.socialButton}>
            <FaGoogle />
            <span>Google</span>
          </button>
          <button className={styles.socialButton}>
            <FaFacebook />
            <span>Facebook</span>
          </button>
        </div>

        <div className={styles.registerLinkContainer}>
          <span>還沒有任何帳號?</span>
          <Link href="/register" className={styles.registerLink}>
            立即註冊
          </Link>
        </div>
      </div>
    </div>
  )
}
