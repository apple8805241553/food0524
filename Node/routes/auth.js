// route/auth.js
import express from "express";
import db from "../utils/connect-mysql.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { z } from "zod"; // 用於更嚴謹的輸入驗證
import admin from "../utils/firebase-admin-init.js"; // 引入初始化的 admin，處理 Firebase 身份驗證 (第三方登入)

const router = express.Router();

// Zod Schema
const emailSchema = z.string().email({ message: "無效的電子郵件格式" });
const passwordSchema = z
  .string()
  .min(8, { message: "密碼長度至少需要 8 個字元" })
  .max(20, { message: "密碼不可超過 20 個字元" })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
    message: "密碼需包含大小寫英文字母及數字",
  });

// --- 設定 Nodemailer ---
// 您需要根據您的郵件服務提供商進行設定
// 這是一個 Gmail 的範例，但正式環境強烈建議使用專門的郵件服務 (如 SendGrid, Mailgun, AWS SES)
// 注意：如果使用 Gmail，可能需要啟用「低安全性應用程式存取權」或使用「應用程式密碼」
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER, // 您的 Gmail 完整信箱地址 (例如：your.email@gmail.com)
    pass: process.env.EMAIL_PASS, // 您的 Gmail 密碼或「應用程式密碼」
  },
  tls: {
    rejectUnauthorized: false,
  },
});
// --- Nodemailer 設定結束 ---

