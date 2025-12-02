import express from "express";
import db from "../utils/connect-mysql.js";
import jwt from "jsonwebtoken";
import { z } from "zod";
import bcrypt from "bcrypt";
import authenticateToken from "../utils/authenticateToken.js"; // 引入 authenticateToken 自訂的中介軟體

const router = express.Router();

// Zod Schema 用於驗證密碼格式
const passwordSchema = z
  .string()
  .min(8, { message: "密碼長度至少需要 8 個字元" })
  .max(20, { message: "密碼不可超過 20 個字元" })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
    message: "密碼需包含大小寫英文字母及數字",
  });

// 修改密碼 API
router.put("/api/change-password", async (req, res) => {
  const output = {
    success: false,
    message: "",
    errors: {}, // 存放欄位驗證錯誤訊息
  };

  // 1. 驗證 JWT Token 並取得 user_id
  const authHeader = req.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    output.message = "未經授權：缺少 Token";
    return res.status(401).json(output);
  }

  const token = authHeader.slice(7);
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_KEY);
  } catch (error) {
    output.message = "未經授權：無效的 Token";
    return res.status(401).json(output);
  }

  const userId = decodedToken.user_id; // 從 token 中取得 user_id

  // 2. 從請求 body 取得參數
  const { currentPassword, newPassword } = req.body;

  // 3. 基本參數檢查
  if (!currentPassword || !newPassword) {
    output.message = "請提供目前密碼和新密碼";
    if (!currentPassword) output.errors.currentPassword = "請輸入目前密碼";
    if (!newPassword) output.errors.newPassword = "請輸入新密碼";
    return res.status(400).json(output);
  }

  try {
    // 4. 從資料庫取得使用者目前的 password_hash
    const [userRows] = await db.query("SELECT password_hash FROM users WHERE user_id = ?", [
      userId,
    ]);

    if (!userRows.length) {
      output.message = "找不到該使用者";
      return res.status(404).json(output);
    }

    const storedPasswordHash = userRows[0].password_hash;
    if (!storedPasswordHash) {
      output.message = "使用者密碼資料不完整，請聯繫管理員";
      return res.status(500).json(output);
    }

    // 5. 驗證目前密碼
    const isMatch = await bcrypt.compare(currentPassword, storedPasswordHash);
    if (!isMatch) {
      output.message = "目前密碼輸入錯誤";
      output.errors.currentPassword = "目前密碼輸入錯誤";
      return res.status(400).json(output);
    }

    // 6. 驗證新密碼格式
    const passwordValidation = passwordSchema.safeParse(newPassword);
    if (!passwordValidation.success) {
      output.message = "新密碼格式不符合要求";
      output.errors.newPassword =
        passwordValidation.error.errors[0]?.message || "密碼需包含大小寫英文字母及數字，長度8-20碼";
      return res.status(400).json(output);
    }

    // 7. 將新密碼加密
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 8. 更新資料庫中的密碼
    const [updateResult] = await db.query("UPDATE users SET password_hash = ? WHERE user_id = ?", [
      newPasswordHash,
      userId,
    ]);

    if (updateResult.affectedRows === 1) {
      output.success = true;
      output.message = "密碼已成功更新！";
      res.status(200).json(output);
    } else {
      output.message = "密碼更新失敗，請稍後再試";
      res.status(500).json(output);
    }
  } catch (error) {
    console.error("修改密碼 API 錯誤:", error);
    output.message = "伺服器內部錯誤，請稍後再試";
    res.status(500).json(output);
  }
});

