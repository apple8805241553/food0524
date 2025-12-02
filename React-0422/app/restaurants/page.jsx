'use client'

import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from '@/app/src/styles/page-styles/RestaurantList.module.scss'
import RestaurantCard from '../components/RestaurantCard'
import { API_SERVER } from '@/config/api-path'
import Bread from '@/app/components/Bread'

export default function RestaurantsPage() {
  // 在 App Router 中使用 useParams 獲取路由參數
  const params = useParams()
  const id = params.id // 獲取動態路由參數

  // 如果需要獲取查詢參數，使用 useSearchParams
  const searchParams = useSearchParams()

  // 為確保客戶���渲染時能正確載入數據，添加一個加載狀態
  const [isLoading, setIsLoading] = useState(true)

  const [activePage, setActivePage] = useState(1) // 當前頁碼
  const itemsPerPage = 5 // 每頁顯示的餐廳數量
  // 添加搜尋狀態
  const [searchTerm, setSearchTerm] = useState('')
  // 使用 useEffect 確保客戶端渲染
  useEffect(() => {
    setIsLoading(false)
  }, [])
  const fetcher = (url) => fetch(url).then((res) => res.json())

  // 使用 useSWR 來抓取資料
  const { data, error } = useSWR(
    `${API_SERVER}/restaurants/api?page=${activePage}&limit=${itemsPerPage}`,
    fetcher
  )

  // 獲取數據
  const restaurants = data?.rows || []
  const totalPages = data?.totalPages || 1

  // 過濾餐廳數據
  const filteredRestaurants = restaurants.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 計算篩選後的總頁數
  const filteredTotalPages = Math.ceil(
    filteredRestaurants.length / itemsPerPage
  )

  // 計算當前頁面的餐廳資料 (目前沒用到)
  // const startIndex = (activePage - 1) * itemsPerPage
  // const currentRestaurants = restaurants.slice(
  //   startIndex,
  //   startIndex + itemsPerPage
  // )

  const handlePageChange = (pageNumber) => {
    // 更新頁碼狀態
    setActivePage(pageNumber)
    // 不需要手動觸發 mutate，因為 activePage 改變會導致 useSWR 的 key 改變，自動重新獲取數據
  }

  // 渲染邏輯
  if (error) return <div>Error: {error.message}</div>
  if (!data) return <div>正在加載餐廳數據...</div>
  // if (!id) return <div>錯誤: 找不到餐廳ID</div>

  return (
    <>
      {/* <Bread items={[{ text: '首頁', href: '/' }, { text: '餐廳列表' }]} /> */}
      <div className={styles.pageContainer}>
        {/* 版頭 */}
        <div className={styles.heroSection}>
          <div className={styles.heroContentWrapper}>
            <div className={styles.heroContent}>
              <h1>精選餐廳推薦</h1>
              <p>
                探索台北最具特色的美食餐廳，從傳統小吃到高級料理，滿足您的味蕾享受
              </p>
            </div>
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="搜尋餐廳名稱或描述..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setActivePage(1)
                }}
              />
              <button onClick={() => setSearchTerm(searchTerm)}>搜尋</button>
            </div>
          </div>
          <div className={styles.heroImageContainer}>
            <img
              src="/images/restaurant/r01.webp"
              className={styles.heroImage}
              alt="餐廳美食"
            />
          </div>
        </div>

        {/* 餐廳介紹 */}
        <div className={styles.restaurantListSection}>
          <h1>餐廳介紹</h1>
          <div className={styles.restaurantList}>
            {filteredRestaurants.length > 0 ? (
              
              filteredRestaurants.map((restaurant) => (
                
                <RestaurantCard
                  key={restaurant.id}
                  id={restaurant.id}
                  image={restaurant.image}
                  name={restaurant.name}
                  description={restaurant.description}
                  badge={restaurant.badge}
                />
              ))
            ) : (
              <p className={styles.noResults}>
                沒有找到符合條件的餐廳，等等我們再增加新文章囉~
              </p>
            )}
          </div>
        </div>
        
        {/* 頁碼 */}
        <div className={styles.pagination}>
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/53f72b1cdd510a8160b76260d08cccc39de9e6a2?placeholderIfAbsent=true"
            className={styles.paginationArrow}
            alt="上一頁"
            onClick={() => handlePageChange(Math.max(activePage - 1, 1))}
          />

          {Array.from({ length: filteredTotalPages }, (_, index) => (
            <div key={index + 1} className={styles.pageNumberContainer}>
              <div
                className={`${styles.pageNumber} ${activePage === index + 1 ? styles.pageNumberActive : ''}`}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </div>
            </div>
          ))}

          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/48cafdb4ef4bb734d63a486bf58abbe94c28b5d3?placeholderIfAbsent=true"
            className={styles.paginationArrow}
            alt="下一頁"
            onClick={() =>
              handlePageChange(Math.min(activePage + 1, filteredTotalPages))
            }
          />
        </div>
      </div>
    </>
  )
}
