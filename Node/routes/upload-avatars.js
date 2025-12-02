// 用於上傳使用者頭像的 API
// POST /users/api/upload-avatar/:userId (會在 index.js 掛載 /users)

import express from "express";
import multer from "multer";
import db from "../utils/connect-mysql.js";
import path from "path"; // Node.js 內建的路徑處理模組
import fs from "fs/promises"; // Node.js 內建的檔案系統模組 (Promise 版本)
import { v4 as uuidv4 } from "uuid"; // 用來產生獨一無二的檔案名稱
import jwt from "jsonwebtoken"; // JWT 驗證
import { fileURLToPath } from "url";

const router = express.Router();

// --- ESM __dirname 處理 ---
const __filename = fileURLToPath(import.meta.url); // 在 ESM 中取得 __dirname
const __dirname = path.dirname(__filename);
// --- ESM __dirname 處理結束 ---

// --- Multer 設定 ---
// storage: 設定檔案儲存的位置 (destination) 和檔案名稱 (filename)
// destination: 圖片儲存在 public/uploads/avatars 資料夾
// __dirname 是目前檔案所在的目錄，透過 path.join 來組合路徑
// fs.mkdir 會確保這個資料夾存在，若不存在則會自動建立
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 組合出 public/uploads/avatars 的絕對路徑
    const uploadPath = path.join(__dirname, "..", "public", "uploads", "avatars");
    fs.mkdir(uploadPath, { recursive: true })
      .then(() => {
        cb(null, uploadPath);
      })
      .catch((err) => {
        console.error("Multer 儲存路徑錯誤:", err);
        cb(err);
      });
  },

  // filename: 為了避免檔名衝突，使用 uuidv4() 來產生一個獨一無二的檔名，並保留原始副檔名
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // 取得副檔名
    const uniqueFilename = `${uuidv4()}${ext}`; // 產生獨一無二的檔案名稱
    cb(null, uniqueFilename);
  },
});

// fileFilter: 用來過濾上傳的檔案類型，只允許 image/* 檔案
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("僅限上傳圖片檔案!"), false);
  }
};

// upload: 初始化 Multer，傳入 storage 和 fileFilter 設定，並限制檔案大小
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制檔案大小為 5MB
  },
});
// --- Multer 設定結束 ---

// --- JWT 驗證 Middleware 開始 ---
const checkJwt = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "未經授權：缺少 Token" });
  }
  const token = authHeader.slice(7);
  try {
    req.my_jwt = jwt.verify(token, process.env.JWT_KEY);
    next(); // Token 驗證成功，繼續下一個 middleware 或路由處理
  } catch (error) {
    return res.status(401).json({ success: false, message: "未經授權：無效的 Token" });
  }
};
// --- JWT 驗證 Middleware 結束 ---

// --- 上傳頭像的 API ---
// upload.single('avatar'): 是 Multer 的 middleware，它會處理單一檔案上傳，上傳成功後檔案資訊會存在 req.file 中
router.post("/api/upload-avatar/:userId", checkJwt, upload.single("avatar"), async (req, res) => {
  const output = {
    success: false,
    message: "",
    filePath: "",
    error: null,
  };

  const userIdFromParams = parseInt(req.params.userId, 10); // 從 URL 參數取得 userId
  const userIdFromToken = req.my_jwt?.user_id; // 從 JWT 取得 user_id

  // 驗證 Token 中的 ID 和 URL 中的 ID 是否一致
  if (userIdFromToken !== userIdFromParams) {
    output.message = "權限不足，無法更新此用戶的頭貼";
    output.error = "FORBIDDEN";
    if (req.file) {
      // 如果有檔案已上傳，要刪除
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        console.error("刪除檔案失敗", e);
      }
    }
    return res.status(403).json(output);
  }

  // 檢查是否有檔案被上傳
  if (!req.file) {
    output.message = "沒有選擇檔案";
    output.error = "NO_FILE_UPLOADED";
    return res.status(400).json(output);
  }

  // newAvatarPath: 這是儲存在資料庫中的圖片路徑，相對於 public 資料夾的路徑
  const newAvatarPath = `/uploads/avatars/${req.file.filename}`;

  // 檢查 userId 是否有效
  // if (isNaN(userId) || userId <= 0) {
  //   output.message = "無效的使用者 ID";
  //   output.error = "INVALID_USER_ID";
  //   // 同時刪除已上傳的檔案，避免留下孤兒檔案
  //   try {
  //     await fs.unlink(req.file.path);
  //     console.log(`已刪除因無效使用者 ID 而上傳的檔案: ${req.file.filename}`);
  //   } catch (unlinkError) {
  //     console.error(`刪除檔案失敗: ${req.file.filename}`, unlinkError);
  //   }
  //   return res.status(400).json(output);
  // }

  try {
    // 1. 查詢目前頭貼路徑
    // 更新前，先從資料庫查出使用者目前的 profile_picture_url
    const [userRows] = await db.query("SELECT profile_picture_url FROM users WHERE user_id = ?", [
      userIdFromParams,
    ]);

    // 如果查詢結果為空，表示找不到該使用者
    if (userRows.length === 0) {
      output.message = "找不到該使用者";
      output.error = "USER_NOT_FOUND";
      // 刪除已上傳的檔案
      await fs.unlink(req.file.path);
      return res.status(404).json(output);
    }

    const oldAvatarPath = userRows[0].profile_picture_url;

    // 2. 更新資料庫中的 profile_picture_url
    // 將新的 newAvatarPath 更新到 profile_picture_url 欄位
    const [updateResult] = await db.query(
      "UPDATE users SET profile_picture_url = ?, updated_at = NOW() WHERE user_id = ?",
      [newAvatarPath, userIdFromParams]
    );

    if (updateResult.affectedRows === 1) {
      output.success = true;
      output.message = "頭貼更新成功！";
      output.filePath = newAvatarPath;

      // 3. 刪除舊頭貼 (如果存在且不是預設圖)
      // 確認 oldAvatarPath 存在且與新路徑不同，避免誤刪剛上傳的圖片或預設圖片
      // 使用 fs.access 檢查舊檔案是否存在，然後用 fs.unlink 刪除它
      if (
        oldAvatarPath &&
        oldAvatarPath !== newAvatarPath &&
        oldAvatarPath.startsWith("/uploads/avatars/")
      ) {
        const fullOldPath = path.join(__dirname, "..", "public", oldAvatarPath);
        try {
          await fs.access(fullOldPath);
          await fs.unlink(fullOldPath);
          console.log(`已成功刪除舊頭貼: ${oldAvatarPath}`);
        } catch (err) {
          console.warn(`刪除舊頭貼失敗 (${oldAvatarPath}):`, err.message);
        }
      }
      res.status(200).json(output);
    } else {
      output.message = "頭貼更新失敗，資料庫操作未成功";
      output.error = "DATABASE_UPDATE_FAILED";
      await fs.unlink(req.file.path);
      res.status(500).json(output);
    }
  } catch (error) {
    console.error("上傳頭貼 API 錯誤", error);
    output.message = "伺服器錯誤，請稍後再試";
    output.error = error.message;
    // 如果在資料庫操作過程中出錯，也要嘗試刪除已上傳的檔案
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkErr) {
        console.error("刪除上傳失敗的檔案時出錯", unlinkErr);
      }
    }
    res.status(500).json(output);
  }
});

export default router;
