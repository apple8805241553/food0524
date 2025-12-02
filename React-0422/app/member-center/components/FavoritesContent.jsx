'use client'

import React, { useState, useEffect, useMemo } from 'react'
import styles from '../styles/favorites-content.module.scss'
import { useAuth } from '@/hooks/auth-context'
import Image from 'next/image'
import Link from 'next/link'
import Swal from 'sweetalert2'
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io'
import { FaSearch } from 'react-icons/fa'
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa'

const ITEMS_PER_PAGE = 10 // 每頁顯示10筆資料

const FavoritesContent = () => {
  const [activeTab, setActiveTab] = useState('recipe') // 預設顯示食譜收藏
  const [allFavoriteProducts, setAllFavoriteProducts] = useState([]) // 食材收藏
  const [allFavoriteRecipes, setAllFavoriteRecipes] = useState([]) // 食譜收藏
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const { auth } = useAuth()

  const [currentPage, setCurrentPage] = useState(1) // 分頁相關狀態
  const [searchTerm, setSearchTerm] = useState('') // 搜尋關鍵字相關狀態
  const [sortOrder, setSortOrder] = useState('desc') // 排序相關狀態

  // 取得食材收藏列表
  const fetchFavoriteProducts = async () => {
    // 將 fetchFavoriteProducts 獨立出來，方便重用
    if (typeof process.env.NEXT_PUBLIC_BACKEND_URL === 'undefined') {
      console.error('NEXT_PUBLIC_BACKEND_URL is not defined.')
      setError('應用程式設定錯誤，無法連接至伺服器。')
      setIsLoading(false)
      return
    }

    if (!auth.token || activeTab !== 'ingredient') {
      setAllFavoriteProducts([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 取得用戶收藏商品的 API 請求
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/favorites/products`
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '無法解析錯誤回應' }))
        throw new Error(errorData.message || '無法載入收藏商品')
      }
      const data = await response.json()
      if (data.success && data.favorites) {
        setAllFavoriteProducts(data.favorites)
        setCurrentPage(1) // 每次重新獲取資料後回到第一頁
        setSearchTerm('') // 重新獲取資料後清空搜尋
      } else {
        throw new Error(data.message || '載入收藏商品失敗')
      }
    } catch (err) {
      console.error('Fetch favorite products error:', err)
      setError(err.message)
      setAllFavoriteProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  // 取得食譜收藏列表
  const fetchFavoriteRecipes = async () => {
    if (typeof process.env.NEXT_PUBLIC_BACKEND_URL === 'undefined') {
      console.error('NEXT_PUBLIC_BACKEND_URL is not defined.')
      setError('應用程式設定錯誤，無法連接至伺服器。')
      setIsLoading(false)
      return
    }

    if (!auth.token || activeTab !== 'recipe') {
      setAllFavoriteRecipes([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/favorites/recipes`
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '無法解析錯誤回應' }))
        throw new Error(errorData.message || '無法載入收藏食譜')
      }
      const data = await response.json()
      if (data.success && data.favorites) {
        setAllFavoriteRecipes(data.favorites)
      } else {
        throw new Error(data.message || '載入收藏食譜失敗')
      }
    } catch (err) {
      console.error('Fetch favorite recipes error:', err)
      setError(err.message)
      setAllFavoriteRecipes([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // 當 tab 切換或 token 改變時，重置搜尋和排序狀態
    setCurrentPage(1)
    setSearchTerm('')
    setSortOrder('desc')

    if (auth.token) {
      if (activeTab === 'ingredient') {
        fetchFavoriteProducts()
        setAllFavoriteRecipes([]) // 清空食譜收藏，避免殘留
      } else if (activeTab === 'recipe') {
        fetchFavoriteRecipes()
        setAllFavoriteProducts([]) // 清空食材收藏，避免殘留
      }
    } else {
      // 未登入時清空
      setAllFavoriteProducts([])
      setAllFavoriteRecipes([])
    }
  }, [auth.token, activeTab])

  // useMemo，用於過濾和排序商品列表
  const filteredItems = useMemo(() => {
    const itemsToFilter = activeTab === 'ingredient' ? allFavoriteProducts : allFavoriteRecipes
    if (!searchTerm) {
      return itemsToFilter
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase()
    if (activeTab === 'ingredient') {
      return itemsToFilter.filter(
        product =>
          (product.name && product.name.toLowerCase().includes(lowercasedSearchTerm)) ||
          (product.brand && product.brand.toLowerCase().includes(lowercasedSearchTerm))
      )
    } else {
      // 食譜的搜尋邏輯
      return itemsToFilter.filter(
        recipe =>
          (recipe.title && recipe.title.toLowerCase().includes(lowercasedSearchTerm)) ||
          (recipe.categories && recipe.categories.toLowerCase().includes(lowercasedSearchTerm))
      )
    }
  }, [allFavoriteProducts, allFavoriteRecipes, searchTerm, activeTab])

  const sortedItems = useMemo(() => {
    const sortableItems = [...filteredItems]
    sortableItems.sort((a, b) => {
      const dateA = new Date(a.favorited_at).getTime()
      const dateB = new Date(b.favorited_at).getTime()
      if (sortOrder === 'asc') {
        return dateA - dateB
      }
      return dateB - dateA
    })
    return sortableItems
  }, [filteredItems, sortOrder])

  // 計算總頁數和目前頁面應顯示的商品 (基於 sortedProducts)
  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE)
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return sortedItems.slice(startIndex, endIndex)
  }, [sortedItems, currentPage])

  const handleSearchChange = event => {
    setSearchTerm(event.target.value)
    setCurrentPage(1)
  }

  const handleSortToggle = () => {
    setSortOrder(prevOrder => (prevOrder === 'desc' ? 'asc' : 'desc'))
    setCurrentPage(1) // 排序改變時回到第一頁
  }

  const handlePageChange = pageNumber => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  // 分頁數字渲染邏輯
  const renderPageNumbers = () => {
    const pageNumbers = []
    const maxPageButtons = 5 // 最多顯示5個頁碼按鈕 (例如: < 1 2 3 4 5 >)
    let startPage, endPage

    if (totalPages <= maxPageButtons) {
      startPage = 1
      endPage = totalPages
    } else {
      if (currentPage <= Math.ceil(maxPageButtons / 2)) {
        startPage = 1
        endPage = maxPageButtons
      } else if (currentPage + Math.floor(maxPageButtons / 2) >= totalPages) {
        startPage = totalPages - maxPageButtons + 1
        endPage = totalPages
      } else {
        startPage = currentPage - Math.floor(maxPageButtons / 2)
        endPage = currentPage + Math.floor(maxPageButtons / 2)
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`${styles.pageNumber} ${currentPage === i ? styles.activePage : ''}`}
          aria-current={currentPage === i ? 'page' : undefined}
          aria-label={`前往第 ${i} 頁`}
        >
          {i}
        </button>
      )
    }
    return pageNumbers
  }

  // 取消收藏商品函式
  
  const handleUnfavoriteProduct = async productId => {
    if (!auth.token) {
      Swal.fire({
        icon: 'warning',
        title: '請先登入',
        text: '您需要登入才能取消收藏商品。',
      })
      return
    }

    // 使用 SweetAlert2 進行確認
    Swal.fire({
      title: '確認取消收藏?',
      text: '您確定要將此商品從收藏清單中移除嗎？',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '是的，取消收藏',
      cancelButtonText: '保留',
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          // 取消收藏的 API 請求
          const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/favorites/products/${productId}`
          const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          })

          const responseData = await response.json()

          if (response.ok && responseData.success) {
            Swal.fire('已取消收藏!', '該商品已從您的收藏清單中移除。', 'success')
            // 直接更新 allFavoriteProducts，filteredProducts 和 currentProducts 會自動重新計算
            setAllFavoriteProducts(prevProducts => prevProducts.filter(p => p.id !== productId))
            // 檢查當前頁是否仍然有效
            const newTotalProductsAfterUnfavorite = sortedItems.length - 1 // 使用 sortedProducts 長度預估 06/03 先改成用sortedItems
            const newTotalPages = Math.ceil(newTotalProductsAfterUnfavorite / ITEMS_PER_PAGE)
            if (currentPage > newTotalPages && newTotalPages > 0) {
              setCurrentPage(newTotalPages)
            } else if (
              currentItems.length === 1 &&  //06/03將currentProducts改成currentItems
              currentPage > 1 &&
              newTotalProductsAfterUnfavorite > 0
            ) {
              setCurrentPage(prevCurrentPage => (prevCurrentPage > 1 ? prevCurrentPage - 1 : 1))
            } else if (
              currentItems.length === 1 &&  ////將currentProducts改成currentItems
              currentPage === 1 &&
              newTotalProductsAfterUnfavorite === 0
            ) {
              // 如果刪的是第一頁唯一一筆且總數變 0，頁碼應為 1 但列表為空
              setCurrentPage(1)
            }
          } else {
            throw new Error(responseData.message || '取消收藏失敗')
          }
        } catch (err) {
          console.error('Unfavorite product error:', err)
          Swal.fire({
            icon: 'error',
            title: '取消收藏失敗',
            text: err.message || '發生未知錯誤，請稍後再試。',
          })
        }
      }
    })
  }

  // 取消食譜收藏函式
  const handleUnfavoriteRecipe = async recipeId => {
    if (!auth.token) {
      Swal.fire({
        icon: 'warning',
        title: '請先登入',
        text: '您需要登入才能取消收藏食譜。',
      })
      return
    }

    Swal.fire({
      title: '確認取消收藏?',
      text: '您確定要將此食譜從收藏清單中移除嗎？',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '是的，取消收藏',
      cancelButtonText: '保留',
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/favorites/recipes/${recipeId}`
          const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          })

          const responseData = await response.json()

          if (response.ok && responseData.success) {
            Swal.fire('已取消收藏!', '該食譜已從您的收藏清單中移除。', 'success')
            setAllFavoriteRecipes(prevRecipes => prevRecipes.filter(r => r.id !== recipeId))
            // 更新分頁邏輯 (與食材類似)
            const newTotalItemsAfterUnfavorite = sortedItems.length - 1
            const newTotalPages = Math.ceil(newTotalItemsAfterUnfavorite / ITEMS_PER_PAGE)
            if (currentPage > newTotalPages && newTotalPages > 0) {
              setCurrentPage(newTotalPages)
            } else if (
              currentItems.length === 1 &&
              currentPage > 1 &&
              newTotalItemsAfterUnfavorite > 0
            ) {
              setCurrentPage(prevCurrentPage => (prevCurrentPage > 1 ? prevCurrentPage - 1 : 1))
            } else if (
              currentItems.length === 1 &&
              currentPage === 1 &&
              newTotalItemsAfterUnfavorite === 0
            ) {
              setCurrentPage(1)
            }
          } else {
            throw new Error(responseData.message || '取消收藏食譜失敗')
          }
        } catch (err) {
          console.error('Unfavorite recipe error:', err)
          Swal.fire({
            icon: 'error',
            title: '取消收藏食譜失敗',
            text: err.message || '發生未知錯誤，請稍後再試。',
          })
        }
      }
    })
  }

  // 格式化日期時間(YYYY/MM/DD)
  const formatDateTime = dateTimeString => {
    if (!dateTimeString) return 'N/A'
    try {
      const date = new Date(dateTimeString)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch (e) {
      console.error('Error formatting date:', e)
      return '日期格式錯誤'
    }
  }
  
  // 渲染排序圖示
  const renderSortIcon = () => {
    if (sortOrder === 'desc') {
      return <FaSortDown className={styles.sortIconItself} /> // 最新在前 (箭頭向下)
    } else if (sortOrder === 'asc') {
      return <FaSortUp className={styles.sortIconItself} /> // 最舊在前 (箭頭向上)
    }
    return <FaSort className={styles.sortIconItself} /> // 預設圖示
  }

  // 動態搜尋提示
  const searchPlaceholder = useMemo(() => {
    return activeTab === 'ingredient'
      ? '搜尋我的收藏 (品名或品牌)'
      : '搜尋我的收藏 (料理名稱或分類)'
  }, [activeTab])

  return (
    <div className={styles.container}>
      <div className={styles.productFavoritesList}>
        <div className={styles.taskbar}>
          <div className={styles.favoritesBtn}>
            <div
              className={`${styles.btnRecipe} ${activeTab === 'recipe' ? styles.active : ''}`}
              onClick={() => setActiveTab('recipe')}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setActiveTab('recipe')}
            >
              食譜
            </div>
            <div
              className={`${styles.btnIngredient} ${activeTab === 'ingredient' ? styles.active : ''}`}
              onClick={() => setActiveTab('ingredient')}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setActiveTab('ingredient')}
            >
              食材
            </div>
          </div>

          <div className={styles.searchInputWrapper}>
            <FaSearch className={styles.searchIconInsideInput} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder={searchPlaceholder} // 更動：使用動態提示文字
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          <div
            className={styles.sortWrapper}
            onClick={handleSortToggle}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleSortToggle()}
          >
            <div className={styles.sortBy}>排序依收藏時間</div>
            {renderSortIcon()}
          </div>
        </div>

        {isLoading && <div className={styles.loadingMessage}>載入收藏清單中...</div>}
        {error && <div className={styles.errorMessage}>錯誤: {error}</div>}

        {/* 食材收藏清單 */}
        {activeTab === 'ingredient' && !isLoading && !error && (
          <>
            <div className={styles.list}>
              <ul className={styles.listHeader}>
                <li className={styles.headerItem}></li>
                <li className={styles.headerItem}>品名</li>
                <li className={styles.headerItem}>品牌</li>
                <li className={styles.headerItem}>價格</li>
                <li className={styles.headerItem}>收藏時間</li>
                <li className={styles.headerItem}></li>
              </ul>

              {/* 更動：currentItems 和 allFavoriteProducts 用於空訊息判斷 */}
              {currentItems.length > 0 ? (
                <ul className={styles.listContent}>
                  {currentItems.map(product => (
                    <li key={product.id} className={styles.listItem}>
                      <Link href={`/products/${product.id}`} passHref legacyBehavior>
                        <a className={styles.itemLink}>
                          <div className={styles.imageWrapper}>
                            <div className={styles.productImage}>
                              {product.image_url ? (
                                <Image
                                  src={product.image_url}
                                  alt={product.name || '商品圖片'}
                                  width={60}
                                  height={60}
                                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                                  onError={e => {
                                    e.target.onerror = null
                                    const parent = e.target.parentElement
                                    if (parent) {
                                      while (parent.firstChild) {
                                        parent.removeChild(parent.firstChild)
                                      }
                                      parent.textContent = '無圖'
                                    }
                                  }}
                                />
                              ) : (
                                <span>無圖片</span>
                              )}
                            </div>
                          </div>
                          <div className={styles.itemInfo}>{product.name || 'N/A'}</div>
                          <div className={styles.itemInfo}>{product.brand || 'N/A'}</div>
                          <div className={styles.itemInfo}>
                            ${product.price ? Math.floor(product.price).toLocaleString() : 'N/A'}
                          </div>
                          <div className={styles.itemInfo}>
                            {formatDateTime(product.favorited_at)}
                          </div>
                        </a>
                      </Link>
                      <div className={styles.actionWrapper}>
                        <button
                          className={styles.unfavoriteBtn}
                          onClick={() => handleUnfavoriteProduct(product.id)} // 更動：明確使用 handleUnfavoriteProduct
                        >
                          取消收藏
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.emptyMessage}>
                  {/* 更動：空訊息判斷條件 */}
                  {searchTerm && allFavoriteProducts.length > 0
                    ? '找不到符合條件的收藏商品。'
                    : !searchTerm && allFavoriteProducts.length === 0
                      ? '您尚未收藏任何食材。'
                      : searchTerm && allFavoriteProducts.length === 0
                        ? '您尚未收藏任何食材。'
                        : '此頁無收藏商品。'}
                </div>
              )}
            </div>

            {/* 分頁條件使用 currentItems */}
            {totalPages > 1 && !isLoading && currentItems.length > 0 && (
              <div className={styles.paginationSection}>
                <div className={styles.pagination}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={styles.pageArrow}
                    aria-label="上一頁"
                  >
                    <IoIosArrowBack />
                  </button>
                  {renderPageNumbers()}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={styles.pageArrow}
                    aria-label="下一頁"
                  >
                    <IoIosArrowForward />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 食譜收藏清單 */}
        {activeTab === 'recipe' && !isLoading && !error && (
          <>
            <div className={styles.list}>
              <ul className={styles.listHeader}>
                <li className={styles.headerItem}>圖片</li>
                <li className={styles.headerItem}>料理</li>
                <li className={styles.headerItem}>分類</li>
                <li className={styles.headerItem}>烹飪時間</li>
                <li className={styles.headerItem}>收藏時間</li>
                <li className={styles.headerItem}></li>
              </ul>

              {currentItems.length > 0 ? (
                <ul className={styles.listContent}>
                  {currentItems.map(recipe => (
                    <li key={recipe.id} className={styles.listItem}>
                      <Link href={`/recipes/${recipe.id}`} passHref legacyBehavior>
                        <a className={styles.itemLink}>
                          <div className={styles.imageWrapper}>
                            <div className={styles.productImage}>
                              {recipe.image ? (
                                <Image
                                  src={recipe.image}
                                  alt={recipe.title || '食譜圖片'}
                                  width={60}
                                  height={60}
                                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                                  onError={e => {
                                    e.target.onerror = null
                                    const parent = e.target.parentElement
                                    if (parent) {
                                      while (parent.firstChild) {
                                        parent.removeChild(parent.firstChild)
                                      }
                                      parent.textContent = '無圖'
                                    }
                                  }}
                                />
                              ) : (
                                <span>無圖片</span>
                              )}
                            </div>
                          </div>
                          <div className={styles.itemInfo}>{recipe.title || 'N/A'}</div>
                          <div className={styles.itemInfo}>{recipe.categories || 'N/A'}</div>
                          <div className={styles.itemInfo}>
                            {recipe.cook_time ? `${recipe.cook_time} 分鐘` : 'N/A'}
                          </div>
                          <div className={styles.itemInfo}>
                            {formatDateTime(recipe.favorited_at)}
                          </div>
                        </a>
                      </Link>
                      <div className={styles.actionWrapper}>
                        <button
                          className={styles.unfavoriteBtn}
                          onClick={() => handleUnfavoriteRecipe(recipe.id)}
                        >
                          取消收藏
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.emptyMessage}>
                  {searchTerm && allFavoriteRecipes.length > 0
                    ? '找不到符合條件的收藏食譜。'
                    : !searchTerm && allFavoriteRecipes.length === 0
                      ? '您尚未收藏任何食譜。'
                      : searchTerm && allFavoriteRecipes.length === 0
                        ? '您尚未收藏任何食譜。'
                        : '此頁無收藏食譜。'}
                </div>
              )}
            </div>

            {/* 分頁頁碼 */}
            {totalPages > 1 && !isLoading && currentItems.length > 0 && (
              <div className={styles.paginationSection}>
                <div className={styles.pagination}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={styles.pageArrow}
                    aria-label="上一頁"
                  >
                    <IoIosArrowBack />
                  </button>
                  {renderPageNumbers()}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={styles.pageArrow}
                    aria-label="下一頁"
                  >
                    <IoIosArrowForward />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default FavoritesContent
