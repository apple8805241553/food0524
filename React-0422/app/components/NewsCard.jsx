"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/RestaurantList.module.css';

export default function NewsCard({ 
  id, 
  image, 
  title, 
  description, 
  badge = "新聞",
  onClick 
}) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/news/${id}`);
    }
  };

  return (
    <div className={styles.restaurantCard} onClick={handleClick}>
      <img 
        src={image} 
        className={styles.restaurantImage} 
        alt={title} 
      />
      <div className={styles.cardContent}>
        <div className={styles.cardBadge}>{badge}</div>
        <div className={styles.cardTextContainer}>
          <div className={styles.cardTitle}>{title}</div>
          <div className={styles.cardDescription}>{description}</div>
        </div>
      </div>
    </div>
  );
}