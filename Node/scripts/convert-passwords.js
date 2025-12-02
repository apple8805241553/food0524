import dotenv from 'dotenv';
dotenv.config({ path: './dev.env' });

import bcrypt from 'bcrypt';
import mysql from "mysql2/promise";

// 直接創建數據庫連接
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
});


const convertPasswords = async () => {
    console.log("DB_USER:", process.env.DB_USER);       // 確認能顯示 root
    console.log("DB_PASS:", process.env.DB_PASS);   // 確認能顯示 Passw0rd!

    try {
        const [rows] = await db.query("SELECT user_id, password, password_hash FROM users");

        for (let user of rows) {
            const { user_id, password, password_hash } = user;

            // 若已存在 v2 欄位，跳過
            if (typeof password_hash === 'string' && password_hash.startsWith("$2b$")) {
                console.log(`✔️ 使用者 ${user_id} 已轉換，略過`);
                continue;
            }

            // 用原本的明碼進行加密
            const newHash = await bcrypt.hash(password, 10);

            // 寫入新的欄位
            await db.query(
                "UPDATE users SET password_hash = ? WHERE user_id = ?",
                [newHash, user_id]
            );
            console.log(`🔐 使用者 ${user_id} 密碼加密完成`);
        }

        console.log("✅ 所有密碼已轉換到 password_hash");
        process.exit(0);
    } catch (err) {
        console.error("❌ 發生錯誤：", err);
        process.exit(1);
    }
};

convertPasswords();