// 更新會員資料 API
router.put("/api/:id", async (req, res) => {
  const output = {
    success: false,
    message: "",
    data: null,
    error: null,
  };

  const userIdFromToken = req.my_jwt?.user_id; // 從 JWT 中間件取得 user_id
  const userIdFromParams = parseInt(req.params.id, 10);

  if (!userIdFromToken) {
    output.error = "未經授權：缺少 Token 或 Token 無效";
    return res.status(401).json(output);
  }

  if (userIdFromToken !== userIdFromParams) {
    output.error = "禁止存取：您無權修改此會員資料";
    return res.status(403).json(output);
  }

  const {
    phone_number,
    full_name,
    username,
    birthday, // 格式應為 YYYY-MM-DD
    gender, // 'M', 'F', 'Other', 或 null
    address,
  } = req.body;

  // 後端資料驗證 (建議使用 Zod 或類似庫)
  // 這裡僅作簡單示例，實際應更完善
  const updateFields = {};
  if (phone_number !== undefined) {
    if (!/^09\d{8}$/.test(phone_number) && phone_number !== "") {
      output.error = "手機號碼格式不正確";
      return res.status(400).json(output);
    }
    updateFields.phone_number = phone_number;
  }
  if (full_name !== undefined) {
    if (full_name.length > 50) {
      output.error = "姓名不可超過50個字";
      return res.status(400).json(output);
    }
    updateFields.full_name = full_name;
  }
  if (username !== undefined) {
    if (username.length === 0 || username.length > 10) {
      output.error = "使用者名稱長度必須在1到10個字之間";
      return res.status(400).json(output);
    }
    // 檢查 Username 是否已經存在 (且不是當前使用者自己)
    const [existingUsername] = await db.query(
      "SELECT user_id FROM users WHERE username = ? AND user_id != ?",
      [username, userIdFromParams]
    );
    if (existingUsername.length > 0) {
      output.error = "此使用者名稱已被其他帳號使用";
      return res.status(409).json(output); // 409 Conflict
    }
    updateFields.username = username;
  }
  if (birthday !== undefined) {
    // 生日驗證 (需年滿18歲)
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18 && birthday !== "") {
      // 如果生日不是空字串才驗證年齡
      output.error = "需年滿18歲";
      return res.status(400).json(output);
    }
    updateFields.birthday = birthday || null; // 如果是空字串，存為 NULL
  }
  if (gender !== undefined) {
    const validGenders = ["M", "F", "Other", ""];
    if (!validGenders.includes(gender)) {
      output.error = "性別格式不正確";
      return res.status(400).json(output);
    }
    updateFields.gender = gender === "" ? null : gender;
  }
  if (address !== undefined) {
    updateFields.address = address;
  }

  if (Object.keys(updateFields).length === 0) {
    output.message = "沒有提供任何可更新的資料";
    output.success = true; // 雖然沒更新，但請求本身是成功的
    return res.status(200).json(output);
  }

  updateFields.updated_at = new Date(); // 更新時間

  try {
    const sql = "UPDATE users SET ? WHERE user_id = ?";
    const [result] = await db.query(sql, [updateFields, userIdFromParams]);

    if (result.affectedRows === 1) {
      output.success = true;
      output.message = result.changedRows === 0 ? "會員資料未變更" : "會員資料更新成功";
      const [updatedUser] = await db.query(
        `SELECT 
           user_id, 
           email, 
           phone_number, 
           full_name, 
           DATE_FORMAT(birthday, '%Y-%m-%d') AS birthday, 
           gender, 
           address, 
           username,
           profile_picture_url
         FROM users 
         WHERE user_id=?`,
        [userIdFromParams]
      );
      output.data = updatedUser[0];
      res.status(200).json(output);
    } else {
      output.error = "更新失敗，找不到該會員";
      res.status(404).json(output);
    }
  } catch (err) {
    console.error("更新會員資料 API 錯誤:", err);
    output.error = "伺服器內部錯誤，請稍後再試";
    res.status(500).json(output);
  }
});

