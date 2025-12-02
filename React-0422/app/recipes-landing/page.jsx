'use client'

import React from 'react'
import styles from '../src/styles/page-styles/RecipeLanding.module.scss'
import Link from 'next/link'
import RecipeCard from '@/app/components/RecipeCard'

import useSWR from 'swr'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { API_SERVER } from '@/config/api-path'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/auth-context'

import PageTransition from '@/app/components/PageTransition'

import {
  HiViewGridAdd,
  HiOutlineViewGridAdd,
  FaSearch,
  FaCakeCandles,
  FaFishFins,
  FaEarthAmericas,
  BiSolidBowlRice,
  LuDessert,
  LuSalad,
  TbMeat,
  MdOutlineRamenDining,
} from '../icons/icons'
//dynamic import
// 這邊是為了讓RecipeCarousel這個元件不會在伺服器端渲染，因為它裡面有使用useState和useEffect等hook
import dynamic from 'next/dynamic'
const RecipeCarousel = dynamic(() => import('./components/RecipeCarousel'), {
  ssr: false, // 這樣就不會在伺服器端渲染了
})
// import RecipeCarousel from './components/RecipeCarousel'

export default function RecipesLandingPage() {
  const { auth } = useAuth() || {} // 使用 useAuth 鉤子獲取用戶信息

  const router = useRouter()
  const [favorites, setFavorites] = useState({})
  const [favoritesLoaded, setFavoritesLoaded] = useState(false)
  const [activeCategory, setActiveCategory] = useState('肉食') // 用於追蹤當前選中的分類

  // 如果需要獲取查詢參數，使用 useSearchParams
  const searchParams = useSearchParams()

  // 為確保客戶端渲染時能正確載入數據，添加一個加載狀態
  const [isLoading, setIsLoading] = useState(true)

  const [activePage, setActivePage] = useState(1) // 當前頁碼
  const itemsPerPage = 5 // 每頁顯示的餐廳數量
  // 使用 useEffect 確保客戶端渲染
  useEffect(() => {
    setIsLoading(false)
  }, [])
  const fetcher = (url) => fetch(url).then((res) => res.json())

  // 使用 useSWR 來抓取資料
  const { data, error } = useSWR(`${API_SERVER}/recipes/api/category`, fetcher)

  // 獲取數據
  const restaurants = data?.rows || []
  const totalPages = data?.totalPages || 10

  const handleCategory = (category) => {
    setActiveCategory(category) // 設定當前選中的分類
  }

  const handleSearch = (category) => {
    router.push(`/recipes-landing/list?page=1&keyword=${category}`)
  }

  // 從後端獲取收藏狀態
  useEffect(() => {
    console.log('Authorization Token:', auth) // 檢查 token 是否正確

    const fetchFavorites = async () => {
      console.log('Authorization Token:', auth.token)
      try {
        const response = await fetch(`${API_SERVER}/recipes/api/favorite/get`, {
          headers: {
            Authorization: `Bearer ${auth.token}`, // 假設需要用戶的 token
          },
        })
        const data = await response.json()
        // console.log('Fetched Favorites:', data.favorites)
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

  // 處理收藏切換
  const toggleFavorite = (recipeId) => {
    const newFavoriteStatus = !favorites[recipeId]

    // 更新前端狀態
    setFavorites((prev) => ({
      ...prev,
      [recipeId]: newFavoriteStatus,
    }))

    // 發送 API 請求更新後端狀態
    fetch(`${API_SERVER}/recipes/api/favorite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({
        userId: auth.user_id,
        recipeId,
        isFavorite: newFavoriteStatus,
      }),
    }).catch((error) => {
      console.error('更新收藏狀態失敗:', error)
    })
  }

  const [visibleRange, setVisibleRange] = useState([0, 7]) // 預設桌機顯示 7 個

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 770) {
        setVisibleRange([0, 3]) // 手機只顯示 3 個
      } else if (window.innerWidth <= 1245) {
        setVisibleRange([0, 5]) // 平板顯示 5 個
      } else {
        setVisibleRange([0, 7]) // 桌機顯示 7 個
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 右邊箭頭
  const handleNext = () => {
    if (visibleRange[1] < categories.length) {
      setVisibleRange([visibleRange[0] + 1, visibleRange[1] + 1])
    }
  }
  // 左邊箭頭
  const handlePrev = () => {
    if (visibleRange[0] > 0) {
      setVisibleRange([visibleRange[0] - 1, visibleRange[1] - 1])
    }
  }

  // 分類的資料，分類名以及它的icon (要加新分類icon的話要在這邊寫)
  const categories = [
    { name: '總覽', icon: <HiOutlineViewGridAdd /> },
    { name: '肉食', icon: <TbMeat /> },
    { name: '蔬食', icon: <LuSalad /> },
    { name: '甜點', icon: <LuDessert /> },
    { name: '飯食', icon: <BiSolidBowlRice /> },
    { name: '異國', icon: <FaEarthAmericas /> },
    { name: '生鮮', icon: <FaFishFins /> },
    { name: '糕點', icon: <FaCakeCandles /> },
    { name: '麵食', icon: <MdOutlineRamenDining /> },
  ]

  return (
    <div>
      <PageTransition>
        {/* 版首輪播 Start */}
        <RecipeCarousel />
        {/* 版首輪播 END */}

        <div className={styles.container}>
          {/* 食譜ICON選單 Start */}
          <div className={styles.categoriesContainer}>
            <button onClick={handlePrev} disabled={visibleRange[0] === 0}>
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/53f72b1cdd510a8160b76260d08cccc39de9e6a2?placeholderIfAbsent=true"
                className={styles.arrowIcon}
                alt="Left arrow"
              />
            </button>
            <div className={styles.categoriesWrapper}>
              {categories
                .slice(visibleRange[0], visibleRange[1])
                .map((category, index) => (
                  <button
                    key={index}
                    className={styles.categoryIcon}
                    onClick={() => {
                      if (category.name === '總覽') {
                        router.push('/recipes-landing/list')
                      } else {
                        handleCategory(category.name)
                      }
                    }}
                  >
                    {category.icon}
                    {category.name}
                  </button>
                ))}
            </div>
            <button
              onClick={handleNext}
              disabled={visibleRange[1] >= categories.length}
            >
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/48cafdb4ef4bb734d63a486bf58abbe94c28b5d3?placeholderIfAbsent=true"
                className={styles.arrowIcon}
                alt="Right arrow"
              />
            </button>
          </div>
          {/* 食譜ICON選單 END */}
          {/* 確認資料有沒有拉對用的 */}
          {/* <div>{JSON.stringify(data)}</div> */}
          {/* 食譜菜單 Start */}

          {/* 肉食 */}
          {activeCategory === '肉食' && (
            <div className={styles.recipeSection}>
              <div className={styles.recipeBlock}>
                <div className={styles.recipeCategory}>
                  <img
                    src="/images/recipes-img/recipes_landing-10.webp"
                    className={styles.categoryBackground}
                    alt="Desserts background"
                  />
                  <div className={styles.categoryTitle}>肉食</div>
                  <button
                    onClick={() => handleSearch('肉食')}
                    className={styles.viewMoreButton}
                  >
                    <h2>看更多</h2>
                  </button>
                </div>
                <div className={styles.recipeCardsSection}>
                  <div className={styles.recipeCardsContainer}>
                    {data?.rows
                      .filter((recipe) => recipe.categories?.includes('肉食'))
                      .sort((a, b) => a.id - b.id) // 按ID穩定排序
                      .slice(0, 6) // 過濾出分類為「肉食」的資料，取前6筆
                      .map((recipe) => (
                        <RecipeCard
                          key={recipe.id}
                          id={recipe.id}
                          image={recipe.image}
                          title={recipe.recipe_title}
                          description={recipe.recipe_description}
                          initialFavorite={favorites[recipe.id] || false}
                          onFavoriteToggle={toggleFavorite}
                        />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* 蔬食 */}
          {activeCategory === '蔬食' && (
            <div className={styles.recipeSection}>
              <div className={styles.recipeBlock}>
                <div className={styles.recipeCategory}>
                  <img
                    src="/images/recipes-img/recipes_landing-06.webp"
                    className={styles.categoryBackground}
                    alt="Desserts background"
                  />
                  <div className={styles.categoryTitle}>蔬食</div>
                  <button
                    onClick={() => handleSearch('蔬食')}
                    className={styles.viewMoreButton}
                  >
                    <h2>看更多</h2>
                  </button>
                </div>
                <div className={styles.recipeCardsSection}>
                  <div className={styles.recipeCardsContainer}>
                    {data?.rows
                      .filter((recipe) => recipe.categories?.includes('蔬食'))
                      .sort((a, b) => a.id - b.id) // 按ID穩定排序
                      .slice(0, 6) // 過濾出分類為「蔬食」的資料，取前6筆
                      .map((recipe) => (
                        <RecipeCard
                          key={recipe.id}
                          id={recipe.id}
                          image={recipe.image}
                          title={recipe.recipe_title}
                          description={recipe.recipe_description}
                          initialFavorite={favorites[recipe.id] || false}
                          onFavoriteToggle={toggleFavorite}
                        />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* 甜點 */}
          {activeCategory === '甜點' && (
            <div className={styles.recipeSection}>
              <div className={styles.recipeBlock}>
                <div className={styles.recipeCategory}>
                  <img
                    src="/images/recipes-img/recipes_landing-07.webp"
                    className={styles.categoryBackground}
                    alt="Desserts background"
                  />
                  <div className={styles.categoryTitle}>甜點</div>
                  <button
                    onClick={() => handleSearch('甜點')}
                    className={styles.viewMoreButton}
                  >
                    <h2>看更多</h2>
                  </button>
                </div>
                <div className={styles.recipeCardsSection}>
                  <div className={styles.recipeCardsContainer}>
                    {data?.rows
                      .filter((recipe) => recipe.categories?.includes('甜點'))
                      .sort((a, b) => a.id - b.id) // 按ID穩定排序
                      .slice(0, 6) // 過濾出分類為「甜點」的資料，取前6筆
                      .map((recipe) => (
                        <RecipeCard
                          key={recipe.id}
                          id={recipe.id}
                          image={recipe.image}
                          title={recipe.recipe_title}
                          description={recipe.recipe_description}
                          initialFavorite={favorites[recipe.id] || false}
                          onFavoriteToggle={toggleFavorite}
                        />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* 飯食 */}
          {activeCategory === '飯食' && (
            <div className={styles.recipeSection}>
              <div className={styles.recipeBlock}>
                <div className={styles.recipeCategory}>
                  <img
                    src="/images/recipes-img/recipes_landing-08.webp"
                    className={styles.categoryBackground}
                    alt="Desserts background"
                  />
                  <div className={styles.categoryTitle}>飯食</div>
                  <button
                    onClick={() => handleSearch('飯食')}
                    className={styles.viewMoreButton}
                  >
                    <h2>看更多</h2>
                  </button>
                </div>
                <div className={styles.recipeCardsSection}>
                  <div className={styles.recipeCardsContainer}>
                    {data?.rows
                      .filter((recipe) => recipe.categories?.includes('飯食'))
                      .sort((a, b) => a.id - b.id) // 按ID穩定排序
                      .slice(0, 6) // 過濾出分類為「飯食」的資料，取前6筆
                      .map((recipe) => (
                        <RecipeCard
                          key={recipe.id}
                          id={recipe.id}
                          image={recipe.image}
                          title={recipe.recipe_title}
                          description={recipe.recipe_description}
                          initialFavorite={favorites[recipe.id] || false}
                          onFavoriteToggle={toggleFavorite}
                        />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* 異國 */}
          {activeCategory === '異國' && (
            <div className={styles.recipeSection}>
              <div className={styles.recipeBlock}>
                <div className={styles.recipeCategory}>
                  <img
                    src="/images/recipes-img/recipes_landing-09.webp"
                    className={styles.categoryBackground}
                    alt="Desserts background"
                  />
                  <div className={styles.categoryTitle}>異國</div>
                  <button
                    onClick={() => handleSearch('異國')}
                    className={styles.viewMoreButton}
                  >
                    <h2>看更多</h2>
                  </button>
                </div>
                <div className={styles.recipeCardsSection}>
                  <div className={styles.recipeCardsContainer}>
                    {data?.rows
                      .filter((recipe) => recipe.categories?.includes('異國'))
                      .sort((a, b) => a.id - b.id) // 按ID穩定排序
                      .slice(0, 6) // 過濾出分類為「異國」的資料，取前6筆
                      .map((recipe) => (
                        <RecipeCard
                          key={recipe.id}
                          id={recipe.id}
                          image={recipe.image}
                          title={recipe.recipe_title}
                          description={recipe.recipe_description}
                          initialFavorite={favorites[recipe.id] || false}
                          onFavoriteToggle={toggleFavorite}
                        />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* 生鮮 */}
          {activeCategory === '生鮮' && (
            <div className={styles.recipeSection}>
              <div className={styles.recipeBlock}>
                <div className={styles.recipeCategory}>
                  <img
                    src="/images/recipes-img/recipes_landing-10.webp"
                    className={styles.categoryBackground}
                    alt="Desserts background"
                  />
                  <div className={styles.categoryTitle}>生鮮</div>
                  <button
                    onClick={() => handleSearch('生鮮')}
                    className={styles.viewMoreButton}
                  >
                    <h2>看更多</h2>
                  </button>
                </div>
                <div className={styles.recipeCardsSection}>
                  <div className={styles.recipeCardsContainer}>
                    {data?.rows
                      .filter((recipe) => recipe.categories?.includes('生鮮'))
                      .sort((a, b) => a.id - b.id) // 按ID穩定排序
                      .slice(0, 6) // 過濾出分類為「生鮮」的資料，取前6筆
                      .map((recipe) => (
                        <RecipeCard
                          key={recipe.id}
                          id={recipe.id}
                          image={recipe.image}
                          title={recipe.recipe_title}
                          description={recipe.recipe_description}
                          initialFavorite={favorites[recipe.id] || false}
                          onFavoriteToggle={toggleFavorite}
                        />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* 糕點 */}
          {activeCategory === '糕點' && (
            <div className={styles.recipeSection}>
              <div className={styles.recipeBlock}>
                <div className={styles.recipeCategory}>
                  <img
                    src="/images/recipes-img/recipes_landing-11.webp"
                    className={styles.categoryBackground}
                    alt="Desserts background"
                  />
                  <div className={styles.categoryTitle}>糕點</div>
                  <button
                    onClick={() => handleSearch('糕點')}
                    className={styles.viewMoreButton}
                  >
                    <h2>看更多</h2>
                  </button>
                </div>
                <div className={styles.recipeCardsSection}>
                  <div className={styles.recipeCardsContainer}>
                    {data?.rows
                      .filter((recipe) => recipe.categories?.includes('糕點'))
                      .sort((a, b) => a.id - b.id) // 按ID穩定排序
                      .slice(0, 6) // 過濾出分類為「糕點」的資料，取前6筆
                      .map((recipe) => (
                        <RecipeCard
                          key={recipe.id}
                          id={recipe.id}
                          image={recipe.image}
                          title={recipe.recipe_title}
                          description={recipe.recipe_description}
                          initialFavorite={favorites[recipe.id] || false}
                          onFavoriteToggle={toggleFavorite}
                        />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* 麵食 */}
          {activeCategory === '麵食' && (
            <div className={styles.recipeSection}>
              <div className={styles.recipeBlock}>
                <div className={styles.recipeCategory}>
                  <img
                    src="/images/recipes-img/recipes_landing-12.webp"
                    alt="Noodle background"
                  />
                  <div className={styles.categoryTitle}>麵食</div>
                  <button
                    onClick={() => handleSearch('麵食')}
                    className={styles.viewMoreButton}
                  >
                    <h2>看更多</h2>
                  </button>
                </div>
                <div className={styles.recipeCardsSection}>
                  <div className={styles.recipeCardsContainer}>
                    {data?.rows
                      .filter((recipe) => recipe.categories?.includes('麵食'))
                      .sort((a, b) => a.id - b.id) // 按ID穩定排序
                      .slice(0, 6) // 過濾出分類為「麵食」的資料，取前6筆
                      .map((recipe) => (
                        <RecipeCard
                          key={recipe.id}
                          id={recipe.id}
                          image={recipe.image}
                          title={recipe.recipe_title}
                          description={recipe.recipe_description}
                          initialFavorite={favorites[recipe.id] || false}
                          onFavoriteToggle={toggleFavorite}
                        />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 你可能會喜歡 Start */}
        <div className={styles.featuredSection}>
          <div>
            <h2>你可能會喜歡</h2>
            <div className={styles.featuredContainer}>
              {data?.rows
                /* 減去 0.5，就會得到一個介於 -0.5 到 0.5 之間的值。
              這個值正負隨機，所以 .sort() 的比較結果也就隨機，從而讓陣列被隨機打亂。 */
                .sort(() => Math.random() - 0.5) // 隨機打亂陣列
                .slice(0, 5) // 取出前 6 筆資料
                .map((recipe) => (
                  <div key={recipe.id} className={styles.featuredCard}>
                    <Link
                      key={recipe.id}
                      href={`/recipes/${recipe.id}`}
                      passHref
                    >
                      <div className={styles.featuredCardImage}>
                        <img src={recipe.image} alt="Featured recipe" />
                      </div>
                      <h2>{recipe.recipe_title}</h2>
                    </Link>
                  </div>
                ))}
            </div>
          </div>
        </div>
        {/* 你可能會喜歡 End */}
      </PageTransition>
    </div>
  )
}
