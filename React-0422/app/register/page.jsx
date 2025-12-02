// React-0422/app/register/page.jsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './styles/Register.module.scss'
import Image from 'next/image'
import { FaEye, FaEyeSlash, FaCalendarAlt, FaChevronDown } from '../icons/icons'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    username: '',
    birthday: '',
    gender: '',
    address: '',
  })

  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  })

  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')

  // 驗證電子郵件格式
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 驗證手機號碼格式
  const validatePhone = (phone) => {
    if (!phone) return true
    const phoneRegex = /^09\d{8}$/
    return phoneRegex.test(phone)
  }

  // 驗證密碼格式
  const validatePassword = (password) => {
    const trimmedPassword = password.trim()
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,20}$/
    return passwordRegex.test(trimmedPassword)
  }

  // 驗證生日格式和年齡
  const validateBirthday = (birthday) => {
    if (!birthday) return true
    const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!birthdayRegex.test(birthday)) return false

    const birthDate = new Date(birthday)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--
    }
    return age >= 18
  }

  // 此函數負責 onBlur 時的驗證並更新 errors state
  const validateField = (name, value) => {
    let error = ''
    switch (name) {
      case 'email':
        if (!value) error = '請輸入電子信箱'
        else if (!validateEmail(value)) error = '無效的 Email 格式'
        break
      case 'phone_number':
        if (!value) error = '請輸入手機號碼'
        else if (!validatePhone(value))
          error = '無效的手機號碼格式，開頭必須為09，總共10碼數字'
        break
      case 'password':
        if (!value.trim()) error = '請輸入密碼'
        else if (!validatePassword(value))
          error = '密碼需包含大小寫英文字母及數字，長度8-20碼 (不含空白)'
        break
      case 'confirmPassword':
        if (!value.trim()) error = '請再次輸入密碼'
        else if (value.trim() !== formData.password.trim())
          error = '密碼與確認密碼不相符'
        break
      case 'full_name':
        if (!value) error = '請輸入姓名'
        else if (value.length > 50) error = '姓名不可超過50個字'
        break
      case 'username':
        if (!value) error = '請輸入使用者名稱'
        else if (value.length > 10) error = '使用者名稱不可超過10個字'
        break
      case 'birthday':
        if (!value) error = '請選擇生日'
        else if (!validateBirthday(value)) error = '需年滿18歲才能註冊'
        break
      default:
        break
    }
    setErrors((prev) => ({ ...prev, [name]: error }))
    return !error // 返回是否驗證通過
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    // 對密碼相關欄位特別處理 (去除頭尾空白)
    const trimmedValue = ['password', 'confirmPassword'].includes(name)
      ? value.trim()
      : value

    setFormData((prev) => ({
      ...prev,
      [name]: trimmedValue,
    }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    setSubmitError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    let currentSubmitErrors = {} // 用於收集本次提交時發現的所有欄位錯誤
    let formIsValid = true

    // 定義需要驗證的欄位順序（可選，但有助於保持一致性）
    const fieldsToValidate = [
      'email',
      'phone_number',
      'password',
      'confirmPassword',
      'full_name',
      'username',
      'birthday',
    ]

    for (const fieldName of fieldsToValidate) {
      const value = formData[fieldName]
      let errorMessage = ''

      switch (fieldName) {
        case 'email':
          if (!value) errorMessage = '請輸入電子信箱'
          else if (!validateEmail(value)) errorMessage = '無效的 Email 格式'
          break
        case 'phone_number':
          if (!value) errorMessage = '請輸入手機號碼'
          else if (!validatePhone(value))
            errorMessage = '無效的手機號碼格式，開頭必須為09，總共10碼數字'
          break
        case 'password':
          if (!value) errorMessage = '請輸入密碼'
          else if (!validatePassword(value))
            errorMessage =
              '密碼需包含大小寫英文字母及數字，長度8-20碼 (不含空白)'
          break
        case 'confirmPassword':
          if (!value) errorMessage = '請再次輸入密碼'
          else if (value !== formData.password)
            errorMessage = '密碼與確認密碼不相符'
          break
        case 'full_name':
          if (!value) errorMessage = '請輸入姓名'
          else if (value.length > 50) errorMessage = '姓名不可超過50個字'
          break
        case 'username':
          if (!value) errorMessage = '請輸入使用者名稱'
          else if (value.length > 10) errorMessage = '使用者名稱不可超過10個字'
          break
        case 'birthday':
          if (!value) errorMessage = '請選擇生日'
          else if (!validateBirthday(value)) {
            errorMessage = '需年滿18歲才能註冊'
          }
          break
        default:
          break
      }

      if (errorMessage) {
        currentSubmitErrors[fieldName] = errorMessage
        formIsValid = false
      }
    }

    setErrors(currentSubmitErrors) // 一次性更新所有欄位的錯誤狀態以供顯示

    if (!formIsValid) {
      toast.error('請檢查表單中的錯誤！')
      return
    }

    // 如果表單有效，繼續提交邏輯
    try {
      const res = await fetch('http://localhost:3001/register/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await res.json()

      if (result.success) {
        toast.success('註冊成功！')
        setFormData({
          // 清空表單
          email: '',
          phone_number: '',
          password: '',
          confirmPassword: '',
          full_name: '',
          username: '',
          birthday: '',
          gender: '',
          address: '',
        })
        setErrors({}) // 清除錯誤

        // 設定 sessionStorage 標記 (避免直接造訪註冊成功頁面)
        sessionStorage.setItem('registrationSuccess', 'true')
        router.push('/register-success') // 導向註冊成功頁面
      } else {
        if (result.errors) {
          // 後端 Zod 驗證錯誤，通常是 email/username 重複，或是其他 Zod schema 驗證失敗
          const backendFieldErrors = {}
          for (const field in result.errors) {
            if (result.errors[field] && result.errors[field].length > 0) {
              backendFieldErrors[field] = result.errors[field][0]
            }
          }
          // 合併前端已有的錯誤和後端傳回的欄位錯誤
          setErrors((prevErrors) => ({ ...prevErrors, ...backendFieldErrors }))
          toast.error(result.error || '註冊失敗，請檢查表單欄位！')
        } else {
          // 其他非欄位特定錯誤 (例如 "伺服器內部錯誤")
          setSubmitError(result.error || '註冊失敗，請稍後再試')
          toast.error(result.error || '註冊失敗，請稍後再試')
        }
      }
    } catch (error) {
      console.error('註冊 API 請求錯誤:', error)
      setSubmitError('註冊時發生問題，請檢查網路連線或稍後再試')
      toast.error('註冊時發生問題，請檢查網路連線或稍後再試')
    }
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
        <h1 className={styles.title}>會員註冊</h1>
        <p className={styles.requiredField}>「*」為必填欄位</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* Email */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              電子信箱 *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={`${styles.input} ${errors.email ? styles.errorInput : ''}`}
              placeholder="Example123@email.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={(e) => validateField('email', e.target.value)}
            />
            {errors.email && (
              <div className={styles.errorMessage}>{errors.email}</div>
            )}
          </div>

          {/* Phone Number */}
          <div className={styles.formGroup}>
            <label htmlFor="phone_number" className={styles.label}>
              手機號碼 *
            </label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              className={`${styles.input} ${errors.phone_number ? styles.errorInput : ''}`}
              placeholder="開頭必須為09，總共10碼數字"
              value={formData.phone_number}
              onChange={handleChange}
              onBlur={(e) => validateField('phone_number', e.target.value)}
            />
            {errors.phone_number && (
              <div className={styles.errorMessage}>{errors.phone_number}</div>
            )}
          </div>

          {/* Password */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              密碼 *
            </label>
            <div className={styles.passwordInput}>
              <input
                type={showPassword.password ? 'text' : 'password'}
                id="password"
                name="password"
                className={`${styles.input} ${errors.password ? styles.errorInput : ''}`}
                placeholder="需包含大小寫英文字母及數字，長度8-20碼 (不含空白)"
                value={formData.password}
                onChange={handleChange}
                onBlur={(e) => validateField('password', e.target.value)}
                maxLength={20}
              />
              <button
                type="button"
                className={styles.eyeIcon}
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    password: !prev.password,
                  }))
                }
              >
                {showPassword.password ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            {errors.password && (
              <div className={styles.errorMessage}>{errors.password}</div>
            )}
          </div>

          {/* Confirm Password */}
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              確認密碼 *
            </label>
            <div className={styles.passwordInput}>
              <input
                type={showPassword.confirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                className={`${styles.input} ${errors.confirmPassword ? styles.errorInput : ''}`}
                placeholder="再次輸入密碼"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={(e) => validateField('confirmPassword', e.target.value)}
                maxLength={20}
              />
              <button
                type="button"
                className={styles.eyeIcon}
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    confirmPassword: !prev.confirmPassword,
                  }))
                }
              >
                {showPassword.confirmPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className={styles.errorMessage}>
                {errors.confirmPassword}
              </div>
            )}
          </div>

          {/* Full Name */}
          <div className={styles.formGroup}>
            <label htmlFor="full_name" className={styles.label}>
              姓名 *
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              className={`${styles.input} ${errors.full_name ? styles.errorInput : ''}`}
              placeholder="請填寫完整姓名"
              value={formData.full_name}
              onChange={handleChange}
              onBlur={(e) => validateField('full_name', e.target.value)}
              maxLength={100}
            />
            {errors.full_name && (
              <div className={styles.errorMessage}>{errors.full_name}</div>
            )}
          </div>

          {/* Username */}
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>
              使用者名稱 *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className={`${styles.input} ${errors.username ? styles.errorInput : ''}`}
              placeholder="10個字以內，名稱會顯示於留言上"
              value={formData.username}
              onChange={handleChange}
              onBlur={(e) => validateField('username', e.target.value)}
              maxLength={10}
            />
            {errors.username && (
              <div className={styles.errorMessage}>{errors.username}</div>
            )}
          </div>

          {/* Birthday */}
          <div className={styles.formGroup}>
            <label htmlFor="birthday" className={styles.label}>
              生日 *
            </label>
            <div className={styles.dateInput}>
              <input
                type="date"
                id="birthday"
                name="birthday"
                className={`${styles.input} ${errors.birthday ? styles.errorInput : ''}`}
                value={formData.birthday}
                onChange={handleChange}
                onBlur={(e) => validateField('birthday', e.target.value)}
                required
              />
              <FaCalendarAlt className={styles.calendarIcon} />
            </div>
            {errors.birthday && (
              <div className={styles.errorMessage}>{errors.birthday}</div>
            )}
          </div>

          {/* Gender */}
          <div className={styles.formGroup}>
            <label htmlFor="gender" className={styles.label}>
              性別
            </label>
            <div className={styles.selectWrapper}>
              <select
                id="gender"
                name="gender"
                className={`${styles.input} ${errors.gender ? styles.errorInput : ''}`}
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">不提供</option>
                <option value="male">男</option>
                <option value="female">女</option>
                <option value="other">其他</option>
              </select>
              <FaChevronDown className={styles.selectIcon} />
            </div>
            {errors.gender && (
              <div className={styles.errorMessage}>{errors.gender}</div>
            )}
          </div>

          {/* Address */}
          <div className={styles.formGroup}>
            <label htmlFor="address" className={styles.label}>
              地址
            </label>
            <input
              type="text"
              id="address"
              name="address"
              className={`${styles.input} ${errors.address ? styles.errorInput : ''}`}
              placeholder="預填地址可作為配送收件使用"
              value={formData.address}
              onChange={handleChange}
              // 地址通常不需要 onBlur 驗證，除非有特定格式
            />
            {errors.address && (
              <div className={styles.errorMessage}>{errors.address}</div>
            )}
          </div>

          {submitError && (
            <div className={styles.submitError}>{submitError}</div>
          )}

          <button type="submit" className={styles.registerButton}>
            確認註冊
          </button>
        </form>
      </div>
    </div>
  )
}