// API 端點：忘記密碼 - 請求重設密碼郵件
router.post("/forgot-password", async (req, res) => {
  const output = {
    success: false,
    message: "",
    error: null,
  };

  const { email } = req.body;

  // 1. 驗證 Email 格式 (可選，前端通常已做)
  const emailValidation = emailSchema.safeParse(email);
  if (!emailValidation.success) {
    output.message = emailValidation.error.errors[0]?.message || "電子郵件格式錯誤";
    return res.status(400).json(output);
  }

  try {
    // 2. 檢查 Email 是否存在於資料庫
    const [users] = await db.query("SELECT user_id, email, username FROM users WHERE email = ?", [
      email,
    ]);
    if (!users.length) {
      // 即使 Email 不存在，也回傳一個模糊的成功訊息，避免洩漏用戶資訊
      output.success = true; // 模擬成功
      output.message = "如果此電子郵件已註冊，您將會收到一封密碼重設郵件。";
      return res.status(200).json(output);
    }
    const user = users[0];

    // 3. 產生有時效性的重設密碼 Token
    //    這個 Token 應該包含 user_id，並設定一個較短的過期時間 (例如 15 分鐘)
    //    密鑰應使用一個專用於密碼重設的 JWT_RESET_SECRET，而不是主要的 JWT_KEY
    const resetTokenPayload = {
      user_id: user.user_id,
      email: user.email, // 可以加入 email 以便校驗
      type: "password-reset", // 標記此 token 的用途
    };
    const resetToken = jwt.sign(
      resetTokenPayload,
      process.env.JWT_RESET_SECRET || process.env.JWT_KEY,
      {
        // 建議使用不同的密鑰
        expiresIn: "15m", // Token 有效期 15 分鐘
      }
    );

    // 4. 儲存 Token (或其 hash) 與 user_id 及過期時間到資料庫
    //    這裡簡化處理，不另存資料庫，依賴 JWT 本身的過期機制。
    //    如果需要更嚴格的控制（例如，一個 Token 只能用一次），則需要資料庫記錄。

    // 5. 建立重設密碼連結 (前端重設密碼頁面路徑)
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // 6. 設定郵件內容並發送
    const mailOptions = {
      from: `"今仔日食飽沒" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "今仔日食飽沒 - 密碼重設請求",
      html: `
        <p>親愛的 ${user.username} 您好，</p>
        <p>您收到此郵件是因為您請求重設您在今仔日食飽沒的帳戶密碼。</p>
        <p>請點擊以下連結來重設您的密碼：</p>
        <p><a href="${resetLink}" style="color: #007bff; text-decoration: underline;">${resetLink}</a></p>
        <p>此連結將在 <strong>15 分鐘</strong> 後過期。</p>
        <p>如果您沒有請求重設密碼，請忽略此郵件，您的密碼將不會變更。</p>
        <p>祝您有個美好的一天！</p>
        <p>今仔日食飽沒團隊 敬上</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    output.success = true;
    output.message = "密碼重設郵件已發送，請檢查您的信箱。";
    res.status(200).json(output);
  } catch (error) {
    console.error("忘記密碼 API 錯誤:", error);
    output.message = "發送密碼重設郵件時發生錯誤，請稍後再試。";
    output.error = process.env.NODE_ENV === "development" ? error.message : "伺服器內部錯誤";
    res.status(500).json(output);
  }
});

// API 端點：重設密碼 - 使用 Token 更新密碼
router.post("/reset-password", async (req, res) => {
  const output = {
    success: false,
    message: "",
    error: null,
  };

  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    output.message = "缺少 Token 或新密碼";
    return res.status(400).json(output);
  }

  try {
    // 1. 驗證 Token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_RESET_SECRET || process.env.JWT_KEY); // 使用與簽發時相同的密鑰
      // 確保 token type 正確 (如果簽發時有加)
      if (decodedToken.type !== "password-reset") {
        throw new Error("Invalid token type");
      }
    } catch (jwtError) {
      output.message = "無效或已過期的密碼重設連結";
      if (jwtError.name === "TokenExpiredError") {
        output.message = "密碼重設連結已過期，請重新申請。";
      }
      return res.status(401).json(output);
    }

    const { user_id } = decodedToken;

    // 2. 驗證新密碼格式
    const passwordValidation = passwordSchema.safeParse(newPassword);
    if (!passwordValidation.success) {
      output.message = passwordValidation.error.errors[0]?.message || "新密碼格式不符合要求";
      return res.status(400).json(output);
    }

    // 3. 檢查用戶是否存在 (雖然 token 裡有 user_id，多一層保險)
    const [users] = await db.query("SELECT user_id FROM users WHERE user_id = ?", [user_id]);
    if (!users.length) {
      output.message = "用戶不存在"; // 理論上不應發生，因為 token 來自現有用戶
      return res.status(404).json(output);
    }

    // 4. 將新密碼加密
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 5. 更新資料庫中的密碼
    const [updateResult] = await db.query(
      "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?",
      [newPasswordHash, user_id]
    );

    if (updateResult.affectedRows === 1) {
      output.success = true;
      output.message = "密碼已成功重設，您現在可以使用新密碼登入。";
      res.status(200).json(output);
      // 可選：讓所有舊的 session/token 失效 (較複雜，可能需要額外機制)
    } else {
      output.message = "密碼重設失敗，請稍後再試";
      res.status(500).json(output);
    }
  } catch (error) {
    console.error("重設密碼 API 錯誤:", error);
    output.message = "重設密碼時發生錯誤，請稍後再試。";
    output.error = process.env.NODE_ENV === "development" ? error.message : "伺服器內部錯誤";
    res.status(500).json(output);
  }
});

