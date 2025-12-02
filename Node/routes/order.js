import express from "express";
import db from "../utils/connect-mysql.js"; // 連接資料庫

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("📬 後端 /api/orders (來自 order.js 的 POST /) 接口被呼叫了！");
  console.log("收到的請求 body 內容是:", req.body);

  // 從 req.body 把前端送來的資料解構出來
  const { recipientInfo, orderNotes, cartItems, totalAmount, userId } =
    req.body;

  console.log("--- 後端收到的資料型別檢查 ---");
  console.log("recipientInfo:", recipientInfo, "存在嗎?", !!recipientInfo);
  console.log(
    "cartItems:",
    cartItems,
    "存在嗎?",
    !!cartItems,
    "長度是0嗎?",
    cartItems ? cartItems.length === 0 : "N/A"
  );
  console.log(
    "totalAmount:",
    totalAmount,
    "是undefined嗎?",
    totalAmount === undefined
  );
  console.log(
    "userId:",
    userId,
    "是undefined嗎?",
    userId === undefined,
    "是0嗎?",
    userId === 0
  );
  console.log("-----------------------------");

  // **基本的資料驗證**
  if (
    !recipientInfo ||
    !recipientInfo.address || // ✨ 確保 recipientInfo 裡面有 address
    !cartItems ||
    cartItems.length === 0 || // 購物車不能是空的
    totalAmount === undefined || // 總金額可以是0 不能是 undefined
    userId === undefined || // 使用者ID可以是0 不能是 undefined
    userId === 0 // userId 也不能是 0 (代表未登入的 noAuth.id)
  ) {
    console.error("🚫 訂單資料不完整或不正確！ Body:", req.body);
    return res.status(400).json({
      // 400 Bad Request
      success: false,
      message: "訂單資料不完整或不正確！",
    });
  }

  let connection; // ✨ 資料庫連線變數

  try {
    // ✨ 1. 從連線池取得一個連線
    connection = await db.getConnection();
    console.log("🔗 成功取得資料庫連線");

    // ✨ 2. 開始交易
    await connection.beginTransaction();
    console.log("🔄 開始資料庫交易");

    // ✨ 3. 準備寫入 `orders` 表的資料
    const orderData = {
      user_id: userId,
      total_price: totalAmount,
      order_status: "處理中", // 預設訂單狀態
      order_date: new Date(), // 現在時間
      payment_status: "未付款", // 預設付款狀態，例如：UNPAID (未付款)
      shipping_status: "未出貨", // 預設運送狀態，例如：NOT_SHIPPED (未出貨)
      // 假設 recipientInfo 是一個物件，包含 name, phone, address
      // 你可以根據你的 recipientInfo 結構調整，這裡我們直接用 address
      // 也可以考慮存成 JSON 字串：JSON.stringify(recipientInfo)
      shipping_address: recipientInfo.address || JSON.stringify(recipientInfo),
      notes: orderNotes || null, // 如果沒有備註，就存 NULL
      // paid_at: null, // 付款時間，初始為 NULL
    };

    const ordersSql = "INSERT INTO `orders` SET ?";
    console.log("📝 準備寫入主訂單到 `orders` 表:", orderData);
    const [orderResult] = await connection.query(ordersSql, [orderData]);
    // orderResult 會是像這樣：OkPacket { affectedRows: 1, insertId: 73, ... }

    const newOrderId = orderResult.insertId; // ✨ 取得新增訂單的 ID
    if (!newOrderId) {
      throw new Error("建立主訂單失敗，沒有取得訂單ID");
    }
    console.log("✅ 主訂單寫入成功，新的訂單 ID 是:", newOrderId);

    // ✨ 4. 準備寫入 `order_items` 表的資料
    console.log("🛍️ 準備寫入商品項目到 `order_items` 表...");
    const orderItemsSql =
      "INSERT INTO `order_items` (`order_id`, `product_id`, `quantity`, `unit_price`, `subtotal`) VALUES ?";
    // 假設 `order_items` 表有 `order_id`, `product_id`, `quantity`, `price_at_purchase` 這幾個欄位
    // `price_at_purchase` 是為了記錄下單當下的價格，避免商品未來價格變動影響訂單記錄

    // ✨ 2. 修改要插入的資料，計算並加入 subtotal
    const orderItemsData = cartItems.map(item => {
        const itemSubtotal = item.quantity * item.price; // 計算小計
        return [
            newOrderId,
            item.productId || item.id, // 商品 ID
            item.quantity,             // 數量
            item.price,                // 單價 (對應到 unit_price)
            itemSubtotal               // ✨ 小計
        ];
    });

    if (orderItemsData.length > 0) {
      const [itemsResult] = await connection.query(orderItemsSql, [
        orderItemsData
      ]);
      console.log(`✅ ${itemsResult.affectedRows} 個商品項目寫入成功！`);
    } else {
      console.log("🛒 購物車是空的，沒有商品項目需要寫入。");
    }

    // ✨ 5. 如果以上都成功，提交交易
    await connection.commit();
    console.log("🎉 資料庫交易成功提交！");

    res.status(201).json({
      success: true,
      message: "訂單已成功接收並處理！感謝您的訂購！🎉",
      orderId: newOrderId,
    });
  } catch (dbError) {
    console.error("😭 資料庫操作時發生錯誤:", dbError);
    // ✨ 6. 如果發生錯誤，回滾交易
    if (connection) {
      try {
        await connection.rollback();
        console.log("💔 資料庫交易已回滾");
      } catch (rollbackError) {
        console.error("💣 回滾交易時也發生錯誤:", rollbackError);
      }
    }
    res.status(500).json({
      success: false,
      message:
        "噢喔！訂單處理中發生了一點小問題，請稍後再試一次。 (資料庫錯誤)",
      error: dbError.message, // 開發模式下可以回傳詳細錯誤
    });
  } finally {
    // ✨ 7. 無論成功或失敗，最後都要釋放連線
    if (connection) {
      try {
        connection.release();
        console.log("🔌 資料庫連線已釋放");
      } catch (releaseError) {
        console.error("🔗 釋放連線時發生錯誤:", releaseError);
      }
    }
  }
});

export default router;
