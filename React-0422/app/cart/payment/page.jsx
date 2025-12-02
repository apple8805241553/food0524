'use client'
import React, { useState } from 'react' // 把 use 改成 useState
import { useCart } from '@/hooks/use-cart';
import styles from '../../src/styles/page-styles/PaymentForm.module.scss'
import { CiCreditCard1 } from 'react-icons/ci' // 使用 react-icons 套件來引入信用卡 icon

import { LazyLoadImage } from 'react-lazy-load-image-component'
import 'animate.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { useSearchParams } from 'next/navigation';

const PaymentForm = () => {
  const searchParams = useSearchParams();
  console.log('📢 PaymentForm 元件本體開始執行/渲染了！');
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState('creditCard') // 'creditCard' 或 'linePay'
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });

  console.log('🔍 目前選擇的付款方式 (selectedPaymentMethod):', selectedPaymentMethod);

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method)
    // 切換付款方式時，也可以考慮清空表單資料
    setFormData({
      cardNumber: '',
      cardName: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'cardNumber'){
      // 只留下數字
      const rawValue = value.replace(/\D/g,'');
      // 最多取16個數字
    const limitedValue = rawValue.substring(0, 16);
      // 四個數字一個"-"
    let formattedValue = '';
    for (let i = 0; i < limitedValue.length; i++) {
      if (i > 0 && i % 4 === 0){
        formattedValue += '-';
      }
      formattedValue += limitedValue[i];
    }

    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: formattedValue
    }));

  } else {
    // 除了信用卡欄位 其餘不變
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
  }
  };

  const { items: allCartItems, clearCart } = useCart(); // 👈 2. 使用 useCart 取得購物車所有商品和清空購物車的函式

  const handleCreditCardSubmit = async (e) => {
    e.preventDefault();
    console.log('信用卡表單資料準備送出 (來自 React 表單):', formData);
  
    // 1. 取得購物車中「已勾選」要結帳的商品
    const itemsToPay = allCartItems ? allCartItems.filter(item => item.isSelected === true) : [];

    if (itemsToPay.length === 0) {
      alert('哎呀！你沒有選擇任何要結帳的商品喔，請先去購物車勾選吧！😉');
      console.log('沒有已勾選的商品可供付款。購物車內容:', allCartItems);
      return; // 沒有勾選商品就不繼續
    }

    // 計算這些已勾選商品的總金額
    const totalAmount = itemsToPay.reduce((sum, item) => {
      // 確保 price 和 quantity 是數字
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity, 10) || 0;
      return sum + (price * quantity);
    }, 0);

    // 準備商品描述字串
    const itemsDescription = itemsToPay.map(item => {
      return `${item.name} x${item.quantity}`; // 組成 "商品名稱 x數量"
    }).join('#'); // 用 # 連接每一項商品

    // 👇👇👇 關鍵步驟：定義 amountForEcpay 👇👇👇
    // (假設 searchParams 已經在元件某處正確取得了)
    const finalAmountFromUrlString = searchParams.get('totalAmount'); // 從 URL 讀取折扣後的總金額
    let amountForEcpay; // 先宣告

    if (finalAmountFromUrlString) {
      amountForEcpay = Math.round(parseFloat(finalAmountFromUrlString));
      console.log('🛒 成功從 URL 讀取到最終應付金額 (totalAmount):', amountForEcpay);
    } else {
      // 備案：如果沒讀到，你可能需要報錯或用一個預設邏輯
      console.warn('⚠️ 未能從 URL 參數讀取到 totalAmount！請檢查流程！');
      // 這裡的備案邏輯很重要，看是要用未折扣的 (但不推薦)，還是提示錯誤
      // 例如，用未折扣的 totalAmount (之前計算的那個)
      // const calculatedSubtotal = itemsToPay.reduce(/*...*/); // 你原本計算 totalAmount 的邏輯
      // amountForEcpay = Math.round(calculatedSubtotal);
      // console.log('🛒 將使用計算出的未折扣小計:', amountForEcpay);
      // 或者，更安全的做法是直接不允許繼續，並提示錯誤
      alert('無法取得正確的付款金額，請返回購物車確認！');
      return; // 中斷執行
    }
    
    // 再次確認金額的有效性
    if (isNaN(amountForEcpay) || amountForEcpay < 0) { // 通常金額也不該是0，除非你的業務允許
      alert('訂單金額不正確 (可能是0、負數或非數字)，請確認一下喔！🤔');
      console.error('訂單金額錯誤:', amountForEcpay);
      return;
    }
    // 👆👆👆 到這裡，amountForEcpay 應該已經有正確的、折扣後的值了 👆👆👆

    // 準備要送給後端的 orderDetails
    const orderDetails = {
      amount: amountForEcpay,
      items: itemsDescription,
    };
  
    console.log('🛒 動態產生的訂單詳情 (準備送去ECPay):', orderDetails);

    if (isNaN(orderDetails.amount) || orderDetails.amount <= 0) {
      alert('訂單金額好像怪怪的，請確認一下喔！🤔');
      console.error('訂單金額錯誤:', orderDetails.amount, '來自已勾選的商品:', itemsToPay);
      return;
    }
  
    try {
      const backendApiUrl = `http://localhost:3001/api/ecpay-test-only?amount=${orderDetails.amount}&items=${encodeURIComponent(orderDetails.items)}`;
      console.log(`🚀 準備呼叫後端 API: ${backendApiUrl}`);
      // 直接讓瀏覽器跳轉到這個網址
      //  window.location.href = backendApiUrl;
      // 啟用fetch
      const response = await fetch(backendApiUrl);
  
    // console.log('📥 後端原始 response 物件:', response);
    // console.log('Response OK? (response.ok):', response.ok);
    // console.log('Response 狀態碼 (response.status):', response.status);
    // console.log('Response URL (fetch 跟隨重導向後的最終 URL):', response.url);

    // const responseText = await response.text(); // 先用 .text() 取得原始回應內容
    // console.log('📄 後端原始回應的文字內容:', responseText);

    if (!response.ok) {
      const errorText = await response.text(); //
      console.error('❌ 後端 API 回應錯誤 (response.ok 為 false):', errorText, '狀態碼:', response.status); //
      alert(`ECPay 請求處理失敗: ${errorText || `狀態碼 ${response.status}`}. 是不是後端出包了？`); //
      return; //
    }
  
    try {
      const responseData = await response.json();
      console.log('✅ 成功從後端收到 ECPay 表單參數 JSON:', responseData);

      if (responseData.success && responseData.actionUrl && responseData.params) {
        // 5. 動態建立一個 form
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = responseData.actionUrl; // 使用後端給的綠界付款網址
        form.style.display = 'none'; // 把這個 form 藏起來，使用者看不到

        // 6. 把後端給的所有綠界參數 (responseData.params) 一個一個做成隱藏的 input 加到 form 裡面
        for (const key in responseData.params) {
          if (responseData.params.hasOwnProperty(key)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = responseData.params[key];
            form.appendChild(input);
          }
        }

        // 7. 把 form 加到 HTML 頁面上，然後用 JavaScript 幫它按下「送出」！
        document.body.appendChild(form);
        form.submit(); // 瀏覽器就會自動跳轉到綠界付款頁面了！
        document.body.removeChild(form); // 送出後可以把這個 form 移除掉 (雖然通常頁面已經跳走了)

        // 你可以在這裡加上付款成功後要做的其他事情，例如清空購物車
        // clearCart(); // 如果你有這個函式的話

      } else {
        // 如果後端回傳的 JSON 裡面 success 是 false，或是少了 actionUrl 或 params
        console.error('❌ 後端回應的 JSON 格式不正確，或缺少必要的 ECPay 參數。收到的 responseData:', responseData);
        alert('無法啟動 ECPay 付款，後端回應資料有誤。請聯絡客服喵～');
      }
    } catch (jsonError) {
      // 如果 response.json() 解析失敗 (表示後端回傳的不是合法的 JSON)
      console.error('❌ 無法將後端回應解析為 JSON:', jsonError); //
      // const originalTextForDebug = await response.text(); // 重新讀取一次原始文字來 debug
      // console.error('📄 (後端回傳的 responseText 不是有效的 JSON):', originalTextForDebug);
      alert('無法啟動 ECPay 付款，後端回應的不是預期的 JSON 資料。是不是後端忘記改 res.json() 啦？🤔'); //
    }

  } catch (error) {
    // 如果是 fetch 本身出錯 (例如網路不通)
    console.error('💣 呼叫後端進行 ECPay 處理時發生前端 fetch 錯誤:', error); //
     //alert('ECPay 服務好像有點問題 (例如網路不通或API掛了)，請檢查網路或稍後再試一次。'); //
  }
};

  const handleLinePaySubmit = async () => {
    console.log('準備進行 LINE Pay 付款...')
    // 1. 從購物車篩選「已勾選」的商品並計算總金額
    // ❌ ❌ ❌ 先測試可否結帳（暫時註解）❌ ❌ ❌ ❌ 
    // const itemsToPay = allCartItems ? allCartItems.filter(item => item.isSelected === true) : [];

    // if (itemsToPay.length === 0) {
    //   alert('請先去購物車勾選要用 LINE Pay 付款的商品喔！😉');
    //   return;
    // }

    // const totalAmount = itemsToPay.reduce((sum, item) => {
    //   const price = parseFloat(item.price) || 0;
    //   const quantity = parseInt(item.quantity, 10) || 0;
    //   return sum + (price * quantity);
    // }, 0);

    // const amountForLinePay = Math.round(totalAmount); // 金額 (通常是整數)

    // console.log('🛒 LINE Pay 訂單金額:', amountForLinePay);

    // if (isNaN(amountForLinePay) || amountForLinePay <= 0) {
    //   alert('LINE Pay 訂單金額不正確喔！🤔');
    //   return;
    // }
    // ❌ ❌ ❌ 先測試可否結帳（暫時註解）❌ ❌ ❌ ❌ 

    // --- 測試用：直接指定一個測試金額 ---
  const amountForLinePay = 1; // ✨✨ 關鍵在這裡！我們在這裡定義了 amountForLinePay
  console.log('🛒 LINE Pay 訂單金額 (測試模式):', amountForLinePay);
  // --- 測試用金額設定結束 ---
    // 再次確認我們寫死的測試金額是有效的 （測試完刪除）
  if (isNaN(amountForLinePay) || amountForLinePay <= 0) {
    alert('噢噢！測試金額好像不太對，請設定一個大於 0 的數字啦～');
    return;
  }

    try {
      // 2. 呼叫後端API，注意是 GET 請求
      const backendApiUrl = `http://localhost:3001/api/line-pay-test-only/reserve?amount=${amountForLinePay}`;
      
      console.log(`🚀 準備呼叫後端 LINE Pay API: ${backendApiUrl}`);

      const response = await fetch(backendApiUrl); // GET 請求

      if (!response.ok) {
        let errorMessage = `LINE Pay 請求處理失敗，狀態碼：${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) { /* 解析 JSON 失敗，使用預設錯誤訊息 */ }
        console.error('❌ 呼叫後端 LINE Pay API 失敗:', errorMessage);
        alert(errorMessage);
        return;
      }

      // 3. 解析後端回傳的 JSON，裡面應該要有 LINE Pay 的付款網址
      const responseData = await response.json();
      //    我們預期後端會回傳像這樣的格式: { ..., paymentUrl: 'https://line.pay/redirect/url...' }

      if (responseData.paymentUrl) {
        console.log('🚀 成功從後端取得 LINE Pay 付款網址，準備跳轉:', responseData.paymentUrl);
        window.location.href = responseData.paymentUrl; // ✨ 執行跳轉！
      } else {
        console.error('❌ 後端回應中未包含 paymentUrl。收到的回應:', responseData);
        alert('無法啟動 LINE Pay 付款，好像少了重要的付款連結耶！');
      }

    } catch (error) {
      console.error('💣 呼叫後端進行 LINE Pay 處理時發生前端 fetch 錯誤:', error);
      alert('LINE Pay 服務好像有點問題，請檢查網路或稍後再試一次。');
    }
  };
  

  return (
    // 最外層的 wrapper
    <div className={styles.paymentPageWrapper}>
      <div className={styles.paymentFormContainer}>
        {/* H2 標題 */}
        <h2 className={styles.formHeaderTitle}>選擇付款方式</h2>

        {/* 付款方式按鈕 */}
        <div className={styles.paymentMethodSelector}>
          <button
            type="button"
            className={`${styles.methodButton} ${selectedPaymentMethod === 'creditCard' ? styles.active : ''}`}
            onClick={() => handlePaymentMethodChange('creditCard')}
          >
            {/* card icon */}
            <CiCreditCard1 className={styles.paymentIcon} />
            信用卡
          </button>
          <button
            type="button"
            className={`${styles.methodButton} ${selectedPaymentMethod === 'linePay' ? styles.active : ''}`}
            onClick={() => handlePaymentMethodChange('linePay')}
          >
            {/* line.png*/}
            <img
              src="/images/cart/line.png"
              alt="LINE Pay"
              className={`${styles.paymentIcon} ${styles.linePayIcon}`}
            />
            LINE Pay
          </button>
        </div>

        {/* 信用卡付款 */}
        {selectedPaymentMethod === 'creditCard' && (
          <div className={styles.creditCardSection}>
          <h3>信用卡付款</h3>
          <p>點擊下方按鈕，將引導您至 EC Pay 完成付款。</p>
          <button 
          type="button" 
          onClick={handleCreditCardSubmit} // 事件綁定
          className={`${styles.submitButton} ${styles.paymentForm}`}
          >
            使用信用卡付款
            </button>
          </div>
        )}

        {/* linePay付款 */}
        {selectedPaymentMethod === 'linePay' && (
          <div className={styles.linePaySection}>
            <h3>LINE Pay 付款</h3>
            <p>點擊下方按鈕，將引導您至 LINE Pay 完成付款。</p>
            <button
              type="button"
              onClick={handleLinePaySubmit} // 事件綁定
              className={`${styles.submitButton} ${styles.linePayButton}`}
            >
              前往 LINE Pay 付款
            </button>
            <p className={styles.linePayNote}>
              {/* 實際 LINE Pay 串接需要在您的 Node.js 後端與 LINE Pay API 進行整合。
              前端主要負責觸發流程並接收後端的回應。*/}
            </p>
          </div>
        )}
      </div>

      {/* sticker */}
      <LazyLoadImage
        src="../images/design/cart-sticker-01.svg"
        delayTime={300}
        className={`${styles.sticker1} animate__animated animate__fadeInRight`}
        alt="POS機"
      />
      <LazyLoadImage
        src="../images/design/cart-sticker-02.svg"
        delayTime={300}
        className={`${styles.sticker2} animate__animated animate__fadeInLeft`}
        alt="people"
      />
    </div>
  )
}

export default PaymentForm