// 取得所有會員資料（但會依照分頁來分別顯示不同的資料)
router.get("/api", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    //   這邊的15 就是指一頁幾筆 (不過這是在後端生頁面時才有差。前端的一頁幾筆是由前端那邊為主)
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    // 取得總筆數
    const [countResult] = await db.query("SELECT COUNT(*) AS total FROM users");
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // 取得分頁資料
    const [rows] = await db.query("SELECT * FROM users ORDER BY user_id ASC LIMIT ? OFFSET ?", [
      limit,
      offset,
    ]);

    res.json({
      success: true,
      rows,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 取得單一會員資料 API
router.get("/api/:id", authenticateToken, async (req, res) => {
  // --- JWT 驗證已由 authenticateToken 中介軟體處理 ---
  // 現在可以直接從 req.user 獲取 JWT payload 中的資訊

  // 檢查請求的 user_id 是否與 token 中的 user_id 相符
  // req.user.user_id 是從 JWT payload 中解出來的 (由 authenticateToken 中介軟體設定)
  // req.params.id 由 URL 路徑中取得，+req.params.id 將字串轉為數字
  if (req.user.user_id !== +req.params.id) {
    return res.status(403).json({ success: false, error: "禁止存取：您無權存取此會員資料" });
  }
  // --- 權限檢查結束 ---

  try {
    const userIdFromParams = req.params.id; // 雖然 token 裡有，但此 API 設計是從 URL 取 id
    const sql = `
      SELECT 
        user_id, 
        email, 
        phone_number, 
        full_name, 
        DATE_FORMAT(birthday, '%Y-%m-%d') AS birthday, 
        gender, 
        address, 
        username,
        profile_picture_url
      FROM users 
      WHERE user_id=?
    `;
    const [rows] = await db.query(sql, [userIdFromParams]);

    if (!rows.length) {
      return res.status(404).json({ success: false, error: "找不到會員資料" });
    }

    const userProfile = rows[0];
    res.json({ success: true, rows: userProfile });
  } catch (error) {
    console.error("取得會員資料 API 錯誤:", error);
    res.status(500).json({ success: false, error: "伺服器錯誤" });
  }
});

// 取得單一會員的訂單 (這是第一種方式，主要差別為這裡的SQL語法是用JOIN來連接資料表)
// router.get('/api/order/:id', async (req, res) => {
//     try {
//       const productId = req.params.id; // 使用 product_id 作為查詢條件

//       // 查產品評論
//       const [productReviewRows] = await db.query(
//         `SELECT
//     u.user_id,
//     u.username,
//     u.full_name,
//     o.order_id,
//     o.total_price,
//     o.order_status,
//     o.order_date,
//     o.payment_status,
//     o.shipping_status,
//     oi.order_item_id,
//     oi.product_id,
//     oi.quantity,
//     oi.unit_price,
//     oi.subtotal
// FROM
//     users u
// JOIN
//     orders o ON u.user_id = o.user_id
// JOIN
//     order_items oi ON o.order_id = oi.order_id
// WHERE
//     u.user_id = ?  -- 替換問號為您想查詢的用戶ID
// ORDER BY
//     o.order_date DESC, o.order_id, oi.order_item_id`,
//         [productId]
//       );

//       if (!productReviewRows.length) {
//         return res.status(404).json({ success: false, error: "找不到產品評論" });
//       }

//       res.json({ success: true, data: productReviewRows });
//     } catch (error) {
//       res.status(500).json({ success: false, error: error.message });
//     }
//   });

// 取得單一會員的訂單 (這是第二種方式，主要差別為這裡的SQL語法是用多個查詢，並且將資料一層一層的裝起來來獲取資料)
// 兩種方式傳出來的JSON資料結構會長的不太一樣 (不過該有的資料一樣都有 ，所以要使用哪一種看個人)
router.get("/api/order/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;

    // 查用戶基本資料
    const [userRows] = await db.query(
      "SELECT user_id, username, full_name FROM users WHERE user_id = ?",
      [userId]
    );
    if (!userRows.length) {
      return res.status(404).json({ success: false, error: "找不到用戶" });
    }

    const user = userRows[0];

    // 查用戶的所有訂單
    const [orderRows] = await db.query(
      `SELECT 
           order_id, 
           total_price, 
           order_status, 
           order_date, 
           payment_status, 
           shipping_status,
           shipping_address 
         FROM 
           orders 
         WHERE 
           user_id = ? 
         ORDER BY 
           order_date DESC`,
      [userId]
    );

    // 將每個訂單的訂單項目查出來，並加進對應的訂單中
    for (const order of orderRows) {
      const [orderItemRows] = await db.query(
        `SELECT 
             order_item_id, 
             product_id, 
             quantity, 
             unit_price, 
             subtotal 
           FROM 
             order_items 
           WHERE 
             order_id = ? 
           ORDER BY 
             order_item_id ASC`,
        [order.order_id]
      );

      // 加進訂單裡面
      order.items = orderItemRows;
    }

    // 確保回應格式正確
    res.setHeader("Content-Type", "application/json");
    res.json({
      success: true,
      data: {
        user_id: userId,
        orders: orderRows,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 新增食譜
router.post("/api", async (req, res) => {
  const { title, description, cook_time, servings, user_id } = req.body;

  try {
    const [result] = await db.query("INSERT INTO recipes SET ?", [
      title,
      description,
      cook_time,
      servings,
      user_id,
    ]);
    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新食譜
router.put("/api/:id", async (req, res) => {
  const { title, description, cook_time, servings, user_id } = req.body;

  try {
    const [result] = await db.query(
      "UPDATE recipes SET title=?, description=?, cook_time=?, servings=?, user_id=?, updated_at=NOW() WHERE id=?",
      [{ title, description, cook_time, servings, user_id }, req.params.id]
    );
    res.json({ success: !!result.affectedRows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 刪除食譜
router.delete("/api/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM recipes WHERE id=?", [req.params.id]);
    res.json({ success: !!result.affectedRows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
