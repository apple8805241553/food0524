'use client'

import React, { useState } from 'react'
import styles from '../styles/password-content.module.scss'
import { FaEye, FaEyeSlash } from '../../icons/icons'
import { useAuth } from '@/hooks/auth-context'

const PasswordContent = () => {
  // 從 Auth Context 取得認證資訊
  const { auth, getAuthHeader } = useAuth()

  // 密碼狀態
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })

  // 密碼顯示/隱藏狀態
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  })

  // 錯誤訊息狀態
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })

  // 提交成功訊息狀態 (後端回傳)
  const [successMessage, setSuccessMessage] = useState('')

  // 提交失敗訊息狀態 (後端回傳)
  const [failedMessage, setFailedMessage] = useState('')

  // 驗證密碼格式
  const validatePasswordFormat = (password) => {
    // 先去除頭尾空白再驗證
    const trimmedPassword = password.trim()
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,20}$/
    return passwordRegex.test(trimmedPassword)
  }

  // 處理密碼輸入變更
  const handlePasswordChange = (e) => {
    const { name, value } = e.target

    // 去除頭尾空白
    const trimmedValue = value.trim()

    setPasswords((prev) => ({
      ...prev,
      [name]: trimmedValue,
    }))

    // 清除該欄位的錯誤訊息
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }

    // 針對新密碼欄位即時驗證格式
    if (name === 'newPassword' && trimmedValue) {
      if (!validatePasswordFormat(trimmedValue)) {
        setErrors((prev) => ({
          ...prev,
          newPassword: '密碼需包含大小寫英文字母及數字，長度8-20碼 (不含空白)',
        }))
      }
    }
  }

  // 切換密碼顯示/隱藏
  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  // 驗證欄位 (提交時執行)
  const validateFields = () => {
    let isValid = true
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    }

    if (!passwords.currentPassword) {
      newErrors.currentPassword = '請輸入目前密碼'
      isValid = false
    }

    if (!passwords.newPassword) {
      newErrors.newPassword = '請輸入新密碼'
      isValid = false
    } else if (!validatePasswordFormat(passwords.newPassword)) {
      newErrors.newPassword =
        '密碼需包含大小寫英文字母及數字，長度8-20碼 (不含空白)'
      isValid = false
    }

    if (!passwords.confirmNewPassword) {
      newErrors.confirmNewPassword = '請再次輸入新密碼'
      isValid = false
    } else if (passwords.newPassword !== passwords.confirmNewPassword) {
      newErrors.confirmNewPassword = '新密碼與確認密碼不一致'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // 驗證單一欄位 (失去焦點時執行)
  const validateField = (fieldName, value) => {
    const newErrors = { ...errors }

    switch (fieldName) {
      case 'currentPassword':
        if (!value) {
          newErrors[fieldName] = '請輸入目前密碼'
        } else {
          newErrors[fieldName] = ''
        }
        break

      case 'newPassword':
        if (!value) {
          newErrors[fieldName] = '請輸入新密碼'
        } else if (!validatePasswordFormat(value)) {
          newErrors[fieldName] =
            '密碼需包含大小寫英文字母及數字，長度8-20碼 (不含空白)'
        } else {
          newErrors[fieldName] = ''
        }
        break

      case 'confirmNewPassword':
        if (!value) {
          newErrors[fieldName] = '請再次輸入新密碼'
        } else if (value !== passwords.newPassword) {
          newErrors[fieldName] = '新密碼與確認密碼不一致'
        } else {
          newErrors[fieldName] = ''
        }
        break
    }

    setErrors(newErrors)
  }

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault()

    // 先驗證所有欄位
    if (!validateFields()) {
      return
    }

    // 再次確認新密碼格式
    if (!validatePasswordFormat(passwords.newPassword)) {
      setErrors((prev) => ({
        ...prev,
        newPassword: '密碼需包含大小寫英文字母及數字，長度8-20碼 (不含空白)',
      }))
      return
    }

    if (!auth.token || !auth.user_id) {
      setFailedMessage('您尚未登入，請先登入！')
      return
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/api/change-password`, // 後端 API 路徑
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(), // 帶上 JWT token
          },
          body: JSON.stringify({
            userId: auth.user_id, // 從 context 取得 user_id
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword,
          }),
        }
      )

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccessMessage('密碼更新成功！下次登入時請使用新密碼')
        setFailedMessage('') // 清除錯誤訊息
        // 清空表單
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        })
        setErrors({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        })
        // 3秒後清除成功訊息
        setTimeout(() => {
          setSuccessMessage('')
        }, 3000)
      } else {
        // 處理後端回傳的特定錯誤訊息
        if (result.errors) {
          setErrors((prevErrors) => ({ ...prevErrors, ...result.errors }))
          return
        }
        // failedMessage 顯示來自後端錯誤時的訊息
        setFailedMessage('密碼更新失敗，請稍後再試 (API error)')
        setSuccessMessage('') // 清除成功訊息
      }
    } catch (error) {
      setFailedMessage('密碼更新失敗，請檢查網路連線 (Failed to fetch)')
      setSuccessMessage('') // 清除成功訊息
    }
  }

  return (
    <div className={styles.passwordContent}>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {/* 目前密碼 */}
        <div className={styles.formGroup}>
          <label htmlFor="currentPassword" className={styles.label}>
            目前密碼 *
          </label>
          <div className={styles.passwordInput}>
            <input
              type={showPasswords.currentPassword ? 'text' : 'password'}
              name="currentPassword"
              id="currentPassword"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              onBlur={(e) => validateField('currentPassword', e.target.value)}
              placeholder="請輸入目前密碼"
              className={`${errors.currentPassword ? styles.errorInput : ''}`}
            />
            <button
              type="button"
              className={styles.eyeIcon}
              onClick={() => togglePasswordVisibility('currentPassword')}
            >
              {showPasswords.currentPassword ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>
          {errors.currentPassword && (
            <div className={styles.errorMessage}>{errors.currentPassword}</div>
          )}
        </div>

        {/* 輸入新的密碼 */}
        <div className={styles.formGroup}>
          <label htmlFor="newPassword" className={styles.label}>
            輸入新的密碼 *
          </label>
          <div className={styles.passwordInput}>
            <input
              type={showPasswords.newPassword ? 'text' : 'password'}
              name="newPassword"
              id="newPassword"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              onBlur={(e) => validateField('newPassword', e.target.value)}
              placeholder="需包含大小寫英文字母及數字，長度8-20碼 (不含空白)"
              className={`${errors.newPassword ? styles.errorInput : ''}`}
              required
            />
            <button
              type="button"
              className={styles.eyeIcon}
              onClick={() => togglePasswordVisibility('newPassword')}
            >
              {showPasswords.newPassword ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>
          {errors.newPassword && (
            <div className={styles.errorMessage}>{errors.newPassword}</div>
          )}
        </div>

        {/* 再次輸入新的密碼 */}
        <div className={styles.formGroup}>
          <label htmlFor="confirmNewPassword" className={styles.label}>
            再次輸入新的密碼 *
          </label>
          <div className={styles.passwordInput}>
            <input
              type={showPasswords.confirmNewPassword ? 'text' : 'password'}
              name="confirmNewPassword"
              id="confirmNewPassword"
              value={passwords.confirmNewPassword}
              onChange={handlePasswordChange}
              onBlur={(e) =>
                validateField('confirmNewPassword', e.target.value)
              }
              placeholder="再次輸入新的密碼"
              className={`${errors.confirmNewPassword ? styles.errorInput : ''}`}
              required
            />
            <button
              type="button"
              className={styles.eyeIcon}
              onClick={() => togglePasswordVisibility('confirmNewPassword')}
            >
              {showPasswords.confirmNewPassword ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>
          {errors.confirmNewPassword && (
            <div className={styles.errorMessage}>
              {errors.confirmNewPassword}
            </div>
          )}
        </div>

        <button type="submit" className={styles.submitButton}>
          修改密碼
        </button>

        {/* 修改成功訊息 */}
        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}

        {/* 修改失敗訊息 */}
        {failedMessage && (
          <div className={styles.failedMessage}>{failedMessage}</div>
        )}
      </form>
    </div>
  )
}

export default PasswordContent
