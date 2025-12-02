'use client'

import React, { useState } from 'react'
import styles from '../src/styles/page-styles/Contact.module.scss'
import SweetModal from '@/app/components/SweetModal'
import {
  RiCustomerService2Fill,
  FaCartShopping,
  GrArticle,
} from '../icons/icons'

const ContactPage = () => {
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault() // 防止表單預設提交行為

    try {
      const response = await fetch('http://localhost:3001/contact/api', {
        method: 'POST', // 使用 POST 方法
        headers: {
          'Content-Type': 'application/json', // 設定請求的內容類型
        },
        body: JSON.stringify(formData), // 將表單資料轉換為 JSON 格式
      })

      if (response.ok) {
        setShowModal(true)

        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        })
      } else {
        alert('提交失敗，請稍後再試！')
      }
    } catch (error) {
      console.error('提交表單時發生錯誤：', error)
      alert('提交失敗，請檢查您的網路連線！')
    }
  }

  return (
    <div className={styles.pageWrapper}>
      {/* 版首 */}
      <div className={styles.imageContainer}>
        <div className={styles.heroImage}>
          <h1>CONTACT US</h1>
          <h2>聯絡我們</h2>
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/6450f8ecb0c2b20faf4281b53a69621902c74417?placeholderIfAbsent=true"
            className={styles.rightDecoration}
            alt="Decoration"
          />
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/6ea0d3474bfe8fe95aff977946a5c9bb19c35fc8?placeholderIfAbsent=true"
            className={styles.leftDecoration}
            alt="Decoration"
          />
        </div>
      </div>
      {/* 常見問題 */}
      <div className={styles.faqSection}>
        {/* <h2>常見問題</h2>
        <p>以下是一些常見問題的分類</p> */}

        <div className={styles.faqRow}>
          <div className={styles.faqItem}>
            <div className={styles.faqIcon}>
              <GrArticle />
            </div>
            <div className={styles.faqItemTitle}>
              <h2>食譜相關</h2>
              <h3>步驟詳解</h3>
            </div>
            <p>
              若您在閱讀或操作食譜時遇到困難，無論是步驟不清楚、用料分量不明確，還是影片教學無法播放，歡迎隨時與我們聯繫。我們樂意提供更清楚的解說與補充，確保您在烹飪過程中順利完成每一道料理。
            </p>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqIcon}>
              <FaCartShopping />
            </div>
            <div className={styles.faqItemTitle}>
              <h2>商城相關</h2>
              <h3>買賣流程</h3>
            </div>
            <p>
              若您對購買流程、付款方式、配送時間或商品資訊有任何疑問，請聯繫我們的商城客服團隊。我們將協助您順利完成選購、下單、付款到收貨的每一個步驟，提供安心便捷的購物體驗。
            </p>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqIcon}>
              <RiCustomerService2Fill />
            </div>
            <div className={styles.faqItemTitle}>
              <h2>退換貨與客服</h2>
              <h3>立即聯繫</h3>
            </div>
            <p>
              若商品有瑕疵、錯誤出貨或不符合期待，請於收到商品後七日內聯繫我們申請退換貨。我們的客服團隊將依據退換貨政策，協助您快速處理問題，確保您的權益與滿意度。
            </p>
          </div>
        </div>
      </div>
      {/* 聯繫我們 */}
      <div className={styles.form}>
        <div className={styles.formWrapper}>
          <div className={styles.formContainer}>
            <h1>聯繫我們</h1>
            <h2>有任何疑問或建議？歡迎留言給我們！</h2>
          </div>

          <form className={styles.formFields} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <h3>姓名</h3>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="請輸入您的姓名"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <h3>郵件</h3>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="請輸入您的郵件"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <h3>主旨分類</h3>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              >
                <option value="">請選擇主旨類型</option>
                <option value="recipe">食譜相關</option>
                <option value="shop">商城相關</option>
                <option value="return">退換貨與客服</option>
                <option value="other">其他問題</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <h3>留言內容</h3>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="請輸入留言內容"
                rows="5"
                required
              ></textarea>
            </div>

            <button type="submit" className={styles.submitButton}>
              <h2> 送出</h2>
            </button>
            <SweetModal
              show={showModal}
              onHide={() => setShowModal(true)}
              title="發送成功!"
              message="感謝您的留言，我們會盡快回覆！"
              icon="info"
            />
          </form>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
