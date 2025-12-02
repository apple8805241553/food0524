// ShopCard.jsx
import React, { useState } from 'react'
import Link from 'next/link'
import styles from '../src/styles/ShopList.module.scss' // 使用相對路徑

import { MdFavorite, MdFavoriteBorder } from '../icons/icons'

export default function ShopCard({
  id,
  image,
  name,
  brand,
  price,
  original_price,
  initialFavorite = false,
  onFavoriteToggle,
  clickable = true,
  showViewButton = false,
  className = '',
}) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite)

  const handleFavoriteClick = (e) => {
    e.stopPropagation() // 防止點擊收藏圖標時觸發卡片點擊
    setIsFavorite(!isFavorite)
    if (onFavoriteToggle) {
      onFavoriteToggle(id, !isFavorite)
    }
  }

  const handleCardClick = () => {
    if (clickable) {
      // 跳轉到菜譜詳情頁
      window.location.href = `/shop/${id}`
      // 或使用Next.js的路由: router.push(`/shop/${id}`);
    }
  }

  return (
    <div
      className={`${styles.shopCard} ${className}`}
      onClick={handleCardClick}
      style={{ cursor: clickable ? 'pointer' : 'default' }}
    >
      <div className={styles.shopCardImg}>
        <img
          src={image} // 從 public 資料夾的根目錄開始
          alt={name}
        />
      </div>
      <span>
        <div>
          <p>{name}</p>
          <h3>{brand}</h3>
        </div>
        <div>
          <p>${original_price}</p>
          <h2>${price}</h2>
        </div>
      </span>

      {/* 收藏按鈕 Start */}
      <button
        alt={isFavorite ? '已收藏' : '加入收藏'}
        onClick={handleFavoriteClick}
        style={{ cursor: 'pointer' }}
      >
        {/* <MdFavorite /> */}
        <MdFavoriteBorder />
      </button>
      {/* 收藏按鈕 End */}
    </div>
  )
}
