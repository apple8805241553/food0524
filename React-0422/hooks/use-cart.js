'use client'

// context套用第1步: 建立context
import { createContext, useState, useContext, useCallback } from 'react'
import { useEffect } from 'react'

// createContext的傳入參數是 defaultValue，是在套用context失敗或有錯誤發生時會得到的預設值(也有備援值的概念)，可以用有意義的值或是null(通常是針對物件或是除錯用)
const CartContext = createContext(null)
// 設定displayName屬性(呈現名稱)
// 可選的屬性，用於搭配react devtools(瀏覽器擴充)使用，方便除錯。不給定的話都是統一使用"Context"名稱
CartContext.displayName = 'CartContext'

// 建立CartProvider元件，它也是用來包裹套嵌用的元件(前後開頭結尾)
// 要共享的狀態放在這元件中各別管理(而不是放在Providers元件中)
// 導出(命名導出 named export)
export function CartProvider({ children }) {
  // 購物車中的項目
  // 與商品的物件值會相差一個count屬性(數字類型，代表購買的數量)
  const [items, setItems] = useState([])

  //   決定是否為第一次渲染的狀態(透過布林值)
  const [didMount, setDidMount] = useState(false)

  // 新增loadCart函式
  const loadCart = useCallback((newCartItems) => {
    setItems(newCartItems || [])
  }, []) // setItems 是穩定的，依賴陣列可以是空的

  // 處理遞增數量
  const onIncrease = useCallback((itemId) => {
    setItems(
      (
        prevItems // ✨ 使用 setItems 的 functional update 形式，prevItems 是當前最新的 items 狀態
      ) =>
        prevItems.map((item) =>
          // 假設你的 items 裡面的 id 就是用來唯一識別購物車項目的
          // (例如 productId 或 cartItemId，你需要確保這裡用的 id 跟你的資料結構一致)
          item.id === itemId ? { ...item, count: (item.count || 0) + 1 } : item
        )
    )
  }, []) // ✨ 依賴陣列可以是空的，因為 setItems 的 functional update 形式不需要依賴外部的 items state，
  // 而 setItems 本身是由 React 保證其引用穩定性的。

  // 處理遞減數量
  const onDecrease = useCallback((itemId) => {
    setItems((prevItems) =>
      prevItems.map(
        (item) =>
          item.id === itemId
            ? { ...item, count: Math.max(0, (item.count || 0) - 1) }
            : item
        // Math.max(0, ...) 避免數量變負數，如果數量為0時要移除該商品，你可能需要在這裡或之後加 .filter() 邏輯
      )
    )
  }, []) // 依賴陣列可以是空的

  // 處理刪除
  const onRemove = useCallback((itemId) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId))
  }, []) // 依賴陣列可以是空的

  // 處理新增
  const onAdd = useCallback((product) => {
    // product 應該是你想要加入購物車的商品物件
    setItems((currentItems) => {
      // 假設 product 物件有 id 屬性，且這個 id 跟 items 裡的 item.id 是同個東西
      const foundIndex = currentItems.findIndex((v) => v.id === product.id)

      if (foundIndex !== -1) {
        // 如果商品已存在，增加數量
        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, count: (item.count || 0) + 1 }
            : item
        )
      } else {
        // 否則，新增商品到購物車 (假設 product 物件有 price 等屬性)
        const newItem = { ...product, count: 1 }
        return [newItem, ...currentItems]
      }
    })
  }, []) // product 是傳入參數，不需列為依賴；setItems 的 functional update 讓依賴陣列可以是空的

  // 使用陣列的迭代方法reduce來計算總數量/總價
  // 稱為衍生/派生狀態(derived state)，意即是狀態的一部份，或是由狀態計算得來的變數值
  const totalQty = items.reduce((acc, v) => acc + v.count, 0)
  const totalAmount = items.reduce((acc, v) => acc + v.count * v.price, 0)

  //   第一次渲染完成後，從localStorage中讀取(取出)購物車項目。如果有資料時，設定到items狀態中
  useEffect(() => {
    // 從localStorage中讀取(取出)購物車項目，key為cart。沒資料時為空陣列
    setItems(JSON.parse(localStorage.getItem('cart')) || [])
    // 已完成第一次渲染完成後，將該狀態設為true
    setDidMount(true)
  }, [])

  //   當狀態items發生變化時，更新localStorage中的購物車項目
  //   因為要排除掉第一次渲染，所以需要宣告一個特殊的狀態來做控制
  useEffect(() => {
    // 如果在第一次渲染之後
    if (didMount) {
      // 裡面要進行的是 items --> localStorage方向的同步化
      localStorage.setItem('cart', JSON.stringify(items))
    }
    // 下面這一行為告訴eslint不用檢查下面這一行[items]
    // eslint-disable-next-line
  }, [items, didMount])
  return (
    <CartContext.Provider
      // 要傳出的值屬性比較多時，可以按值or函式分組，與按英文名稱由上到下排序
      value={{
        items,
        totalAmount,
        totalQty,
        onAdd,
        onDecrease,
        onIncrease,
        onRemove,
        loadCart,
        didMount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// 導出(命名導出 named export)自訂名稱的勾子(hook)，配合上面的AuthProvider使用，用於解析出對應的context的value屬性值，專用名稱可以讓閱讀性較佳
// 注意: 如果想要在編輯器中有提示或自動完成功能，需要使用TypeScript或是JSDoc來定義回傳值的類型。
/**
 *
 * useAuth是一個設計專門用來讀取CartContext的值的勾子(hook)。
 * items, totalAmount, totalQty, onAdd, onDecrease, onIncrease, onRemove,
 *
 * @returns {{items: Array, totalAmount:number,  totalQty: number, onAdd: Function, onDecrease: Function, onIncrease: Function, onRemove: Function, loadCart: Function, didMount: boolean}}
 */
export const useCart = () => useContext(CartContext)