// API 端點：處理 Firebase Google 登入 (接收 Firebase ID Token)
router.post("/firebase-google-login", async (req, res) => {
  const output = {
    success: false,
    message: "",
    data: {
      token: "",
      user_id: 0,
      email: "",
      username: "",
      full_name: "",
      profile_picture_url: "",
    },
    error: null,
  };

  // 從 Authorization header 或 body 獲取 Firebase ID Token
  let firebaseIdToken;
  const authHeader = req.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    firebaseIdToken = authHeader.slice(7);
  } else if (req.body.token) {
    // 作為備用，如果前端放在 body
    firebaseIdToken = req.body.token;
  }

  if (!firebaseIdToken) {
    output.message = "未提供 Firebase Token";
    return res.status(400).json(output);
  }

  try {
    // 1. 驗證 Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
    // decodedToken 包含 uid, email, name, picture 等
    const firebaseUID = decodedToken.uid;
    const email = decodedToken.email;
    const name = decodedToken.name;
    const picture = decodedToken.picture;

    if (!email) {
      output.message = "無法從 Firebase Token 獲取電子郵件";
      return res.status(400).json(output);
    }

    // 2. 檢查用戶是否已在您的資料庫中
    //    users 表中新增一個欄位來儲存 firebase_uid (已新增)
    //    ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(255) UNIQUE;

    let [users] = await db.query("SELECT * FROM users WHERE firebase_uid = ?", [firebaseUID]);
    let existingUser = users.length > 0 ? users[0] : null;
    let userIdToUse;

    if (existingUser) {
      // 用戶已透過 Firebase Google 登入過
      userIdToUse = existingUser.user_id;
      // 可選：更新用戶名稱或頭像
      if (
        (name && existingUser.full_name !== name) ||
        (picture && existingUser.profile_picture_url !== picture)
      ) {
        await db.query(
          "UPDATE users SET full_name = ?, profile_picture_url = ?, updated_at = NOW() WHERE user_id = ?",
          [name || existingUser.full_name, picture || existingUser.profile_picture_url, userIdToUse]
        );
        existingUser.full_name = name || existingUser.full_name;
        existingUser.profile_picture_url = picture || existingUser.profile_picture_url;
      }
    } else {
      // 檢查 Email 是否已存在 (可能是用 Email/密碼註冊過，或之前用其他方式的 Google 登入)
      [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      if (users.length > 0) {
        existingUser = users[0];
        userIdToUse = existingUser.user_id;
        // 將 Firebase UID 連結到現有帳戶，並更新可能缺失的資料
        await db.query(
          "UPDATE users SET firebase_uid = ?, full_name = IFNULL(full_name, ?), updated_at = NOW() WHERE user_id = ?",
          [firebaseUID, name, userIdToUse]
        );
        existingUser.firebase_uid = firebaseUID; // 手動更新記憶體中的對象
        existingUser.full_name = existingUser.full_name || name;
      } else {
        // 全新用戶，建立新帳戶
        const usernameFromEmail =
          email.split("@")[0].slice(0, 10) + Math.random().toString(36).substring(2, 7);

        const userProfilePicture = null; // 預設頭像欄位為空值

        const [insertResult] = await db.query(
          "INSERT INTO users (email, username, full_name, profile_picture_url, firebase_uid, registration_date, account_status, password_hash) VALUES (?, ?, ?, ?, ?, NOW(), 'active', NULL)",
          [email, usernameFromEmail, name, userProfilePicture, firebaseUID]
        );
        userIdToUse = insertResult.insertId;
        existingUser = {
          user_id: userIdToUse,
          email,
          username: usernameFromEmail,
          full_name: name,
          profile_picture_url: userProfilePicture, // 使用相同的預設值
        };
      }
    }

    // 3. 產生您應用程式的 JWT (與傳統登入相同邏輯)
    const appTokenPayload = {
      user_id: userIdToUse,
      email: existingUser.email, // 確保使用資料庫中的 email
    };
    const appToken = jwt.sign(appTokenPayload, process.env.JWT_KEY, { expiresIn: "1h" });

    output.success = true;
    output.message = "Firebase Google 登入成功";
    output.data = {
      // 與 /jwt-login 回傳結構一致
      token: appToken,
      user_id: userIdToUse,
      email: existingUser.email,
      username: existingUser.username,
      full_name: existingUser.full_name,
      profile_picture_url: existingUser.profile_picture_url,
    };
    res.status(200).json(output);
  } catch (error) {
    console.error("Firebase Google 登入 API 錯誤:", error);
    if (error.code === "auth/id-token-expired" || error.code === "auth/argument-error") {
      output.message = "Firebase Token 無效或已過期";
      return res.status(401).json(output);
    }
    output.message = "處理 Firebase Google 登入時發生內部錯誤";
    output.error = process.env.NODE_ENV === "development" ? error.message : "伺服器錯誤";
    res.status(500).json(output);
  }
});

export default router;
