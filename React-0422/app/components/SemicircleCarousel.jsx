import { useState, useEffect, useCallback, useRef } from 'react'
import styles from '../src/styles/SemicircleCarousel.module.scss'

const SemicircleCarousel = () => {
  // 直接在组件中定义静态图片路径
  const images = [
    {
      src: './images/restaurant/r01.webp',
      alt: '幻灯片 1',
      title: '美味佳肴',
      description: '我們提供最優質的料理，每一道菜都是廚師的心血結晶。',
    },
    {
      src: './images/restaurant/r02.webp',
      alt: '幻灯片 2',
      title: '舒適環境',
      description:
        '精心打造的用餐空間，讓您在享用美食的同時，也能感受到愉悅的氛圍。',
    },
    {
      src: './images/restaurant/r03.webp',
      alt: '幻灯片 3',
      title: '精選食材',
      description: '我們堅持使用最新鮮的食材，確保每一道菜品的品質和口感。',
    },
    {
      src: './images/restaurant/r04.webp',
      alt: '幻灯片 4',
      title: '專業服務',
      description: '我們的服務團隊經過專業培訓，為您提供貼心周到的服務。',
    },
    {
      src: './images/restaurant/r05.webp',
      alt: '幻灯片 5',
      title: '創新菜單',
      description: '定期更新菜單，融合傳統與創新，帶給您不同凡響的味覺體驗。',
    },
    {
      src: './images/restaurant/r06.webp',
      alt: '幻灯片 6',
      title: '完美體驗',
      description: '從味覺到視覺，我們致力於為您提供完美的用餐體驗。',
    },
  ]
  // 當前顯示的幻燈片索引
  const [currentSlide, setCurrentSlide] = useState(0)
  // 用於保存自動輪播的計時器引用
  const intervalRef = useRef(null)

  // 切換到下一張幻燈片
  const nextSlide = useCallback(() => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % images.length)
  }, [images.length])

  // 切換到上一張幻燈片
  const prevSlide = useCallback(() => {
    setCurrentSlide(
      (prevSlide) => (prevSlide - 1 + images.length) % images.length
    )
  }, [images.length])

  // 開始自動輪播
  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    intervalRef.current = setInterval(nextSlide, 5000) // 每5秒切換一次
  }, [nextSlide])

  // 停止自動輪播
  const stopAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // 點擊指示點時的處理函數
  const handleDotClick = (index) => {
    stopAutoSlide()
    setCurrentSlide(index)
    startAutoSlide()
  }

  // 點擊導航按鈕時的處理函數
  const handleNavClick = (direction) => {
    stopAutoSlide()
    if (direction === 'next') {
      nextSlide()
    } else {
      prevSlide()
    }
    startAutoSlide()
  }

  // 組件掛載時開始自動輪播，卸載時清除計時器
  useEffect(() => {
    startAutoSlide()
    return () => stopAutoSlide()
  }, [startAutoSlide, stopAutoSlide])

  return (
    <div className={styles.container}>
      <div className={styles.semicircleContainer}>
        <div className={styles.carousel}>
          {/* 輪播圖片 */}
          {images.map((image, index) => (
            <div
              key={index}
              className={`${styles.slide} ${index === currentSlide ? styles.active : ''}`}
              style={{ display: index === currentSlide ? 'block' : 'none' }} // 直接使用內聯樣式確保隱藏
            >
              <img src={image.src} alt={image.alt} />
              <div className={styles.slideContent}>
                <h1>{image.title}</h1>
                <h2>{image.description}</h2>
              </div>
            </div>
          ))}

          {/* 指示點 */}
          <div className={styles.dots}>
            {images.map((_, index) => (
              <div
                key={index}
                className={`${styles.dot} ${index === currentSlide ? styles.active : ''}`}
                onClick={() => handleDotClick(index)}
              />
            ))}
          </div>

          {/* 導航按鈕 */}
          <div className={styles.nav}>
            <button
              className={`${styles.navButton} ${styles.prev}`}
              onClick={() => handleNavClick('prev')}
              aria-label="上一張"
            >
              ←
            </button>
            <button
              className={`${styles.navButton} ${styles.next}`}
              onClick={() => handleNavClick('next')}
              aria-label="下一張"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SemicircleCarousel
