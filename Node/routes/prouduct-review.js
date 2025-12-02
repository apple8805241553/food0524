import express from "express";
import db from "../utils/connect-mysql.js"; // 連接資料庫
import fs from "node:fs/promises";
import { z } from "zod";
import moment from "moment-timezone";
import upload from "../utils/upload-imgs.js";
//這檔案用不到
const router = express.Router();
// 取得所有商品評論（但會依照分頁來分別顯示不同的資料)
router.get('/api', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1
    //   這邊的15 就是指一頁幾筆 (不過這是在後端生頁面時才有差。前端的一頁幾筆是由前端那邊為主)
    const limit = parseInt(req.query.limit) || 5
      const offset = (page - 1) * limit
  
      // 取得總筆數
      const [countResult] = await db.query('SELECT COUNT(*) AS total FROM product_reviews')
      const totalItems = countResult[0].total
      const totalPages = Math.ceil(totalItems / limit)
  
      // 取得分頁資料
      // 這邊特別的地方是，這是商品 + 商品評價 + 會員資料 JOIN起來的SQL語法
      // 接著在前端要call欄位的話，假如兩邊有不重複的欄位，就可以直接call那個欄位名稱
      // 但如果三個資料表有欄位同名的時候，需要去as出一個欄位名稱
      const [rows] = await db.query(
        'SELECT product_reviews.*,food_products.name , users.username FROM product_reviews JOIN food_products ON product_reviews.product_id = food_products.id JOIN users ON product_reviews.user_id = users.user_id ORDER BY review_id DESC LIMIT ? OFFSET ?',
        [limit, offset]
      )
  
      res.json({
        success: true,
        rows,
        totalPages,
        currentPage: page,
      })
    } catch (err) {
      console.error('取得商品評價失敗:', err)
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 取得特定產品的評論
  router.get('/api/:id', async (req, res) => {
    try {
      const productId = req.params.id; // 使用 product_id 作為查詢條件
  
      // 查產品評論
      const [productReviewRows] = await db.query(
        `SELECT 
           product_reviews.*, 
           food_products.name AS product_name, 
           users.username 
         FROM 
           product_reviews 
         JOIN 
           food_products 
         ON 
           product_reviews.product_id = food_products.id 
         JOIN 
           users 
         ON 
           product_reviews.user_id = users.user_id 
         WHERE 
           product_reviews.product_id = ? 
         ORDER BY 
           review_id DESC`,
        [productId]
      );
  
      if (!productReviewRows.length) {
        return res.status(404).json({ success: false, error: "找不到產品評論" });
      }
  
      res.json({ success: true, data: productReviewRows });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

export default router