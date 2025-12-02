import express from "express";
import db from "../utils/connect-mysql.js"; // 確認路徑是否正確

const router = express.Router();

// API Endpoint: GET /api/order-items/by-order/:orderId
// (假設你在主程式中把這個 router 掛載在 /api/order-items 路徑下)
// 用來取得特定訂單 (依 order_id) 的所有訂單項目
router.get("/by-order/:orderId", async (req, res) => {
    const { orderId } = req.params;
    console.log(
    `📬 後端 /api/order-items/by-order/${orderId} (GET) 接口被呼叫了！`
    );

    if (!orderId || isNaN(parseInt(orderId))) {
    return res.status(400).json({
        success: false,
        message: "無效的訂單 ID 格式！請提供一個數字 ID。",
    });
    }

    const parsedOrderId = parseInt(orderId);

    try {
    const sql = "SELECT * FROM `order_items` WHERE `order_id` = ?";
    const [rows] = await db.query(sql, [parsedOrderId]);

    if (rows.length === 0) {
      // 雖然技術上這不算錯誤，但可以給前端一個明確的提示
      // 這也可能代表訂單ID不存在，或是該訂單真的沒有商品項目
        console.log(
        `🤷‍♀️ 找不到訂單 ID: ${parsedOrderId} 的任何商品項目，或該訂單不存在。`
        );
        return res.status(404).json({
        success: false,
        message: `找不到訂單 ID: ${parsedOrderId} 的任何商品項目。`,
        items: [], // 回傳空陣列
        });
    }

    console.log(
        `✅ 成功取得訂單 ID: ${parsedOrderId} 的 ${rows.length} 個商品項目。`
    );
    res.json({
        success: true,
        message: `成功取得訂單 ID: ${parsedOrderId} 的商品項目。`,
        items: rows,
    });
    } catch (error) {
    console.error("😭 查詢訂單項目時發生資料庫錯誤:", error);
    res.status(500).json({
        success: false,
        message: "噢喔！查詢訂單項目時發生了一點小問題，請稍後再試一次。",
      error: error.message, // 開發模式下可以回傳詳細錯誤
    });
    }
});

// (可選) API Endpoint: GET /api/order-items/:orderItemId
// 用來取得單一特定訂單項目 (依 order_item_id)
router.get("/:orderItemId", async (req, res) => {
    const { orderItemId } = req.params;
    console.log(`📬 後端 /api/order-items/${orderItemId} (GET) 接口被呼叫了！`);

    if (!orderItemId || isNaN(parseInt(orderItemId))) {
    return res.status(400).json({
        success: false,
        message: "無效的訂單項目 ID 格式！請提供一個數字 ID。",
    });
    }

    const parsedOrderItemId = parseInt(orderItemId);

    try {
    const sql = "SELECT * FROM `order_items` WHERE `order_item_id` = ?";
    const [rows] = await db.query(sql, [parsedOrderItemId]);

    if (rows.length === 0) {
        console.log(`🤷‍♀️ 找不到訂單項目 ID: ${parsedOrderItemId}。`);
        return res.status(404).json({
        success: false,
        message: `找不到訂單項目 ID: ${parsedOrderItemId}。`,
        });
    }

    console.log(`✅ 成功取得訂單項目 ID: ${parsedOrderItemId} 的詳細資料。`);
    res.json({
        success: true,
        message: `成功取得訂單項目 ID: ${parsedOrderItemId} 的詳細資料。`,
      item: rows[0], // 單一項目，取陣列第一個元素
    });
    } catch (error) {
    console.error("😭 查詢特定訂單項目時發生資料庫錯誤:", error);
    res.status(500).json({
        success: false,
        message: "噢喔！查詢特定訂單項目時發生了一點小問題，請稍後再試一次。",
        error: error.message,
    });
    }
});

export default router;
