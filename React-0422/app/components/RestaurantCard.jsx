'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/app/src/styles/page-styles/RestaurantList.module.scss'

export default function RestaurantCard({
  id,
  image,
  name,
  description,
  badge = '推薦',
  onClick,
}) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.push(`/restaurants/${id}`)
    }
  }

  console.log('Restaurant name:', name) // 在 return 之前添加此行進行偵錯

  return (
    <div className={styles.restaurantCard} onClick={handleClick}>
      <div>{console.log('Restaurant name:', name)}</div>
      <img src={image} className={styles.restaurantImage} alt={name} />
      <div className={styles.cardContent}>
        <div className={styles.cardTitle}>{name}</div>
        {/* <div className={styles.cardBadge}>{badge}</div> */}
        <div className={styles.cardTextContainer}>
          <div className={styles.cardDescription}>{description}</div>
        </div>
      </div>
    </div>
  )
}
