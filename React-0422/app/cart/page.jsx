'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/auth-context'
import './style.css'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/use-cart'
import Image from 'next/image'
import Swal from 'sweetalert2'

export default function CartPage() {
  const { items: cartItemsFromContext, loadCart } = useCart()
  // console.log('🛒 ContactPage 剛載入時，useCart() 的 items:',cartItemsFromContext);


  //--- 狀態 ---
  //箱子
  const [cartItems, setCartItems] = useState([])
  //狀態指示燈
  const [loading, setLoading] = useState(true)
  //錯誤訊息
  const [error, setError] = useState(null)
  // 一開始顯示折扣金額0
  const [discountAmount, setDiscountAmount] = useState(0)
  // 儲存輸入的折扣碼
  const [couponCode, setCouponCode] = useState('')
  // 紀錄已套用的折扣碼
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  // 檢查（沒過跳紅字）
  const handleProceedToContact = () => {
    if (selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: '尚未選取任何商品',
        confirmButtonText: '確認',
        confirmButtonColor: '#df6c2d' // 跟你的主題橘色按鈕風格一致
      });
      return; // 直接結束這個函式，不往下執行
    }
    // console.log('🛒 準備跳轉，攜帶的 selectedSubtotal:', selectedSubtotal)
    // console.log('🛒 準備跳轉，攜帶的 shippingFee:', shippingFee)
    // console.log('🛒 準備跳轉，攜帶的 discountAmount:', discountAmount)
    // console.log('🚀 準備前往 /cart/contact 頁面，並攜帶總金額！！')
    router.push(
      `/cart/contact?totalAmount=${grandTotal}&subtotal=${selectedSubtotal}&shipping=${shippingFee}&discount=${discountAmount}`
    ) // 執行跳轉
  }

  // 購物車
  const [isAllSelected, setIsAllSelected] = useState(false) // 進購物車頁面打勾處不選

  //--- Hooks 和常數宣告區 ---
  // 使用router頁面跳轉
  const router = useRouter()
  const { auth } = useAuth()
  const currentUserId = auth?.user_id

  // 後端api port
  const API_BASE_URL = 'http://localhost:3001'

  useEffect(() => {
    if (auth && currentUserId && currentUserId !== 0) {
      // console.log(`✅ 使用者 ${currentUserId} 已登入，準備撈取購物車！`)
      setLoading(true)
      setError(null)
      fetch(`${API_BASE_URL}/cart/api/${currentUserId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error('網路請求失敗')
          }
          return response.json() // 先轉換成 JSON
        })
        .then((dataFromApi) => {
          // console.log(`🎉 成功從後端拿到使用者 ${currentUserId} 的購物車資料：`,dataFromApi)
          // 檢查 dataFromApi 是否為陣列格式
          if (!Array.isArray(dataFromApi)) {
            // console.error('API 回傳的資料不是陣列格式:', dataFromApi)
            throw new Error('資料格式錯誤')
          }

          const itemsWithSelection = dataFromApi.map((item) => ({
            ...item,
            isSelected: false,
          }))

          if (loadCart) {
            loadCart(itemsWithSelection)
          } else {
            // console.error('loadCart function is not available from useCart context!')
          }
        })
        .catch((err) => {
          // console.error('😭 撈取購物車資料時發生悲劇：', err)
          // setError(err.message || '發生未知的錯誤，請稍後再試。')
          if (loadCart) loadCart([])
        })
        .finally(() => {
          setLoading(false)
          // console.log('🏁 初始購物車 API 請求流程結束。')
        })
    } else {
      // console.log('🚫 使用者未登入或 userId 無效，不執行 API 請求。 auth:',
        auth,
        'userId:',
        currentUserId
     //  )
      let userMessage = '請先登入才能查看您的購物車喔～😉'
      if (auth && (!currentUserId || currentUserId === 0)) {
        {
          /* userMessage = '登入狀態好像有點怪怪的，拿不到正確的使用者ID耶～🤔' */
        }
      }
      setError(userMessage)
      if (loadCart) loadCart([])
      // setIsAllSelected(false) // 如果沒有登入，購物車也不會有東西
      setLoading(false)
    }
  }, [currentUserId, auth, loadCart, setError, API_BASE_URL]) // 依賴 currentUserId 和 auth , loadCart

  // --- useEffect 二號：根據 Context 的購物車內容，自動同步 isAllSelected 的狀態 ---
  useEffect(() => {
    if (cartItemsFromContext && cartItemsFromContext.length > 0) {
      setIsAllSelected(
        cartItemsFromContext.every((item) => item.isSelected === true)
      )
    } else {
      setIsAllSelected(false)
    }
  }, [cartItemsFromContext]) // ✨ 只依賴 cartItemsFromContext ✨

  const _doTheActualDeleteWork = useCallback(async (cartItemId, itemName) => {
    if (!cartItemId || !itemName) {
      // console.error('_doTheActualDeleteWork: cartItemId 或 itemName 未提供');
      return;
    }
   // console.log(`🗑️ [ACTUAL DELETE] 準備執行刪除商品 ID: ${cartItemId} (${itemName})`);
    // setLoading(true); // 如果需要

    try {
      // ... (fetch API, loadCart, Swal.fire 成功/失敗提示) ...
      // (就是我上一則回覆中提供的 _doTheActualDeleteWork 完整程式碼)
        const response = await fetch(
            `${API_BASE_URL}/cart/api/items/${cartItemId}`,
            { method: 'DELETE' }
        );
        if (!response.ok) {
            let errorMsg = `刪除商品「${itemName}」失敗...`;
            // ... 處理錯誤訊息 ...
            try {
              const errorData = await response.json();
              if (errorData && errorData.message) {
                errorMsg = errorData.message;
              }
            } catch (jsonParseError) { /* */ }
            throw new Error(errorMsg);
        }

        if (loadCart && cartItemsFromContext) {
            const updatedContextItems = cartItemsFromContext.filter(
                (item) => item.cartItemId !== cartItemId
            );
            loadCart(updatedContextItems);
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: `【${itemName}】已成功刪除`,
              showConfirmButton: false,
              timer: 2500,
              timerProgressBar: true,
              didOpen: (toast) => {
                  toast.addEventListener('mouseenter', Swal.stopTimer)
                  toast.addEventListener('mouseleave', Swal.resumeTimer)
              }
          });
      } else {
          // console.error('無法更新購物車 Context...');
          // setError('無法更新本地購物車狀態...');
      }
  } catch (err) {
      // console.error(`💣 [小幫手出包] 刪除失敗：`, err);
      // setError(err.message || '刪除商品時發生了一個未預期的錯誤，金拍謝！');
      // 👇 這個「刪除失敗」的提示，你可以看需求決定
      // 如果也想改成 Toast，就比照上面的格式修改
      // 如果想保留大彈窗，就維持原樣
      Swal.fire(
          '刪除失敗',
          err.message || '哎呀，好像哪裡怪怪的，刪不掉耶！',
          'error'
      );
  } finally {
      // setLoading(false); // 如果需要
  }
}, [API_BASE_URL, cartItemsFromContext, loadCart, setError]);



  // 全選/取消全選
  // 修改 handleSelectAll 函式
  const handleSelectAll = useCallback(
    async (event) => {
      const newIsAllSelected = event.target.checked
      setIsAllSelected(newIsAllSelected)

      try {
        const response = await fetch(
          `${API_BASE_URL}/cart/api/items/select-all`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth.token}`,
            },
            body: JSON.stringify({
              userId: currentUserId,
              isSelected: newIsAllSelected,
            }),
          }
        )

        if (!response.ok) {
          throw new Error('更新勾選狀態失敗')
        }

        // 需要更新 Context
        if (loadCart && cartItemsFromContext) {
          const updatedItems = cartItemsFromContext.map((item) => ({
            ...item,
            isSelected: newIsAllSelected,
          }))
          loadCart(updatedItems) // 使用 loadCart 更新 Context
        }
      } catch (error) {
        // console.error('更新全選狀態失敗：', error)
        // setError('更新勾選狀態失敗，請稍後再試')
        setIsAllSelected(!newIsAllSelected)
      }
    },
    [API_BASE_URL, currentUserId, cartItemsFromContext, loadCart]
  )

  // 單一商品勾選/取消勾選
  const handleSelectItem = useCallback(
    async (cartItemId, event) => {
      const newIsItemSelected = event.target.checked
      // console.log(`準備更新商品 ${cartItemId} 的勾選狀態為: ${newIsItemSelected}`)

      try {
        const response = await fetch(
          `${API_BASE_URL}/cart/api/items/${cartItemId}/select`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              isSelected: newIsItemSelected,
            }),
          }
        )

        if (!response.ok) {
          throw new Error('更新勾選狀態失敗')
        }

        // 更新 Context
        if (loadCart && cartItemsFromContext) {
          const updatedItems = cartItemsFromContext.map((item) =>
            item.cartItemId === cartItemId
              ? { ...item, isSelected: newIsItemSelected }
              : item
          )
          // console.log('更新後的購物車內容:', updatedItems)
          loadCart(updatedItems)
        }
      } catch (error) {
        // console.error('更新商品勾選狀態失敗：', error)
        // setError('更新勾選狀態失敗，請稍後再試')
      }
    },
    [API_BASE_URL, cartItemsFromContext, loadCart]
  )

  const handleDeleteItem = useCallback(
    async (cartItemIdPassed) => {
      if (!cartItemIdPassed) return
      // setLoading(true); // 如果需要更細緻的 loading
      // setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/cart/api/items/${cartItemIdPassed}`,
          { method: 'DELETE' }
        )
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `刪除商品失敗`)
        }
        const updatedItems = cartItemsFromContext.filter(
          (item) => item.cartItemId !== cartItemIdPassed
        )
        // setCartItems(updatedItems)
        // ✨✨✨ 新增5: 刪除後也要更新全選狀態 ✨✨✨
        setIsAllSelected(
          updatedItems.length > 0 &&
            updatedItems.every((item) => item.isSelected)
        )
        setError(null)
      } catch (err) {
        setError(err.message || '刪除商品時發生錯誤')
      } finally {
        // setLoading(false);
      }
    },
    [API_BASE_URL, cartItemsFromContext]
  ) // 依賴 cartItemsFromContext

 // page.jsx

