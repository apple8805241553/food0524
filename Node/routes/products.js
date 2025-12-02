// --- routes/product.js ---
import express from "express";
import db from "../utils/connect-mysql.js"; // 連接資料庫
import fs from "node:fs/promises";
import { z } from "zod";
import moment from "moment-timezone";
import upload from "../utils/upload-imgs.js";
import jwt from "jsonwebtoken";


const router = express.Router();

// 取得所有商品（會依照分頁來顯示）
//http://localhost:3001/products/api/products
router.get('/api/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const offset = (page - 1) * limit;
        const user_id = req.my_jwt ? req.my_jwt.user_id : 0; // 如果有 JWT，則取得 user_id

        // 取得總筆數 (這部分不變)
        const [countResult] = await db.query('SELECT COUNT(*) AS total FROM food_products');
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // 取得分頁資料，並使用隨機排序
        // 這裡的關鍵就是把 ORDER BY id DESC 改成 ORDER BY RAND()
        const [rows] = await db.query(
            `SELECT food_products.*, pf.id AS favorite_id FROM food_products 
            LEFT JOIN (
                SELECT * FROM product_favorites WHERE user_id=${user_id}
            ) pf ON food_products.id = pf.product_id
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        res.json({
            success: true,
            rows,
            totalPages,
            currentPage: page,
            user_id
        });
    } catch (err) {
        console.error("DB 錯誤：", err);
        res.status(500).json({ success: false, error: "伺服器發生錯誤，請稍後再試。" });
    }
});

// router.get('/api/products/filter')
router.get('/api/products/filter', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 15, 100); // 一次查 100 筆
    const offset = (page - 1) * limit; 

    const {
      category= '',
      search = '',
      sort = '', // 可為 'price_asc' 或 'price_desc'
      minPrice = '',
      maxPrice = ''
    } = req.query;

    let whereClauses = [];
    let queryParams = [];

    if (search) {
      whereClauses.push('name LIKE ?');
      queryParams.push(`%${search}%`);
    }

    if (category) {
      whereClauses.push('category = ?'); 
      queryParams.push(category);
    }

    if (minPrice) {
      whereClauses.push('price >= ?');
      queryParams.push(Number(minPrice));
    }

    if (maxPrice) {
      whereClauses.push('price <= ?');
      queryParams.push(Number(maxPrice));
    }

    const whereSql = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total FROM food_products ${whereSql}`,
      queryParams
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // 排序邏輯調整
    let orderByClause = 'ORDER BY id DESC'; // 預設排序
    if (sort === 'price_asc') {
      orderByClause = 'ORDER BY price ASC';
    } else if (sort === 'price_desc') {
      orderByClause = 'ORDER BY price DESC';
    }

    const finalSql = `
      SELECT * FROM food_products
      ${whereSql}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;
    console.log('最終 SQL:', finalSql);

    const [rows] = await db.query(finalSql, [...queryParams, limit, offset]);

    res.json({
      success: true,
      rows,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error('商品篩選錯誤:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});



// http://localhost:3001/products/api/products/:id
// 取得單一商品資料
router.get('/api/products/:id', async (req, res) => {
    try {
        const user_id = req.my_jwt ? req.my_jwt.user_id : 0;
        const productId = parseInt(req.params.id);
        
        console.log('查詢商品:', { productId, user_id });

        // 修改 SQL 查詢，加入 user_id 和收藏狀態
        const [productRows] = await db.query(
            `SELECT 
                food_products.*, 
                CASE 
                    WHEN pf.id IS NOT NULL THEN TRUE 
                    ELSE FALSE 
                END AS isFavorited,
                ? AS user_id  -- 加入 user_id
            FROM food_products 
            LEFT JOIN (
                SELECT id, product_id 
                FROM product_favorites 
                WHERE user_id = ?
            ) pf ON food_products.id = pf.product_id
            WHERE food_products.id = ?`,
            [user_id, user_id, productId]
        );
        
        console.log('查詢結果:', productRows);

        if (!productRows.length) {
            return res.status(404).json({ 
                success: false, 
                message: "找不到商品",
                debug: { queriedId: productId }
            });
        }

        // 轉換回應資料
        const product = {
            ...productRows[0],
            isFavorited: Boolean(productRows[0].isFavorited),
            user_id: productRows[0].user_id
        };
        
        res.json({ 
            success: true, 
            data: product
        });

    } catch (error) {
        console.error('查詢商品錯誤:', error);
        res.status(500).json({ 
            success: false, 
            message: "查詢失敗",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


// 取得商品相關推薦 (隨機取得)
router.get('/api/products/:id/recommendations', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const limit = parseInt(req.query.limit) || 3; // 預設取得4筆
        
        // 先取得目前商品的分類
        const [productRow] = await db.query(
            'SELECT category FROM food_products WHERE id = ?',
            [productId]
        );
        
        if (!productRow.length) {
            return res.status(404).json({ success: false, error: "找不到產品" });
        }
        
        const category = productRow[0].category;
        
        // 優先取得相同分類的商品 (排除當前商品)
        const [relatedProducts] = await db.query(
            'SELECT * FROM food_products WHERE category = ? AND id != ? ORDER BY RAND() LIMIT ?',
            [category, productId, limit]
        );
        
        // 如果相同分類商品不足，則補充其他隨機商品
        if (relatedProducts.length < limit) {
            const additionalCount = limit - relatedProducts.length;
            const [otherProducts] = await db.query(
                'SELECT * FROM food_products WHERE id != ? AND id NOT IN (?) ORDER BY RAND() LIMIT ?',
                [
                    productId, 
                    relatedProducts.length ? relatedProducts.map(p => p.id) : [0], 
                    additionalCount
                ]
            );
            
            relatedProducts.push(...otherProducts);
        }
        
        res.json({
            success: true,
            recommendations: relatedProducts
        });
    } catch (error) {
        console.error('取得推薦商品錯誤:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 新增 API - 取得商品評論 (預設 3 筆)
router.get('/api/products/:id/comments', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const limit = parseInt(req.query.limit) || 3; // 預設取得3筆評論
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        
        // 取得商品評論總數
        const [countResult] = await db.query(
            'SELECT COUNT(*) AS total FROM product_comments WHERE product_id = ?',
            [productId]
        );
        
        const totalComments = countResult[0].total;
        const totalPages = Math.ceil(totalComments / limit);
        
        // 取得評論列表 (包含使用者資訊)
        const [comments] = await db.query(
            `SELECT 
                pc.id, pc.user_id, pc.product_id, pc.content, pc.rating,
                pc.created_at, pc.updated_at,
                u.name AS user_name, u.avatar AS user_avatar
            FROM 
                product_comments pc
            LEFT JOIN 
                users u ON pc.user_id = u.id
            WHERE 
                pc.product_id = ?
            ORDER BY 
                pc.created_at DESC
            LIMIT ? OFFSET ?`,
            [productId, limit, offset]
        );
        
        res.json({
            success: true,
            comments,
            totalComments,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error('取得商品評論錯誤:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 新增 API - 加入購物車
router.post('/api/cart/add', async (req, res) => {
    try {
        // JWT 驗證
        if (!req.my_jwt) {
            return res.status(401).json({ 
                success: false, 
                message: "請先登入" 
            });
        }

        const user_id = req.my_jwt.user_id;
        const { product_id, quantity = 1 } = req.body;
        
        console.log('加入購物車:', {
            user_id,
            product_id,
            quantity,
        });

        // 檢查商品
        const [productResult] = await db.query(
            'SELECT id, name, price FROM food_products WHERE id = ?',
            [product_id]
        );
        
        if (!productResult.length) {
            return res.status(404).json({ 
                success: false, 
                message: "找不到商品" 
            });
        }
        
        const product = productResult[0];
        
        // 檢查購物車現有數量
        const [cartResult] = await db.query(
            'SELECT cart_id, quantity FROM carts WHERE user_id = ? AND product_id = ?',
            [user_id, product_id]
        );
        
        let result;
        
        if (cartResult.length > 0) {
            // 累加商品數量
            const currentQuantity = cartResult[0].quantity;
            const newQuantity = currentQuantity + quantity;
            
            console.log('更新購物車數量:', {
                原數量: currentQuantity,
                新增數量: quantity,
                更新後數量: newQuantity
            });
            
            [result] = await db.query(
                'UPDATE carts SET quantity = ?, updated_at = NOW() WHERE cart_id = ?',
                [newQuantity, cartResult[0].cart_id]
            );
            
            res.json({
                success: true,
                message: `${product.name} 數量已更新`,
                data: {
                    cart_id: cartResult[0].id,
                    product_name: product.name,
                    old_quantity: currentQuantity,
                    added_quantity: quantity,
                    new_quantity: newQuantity
                }
            });
            
        } else {
            // 新增購物車項目
            [result] = await db.query(
                `INSERT INTO carts (user_id, product_id, quantity, updated_at)
                VALUES (?, ?, ?, NOW())`,
                [user_id, product_id, quantity]
            );
            
            res.json({
                success: true,
                message: `${product.name} 已加入購物車`,
                data: {
                    cart_id: result.insertId,
                    product_name: product.name,
                    quantity: quantity
                }
            });
        }
        
    } catch (error) {
        console.error('加入購物車錯誤:', error);
        res.status(500).json({ 
            success: false, 
            message: "加入購物車失敗，請稍後再試",
            error: error.message 
        });
    }
});

// 加入/取消收藏
router.post('/api/favorite', async (req, res) => {
  try {
    if (!req.my_jwt) {
      return res.status(401).json({ 
        success: false, 
        message: "請先登入" 
      });
    }

    const user_id = req.my_jwt.user_id;
    const { product_id } = req.body;

    // 檢查是否已收藏
    const [favoriteResult] = await db.query(
      'SELECT id FROM product_favorites WHERE user_id = ? AND product_id = ?',
      [user_id, product_id]
    );

    if (favoriteResult.length > 0) {
      // 已收藏，執行取消收藏
      await db.query(
        'DELETE FROM product_favorites WHERE user_id = ? AND product_id = ?',
        [user_id, product_id]
      );

      res.json({
        success: true,
        message: "已取消收藏"
      });
    } else {
      // 未收藏，執行加入收藏
      await db.query(
        'INSERT INTO product_favorites (user_id, product_id, created_at) VALUES (?, ?, NOW())',
        [user_id, product_id]
      );

      res.json({
        success: true,
        message: "已加入收藏"
      });
    }

  } catch (error) {
    console.error('收藏操作失敗:', error);
    res.status(500).json({ 
      success: false, 
      message: "操作失敗，請稍後再試" 
    });
  }
});

// 獲取隨機商品排名 (前 10 名)
router.get('/api/ranking', async (req, res) => {
  try {
    // 使用 RAND() 函數隨機排序
    const [rows] = await db.query(
      `SELECT 
        id, 
        name,
        price,
        original_price,
        image_url,
        brand,
        category,
        description
      FROM food_products
      ORDER BY RAND()  
      LIMIT 10`
    );

    console.log('隨機查詢結果:', rows);

    if (!rows.length) {
      return res.json({
        success: true,
        message: '目前沒有商品資料',
        rows: []
      });
    }

  const productsWithImages = rows.map(product => ({
  ...product,
  image_url: product.image_url || '/images/products/default.jpg'
}));


    res.json({
      success: true,
      data: {
        total: rows.length,
        products: productsWithImages
      }
    });

  } catch (error) {
    console.error('獲取隨機商品失敗:', error);
    res.status(500).json({ 
      success: false,
      message: '獲取商品資料失敗',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


export default router;