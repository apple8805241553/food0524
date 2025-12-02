# Node
## 05/15
要新增ＡＰＩ功能一方面新增在product.js一方面也要在index.js新增路徑
ex: routes/products新增;在/index.js新增路由
import productRoutes from './routes/product.js';  // 引入你剛剛的商品路由
app.use('/api/products', productRoutes);  // 掛載路由，成為 /api/products/xxxx

隱患：
SQL 語句未指定欄位，使用 SELECT *
使用 SELECT * 會：增加資料傳輸量（若表格欄位變多）
無法控制前端資料結構
當欄位調整時，前端易爆錯
建議：
改為指定欄位：
SELECT id, product_name, category, price FROM food_products ...

具體明確的路由，例如：
router.get('/api/item/:id', ...)
上述因為路由邏輯是你要先進去商城列表才會進去商品詳情，同一層不能有兩隻會衝突的ＡＰＩ反正就是分層寫最保險