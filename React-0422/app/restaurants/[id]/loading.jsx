// app/restaurants/loading.jsx (這個檔案告訴 Next.js 在載入 /restaurants 時顯示什麼)
'use client' // 如果您匯入的元件是客戶端元件，這裡也可能需要加
import RootLoadingComponent from '../../loading' // 根據相對路徑匯入 app/loading.jsx 中定義的元件

// 將匯入的共用 Loading 元件作為這個 loading.jsx 檔案的預設匯出
export default function Loading() {
  return <RootLoadingComponent />
}
