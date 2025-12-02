'use client'
import React, { useState, useEffect } from 'react'
import { BsBookmarkStarFill, BsBookmarkPlus } from '../icons/icons'
import { useAuth } from '@/hooks/auth-context'
import LoginModal from './LoginModal'
import { useRouter } from 'next/navigation'
import styles from '../src/styles/RecipeCard.module.scss'
import { MdFavorite, MdFavoriteBorder } from '../icons/icons'

export default function FavoriteButton({
  recipeId,
  initialFavorite = false,
  onFavoriteToggle,
  className = '',
}) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { auth } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setIsFavorite(initialFavorite)
  }, [initialFavorite])

  const handleFavoriteClick = (e) => {
    e.stopPropagation()

    if (!auth || !auth.token) {
      setShowLoginModal(true)
      return
    }

    const newFavoriteStatus = !isFavorite
    setIsFavorite(newFavoriteStatus)

    if (onFavoriteToggle) {
      onFavoriteToggle(recipeId)
    }
  }

  return (
    <>
      <button
        className={`${styles.wishlistButton} ${isFavorite ? styles.active : ''}`}
        onClick={handleFavoriteClick}
        style={{ cursor: 'pointer' }}
        aria-label={isFavorite ? '已收藏' : '加入收藏'}
      >
        {isFavorite ? <MdFavorite /> : <MdFavoriteBorder />}
      </button>

      <LoginModal
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
        message="需要登入才能收藏食譜喔！"
        onNavigateToLogin={() => {
          setShowLoginModal(false)
          router.push('/login')
        }}
      />
    </>
  )
}
