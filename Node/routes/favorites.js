import express from "express";
import db from "../utils/connect-mysql.js";
import authenticateToken from "../utils/authenticateToken.js";

const router = express.Router();

// GET - 取得會員收藏的食材商品清單
router.get("/products", authenticateToken, async (req, res) => {
  const userId = req.user.user_id; // 從 authenticateToken 中介軟體取得 user_id

  if (!userId) {
    return res.status(401).json({ success: false, message: "未授權，請先登入" });
  }

  try {
    const query = `
      SELECT 
        fp.id, 
        fp.name, 
        fp.brand, 
        fp.price, 
        fp.image_url,
        pf.created_at AS favorited_at 
      FROM product_favorites pf
      JOIN food_products fp ON pf.product_id = fp.id
      WHERE pf.user_id = ?
      ORDER BY pf.created_at DESC;
    `;
    const [rows] = await db.query(query, [userId]);

    // 處理圖片路徑，food_products 資料表的 image_url 已經是完整的相對路徑 (例如：/images/FoodProduct/pro-01.webp)，所以直接使用資料庫的值即可
    const favoritesWithImagePath = rows.map((item) => ({
      ...item,
      image_url: item.image_url,
    }));
    res.json({ success: true, favorites: favoritesWithImagePath });
  } catch (error) {
    console.error("Error fetching product favorites:", error);
    res.status(500).json({ success: false, message: "無法取得收藏商品清單", error: error.message });
  }
});

// DELETE - 取消收藏食材商品
router.delete("/products/:productId", authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const { productId } = req.params; // 從路由參數中獲取 productId

  if (!userId) {
    return res.status(401).json({ success: false, message: "未授權，請先登入" });
  }

  if (!productId) {
    return res.status(400).json({ success: false, message: "未提供商品 ID" });
  }

  try {
    const deleteQuery = `
      DELETE FROM product_favorites 
      WHERE user_id = ? AND product_id = ?;
    `;
    const [result] = await db.query(deleteQuery, [userId, productId]);

    if (result.affectedRows > 0) {
      res.json({ success: true, message: "成功取消收藏" });
    } else {
      // 如果 affectedRows 為 0，可能表示該商品本來就不在該使用者的收藏中，或者 productId 不存在
      res.status(404).json({ success: false, message: "找不到收藏記錄或商品不存在" });
    }
  } catch (error) {
    console.error("Error unfavoriting product:", error);
    res.status(500).json({ success: false, message: "取消收藏失敗", error: error.message });
  }
});

// GET - 取得會員收藏的食譜清單
router.get("/recipes", authenticateToken, async (req, res) => {
  const userId = req.user.user_id; // 從 authenticateToken 中介軟體取得 user_id

  if (!userId) {
    return res.status(401).json({ success: false, message: "未授權，請先登入" });
  }

  try {
    const query = `
      SELECT 
        r.id, 
        r.title, 
        r.cook_time,
        r.image,
        f.created_at AS favorited_at,
        GROUP_CONCAT(DISTINCT cs.name SEPARATOR ', ') AS categories 
      FROM favorites f
      JOIN recipes r ON f.recipe_id = r.id
      LEFT JOIN recipe_category rc ON r.id = rc.recipe_id
      LEFT JOIN categories_sc cs ON rc.category_id = cs.id
      WHERE f.user_id = ?
      GROUP BY r.id, r.title, r.cook_time, r.image, f.created_at
      ORDER BY f.created_at DESC;
    `;
    const [rows] = await db.query(query, [userId]);

    // recipes 資料表的 image 已經是完整的相對路徑，直接使用
    res.json({ success: true, favorites: rows });
  } catch (error) {
    console.error("Error fetching recipe favorites:", error);
    res.status(500).json({ success: false, message: "無法取得收藏食譜清單", error: error.message });
  }
});

// DELETE - 取消收藏食譜
router.delete("/recipes/:recipeId", authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const { recipeId } = req.params; // 從路由參數中獲取 recipeId

  if (!userId) {
    return res.status(401).json({ success: false, message: "未授權，請先登入" });
  }

  if (!recipeId) {
    return res.status(400).json({ success: false, message: "未提供食譜 ID" });
  }

  try {
    const deleteQuery = `
      DELETE FROM favorites 
      WHERE user_id = ? AND recipe_id = ?;
    `;
    const [result] = await db.query(deleteQuery, [userId, recipeId]);

    if (result.affectedRows > 0) {
      res.json({ success: true, message: "成功取消收藏食譜" });
    } else {
      res.status(404).json({ success: false, message: "找不到收藏記錄或食譜不存在" });
    }
  } catch (error) {
    console.error("Error unfavoriting recipe:", error);
    res.status(500).json({ success: false, message: "取消收藏食譜失敗", error: error.message });
  }
});

export default router;
