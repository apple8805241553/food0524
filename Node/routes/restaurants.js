import express from "express";
import db from "../utils/connect-mysql.js"; // 連接資料庫
import fs from "node:fs/promises";
import { z } from "zod";
import moment from "moment-timezone";
import upload from "../utils/upload-imgs.js";

const router = express.Router();

// 取得所有食譜（可擴充分頁）
// router.get('/api', async (req, res) => {
//     try {
//       const [rows] = await db.query('SELECT * FROM recipes ORDER BY created_at DESC');
//       res.json({ success: true, rows });
//     } catch (err) {
//       console.error('取得食譜列表失敗:', err); // ✅ 印出錯誤訊息
//       res.status(500).json({ success: false, error: err.message });
//     }
//   });

// 取得所有餐廳（但會依照分頁來分別顯示不同的資料)
router.get('/api', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1
    //   這邊的5 就是指一頁幾筆
      const limit = parseInt(req.query.limit) || 5
      const offset = (page - 1) * limit
  
      // 取得總筆數
      const [countResult] = await db.query('SELECT COUNT(*) AS total FROM restaurants')
      const totalItems = countResult[0].total
      const totalPages = Math.ceil(totalItems / limit)
  
      // 取得分頁資料
      const [rows] = await db.query(
        'SELECT * FROM restaurants ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      )
  
      res.json({
        success: true,
        rows,
        totalPages,
        currentPage: page,
      })
    } catch (err) {
      console.error('取得食譜列表失敗:', err)
      res.status(500).json({ success: false, error: err.message })
    }
  })
  

  

// 取得單一食譜
// router.get('/api/:id',async(req,res)=>{
//     try{
//         const [rows] = await db.query('SELECT * FROM recipes WHERE id=?', [req.params.id]);
//         if(!rows.length){
//             return res.status(404).json({ success: false, error:"找不到食譜" });
//         }
//         res.json({ success: true, data:rows[0] });
//     }catch(error){
//         res.status(500).json({ success: false, error:error.message });
//     }
// });

router.get('/api/:id', async (req, res) => {
    try {
      const restaurantId = req.params.id;
  
      // 查餐廳資料
      const [restaurantRows] = await db.query('SELECT * FROM restaurants WHERE id = ?', [restaurantId]);
      if (!restaurantRows.length) {
        return res.status(404).json({ success: false, error: "找不到餐廳" });
      }
  
      const restaurant = restaurantRows[0];
  
      // 查這個餐廳對應的所有菜色
      const [disheRows] = await db.query(
        'SELECT id AS dishes_id, title, description, image_url FROM dishes WHERE restaurant_id = ? ORDER BY dishes_id ASC',
        [restaurantId]
      );
  
      // 加進 restaurant 裡面
      restaurant.dishes = disheRows;

      // 查這個餐廳對應的關聯餐廳推薦
      const [recommendRows] = await db.query(
        
        'SELECT rr.source_restaurant_id, rr.related_restaurant_id, r.name AS related_restaurant_name, rr.location, rr.image FROM related_restaurants rr JOIN restaurants r ON rr.related_restaurant_id = r.id WHERE rr.source_restaurant_id = ? ORDER BY rr.id ASC',
        
        [restaurantId]
      )
  
      // 加進 restaurant 裡面
      restaurant.related_restaurants = recommendRows;
  
      res.json({ success: true, data: restaurant });
  
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });


// 新增食譜
router.post('/api',async(req,res)=>{
    const { title, description, cook_time, servings, user_id } = req.body;

    try{
        const [result] = await db.query('INSERT INTO recipes SET ?', [title, description, cook_time, servings, user_id]);
        res.json({ success: true, insertedId: result.insertId });
    }catch(error){
        res.status(500).json({ success: false, error:error.message });
    }
});

// 更新食譜
router.put('/api/:id',async(req,res)=>{
    const { title, description, cook_time, servings, user_id } = req.body;

    try{
        const [result] = await db.query('UPDATE recipes SET title=?, description=?, cook_time=?, servings=?, user_id=?, updated_at=NOW() WHERE id=?', [{ title, description, cook_time, servings, user_id }, req.params.id]);
        res.json({ success: !!result.affectedRows });
    }catch(error){
        res.status(500).json({ success: false, error:error.message });
    }
});

//刪除食譜
router.delete('/api/:id',async(req,res)=>{
    try{
        const [result] = await db.query('DELETE FROM recipes WHERE id=?', [req.params.id]);
        res.json({ success: !!result.affectedRows });
    }catch(error){
        res.status(500).json({ success: false, error:error.message });
    }
});

export default router;