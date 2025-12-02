import express from "express";
import db from "../utils/connect-mysql.js"; // 連接資料庫
import fs from "node:fs/promises";
import { z } from "zod";
import moment from "moment-timezone";
import upload from "../utils/upload-imgs.js";

const router = express.Router();

// 處理 POST /contact 請求
router.post('/api', async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
  
      // 簡單的驗證
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: '所有欄位都是必填的！' });
      }
  
       // 將資料儲存到資料庫
       const sql = "INSERT INTO contactus (name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?)";
       const [result] = await db.query(sql, [name, email, subject, message, moment().format('YYYY-MM-DD HH:mm:ss')]);

      // 在這裡可以將資料儲存到資料庫，或進行其他處理
      console.log('收到的表單資料：', result);
  
      // 回應成功訊息
      res.status(200).json({ message: '感謝您的留言，我們會盡快回覆！' });
    } catch (error) {
      console.error('處理表單時發生錯誤：', error);
      res.status(500).json({ error: '伺服器錯誤，請稍後再試！' });
    }
  });
  
  export default router;  