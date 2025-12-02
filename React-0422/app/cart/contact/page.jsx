'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import '../style.css'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/auth-context' // 獲取使用者資訊
import 'bootstrap/dist/css/bootstrap.min.css'
// import { parse } from 'path';

function BootstrapPageSpinner() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 150px)', // 讓它至少佔滿大部分可視高度，150px可以根據你的 Header/Footer 高度調整
      textAlign: 'center', // 確保文字也置中
      padding: '20px', // 加點內距
    }}>
      <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">載入中...</span>
      </div>
      <p className="mt-3" style={{ fontSize: '1.1em' }}> {/* mt-3 是 Bootstrap 的 margin-top class */}
        資料處理中，請稍候... 🏃‍♀️💨
      </p>
    </div>
  );
}

export default function ContactPage() {
  const authDataFromHook = useAuth() // <--- 先不要解構！

  const router = useRouter()
  // 取得購物車資料
  const searchParams = useSearchParams() // 專門用來讀取 URL query parameters

  const [orderTotal, setOrderTotal] = useState(0) // 儲存訂單總金額

  const {
    items: cartContextItems, // 從context 取得購物車商品列表
    totalAmount: cartContextSubtotal, // 從context 取得購物車小計 （未含運費折扣）
    totalQty: cartContextTotalQty, // 從context 取得購物車商品總數量
    didMount: isCartReady,
  } = useCart()

  const [recipient, setRecipient] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    district: '',
    address: '',
  })
  const [notes, setNotes] = useState('') // 訂單備註
  const [formErrors, setFormErrors] = useState({}) // 儲存表單驗證錯誤訊息

  const [orderDetails, setOrderDetails] = useState(null) // 儲存訂單摘要
  const [loading, setLoading] = useState(true) // 控制載入狀態

  const [showModal, setShowModal] = useState(false) // 控制 SweetModal 的顯示
  // const { auth } = useAuth();
  // 後端api port
  const API_BASE_URL = 'http://localhost:3001'

  useEffect(() => {
    console.log(
      'ContactPage: authDataFromHook on mount/update:',
      authDataFromHook
    )
  }, [authDataFromHook]) // 看看 authDataFromHook 一開始是什麼

  useEffect(() => {
    console.log(
      '🕵️‍♂️ ContactPage useEffect 開始！目前網址是:',
      window.location.href
    )
    console.log('🛒 此時的 cartContextItems (來自 useCart):', cartContextItems)

    setLoading(true) // 一開始先 loading

    let finalGrandTotal = 0 // 先準備一個變數來裝最終的 grandTotal
    let initialSubtotal = 0 // 其他你可能需要的初始值
    let initialShipping = 0 // 你的預設運費
    let initialDiscount = 0 // 你的預設折扣
    let initialCartItems = []

    // 1. 最優先處理從 URL 來的總金額
    const totalFromCartString = searchParams.get('totalAmount')
    console.log(
      '📧 從URL拿到的 totalFromCartString 原始值是:',
      totalFromCartString
    ) // <-- 這個超重要！看它是不是 null 或空字串
    if (totalFromCartString) {
      const parsedTotalFromCart = parseFloat(totalFromCartString)
      console.log(
        '🔢 parseFloat後的 parsedTotalFromCart 是:',
        parsedTotalFromCart
      ) // 看 parse 完是不是 NaN

      if (!isNaN(parsedTotalFromCart)) {
        // 確定是數字才用
        setOrderTotal(parsedTotalFromCart) // 設定總金額
        finalGrandTotal = parsedTotalFromCart // URL 來的總金額優先度最高！
        console.log('💰 URL總金額GET！設為優先總額:', finalGrandTotal)
      } else {
        console.error(
          '😱 URL的 totalAmount 不是有效的數字字串:',
          totalFromCartString
        )
      }
    } else {
      console.warn('🤷‍♂️ URL裡面找不到 totalAmount 參數，或者它是空的。')
    }

    // ✨✨✨ 新增部分：處理商品小計、運費、折扣 ✨✨✨
    const subtotalString = searchParams.get('subtotal')
    const shippingString = searchParams.get('shipping')
    const discountString = searchParams.get('discount')

    if (subtotalString) {
      const parsedSubtotal = parseFloat(subtotalString)
      if (!isNaN(parsedSubtotal)) {
        initialSubtotal = parsedSubtotal
        console.log('SUBTOTAL 從URL GET！:', initialSubtotal)
      } else {
        console.warn(
          '🤷‍♀️ URL的 subtotal (' + subtotalString + ') 不是數字，使用預設小計:',
          initialSubtotal
        )
      }
    } else {
      console.warn('🤷‍♂️ URL裡面找不到 subtotal 參數，使用預設小計。')
    }

    if (shippingString) {
      const parsedShipping = parseFloat(shippingString)
      if (!isNaN(parsedShipping)) {
        initialShipping = parsedShipping
        console.log('SHIPPING 從URL GET！:', initialShipping)
      } else {
        console.warn(
          '🤷‍♀️ URL的 shipping (' + shippingString + ') 不是數字，使用預設運費:',
          initialShipping
        )
      }
    } else {
      console.warn('🤷‍♂️ URL裡面找不到 shipping 參數，使用預設運費。')
    }

    if (discountString) {
      const parsedDiscount = parseFloat(discountString)
      if (!isNaN(parsedDiscount)) {
        initialDiscount = parsedDiscount
        console.log('DISCOUNT 從URL GET！:', initialDiscount)
      } else {
        console.warn(
          '🤷‍♀️ URL的 discount (' + discountString + ') 不是數字，使用預設折扣:',
          initialDiscount
        )
      }
    } else {
      console.warn('🤷‍♂️ URL裡面找不到 discount 參數，使用預設折扣。')
    }
    // ✨✨✨ 新增部分結束 ✨✨✨

    // 2. 處理 localStorage
    const storedDetailsString = localStorage.getItem('currentOrderDetails')
    if (storedDetailsString) {
      try {
        const parsedStoredDetails = JSON.parse(storedDetailsString)
        console.log('📦 localStorage資料GET！', parsedStoredDetails)

        // 如果URL沒有提供總金額，
        // URL > localStorage > 預設值
        if (
          !totalFromCartString &&
          parsedStoredDetails.grandTotal !== undefined
        ) {
          finalGrandTotal = parsedStoredDetails.grandTotal
        }
        if (!subtotalString && parsedStoredDetails.subtotal !== undefined) {
          initialSubtotal = parsedStoredDetails.subtotal
        }
        if (!shippingString && parsedStoredDetails.shippingFee !== undefined) {
          initialShipping = parsedStoredDetails.shippingFee
        }
        if (
          !discountString &&
          parsedStoredDetails.discountAmount !== undefined
        ) {
          initialDiscount = parsedStoredDetails.discountAmount
        }
        initialCartItems = parsedStoredDetails.cartItems || initialCartItems
      } catch (error) {
        console.error('😭 localStorage 解析GG:', error)
        // 解析失敗，就當作沒撈到，繼續用預設值 + URL來的總金額 (如果有的話)
      }
    } else {
      console.warn(
        '🤔 localStorage 空空如也，將使用預設值 (總金額可能來自URL)。'
      )
      // localStorage 是空的，不用特別做啥，因為我們的初始值已經是預設的了
      // finalGrandTotal 在這裡，如果 URL 有值，就會是 URL 的值，不然就是初始的 0
    }

    // 3. 最後，一次性更新 orderDetails state
    const detailsToSet = {
      subtotal: initialSubtotal, // 這裡的 subtotal 邏輯可能還需要你根據情況調整
      // 例如，如果 finalGrandTotal 是包含運費折扣的，那 subtotal 可能是 finalGrandTotal - initialShipping + initialDiscount
      // 但如果 totalFromCartString 本身是 subtotal，那邏輯又不一樣。
      // 為了簡單，我們先假設你有辦法處理好 subtotal。
      // 最重要的 grandTotal 已經被 finalGrandTotal 控制了。
      shippingFee: initialShipping,
      discountAmount: initialDiscount,
      grandTotal: finalGrandTotal, // 確保這裡用的是我們最優先處理過的 finalGrandTotal
      cartItems: initialCartItems,
      // 如果有 error 狀態，也記得放進來
    }
    console.log('🧐 最後要 setOrderDetails 的物件是:', detailsToSet)
    setOrderDetails(detailsToSet) // 設定訂單摘要

    setLoading(false)
  }, [searchParams, isCartReady, cartContextItems]) // 依賴記得放

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setRecipient((prev) => ({ ...prev, [name]: value }))
    // 清除該欄位的錯誤提示
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleNotesChange = (e) => {
    setNotes(e.target.value)
  }

  // 簡易表單驗證函式
  const validateForm = () => {
    const errors = {}
    if (!recipient.name.trim()) errors.name = '請填寫您的大名'
    if (!recipient.phone.trim()) errors.phone = '請填寫您的手機號碼'
    else if (!/^\d{10}$/.test(recipient.phone.trim()))
      errors.phone = '手機號碼格式好像不太對，請輸入10個數字。'
    if (!recipient.email.trim()) errors.email = '請填寫您的Email'
    else if (!/\S+@\S+\.\S+/.test(recipient.email.trim()))
      errors.email = '請確認您的Email格式正確'
    if (!recipient.city.trim()) errors.city = '請填寫您的縣市'
    if (!recipient.district.trim()) errors.district = '請填寫您的鄉鎮市區'
    if (!recipient.address.trim()) errors.address = '請填寫您的詳細地址'

    setFormErrors(errors)
    return Object.keys(errors).length === 0 // 如果沒有錯誤訊息，代表驗證通過
  }

  const handleSubmit = async (e) => {
    e.preventDefault() // 防止表單預設的提交跳轉行為

    // ✨✨✨ 前端先檢查購物車是不是空的 ✨✨✨
    if (!cartContextItems || cartContextItems.length === 0) {
      alert('哎呀！您的購物車是空的，沒辦法提交訂單喔！快去挑選幾件好物吧～🛍️')
      return // 中斷提交，根本不要發 fetch
    }

    if (!validateForm()) {
      // alert('有些資料好像漏填或格式不太對喔，檢查一下紅字提示的地方吧！😉')
      return
    }

    // 確保 orderDetails (至少運費和折扣部分) 已載入
    if (!orderDetails) {
      alert('訂單資訊 (運費/折扣) 尚未準備好，請稍候或重試。')
      return
    }

    // ✨✨ 在要用 auth 之前，先檢查 ✨✨
    if (
      !authDataFromHook ||
      !authDataFromHook.auth ||
      !authDataFromHook.auth.user_id
    ) {
      console.error(
        '😭 handleSubmit: authDataFromHook or auth or auth.user_id is not available!',
        authDataFromHook
      )
      // alert('無法取得使用者資訊，可能您需要重新登入，或稍後再試。')
      setLoading(false); // 如果你有 setLoading
      return // 中斷提交
    }

    // ✨✨✨ 把 authDataFromHook.auth 解構或賦值出來 ✨✨✨
    const auth = authDataFromHook.auth // 現在 handleSubmit 裡面就有一個叫 auth 的變數了
    // 或者如果你只需要 id: const { id: userId } = authDataFromHook.auth; (也要注意 authDataFromHook.auth 不能是 null)

    if (!auth.user_id || auth.user_id === 0) {
      // 再檢查 id (因為 noAuth 的 id 是 0)
      console.error('😭 handleSubmit: userId 無效!', 'Current auth:', auth)
      // alert('您似乎尚未登入有效的帳號，請先登入後再提交訂單喔！😉')
      return
    }

    // ✨✨✨ 如果能跑到這裡，代表 auth.user_id 是有效的！ ✨✨✨
    const userId = auth.user_id
    console.log('✨ 準備送出的 userId:', userId)

    // 計算總金額
    const subtotalForSubmit =
      typeof cartContextSubtotal === 'number' ? cartContextSubtotal : 0
    const shippingFeeForSubmit = orderDetails.shippingFee || 0
    const discountAmountForSubmit = orderDetails.discountAmount || 0
    const grandTotalForSubmit =
      subtotalForSubmit + shippingFeeForSubmit - discountAmountForSubmit

    console.log('📦 準備提交的訂單資料：')
    console.log('收件人:', recipient)
    console.log('訂單備註:', notes)
    console.log('訂單摘要:', orderDetails)
    // usecart 商品列表與小計
    console.log('購物車商品:', cartContextItems)
    console.log('購物車小計:', cartContextSubtotal)
    // console.log('運費:', finalShippingFee);
    // console.log('折扣:', finalDiscountAmount);
    // console.log('最終總金額:', finalGrandTotal);
    console.log('會員 ID:', orderDetails.userId) // 假設你有訂單 ID

    // --- 接下來是串接後端 API 的部分 ---
    setLoading(true) // 點下先轉圈 正在處理中
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        // 後端 API 端點
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // JSON 格式
        body: JSON.stringify({
          //把送出的資料打包json字串
          recipientInfo: recipient, // 收件人資料 (來自 recipient state)
          orderNotes: notes, // 訂單備註 (來自 notes state)
          // 把 orderDetails 裡需要的資訊 (例如 cartItems, grandTotal, userId) 一起送出
          cartItems: cartContextItems, // 商品列表
          totalAmount: orderDetails.grandTotal, // 總金額
          userId: auth?.user_id, // 使用者id
          // 你可能還需要支付方式等其他資訊
        }),
      })

      if (!response.ok) {
        // ✨✨✨ 當後端回應不OK (例如 400, 500) ✨✨✨
        let errorPayload = {
          message: `後端回應錯誤，狀態碼：${response.status}`,
        }
        try {
          const potentialErrorData = await response.json() // 嘗試解析後端回的 JSON 錯誤訊息
          if (
            potentialErrorData &&
            typeof potentialErrorData.message === 'string'
          ) {
            errorPayload.message = potentialErrorData.message
          }
          console.log('後端回傳的錯誤 JSON (如果有的話):', potentialErrorData)
        } catch (jsonError) {
          console.error(
            '😭 response.json() 解析失敗 (可能後端回的不是JSON):',
            jsonError
          )
          // 此時 errorPayload.message 仍然是 "後端回應錯誤，狀態碼：..."
        }
        throw new Error(errorPayload.message) // 把整理好的錯誤訊息丟出去，會被下面的 catch 接住
      }

      // ✨✨✨ 如果 response.ok 是 true (例如後端回 200 或 201) ✨✨✨
      const result = await response.json() // 解析後端成功的 JSON 回應
      console.log('🎉 訂單成功提交！後端回應：', result)

       // alert('訂單已成功送出！感謝您的購買！') // (或用 result.message)

      // router.push(`/thank-you?orderId=${result.orderId}`);
      if (orderDetails && typeof orderTotal === 'number') { // 確保 orderTotal 也是有效的數字
        router.push(
          `/cart/payment?totalAmount=${orderTotal}&subtotal=${orderDetails.subtotal}&shipping=${orderDetails.shippingFee}&discount=${orderDetails.discountAmount}`
        );
      }
    } catch (error) {
      // 外層的 catch，會接住上面 throw new Error 或 fetch 本身的網路錯誤
      console.error('😭 handleSubmit CATCH BLOCK - Error Object:', error)
      console.error('😭 handleSubmit CATCH BLOCK - Error Name:', error.name)
      console.error(
        '😭 handleSubmit CATCH BLOCK - Error Message:',
        error.message
      )
      alert(`訂單提交失敗：${error.message} (詳細錯誤請看Console)。`)
    } finally {
      // setLoading(false)
    }
  }

  if (loading) {
    return <BootstrapPageSpinner />; // 就顯示我們美美的 Bootstrap Spinner
  }
  // 再次確認 orderDetails 存在，主要為了運費和折扣
  const currentShippingFee = orderDetails?.shippingFee || 0 // 確保運費有值
  const currentDiscountAmount = orderDetails?.discountAmount || 0 // 確保折扣有值
  // 總金額計算
  const currentGrandTotal =
    cartContextSubtotal + currentShippingFee - currentDiscountAmount

  return (
    <div>
      {/* 確保你有引入 Bootstrap Icons 或其他 Icon Font */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.12.1/font/bootstrap-icons.min.css"
      />
      {/* 沿用購物車的 CSS 或你有自己的 Contact 頁面 CSS */}
      {/* <link rel="stylesheet" href="../cart/style.css" /> */}
      <style jsx global>{`
        /* 簡易的錯誤提示樣式，你可以放到你的全域 CSS 或 Contact 頁面的 CSS Module */
        .form-group .error-text {
          color: red;
          font-size: 0.875em;
          margin-top: 4px;
        }
        .form-group input.input-error,
        .form-group textarea.input-error {
          border-color: red;
        }
      `}</style>

      <main>
        <div className="container">
        <h1>填寫收件資料</h1>

          <div className="checkout-layout">
            {' '}
            {/* 保持跟購物車頁類似的左右佈局 */}
            <div className="checkout-left">
              <form onSubmit={handleSubmit}>
                <section className="recipient-info">
                  <h2>收件人資料</h2>
                  <div className="form-group">
                    <label htmlFor="name">姓名</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={recipient.name}
                      onChange={handleInputChange}
                      className={formErrors.name ? 'input-error' : ''}
                    />
                    {formErrors.name && (
                      <p className="error-text">{formErrors.name}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">手機號碼</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={recipient.phone}
                      onChange={handleInputChange}
                      className={formErrors.phone ? 'input-error' : ''}
                    />
                    {formErrors.phone && (
                      <p className="error-text">{formErrors.phone}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={recipient.email}
                      onChange={handleInputChange}
                      className={formErrors.email ? 'input-error' : ''}
                    />
                    {formErrors.email && (
                      <p className="error-text">{formErrors.email}</p>
                    )}
                  </div>
                  <div className="form-group address-group">
                    <label>收件地址</label>
                    <input
                      type="text"
                      name="city"
                      placeholder="縣市 (例如：高雄市)"
                      value={recipient.city}
                      onChange={handleInputChange}
                      className={formErrors.city ? 'input-error' : ''}
                    />
                    {formErrors.city && (
                      <p className="error-text">{formErrors.city}</p>
                    )}
                    <input
                      type="text"
                      name="district"
                      placeholder="鄉鎮市區 (例如：鳳山區)"
                      value={recipient.district}
                      onChange={handleInputChange}
                      className={formErrors.district ? 'input-error' : ''}
                    />
                    {formErrors.district && (
                      <p className="error-text">{formErrors.district}</p>
                    )}
                    <input
                      type="text"
                      name="address"
                      placeholder="詳細地址 (例如：光遠路123號)"
                      value={recipient.address}
                      onChange={handleInputChange}
                      className={formErrors.address ? 'input-error' : ''}
                    />
                    {formErrors.address && (
                      <p className="error-text">{formErrors.address}</p>
                    )}
                  </div>
                </section>

                <section className="order-notes">
                  <h2>訂單備註</h2>
                  <textarea
                    name="notes"
                    placeholder="有什麼想跟我們說的嗎？例如「管理員代收」、「請避開中午休息時間」等等～ (選填)"
                    value={notes}
                    onChange={handleNotesChange}
                  />
                </section>

                {/* 注意事項 */}
                <section className="important-notes">
                  <h3>注意事項</h3>
                  <ul>
                    <li>訂單成立後，將以Email通知您訂單成立。</li>
                    <li>付款完成後約1-3個工作日內出貨，如遇例假日則順延。</li>
                    <li>
                      目前暫不提供離島寄送服務，金門馬祖澎湖的朋友們搜哩啦！
                    </li>
                    <li>
                      為保障彼此之權益，收到您的訂單後仍保有決定是否接受訂單及出貨與否之權利。
                    </li>
                  </ul>
                </section>
              </form>
            </div>
            <aside className="checkout-right">
              {orderDetails && (
                <div className="order-summary">
                  <h2>訂單摘要</h2>
                  {/* 這裡可以選擇性地顯示購物車內容摘要 */}
                  {orderDetails.cartItems &&
                    orderDetails.cartItems.length > 0 && (
                      <div
                        style={{
                          marginBottom: '15px',
                          paddingBottom: '10px',
                          borderBottom: '1px solid #eee',
                        }}
                      >
                        <strong>
                          購買商品 ({orderDetails.cartItems.length} 項):
                        </strong>
                        <ul
                          style={{
                            listStyle: 'none',
                            paddingLeft: '10px',
                            fontSize: '0.9em',
                          }}
                        >
                          {orderDetails.cartItems.slice(0, 3).map(
                            (
                              item // 只顯示前3項，避免太長
                            ) => (
                              <li key={item.productId}>
                                - {item.name} x {item.quantity}
                              </li>
                            )
                          )}
                          {orderDetails.cartItems.length > 3 && (
                            <li>
                              ...等共 {orderDetails.cartItems.length} 件商品
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  <div className="summary-item">
                    <span>商品小計</span>
                    <span>NT ${orderDetails.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <span>運費</span>
                    <span>免運</span>
                  </div>
                  {orderDetails.discountAmount > 0 && (
                    <div className="summary-item discount">
                      <span>優惠折扣</span>
                      <span>
                        - NT ${orderDetails.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <hr />
                  <div className="summary-item total">
                    <span>總金額</span>
                    <span>NT ${orderTotal.toFixed(2)}</span>
                  </div>
                  <button
                    type="button" // 如果 form 在 checkout-left, 這個按鈕不在 form 內，所以用 type="button" 並在 onClick 呼叫 handleSubmit
                    className="btn-proceed-payment"
                    onClick={handleSubmit} // 點擊時觸發表單驗證和提交邏輯
                    disabled={loading} // 如果正在提交，就 disable 按鈕
                  >
                    {loading ? '處理中...' : '確認資料並前往付款 💳'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/cart')} // 返回購物車
                    style={{
                      background: '#6c757d', // bootstrap secondary color
                      color: 'white',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '5px',
                      width: '100%',
                      marginTop: '10px',
                      cursor: 'pointer',
                      fontSize: '1em',
                    }}
                  >
                    <i className="bi bi-arrow-left-circle"></i> 返回購物車修改
                  </button>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
