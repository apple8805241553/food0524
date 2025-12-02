// 會員註冊 API
// http://localhost:3001/api/register

import express from "express";
import db from "../utils/connect-mysql.js";
import bcrypt from "bcrypt";
import { z } from "zod";

const router = express.Router();

// 更新 Zod Schema 以符合前端驗證規則
const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, { message: "使用者名稱至少需要1個字元" })
      .max(10, { message: "使用者名稱不可超過10個字" }),
    email: z.string().email({ message: "無效的 Email 格式" }),
    password: z
      .string()
      .min(8, { message: "密碼至少需要 8 個字元" })
      .max(20, { message: "密碼不可超過 20 個字元" }) // 與前端 placeholder 一致
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
        message: "密碼需包含大小寫英文字母及數字",
      }),
    confirmPassword: z.string(), // refine 會處理與 password 的比對
    full_name: z
      .string()
      .min(1, { message: "請輸入姓名" })
      .max(50, { message: "姓名不可超過50個字" }), // 與前端驗證一致
    phone_number: z
      .string()
      .min(1, { message: "請輸入手機號碼" }) // 必填
      .regex(/^09\d{8}$/, { message: "無效的手機號碼格式，開頭必須為09，總共10碼數字" }),
    birthday: z
      .string() // 前端傳來的是 YYYY-MM-DD 格式的字串
      .min(1, { message: "請選擇生日" }) // 必填
      .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "生日格式不正確 (YYYY-MM-DD)" })
      .refine(
        (val) => {
          // 年齡驗證
          const birthDate = new Date(val);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          return age >= 18;
        },
        { message: "需年滿18歲才能註冊" }
      ),
    // gender 允許 'male', 'female', 'other', 或空字串 '' (NULL，不提供)
    // .optional() 讓它在前端完全沒有傳送 gender 欄位時也能通過 (HTML select 通常會送空字串)
    gender: z.enum(["male", "female", "other", ""]).optional(),
    address: z.string().optional().or(z.literal("")), // 地址為選填，允許空字串
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "密碼與確認密碼不相符",
    path: ["confirmPassword"], // 指向錯誤的欄位
  });

router.post("/api", async (req, res) => {
  const validationResult = registerSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: "輸入資料驗證失敗",
      errors: validationResult.error.flatten().fieldErrors,
    });
  }

  const {
    username,
    email,
    password,
    full_name,
    phone_number,
    birthday, // 這是前端傳來的值: 已格式化為 YYYY-MM-DD 格式
    gender, // 這是前端傳來的值: 'male', 'female', 'other', 或 ''
    address,
  } = validationResult.data;

  // 將前端的 gender 值映射到資料庫 ENUM 所接受的值
  let gender_for_db;
  switch (gender) {
    case "male":
      gender_for_db = "M";
      break;
    case "female":
      gender_for_db = "F";
      break;
    case "other":
      gender_for_db = "Other";
      break;
    case "": // 前端選擇 "不提供" (value="")
      gender_for_db = null;
      break;
    default: // 如果 gender 是 undefined (因為 .optional()) 或其他非預期狀況
      gender_for_db = null;
  }

  try {
    // 檢查 Email 是否已經存在
    const emailCheckSql = "SELECT user_id FROM users WHERE email = ?";
    const [emailRows] = await db.query(emailCheckSql, [email]);
    if (emailRows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "此電子信箱已被使用",
        errors: { email: ["此電子信箱已被使用"] }, // 讓前端可以直接顯示在欄位
      });
    }

    // 檢查 Username 是否已經存在
    const usernameCheckSql = "SELECT user_id FROM users WHERE username = ?";
    const [usernameRows] = await db.query(usernameCheckSql, [username]);
    if (usernameRows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "此使用者名稱已經被使用",
        errors: { username: ["此使用者名稱已經被使用"] }, // 讓前端可以直接顯示在欄位
      });
    }

    // 密碼加密
    const password_hash = await bcrypt.hash(password, 10);

    // 準備要插入資料庫的資料
    const newUser = {
      username,
      email,
      password_hash,
      full_name,
      phone_number,
      birthday, // 直接儲存 YYYY-MM-DD 字串 (MySQL DATE 型別可以接受)
      gender: gender_for_db, // 使用在後端轉換後的值儲存 ('M', 'F', 'Other', 或 NULL )
      address: address || null,
      // created_at 和 updated_at 由資料庫 DEFAULT 設定
    };

    // 插入資料到資料庫
    const insertSql = "INSERT INTO users SET ?";
    const [result] = await db.query(insertSql, newUser);

    if (result.insertId) {
      res.status(201).json({ success: true, message: "會員註冊成功", userId: result.insertId });
    } else {
      res.status(500).json({ success: false, error: "註冊失敗，資料庫操作錯誤" });
    }
  } catch (error) {
    console.error("註冊 API 錯誤:", error);
    // 避免在生產環境中洩漏詳細的 SQL 錯誤
    res.status(500).json({ success: false, error: "伺服器內部錯誤，請稍後再試" });
  }
});

export default router;
