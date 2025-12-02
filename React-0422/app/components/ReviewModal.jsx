import React, { useState, useEffect } from 'react'
import styles from '../src/styles/page-styles/ReviewModal.module.scss'
import { FaStar } from 'react-icons/fa'

export default function ReviewModal({ show, onHide, onSubmit, review, setReview }) {
  const [hoverRating, setHoverRating] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const MAX_CHARS = 35
  const MIN_RATING = 1

  useEffect(() => {
    if (show) {
      setIsVisible(true)
    }
  }, [show])

  if (!show) return null

  const handleRatingClick = rating => {
    setReview(prev => ({ ...prev, rating }))
  }

  const handleTextChange = e => {
    const text = e.target.value
    if (text.length <= MAX_CHARS) {
      setReview(prev => ({ ...prev, review_text: text }))
      setCharCount(text.length)
    }
  }

  const handleModalClose = () => {
    setIsVisible(false)
    setTimeout(onHide, 300) // 等待動畫結束後關閉
  }

  return (
    <div className={`${styles.modalOverlay} ${isVisible ? styles.visible : ''}`}>
      <div className={`${styles.modalContent} ${isVisible ? styles.visible : ''}`}>
        <div className={styles.modalHeader}>
          <h2>撰寫評論</h2>
          <button className={styles.closeButton} onClick={handleModalClose}>
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className={styles.reviewSection}>
            <div className={styles.sectionTitle}>整體評分</div>
            <div className={styles.ratingContainer}>
              <div className={styles.stars} onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map(star => (
                  <FaStar
                    key={star}
                    className={`${styles.star} ${
                      (hoverRating || review.rating) >= star ? styles.active : ''
                    }`}
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                  />
                ))}
              </div>
              <div className={styles.ratingText}>
                {review.rating ? `${review.rating} 顆星` : '請選擇評分'}
              </div>
            </div>
          </div>

          <div className={styles.reviewSection}>
            <div className={styles.sectionTitle}>評論內容</div>
            <div className={styles.textareaContainer}>
              <textarea
                placeholder="分享您的使用心得...(選填)"
                value={review.review_text}
                onChange={handleTextChange}
                maxLength={MAX_CHARS}
              />
              <div className={styles.charCount}>
                {charCount}/{MAX_CHARS}
              </div>
            </div>
          </div>

          <div className={styles.buttonContainer}>
            <button type="button" onClick={handleModalClose} className={styles.cancelButton}>
              取消
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!review.rating || review.rating < MIN_RATING}
            >
              送出評論
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