// ... (其他程式碼) ...

  // --- 從購物車移除商品的函式 (加上 SweetAlert) ---
  const handleDeleteClick = useCallback(
    async (cartItemId, itemName) => { // ✨ 確認這裡有接收 itemName
      if (!cartItemId) return;

      // 使用 SweetAlert 進行確認
      const result = await Swal.fire({
        title: `確定要刪除【${itemName}】嗎？`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33', // 紅色比較符合刪除的感覺
        cancelButtonColor: '#3085d6', //
        confirmButtonText: '刪除',
        cancelButtonText: '取消'
      });

      // 如果使用者按下 "殘忍刪除"
      if (result.isConfirmed) {
        await _doTheActualDeleteWork(cartItemId, itemName);
        } else {
            // console.log(`使用者從垃圾桶按鈕取消刪除商品 ${itemName}`);
        }
    },
    [_doTheActualDeleteWork] // 依賴項
  );


  // --- 更新購物車項目數量的函式 ---
  const handleUpdateQuantity = useCallback(
    async (cartItemId, change) => {
      // console.log(`🛒 handleUpdateQuantity 接收到的 change 是：`, change)
      setError(null)

      // 從 cartItemsFromContext 尋找要更新的商品 ✨
      const itemToUpdate = (cartItemsFromContext || []).find(
        (item) => item.cartItemId === cartItemId
      );

      if (!itemToUpdate) {
        // console.error(`更新數量錯誤：在 Context 中找不到 cartItemId 為 ${cartItemId} 的商品`)
        // setError(`哎呀！你想更新的商品好像消失了耶～🤔`)
        return
      }

      // ✨✨✨ 在這裡加上這些 console.log ✨✨✨
      // console.log('DEBUG: itemToUpdate.quantity 的原始值是:', itemToUpdate.quantity);
      // console.log('DEBUG: receivedCurrentQuantity (從JSX傳入的第二個參數) 是:', receivedCurrentQuantity);
      // console.log('DEBUG: actualChange (從JSX傳入的第三個參數) 是:', actualChange); // 深拷貝印出來比較清楚
      // ✨✨✨ 上面是新增的 console.log ✨✨✨

      const newQuantity = itemToUpdate.quantity + change;
      // ✨✨✨ 在這裡加上這些 console.log ✨✨✨
      // console.log('DEBUG: 計算出來的 newQuantity 是:', newQuantity);

      if (newQuantity < 1) {
        // 👇👇👇 這邊是修改重點 👇👇👇
        const result = await Swal.fire({
          title: `【${itemToUpdate.name}】數量0，要直接從購物車移除嗎？`,
          icon: 'question', // 可以用 question 或 warning
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: '移除',
          cancelButtonText: '取消'
        });

        if (result.isConfirmed) {
          // ✨ 呼叫你已經修改好、會更新 Context 且包含 SweetAlert 的 handleDeleteClick ✨
          // 注意：handleDeleteClick 現在需要 itemName，所以要傳遞 itemToUpdate.name
          if (_doTheActualDeleteWork) {
            await _doTheActualDeleteWork(cartItemId, itemToUpdate.name); // 傳入 itemName
          } else {
            // console.error('_doTheActualDeleteWork 函式不存在!');
          }
        } else {
          // console.log(`使用者取消因數量歸零而移除商品 ${itemToUpdate.name}`);
        }
        return; // 不論是否刪除，都不往下執行更新數量
      }

      // ... (原本更新數量的 try/catch/finally 邏輯) ...
      try {
        // 呼叫後端 API 更新商品數量
        const response = await fetch(
          `${API_BASE_URL}/cart/api/items/${cartItemId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quantity: newQuantity }),
          }
        );

        if (!response.ok) {
          let errorMsg = `更新商品「${itemToUpdate.name}」數量失敗，狀態碼：${response.status}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (jsonError) { /* 如果解析錯誤，就用上面的 errorMsg */ }
          throw new Error(errorMsg);
        }

        if (loadCart && cartItemsFromContext) {
          const updatedContextItems = cartItemsFromContext.map((item) =>
            item.cartItemId === cartItemId
              ? { ...item, quantity: newQuantity }
              : item
          );
          loadCart(updatedContextItems);
          // console.log(`🛒 商品 ${cartItemId} (${itemToUpdate.name}) 數量已在 Context 更新為 ${newQuantity}`);
        } else {
          // console.error('loadCart 或 cartItemsFromContext 未定義，無法更新購物車 Context！');
          // setError('無法更新購物車狀態，請稍後再試。');
        }
      } catch (error) {
        // console.error(`💔 更新商品 ${cartItemId} 數量失敗：`, error); // 原本是"勾選狀態失敗"，應該是數量才對
        // setError(error.message || '更新數量時發生錯誤，請稍後再試。');
      }
    },
    [API_BASE_URL, cartItemsFromContext, loadCart, handleDeleteClick, setError]
  );

  //處理商品列表「移除」按鈕的函式 (使用 window.confirm)
  const handleDirectDeleteClick = (cartItemId, itemName) => {
    if (window.confirm(`你確定要把【${itemName}】從購物車中丟掉嗎？`)) {
      handleDeleteItem(cartItemId)
    }
  }
  // calculateSelectedSubtotal 函式
  const calculateSelectedSubtotal = useCallback(() => {
    if (!cartItemsFromContext || cartItemsFromContext.length === 0) {
      return 0
    }
    return cartItemsFromContext
      .filter((item) => item.isSelected) // 只計算 isSelected: true 的
      .reduce((total, item) => {
        const price = parseFloat(item.price) || 0
        const quantity = parseInt(item.quantity, 10) || 0
        return total + price * quantity
      }, 0)
  }, [cartItemsFromContext]) // 依賴 cartItems，因為勾選狀態或數量改變時，小計要重算
  // 呼叫selectedSubtotal

  const selectedSubtotal = calculateSelectedSubtotal()
  // --- 計算訂單金額 ---
  const calculateSubtotal = useCallback(() => {
    if (!cartItemsFromContext || cartItemsFromContext.length === 0) return 0
    return cartItemsFromContext
      .filter((item) => item.isSelected) // 只計算 isSelected: true 的
      .reduce((total, item) => total + item.price * item.quantity, 0)
  }, [cartItemsFromContext])

  const subtotal = calculateSubtotal()
  const shippingFee = 0 // 假設運費暫時是 0
  const grandTotal = selectedSubtotal + shippingFee - discountAmount // 總金額 = 小計 + 運費 - 折扣金額
  // console.log(cartItemsFromContext)

  //取得已勾選的商品列表
  const selectedItems = (cartItemsFromContext || []).filter(
    (item) => item.isSelected
  )

  // 處理優惠券
  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) {
      setError('請先輸入優惠券代碼!')
      return
    }

    // console.log(`🧾 準備驗證優惠券：${couponCode}`)
    setError(null) //清除錯誤提示
    // setLoading(true) //loading 效果

    // 模擬前端判斷，真實情境應由後端處理
    let actualDiscount = 0
    const upperCaseCoupon = couponCode.toUpperCase()
    const currentTimestamp = new Date() // 用於比較日期

    if (upperCaseCoupon === 'SUMMERFUN150') {
      const startDate = new Date('2025-05-01 00:00:00')
      const endDate = new Date('2025-07-31 23:59:59')
      const isActive = true // 資料 is_active = TRUE
      const minPurchase = 1000 // "消費滿千折 NT$150"

      if (!isActive) {
        setError(`Oops！優惠券 "${couponCode}" 目前沒有啟用喔～`)
      } else if (currentTimestamp < startDate) {
        setError(
          `優惠券 "${couponCode}" 還沒開始喔，生效日期是 ${startDate.toLocaleDateString()}！`
        )
      } else if (currentTimestamp > endDate) {
        setError(
          `哎呀！優惠券 "${couponCode}" 已經在 ${endDate.toLocaleDateString()} 過期囉～哭哭`
        )
      } else if (subtotal < minPurchase) {
        setError(
          `差一點點！使用 "${couponCode}" 需要消費滿 NT$${minPurchase}，您目前小計 NT$${subtotal.toFixed(2)}。`
        )
      } else {
        actualDiscount = 150.0 //  discount_value 是 150.00
        setError(
          `🎉 優惠券 "${couponCode}" 套用成功！折抵 NT$${actualDiscount.toFixed(2)}！`
        )
      }
    } else {
      setError(
        `Oops！優惠券 "${couponCode}" 好像不太對勁喔，找不到這張好康耶～再檢查一下？🤔`
      )
    }
    setDiscountAmount(actualDiscount) // 更新折扣金額
  }, [couponCode, subtotal]) // 當 couponCode 或 subtotal 改變時，重新計算

  // --- JSX 渲染邏輯 ---
  if (loading && (!cartItemsFromContext || cartItemsFromContext.length === 0)) {
    // 只有在初始載入且還沒有任何 cartItems 時才顯示全頁 loading
    return (
      <div
        className="cart-page-status"
        style={{ textAlign: 'center', padding: '40px 20px' }}
      >
        <p
          style={{
            fontSize: '1.2em',
            fontWeight: 'bold',
            marginBottom: '10px',
            color: '#444',
          }}
        >
          購物車努力搬貨中... 🚚💨 請稍等一下下，好料馬上來！
        </p>
      </div>
    )
  }

  if (error && (!cartItemsFromContext || cartItemsFromContext.length === 0)) {
    // 只有在購物車也沒東西時才優先顯示整個頁面的錯誤
    return (
      <div
        className="cart-page-status cart-page-error"
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #eee',
        }}
      >
        <Image
          src="/images/cart/faq.svg"
          alt="question"
          width={80}
          height={80}
          style={{ marginBottom: '20px' }}
        />

        <h2
          style={{
            fontSize: '1.5em',
            fontWeight: 'bold',
            marginBottom: '15px',
            color: '#e74c3c',
          }}
        >
          哎呀！好像出了點小狀況... 😕
        </h2>

        <p style={{ marginBottom: '20px', color: '#555', lineHeight: '1.6' }}>
          {error}
        </p>

        <p style={{ fontSize: '1em', marginBottom: '20px', color: '#777' }}>
          你可以試試看
          <button
            onClick={() => window.location.reload()}
            style={{
              marginLeft: '10px',
              padding: '8px 15px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: '#333',
              transition: 'background-color 0.2s ease',
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = '#f0f0f0')
            }
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
          >
            <i
              className="bi bi-arrow-clockwise"
              style={{ marginRight: '5px' }}
            ></i>
            重新整理
          </button>
          {error.includes('登入') && ( // ✨ 針對包含「登入」的錯誤訊息，提供額外提示 ✨
            <span style={{ marginLeft: '15px' }}>
              或確認您已正確
              <a
                href="/login"
                style={{ color: '#007bff', textDecoration: 'underline' }}
              >
                登入
              </a>
              喔！
            </span>
            // ✨ /login 實際的登入頁面路徑 ✨
          )}
          {!error.includes('登入') && '，或稍後再試一次。'}{' '}
          {/* 如果不是登入問題，給個通用提示 */}
        </p>
      </div>
    )
  }

  if (
    !loading &&
    (!cartItemsFromContext || cartItemsFromContext.length === 0) &&
    !error
  ) {
    // 載入完成，但購物車是空的 (且沒有致命錯誤)
    return (
      <div
        className="cart-page-status cart-page-empty"
        style={{ textAlign: 'center', padding: '40px 20px' }}
      >
        {' '}
        {/*讓文字置中*/}
        {/*<link rel="stylesheet" href="style.css" />*/} {/* 確保空狀態也有樣式 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.12.1/font/bootstrap-icons.min.css"
        />
        {/* <h1 style={{ marginBottom: '30px', fontSize: '2.5em', color: '#333' }}>我的購物清單</h1> */}
        <Image
          src="/images/cart/undraw_shopping-app_b80f.svg"
          alt="空空的購物車"
          width={180}
          height={180}
          style={{ marginBottom: '25px' }}
        />
        <p
          style={{
            fontSize: '1.2em',
            fontWeight: 'bold',
            marginBottom: '10px',
            color: '#444',
          }}
        >
          哎呀！購物車目前還在等它的第一個寶貝呢！
        </p>
        <p
          style={{
            fontSize: '1em',
            marginBottom: '30px',
            color: '#666',
            maxWidth: '450px',
            margin: '0 auto 30px auto',
            lineHeight: '1.6',
          }}
        >
          快去把心愛的商品通通加進來吧！Let's Go Shopping! 🛍️
        </p>
        {/* 加入「去逛逛」按鈕  */}
        <button
          onClick={() => router.push('/products')}
          style={{
            padding: '12px 25px',
            fontSize: '1.1em',
            color: 'white',
            backgroundColor: '#df6c2d',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginTop: '10px', // ✨ 跟上面文字有點間距
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.03)')} // ✨ 滑鼠移上去放大一點點的小互動
          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          前往食材商城
        </button>
        {error && (
          <p style={{ color: 'orange', marginTop: '10px' }}>
            小小提示：{error}
          </p>
        )}{' '}
        {/* 如果有非致命錯誤，還是可以提示一下 */}
      </div>
    )
  }

  // 購物車有商品時的渲染
  return (
    <div>
    {/*<link rel="stylesheet" href="style.css" />*/}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.12.1/font/bootstrap-icons.min.css"
      />
      {/* 你的 Header 元件可以放在這裡 (如果 AuthProvider 是在更外層) */}
      <main>
        <div className="container">
        <div className="cart-title-area" style={{ textAlign: 'center', marginBottom: '30px' }}>
        
        <h1>購物車</h1>
  {/* 你原本的 (已選 X / 共 Y 件) 也可以放在這裡，調整一下樣式 */}
  {cartItemsFromContext && cartItemsFromContext.length > 0 && (
    <p style={{ fontSize: '0.9em', color: '#777', marginTop: '10px' }}>
      (已選 {selectedItems.length} / 共 {cartItemsFromContext.length} 件)
    </p>
  )}
</div>


          {error &&
            cartItemsFromContext &&
            cartItemsFromContext.length > 0 /* 有商品時，錯誤訊息放上面 */ && (
              <p
                style={{
                  color: 'orange',
                  textAlign: 'center',
                  marginBottom: '15px',
                  background: '#fff3cd',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #ffeeba',
                }}
              >
                {error}
              </p>
            )}{' '}
          {/*優惠券套用成功顯示文字*/}
          <div className="checkout-layout">
            <div className="checkout-left">
              <section className="shopping-list">
                {/* ✨✨✨ 新增9: 全選 Checkbox ✨✨✨ */}
                {cartItemsFromContext && cartItemsFromContext.length > 0 && (
                  <div
                    className="cart-select-all"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '15px',
                      paddingBottom: '10px',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <input
                      type="checkbox"
                      id="selectAllCheckbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      disabled={
                        loading ||
                        !cartItemsFromContext ||
                        cartItemsFromContext.length === 0
                      }
                      style={{
                        marginRight: '10px',
                        transform: 'scale(1.2)',
                        cursor: 'pointer',
                      }}
                    />
                    <label
                      htmlFor="selectAllCheckbox"
                      style={{
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      {isAllSelected
                        ? '取消全選'
                        : `全選 (${cartItemsFromContext.length}件)`}
                    </label>
                  </div>
                )}
                {/* 在商品列表渲染部分 */}
                {cartItemsFromContext &&
                  cartItemsFromContext.map((item) => (
                    <div
                      className="cart-item"
                      key={item.cartItemId || item.productId}
                      style={{
                        opacity: loading ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      {/* ✨✨✨ 新增10: 單一商品 Checkbox ✨✨✨ */}
                      <input
                        type="checkbox"
                        className="cart-item__checkbox"
                        checked={!!item.isSelected} // 確保是布林值
                        onChange={(e) => handleSelectItem(item.cartItemId, e)}
                        disabled={loading}
                        style={{
                          marginRight: '15px',
                          transform: 'scale(1.2)',
                          cursor: 'pointer',
                        }}
                      />
                      <img
                        src={item.imageUrl || '/images/default_product.png'}
                        alt={item.name}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          marginRight: '15px',
                          borderRadius: '4px',
                          border: '1px solid #eee',
                        }}
                      />
                      <div className="item-details">
                        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                          {item.name}
                        </p>
                        {/* <p style={{ fontSize: '0.9em', color: '#777' }}>
                          商品ID: {item.productId}
                        </p> */}
                      </div>
                      <div className="item-quantity">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.cartItemId,
                              // item.quantity,
                              -1
                            )
                          }
                          disabled={loading}
                        >
                          -
                        </button>
                        <input
                          type="text"
                          value={item.quantity}
                          readOnly
                          style={{
                            width: '40px',
                            textAlign: 'center',
                            margin: '0 5px',
                            padding: '5px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                          }}
                        />
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.cartItemId,
                              // item.quantity,
                              1
                            )
                          }
                          disabled={loading}
                        >
                          +
                        </button>
                      </div>
                      <div
                        className="item-price"
                        style={{
                          minWidth: '80px',
                          textAlign: 'right',
                          fontWeight: 'bold',
                        }}
                      >
                        $
                        {item.price
                          ? (item.price * item.quantity).toFixed(2)
                          : 'N/A'}{' '}
                        {/* 顯示該項目總價 */}
                      </div>
                      <button
                        onClick={() =>
                          handleDeleteClick(item.cartItemId, item.name)
                        }
                        disabled={loading}
                        title="移除商品"
                        style={{
                          marginLeft: '15px',
                          background: 'transparent',
                          border: 'none',
                          color: '#e74c3c',
                          cursor: 'pointer',
                          fontSize: '1.2em',
                        }}
                      >
                        <i className="bi bi-trash3-fill"></i>{' '}
                        {/* 使用 Bootstrap Icon */}
                      </button>
                    </div>
                  ))}
                {/*{cartItems.length > 0 && ( // 只有購物車有東西才顯示優惠券
                  <div className="coupon-code">
                    <input type="text" placeholder="輸入優惠券代碼"value={couponCode} onChange={(e) => setCouponCode(e.target.value)}
                    disabled={loading}/>
                    
                    <button onClick={handleApplyCoupon} disabled={loading}>使用優惠券</button>
                  </div>
                )}*/}
              </section>
            </div>
            {/* 右邊訂單總計 */}
            <aside className="checkout-right">
              <div className="order-summary">
                <h2>訂單總計</h2>
                <div className="summary-item">
                  <span>商品小計</span>
                  <span>NT ${selectedSubtotal.toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span>運費</span>
                  <span>免運</span>
                </div>
                <div className="summary-item discount">
                  <span>優惠折扣</span>
                  <span>
                    {discountAmount > 0 ? '- NT $' : 'NT $'}
                    {discountAmount.toFixed(2)}
                  </span>
                </div>
                <hr />
                <div className="summary-item total">
                  <span>總金額</span>
                  <span>NT ${grandTotal.toFixed(2)}</span>
                </div>
                {/* 優惠券輸入 */}
                {cartItemsFromContext &&
                  cartItemsFromContext.length > 0 && ( // 只有購物車有東西才顯示優惠券
                    <div className="coupon-code">
                      <input
                        type="text"
                        placeholder="輸入優惠券代碼"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={loading}
                        // 給優惠卷input的
                        // class
                        className="coupon-code__input"
                      />

                      <button
                        onClick={handleApplyCoupon}
                        disabled={loading}
                        // 使用優惠卷按鍵
                        className="coupon-code__button"
                      >
                        使用優惠券
                      </button>
                    </div>
                  )}

                <button
                  className="btn-proceed-payment"
                  disabled={loading}
                  // onClick執行跳轉
                  onClick={handleProceedToContact}
                >
                  {' '}
                  {/* 沒商品或載入中不能按 */}
                  下一步 填寫收件資料 🚀
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
