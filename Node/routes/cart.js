import express from "express";
import db from "../utils/connect-mysql.js"; // 連接資料庫
import fs from "node:fs/promises";
import { z } from "zod";
import moment from "moment-timezone";
import upload from "../utils/upload-imgs.js";

const router = express.Router();



// 下面這個get/api， 在目前購物車當中好像沒有用到(我不太確定)
// 因為購物車查詢的都是某個會員的車。應該不太會有需要查所有會員的所有購物車內容的情況

// --- Helper Function (示意): 取得商品詳細資訊 ---
// 這個函式在 POST /api/:userId/items 裡面有用到，所以要定義它
async function getProductDetails(productId) {
  // 這裡的 SQL 查詢可以根據你的需求調整，例如是否需要檢查庫存等
  const [productRows] = await db.query(
    "SELECT p.id, p.name, p.price, p.image_url FROM food_products p WHERE p.id = ?",
    [productId]
  );
  return productRows.length > 0 ? productRows[0] : null;
}

// --- 購物車 API 路由 ---

// ------------------------------------------------------------------------------------
// GET - 讀取指定使用者的購物車內容
// API 路徑: /cart/api/:userId (假設你在主 app.js 會用 app.use('/cart', cartRoutes))
// ------------------------------------------------------------------------------------
router.get('/api/:userId', async (req, res) => {
    try {
      const userIdString = req.params.userId;
      const userId = parseInt(userIdString, 10);

      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({
          success: false,
          message: '使用者 ID 請給個正常的正整數啦～ 🙏 (小提示：數字喔！)',
        });
      }

      const [cartProductRows] = await db.query(
        `SELECT
          c.cart_id AS cart_item_id,   -- 購物車項目本身的 ID (假設 carts 表主鍵是 id)
          c.is_selected,
          u.user_id,
          p.id AS product_id,
          p.name AS product_name,
          p.price AS product_price,
          p.image_url AS product_image_url, -- 假設 food_products 表有 image_url
          c.quantity
        FROM carts c
        JOIN users u ON c.user_id = u.user_id
        JOIN food_products p ON c.product_id = p.id
        WHERE u.user_id = ?
        ORDER BY c.updated_at DESC;`, // 假設 carts 表有 updated_at 用來排序
        [userId]
      );

      if (!cartProductRows.length) {
        return res.json([]); // 購物車是空的，回傳空陣列，前端好處理！
      }

      const cartItems = cartProductRows.map(item => ({
        cartItemId: item.cart_item_id,
        productId: item.product_id,
        name: item.product_name,
        price: parseFloat(item.product_price) || 0, // 轉成數字，並給預設值
        isSelected: item.is_selected,
        imageUrl: item.product_image_url || '/images/default_product.png', // 預設圖片
        quantity: item.quantity,
      }));
      res.json(cartItems); // 回傳購物車商品陣列

    } catch (error) {
      console.error(`🔴 撈取使用者 ${req.params.userId} 購物車資料時發生錯誤：`, error);
      res.status(500).json({
        success: false,
        error: '糟糕！我們的購物車系統好像睡著了，叫不醒～😴',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

// ------------------------------------------------------------------------------------
// GET - API 基本路徑提醒 (如果使用者直接訪問 /cart/api)
// API 路徑: /cart/api
// ------------------------------------------------------------------------------------
router.get('/api', async (req, res) => {
  console.log("ℹ️ 有人直接訪問了 /cart/api (沒有指定 userId)，給予提示。");
  res.status(400).json({
    success: false,
    message: '哈囉～這裡是購物車 API 的家🏠！想看購物車請在網址後面加上 /你的使用者ID 喔！',
    exampleToGetCart: '/cart/api/123 (把123換成真正的使用者ID)',
    exampleToAddItem: 'POST /cart/api/123/items (並在 request body 提供 productId 和 quantity)',
  });
});

// ------------------------------------------------------------------------------------
// POST - 新增商品到指定使用者的購物車
// API 路徑: /cart/api/:userId/items
// 05/20 這個API的路徑我改一下名稱，把/:userID先拿掉
// ------------------------------------------------------------------------------------
router.post('/api/items', async (req, res) => {
    try {
      // const userIdString = req.params.userId;
      // const userId = parseInt(userIdString, 10);

       // 驗證是否已通過 JWT 驗證
    if (!req.my_jwt) {
        return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid token" });
    }

    const uId = req.my_jwt.user_id; // 從解碼的 token 中取得 userId
    const userId = parseInt(uId, 10);

      // ✨✨✨ 把 quantity 重新命名成 quantityToAdd 更清楚 ✨✨✨
      const { productId, quantityToAdd } = req.body; // ... (productId 驗證) ...
      const validProductId = parseInt(productId, 10);

      // --- 基本輸入驗證 ---
      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({ success: false, message: '使用者 ID 請給個正常的正整數啦～ 🙏' });
      }
      if (!productId || isNaN(parseInt(productId, 10)) || parseInt(productId, 10) <= 0) {
        return res.status(400).json({ success: false, message: '商品 ID (productId) 要給喔，而且要是正整數！😉' });
      }

      // ✨✨✨ 這裡用 quantityToAdd 做判斷 ✨✨✨
      const validQuantityToAddParsed = parseInt(quantityToAdd, 10);
      if (!quantityToAdd || isNaN(validQuantityToAddParsed) || validQuantityToAddParsed <= 0) {
        return res.status(400).json({ success: false, message: '數量 (quantity) 至少要1個啦，不然是要買幽靈商品喔～👻' });
      }
      

      // --- 檢查商品是否存在 (使用 helper function) ---
      const product = await getProductDetails(validProductId);
      if (!product) {
        return res.status(404).json({ success: false, message: `商品編號 ${validProductId} 好像在宇宙中迷路了，找不到捏～🚀` });
      }

      // --- 檢查購物車是否已存在此商品，若有則更新數量，若無則新增 ---
      const [existingItemRows] = await db.query(
        "SELECT cart_id, quantity FROM carts WHERE user_id = ? AND product_id = ?",
        [userId, validProductId]
      );

      let cartItemIdToReturn; // 用來記錄最終操作的是哪個 cart_item_id
      let successMessage;
      let finalQuantity; // 最終的數量
      let httpStatusCode = 200; // 預設是更新成功

      if (existingItemRows.length > 0) {
        // 商品已在購物車中，更新其數量 (疊加)
        const existingItem = existingItemRows[0];
        finalQuantity = existingItem.quantity + validQuantityToAddParsed; // 數量累加！
        // const newQuantity = existingItem.quantity + validQuantity;
        cartItemIdToReturn = existingItem.cart_id; // 使用已存在的 cart_id

        console.log(`[POST UPDATE] 商品已存在 (cart_id: ${cartItemIdToReturn})。舊數量: ${existingItem.quantity}, 要加: ${validQuantityToAddParsed}, 新數量: ${finalQuantity}`);

        const [updateResult] = await db.query(
          // ✨✨✨ added_time 改成 updated_at 或你實際的更新時間欄位 ✨✨✨
          "UPDATE carts SET quantity = ?, updated_at = NOW() WHERE cart_id = ?", // 假設 carts 表有 expiration_time
          [finalQuantity, cartItemIdToReturn]
        );

        console.log('[POST UPDATE] UPDATE 結果:', updateResult);

        successMessage = `太棒了！購物車裡的【${product.name}】數量已更新為 ${finalQuantity} 個！🛒💨 買買買！`;
        console.log(`ℹ️ 使用者 ${userId}: 更新購物車商品 ${validProductId} (cart_id: ${cartItemIdToReturn})數量更新為 -> ${finalQuantity}`);
        httpStatusCode = 200;

      } else {
        // ----- 商品不在購物車中，執行 INSERT -----
        finalQuantity = validQuantityToAddParsed; // 第一次加入，數量就是這次要加的

        console.log(`[POST INSERT] 商品不存在，準備新增。數量: ${finalQuantity}`);

        // 商品不在購物車中，新增一筆新的項目
        const [insertResult] = await db.query(
          "INSERT INTO carts (user_id, product_id, quantity, unit_price, is_selected) VALUES (?, ?, ?, ?, ?)",
          [userId, validProductId, finalQuantity, product.price, true] // product.price 對應 unit_price
        );
        cartItemIdToReturn = insertResult.insertId;
        successMessage = `灑花！購物車裡的【${product.name}】數量已增加到 ${finalQuantity} 個！🛒💨 繼續買！`;
        console.log(`ℹ️ 使用者 ${userId}: 新增商品 ${validProductId} (cart_id: ${cartItemIdToReturn}) 數量更新為 ${finalQuantity}`);
        httpStatusCode = 201;
      }

      // 實際應用中，這裡可能還需要處理庫存扣減等邏輯

      res.status(httpStatusCode).json({ success: true, message: successMessage, cartItem: { // 把更新後或新增的項目完整資訊回傳
        cartItemId: cartItemIdToReturn,
        productId: validProductId,
        name: product.name,
        price: parseFloat(product.price) || 0,
        imageUrl: product.image_url || '/images/default_product.png',
        quantity: finalQuantity,
        isSelected: true // 新增或更新後，預設該項目是勾選的 (方便前端直接用)
      }
    });

    } catch (error) {
      console.error(`🔴 新增商品到購物車 (使用者 ${req.params.userId}) 時發生錯誤：`, error);
      res.status(500).json({
        success: false,
        error: '哎呀！我們的購物車加載系統好像卡住了，商品放不進去～😫',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

// ------------------------------------------------------------------------------------
// PUT - 更新購物車中特定商品的數量
// API 路徑: /cart/api/items/:cartItemId
// ------------------------------------------------------------------------------------
router.put('/api/items/:cartItemId', async (req, res) => {
    try {
      const cartItemIdString = req.params.cartItemId;
      const cartItemId = parseInt(cartItemIdString, 10);
      const { quantity } = req.body; // 從 request body 獲取新的 quantity
    

      // --- 基本輸入驗證 ---
      if (isNaN(cartItemId) || cartItemId <= 0) {
        return res.status(400).json({ success: false, message: '購物車項目 ID (cartItemId) 請給個正常的正整數啦～1 🙏' });
      }
      if (!quantity || isNaN(parseInt(quantity, 10)) || parseInt(quantity, 10) <= 0) {
        // 如果允許數量為0來刪除項目，這裡邏輯要調整，但通常建議用 DELETE API
        return res.status(400).json({ success: false, message: '新的數量 (quantity) 至少要1個啦，不然是要讓它憑空消失嗎～👻' });
      }
      const newQuantity = parseInt(quantity, 10);

      // --- 檢查購物車項目是否存在，並取得商品名稱方便回傳訊息 ---
      const [cartItemRows] = await db.query(
        "SELECT c.cart_id, p.name AS product_name FROM carts c JOIN food_products p ON c.product_id = p.id WHERE c.cart_id = ?",
        [cartItemId]
      );
      if (cartItemRows.length === 0) {
        return res.status(404).json({ success: false, message: `購物車項目 ${cartItemId} 好像去火星旅遊了，找不到它～🚀` });
      }
      const cartItem = cartItemRows[0];

      // --- 更新購物車項目的數量 ---
      const [result] = await db.query(
        "UPDATE carts SET quantity = ?, updated_at = NOW() WHERE cart_id = ?",
        [newQuantity, cartItemId]
      );

      if (result.affectedRows === 0) {
        // 理論上前面已檢查過 item 存在，此處應不會發生，但多一層防護總是好的
        return res.status(404).json({ success: false, message: `購物車項目 ${cartItemId} 更新失敗，是不是在你眨眼的時候它不見了？🤔` });
      }

      console.log(`ℹ️ 購物車項目 ${cartItemId} (${cartItem.product_name}) 數量已更新為 ${newQuantity}`);
      res.json({ success: true, message: `叮咚！購物車裡的【${cartItem.product_name}】數量已更新為 ${newQuantity} 個！✨ 太神啦！` });

    } catch (error) {
      console.error(`🔴 更新購物車項目 ${req.params.cartItemId} 時發生錯誤：`, error);
      res.status(500).json({
        success: false,
        error: '糟糕！購物車的數量調整器好像秀逗了～🧙‍♂️',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

// ------------------------------------------------------------------------------------
// DELETE - 從購物車移除特定商品
// API 路徑: /cart/api/items/:cartItemId
// ------------------------------------------------------------------------------------
router.delete('/api/items/:cartItemId', async (req, res) => {
    try {
      const cartItemIdString = req.params.cartItemId;
      const cartItemId = parseInt(cartItemIdString, 10);

      console.log(`[後端 DELETE] 收到刪除請求，準備刪除購物車項目 ID: ${cartItemId} (原始 params: ${cartItemIdString})`);

      // --- 基本輸入驗證 ---
      if (isNaN(cartItemId) || cartItemId <= 0) {
        console.warn(`[後端 DELETE] 無效的 cartItemId: ${cartItemIdString}`);
        return res.status(400).json({ success: false, message: '購物車項目 ID (cartItemId) 請給個正常的正整數啦～2 🙏' });
      }

      // 執行刪除操作
      const [result] = await db.query(
        "DELETE FROM carts WHERE cart_id=? ", 
        [cartItemId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: `購物車項目 ${cartItemId} 本來就不在購物車裡呀，是要刪除心酸的嗎？🤷‍♀️ (可能已經被刪掉了喔)` });
      }

      console.log(`ℹ️ 購物車項目 ${cartItemId} 已被成功移除。`);
      res.json({ success: true, message: `購物車項目 ${cartItemId} 已被丟到黑洞裡，掰掰～👋` });

    } catch (error) {
      console.error(`🔴 刪除購物車項目 ${req.params.cartItemId} 時發生錯誤：`, error);
      res.status(500).json({
        success: false,
        error: '糟糕！購物車的「斷捨離」小幫手今天請假了～🧹',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

// ------------------------------------------------------------------------------------
// DELETE - 清空指定使用者的整個購物車 (可選功能)
// API 路徑: /cart/api/:userId/clear
// ------------------------------------------------------------------------------------
router.delete('/api/:userId/clear', async (req, res) => {
    try {
        const userIdString = req.params.userId;
        const userId = parseInt(userIdString, 10);

        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({ success: false, message: '使用者 ID 請給個正常的正整數啦～ 🙏' });
        }

        // 執行清空購物車操作
        const [result] = await db.query(
            "DELETE FROM carts WHERE user_id = ?",
            [userId]
        );

        if (result.affectedRows === 0) {
            console.log(`ℹ️ 使用者 ${userId} 的購物車本來就是空的，無須清空。`);
            return res.json({ success: true, message: `使用者 ${userId} 的購物車本來就比我的臉還乾淨！✨`, itemsCleared: 0 });
        }

        console.log(`ℹ️ 使用者 ${userId} 的購物車已被一鍵淨空！ ${result.affectedRows} 個項目被移除。`);
        res.json({ success: true, message: `使用者 ${userId} 的購物車已成功清空！你的錢包君給你一個讚～👍`, itemsCleared: result.affectedRows });

    } catch (error) {
        console.error(`🔴 清空使用者 ${req.params.userId} 購物車時發生錯誤：`, error);
        res.status(500).json({
            success: false,
            error: '糟糕！購物車的「一鍵清空」按鈕好像被小怪獸吃掉了～👾',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ------------------------------------------------------------------------------------
// PUT - 更新購物車項目的勾選狀態
// API 路徑: /cart/api/items/:cartItemId/select
// ------------------------------------------------------------------------------------
router.put('/api/items/:cartItemId/select', async (req, res) => {
    try {
        const cartItemId = parseInt(req.params.cartItemId, 10);
        const { isSelected } = req.body;

        // 驗證輸入
        if (isNaN(cartItemId) || cartItemId <= 0) {
            return res.status(400).json({
                success: false,
                message: '購物車項目 ID 必須是正整數'
            });
        }

        if (typeof isSelected !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isSelected 必須是布林值'
            });
        }

        // 更新資料庫中的勾選狀態
        const [result] = await db.query(
            "UPDATE carts SET is_selected = ?, updated_at = NOW() WHERE cart_id = ?",
            [isSelected, cartItemId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到指定的購物車項目'
            });
        }

        res.json({
            success: true,
            message: `購物車項目 ${cartItemId} 的勾選狀態已更新`,
            isSelected: isSelected
        });

    } catch (error) {
        console.error('更新購物車項目勾選狀態時發生錯誤:', error);
        res.status(500).json({
            success: false,
            message: '更新勾選狀態時發生錯誤',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ------------------------------------------------------------------------------------
// PUT - 更新使用者購物車所有項目的勾選狀態
// API 路徑: /cart/api/items/select-all
// ------------------------------------------------------------------------------------
router.post('/api/items/select-all', async (req, res) => {
  // ✨✨✨ 在這裡加上偵錯的 console.log ✨✨✨
  console.log('--- 後端 DEBUG START: /api/items/select-all ---');
  console.log('時間:', new Date().toISOString());
  console.log('請求的 req.body:', req.body);
  console.log('請求的 req.params:', req.params); // 這個路由雖然設計上沒有路徑參數，但印出來看看無妨
  console.log('請求的 req.my_jwt (如果有用JWT的話):', req.my_jwt);
  // ✨✨✨ 偵錯 console.log 結束 ✨✨✨
    try {
        // 從 JWT 取得使用者 ID
        if (!req.my_jwt) {
            return res.status(401).json({
                success: false,
                message: '未授權的訪問'
            });
        }
        const userId = req.my_jwt.user_id;
        const { isSelected } = req.body;

        // 驗證輸入
        if (typeof isSelected !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isSelected 必須是布林值'
            });
        }

        // 更新該使用者購物車中所有項目的勾選狀態
        const [result] = await db.query(
            "UPDATE carts SET is_selected = ?, updated_at = NOW() WHERE user_id = ?",
            [isSelected, userId]
        );

        res.json({
            success: true,
            message: `已${isSelected ? '全選' : '取消全選'}購物車項目`,
            affectedItems: result.affectedRows
        });

    } catch (error) {
        console.error('更新購物車全選狀態時發生錯誤:', error);
        res.status(500).json({
            success: false,
            message: '更新全選狀態時發生錯誤',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
        console.error('--- 後端 DEBUG ERROR in /select-all ---:', error);
    }
    console.log('--- 後端 DEBUG END: /api/items/select-all ---');
});

export default router;