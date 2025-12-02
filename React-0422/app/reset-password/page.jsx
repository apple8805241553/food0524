'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import styles from './styles/ResetPassword.module.scss'
import Image from 'next/image'
import { FaEye, FaEyeSlash } from '../icons/icons'

export default function ResetPasswordSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams() // 用於獲取 URL 查詢參數

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmNewPassword: '',
  })

  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmNewPassword: false,
  })

  const [errors, setErrors] = useState({
    newPassword: '',
    confirmNewPassword: '',
    token: '', // 用於顯示 token 相關錯誤
  })

  const [token, setToken] = useState(null) // 儲存從 URL 獲取的 token
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('') // 成功訊息

  useEffect(() => {
    const tokenFromURL = searchParams.get('token')
    if (!tokenFromURL) {
      setErrors(prev => ({
        ...prev,
        token: '無效的重設密碼連結。請確認您是透過郵件中的連結進入此頁面。',
      }))
    } else {
      setToken(tokenFromURL)
      setErrors(prev => ({ ...prev, token: '' }))
    }
  }, [searchParams])

  // 驗證密碼格式
  const validatePasswordFormat = password => {
    const trimmedPassword = password.trim()
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,20}$/
    return passwordRegex.test(trimmedPassword)
  }

  // 處理密碼輸入變更
  const handlePasswordChange = e => {
    const { name, value } = e.target
    // 移除頭尾空白，但不移除中間的空白，格式驗證會處理
    // const trimmedValue = value.trimStart().trimEnd()
    const rawValue = value // 保留原始輸入以允許用戶輸入空白，由 validator 判斷

    setPasswords(prev => ({
      ...prev,
      [name]: rawValue,
    }))

    // 清除該欄位的錯誤訊息
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }

    // 針對新密碼欄位即時驗證格式 (可選)
    if (name === 'newPassword' && rawValue.trim()) {
      // 只有在有內容時才驗證
      if (!validatePasswordFormat(rawValue)) {
        setErrors(prev => ({
          ...prev,
          newPassword: '密碼需包含大小寫英文字母及數字，長度8-20碼 (不含空白)',
        }))
      } else {
        setErrors(prev => ({ ...prev, newPassword: '' })) // 格式正確則清除錯誤
      }
    }
  }

  // 切換密碼顯示/隱藏
  const togglePasswordVisibility = field => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  // 驗證欄位 (提交時執行)
  const validateFields = () => {
    let isValid = true
    const newErrors = {
      newPassword: '',
      confirmNewPassword: '',
      token: errors.token, // 保留現有的 token 錯誤
    }

    if (!passwords.newPassword.trim()) {
      newErrors.newPassword = '請輸入新密碼'
      isValid = false
    } else if (!validatePasswordFormat(passwords.newPassword)) {
      newErrors.newPassword = '密碼需包含大小寫英文字母及數字，長度8-20碼 (不含空白)'
      isValid = false
    }

    if (!passwords.confirmNewPassword.trim()) {
      newErrors.confirmNewPassword = '請再次輸入新密碼'
      isValid = false
    } else if (passwords.newPassword !== passwords.confirmNewPassword) {
      newErrors.confirmNewPassword = '新密碼與確認密碼不一致'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // 提交表單
  const handleSubmit = async e => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage('') // 清空之前的成功訊息

    if (!token) {
      setErrors(prev => ({
        ...prev,
        token: '無效或遺失的重設密碼憑證，無法提交。',
      }))
      setIsSubmitting(false)
      return
    }

    if (!validateFields()) {
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: token,
            newPassword: passwords.newPassword,
          }),
        }
      )

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccessMessage('密碼重設成功！正在為您導向...')
        setPasswords({ newPassword: '', confirmNewPassword: '' })

        // 設定 sessionStorage 標記
        sessionStorage.setItem('resetPasswordSuccess', 'true')

        // 導向至成功頁面
        setTimeout(() => {
          router.push('/reset-password-success')
        }, 500)
      } else {
        if (
          result.message &&
          (result.message.includes('過期') || result.message.includes('無效'))
        ) {
          setErrors(prev => ({ ...prev, token: result.message }))
        } else {
          setErrors(prev => ({
            ...prev,
            token: result.message || '密碼重設失敗，請稍後再試。',
          }))
        }
      }
    } catch (error) {
      console.error('重設密碼 API 請求錯誤:', error)
      setErrors(prev => ({
        ...prev,
        token: '重設密碼時發生問題，請檢查網路連線或稍後再試。',
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  // 如果 token 驗證失敗（在 useEffect 中設定了 errors.token）
  if (errors.token && !token) {
    // 加一個 !token 判斷，確保是初始就沒有 token 的情況
    return (
      <div className={styles.registerContainer}>
        <div className={styles.registerForm}>
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
          <h1 className={styles.title}>錯誤</h1>
          <p className={styles.errorMessage} style={{ textAlign: 'center', color: 'red' }}>
            {errors.token}
          </p>
          <button
            onClick={() => router.push('/forgot-password')}
            className={styles.registerButton} // 可以沿用樣式
            style={{ marginTop: '20px' }}
          >
            前往申請忘記密碼
          </button>
          <button
            onClick={() => router.push('/login')}
            className={styles.registerButton}
            style={{ marginTop: '10px', backgroundColor: '#6c757d' }} // 不同顏色
          >
            返回登入
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerForm}>
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
        <h1 className={styles.title}>重設密碼</h1>
        <p className={styles.requiredField}>「*」為必填欄位</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* 新密碼 */}
          <div className={styles.formGroup}>
            <label htmlFor="newPassword" className={styles.label}>
              輸入新的密碼 *
            </label>
            <div className={styles.passwordInput}>
              <input
                type={showPasswords.newPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                placeholder="需包含大小寫英文字母及數字，長度8-20碼 (不含空白)"
                className={`${styles.input} ${errors.newPassword ? styles.errorInput : ''}`} // 確保有 styles.input
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeIcon}
                onClick={() => togglePasswordVisibility('newPassword')}
                aria-label="顯示或隱藏新密碼"
              >
                {showPasswords.newPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            {errors.newPassword && <div className={styles.errorMessage}>{errors.newPassword}</div>}
          </div>

          {/* 確認新密碼 */}
          <div className={styles.formGroup}>
            <label htmlFor="confirmNewPassword" className={styles.label}>
              再次輸入新的密碼 *
            </label>
            <div className={styles.passwordInput}>
              <input
                type={showPasswords.confirmNewPassword ? 'text' : 'password'}
                id="confirmNewPassword"
                name="confirmNewPassword"
                value={passwords.confirmNewPassword}
                onChange={handlePasswordChange}
                placeholder="再次輸入新的密碼"
                className={`${styles.input} ${errors.confirmNewPassword ? styles.errorInput : ''}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeIcon}
                onClick={() => togglePasswordVisibility('confirmNewPassword')}
                aria-label="顯示或隱藏確認新密碼"
              >
                {showPasswords.confirmNewPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            {errors.confirmNewPassword && (
              <div className={styles.errorMessage}>{errors.confirmNewPassword}</div>
            )}
          </div>

          <button type="submit" className={styles.registerButton} disabled={isSubmitting || !token}>
            {isSubmitting ? '處理中...' : '重設密碼'}
          </button>

          {/* 顯示成功訊息 */}
          {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

          {/* 顯示來自後端的 token 錯誤，如果有的話 */}
          {errors.token && token && (
            <div className={`${styles.errorMessage} ${styles.generalMessage}`}>{errors.token}</div>
          )}
        </form>
      </div>
    </div>
  )
}
