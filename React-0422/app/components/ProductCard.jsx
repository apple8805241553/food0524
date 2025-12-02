'use client'

import React, { useState } from 'react'
import styles from '../src/styles/ShopList.module.scss'
import { MdFavorite, MdFavoriteBorder } from '../icons/icons'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../hooks/auth-context' //  引入你的 Auth hook
import LoginModal from '@/app/components/LoginModal'
export const ProductCard = ({
  id = 0,
  name = 'Product Name',
  image = '/placeholder.jpg',
  brand = '',
  price = '',
  original_price = '',
  clickable = true,
  initialFavorite = false,
  onFavoriteToggle,
}) => {
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const router = useRouter()
  const { auth } = useAuth() //  使用 auth context 拿 user.id
  const [showLoginModal, setShowLoginModal] = useState(false)

  const handleFavoriteClick = async (e) => {
    e.stopPropagation()

    if (!auth?.user_id) {
      setShowLoginModal(true)
      return
    }

    const baseUrl = 'http://localhost:3001'

    try {
      const res = await fetch(`${baseUrl}/products/api/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`, // 加入 JWT token
        },
        body: JSON.stringify({
          user_id: auth.user_id,
          product_id: id,
        }),
        // credentials: 'include', // 確保 cookie 可以被發送
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('API 錯誤:', data.message)
        return
      }

      setIsFavorite(!isFavorite)
      if (onFavoriteToggle) {
        onFavoriteToggle(id, !isFavorite)
      }

      // 可以加入提示訊息
      console.log(data.message)
    } catch (error) {
      console.error('fetch 錯誤:', error)
    }
  }

  const handleClick = () => {
    // 先觸發平滑滾動
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })

    // 然後導航到新頁面
    router.push(`/products/${id}`)
  }

  return (
    <div
      className={styles.shopCard}
      onClick={handleClick}
      style={{ cursor: clickable ? 'pointer' : 'default' }}
    >
      <div className={styles.shopCardImg}>
        <img src={image} alt={name} />
      </div>
      <span>
        <div>
          <p>{brand}</p>
          <h3>{name}</h3>
        </div>
        <div>
          <p>NT$ {Math.floor(original_price).toLocaleString()}</p>
          <h2>NT$ {Math.floor(price).toLocaleString()}</h2>
        </div>
      </span>

      <button
        alt={isFavorite ? '已收藏' : '加入收藏'}
        onClick={handleFavoriteClick}
        className={`${styles.wishlistButton} ${isFavorite ? styles.active : ''}`}
      >
        {isFavorite ? <MdFavorite /> : <MdFavoriteBorder />}
        <LoginModal
          show={showLoginModal}
          onHide={() => setShowLoginModal(false)}
          message="需要登入才能使用喔！"
          onNavigateToLogin={() => {
            setShowLoginModal(false)
            router.push('/login')
          }}
        />
      </button>
    </div>
  )
}

export default ProductCard
