// RecipeCard.jsx
'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../src/styles/RecipeCard.module.scss' // 使用相對路徑

import {
  BsBookmarkStarFill,
  BsBookmarkPlus,
  MdFavorite,
  MdFavoriteBorder,
} from '../icons/icons'
import useSWR from 'swr'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/auth-context'
import { useRouter } from 'next/navigation'
import LoginModal from './LoginModal'
import FavoriteButton from './FavoriteButton'

import { API_SERVER } from '@/config/api-path'

export default function RecipeCard({
  id,
  image,
  title,
  description,
  initialFavorite = false,
  onFavoriteToggle,
  clickable = true,
  className = '',
}) {
  return (
    <div
      className={`${styles.recipeCard} ${className}`}
      // onClick={handleCardClick}
      style={{ cursor: clickable ? 'pointer' : 'default' }}
    >
      <Link key={id} href={`/recipes/${id}`} passHref>
        <div>
          <img src={image} alt={title} />
        </div>
        <span>
          <h3>{title}</h3>
          <p>{description}</p>
        </span>
      </Link>

      <FavoriteButton
        recipeId={id}
        initialFavorite={initialFavorite}
        onFavoriteToggle={onFavoriteToggle}
        className={styles.cardFavoriteButton}
      />
    </div>
  )
}
