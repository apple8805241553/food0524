'use client'

import React, { useEffect, useState, useRef } from 'react'
import styles from '../styles/profile-content.module.scss'
import useSWR, { mutate } from 'swr' // 引入 mutate 以便資料更新後重新驗證
import { useAuth } from '@/hooks/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { FaCalendarAlt, FaChevronDown } from '../../icons/icons'

const ProfileContent = () => {
  const { auth, getAuthHeader, authInit, setAuth } = useAuth()
  const router = useRouter()

  // 編輯資料的狀態管理
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [initialData, setInitialData] = useState({})
  const [loading, setLoading] = useState(false) // API請求時的載入狀態
  const [formErrors, setFormErrors] = useState({}) // 表單驗證錯誤
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' }) // 送出編輯後的狀態結果回報

  // 上傳頭貼相關狀態
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null) // 用來觸發檔案選擇

  // --- 偵錯用 ---
  useEffect(() => {
    console.log('[ProfileContent] Auth State:', auth)
    console.log('[ProfileContent] Auth Init:', authInit)
    console.log('[ProfileContent] User ID for fetch:', auth?.user_id)
  }, [auth, authInit])
  // --- 偵錯用結束 ---

  useEffect(() => {
    // 確認 Auth context 初始化完成，若未登入則導向登入頁
    if (authInit && !auth?.user_id) {
      router.push('/login')
    }
  }, [authInit, auth, router])

  // 抓取資料的函數 (fetcher)
  const fetcher = async url => {
    try {
      // 除錯用
      console.log('Fetching URL:', url)
      console.log('Auth headers:', getAuthHeader())

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(), // 帶上 JWT token
        },
      })

      // 除錯用：檢查回應狀態與內容類型
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '無法解析錯誤回應' }))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      console.log('Response data:', data)

      if (!data.success) {
        throw new Error(data.error || '無法取得資料')
      }
      return data
    } catch (error) {
      console.error('抓取會員資料 API 錯誤:', error)
      throw error // 拋出錯誤以便 SWR 捕捉
    }
  }

  // 定義 API URL，確保 auth 初始化且有 token 才設定 URL
  const userApiUrl =
    authInit && auth?.token
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/api/${auth.user_id}`
      : null // 如果不符合條件，SWR 將不會發送請求

  // 使用 SWR 抓取資料，並獲取 data, error 和 isLoading 狀態
  const {
    data,
    error: swrError,
    isLoading: swrIsLoading,
  } = useSWR(userApiUrl, fetcher, {
    // 當 data.rows.avatar 變更時，重新觸發 SWR，更建議在成功上傳後直接 mutate SWR cache
    revalidateOnFocus: false, // 視需求調整
  })

  // 設定編輯時的表單資料
  useEffect(() => {
    if (data?.success && data.rows) {
      const userData = {
        email: data.rows.email || '',
        phone_number: data.rows.phone_number || '',
        full_name: data.rows.full_name || '',
        username: data.rows.username || '',
        birthday: data.rows.birthday ? data.rows.birthday.split('T')[0] : '', // 確保 birthday 是 YYYY-MM-DD 格式，如果為 null 或 undefined 則為空字串
        gender: data.rows.gender || '',
        address: data.rows.address || '',
        avatar: data.rows.profile_picture_url || '', // 確保 avatar 初始值來自 profile_picture_url
      }
      setFormData(userData)
      setInitialData(userData)
      // 決定初始頭貼路徑 (優先用 data，其次用 auth)
      const initialAvatar = data.rows.profile_picture_url || auth.profile_picture_url
      setPreviewImage(
        initialAvatar
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${initialAvatar}`
          : 'https://cdn.builder.io/api/v1/image/assets/TEMP/f52afbad8d5e8417cf84bbdcbf5840a0d135146c?placeholderIfAbsent=true&apiKey=137a18afd6bf49c9985266999785670f' // TODO:換成預設圖示
      )
    } else if (auth.user_id) {
      const initialAvatar = auth.profile_picture_url
      setPreviewImage(
        initialAvatar
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${initialAvatar}`
          : 'https://cdn.builder.io/api/v1/image/assets/TEMP/f52afbad8d5e8417cf84bbdcbf5840a0d135146c?placeholderIfAbsent=true&apiKey=137a18afd6bf49c9985266999785670f' // TODO:換成預設圖示
      )
    } else {
      // 如果 data 和 auth 都沒有頭貼
      setPreviewImage(null) // TODO:換成預設圖示
    }
  }, [data, auth])

  // 處理編輯後提交訊息自動關閉
  useEffect(() => {
    let timerId = null // 用於儲存計時器的 ID

    // 當 statusMessage.message 存在時才設定計時器
    if (statusMessage.message) {
      timerId = setTimeout(() => {
        setStatusMessage({ type: '', message: '' })
      }, 3000) // 3 秒後清空 statusMessage
    }

    // 清理函式 (cleanup function)
    // 這會在下一次 useEffect 執行前，或元件卸載時執行
    return () => {
      // 如果計時器已存在就清除它。防止當訊息快速變更時，舊的計時器還在執行
      if (timerId) {
        clearTimeout(timerId)
      }
    }
  }, [statusMessage.message]) // 這個 effect 只在 statusMessage.message 改變時執行

  // --- 編輯事件處理函式開始 ---
  const profileFieldsConfig = [
    {
      name: 'email',
      label: '電子信箱',
      type: 'email',
      editable: false,
    },
    {
      name: 'phone_number',
      label: '手機號碼',
      type: 'tel',
      editable: true,
      placeholder: '請輸入手機號碼',
      validation: value => {
        if (!value) return '手機號碼為必填'
        if (!/^09\d{8}$/.test(value)) return '手機號碼格式不正確'
        return ''
      },
    },
    {
      name: 'full_name',
      label: '姓名',
      type: 'text',
      editable: true,
      placeholder: '請輸入姓名',
      validation: value => {
        if (!value) return '姓名為必填'
        if (value.length > 50) return '姓名不可超過50個字'
        return ''
      },
    },
    {
      name: 'username',
      label: '使用者名稱',
      type: 'text',
      editable: true,
      placeholder: '請輸入使用者名稱',
      validation: value => {
        if (!value) return '使用者名稱為必填'
        if (value.length > 10) return '使用者名稱不可超過10個字'
        return ''
      },
    },
    {
      name: 'birthday',
      label: '生日',
      type: 'date',
      editable: true,
      validation: value => {
        if (!value) return '生日為必填'
        const birthDate = new Date(value)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        if (age < 18) return '需年滿18歲'
        return ''
      },
    },
    {
      name: 'gender',
      label: '性別',
      type: 'select',
      editable: true,
      options: [
        { value: '', label: '不提供' },
        { value: 'M', label: '男' },
        { value: 'F', label: '女' },
        { value: 'Other', label: '其他' },
      ],
    },
    {
      name: 'address',
      label: '地址',
      type: 'text',
      editable: true,
      placeholder: '請輸入地址 (選填)',
    },
  ]

  // 處理表單輸入變更
  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
    setStatusMessage({ type: '', message: '' }) // 清除狀態訊息
  }

  // 表單驗證
  const validateForm = () => {
    const newErrors = {}
    let isValid = true
    profileFieldsConfig.forEach(field => {
      if (field.validation) {
        const errorMessage = field.validation(formData[field.name])
        if (errorMessage) {
          newErrors[field.name] = errorMessage
          isValid = false
        }
      }
    })
    setFormErrors(newErrors)
    return isValid
  }

  // 儲存變更
  const handleSaveChanges = async () => {
    if (!validateForm()) {
      setStatusMessage({
        type: 'error',
        message: '請檢查表單欄位是否正確填寫！',
      })
      return
    }

    setLoading(true)
    setStatusMessage({ type: '', message: '' }) // 清除之前的訊息

    // 編輯後，準備要送到後端的資料 (只送可編輯的欄位)
    const dataToUpdate = {}
    profileFieldsConfig.forEach(field => {
      if (field.editable && formData[field.name] !== initialData[field.name]) {
        dataToUpdate[field.name] = formData[field.name] // 檢查是否有變動
      }
    })

    // 如果沒有任何資料變動，則不發送請求
    if (Object.keys(dataToUpdate).length === 0) {
      setLoading(false)
      setIsEditing(false)
      setStatusMessage({ type: 'info', message: '會員資料未變更' })
      return
    }

    console.log('準備送出的更新資料:', dataToUpdate) // 除錯用

    try {
      const response = await fetch(userApiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(dataToUpdate),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setStatusMessage({ type: 'success', message: '會員資料更新成功！' })
        const updatedUserData = {
          ...initialData, // 從舊資料開始
          ...dataToUpdate, // 覆蓋更新的部分
          avatar: result.data.profile_picture_url || initialData.avatar, // 確保使用回傳的 profile_picture_url
        }
        setInitialData(updatedUserData)
        setFormData(updatedUserData)
        setIsEditing(false)
        mutate(userApiUrl) // 重新觸發 SWR

        // 更新 auth context，加入 username 的更新
        setAuth(prevAuth => ({
          ...prevAuth,
          profile_picture_url: result.data.profile_picture_url,
          username: dataToUpdate.username || prevAuth.username,
        }))

        // 更新 localStorage
        const storedAuthData = JSON.parse(localStorage.getItem('shinder-auth') || '{}')
        if (storedAuthData.token) {
          localStorage.setItem(
            'shinder-auth',
            JSON.stringify({
              ...storedAuthData,
              profile_picture_url: result.data.profile_picture_url,
              username: dataToUpdate.username || storedAuthData.username,
            })
          )
        }
      } else {
        setStatusMessage({
          type: 'error',
          message: result.error || '更新失敗，請稍後再試',
        })
      }
    } catch (err) {
      console.error('更新 API 請求錯誤:', err)
      setStatusMessage({
        type: 'error',
        message: '更新時發生錯誤，請檢查網路連線',
      })
    } finally {
      setLoading(false)
    }
  }

  // 取消編輯時還原初始資料
  const handleCancelEdit = () => {
    setFormData({ ...initialData })
    setIsEditing(false)
    setFormErrors({}) // 清除表單錯誤
    setStatusMessage({ type: '', message: '' })
  }
  // --- 編輯事件處理函式結束 ---

  // --- 頭貼上傳相關函式 ---
  const handleFileChange = event => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB
        toast.error('檔案大小不能超過 5MB')
        setSelectedFile(null)
        setPreviewImage(
          initialData.avatar
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${initialData.avatar}`
            : 'https://cdn.builder.io/api/v1/image/assets/TEMP/f52afbad8d5e8417cf84bbdcbf5840a0d135146c?placeholderIfAbsent=true&apiKey=137a18afd6bf49c9985266999785670f'
        )
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('僅限上傳圖片檔案！')
        setSelectedFile(null)
        setPreviewImage(
          initialData.avatar
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${initialData.avatar}`
            : 'https://cdn.builder.io/api/v1/image/assets/TEMP/f52afbad8d5e8417cf84bbdcbf5840a0d135146c?placeholderIfAbsent=true&apiKey=137a18afd6bf49c9985266999785670f'
        )
        return
      }
      setSelectedFile(file)
      setPreviewImage(URL.createObjectURL(file)) // 顯示預覽圖
    }
  }

  const handleAvatarUpload = async () => {
    if (!selectedFile) {
      toast.warn('請先選擇一個檔案！')
      return
    }
    if (!auth?.user_id) {
      toast.error('無法取得使用者資訊，請重新登入')
      return
    }

    setUploading(true)
    const uploadFormData = new FormData()
    uploadFormData.append('avatar', selectedFile)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/api/upload-avatar/${auth.user_id}`,
        {
          method: 'POST',
          headers: {
            // 'Content-Type': 'multipart/form-data' (Fetch 會自動設定，如果手動設定可能會出錯)
            ...getAuthHeader(), // 取得 JWT Token
          },
          body: uploadFormData,
        }
      )

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(result.message || '頭貼更新成功！')
        const newAvatarServerPath = result.filePath
        const newAvatarFullPath = `${process.env.NEXT_PUBLIC_BACKEND_URL}${newAvatarServerPath}`

        // 1. 更新預覽圖
        setPreviewImage(newAvatarFullPath)

        // 2. 更新表單和初始資料狀態
        setFormData(prev => ({ ...prev, avatar: newAvatarServerPath }))
        setInitialData(prev => ({ ...prev, avatar: newAvatarServerPath }))

        // 3. 更新 Auth Context
        setAuth(prevAuth => ({
          ...prevAuth,
          profile_picture_url: newAvatarServerPath,
        }))

        // 4. 更新 localStorage 中的 auth 資料 (重要！這樣刷新頁面後才會是新的頭貼)
        const storedAuthData = JSON.parse(localStorage.getItem('shinder-auth') || '{}')
        if (storedAuthData.token) {
          localStorage.setItem(
            'shinder-auth',
            JSON.stringify({
              ...storedAuthData,
              profile_picture_url: newAvatarServerPath,
            })
          )
        }

        // 5. 清除已選擇檔案 (清除 <input> 的值，這樣才能重複選擇同一個檔案)
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        //  6. 更新 SWR 快取，但不觸發重新驗證
        mutate(
          userApiUrl,
          currentData => {
            // 如果沒有當前資料，就回傳 null 或 undefined
            if (!currentData) return currentData
            // 回傳一個新的資料物件，只更新 profile_picture_url
            return {
              ...currentData, // 保留其他資料 (success, etc.)
              rows: {
                ...currentData.rows, // 保留 rows 中的其他欄位
                profile_picture_url: newAvatarServerPath, // 更新頭貼路徑
              },
            }
          },
          false // 設定為 false，避免 SWR 立即重新去後端抓取資料
        )
      } else {
        toast.error(result.message || '頭貼上傳失敗。')
        // 上傳失敗時，預覽圖應該回復到之前的頭貼
        setPreviewImage(
          initialData.avatar
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${initialData.avatar}`
            : 'https://cdn.builder.io/api/v1/image/assets/TEMP/f52afbad8d5e8417cf84bbdcbf5840a0d135146c?placeholderIfAbsent=true&apiKey=137a18afd6bf49c9985266999785670f' // TODO:換成預設圖示
        )
      }
    } catch (error) {
      console.error('頭貼上傳 API 請求錯誤:', error)
      toast.error('頭貼上傳時發生錯誤，請檢查網路連線。')
      setPreviewImage(
        initialData.avatar
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${initialData.avatar}`
          : 'https://cdn.builder.io/api/v1/image/assets/TEMP/f52afbad8d5e8417cf84bbdcbf5840a0d135146c?placeholderIfAbsent=true&apiKey=137a18afd6bf49c9985266999785670f' // TODO:換成預設圖示
      )
    } finally {
      setUploading(false)
    }
  }
  // --- 頭貼上傳相關函式結束 ---

  // 錯誤狀態處理
  if (!authInit) return <div className={styles.loading}>登入狀態確認中...</div>
  if (swrError) return <div className={styles.error}>會員資料讀取失敗：{swrError.message}</div>
  if (swrIsLoading && !data) return <div className={styles.loading}>會員資料讀取中...</div>
  if (!userApiUrl && authInit) {
    // 如果 authInit 完成但 userApiUrl 仍為 null (代表未登入)
    return <div className={styles.error}>請先登入以查看會員資料</div>
  }
  if (!data?.success || !data?.rows) {
    return <div className={styles.error}>會員資料格式錯誤或未找到</div>
  }

  // 使用 initialData 來顯示檢視模式的資料，確保取消時顯示正確
  const user = initialData

  // 取得性別顯示文字
  const getGenderLabel = genderValue => {
    const genderOption = profileFieldsConfig
      .find(f => f.name === 'gender')
      ?.options.find(opt => opt.value === genderValue)
    return genderOption ? genderOption.label : '不提供'
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        {/* 使用者頭貼 */}
        <div className={styles.userPhoto}>
          <img
            src={
              previewImage || // 1. 優先顯示預覽圖
              (formData.avatar
                ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${formData.avatar}` // 2. 使用 formData 的路徑 (修正後)
                : null) ||
              (auth.profile_picture_url
                ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${auth.profile_picture_url}` // 3. 使用 auth 的路徑 (修正後)
                : null) ||
              'https://cdn.builder.io/api/v1/image/assets/TEMP/f52afbad8d5e8417cf84bbdcbf5840a0d135146c?placeholderIfAbsent=true&apiKey=137a18afd6bf49c9985266999785670f' // 4. 預設圖 (請換成你自己的預設圖 URL)
            }
            alt="User profile"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{
              cursor: 'pointer',
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              objectFit: 'cover',
            }} // 加上一些基本樣式
          />
          {/* 隱藏的檔案輸入框 */}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
        </div>
        <div className={styles.userInfo}>
          <div className={styles.profileText}>
            <div className={styles.username}>{user.username}</div>
            <div className={styles.email}>{user.email}</div>
          </div>
          <div className={styles.profileButtons}>
            {/* 「上傳頭貼」按鈕 */}
            <button
              className={styles.editButton}
              // 根據 selectedFile 決定 onClick 的行為
              onClick={selectedFile ? handleAvatarUpload : () => fileInputRef.current?.click()}
              disabled={uploading} // 「上傳中...」時禁用按鈕
            >
              {/* 根據 uploading 和 selectedFile 決定按鈕文字 */}
              {uploading ? '上傳中...' : selectedFile ? '確認上傳' : '修改頭貼'}
            </button>
            {/* 「編輯會員資料」按鈕 */}
            {!isEditing && (
              <button className={styles.editButton} onClick={() => setIsEditing(true)}>
                編輯會員資料
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 會員資料顯示區域 */}
      <div className={styles.profileDetails}>
        {profileFieldsConfig.map((field, index) => (
          <div key={index} className={styles.detailRow}>
            <div className={styles.detailTitle}>{field.label}</div>
            <div className={styles.detailContent}>
              {isEditing && field.editable ? (
                <>
                  {field.type === 'date' ? (
                    <div className={styles.dateInput}>
                      <input
                        type="date"
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleInputChange}
                        className={`${styles.inputField} ${
                          formErrors[field.name] ? styles.errorInput : ''
                        }`}
                      />
                      <FaCalendarAlt className={styles.calendarIcon} />
                    </div>
                  ) : field.type === 'select' ? (
                    <div className={styles.selectWrapper}>
                      <select
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleInputChange}
                        className={`${styles.inputField} ${
                          formErrors[field.name] ? styles.errorInput : ''
                        }`}
                      >
                        {field.options.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <FaChevronDown className={styles.selectIcon} />
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleInputChange}
                      placeholder={field.placeholder || ''}
                      className={`${styles.inputField} ${
                        formErrors[field.name] ? styles.errorInput : ''
                      }`}
                    />
                  )}
                  {formErrors[field.name] && (
                    <div className={styles.errorMessageInline}>{formErrors[field.name]}</div>
                  )}
                </>
              ) : (
                <span>
                  {field.name === 'gender'
                    ? getGenderLabel(user[field.name])
                    : user[field.name] || '未填寫'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 編輯儲存按鈕、取消按鈕和錯誤訊息 */}
      {isEditing && (
        <div className={styles.editActions}>
          <button
            className={`${styles.actionButton} ${styles.saveButton}`}
            onClick={handleSaveChanges}
            disabled={loading}
          >
            {loading ? '儲存中...' : '儲存變更'}
          </button>
          <button
            className={`${styles.actionButton} ${styles.cancelButton}`}
            onClick={handleCancelEdit}
            disabled={loading}
          >
            取消
          </button>
        </div>
      )}

      {/* 顯示編輯更新結果的狀態訊息 */}
      {statusMessage.message && (
        <div
          className={`${styles.statusMessage} ${
            statusMessage.type === 'success'
              ? styles.successMessage
              : statusMessage.type === 'info'
                ? styles.infoMessage
                : styles.errorMessage
          }`}
        >
          {statusMessage.message}
        </div>
      )}
    </div>
  )
}

export default ProfileContent
