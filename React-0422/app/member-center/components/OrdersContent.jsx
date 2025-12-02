'use client'

import React, { useState, useEffect, useMemo } from 'react'
import styles from '../styles/orders-content.module.scss'
import { useAuth } from '@/hooks/auth-context'
import Link from 'next/link'
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io'
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa'

const ITEMS_PER_PAGE = 10 // 每頁顯示10筆資料

const OrdersContent = () => {
  const [allOrders, setAllOrders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const { auth } = useAuth()

  const [currentPage, setCurrentPage] = useState(1)
  const [sortOrder, setSortOrder] = useState('desc') // 'desc' 表示最新訂單在前

  // 取得訂單列表
  const fetchOrders = async () => {
    if (typeof process.env.NEXT_PUBLIC_BACKEND_URL === 'undefined') {
      setError('應用程式設定錯誤，無法連接至伺服器。')
      setIsLoading(false)
      return
    }

    if (!auth.token || !auth.user_id) {
      setAllOrders([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/api/order/${auth.user_id}`

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`伺服器回應格式錯誤 (${contentType})`)
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `請求失敗 (${response.status})`)
      }

      if (result.success && result.data && Array.isArray(result.data.orders)) {
        setAllOrders(result.data.orders)
      } else {
        setAllOrders([])
      }
    } catch (err) {
      setError(err.message)
      setAllOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    setSortOrder('desc') // 預設按訂購日期降冪排序

    if (auth.token && auth.user_id) {
      fetchOrders()
    } else {
      setAllOrders([])
    }
  }, [auth.token, auth.user_id])

  // 根據 sortOrder 排序訂單
  const sortedItems = useMemo(() => {
    const sortableItems = [...allOrders]
    sortableItems.sort((a, b) => {
      const dateA = new Date(a.order_date).getTime()
      const dateB = new Date(b.order_date).getTime()
      if (sortOrder === 'asc') {
        return dateA - dateB // 最舊的在前
      }
      return dateB - dateA // 最新的在前 (desc)
    })
    return sortableItems
  }, [allOrders, sortOrder])

  // 計算總頁數和目前頁面應顯示的訂單
  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE)
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return sortedItems.slice(startIndex, endIndex)
  }, [sortedItems, currentPage])

  const handleSortToggle = () => {
    setSortOrder(prevOrder => (prevOrder === 'desc' ? 'asc' : 'desc'))
    setCurrentPage(1) // 排序改變時回到第一頁
  }

  const handlePageChange = pageNumber => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  // 分頁數字渲染邏輯 (與 FavoritesContent 相同)
  const renderPageNumbers = () => {
    const pageNumbers = []
    const maxPageButtons = 5
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

  // 格式化日期時間(YYYY/MM/DD)
  const formatDateTime = dateTimeString => {
    if (!dateTimeString) return 'N/A'
    try {
      const date = new Date(dateTimeString)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${year}/${month}/${day}`
    } catch (e) {
      return '日期格式錯誤'
    }
  }

  // 渲染排序圖示 (與 FavoritesContent 相同)
  const renderSortIcon = () => {
    if (sortOrder === 'desc') {
      return <FaSortDown className={styles.sortIconItself} />
    } else if (sortOrder === 'asc') {
      return <FaSortUp className={styles.sortIconItself} />
    }
    return <FaSort className={styles.sortIconItself} />
  }

  // 新增一個輔助函數來取得付款狀態的樣式
  const getPaymentStatusStyle = status => {
    switch (status) {
      case '已付款':
        return styles.paid
      case '未付款':
        return styles.unpaid
      case '已退款':
        return styles.refunded
      default:
        return ''
    }
  }

  // 新增一個輔助函數來取得配送狀態的樣式
  const getShippingStatusStyle = status => {
    switch (status) {
      case '已送達':
        return styles.delivered
      case '未出貨':
        return styles.unshipped
      case '不適用':
        return styles.notApplicable
      default:
        return ''
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.ordersList}>
        {' '}
        {/* 可以自訂 class 名稱 */}
        <div className={styles.taskbar}>
          {/* 排序按鈕 */}
          <div className={styles.sortControls}>
            {' '}
            {/* 新增一個容器方便排版 */}
            <div
              className={styles.sortWrapper}
              onClick={handleSortToggle}
              role="button"
              tabIndex={0}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleSortToggle()}
            >
              <div className={styles.sortBy}>排序依訂購日期</div>
              {renderSortIcon()}
            </div>
          </div>
        </div>
        {isLoading && <div className={styles.loadingMessage}>載入訂單清單中...</div>}
        {error && <div className={styles.errorMessage}>錯誤: {error}</div>}
        {!isLoading && !error && (
          <>
            <div className={styles.list}>
              <ul className={styles.listHeader}>
                <li className={`${styles.headerItem} ${styles.orderId}`}>訂單編號</li>
                <li className={`${styles.headerItem} ${styles.orderStatus}`}>付款/配送狀態</li>
                <li className={`${styles.headerItem} ${styles.totalPrice}`}>總金額</li>
                <li className={`${styles.headerItem} ${styles.orderDate}`}>訂購日期</li>
                <li className={`${styles.headerItem} ${styles.shippingAddress}`}>配送地址</li>
              </ul>

              {currentItems.length > 0 ? (
                <ul className={styles.listContent}>
                  {currentItems.map(order => (
                    <li key={order.order_id} className={styles.listItem}>
                      <Link href={`/member/orders/${order.order_id}`} passHref legacyBehavior>
                        <a className={styles.itemLink}>
                          <div className={`${styles.itemInfo} ${styles.orderId}`}>
                            {order.order_id}
                          </div>
                          <div className={`${styles.itemInfo} ${styles.orderStatus}`}>
                            <ul className={styles.subContent}>
                              <li className={styles.subContentItem}>
                                <span
                                  className={`${styles.statusBadge} ${getPaymentStatusStyle(order.payment_status)}`}
                                >
                                  {order.payment_status || 'N/A'}
                                </span>
                              </li>
                              <li className={styles.subContentItem}>
                                <span
                                  className={`${styles.statusBadge} ${getShippingStatusStyle(order.shipping_status)}`}
                                >
                                  {order.shipping_status || 'N/A'}
                                </span>
                              </li>
                            </ul>
                          </div>
                          <div className={`${styles.itemInfo} ${styles.totalPrice}`}>
                            $
                            {order.total_price
                              ? Math.floor(order.total_price).toLocaleString()
                              : 'N/A'}
                          </div>
                          <div className={`${styles.itemInfo} ${styles.orderDate}`}>
                            {formatDateTime(order.order_date)}
                          </div>
                          <div className={`${styles.itemInfo} ${styles.shippingAddress}`}>
                            {order.shipping_address || 'N/A'}
                          </div>
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.emptyMessage}>
                  {allOrders.length === 0 ? '您目前沒有任何訂單。' : '此頁無訂單資料。'}
                </div>
              )}
            </div>

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

export default OrdersContent
