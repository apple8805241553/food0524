// API 路徑指定為環境變數
// 請在 .env 檔案中設定 NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
export const API_SERVER = process.env.NEXT_PUBLIC_BACKEND_URL

// 連到餐廳詳細頁
export const FOOD_RESTAURANT = `${API_SERVER}/restaurants/api`
export const AB_LIST = `${API_SERVER}/address-book/api`

// 刪除項目
// method: DELETE, url: `${API_SERVER}/address-book/api/${ab_id}`
export const AB_ITEM_DELETE = `${API_SERVER}/address-book/api`

// 新增項目
// method: POST
export const AB_ADD_POST = `${API_SERVER}/address-book/api`

// 修改資料
// method: PUT
// url: `${API_SERVER}/address-book/api/${ab_id}`
export const AB_UPDATE = `${API_SERVER}/address-book/api`

// jwt 登入的 url
// method: POST, required: email, password
export const JWT_LOGIN = `${API_SERVER}/jwt-login`

// toggle-like
// method:POST
// url: `${API_SERVER}/address-book/toggle-like`
export const TOGGLE_LIKE = `${API_SERVER}/address-book/toggle-like`
