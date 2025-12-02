'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../../src/styles/page-styles/RecipeList.module.scss'
import useSWR from 'swr'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/auth-context'
import RecipeCard from '@/app/components/RecipeCard'
import { API_SERVER } from '../../../config/api-path'
import { IoIosArrowBack } from '../../icons/icons'
import Bread from '@/app/components/Bread'
import PageTransition from '@/app/components/PageTransition'

const RECIPES_PER_PAGE = 12

export default function RecipeListPage() {
  const { auth } = useAuth() || {} // 使用 useAuth 鉤子獲取用戶信息
  const searchParams = useSearchParams()
  const currentPage = parseInt(searchParams.get('page') || 1, 10) // 確保是數字
  const keyword = searchParams.get('keyword') || ''

  console.log('auth:', auth) // 確認 auth 是否正確獲取
  // console.log('TOKEN', auth.token)

  const fetcher = (url) => fetch(url).then((res) => res.json())

  const { data, isLoading, error } = useSWR(
    `${API_SERVER}/recipes/api?page=${currentPage}&limit=${RECIPES_PER_PAGE}&keyword=${encodeURIComponent(keyword)}`,
    fetcher
  )

  const recipes = data?.rows || []
  const [totalPages, setTotalPages] = useState(1) // 初始化 totalPages 為 1
  // 收藏功能
  const [favorites, setFavorites] = useState({})
  const [favoritesLoaded, setFavoritesLoaded] = useState(false)
  console.log(favoritesLoaded)

  useEffect(() => {
    if (data?.totalPages) {
      setTotalPages(data.totalPages) // 從 API 響應中設置 totalPages
    }
  }, [data])

  useEffect(() => {
    console.log('Updated Favorites State:', favorites) // 確認 favorites 狀態
  }, [favorites])
  // 從後端獲取收藏狀態
  useEffect(() => {
    // console.log('Authorization Token:', auth.token) // 檢查 token 是否正確

    const fetchFavorites = async () => {
      // console.log('Authorization Token:', auth.token)
      try {
        const response = await fetch(`${API_SERVER}/recipes/api/favorite/get`, {
          headers: {
            Authorization: `Bearer ${auth.token}`, // 假設需要用戶的 token
          },
        })
        const data = await response.json()
        console.log('Fetched Favorites:', data.favorites)
        // 確認 favorites 資料

        setFavorites(data.favorites || {}) // 假設後端返回的格式是 { recipeId: true/false }
        setFavoritesLoaded(true) // 標記 favorites 已加載完成
      } catch (error) {
        console.error('載入收藏狀態失敗:', error)
      }
    }

    if (auth?.token) {
      fetchFavorites()
    }
  }, [auth])

  // 處理換頁
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      // 更新 URL 的查詢參數
      const params = new URLSearchParams(searchParams)
      params.set('page', newPage)
      window.history.pushState({}, '', `?${params.toString()}`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // 生成分頁按鈕
  const renderPaginationButtons = () => {
    let buttons = []
    for (let i = 1; i <= totalPages; i++) {
      buttons.push(
        <PaginationButton
          key={i}
          number={i.toString()}
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        />
      )
    }
    return buttons
  }

  // 處理收藏切換
  const toggleFavorite = (recipeId) => {
    const newFavoriteStatus = !favorites[recipeId]

    // 更新前端狀態
    setFavorites((prev) => ({
      ...prev,
      [recipeId]: newFavoriteStatus,
    }))

    // 發送 API 請求更新後端狀態
    try {
      fetch(`${API_SERVER}/recipes/api/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`, // 假設需要用戶的 token
        },
        body: JSON.stringify({
          userId: auth.id,
          recipeId,
          isFavorite: newFavoriteStatus,
        }),
      })
    } catch (error) {
      console.error('更新收藏狀態失敗:', error)
    }
  }

  return (
    <>
      <PageTransition>
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.breadContainer}>
              <Bread
                items={[
                  { text: '首頁', href: '/' },
                  { text: '食譜搜尋', href: '/recipes-landing' },
                  { text: '食譜列表', href: '' },
                ]}
              />
            </div>
            {/* Recipe Cards Section */}
            <div className={styles.recipeSection}>
              {isLoading && !favoritesLoaded ? ( // 確保 favorites 已加載
                <div className={styles.loading}>載入中...</div>
              ) : (
                <div className={styles.recipeGrid}>
                  {recipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      id={recipe.id}
                      image={recipe.image}
                      title={recipe.title}
                      description={recipe.description}
                      initialFavorite={favorites[recipe.id] || false}
                      onFavoriteToggle={toggleFavorite}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className={styles.paginationSection}>
              <div className={styles.pagination}>
                <h2
                  onClick={() => handlePageChange(currentPage - 1)}
                  style={{
                    cursor: currentPage > 1 ? 'pointer' : 'not-allowed',
                  }}
                >
                  <IoIosArrowBack />
                </h2>
                {renderPaginationButtons()}
                <h2
                  onClick={() => handlePageChange(currentPage + 1)}
                  style={{
                    cursor:
                      currentPage < totalPages ? 'pointer' : 'not-allowed',
                  }}
                >
                  <IoIosArrowBack />
                </h2>
              </div>
            </div>
          </div>
          {/* Featured Recipes 你可能會喜歡 */}
          <FeaturedRecipes />
        </div>
      </PageTransition>
    </>
  )
}

// 改進的分頁按鈕，添加了點擊事件
function PaginationButton({ number, active, onClick }) {
  return (
    <h3
      onClick={onClick}
      className={`${styles.paginationButton} ${active ? styles.paginationButtonActive : ''}`}
      style={{ cursor: 'pointer' }}
    >
      {number}
    </h3>
  )
}

// 你可能會喜歡組件，作為獨立組件抽出
function FeaturedRecipes() {
  const fetcher = (url) => fetch(url).then((res) => res.json())

  const { data, isLoading, error } = useSWR(
    `${API_SERVER}/recipes/api`,
    fetcher
  )

  const recipes = data?.rows || []

  const featuredItems = [
    {
      id: 1,
      image:
        'https://cdn.builder.io/api/v1/image/assets/TEMP/03ec9c50f4f087542c0afe378af3f1fcbfde20d4?placeholderIfAbsent=true',
      title: '希臘沙拉',
    },
    {
      id: 2,
      image:
        'https://cdn.builder.io/api/v1/image/assets/TEMP/7a43f4bfcd99333bfe6fba9d9d033a14bb4180e3?placeholderIfAbsent=true',
      title: '墨西哥玉米餅沙拉',
    },
    {
      id: 3,
      image:
        'https://cdn.builder.io/api/v1/image/assets/TEMP/50eea6438055fc117cb27e7139e9cfb30c596175?placeholderIfAbsent=true',
      title: '義式焗烤千層麵',
    },
    {
      id: 4,
      image:
        'https://cdn.builder.io/api/v1/image/assets/TEMP/9daf85a30c6cfdd8696f78da6f9d2c8b124c58de?placeholderIfAbsent=true',
      title: '巧克力熔岩蛋糕',
    },
    {
      id: 5,
      image:
        'https://cdn.builder.io/api/v1/image/assets/TEMP/6a641c0d98cb11a184268cea2ac7347ed8729889?placeholderIfAbsent=true',
      title: '台式滷肉飯',
    },
    {
      id: 6,
      image:
        'https://cdn.builder.io/api/v1/image/assets/TEMP/d8956660deb885f91af0a46651bf496bfe4f5de1?placeholderIfAbsent=true',
      title: '泰式綠咖哩雞',
    },
  ]

  return (
    <div className={styles.featuredSection}>
      <div>
        <h2>你可能會喜歡</h2>
        <div className={styles.featuredGrid}>
          {recipes
            .sort(() => Math.random() - 0.5) // 隨機打亂陣列
            .slice(0, 4) // 取出前 6 筆資料
            .map((item) => (
              <FeaturedRecipe
                key={item.id}
                image={item.image}
                title={item.title}
              />
            ))}
        </div>
      </div>
    </div>
  )
  function FeaturedRecipe({ image, title }) {
    return (
      <div className={styles.featuredCard}>
        <div className={styles.featuredCardImage}>
          <img src={image} alt={title} />
        </div>
        <h3 className={styles.featuredTitle}>{title}</h3>
      </div>
    )
  }
}
